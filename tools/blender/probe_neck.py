"""Where did the neck go? Load a figure GLB and report, for the skeleton mesh, the vertices
weighted to the neck and head bones: their count and centroid, and the bones' heads and tails.

    blender --background --python probe_neck.py -- <figure.glb|figure-mixamo.glb>
"""
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=argv[0])
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
for b in arm.data.bones:
    if any(k in b.name.lower() for k in ("neck", "head", "spine")):
        print("bone %-22s head %s tail %s" % (b.name, [round(v, 3) for v in (arm.matrix_world @ b.head_local)], [round(v, 3) for v in (arm.matrix_world @ b.tail_local)]))
for o in bpy.data.objects:
    if o.type != "MESH" or "skeleton" not in o.name.lower():
        continue
    for g in o.vertex_groups:
        if not any(k in g.name.lower() for k in ("neck", "head")):
            continue
        pts = []
        for v in o.data.vertices:
            for ge in v.groups:
                if ge.group == g.index and ge.weight > 0.5:
                    pts.append(o.matrix_world @ v.co)
        if pts:
            c = sum(pts, Vector()) / len(pts)
            zs = [p.z for p in pts]
            print("%s / %-22s %6d verts, centroid %s, z %.3f..%.3f" % (o.name, g.name, len(pts), [round(v, 3) for v in c], min(zs), max(zs)))
        else:
            print("%s / %-22s 0 verts" % (o.name, g.name))
