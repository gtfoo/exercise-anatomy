"""Print the bone hierarchy of a clip's armature, with rest-pose head positions.

    blender --background --python list_bones.py -- <clip.fbx|clip.bvh>
"""

import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
SRC = argv[0]
bpy.ops.wm.read_factory_settings(use_empty=True)
if SRC.lower().endswith(".bvh"):
    bpy.ops.import_anim.bvh(filepath=SRC, update_scene_fps=True, update_scene_duration=True)
else:
    bpy.ops.import_scene.fbx(filepath=SRC, use_anim=True, automatic_bone_orientation=False)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
print("armature %s: %d bones, scale %s, %d frames" % (arm.name, len(arm.data.bones), tuple(round(s, 3) for s in arm.scale), bpy.context.scene.frame_end))


def walk(b, depth):
    h = arm.matrix_world @ b.head_local
    print("  " * depth + "%-24s head (%.3f %.3f %.3f) len %.3f" % (b.name, h.x, h.y, h.z, b.length))
    for c in b.children:
        walk(c, depth + 1)


for b in arm.data.bones:
    if b.parent is None:
        walk(b, 0)
