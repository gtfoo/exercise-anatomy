"""Answer the mapping questions from inventory.json without re-opening Blender.

    python3 query_inventory.py out/inventory.json
"""

import json
import re
import sys

inv = json.load(open(sys.argv[1], encoding="utf-8"))
objs = inv["objects"]
print("blender", inv["blender"], "| units", inv["unit_system"], "x", inv["scale_length"])
print("objects", inv["object_count"], "| meshes", inv["mesh_count"])
print("mesh extent", inv["mesh_extent"])

muscular = [o for o in objs if o["type"] == "MESH" and any("4: Muscular system" in c for c in o["collections"])]
skeletal = [o for o in objs if o["type"] == "MESH" and any("1: Skeletal system" in c for c in o["collections"])]
real = lambda o: o["verts"] and o["verts"] > 2 and re.search(r"\.(l|r)$", o["name"])
muscular = [o for o in muscular if real(o)]
skeletal = [o for o in skeletal if real(o) or (o["verts"] and o["verts"] > 2 and not re.search(r"\.\w+$", o["name"]))]
print("real muscle meshes (l/r):", len(muscular), "| real bone meshes:", len(skeletal))

terms = [
    "rectus femoris", "vastus", "gluteus", "biceps femoris", "semitendinosus", "semimembranosus",
    "adductor magnus", "adductor longus", "adductor brevis", "soleus", "gastrocnemius", "tibialis anterior",
    "erector", "iliocostalis", "longissimus", "spinalis", "rectus abdominis", "external oblique", "transversus abdominis",
    "pectoralis major", "trapezius", "latissimus", "deltoid", "biceps brachii", "triceps brachii", "brachioradialis",
]
print("--- muscle candidates ---")
for t in terms:
    hits = sorted({o["name"][:-2] for o in muscular if t in o["name"].lower()})
    print("%-24s %s" % (t, hits if hits else "NONE"))

print("--- bones for joint centres (name: verts, bbox) ---")
for t in ["femur", "tibia", "fibula", "talus", "calcaneus", "humerus", "ulna", "radius", "hip bone", "sacrum", "scapula", "clavicle", "patella", "vertebra l5", "vertebra t1", "vertebra c7", "sternum", "skull", "occipital", "first metatarsal"]:
    for o in skeletal:
        if t in o["name"].lower() and o["verts"] > 100:
            print("%-32s %6d  %s" % (o["name"], o["verts"], o["bbox"]))

print("--- biggest muscle meshes ---")
for o in sorted(muscular, key=lambda o: -o["verts"])[:8]:
    print("%-40s %6d" % (o["name"], o["verts"]))
print("total muscle verts:", sum(o["verts"] for o in muscular))
