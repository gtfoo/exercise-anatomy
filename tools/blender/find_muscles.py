"""Find Z-Anatomy muscle base names matching terms (case-insensitive), from inventory.json.

    python3 find_muscles.py out/inventory.json latissimus "teres major" biceps brachii ...
"""

import json
import re
import sys

inv = json.load(open(sys.argv[1], encoding="utf-8"))
muscular = {
    o["name"][:-2]
    for o in inv["objects"]
    if o["type"] == "MESH" and o["verts"] and o["verts"] > 2 and re.search(r"\.(l|r)$", o["name"]) and any("4: Muscular system" in c for c in o["collections"])
}
for term in sys.argv[2:]:
    hits = sorted(n for n in muscular if term.lower() in n.lower() and not re.search(r"bursa|sheath|fascia", n, re.I))
    print("%-22s %s" % (term, hits if hits else "NONE"))
