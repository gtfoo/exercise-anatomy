"""Estimate whole-body muscle activation for one cycle with MyoFullBody (MuJoCo).

    tools/myo/.venv/bin/python tools/myo/estimate.py <motion3d.json> <out.json> \
        --anchor feet|hands|free [--bar 2.3] [--duration 3.2] [--stage ik|id|so]

Stages, each checked before the next runs:

1. ik  — the figure's posed joints (rigfk.py, same maths as the viewer) become
         MyoFullBody joint coordinates: per frame, least squares over the
         free trunk, hip, knee, ankle, shoulder, elbow and pronation
         coordinates so the model's segment directions match the figure's,
         the root taken straight from the figure's pelvis. Coupled joints
         (knee translations, patella) follow the model's own equalities.
2. id  — inverse dynamics on the cyclic trajectory; the net wrench the root
         would need is applied instead at the anchor bodies (feet on the floor
         under the centre of mass, or wrists on the bar), as the ground or
         bar reaction. Residual root wrench is printed: the honesty check.
3. so  — per frame, bounded least squares over the 416 activations so the
         muscles reproduce the joint torques; reserves are the residual and
         are printed per joint. Averaged over sub-parts and sides, mapped to
         the atlas ids, resampled, written like tools/opensim's output.
"""

import json
import math
import os
import sys
from fnmatch import fnmatch

import mujoco
import numpy as np
from scipy.optimize import least_squares, lsq_linear

from rigfk import ORDER, RigFK, load_rig

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "vendor", "musclemimic_models", "musclemimic_models", "model", "body", "myofullbody.xml")

argv = sys.argv[1:]
MOTION, OUT = argv[0], argv[1]
opt = lambda flag, default: argv[argv.index(flag) + 1] if flag in argv else default
ANCHOR = opt("--anchor", "feet")
BAR = float(opt("--bar", "2.3"))
DURATION = float(opt("--duration", "0")) or None
STAGE = opt("--stage", "so")

clip = json.load(open(MOTION))
samples = clip["samples"]
n = len(samples)
duration = DURATION or clip["cycle"]["seconds"]
dt = duration / n
print("clip %s: %d samples, cycle %.2f s, analysed at %.2f s, anchor %s" % (clip["source"], n, clip["cycle"]["seconds"], duration, ANCHOR))

m = mujoco.MjModel.from_xml_path(MODEL)
d = mujoco.MjData(m)
jid = lambda name: mujoco.mj_name2id(m, mujoco.mjtObj.mjOBJ_JOINT, name)
bid = lambda name: mujoco.mj_name2id(m, mujoco.mjtObj.mjOBJ_BODY, name)
qadr = lambda name: int(m.jnt_qposadr[jid(name)])
mass = float(sum(m.body_mass))
print("MyoFullBody: %.1f kg, %d muscles" % (mass, m.nu))

# App frame (figure faces +z, its left is +x, y up) -> MuJoCo (faces -Y, left
# +X, Z up), which is where the model stands in its default pose. Checked at
# start-up against the default pose's foot direction and hip order.
A2M = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], dtype=float)


def to_m(v):
    return A2M @ np.asarray(v, dtype=float)


# ---------- rig side ----------
rig = load_rig()
fk = RigFK(rig)

# Figure segments (joint pairs) matched by direction to model landmarks, each
# ("joint", name) = that joint's anchor or ("body", name) = that body's origin.
J, B = "joint", "body"
SEG_TARGETS = {
    "thigh.L": ("hip.l", "knee.l", (J, "hip_flexion_l"), (J, "knee_angle_l")),
    "shin.L": ("knee.l", "ankle.l", (J, "knee_angle_l"), (J, "ankle_angle_l")),
    "thigh.R": ("hip.r", "knee.r", (J, "hip_flexion_r"), (J, "knee_angle_r")),
    "shin.R": ("knee.r", "ankle.r", (J, "knee_angle_r"), (J, "ankle_angle_r")),
    "upper_arm.L": ("shoulder.l", "elbow.l", (J, "shoulder_rot_l"), (J, "elbow_flex_l")),
    "forearm.L": ("elbow.l", "wrist.l", (J, "elbow_flex_l"), (J, "flexion_l")),
    "upper_arm.R": ("shoulder.r", "elbow.r", (J, "shoulder_rot_r"), (J, "elbow_flex_r")),
    "forearm.R": ("elbow.r", "wrist.r", (J, "elbow_flex_r"), (J, "flexion_r")),
    "spine": ("l5", "t1", (B, "lumbar5"), (B, "cervical_spine")),
}
FOOT_TARGETS = {"foot.L": ("ankle.l", "toe.l", (J, "ankle_angle_l"), (J, "mtp_angle_l")), "foot.R": ("ankle.r", "toe.r", (J, "ankle_angle_r"), (J, "mtp_angle_r"))}

