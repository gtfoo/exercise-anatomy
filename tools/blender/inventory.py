"""Dump every object in the open .blend to JSON so muscle names can be mapped
without opening Blender interactively.

Run headless with the Z-Anatomy file as the positional argument:

    blender --background Startup.blend --python inventory.py -- <out_dir>

Writes <out_dir>/inventory.json and prints a short summary: collection tree,
scene scale, overall mesh extent, and any object whose name matches the muscles
and bones this project cares about.
"""

import json
import os
import re
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
out_dir = argv[0] if argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(out_dir, exist_ok=True)


def collection_paths():
    """object name -> list of 'Scene/Collection/Sub' paths it lives in."""
    paths = {}

    def walk(coll, path):
        p = path + [coll.name]
        for o in coll.objects:
            paths.setdefault(o.name, []).append("/".join(p))
        for c in coll.children:
            walk(c, p)

    for scene in bpy.data.scenes:
        walk(scene.collection, [scene.name])
    return paths


def tree_summary():
    lines = []

    def walk(coll, depth):
        n_here = len(coll.objects)
        n_all = len(coll.all_objects)
        lines.append("  " * depth + "%s  (%d here, %d total)" % (coll.name, n_here, n_all))
        if depth < 3:
            for c in coll.children:
                walk(c, depth + 1)
        elif coll.children:
            lines.append("  " * (depth + 1) + "... %d sub-collections" % len(coll.children))

    for scene in bpy.data.scenes:
        walk(scene.collection, 0)
    return "\n".join(lines)


paths = collection_paths()
objs = []
lo = [1e9, 1e9, 1e9]
hi = [-1e9, -1e9, -1e9]
for o in bpy.data.objects:
    bb = None
    verts = None
    if o.type == "MESH":
        verts = len(o.data.vertices)
        pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
        mn = [round(min(p[i] for p in pts), 4) for i in range(3)]
        mx = [round(max(p[i] for p in pts), 4) for i in range(3)]
        bb = [mn, mx]
        if verts:
            for i in range(3):
                lo[i] = min(lo[i], mn[i])
                hi[i] = max(hi[i], mx[i])
    objs.append(
        {
            "name": o.name,
            "type": o.type,
            "verts": verts,
            "collections": paths.get(o.name, []),
            "parent": o.parent.name if o.parent else None,
            "hide_viewport": o.hide_viewport,
            "hide_render": o.hide_render,
            "bbox": bb,
        }
    )

scene = bpy.context.scene
report = {
    "blend": bpy.data.filepath,
    "blender": bpy.app.version_string,
    "unit_system": scene.unit_settings.system,
    "scale_length": scene.unit_settings.scale_length,
    "mesh_extent": {"min": lo, "max": hi},
    "object_count": len(objs),
    "mesh_count": sum(1 for o in objs if o["type"] == "MESH"),
    "objects": objs,
}
with open(os.path.join(out_dir, "inventory.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=1, ensure_ascii=False)

print("=== Z-Anatomy inventory ===")
print("blender", report["blender"], "| units", report["unit_system"], "x", report["scale_length"])
print("objects", report["object_count"], "| meshes", report["mesh_count"])
print("mesh extent min", lo, "max", hi)
print("--- collection tree (3 levels) ---")
print(tree_summary())

WANTED = re.compile(
    r"rectus femoris|vastus|glute|biceps femoris|semitendinosus|semimembranosus|adductor|soleus|gastrocnemius"
    r"|tibialis anterior|erector|iliocostalis|longissimus|spinalis|rectus abdominis|oblique|transversus abdominis"
    r"|pectoralis major|trapezius|latissimus|deltoid|biceps brachii|triceps brachii|brachioradialis"
    r"|femur|tibia|talus|humerus|hip bone|pelvis|sacrum|scapula|ulna|radius|patella|calcaneus|sternum|skull|vertebra",
    re.I,
)
print("--- name matches ---")
for o in objs:
    if o["type"] == "MESH" and WANTED.search(o["name"]):
        print("%-48s %8s verts  %s" % (o["name"], o["verts"], " | ".join(o["collections"])[:90]))
