"""Print a coarse timeline of a clip so a cycle can be chosen by eye.

    blender --background --python probe_clip.py -- <clip.fbx|.bvh> [--every 10]

Per sampled frame: hips height, left and right wrist height above the hips,
left knee angle, and the lowest hips height so far. Heights are in the clip's
own units after the FBX import (metres for the CMU conversions). A pull-up
shows as both wrists far above the hips with the hips rising; a squat as the
hips dipping with the knee angle closing; a push-up as the hips near the
floor with the wrists below them.
"""

import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
SRC = argv[0]
EVERY = int(argv[argv.index("--every") + 1]) if "--every" in argv else 10
FROM = int(argv[argv.index("--from") + 1]) if "--from" in argv else None
TO = int(argv[argv.index("--to") + 1]) if "--to" in argv else None

bpy.ops.wm.read_factory_settings(use_empty=True)
if SRC.lower().endswith(".bvh"):
    bpy.ops.import_anim.bvh(filepath=SRC, update_scene_fps=True, update_scene_duration=True)
else:
    bpy.ops.import_scene.fbx(filepath=SRC, use_anim=True, automatic_bone_orientation=False)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
scene = bpy.context.scene
act = arm.animation_data.action
f0, f1 = act.frame_range
fps = scene.render.fps / scene.render.fps_base


def norm(n):
    n = n.lower()
    for p in ("mixamorig:", "mixamorig_", "mixamorig"):
        if n.startswith(p):
            n = n[len(p) :]
    return n.replace(" ", "").replace(".", "").replace("-", "_")


by = {norm(b.name): b.name for b in arm.data.bones}


def pick(*cands):
    for c in cands:
        if c in by:
            return by[c]
    raise SystemExit("no bone among %s; have %s" % (cands, sorted(by)))


HIPS = pick("hips", "hip", "pelvis")
LW = pick("lefthand", "lhand", "left_hand")
RW = pick("righthand", "rhand", "right_hand")
LH = pick("leftupleg", "lthigh", "left_upleg")
LK = pick("leftleg", "lshin", "left_leg")
LA = pick("leftfoot", "lfoot", "left_foot")


def head(name):
    return arm.matrix_world @ arm.pose.bones[name].head


print("clip %s: frames %d-%d @ %.0f fps (%.1f s)" % (os.path.basename(SRC), f0, f1, fps, (f1 - f0) / fps))
print("%6s %6s | %7s %7s %7s | %6s | %7s %7s | %s" % ("frame", "s", "hips_z", "lw-hips", "rw-hips", "knee", "hips_x", "hips_fw", "lowest"))
lowest = 1e9
for f in range(FROM or int(f0), (TO or int(f1)) + 1, EVERY):
    scene.frame_set(f)
    h = head(HIPS)
    lw, rw = head(LW), head(RW)
    a, b, c = head(LH), head(LK), head(LA)
    v1, v2 = (a - b).normalized(), (c - b).normalized()
    knee = 180 - math.degrees(math.acos(max(-1, min(1, v1.dot(v2)))))
    lowest = min(lowest, h.z)
    # hips_fw: forward travel (Blender -Y is the figure's forward)
    print("%6d %6.2f | %7.3f %7.3f %7.3f | %6.0f | %7.3f %7.3f | %.3f" % (f, (f - f0) / fps, h.z, lw.z - h.z, rw.z - h.z, knee, h.x, -h.y, lowest))