# Coordinates the IK may move (everything else stays at the model default).
IK_JOINTS = ["flex_extension", "lat_bending", "axial_rotation"]
for s in ("l", "r"):
    IK_JOINTS += ["hip_flexion_%s" % s, "hip_adduction_%s" % s, "hip_rotation_%s" % s, "knee_angle_%s" % s, "ankle_angle_%s" % s]
    IK_JOINTS += ["elv_angle_%s" % s, "shoulder_elv_%s" % s, "shoulder_rot_%s" % s, "elbow_flex_%s" % s]
ik_adr = np.array([qadr(j) for j in IK_JOINTS])
ik_lo = np.array([m.jnt_range[jid(j)][0] if m.jnt_limited[jid(j)] else -math.pi for j in IK_JOINTS])
ik_hi = np.array([m.jnt_range[jid(j)][1] if m.jnt_limited[jid(j)] else math.pi for j in IK_JOINTS])
# Segment directions do not fix a limb's roll (hip rotation, plane of elevation,
# trunk twist); those are pulled gently toward the model's rest so they do not
# wander frame to frame and create torque demands the muscles must chase.
ROLL_W = {"lat_bending": 0.2, "axial_rotation": 0.2, "hip_adduction_l": 0.2, "hip_adduction_r": 0.2, "hip_rotation_l": 0.2, "hip_rotation_r": 0.2}
# The shoulder's plane of elevation and rotation are not roll: both move the
# humerus and forearm directions, so they get only a tie-breaking weight.
ROLL_W.update({"elv_angle_l": 0.02, "elv_angle_r": 0.02, "shoulder_rot_l": 0.02, "shoulder_rot_r": 0.02})
roll_w = np.array([ROLL_W.get(j, 0.0) for j in IK_JOINTS])  # per radian: at 0.2, 10 deg costs like a 2 deg direction miss

# Joint equalities: dependent = poly(driver). Applied after every IK solve so coupled joints are consistent.
couplings = []
for e in range(m.neq):
    if m.eq_type[e] == mujoco.mjtEq.mjEQ_JOINT and m.eq_active0[e]:
        j1, j2 = int(m.eq_obj1id[e]), int(m.eq_obj2id[e])
        couplings.append((int(m.jnt_qposadr[j1]), int(m.jnt_qposadr[j2]), np.array(m.eq_data[e][:5])))


def apply_couplings(q):
    for a1, a2, c in couplings:
        x = q[a2]
        q[a1] = c[0] + c[1] * x + c[2] * x**2 + c[3] * x**3 + c[4] * x**4


def landmark(ref):
    kind, name = ref
    return d.xanchor[jid(name)].copy() if kind == J else d.xpos[bid(name)].copy()


def hip_mid():
    return 0.5 * (landmark((J, "hip_flexion_l")) + landmark((J, "hip_flexion_r")))


def model_dirs():
    out = {}
    for b, (jh, jt, mh, mt) in {**SEG_TARGETS, **FOOT_TARGETS}.items():
        v = landmark(mt) - landmark(mh)
        out[b] = v / (np.linalg.norm(v) + 1e-9)
    return out


def app_quat_to_m(q):
    """App [x,y,z,w] rotation (about world axes) -> MuJoCo [w,x,y,z] about the mapped axes."""
    x, y, z, w = q
    ax = A2M @ np.array([x, y, z])
    return np.array([w, ax[0], ax[1], ax[2]])


