"""Estimate per-muscle activation for one captured rep with OpenSim static optimisation.

    python run_static_optimization.py <motion.json> <out_dir> [--model vendor/RajagopalLaiUhlrich2023.osim]

Input is the app's motion clip (world-space sagittal angles, see
src/lib/kinematics/types.ts). Steps:

1. Map the four angles onto the model's coordinates. Signs are calibrated from
   the model geometry, not assumed: each coordinate is nudged and the resulting
   landmark motion checked against the anatomical meaning we need.
2. Plant the feet: the pelvis is translated per frame so the ankle stays put.
3. Ground reaction from the model's own centre-of-mass acceleration
   (F = m (a - g)), split equally, applied at the midfoot of each calcaneus.
   No force plate was involved; this is the standard unloaded-squat
   approximation and the output is labelled "estimated" accordingly.
4. StaticOptimization with reserve actuators on every coordinate (optimal force
   1 N or N m, so the solver only leans on them when muscles cannot balance the
   moment). Peak reserve usage is printed: large values mean poor estimates.
5. Muscle activations averaged over sub-parts and both sides, mapped to the app's
   muscle ids, resampled, written to <out_dir>/squat-activation.json.

Runs on linux-64 (GitHub Actions); there is no OpenSim build for the ARM64
laptop this repo is developed on.
"""

import json
import math
import os
import sys

import numpy as np
import opensim as osim

argv = sys.argv[1:]
# Absolute paths throughout: OpenSim resolves files named in a setup XML relative
# to that XML's own directory, which silently doubles a relative out dir.
MOTION, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
MODEL = os.path.abspath(argv[argv.index("--model") + 1] if "--model" in argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), "vendor", "RajagopalLaiUhlrich2023.osim"))
os.makedirs(OUT, exist_ok=True)
N_OUT = 16  # curve points per muscle in the shipped JSON

# App muscle id -> model muscle name stems (both sides are averaged).
MUSCLES = {
    "rectus-femoris": ["recfem"],
    "vastus-lateralis": ["vaslat"],
    "vastus-medialis": ["vasmed"],
    "vastus-intermedius": ["vasint"],
    "gluteus-maximus": ["glmax1", "glmax2", "glmax3"],
    "gluteus-medius": ["glmed1", "glmed2", "glmed3"],
    "gluteus-minimus": ["glmin1", "glmin2", "glmin3"],
    "biceps-femoris": ["bflh", "bfsh"],
    "semitendinosus": ["semiten"],
    "semimembranosus": ["semimem"],
    "adductor-magnus": ["addmagDist", "addmagIsch", "addmagMid", "addmagProx"],
    "adductor-longus": ["addlong"],
    "adductor-brevis": ["addbrev"],
    "soleus": ["soleus"],
    "gastrocnemius-medial": ["gasmed"],
    "gastrocnemius-lateral": ["gaslat"],
    "tibialis-anterior": ["tibant"],
}

clip = json.load(open(MOTION))
samples = clip["samples"]
n = len(samples)
rep = clip.get("rep")
duration = (rep["end"] - rep["start"]) / clip["fps"] if rep else 1.5
times = np.arange(n) * duration / n
print("motion %s: %d samples over %.3f s (%s)" % (clip["source"], n, duration, clip.get("credit", "no credit")))

model = osim.Model(MODEL)
state = model.initSystem()
coords = model.updCoordinateSet()
coord_names = [coords.get(i).getName() for i in range(coords.getSize())]
mass = model.getTotalMass(state)
print("model %s: %d coordinates, %d muscles, %.1f kg" % (os.path.basename(MODEL), len(coord_names), model.getMuscles().getSize(), mass))


def set_coords(values):
    for i in range(coords.getSize()):
        c = coords.get(i)
        c.setValue(state, float(values.get(c.getName(), 0.0)), False)
    model.assemble(state)
    model.realizePosition(state)


def station(body, xyz):
    return np.array(model.getBodySet().get(body).findStationLocationInGround(state, osim.Vec3(*xyz)).to_numpy())


