"""Retarget one cycle of a captured clip onto the figure's rig as per-bone 3D rotations.

    blender --background --python extract_pose3d.py -- <clip.fbx|.bvh> <out.json> \
        [--rig rig-joints.json] [--range auto|all|START:END] [--samples 64] [--credit "..."] \
        [--method orientation|direction]

Unlike extract_angles.py (four sagittal angles), this handles any motion: body
roll, alternating limbs, arms out of the sagittal plane. Each rig bone maps to
a source bone (its segment: two source joints), and per frame the output is the
rig bone's world rotation relative to its rest pose. Two ways to get it:

- **orientation** (default): the source bone's full world rotation, as a delta
  from its rest pose, applied to the rig bone through a constant per-bone
  alignment computed once from both rest poses (segment direction plus a roll
  reference: the hip line for the legs and pelvis, the shoulder line for the
  trunk and head, the palm normal for the arms). Roll, pronation, head tilt
  and foot pitch all come through. Needs a clip whose armature has a real
  rest pose (an FBX bind pose; Mixamo and the CMU conversions do).
- **direction**: the rotation that takes the rig's rest segment direction to
  the source segment's current direction, with a secondary axis only for the
  pelvis and spine. Works from joint positions alone, so it suits BVH with no
  bind pose, but it loses limb twist and guesses the head.

The root (pelvis) translation follows the source hips, scaled by leg length.
Frames are expressed Y-up, +Z forward, the clip rotated so its left hip is at
+X at rest, matching the figure. Output: {samples: [{root: [x,y,z], q: {bone:
[x,y,z,w]}}]} over one cycle, plus the cycle bounds found.
"""

import json
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
if len(argv) < 2:
    raise SystemExit(__doc__)
SRC, OUT = argv[0], argv[1]
opt = lambda flag, default: argv[argv.index(flag) + 1] if flag in argv else default
RIG = opt("--rig", os.path.join(os.path.dirname(os.path.abspath(__file__)), "rig-joints.json"))
# --range, not --cycle: Blender's own parser grabs "--cycle" as an abbreviation of its --cycles-* flags, even after "--".
CYCLE = opt("--range", opt("--cycle", "auto"))
N = int(opt("--samples", "64"))
CREDIT = opt("--credit", None)
METHOD = opt("--method", "orientation")

# Logical source joints -> candidate bone names (lower-cased, prefix-stripped). Mixamo, DAZ/CMU, BVH.
NAMES = {
    "hips": ["hips", "hip", "pelvis"],
    "spine": ["spine", "abdomen", "lowerback", "spine1"],
    "chest": ["spine2", "chest", "spine1", "upperback"],
    "neck": ["neck", "neck1"],
    "head": ["head"],
    "l_hip": ["leftupleg", "lthigh", "lefthip", "l_thigh", "left_upleg"],
    "l_knee": ["leftleg", "lshin", "leftknee", "l_shin", "left_leg"],
    "l_ankle": ["leftfoot", "lfoot", "leftankle", "l_foot", "left_foot"],
    "l_toe": ["lefttoebase", "ltoe", "lefttoe", "l_toe", "left_toebase"],
    "l_shoulder": ["leftarm", "lshldr", "l_upperarm", "left_arm", "leftupperarm"],
    "l_elbow": ["leftforearm", "lforearm", "l_forearm", "left_forearm"],
    "l_wrist": ["lefthand", "lhand", "l_hand", "left_hand"],
    "l_hand_end": ["lefthandmiddle1", "lmid1", "lefthandindex1", "lindex1", "leftfingerbase"],
    "l_thumb": ["lefthandthumb1", "lthumb1", "l_thumb1", "left_thumb1", "lthumb"],
}
for k in [k for k in NAMES if k.startswith("l_")]:
    NAMES["r_" + k[2:]] = [n.replace("left", "right").replace("lthigh", "rthigh").replace("lshin", "rshin").replace("lfoot", "rfoot").replace("ltoe", "rtoe").replace("lshldr", "rshldr").replace("lforearm", "rforearm").replace("lhand", "rhand").replace("lmid1", "rmid1").replace("lindex1", "rindex1").replace("lthumb", "rthumb").replace("l_", "r_") for n in NAMES[k]]

