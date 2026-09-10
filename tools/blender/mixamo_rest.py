"""Print the Mixamo skeleton's hierarchy and rest-pose bone frames from a Mixamo FBX.

    blender --background --python mixamo_rest.py -- "../mocap/in/Air Squat.fbx" out/mixamo-rest.json

Writes {bone: {parent, head, tail, matrix (3x3 rows, world), length}} in the app
frame (Y-up, metres), plus the armature object's transform. This is the
orientation reference for build_mixamo_rig.py.
"""

import json
import os
import sys

import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
SRC, OUT = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC, use_anim=True, automatic_bone_orientation=False)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
print("armature object:", arm.name, "matrix_world:", [list(map(lambda v: round(v, 4), r)) for r in arm.matrix_world])
TO_YUP = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
out = {}
for b in arm.data.bones:
    M = arm.matrix_world @ b.matrix_local
    R = TO_YUP @ M.to_3x3().normalized()
    head = TO_YUP @ (arm.matrix_world @ b.head_local)
    tail = TO_YUP @ (arm.matrix_world @ b.tail_local)
    out[b.name] = {
        "parent": b.parent.name if b.parent else None,
        "head": [round(v, 4) for v in head],
        "tail": [round(v, 4) for v in tail],
        "matrix": [[round(v, 5) for v in row] for row in R],
        "length": round((tail - head).length, 4),
    }
json.dump(out, open(OUT, "w"), indent=1)
print("bones:", len(out))
for name in ("mixamorig:Hips", "mixamorig:Spine", "mixamorig:LeftArm", "mixamorig:LeftForeArm", "mixamorig:LeftHand", "mixamorig:LeftUpLeg", "mixamorig:LeftFoot", "mixamorig:Head"):
    if name in out:
        o = out[name]
        print("%-24s head %s  Y-axis %s  Z-axis %s" % (name, o["head"], [r[1] for r in o["matrix"]], [r[2] for r in o["matrix"]]))
print("wrote", OUT)