def solve_ik(joints, R, q_init):
    """Least squares over IK_JOINTS so model segment directions match the figure's."""
    targets = {}
    for b, (jh, jt, mh, mt) in {**SEG_TARGETS, **FOOT_TARGETS}.items():
        v = to_m(joints[jt] - joints[jh])
        targets[b] = v / (np.linalg.norm(v) + 1e-9)
    if ANCHOR == "feet":
        # Standing exercises keep the feet flat on the floor: hold the model's
        # own rest foot direction rather than the clip's (the retargeter is
        # ~20 deg toes-down on the squat, and the ankle range cannot follow it).
        targets["foot.L"], targets["foot.R"] = foot0.copy(), foot0R.copy()

    def residual(x):
        q = q_init.copy()
        q[ik_adr] = x
        apply_couplings(q)
        d.qpos[:] = q
        mujoco.mj_kinematics(m, d)
        dirs = model_dirs()
        r = []
        for b, tv in targets.items():
            r.extend((dirs[b] - tv) * (0.5 if b.startswith("foot") else 1.0))
        r.extend(roll_w * (x - q_default[ik_adr]))
        return np.array(r)

    x0 = np.clip(q_init[ik_adr], ik_lo, ik_hi)
    sol = least_squares(residual, x0, bounds=(ik_lo, ik_hi), xtol=1e-4, ftol=1e-6, max_nfev=200)
    q = q_init.copy()
    q[ik_adr] = sol.x
    apply_couplings(q)
    per_seg = {b: float(np.linalg.norm(sol.fun[3 * k : 3 * k + 3])) for k, b in enumerate(targets)}
    return q, per_seg


# ---------- 1. IK over the cycle ----------
mujoco.mj_resetData(m, d)
mujoco.mj_kinematics(m, d)
q_default = d.qpos.copy()
root_adr = qadr("root")
root_q0 = q_default[root_adr + 3 : root_adr + 7].copy()
foot0, foot0R = model_dirs()["foot.L"], model_dirs()["foot.R"]
assert foot0[1] < -0.7, "model does not face -Y in its default pose: foot.L direction %s" % foot0
assert landmark((J, "hip_flexion_l"))[0] > landmark((J, "hip_flexion_r"))[0], "model's left hip is not at +X"
rest = fk.pose({"root": [0, 0, 0], "q": {}}, anchor=ANCHOR, bar_height=BAR)[0]
print("default pose: model foot.L %s, figure foot.L %s" % (np.round(foot0, 2), np.round(to_m(rest["toe.l"] - rest["ankle.l"]) / np.linalg.norm(rest["toe.l"] - rest["ankle.l"]), 2)))

traj = np.zeros((n, m.nq))
errs = []
q_prev = q_default.copy()
for i, s in enumerate(samples):
    joints, R = fk.pose(s, anchor=ANCHOR, bar_height=BAR)
    q = q_prev.copy()
    # Root orientation: the figure's pelvis rotation (a delta from rest, about world axes) on top of the model's rest.
    dq = app_quat_to_m(s["q"].get("pelvis", [0, 0, 0, 1]))
    rq = np.zeros(4)
    mujoco.mju_mulQuat(rq, dq, root_q0)
    q[root_adr + 3 : root_adr + 7] = rq
    # Root position: put the model's hip-joint midpoint where the figure's is.
    q[root_adr : root_adr + 3] = 0
    d.qpos[:] = q
    mujoco.mj_kinematics(m, d)
    q[root_adr : root_adr + 3] = to_m(0.5 * (joints["hip.l"] + joints["hip.r"])) - hip_mid()
    q, err = solve_ik(joints, R, q)
    if ANCHOR == "feet":
        # Planted feet: the heels stay where the first frame put them. The hip
        # then sits wherever the model's own leg lengths and its 120 deg knee
        # allow, which is the honest version of the figure's pose.
        d.qpos[:] = q
        mujoco.mj_kinematics(m, d)
        heels = 0.5 * (d.xpos[bid("calcn_l")] + d.xpos[bid("calcn_r")])
        if i == 0:
            heels0 = heels.copy()
        q[root_adr : root_adr + 3] += heels0 - heels
    traj[i] = q
    q_prev = q
    errs.append(err)
deg = 57.2958
worst_seg = sorted(((max(e[b] for e in errs), b) for b in errs[0]), reverse=True)[:4]
print("IK: worst segment direction errors (chord of unit vectors; 0.035 = 2 deg): " + ", ".join("%s %.3f" % (b, v) for v, b in worst_seg))


def lowpass_cyclic(x, harmonics):
    """Keep the first `harmonics` Fourier terms of each column over the closed cycle."""
    f = np.fft.rfft(x, axis=0)
    f[harmonics + 1 :] = 0
    return np.fft.irfft(f, n=x.shape[0], axis=0)


