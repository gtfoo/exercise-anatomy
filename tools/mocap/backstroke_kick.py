"""Give a captured backstroke a swimmer's legs and head.

    python3 backstroke_kick.py <in-3d.json> <out-3d.json>

CMU subject 126 mimed the backstroke lying on a bench (trial 1, frames 217-297): the trunk lies flat and the arms
circle, but the legs hang off the bench's end, the feet 15-60 cm below the hips, and the head is lifted to look at
the feet. A floating swimmer's legs trail level behind the hips and the head lies back on the water. So the arms,
shoulders, trunk and pelvis (with its roll) stay as captured; the head follows the trunk; and each leg is a
designed six-beat flutter kick (three kicks per leg per two-arm cycle, the legs in opposition) hung from the
captured pelvis, so it rolls with the body. And each arm is opened a little away from the side while it points
along the body toward the feet (FINISH): the pull ends with the hand by the thigh, and on this figure, wider at the
hips than the swimmer, the captured hand went up to 6.7 cm into the hip. Rotations are world rotations from the
rest pose, [x, y, z, w]; a
positive angle about x swings a limb's far end toward the body's back, which on a swimmer lying face up is down
into the water (the kick's downbeat, the knee's bend, the toes' point).
"""

import json
import math
import sys

KICKS = 3  # per leg per cycle: a six-beat kick
THIGH = 10.0  # each thigh's swing either side of the trunk's line, degrees
KNEE = (8.0, 20.0)  # the knee's least bend, and how much more it bends before each upbeat
POINT = 65.0  # the toes pointed, the foot in line with the shin
FINISH = 32.0  # how far an arm along the side is opened out from it, degrees


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]


def rx(deg):
    a = math.radians(deg) / 2
    return [math.sin(a), 0.0, 0.0, math.cos(a)]


def qrot(q, v):
    x, y, z, w = q
    u = (x, y, z)
    cross = lambda a, b: (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
    c1 = cross(u, v)
    c2 = cross(u, c1)
    return tuple(v[i] + 2 * w * c1[i] + 2 * c2[i] for i in range(3))


def qaxis(axis, deg):
    a = math.radians(deg) / 2
    n = math.sqrt(sum(c * c for c in axis))
    return [axis[0] / n * math.sin(a), axis[1] / n * math.sin(a), axis[2] / n * math.sin(a), math.cos(a)]


def main():
    src, out = sys.argv[1], sys.argv[2]
    clip = json.load(open(src))
    n = len(clip["samples"])
    for i, s in enumerate(clip["samples"]):
        q = s["q"]
        pelvis = q["pelvis"]
        q["neck"] = list(q["spine"])
        q["head"] = list(q["spine"])
        feet = qrot(q["spine"], (0.0, -1.0, 0.0))  # along the body toward the feet
        front = qrot(q["spine"], (0.0, 0.0, 1.0))  # out of the chest
        for side, sgn in (("L", 1.0), ("R", -1.0)):
            arm = qrot(q["upper_arm." + side], (0.0, -1.0, 0.0))
            w = max(0.0, sum(a * b for a, b in zip(arm, feet)))  # 1 along the side, 0 once the arm is up (squared, it's pressed the armpit into the side mid-pull)
            turn = qaxis(front, sgn * FINISH * w)
            for b in ("upper_arm.", "forearm.", "hand."):
                q[b + side] = [round(v, 5) for v in qmul(turn, q[b + side])]
        for side, phase in (("L", 0.0), ("R", math.pi)):
            phi = 2 * math.pi * KICKS * i / n + phase
            thigh = THIGH * math.sin(phi)
            knee = KNEE[0] + KNEE[1] * (0.5 - 0.5 * math.cos(phi - 0.6))  # bent most as the thigh starts back up
            q["thigh." + side] = [round(v, 5) for v in qmul(pelvis, rx(thigh))]
            q["shin." + side] = [round(v, 5) for v in qmul(pelvis, rx(thigh + knee))]
            q["foot." + side] = [round(v, 5) for v in qmul(pelvis, rx(thigh + knee + POINT))]
    clip["legs"] = "designed six-beat flutter kick (tools/mocap/backstroke_kick.py); the take's legs hung off a bench"
    json.dump(clip, open(out, "w"))
    print("wrote", out, n, "samples")


if __name__ == "__main__":
    main()
