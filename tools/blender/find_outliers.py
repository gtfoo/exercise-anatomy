"""List atlas meshes that sit far from the body's midline (stray parts that would inflate the bounding box).

    python3 find_outliers.py out/inventory.json
"""

import json
import sys

inv = json.load(open(sys.argv[1], encoding="utf-8"))
for o in inv["objects"]:
    bb = o["bbox"]
    if not bb or not o["verts"] or o["verts"] <= 2:
        continue
    if bb[0][0] < -0.45 or bb[1][0] > 0.45 or bb[0][2] < -0.05 or bb[1][2] > 1.85:
        print("%-45s %6d  %s  %s" % (o["name"], o["verts"], bb, " | ".join(o["collections"])[:70]))
