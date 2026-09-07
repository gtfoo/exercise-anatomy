"""Extract one rep of world-space sagittal angles from a motion-capture clip.

    blender --background --python extract_angles.py -- <clip.fbx|clip.bvh> <out.json> [--rep auto|all] [--credit "Mixamo (Adobe)"]

Writes <out.json> (what the app ships: source, credit, fps, rep, samples) and
<out>.raw.json (every frame, for checking) beside it.

No retargeting: the clip's own skeleton is read, joint positions are sampled per
frame, and the four angles the app animates are measured in the sagittal plane:

    shin    ankle -> knee,      from vertical up, + forward
    thigh   knee  -> hip,       from vertical up, + forward   (negative in a squat)
    trunk   hips  -> neck,      from vertical up, + forward
    armFwd  shoulder -> elbow,  from vertical DOWN, + forward

"Forward" comes from the pelvis itself (left hip x up), so the clip may face any
way. Left and right are averaged. One rep is cut at the frames where hip height
returns to standing around its lowest point, then resampled to N points.

Bone names are matched case-insensitively after stripping a `mixamorig:` prefix,
so Mixamo FBX and cgspeed/CMU BVH both work without configuration.
"""

import json
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
if len(argv) < 2:
    raise SystemExit(__doc__)
SRC, OUT = argv[0], argv[1]
REP_MODE = argv[argv.index("--rep") + 1] if "--rep" in argv else "auto"
CREDIT = argv[argv.index("--credit") + 1] if "--credit" in argv else None
N_SAMPLES = 64

NAMES = {
    "hips": ["hips", "pelvis", "hip"],
    "neck": ["neck", "neck1", "head"],
    "thigh.l": ["leftupleg", "lefthip", "lthigh", "l_thigh", "thigh_l", "upperleg_l", "left_upleg"],
    "shin.l": ["leftleg", "leftknee", "lshin", "l_shin", "shin_l", "lowerleg_l", "left_leg"],
    "foot.l": ["leftfoot", "leftankle", "lfoot", "l_foot", "foot_l", "left_foot"],
    "thigh.r": ["rightupleg", "righthip", "rthigh", "r_thigh", "thigh_r", "upperleg_r", "right_upleg"],
    "shin.r": ["rightleg", "rightknee", "rshin", "r_shin", "shin_r", "lowerleg_r", "right_leg"],
    "foot.r": ["rightfoot", "rightankle", "rfoot", "r_foot", "foot_r", "right_foot"],
    "upper_arm.l": ["leftarm", "lshldr", "l_upperarm", "upperarm_l", "left_arm", "leftupperarm"],
    "forearm.l": ["leftforearm", "lforearm", "l_forearm", "forearm_l", "left_forearm", "leftlowerarm"],
    "upper_arm.r": ["rightarm", "rshldr", "r_upperarm", "upperarm_r", "right_arm", "rightupperarm"],
    "forearm.r": ["rightforearm", "rforearm", "r_forearm", "forearm_r", "right_forearm", "rightlowerarm"],
}

# ---------- import ----------

bpy.ops.wm.read_factory_settings(use_empty=True)
ext = os.path.splitext(SRC)[1].lower()
if ext == ".bvh":
    bpy.ops.import_anim.bvh(filepath=SRC, update_scene_fps=True, update_scene_duration=True)
elif ext == ".fbx":
    bpy.ops.import_scene.fbx(filepath=SRC, use_anim=True, automatic_bone_orientation=False)
else:
    raise SystemExit("unsupported clip format: " + ext)

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
print("clip %s: armature %s, %d bones, frames %d-%d @ %.1f fps" % (os.path.basename(SRC), arm.name, len(arm.pose.bones), frames[0], frames[-1], fps))


def norm(n):
    n = n.lower()
    for p in ("mixamorig:", "mixamorig_", "mixamorig"):
        if n.startswith(p):
            n = n[len(p) :]
    return n.replace(" ", "").replace(".", "").replace("-", "_")