# Rig bone -> the source BONE whose world orientation it follows (orientation method).
SOURCE_BONE = {"pelvis": "hips", "spine": "spine", "neck": "neck", "head": "head"}
for side, S in (("l", "L"), ("r", "R")):
    SOURCE_BONE.update({"thigh." + S: side + "_hip", "shin." + S: side + "_knee", "foot." + S: side + "_ankle", "upper_arm." + S: side + "_shoulder", "forearm." + S: side + "_elbow", "hand." + S: side + "_wrist"})
# Roll reference per rig bone, used once to align the two rest poses: a pair of
# joints whose difference is the axis, or "palm.l"/"palm.r" for the palm normal.
ROLL_REF = {"pelvis": ("l_hip", "r_hip"), "spine": ("l_shoulder", "r_shoulder"), "neck": ("l_shoulder", "r_shoulder"), "head": ("l_shoulder", "r_shoulder")}
RIG_ROLL_REF = {"pelvis": ("hip.l", "hip.r"), "spine": ("shoulder.l", "shoulder.r"), "neck": ("shoulder.l", "shoulder.r"), "head": ("shoulder.l", "shoulder.r")}
for side, S in (("l", "L"), ("r", "R")):
    for b in ("thigh", "shin", "foot"):
        ROLL_REF[b + "." + S] = ("l_hip", "r_hip")
        RIG_ROLL_REF[b + "." + S] = ("hip.l", "hip.r")
    for b in ("upper_arm", "forearm", "hand"):
        ROLL_REF[b + "." + S] = "palm." + side
        RIG_ROLL_REF[b + "." + S] = "palm." + side

# Rig bone -> (source head joint, source tail joint, secondary axis or None). Secondary: pair of source joints whose difference is the axis.
SEGMENTS = {
    "pelvis": ("hips", "spine", ("l_hip", "r_hip")),
    "spine": ("spine", "neck", ("l_shoulder", "r_shoulder")),
    "neck": ("neck", "head", ("l_shoulder", "r_shoulder")),
    "head": ("head", "head_end", None),
    "thigh.L": ("l_hip", "l_knee", None),
    "shin.L": ("l_knee", "l_ankle", None),
    "foot.L": ("l_ankle", "l_toe", None),
    "upper_arm.L": ("l_shoulder", "l_elbow", None),
    "forearm.L": ("l_elbow", "l_wrist", None),
    "hand.L": ("l_wrist", "l_hand_end", None),
}
for k in list(SEGMENTS):
    if k.endswith(".L"):
        h, t, s = SEGMENTS[k]
        SEGMENTS[k[:-2] + ".R"] = (h.replace("l_", "r_"), t.replace("l_", "r_"), s)

# Rig bone -> (rig joint head, rig joint tail, secondary rig joints) in rig-joints.json (Blender coords).
RIG_SEGMENTS = {
    "pelvis": ("pelvis", "l5", ("hip.l", "hip.r")),
    "spine": ("l5", "t1", ("shoulder.l", "shoulder.r")),
    "neck": ("t1", "c7", ("shoulder.l", "shoulder.r")),
    "head": ("c7", "skull", None),
    "thigh.L": ("hip.l", "knee.l", None),
    "shin.L": ("knee.l", "ankle.l", None),
    "foot.L": ("ankle.l", "toe.l", None),
    "upper_arm.L": ("shoulder.l", "elbow.l", None),
    "forearm.L": ("elbow.l", "wrist.l", None),
    "hand.L": ("wrist.l", "mcp.l", None),
}
for k in list(RIG_SEGMENTS):
    if k.endswith(".L"):
        h, t, s = RIG_SEGMENTS[k]
        RIG_SEGMENTS[k[:-2] + ".R"] = (h.replace(".l", ".r"), t.replace(".l", ".r"), s)

# ---------- import ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
if SRC.lower().endswith(".bvh"):
    bpy.ops.import_anim.bvh(filepath=SRC, update_scene_fps=True, update_scene_duration=True)
else:
    bpy.ops.import_scene.fbx(filepath=SRC, use_anim=True, automatic_bone_orientation=False)
arm = next((o for o in bpy.data.objects if o.type == "ARMATURE"), None)
if arm is None:
    raise SystemExit("no armature in " + SRC)