# ---------- 1. sign calibration ----------
# (coordinate, landmark body, landmark point in that body, axis, expected sign of motion for a POSITIVE coordinate
#  to mean what we need). Rajagopal: X forward, Y up.
CAL = {
    "pelvis_tilt": ("torso", (0, 0.4, 0), 0, +1),  # + must tip the trunk forward
    "hip_flexion_r": ("femur_r", (0, -0.4, 0), 0, +1),  # + must bring the knee forward
    "knee_angle_r": ("tibia_r", (0, -0.4, 0), 0, -1),  # + must bring the ankle backward (flexion)
    "ankle_angle_r": ("toes_r", (0, 0, 0), 1, +1),  # + must lift the toes (dorsiflexion)
    "arm_flex_r": ("humerus_r", (0, -0.3, 0), 0, +1),  # + must bring the elbow forward
}
sign = {}
base = {"pelvis_ty": 0.0}
set_coords(base)
for cname, (body, pt, axis, want) in CAL.items():
    p0 = station(body, pt)
    set_coords({**base, cname: 0.3})
    p1 = station(body, pt)
    got = 1 if (p1 - p0)[axis] > 0 else -1
    sign[cname] = 1 if got == want else -1
    print("calibrate %-14s: +0.3 rad moves %s %s by %+.3f -> sign %+d" % (cname, body, "xyz"[axis], (p1 - p0)[axis], sign[cname]))
    set_coords(base)
for c in ("hip_flexion_l", "knee_angle_l", "ankle_angle_l", "arm_flex_l"):
    sign[c] = sign[c.replace("_l", "_r")]

# ---------- 2. coordinates per frame, feet planted ----------
# Ankle height above ground in the model's own standing pose.
set_coords({"pelvis_ty": coords.get("pelvis_ty").getDefaultValue()})
ankle_std = station("talus_r", (0, 0, 0))
print("standing ankle height %.3f m at default pelvis_ty %.3f" % (ankle_std[1], coords.get("pelvis_ty").getDefaultValue()))

rows = []
for s in samples:
    trunk, thigh, shin, arm = s["trunk"], s["thigh"], s["shin"], s["armFwd"]
    hip_flex = trunk - thigh
    knee_flex = shin - thigh
    arm_flex = min(max(arm + trunk, -math.pi / 2), math.pi / 2)  # model range is +-90 degrees
    v = {
        "pelvis_tilt": sign["pelvis_tilt"] * trunk,
        "hip_flexion_r": sign["hip_flexion_r"] * hip_flex,
        "hip_flexion_l": sign["hip_flexion_l"] * hip_flex,
        "knee_angle_r": sign["knee_angle_r"] * knee_flex,
        "knee_angle_l": sign["knee_angle_l"] * knee_flex,
        "ankle_angle_r": sign["ankle_angle_r"] * shin,
        "ankle_angle_l": sign["ankle_angle_l"] * shin,
        "arm_flex_r": sign["arm_flex_r"] * arm_flex,
        "arm_flex_l": sign["arm_flex_l"] * arm_flex,
        "pelvis_ty": 0.0,
        "pelvis_tx": 0.0,
    }
    set_coords(v)
    ankle = station("talus_r", (0, 0, 0))
    v["pelvis_tx"] = -ankle[0]
    v["pelvis_ty"] = ankle_std[1] - ankle[1]
    rows.append(v)

for c in ("hip_flexion_r", "knee_angle_r", "ankle_angle_r", "pelvis_tilt"):
    lo, hi = coords.get(c).getRangeMin(), coords.get(c).getRangeMax()
    mx = max(r[c] for r in rows)
    mn = min(r[c] for r in rows)
    flag = "" if lo <= mn and mx <= hi else "  <-- OUTSIDE MODEL RANGE"
    print("%-14s %6.1f .. %6.1f deg (model %6.1f .. %6.1f)%s" % (c, math.degrees(mn), math.degrees(mx), math.degrees(lo), math.degrees(hi), flag))