bones = {}
by_norm = {norm(pb.name): pb for pb in arm.pose.bones}
for key, cands in NAMES.items():
    for c in cands:
        if c in by_norm:
            bones[key] = by_norm[c]
            break
missing = [k for k in NAMES if k not in bones]
if missing:
    print("bones present:", sorted(by_norm))
    raise SystemExit("could not find bones: %s" % missing)
print("mapped:", {k: v.name for k, v in bones.items()})

# ---------- sample joint positions ----------

UP = Vector((0, 0, 1))  # Blender is Z-up after import


def head(pb):
    return arm.matrix_world @ pb.head


rows = []
for f in frames:
    scene.frame_set(f)
    P = {k: head(pb) for k, pb in bones.items()}
    left = (P["thigh.l"] - P["thigh.r"]).normalized()
    fwd = left.cross(UP).normalized()  # left x up = forward for a right-handed frame

    def sag(v, from_down=False):
        ref = -UP if from_down else UP
        return math.atan2(v.dot(fwd), v.dot(ref))

    shin = (sag(P["shin.l"] - P["foot.l"]) + sag(P["shin.r"] - P["foot.r"])) / 2
    thigh = (sag(P["thigh.l"] - P["shin.l"]) + sag(P["thigh.r"] - P["shin.r"])) / 2
    trunk = sag(P["neck"] - P["hips"])
    arm_l = sag(P["forearm.l"] - P["upper_arm.l"], from_down=True)
    arm_r = sag(P["forearm.r"] - P["upper_arm.r"], from_down=True)
    rows.append({"frame": f, "hipY": P["hips"].dot(UP), "shin": shin, "thigh": thigh, "trunk": trunk, "armFwd": (arm_l + arm_r) / 2})

# ---------- cut one rep ----------

hip = [r["hipY"] for r in rows]
lo_i = min(range(len(hip)), key=lambda i: hip[i])
top = max(hip)
rng = top - hip[lo_i]
if REP_MODE == "all" or rng < 0.02:
    start, end = 0, len(rows) - 1
    if rng < 0.02:
        print("WARNING: hip height barely moves (%.3f m); using the whole clip" % rng)
else:
    thresh = top - 0.03 * rng
    start = lo_i
    while start > 0 and hip[start] < thresh:
        start -= 1
    end = lo_i
    while end < len(rows) - 1 and hip[end] < thresh:
        end += 1
print("rep: frames %d..%d (bottom at %d), hip travel %.3f m" % (rows[start]["frame"], rows[end]["frame"], rows[lo_i]["frame"], rng))

# ---------- resample ----------

keys = ("shin", "thigh", "trunk", "armFwd")
seg = rows[start : end + 1]
samples = []
for i in range(N_SAMPLES):
    x = i / N_SAMPLES * (len(seg) - 1)
    a, b = seg[int(math.floor(x))], seg[min(int(math.floor(x)) + 1, len(seg) - 1)]
    fr = x - math.floor(x)
    samples.append({k: round(a[k] + (b[k] - a[k]) * fr, 5) for k in keys})

deg = lambda r: round(math.degrees(r), 1)
bottom = seg[lo_i - start]
print("at the bottom: shin %s  thigh %s  trunk %s  armFwd %s (degrees)" % tuple(deg(bottom[k]) for k in keys))

clip = {
    "source": os.path.basename(SRC),
    "fps": fps,
    "rep": {"start": rows[start]["frame"], "end": rows[end]["frame"], "bottom": rows[lo_i]["frame"]},
    "samples": samples,
}
if CREDIT:
    clip["credit"] = CREDIT
json.dump(clip, open(OUT, "w"), indent=1)
raw_path = os.path.splitext(OUT)[0] + ".raw.json"
json.dump([{k: round(r[k], 5) for k in ("frame", "hipY") + keys} for r in rows], open(raw_path, "w"), indent=1)
print("wrote", OUT, "and", raw_path)
