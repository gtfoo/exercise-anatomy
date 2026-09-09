"""Load MyoFullBody and print what the mapping needs: joints (with ranges), bodies, muscle actuators.

    tools/myo/.venv/bin/python tools/myo/inspect_model.py [--muscles]

Loads by ABSOLUTE path: MuJoCo resolves nested <include> paths against the main
file's directory, and a relative main path gets concatenated into them.
"""

import os
import sys

import mujoco

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "vendor", "musclemimic_models", "musclemimic_models", "model", "body", "myofullbody.xml")

m = mujoco.MjModel.from_xml_path(MODEL)
name = lambda kind, i: mujoco.mj_id2name(m, kind, i) or "?"
print("MyoFullBody: nq %d nv %d actuators %d bodies %d joints %d tendons %d" % (m.nq, m.nv, m.nu, m.nbody, m.njnt, m.ntendon))
print("mass %.1f kg" % sum(m.body_mass))

print("\n== joints (type, range deg) ==")
for j in range(m.njnt):
    t = m.jnt_type[j]
    kind = {0: "free", 1: "ball", 2: "slide", 3: "hinge"}[int(t)]
    lo, hi = m.jnt_range[j]
    rng = "" if not m.jnt_limited[j] else " %.0f..%.0f" % (lo * 57.2958, hi * 57.2958) if kind == "hinge" else " %.2f..%.2f" % (lo, hi)
    print("  %-28s %-5s body=%s%s" % (name(mujoco.mjtObj.mjOBJ_JOINT, j), kind, name(mujoco.mjtObj.mjOBJ_BODY, m.jnt_bodyid[j]), rng))

print("\n== bodies ==")
print("  " + " ".join(name(mujoco.mjtObj.mjOBJ_BODY, b) for b in range(m.nbody)))

if "--muscles" in sys.argv:
    print("\n== actuators ==")
    print("  " + " ".join(name(mujoco.mjtObj.mjOBJ_ACTUATOR, a) for a in range(m.nu)))