# Per-frame IK leaves sample-to-sample chatter that finite differences turn into
# large accelerations. Biomechanics low-passes kinematics at ~6 Hz; over a cycle
# of `duration` seconds that is this many harmonics.
HARMONICS = max(3, int(6 * duration))
traj = lowpass_cyclic(traj, HARMONICS)
for i in range(n):
    qn = traj[i, root_adr + 3 : root_adr + 7]
    qn /= np.linalg.norm(qn)
    apply_couplings(traj[i])
# Not re-clipped: a fraction of a degree of Fourier overshoot past a range is
# harmless with limits off, and clipping would put a kink back into qacc.
print("IK: smoothed to %d harmonics; joint ranges:" % HARMONICS)
for name in ("hip_flexion_l", "hip_adduction_l", "hip_rotation_l", "knee_angle_l", "ankle_angle_l", "elv_angle_l", "shoulder_elv_l", "shoulder_rot_l", "elbow_flex_l", "flex_extension"):
    col = traj[:, qadr(name)] * deg
    print("  %-16s %6.1f .. %6.1f deg" % (name, col.min(), col.max()))
if ANCHOR == "hands":
    # A hanging body can only be held with its centre of mass under the bar:
    # two hand forces on the bar's axis cannot balance a moment about it. The
    # designed motion does not know that, so let the body swing: rotate the
    # whole body about the bar (the line through the wrists) each frame until
    # the centre of mass hangs under it, then smooth the swing over the cycle.
    def hands_and_com(q):
        d.qpos[:] = q
        mujoco.mj_kinematics(m, d)
        mujoco.mj_comPos(m, d)
        return 0.5 * (d.xpos[bid("lunate_l")] + d.xpos[bid("lunate_r")]), d.subtree_com[0].copy()

    swing = np.zeros(n)
    for i in range(n):
        h, c = hands_and_com(traj[i])
        v = c - h
        swing[i] = math.atan2(v[1], -v[2])  # angle of the body from straight down, positive toward +Y
    swing = lowpass_cyclic(swing[:, None], HARMONICS)[:, 0]
    for i in range(n):
        h, _ = hands_and_com(traj[i])
        rot = np.zeros(4)
        mujoco.mju_axisAngle2Quat(rot, np.array([1.0, 0, 0]), -swing[i])
        p = traj[i, root_adr : root_adr + 3] - h
        mujoco.mju_rotVecQuat(p, p, rot)
        traj[i, root_adr : root_adr + 3] = h + p
        rq = np.zeros(4)
        mujoco.mju_mulQuat(rq, rot, traj[i, root_adr + 3 : root_adr + 7])
        traj[i, root_adr + 3 : root_adr + 7] = rq
    left = [math.degrees(math.atan2((c - h)[1], -(c - h)[2])) for h, c in (hands_and_com(traj[i]) for i in range(n))]
    print("IK: body swung %.1f..%.1f deg about the bar; centre of mass now within %.1f deg of under it" % (math.degrees(swing.min()), math.degrees(swing.max()), max(abs(x) for x in left)))
np.save(OUT.replace(".json", ".traj.npy"), traj)
if STAGE == "ik":
    sys.exit(0)

# ---------- 2. inverse dynamics, cyclic ----------
def cyc(x, k):
    return np.roll(x, -k, axis=0)


# Velocities/accelerations in the velocity space (nv); the free joint's quaternion needs mj_differentiatePos.
qvel = np.zeros((n, m.nv))
for i in range(n):
    mujoco.mj_differentiatePos(m, qvel[i], 2 * dt, traj[i - 1], traj[(i + 1) % n])
qacc = (cyc(qvel, 1) - cyc(qvel, -1)) / (2 * dt)

# Contacts off: the anchor reaction is solved explicitly, as in the OpenSim
# pipeline. mj_inverse returns the TOTAL generalised force the motion needs
# (it does not subtract xfrc_applied), so the reaction is found from the anchor
# bodies' Jacobians: a wrench (force + moment) at each anchor point, chosen so
# the six root rows are met exactly with the smallest weighted wrench; moments
# are penalised so the solution prefers forces. What is left after subtracting
# the reaction is what the muscles must produce.
m.opt.disableflags |= int(mujoco.mjtDisableBit.mjDSBL_CONTACT)
# Joint limits off too: the IK already keeps every coordinate in range, and a
# trajectory that rests on a limit (the knee at 120 deg) otherwise has the limit
# constraint fighting the inverse dynamics for thousands of N m.
m.opt.disableflags |= int(mujoco.mjtDisableBit.mjDSBL_LIMIT)