scene = bpy.context.scene
act = arm.animation_data.action if arm.animation_data else None
if act is not None:
    f0, f1 = act.frame_range
    scene.frame_start, scene.frame_end = int(f0), int(math.ceil(f1))
fps = scene.render.fps / scene.render.fps_base
frames = list(range(scene.frame_start, scene.frame_end + 1))


def norm(n):
    n = n.lower()
    for p in ("mixamorig:", "mixamorig_", "mixamorig"):
        if n.startswith(p):
            n = n[len(p) :]
    return n.replace(" ", "").replace(".", "").replace("-", "_")


by_norm = {norm(b.name): b for b in arm.data.bones}
src = {}
for key, cands in NAMES.items():
    for c in cands:
        if c in by_norm:
            src[key] = by_norm[c]
            break
if "chest" not in src and "spine" in src:
    src["chest"] = src["spine"]
required = ["hips", "spine", "neck", "head", "l_hip", "l_knee", "l_ankle", "l_shoulder", "l_elbow", "l_wrist", "r_hip", "r_knee", "r_ankle", "r_shoulder", "r_elbow", "r_wrist"]
missing = [k for k in required if k not in src]
if missing:
    print("bones present:", sorted(by_norm))
    raise SystemExit("could not find source joints: %s" % missing)
print("clip %s: %d bones, frames %d-%d @ %.1f fps" % (os.path.basename(SRC), len(arm.data.bones), frames[0], frames[-1], fps))
print("mapped:", {k: v.name for k, v in src.items()})

TO_YUP = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))  # Blender Z-up -> glTF Y-up


def yup(v):
    return np.array(TO_YUP @ Vector(v))


def rest_pos(key):
    """Rest-pose world position of a logical joint; *_end/toe fall back to the bone tail."""
    if key.endswith("_end") or key not in src:
        base = src[key[:-4]] if key.endswith("_end") else None
        if base is None:
            raise KeyError(key)
        return yup(arm.matrix_world @ base.tail_local)
    return yup(arm.matrix_world @ src[key].head_local)


def cur_pos(key):
    if key.endswith("_end") or key not in src:
        base = src[key[:-4]] if key.endswith("_end") else None
        if base is None:
            raise KeyError(key)
        pb = arm.pose.bones[base.name]
        return yup(arm.matrix_world @ pb.tail)
    pb = arm.pose.bones[src[key].name]
    return yup(arm.matrix_world @ pb.head)


# Missing toes / hand ends: use the parent bone's tail.
for side in ("l", "r"):
    if side + "_toe" not in src:
        NAMES[side + "_toe"] = []
    if side + "_hand_end" not in src:
        NAMES[side + "_hand_end"] = []


def pos_any(key, getter):
    try:
        return getter(key)
    except KeyError:
        pass
    # toe -> ankle bone tail; hand_end -> wrist bone tail
    fallback = {"l_toe": "l_ankle_end", "r_toe": "r_ankle_end", "l_hand_end": "l_wrist_end", "r_hand_end": "r_wrist_end"}[key]
    return getter(fallback)


# ---------- clip frame: left hip at +X ----------
lat0 = rest_pos("l_hip") - rest_pos("r_hip")
lat0[1] = 0
yaw = math.atan2(lat0[2], lat0[0])  # angle of the lateral axis from +X, about Y
ALIGN = np.array([[math.cos(-yaw), 0, math.sin(-yaw)], [0, 1, 0], [-math.sin(-yaw), 0, math.cos(-yaw)]])
print("clip yaw %.1f deg (rotated so the left hip sits at +X)" % math.degrees(yaw))


def unit(v):
    n = np.linalg.norm(v)
    return v / n if n > 1e-9 else v


def frame_from(d, s):
    """Orthonormal frame with x = d and y in the plane of s; None if degenerate."""
    x = unit(d)
    if s is None:
        return None
    y = s - np.dot(s, x) * x
    if np.linalg.norm(y) < 0.2 * max(np.linalg.norm(s), 1e-9):
        return None
    y = unit(y)
    return np.column_stack([x, y, np.cross(x, y)])


