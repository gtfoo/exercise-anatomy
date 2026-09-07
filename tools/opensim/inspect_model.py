"""Print the coordinates, ranges, muscle and body names of an .osim file without OpenSim installed.

    python3 inspect_model.py vendor/RajagopalLaiUhlrich2023.osim
"""

import re
import sys

s = open(sys.argv[1], encoding="utf-8").read()
print("==", sys.argv[1])
for m in re.finditer(r'<Coordinate name="([^"]+)">(.*?)</Coordinate>', s, re.S):
    name, body = m.group(1), m.group(2)
    rng = re.search(r"<range>([^<]+)</range>", body)
    dv = re.search(r"<default_value>([^<]+)</default_value>", body)
    print("  %-20s range %-30s default %s" % (name, rng.group(1).strip() if rng else "?", dv.group(1).strip() if dv else "?"))
muscles = re.findall(r'<(Millard2012EquilibriumMuscle|DeGrooteFregly2016Muscle|Thelen2003Muscle) name="([^"]+)"', s)
print("muscles:", len(muscles), "types:", sorted({t for t, _ in muscles}))
print("right-side muscles:", " ".join(n for _, n in muscles if n.endswith("_r")))
print("bodies:", " ".join(re.findall(r'<Body name="([^"]+)"', s)))
print("coordinate actuators:", " ".join(re.findall(r'<CoordinateActuator name="([^"]+)"', s)))
masses = re.findall(r'<Body name="([^"]+)">.*?<mass>([^<]+)</mass>', s, re.S)
print("total mass: %.2f kg" % sum(float(v) for _, v in masses))
# joint locations that matter for planting the feet
for j in ("hip_r", "walker_knee_r", "knee_r", "ankle_r", "mtp_r", "ground_pelvis"):
    m = re.search(r'<[A-Za-z]+Joint name="%s">(.*?)</[A-Za-z]+Joint>' % j, s, re.S)
    if m:
        frames = re.findall(r'<PhysicalOffsetFrame name="([^"]+)">.*?<socket_parent>([^<]+)</socket_parent>.*?<translation>([^<]+)</translation>', m.group(1), re.S)
        print("joint", j, [(n, p.split("/")[-1], t.strip()) for n, p, t in frames])
