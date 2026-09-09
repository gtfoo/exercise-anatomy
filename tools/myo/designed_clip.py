"""Turn a designed sagittal pose function into a MotionClip3D for the estimator.

    tools/myo/.venv/bin/python tools/myo/designed_clip.py pull-up tools/myo/out/pull-up-3d.json

Mirrors src/lib/kinematics/<slug>.ts and the sagittal path of AnatomyFigure.tsx:
every bone's world rotation is about the world X axis, by the pose's world
angle for that segment (the pelvis carries the trunk angle and the spine
follows it; the neck keeps the gaze level at 0.2 x trunk). Keep the constants
in step with the TypeScript, which is the source of truth for what is shown.
"""

import json
import math
import sys

DEG = math.pi / 180
N = 64

# src/lib/kinematics/pull-up.ts
HANG = {"armFwd": 172, "elbow": 5, "trunk": 3, "thigh": -3, "knee": 10}
TOP = {"armFwd": 35, "elbow": 135, "trunk": -8, "thigh": -12, "knee": 35}
POINT = 35
WRIST_FLEX = 45  # AnatomyFigure.tsx, hanging


def pull_up_pose(t):
    up = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    mix = lambda k: (HANG[k] + (TOP[k] - HANG[k]) * up) * DEG
    thigh = mix("thigh")
    shin = thigh + mix("knee")
    return {"shin": shin, "thigh": thigh, "trunk": mix("trunk"), "armFwd": mix("armFwd"), "elbow": mix("elbow"), "foot": shin + POINT * DEG}


POSES = {"pull-up": pull_up_pose}


def rx(a):
    return [math.sin(a / 2), 0.0, 0.0, math.cos(a / 2)]


def sample(pose):
    trunk, arm = pose["trunk"], -pose["armFwd"]
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": rx(0.2 * trunk), "head": rx(0.2 * trunk)}
    for S in ("L", "R"):
        q["thigh." + S] = rx(pose["thigh"])
        q["shin." + S] = rx(pose["shin"])
        q["foot." + S] = rx(pose["foot"])
        q["upper_arm." + S] = rx(arm)
        q["forearm." + S] = rx(arm - pose["elbow"])
        q["hand." + S] = rx(arm - pose["elbow"] + WRIST_FLEX * DEG)
    return {"root": [0, 0, 0], "q": q}


slug, out = sys.argv[1], sys.argv[2]
clip = {
    "source": "designed pose, src/lib/kinematics/%s.ts" % slug,
    "fps": N,
    "cycle": {"start": 0, "end": N, "seconds": 1.0},
    "samples": [sample(POSES[slug](i / N)) for i in range(N)],
}
json.dump(clip, open(out, "w"))
print("wrote", out, N, "samples")