def quat_between(a, b):
    """Shortest rotation taking unit a to unit b, as (x, y, z, w)."""
    a, b = unit(a), unit(b)
    c = np.cross(a, b)
    d = float(np.dot(a, b))
    if d < -0.999999:
        axis = unit(np.cross(a, [1, 0, 0]) if abs(a[0]) < 0.9 else np.cross(a, [0, 1, 0]))
        return np.array([axis[0], axis[1], axis[2], 0.0])
    q = np.array([c[0], c[1], c[2], 1.0 + d])
    return q / np.linalg.norm(q)


def mat_to_quat(m):
    q = Matrix(m.tolist()).to_quaternion()
    return np.array([q.x, q.y, q.z, q.w])


def segment_rotation(d_rest, s_rest, d_cur, s_cur):
    fr, fc = frame_from(d_rest, s_rest), frame_from(d_cur, s_cur)
    if fr is not None and fc is not None:
        return mat_to_quat(fc @ fr.T)
    return quat_between(d_rest, d_cur)


# ---------- rig rest ----------
rig = {k: yup(v) for k, v in json.load(open(RIG)).items()}


def rig_seg(bone):
    h, t, s = RIG_SEGMENTS[bone]
    d = rig[t] - rig[h]
    sec = (rig[s[0]] - rig[s[1]]) if s else None
    return d, sec


src_rest = {}
for bone, (h, t, s) in SEGMENTS.items():
    ph, pt = pos_any(h, rest_pos), pos_any(t, rest_pos)
    d = ALIGN @ (pt - ph)
    sec = ALIGN @ (rest_pos(s[0]) - rest_pos(s[1])) if s else None
    src_rest[bone] = (d, sec)

leg_src = np.linalg.norm(rest_pos("l_hip") - rest_pos("l_ankle"))
leg_rig = np.linalg.norm(rig["hip.l"] - rig["ankle.l"])
scale = leg_rig / leg_src
print("leg length: clip %.3f, rig %.3f -> root scale %.3f" % (leg_src, leg_rig, scale))

# ---------- orientation method: align the two rest poses once ----------
A_APP = ALIGN @ np.array(TO_YUP)  # Blender world -> app frame (Y-up, left hip at +X)


def rot3(m):
    r = m.to_3x3()
    r.normalize()
    return np.array(r)


def src_rot_rest(key):
    return A_APP @ rot3(arm.matrix_world @ src[key].matrix_local)


def src_rot_cur(key):
    return A_APP @ rot3(arm.matrix_world @ arm.pose.bones[src[key].name].matrix)


def palm_normal_src(side):
    """Outward palm normal of the source's rest hand: fingers x thumb (thumb x fingers on the right)."""
    w = rest_pos(side + "_wrist")
    f = pos_any(side + "_hand_end", rest_pos) - w
    if side + "_thumb" not in src:
        print("WARNING: no thumb bone for the %s hand; assuming the rest pose has its palm down" % side)
        return np.array([0.0, -1.0, 0.0])
    th = rest_pos(side + "_thumb") - w
    n = np.cross(f, th) if side == "l" else np.cross(th, f)
    return unit(ALIGN @ n)


def ref_axis_src(ref):
    return palm_normal_src(ref[-1]) if isinstance(ref, str) else ALIGN @ (rest_pos(ref[0]) - rest_pos(ref[1]))


def ref_axis_rig(ref):
    return np.array([0.0, 0.0, 1.0]) if isinstance(ref, str) else rig[ref[0]] - rig[ref[1]]  # the figure rests with its palms forward


align_c, rest_rot = {}, {}
if METHOD == "orientation":
    for bone in SEGMENTS:
        d_src, _ = src_rest[bone]
        d_rig, _ = rig_seg(bone)
        fs, fr = frame_from(d_src, ref_axis_src(ROLL_REF[bone])), frame_from(d_rig, ref_axis_rig(RIG_ROLL_REF[bone]))
        if fs is None or fr is None:
            print("WARNING: %s: roll reference degenerate, aligning direction only" % bone)
            x, y, z, w = quat_between(d_rig, d_src)
            align_c[bone] = np.array(Quaternion((w, x, y, z)).to_matrix())
        else:
            align_c[bone] = fs @ fr.T
        rest_rot[bone] = src_rot_rest(SOURCE_BONE[bone])
    for side in ("l", "r"):
        d = unit(src_rest["upper_arm." + side.upper()][0])
        print("rest pose, %s arm: direction %s, palm normal %s" % (side, np.round(d, 2), np.round(palm_normal_src(side), 2)))

