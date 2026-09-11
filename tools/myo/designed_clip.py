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
HANG = {"armFwd": 175, "elbow": 5, "trunk": 2, "thigh": -2, "knee": 4}
TOP = {"armFwd": 38, "elbow": 138, "trunk": -6, "thigh": -8, "knee": 18}
POINT = 35
WRIST_FLEX = 45  # AnatomyFigure.tsx, hanging


def pull_up_pose(t):
    up = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    mix = lambda k: (HANG[k] + (TOP[k] - HANG[k]) * up) * DEG
    thigh = mix("thigh")
    shin = thigh + mix("knee")
    return {"shin": shin, "thigh": thigh, "trunk": mix("trunk"), "armFwd": mix("armFwd"), "elbow": mix("elbow"), "foot": shin + POINT * DEG}


POSES = {"pull-up": pull_up_pose}


FINGER_CURL = 105  # AnatomyFigure.tsx, hanging
HANGING = {"pull-up": True}


def rx(a):
    return [math.sin(a / 2), 0.0, 0.0, math.cos(a / 2)]


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]


# Hanging from a bar: the rest palms face forward, which overhead faces them
# at the body; a half turn about the vertical (the rest arm axis) turns them
# away for an overhand grip, applied before the sagittal rotation.
PRONATE = [0.0, 1.0, 0.0, 0.0]


def sample(pose, hanging):
    trunk, arm = pose["trunk"], -pose["armFwd"]
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": rx(0.2 * trunk), "head": rx(0.2 * trunk)}
    twist = (lambda r: qmul(r, PRONATE)) if hanging else (lambda r: r)
    for S in ("L", "R"):
        q["thigh." + S] = rx(pose["thigh"])
        q["shin." + S] = rx(pose["shin"])
        q["foot." + S] = rx(pose["foot"])
        q["upper_arm." + S] = rx(arm)
        q["forearm." + S] = twist(rx(arm - pose["elbow"]))
        q["hand." + S] = twist(rx(arm - pose["elbow"] + WRIST_FLEX * DEG))
        q["fingers." + S] = twist(rx(arm - pose["elbow"] + (WRIST_FLEX + (FINGER_CURL if hanging else 0)) * DEG))
    return {"root": [0, 0, 0], "q": q}


slug, out = sys.argv[1], sys.argv[2]
clip = {
    "source": "designed pose, src/lib/kinematics/%s.ts" % slug,
    "fps": N,
    "cycle": {"start": 0, "end": N, "seconds": 1.0},
    "samples": [sample(POSES[slug](i / N), HANGING.get(slug, False)) for i in range(N)],
}
json.dump(clip, open(out, "w"))
print("wrote", out, N, "samples")
