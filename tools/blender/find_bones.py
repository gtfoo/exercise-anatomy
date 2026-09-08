"""Find skeleton object names matching terms, with bounding boxes, from inventory.json.

    python3 find_bones.py out/inventory.json metacarpal phalanx
"""

import json
import re
import sys

inv = json.load(open(sys.argv[1], encoding="utf-8"))
skel = [
    o
    for o in inv["objects"]
    if o["type"] == "MESH" and o["verts"] and o["verts"] > 2 and not re.search(r"\.(j|i|g|o[lr]|e\d?[lr])$", o["name"]) and any("1: Skeletal system" in c for c in o["collections"])
]
for term in sys.argv[2:]:
    hits = [o for o in skel if term.lower() in o["name"].lower() and o["name"].endswith(".l")]
    print("%-14s %d left-side objects" % (term, len(hits)))
    for o in hits[:24]:
        print("   %-48s %5d verts  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f" % (o["name"], o["verts"], o["bbox"][0][0], o["bbox"][1][0], o["bbox"][0][1], o["bbox"][1][1], o["bbox"][0][2], o["bbox"][1][2]))