# ---------- 3. ground reaction from centre-of-mass acceleration ----------
com = []
for v in rows:
    set_coords(v)
    com.append(np.array(model.calcMassCenterPosition(state).to_numpy()))
com = np.array(com)
k = np.ones(5) / 5
com_s = np.column_stack([np.convolve(np.pad(com[:, i], 2, mode="edge"), k, mode="valid") for i in range(3)])
vel = np.gradient(com_s, times, axis=0)
acc = np.gradient(vel, times, axis=0)
g = np.array([0, -9.81, 0])
F = mass * (acc - g)  # total ground reaction
print("ground reaction: vertical %.0f..%.0f N (body weight %.0f N), fore-aft %+.0f..%+.0f N" % (F[:, 1].min(), F[:, 1].max(), mass * 9.81, F[:, 0].min(), F[:, 0].max()))

midfoot = (0.09, -0.01, 0.0)  # in the calcaneus frame: half way to the metatarsophalangeal joint
grf_path = os.path.join(OUT, "grf.sto")
cols = []
for side in ("r", "l"):
    cols += ["%s_ground_force_v%s" % (side, a) for a in "xyz"] + ["%s_ground_force_p%s" % (side, a) for a in "xyz"] + ["%s_ground_torque_%s" % (side, a) for a in "xyz"]
with open(grf_path, "w") as fh:
    fh.write("grf\nversion=1\nnRows=%d\nnColumns=%d\ninDegrees=no\nendheader\n" % (n, 1 + len(cols)))
    fh.write("time\t" + "\t".join(cols) + "\n")
    for i in range(n):
        half = F[i] / 2
        vals = []
        for side in ("r", "l"):
            vals += list(half) + list(midfoot) + [0, 0, 0]
        fh.write("%.6f\t" % times[i] + "\t".join("%.6f" % x for x in vals) + "\n")

ext_path = os.path.join(OUT, "external_loads.xml")
with open(ext_path, "w") as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8" ?>\n<OpenSimDocument Version="40000">\n <ExternalLoads name="squat">\n  <objects>\n')
    for side in ("r", "l"):
        fh.write(
            "   <ExternalForce name=\"grf_%s\">\n    <applied_to_body>calcn_%s</applied_to_body>\n    <force_expressed_in_body>ground</force_expressed_in_body>\n"
            "    <point_expressed_in_body>calcn_%s</point_expressed_in_body>\n    <force_identifier>%s_ground_force_v</force_identifier>\n"
            "    <point_identifier>%s_ground_force_p</point_identifier>\n    <torque_identifier>%s_ground_torque_</torque_identifier>\n   </ExternalForce>\n" % (side, side, side, side, side, side)
        )
    fh.write("  </objects>\n  <groups />\n  <datafile>%s</datafile>\n </ExternalLoads>\n</OpenSimDocument>\n" % os.path.basename(grf_path))

# ---------- kinematics file ----------
mot_path = os.path.join(OUT, "squat.mot")
with open(mot_path, "w") as fh:
    fh.write("squat\nversion=1\nnRows=%d\nnColumns=%d\ninDegrees=yes\nendheader\n" % (n, 1 + len(coord_names)))
    fh.write("time\t" + "\t".join(coord_names) + "\n")
    for i, v in enumerate(rows):
        vals = []
        for cn in coord_names:
            c = coords.get(cn)
            x = v.get(cn, 0.0)
            vals.append(x if c.getMotionType() == osim.Coordinate.Translational else math.degrees(x))
        fh.write("%.6f\t" % times[i] + "\t".join("%.6f" % x for x in vals) + "\n")

# ---------- 4. reserve actuators + static optimisation ----------
already = {model.getForceSet().get(i).getName() for i in range(model.getForceSet().getSize())}
reserves = osim.ForceSet()
for cn in coord_names:
    if cn.endswith("_beta"):
        continue
    a = osim.CoordinateActuator(cn)
    a.setName(cn + "_reserve")
    a.setOptimalForce(1.0)
    a.setMinControl(-float("inf"))
    a.setMaxControl(float("inf"))
    reserves.cloneAndAppend(a)