ANCHOR_BODIES = {"feet": [("calcn_l", "toes_l"), ("calcn_r", "toes_r")], "hands": [("lunate_l", None), ("lunate_r", None)], "free": []}[ANCHOR]
# One N m of anchor moment costs as much as this many N of force. The floor can
# take some moment (the centre of pressure moves within the foot); a bar cannot.
MOMENT_COST = 20.0 if ANCHOR == "feet" else 300.0
tau = np.zeros((n, m.nv))
wrench = np.zeros((n, 6 * len(ANCHOR_BODIES)))
jacp, jacr = np.zeros((3, m.nv)), np.zeros((3, m.nv))
for i in range(n):
    d.qpos[:] = traj[i]
    d.qvel[:] = qvel[i]
    d.qacc[:] = qacc[i]
    mujoco.mj_inverse(m, d)
    total = d.qfrc_inverse.copy()
    if not ANCHOR_BODIES:
        tau[i] = total
        continue
    com = d.subtree_com[0]
    cols = []
    for body, toward in ANCHOR_BODIES:
        p = d.xpos[bid(body)].copy()
        if toward:
            # Feet: the reaction acts under the centre of mass, as far along the
            # heel-to-toes line as the foot reaches (the OpenSim pipeline's rule).
            heel, toes = p, d.xpos[bid(toward)]
            axis = toes - heel
            s = float(np.clip(np.dot(com - heel, axis) / np.dot(axis, axis), 0.0, 1.0))
            p = heel + s * axis
        mujoco.mj_jac(m, d, jacp, jacr, p, bid(body))
        # Hands on a bar transmit force only (they turn freely on it); feet
        # take a moment too, which is the centre of pressure moving.
        cols += [jacp.T.copy(), jacr.T.copy()] if toward else [jacp.T.copy(), 0 * jacr.T]
    Jt = np.hstack(cols)  # nv x 6k: generalised force per unit wrench component
    w = np.tile([1, 1, 1, MOMENT_COST, MOMENT_COST, MOMENT_COST], len(ANCHOR_BODIES)).astype(float)
    A6 = Jt[:6]
    Winv = np.diag(1.0 / w)
    # Smallest weighted wrench meeting the six root rows as far as they can be
    # met (minimum-norm least squares); what it cannot meet, a hanging body's
    # moment about the bar, is left in tau[:6] as the root residual and reported.
    y = np.linalg.lstsq(A6 @ Winv, total[:6], rcond=1e-6)[0]
    x = Winv @ y
    wrench[i] = x
    tau[i] = total - Jt @ x
if ANCHOR_BODIES:
    fz = sum(wrench[:, 6 * k + 2] for k in range(len(ANCHOR_BODIES)))
    mom = np.abs(wrench.reshape(n, -1, 6)[:, :, 3:]).max()
    print("ID: anchor reaction %.0f..%.0f N vertical (body weight %.0f N), largest anchor moment %.1f N m; unmet root force %.1f N, moment %.1f N m" % (
        fz.min(), fz.max(), mass * 9.81, mom, np.abs(tau[:, :3]).max(), np.abs(tau[:, 3:6]).max()))
else:
    print("ID: free body, root residual force %.0f N torque %.0f N m (peaks) is left to nothing" % (np.abs(tau[:, :3]).max(), np.abs(tau[:, 3:6]).max()))
if STAGE == "id":
    sys.exit(0)

# ---------- 3. static optimisation ----------
dof_names = []
for j in range(m.njnt):
    nm = mujoco.mj_id2name(m, mujoco.mjtObj.mjOBJ_JOINT, j) or "j%d" % j
    for k in range(int(m.jnt_dofadr[j + 1] if j + 1 < m.njnt else m.nv) - int(m.jnt_dofadr[j])):
        dof_names.append(nm if k == 0 else "%s[%d]" % (nm, k))
