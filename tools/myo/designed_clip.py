"""Write a designed movement as a MotionClip3D for the figure.

    tools/myo/.venv/bin/python tools/myo/designed_clip.py pull-up|lunge|push-up out.json

Designed, not captured: textbook form for movements with no usable free
capture (Mixamo has no pull-up or lunge; CMU's lunge performer used a wide
stance and threw punches; nobody has a floor push-up). The pull-up mirrors
src/lib/kinematics/pull-up.ts; keep the constants in step, the TypeScript is
the source of truth for what the fallback shows.

Conventions, as in AnatomyFigure.tsx's sagittal path: every rotation is
about the world X axis, applied to the bone's rest orientation, and a
positive angle swings the bone's far end BACKWARD (-Z): hip extension,
knee flexion, ankle plantarflexion are positive; a thigh swung forward is
negative. The figure rests upright at the origin, facing +Z, feet at z = 0.
`root` is the pelvis displacement from rest in metres.
"""

import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigfk import load_rig

DEG = math.pi / 180
N = 64


def rx(a):
    return [math.sin(a / 2), 0.0, 0.0, math.cos(a / 2)]


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]


def rot_x(a, v):
    """Rotate vector v about world X by a (radians)."""
    c, s = math.cos(a), math.sin(a)
    return np.array([v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c])


def smooth(t):
    return t * t * (3 - 2 * t)