reserves_path = os.path.join(OUT, "reserves.xml")
reserves.printToXML(reserves_path)

analyze = osim.AnalyzeTool()
analyze.setName("squat")
analyze.setModelFilename(MODEL)
analyze.setReplaceForceSet(False)
fs = osim.ArrayStr()
fs.append(reserves_path)
analyze.setForceSetFiles(fs)
analyze.setResultsDir(OUT)
analyze.setInitialTime(float(times[0]))
analyze.setFinalTime(float(times[-1]))
analyze.setSolveForEquilibrium(False)
analyze.setCoordinatesFileName(mot_path)
analyze.setLowpassCutoffFrequency(6.0)
analyze.setExternalLoadsFileName(ext_path)
so = osim.StaticOptimization()
so.setUseModelForceSet(True)
so.setActivationExponent(2)
so.setUseMusclePhysiology(True)
so.setStartTime(float(times[0]))
so.setEndTime(float(times[-1]))
analyze.updAnalysisSet().cloneAndAppend(so)
setup_path = os.path.join(OUT, "setup_static_optimization.xml")
analyze.printToXML(setup_path)
print("running static optimisation ...")
ok = osim.AnalyzeTool(setup_path).run()
print("static optimisation", "finished" if ok else "FAILED")

# ---------- 5. read, map, resample ----------
act_path = os.path.join(OUT, "squat_StaticOptimization_activation.sto")
table = osim.TimeSeriesTable(act_path)
labels = list(table.getColumnLabels())
t_act = np.array(table.getIndependentColumn())
col = lambda name: np.array(table.getDependentColumn(name).to_numpy())

force_table = osim.TimeSeriesTable(os.path.join(OUT, "squat_StaticOptimization_force.sto"))
worst = sorted(((float(np.abs(np.array(force_table.getDependentColumn(l).to_numpy())).max()), l) for l in force_table.getColumnLabels() if l.endswith("_reserve")), reverse=True)[:6]
print("largest reserve actuator peaks (N or N m):", ", ".join("%s %.1f" % (l, v) for v, l in worst))

t_norm = (t_act - t_act[0]) / (t_act[-1] - t_act[0])
t_out = np.linspace(0, 1, N_OUT)
result = {}
for mid, stems in MUSCLES.items():
    parts = [l for l in labels if any(l == "%s_%s" % (stem, side) for stem in stems for side in ("r", "l"))]
    if not parts:
        print("WARNING: no model muscles for", mid)
        continue
    a = np.mean([col(p) for p in parts], axis=0)
    curve = np.interp(t_out, t_norm, a)
    result[mid] = {"curve": [[round(float(t), 4), round(float(v), 4)] for t, v in zip(t_out, curve)], "peak": round(float(a.max()), 4), "parts": parts}
    print("  %-22s peak %.2f  parts %s" % (mid, a.max(), " ".join(parts)))

json.dump(
    {
        "method": "OpenSim %s StaticOptimization (activation exponent 2, muscle physiology on, 6 Hz lowpass)" % osim.__version__,
        "model": "RajagopalLaiUhlrich2023.osim from opensim-org/opensim-models (Rajagopal 2016; Lai 2017; Uhlrich 2022), MIT licence",
        "motion": "%s (%s)" % (clip["source"], clip.get("credit", "")),
        "conditions": "Generic unscaled model, %.0f kg. Ground reaction derived from the model centre-of-mass acceleration (no force plate), split equally between feet and applied at the midfoot. Torso rigid to the pelvis, arms clamped to the model range. Reserve actuators at 1 N m; peaks: %s." % (mass, "; ".join("%s %.1f" % (l, v) for v, l in worst[:3])),
        "measure": "estimated-activation",
        "durationS": round(float(duration), 3),
        "muscles": result,
    },
    open(os.path.join(OUT, "squat-activation.json"), "w"),
    indent=1,
)
print("wrote", os.path.join(OUT, "squat-activation.json"))