act_names = [mujoco.mj_id2name(m, mujoco.mjtObj.mjOBJ_ACTUATOR, a) for a in range(m.nu)]
# Rows the muscles must satisfy: every dof except the root and the equality-
# coupled dependents (their torque is carried by the model's own constraints).
dependent = {int(m.jnt_dofadr[int(m.eq_obj1id[e])]) for e in range(m.neq) if m.eq_type[e] == mujoco.mjtEq.mjEQ_JOINT}
keep = np.array([k for k in range(6, m.nv) if k not in dependent])
act = np.zeros((n, m.nu))
reserve = np.zeros((n, m.nv))
LAMBDA = 0.5  # N m of torque error worth one unit of summed squared activation; small, so torque wins
for i in range(n):
    d.qpos[:] = traj[i]
    d.qvel[:] = qvel[i]
    d.act[:] = 0
    mujoco.mj_forward(m, d)
    base = d.qfrc_actuator.copy()  # passive muscle force at zero activation
    A = np.zeros((m.nv, m.nu))
    for a in range(m.nu):
        d.act[:] = 0
        d.act[a] = 1
        mujoco.mj_fwdActuation(m, d)  # muscle force is linear in activation at fixed length and velocity
        A[:, a] = d.qfrc_actuator - base
    rhs = tau[i] - base
    Aa = np.vstack([A[keep], LAMBDA * np.eye(m.nu)])
    bb = np.concatenate([rhs[keep], np.zeros(m.nu)])
    sol = lsq_linear(Aa, bb, bounds=(0, 1), lsmr_tol="auto", max_iter=400)
    act[i] = sol.x
    reserve[i, keep] = rhs[keep] - A[keep] @ sol.x
    if i % 16 == 0:
        print("  SO frame %d: torque rms %.1f N m, mean activation %.3f" % (i, np.sqrt(np.mean(reserve[i, keep] ** 2)), sol.x.mean()))
worst = sorted(((float(np.abs(reserve[:, k]).max()), dof_names[k]) for k in keep), reverse=True)[:6]
print("SO: largest reserve torques (N m):", ", ".join("%s %.1f" % (nm, v) for v, nm in worst))
np.save(OUT.replace(".json", ".act.npy"), act)

# ---------- map to the atlas ----------
MUSCLES = json.load(open(os.path.join(HERE, "muscle-map.json")))
# Activation cannot change faster than its own dynamics (~40 ms rise); a three-
# sample cyclic average at this sample spacing is that, and no more.
act = (np.roll(act, 1, axis=0) + act + np.roll(act, -1, axis=0)) / 3
t_out = np.linspace(0, 1, 33)
t_in = np.arange(n) / n
result = {}
for mid, patterns in MUSCLES.items():
    if mid.startswith("_"):
        continue
    parts = [a for a in act_names if any(fnmatch(a, p) for p in patterns)]
    if not parts:
        print("  %-22s no model muscle; stays qualitative" % mid)
        continue
    idx = [act_names.index(p) for p in parts]
    a = act[:, idx].mean(axis=1)
    curve = np.interp(t_out, t_in, a, period=1.0)
    result[mid] = {"curve": [[round(float(t), 4), round(float(v), 4)] for t, v in zip(t_out, curve)], "peak": round(float(a.max()), 4), "parts": parts}
    print("  %-22s peak %.2f  %s" % (mid, a.max(), " ".join(parts)))

json.dump(
    {
        "method": "MuJoCo %s, MyoFullBody, per-frame bounded least squares over activations (quadratic regularisation)" % mujoco.__version__,
        "model": "MyoFullBody from amathislab/musclemimic_models (MyoSuite arm, legs, torso; 416 muscles), Apache-2.0",
        "motion": "%s (%s)" % (clip["source"], clip.get("credit", "")),
        "conditions": "Generic unscaled model, %.0f kg, cycle analysed at %.1f s. Reaction at the %s solved from the motion (%s), contacts not simulated; unmet root force %.0f N and moment %.0f N m. Coupled joints follow the model equalities. Reserve torque peaks: %s." % (
            mass, duration, ANCHOR, "centre of pressure under the centre of mass, within the foot" if ANCHOR == "feet" else "forces only, hands turning freely on the bar; the body swung to hang under it",
            np.abs(tau[:, :3]).max(), np.abs(tau[:, 3:6]).max(), "; ".join("%s %.1f" % (nm, v) for v, nm in worst[:3])),
        "measure": "estimated-activation",
        "durationS": round(duration, 3),
        "muscles": result,
    },
    open(OUT, "w"),
    indent=1,
)
print("wrote", OUT)