# ---------- sample every frame ----------
rows = []
for f in frames:
    scene.frame_set(f)
    hips = ALIGN @ cur_pos("hips")
    q = {}
    for bone, (h, t, s) in SEGMENTS.items():
        if METHOD == "orientation":
            # The source bone's world rotation since its rest, applied to the rig
            # bone through the constant alignment of the two rest poses.
            delta = src_rot_cur(SOURCE_BONE[bone]) @ rest_rot[bone].T
            q[bone] = mat_to_quat(delta @ align_c[bone])
            continue
        ph, pt = pos_any(h, cur_pos), pos_any(t, cur_pos)
        d_cur = ALIGN @ (pt - ph)
        s_cur = ALIGN @ (cur_pos(s[0]) - cur_pos(s[1])) if s else None
        d_rest, s_rest = rig_seg(bone)
        # Rotation from the RIG rest direction straight to the source's current direction:
        # the rig and the clip share the Y-up, left-at-+X frame, so no source-rest step is needed.
        q[bone] = segment_rotation(d_rest, s_rest, d_cur, s_cur)
    lw = ALIGN @ cur_pos("l_wrist")
    rows.append({"frame": f, "hips": hips, "q": q, "lw_rel": lw - hips})

# ---------- one cycle ----------
def autocorr_period(x, lo, hi):
    x = x - x.mean()
    best, bestv = None, -1
    for lag in range(lo, min(hi, len(x) // 2)):
        v = float(np.dot(x[:-lag], x[lag:]) / (np.dot(x, x) + 1e-9))
        if v > bestv:
            best, bestv = lag, v
    return best, bestv


if CYCLE == "all":
    start, end = 0, len(rows) - 1
elif ":" in CYCLE:
    a, b = CYCLE.split(":")
    start, end = frames.index(int(a)), frames.index(int(b))
else:
    # The left wrist's forward travel relative to the hips is periodic for any cyclic exercise.
    sig = np.array([r["lw_rel"][2] for r in rows])
    period, strength = autocorr_period(sig, int(fps * 0.6), int(fps * 4))
    if period is None or strength < 0.3:
        start, end = 0, len(rows) - 1
        print("WARNING: no clear cycle (autocorrelation %.2f); using the whole clip" % (strength or 0))
    else:
        start = int(np.argmax(sig[: len(sig) - period]))  # begin where the left hand is furthest forward
        end = start + period
        print("cycle: period %d frames (%.2f s, autocorrelation %.2f), frames %d..%d" % (period, period / fps, strength, frames[start], frames[end]))

seg = rows[start : end + 1]
# Root motion is relative to the CYCLE's first frame, so a cycle cut from the
# middle of a long take starts with the pelvis at the figure's rest height. (It
# was relative to the take's first frame until 2026-09-10, which floated a
# jumping jack cut after a crouch 12 cm off the floor.)
hips0 = seg[0]["hips"]


def slerp(a, b, t):
    qa, qb = Quaternion((a[3], a[0], a[1], a[2])), Quaternion((b[3], b[0], b[1], b[2]))
    q = qa.slerp(qb, t)
    return [round(q.x, 5), round(q.y, 5), round(q.z, 5), round(q.w, 5)]


samples = []
for i in range(N):
    x = i / N * (len(seg) - 1)
    k = int(math.floor(x))
    a, b = seg[k], seg[min(k + 1, len(seg) - 1)]
    fr = x - math.floor(x)
    root = (a["hips"] + (b["hips"] - a["hips"]) * fr - hips0) * scale
    samples.append({"root": [round(float(v), 4) for v in root], "q": {bone: slerp(a["q"][bone], b["q"][bone], fr) for bone in SEGMENTS}})

out = {
    "source": os.path.basename(SRC),
    "fps": fps,
    "cycle": {"start": frames[start], "end": frames[end], "seconds": round((end - start) / fps, 3)},
    "rootScale": round(float(scale), 4),
    "samples": samples,
}
if CREDIT:
    out["credit"] = CREDIT
json.dump(out, open(OUT, "w"))
print("wrote", OUT, "(%d samples, %d bones)" % (N, len(SEGMENTS)))
