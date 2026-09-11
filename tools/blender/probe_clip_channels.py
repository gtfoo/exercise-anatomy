"""Which nodes does a converted clip animate, and does it carry translations besides the hips?
The clip GLBs hold bones as plain nodes (no skin), so each is an object with its own action.

    blender --background --python probe_clip_channels.py -- <clip.glb> [node substring ...]
"""
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=argv[0])
keys = [k.lower() for k in argv[1:]] or ["neck", "head", "hips"]


def paths_of(obj):
    ad = obj.animation_data
    if not ad or not ad.action:
        return set()
    act = ad.action
    fcurves = []
    if hasattr(act, "layers"):
        for layer in act.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    fcurves += list(cb.fcurves)
    if not fcurves:
        fcurves = list(getattr(act, "fcurves", []))
    return {fc.data_path for fc in fcurves}


animated, with_loc = 0, 0
for o in bpy.data.objects:
    ps = paths_of(o)
    if ps:
        animated += 1
        if "location" in ps:
            with_loc += 1
    if any(k in o.name.lower() for k in keys):
        print("%-24s at %s  channels %s" % (o.name, [round(v, 3) for v in o.matrix_world.translation], sorted(ps)))
print("nodes animated: %d, with location: %d" % (animated, with_loc))