def keyed(keys, t):
    """Piecewise smoothstep through (t, value) keys."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0)) if t1 > t0 else v1
    return keys[-1][1]


IDENT = [0.0, 0.0, 0.0, 1.0]
# A half turn about the rest arm axis (vertical): palms forward -> palms back.
PRONATE = [0.0, 1.0, 0.0, 0.0]

# ---------- the rig ----------
rig = load_rig()  # app frame: Y-up, +Z forward, metres
L_THIGH = float(np.linalg.norm(rig["knee.l"] - rig["hip.l"]))
L_SHIN = float(np.linalg.norm(rig["ankle.l"] - rig["knee.l"]))
FOOT = rig["toe.l"] - rig["ankle.l"]  # rest foot vector, ankle -> toe
L_UPPER = float(np.linalg.norm(rig["elbow.l"] - rig["shoulder.l"]))
L_FORE = float(np.linalg.norm(rig["wrist.l"] - rig["elbow.l"]))


def angle_of(v):
    """The rx angle that takes the rest 'down' vector (0,-1,0) to unit direction v (sagittal)."""
    return math.atan2(-v[2], -v[1])


def two_link(root, target, l1, l2, bend_forward):
    """Sagittal 2-link IK: angles (rx convention) of the first and second link from root to target.
    bend_forward: the joint bends toward +Z (a knee) or -Z (an elbow)."""
    d = target - root
    dist = float(np.linalg.norm(d))
    dist = min(dist, l1 + l2 - 1e-4)
    u = d / max(float(np.linalg.norm(d)), 1e-9)
    cos_a = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)
    alpha = math.acos(max(-1.0, min(1.0, cos_a)))  # between the first link and the root->target line
    # Rotating the root->target direction about X by -alpha moves its tip forward (+Z); +alpha backward.
    first = rot_x(-alpha if bend_forward else alpha, u)
    joint = root + first * l1
    second = (target - joint) / max(float(np.linalg.norm(target - joint)), 1e-9)
    return angle_of(first), angle_of(second), joint


# ---------- pull-up (mirrors src/lib/kinematics/pull-up.ts) ----------
HANG = {"armFwd": 175, "elbow": 5, "trunk": 2, "thigh": -2, "knee": 4}
TOP = {"armFwd": 38, "elbow": 138, "trunk": -6, "thigh": -8, "knee": 18}
POINT = 35
WRIST_FLEX = 45  # AnatomyFigure.tsx, hanging
FINGER_CURL = 105


def pull_up_sample(t):
    up = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    mix = lambda k: (HANG[k] + (TOP[k] - HANG[k]) * up) * DEG
    thigh = mix("thigh")
    shin = thigh + mix("knee")
    foot = shin + POINT * DEG
    trunk, arm, elbow = mix("trunk"), -mix("armFwd"), mix("elbow")
    twist = lambda r: qmul(r, PRONATE)
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": rx(0.2 * trunk), "head": rx(0.2 * trunk)}
    for S in ("L", "R"):
        q["thigh." + S] = rx(thigh)
        q["shin." + S] = rx(shin)
        q["foot." + S] = rx(foot)
        q["upper_arm." + S] = rx(arm)
        q["forearm." + S] = twist(rx(arm - elbow))
        q["hand." + S] = twist(rx(arm - elbow + WRIST_FLEX * DEG))
        q["fingers." + S] = twist(rx(arm - elbow + (WRIST_FLEX + FINGER_CURL) * DEG))
    return {"root": [0, 0, 0], "q": q}


# ---------- forward lunge, left leg stepping ----------
# Back (right) leg by design, its toes planted; front (left) leg by IK to a
# planted foot; the pelvis follows the back leg. Bottom at t = 0.55: front
# thigh horizontal, front shin vertical, back knee a hand above the floor.
LUNGE = {
    # The back leg leans forward (heel rising) while the front foot is in the
    # air, so the hips travel with the step and the front knee lands bent
    # rather than reaching at full stretch. Same on the way back.
    # The descent begins as the front foot lands, and the foot leaves before
    # the drive is complete: standing tall on a foot 0.98 m ahead would need
    # a straight front leg, which is not how a lunge is done.
    "back_thigh": [(0, 0), (0.10, 0), (0.30, 28), (0.36, 24), (0.55, 16), (0.72, 22), (0.82, 26), (0.95, 0), (1, 0)],
    "back_knee": [(0, 0), (0.10, 0), (0.30, 14), (0.36, 44), (0.55, 88), (0.72, 48), (0.82, 14), (0.95, 0), (1, 0)],
    "back_foot": [(0, 0), (0.10, 0), (0.30, 38), (0.36, 44), (0.55, 55), (0.72, 44), (0.82, 36), (0.95, 0), (1, 0)],
    "front_z": [(0, 0), (0.10, 0), (0.24, 0.5), (0.34, 1.0), (0.72, 1.0), (0.84, 0.5), (0.95, 0), (1, 0)],  # fraction of the step
    "front_lift": [(0, 0), (0.10, 0), (0.22, 1.0), (0.34, 0), (0.72, 0), (0.82, 1.0), (0.95, 0), (1, 0)],
    "trunk": [(0, 0), (0.30, 3), (0.55, 6), (0.80, 3), (1, 0)],
}
LUNGE_LIFT = 0.10


def lunge_back_leg(t):
    """Back leg joints from its planted toe: (hip_r, knee_r, ankle_r, angles)."""
    th, kn, ft = (keyed(LUNGE[k], t) * DEG for k in ("back_thigh", "back_knee", "back_foot"))
    toe = rig["toe.r"]
    ankle = toe - rot_x(ft, FOOT)
    shin_dir = rot_x(th + kn, np.array([0.0, -1.0, 0.0]))
    knee = ankle - shin_dir * L_SHIN
    thigh_dir = rot_x(th, np.array([0.0, -1.0, 0.0]))
    hip = knee - thigh_dir * L_THIGH
    return hip, ankle, th, th + kn, ft


def lunge_step():
    """Step length that puts the front thigh horizontal with a vertical shin at the bottom."""
    hip_r, *_ = lunge_back_leg(0.55)
    hip_l = hip_r + (rig["hip.l"] - rig["hip.r"])
    return float(hip_l[2] + L_THIGH - rig["ankle.l"][2])


LUNGE_STEP = lunge_step()


def lunge_sample(t):
    hip_r, ankle_r, th_b, sh_b, ft_b = lunge_back_leg(t)
    hip_l = hip_r + (rig["hip.l"] - rig["hip.r"])
    target = rig["ankle.l"] + np.array([0.0, LUNGE_LIFT * keyed(LUNGE["front_lift"], t), LUNGE_STEP * keyed(LUNGE["front_z"], t)])
    th_f, sh_f, _ = two_link(hip_l, target, L_THIGH, L_SHIN, bend_forward=True)
    trunk = keyed(LUNGE["trunk"], t) * DEG
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": IDENT, "head": IDENT}
    q["thigh.L"], q["shin.L"], q["foot.L"] = rx(th_f), rx(sh_f), IDENT
    q["thigh.R"], q["shin.R"], q["foot.R"] = rx(th_b), rx(sh_b), rx(ft_b)
    for S in ("L", "R"):
        for b in ("upper_arm", "forearm", "hand", "fingers"):
            q["%s.%s" % (b, S)] = IDENT
    root = hip_r - rig["hip.r"]
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- push-up ----------
# The body is one straight line from the toes to the shoulders, pivoting on
# the planted toes; the hands stay where the straight arms put them at the
# top, and the arms are solved by IK as the shoulders drop. Elbows bend
# straight back (a close-grip push-up; the atlas has no anterior deltoid).
PUSHUP_TOP_SHOULDER = None  # set below from the arm length
PUSHUP_BOTTOM_SHOULDER = 0.20  # shoulder height at the bottom, metres: the chest a few centimetres off the floor


def pushup_sample(t):
    down = 0.5 - 0.5 * math.cos(2 * math.pi * t)  # 0 at the top, 1 at the bottom (t = 0.5)
    toe = rig["toe.r"]
    body_len = float(np.linalg.norm(rig["shoulder.r"] - rig["hip.r"]) + L_THIGH + L_SHIN)
    foot_angle = 88 * DEG
    ankle = toe - rot_x(foot_angle, FOOT)
    # Body line angle above the floor from the shoulder height wanted.
    h_top = L_UPPER + L_FORE
    h = h_top + (PUSHUP_BOTTOM_SHOULDER - h_top) * down
    beta = math.asin(max(-1.0, min(1.0, (h - ankle[1]) / body_len)))
    a = math.pi / 2 - beta  # rx angle of trunk, thighs and shins: the far end swings back
    body_dir = rot_x(a, np.array([0.0, -1.0, 0.0]))  # toward the feet
    knee = ankle - body_dir * L_SHIN
    hip = knee - body_dir * L_THIGH
    shoulder = hip - body_dir * float(np.linalg.norm(rig["shoulder.r"] - rig["hip.r"]))
    # Hands: on the floor under the top-of-rep shoulders (sagittal), fixed through the rep.
    if pushup_sample.hand is None:
        pushup_sample.hand = np.array([shoulder[0], 0.0, shoulder[2]])
    hand = pushup_sample.hand
    up_a, fore_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
    trunk = a
    head = a - 25 * DEG  # lift the gaze a little off the floor
    palm_down = lambda r: qmul(r, PRONATE)
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": rx(head), "head": rx(head)}
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(a), rx(a), rx(foot_angle)
        q["upper_arm." + S] = rx(up_a)
        q["forearm." + S] = palm_down(rx(fore_a))
        q["hand." + S] = palm_down(rx(-90 * DEG))  # flat on the floor, fingers forward
        q["fingers." + S] = palm_down(rx(-90 * DEG))
    root = hip - rig["hip.r"]
    return {"root": [round(float(v), 4) for v in root], "q": q}


pushup_sample.hand = None

CLIPS = {
    "pull-up": (pull_up_sample, "designed pose, src/lib/kinematics/pull-up.ts"),
    "lunge": (lunge_sample, "designed forward lunge, tools/myo/designed_clip.py"),
    "push-up": (pushup_sample, "designed push-up, tools/myo/designed_clip.py"),
}

slug, out = sys.argv[1], sys.argv[2]
fn, source = CLIPS[slug]
samples = [fn(i / N) for i in range(N)]
clip = {"source": source, "fps": N, "cycle": {"start": 0, "end": N, "seconds": 1.0}, "samples": samples}
json.dump(clip, open(out, "w"))
roots = np.array([s["root"] for s in samples])
print("wrote", out, N, "samples; root y %.2f..%.2f z %.2f..%.2f" % (roots[:, 1].min(), roots[:, 1].max(), roots[:, 2].min(), roots[:, 2].max()))
if slug == "lunge":
    # The front knee must stay bent while the foot is in the air (t 0.12-0.30 and 0.82-0.95).
    bends = []
    for i in range(N):
        t = i / N
        if 0.12 <= t <= 0.34 or 0.80 <= t <= 0.95:
            hip_r, *_ = lunge_back_leg(t)
            hip_l = hip_r + (rig["hip.l"] - rig["hip.r"])
            target = rig["ankle.l"] + np.array([0.0, LUNGE_LIFT * keyed(LUNGE["front_lift"], t), LUNGE_STEP * keyed(LUNGE["front_z"], t)])
            th, sh, _ = two_link(hip_l, target, L_THIGH, L_SHIN, bend_forward=True)
            bends.append((t, math.degrees(sh - th)))
    print("lunge step %.2f m; front knee bend while the foot is in the air: %.0f..%.0f deg" % (LUNGE_STEP, min(b for _, b in bends), max(b for _, b in bends)))
    print("  " + "  ".join("%.2f:%.0f" % tb for tb in bends[::2]))
