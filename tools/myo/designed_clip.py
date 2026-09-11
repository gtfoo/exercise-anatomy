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
    # Back leg stays where it stands, knee slightly bent through the step and
    # the heel rising as the body comes forward; at the bottom the back thigh
    # is vertical and the shin horizontal (knee 90), like the front knee.
    "back_thigh": [(0, 0), (0.10, 0), (0.30, 10), (0.38, 14), (0.55, 0), (0.70, 14), (0.82, 10), (0.95, 0), (1, 0)],
    "back_knee": [(0, 0), (0.10, 0), (0.22, 20), (0.30, 36), (0.38, 60), (0.55, 90), (0.70, 60), (0.82, 24), (0.95, 0), (1, 0)],
    "back_foot": [(0, 0), (0.10, 0), (0.30, 28), (0.38, 42), (0.55, 65), (0.70, 42), (0.82, 25), (0.95, 0), (1, 0)],
    "front_z": [(0, 0), (0.10, 0), (0.24, 0.5), (0.36, 1.0), (0.70, 1.0), (0.84, 0.5), (0.95, 0), (1, 0)],  # fraction of the step
    "front_lift": [(0, 0), (0.10, 0), (0.22, 1.0), (0.36, 0), (0.70, 0), (0.82, 1.0), (0.95, 0), (1, 0)],
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


def mirror_sample(s):
    """Swap left and right. Every designed rotation here is about the world X
    axis, which is its own mirror image across the sagittal plane, so a swap
    of the .L/.R keys and a negated root x is the whole mirror."""
    q = {}
    for k, v in s["q"].items():
        k2 = k[:-2] + ".R" if k.endswith(".L") else k[:-2] + ".L" if k.endswith(".R") else k
        q[k2] = v
    r = s["root"]
    return {"root": [-r[0], r[1], r[2]], "q": q}


def lunge_alternating_sample(t):
    """One cycle: a lunge on the left leg, then the same on the right."""
    return lunge_sample(t * 2) if t < 0.5 else mirror_sample(lunge_sample((t - 0.5) * 2))


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

# ---------- L-sit on parallel bars ----------
# Straight support (arms locked, body hanging vertical, feet off the floor)
# to an L-sit (legs horizontal, knees locked, toes pointed) and back. The
# hands rest on top of the bars, fingers forward, and stay put; the trunk
# leans back a little in the L and the pelvis follows so the wrists do not move.
LSIT_RAISE = 0.15  # the support lifts the whole body this far off the floor
LSIT = {
    "hip": [(0, 0), (0.08, 0), (0.42, -92), (0.62, -92), (0.95, 0), (1, 0)],  # thigh angle: negative = forward
    "trunk": [(0, 0), (0.08, 0), (0.42, 10), (0.62, 10), (0.95, 0), (1, 0)],
    "foot": [(0, 10), (0.08, 10), (0.42, 40), (0.62, 40), (0.95, 10), (1, 10)],  # pointed toes
}


def lsit_sample(t):
    thigh = keyed(LSIT["hip"], t) * DEG
    trunk = keyed(LSIT["trunk"], t) * DEG
    foot = keyed(LSIT["foot"], t) * DEG
    # Wrists fixed: the pelvis moves so a trunk lean does not carry the shoulders (and hands) with it.
    d = rig["shoulder.r"] - rig["hip.r"]
    root = np.array([0.0, LSIT_RAISE, 0.0]) - (rot_x(trunk, d) - d)
    palm_down = lambda r: qmul(r, PRONATE)
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": IDENT, "head": IDENT}
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(thigh), rx(thigh), rx(thigh + foot)
        q["upper_arm." + S], q["forearm." + S] = IDENT, IDENT  # locked straight, vertical
        q["hand." + S] = palm_down(rx(-90 * DEG))  # flat on the bar, fingers forward
        q["fingers." + S] = palm_down(rx(-60 * DEG))  # fingertips over the far side
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- clamshell, lying on the right side ----------
# Body along the X axis, head toward -X, belly toward +Z (the camera), lower
# arm stretched under the head, upper hand on the floor in front. Hips bent
# 45, knees 90, feet together; the top knee opens 40 degrees by rotating the
# whole top leg about the line from its hip to its ankle, so the feet stay
# together, then closes.
CLAM_OPEN = [(0, 0), (0.05, 0), (0.42, 40), (0.58, 40), (0.95, 0), (1, 0)]
CLAM_HIP_FLEX = 45 * DEG
CLAM_KNEE = 90 * DEG


def q_axis(axis, a):
    axis = np.asarray(axis, dtype=float)
    axis = axis / np.linalg.norm(axis)
    s = math.sin(a / 2)
    return [float(axis[0] * s), float(axis[1] * s), float(axis[2] * s), math.cos(a / 2)]


def q_rot(q, v):
    """Rotate vector v by quaternion q = [x, y, z, w]."""
    x, y, z, w = q
    u = np.array([x, y, z])
    v = np.asarray(v, dtype=float)
    return v + 2 * w * np.cross(u, v) + 2 * np.cross(u, np.cross(u, v))


def clam_sample(t):
    # Upright -> lying on the LEFT side: a quarter turn about the forward axis
    # the other way, so the head goes to +X and the belly stays toward +Z, the
    # camera. The top leg is then the right one.
    roll = q_axis([0, 0, 1], -90 * DEG)
    # Legs: hip flexion swings the thigh toward the belly (+Z). Lying on the
    # left side the thighs point to -X, so the turn about the world Y axis is
    # positive to bring the knees forward (it was negative for the right side,
    # which sent the knees behind the body: "feet facing the wrong side").
    thigh = qmul(q_axis([0, 1, 0], CLAM_HIP_FLEX), roll)
    shin = qmul(q_axis([0, 1, 0], CLAM_HIP_FLEX - CLAM_KNEE), roll)
    # Pelvis placed so the lower hip rests a thigh's thickness above the floor.
    hip_low_target = np.array([0.0, 0.12, 0.0])
    pelvis_pos = hip_low_target - q_rot(roll, rig["hip.l"] - rig["pelvis"])
    root = pelvis_pos - rig["pelvis"]
    hip_top = pelvis_pos + q_rot(roll, rig["hip.r"] - rig["pelvis"])
    down = np.array([0.0, -1.0, 0.0])
    knee_top = hip_top + q_rot(thigh, down) * L_THIGH
    ankle_top = knee_top + q_rot(shin, down) * L_SHIN
    # Open the top leg about its hip-to-ankle line; the sign that lifts the knee is the one wanted.
    axis = ankle_top - hip_top
    a = keyed(CLAM_OPEN, t) * DEG
    q_open = q_axis(axis, a)
    if q_rot(q_open, knee_top - hip_top)[1] < (knee_top - hip_top)[1] - 1e-6:
        q_open = q_axis(axis, -a)
    q = {"pelvis": roll, "spine": roll, "neck": roll, "head": roll}
    q["thigh.L"], q["shin.L"], q["foot.L"] = thigh, shin, shin
    q["thigh.R"], q["shin.R"], q["foot.R"] = qmul(q_open, thigh), qmul(q_open, shin), qmul(q_open, shin)
    # Lower (left) arm overhead along the floor (+X, the head end). The top arm
    # rests along the top of the body with the hand on the hip: the same roll
    # as the trunk, so nothing lies across the belly.
    under = q_axis([0, 0, 1], 90 * DEG)
    for b in ("upper_arm", "forearm", "hand", "fingers"):
        q[b + ".L"] = under
        q[b + ".R"] = roll
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- dumbbell lateral raise ----------
# Standing, a dumbbell in each hand at the sides with the palms facing the
# thighs; the arms rise to shoulder height in the scapular plane (25 degrees
# ahead of pure sideways), elbows nearly straight, palms ending face down,
# and lower under control. The dumbbells are drawn by the viewer, attached
# to the hand bones.
RAISE = [(0, 0), (0.05, 0), (0.45, 88), (0.55, 88), (0.95, 0), (1, 0)]


def lateral_raise_sample(t):
    a = keyed(RAISE, t) * DEG
    q = {"pelvis": IDENT, "spine": IDENT, "neck": IDENT, "head": IDENT}
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = IDENT, IDENT, IDENT
    for S, sign in (("L", 1), ("R", -1)):
        palm_in = q_axis([0, 1, 0], -sign * 90 * DEG)  # rest palm forward -> facing the thigh
        raise_q = qmul(q_axis([0, 1, 0], -sign * 25 * DEG), q_axis([0, 0, 1], sign * a))  # out to the side, then a little forward
        upper = qmul(raise_q, IDENT)
        lower = qmul(qmul(q_axis([0, 1, 0], -sign * 25 * DEG), q_axis([0, 0, 1], sign * a * 0.92)), palm_in)  # 8% less: a soft elbow
        q["upper_arm." + S] = upper
        q["forearm." + S] = lower
        q["hand." + S] = lower
        q["fingers." + S] = qmul(lower, rx(-70 * DEG))  # wrapped round the handle
    return {"root": [0, 0, 0], "q": q}


def stand_sample(t):
    """The figure's own rest: standing, arms at the sides. The atlas page."""
    q = {b: IDENT for b in ("pelvis", "spine", "neck", "head")}
    for S in ("L", "R"):
        for b in ("thigh", "shin", "foot", "upper_arm", "forearm", "hand", "fingers"):
            q["%s.%s" % (b, S)] = IDENT
    return {"root": [0, 0, 0], "q": q}


# ---------- helpers for the whole-body designs below ----------
# Convention reminder (rx, world X axis): for a bone that rests pointing DOWN
# (thigh, shin, foot, arm) a positive angle swings its far end BACKWARD; for
# the trunk and head, which rest pointing UP, a positive angle tips the top
# FORWARD. So: hip flexion is a negative thigh angle, trunk flexion positive.
UP = np.array([0.0, 1.0, 0.0])
DOWN = np.array([0.0, -1.0, 0.0])
L_TRUNK = float(np.linalg.norm(rig["shoulder.l"] - rig["hip.l"]))  # hip to shoulder, roughly along the trunk
SHOULDER_X = float(rig["shoulder.l"][0])
HAND_LEN = float(np.linalg.norm(rig["mcp.l"] - rig["wrist.l"]))


def all_ident():
    q = {b: IDENT for b in ("pelvis", "spine", "neck", "head")}
    for S in ("L", "R"):
        for b in ("thigh", "shin", "foot", "upper_arm", "forearm", "hand", "fingers"):
            q["%s.%s" % (b, S)] = IDENT
    return q


def set_legs(q, thigh, shin, foot, side="LR"):
    for S in side:
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(thigh), rx(shin), rx(foot)


def set_arms(q, upper, fore, hand=None, side="LR", palm_down=False):
    for S in side:
        u, f, h = rx(upper), rx(fore), rx(hand if hand is not None else fore)
        if palm_down:
            f, h = qmul(f, PRONATE), qmul(h, PRONATE)
        q["upper_arm." + S], q["forearm." + S], q["hand." + S], q["fingers." + S] = u, f, h, h


def root_for_hip(hip_pos, trunk_q=IDENT):
    """Root displacement that puts the hip joints' midpoint at hip_pos with the pelvis rotated by trunk_q."""
    mid = (rig["hip.l"] + rig["hip.r"]) / 2
    pelvis_pos = hip_pos - q_rot(trunk_q, mid - rig["pelvis"])
    return pelvis_pos - rig["pelvis"], pelvis_pos


def shoulder_from(pelvis_pos, trunk_q, side="l"):
    return pelvis_pos + q_rot(trunk_q, rig["shoulder." + side] - rig["pelvis"])


def hip_from(pelvis_pos, trunk_q, side="l"):
    return pelvis_pos + q_rot(trunk_q, rig["hip." + side] - rig["pelvis"])


# ---------- forearm plank (hold) ----------
def plank_sample(t):
    q = all_ident()
    toe = rig["toe.r"]
    body_len = L_TRUNK + L_THIGH + L_SHIN
    foot_angle = 88 * DEG
    ankle = toe - rot_x(foot_angle, FOOT)
    h = L_UPPER + 0.02  # shoulders one upper-arm above the floor: elbows under them, forearms flat
    beta = math.asin(max(-1.0, min(1.0, (h - ankle[1]) / body_len)))
    a = math.pi / 2 - beta
    body_dir = rot_x(a, DOWN)
    knee = ankle - body_dir * L_SHIN
    hip = knee - body_dir * L_THIGH
    q["pelvis"], q["spine"] = rx(a), rx(a)
    q["neck"], q["head"] = rx(a - 30 * DEG), rx(a - 30 * DEG)
    set_legs(q, a, a, foot_angle)
    set_arms(q, 0.0, -90 * DEG, palm_down=True)  # upper arm vertical, forearm forward along the floor
    root = hip - rig["hip.r"]
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- cycling ----------
# Seated on a drawn bike: pedal circle (bottom bracket) ahead of and below
# the hips, cranks half a turn apart, legs by IK to the pedals, trunk leant
# to the handlebar with the arms by IK. Scene.tsx draws the same bike.
BIKE_BB = np.array([0.0, 0.30, 0.20])
BIKE_CRANK = 0.17
BIKE_SADDLE_Y = 0.92
BIKE_BAR = np.array([0.0, 0.98, 0.55])


def cycling_sample(t):
    q = all_ident()
    trunk = 42 * DEG
    hip_mid = np.array([0.0, BIKE_SADDLE_Y, 0.0])
    root, pelvis_pos = root_for_hip(hip_mid, rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk - 35 * DEG), rx(trunk - 35 * DEG)
    for S, side, phase in (("L", "l", 0.0), ("R", "r", math.pi)):
        th = -2 * math.pi * t + phase  # negative: the foot goes forward over the top and down the front (pedalling forward)
        pedal = BIKE_BB + np.array([0.0, -BIKE_CRANK * math.cos(th), BIKE_CRANK * math.sin(th)])
        ankle_target = pedal + np.array([0.0, 0.07, -0.04])
        hip = hip_from(pelvis_pos, rx(trunk), side)
        hip = np.array([rig["hip." + side][0], hip[1], hip[2]])
        th_a, sh_a, _ = two_link(hip, ankle_target, L_THIGH, L_SHIN, bend_forward=True)
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(th_a), rx(sh_a), rx(15 * DEG - 10 * DEG * math.cos(th))
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([SHOULDER_X * (1 if side == "l" else -1), BIKE_BAR[1], BIKE_BAR[2]])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a - 20 * DEG), PRONATE)
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- yoga holds ----------
def boat_sample(t):
    """Navasana: seated, trunk leant back 30, legs straight up at 30 above horizontal, arms forward."""
    q = all_ident()
    trunk = -30 * DEG
    root, _ = root_for_hip(np.array([0.0, 0.13, 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk + 20 * DEG), rx(trunk + 20 * DEG)
    set_legs(q, -120 * DEG, -120 * DEG, -120 * DEG + 30 * DEG)
    set_arms(q, -90 * DEG, -90 * DEG, palm_down=False)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def warrior3_sample(t):
    """Virabhadrasana III: standing on the left leg, trunk and back leg horizontal, arms forward."""
    q = all_ident()
    trunk = 88 * DEG
    hip_l = rig["hip.l"].copy()  # the standing hip stays put; the converter pins the left foot
    root, _ = root_for_hip(np.array([0.0, hip_l[1], 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk - 60 * DEG), rx(trunk - 60 * DEG)
    set_legs(q, 3 * DEG, 3 * DEG, 0.0, side="L")
    set_legs(q, 92 * DEG, 92 * DEG, 92 * DEG + 25 * DEG, side="R")
    set_arms(q, -88 * DEG, -88 * DEG)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def wheel_sample(t):
    """Urdhva Dhanurasana: belly up on hands and feet, the trunk arched back until the head hangs toward the floor."""
    q = all_ident()
    trunk = -125 * DEG
    knee_f, shin_a = -52 * DEG, 0.0  # thighs sloping forward-down from the lifted hips, shins vertical
    hip_y = 0.09 + L_SHIN + L_THIGH * math.cos(knee_f)
    root, pelvis_pos = root_for_hip(np.array([0.0, hip_y, 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk - 20 * DEG), rx(trunk - 20 * DEG)
    set_legs(q, knee_f, shin_a, 0.0)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([shoulder[0], 0.03, shoulder[2] - 0.12])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a - 90 * DEG), PRONATE)  # palms flat on the floor, fingers toward the feet
    return {"root": [round(float(v), 4) for v in root], "q": q}


def crow_sample(t):
    """Bakasana: hands on the floor, elbows bent, knees on the backs of the upper arms, feet lifted behind.
    The legs spread 32 degrees so the knees sit outside the arms, not through them (owner, 2026-09-11)."""
    q = all_ident()
    trunk = 108 * DEG  # chest leant forward past the hands; the elbows bend about 90 degrees under it
    root, pelvis_pos = root_for_hip(np.array([0.0, 0.55, 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk - 100 * DEG), rx(trunk - 100 * DEG)  # gaze forward
    for S, sgn in (("L", 1), ("R", -1)):
        spread = q_axis([0, 0, 1], sgn * 28 * DEG)  # about the forward axis: the far end of a hanging bone swings outward
        q["thigh." + S] = qmul(rx(-55 * DEG), spread)  # knees forward, up and out, onto the backs of the upper arms
        q["shin." + S] = qmul(rx(95 * DEG), spread)  # feet tucked back under the buttocks
        q["foot." + S] = qmul(rx(125 * DEG), spread)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([shoulder[0], 0.03, shoulder[2] - 0.12])  # the hands behind the shoulders: the elbows point back under the knees
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a - 90 * DEG), PRONATE)  # palms flat, fingers forward
    return {"root": [round(float(v), 4) for v in root], "q": q}


def side_plank_sample(t):
    """Vasisthasana: on the left hand and the outside of the left foot, body straight and tilted up, top arm raised."""
    tilt = 22 * DEG
    roll = q_axis([0, 0, 1], -(90 * DEG - tilt))  # lying on the left side, head to +X, then lifted 22 degrees
    q = {"pelvis": roll, "spine": roll, "neck": roll, "head": roll}
    for S in ("L", "R"):
        q["thigh." + S] = q["shin." + S] = q["foot." + S] = roll
    for b in ("upper_arm", "forearm", "hand", "fingers"):
        q[b + ".L"] = IDENT  # straight down to the floor
        q[b + ".R"] = q_axis([0, 0, 1], 180 * DEG)  # straight up
    # Root: the lower (left) foot on the floor, the body line rising toward the head.
    body_dir = q_rot(roll, UP)
    ankle_low = np.array([0.0, 0.06, 0.0])
    hip_mid = ankle_low + body_dir * (L_SHIN + L_THIGH)
    root, _ = root_for_hip(hip_mid, roll)
    return {"root": [round(float(v), 4) for v in root], "q": q}


CLIPS = {
    "stand": (stand_sample, "rest pose, tools/myo/designed_clip.py"),
    "plank": (plank_sample, "designed forearm plank, tools/myo/designed_clip.py"),
    "cycling": (cycling_sample, "designed cycling, tools/myo/designed_clip.py"),
    "boat-pose": (boat_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "warrior-3": (warrior3_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "wheel-pose": (wheel_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "crow-pose": (crow_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "side-plank": (side_plank_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "pull-up": (pull_up_sample, "designed pose, src/lib/kinematics/pull-up.ts"),
    "lateral-raise": (lateral_raise_sample, "designed dumbbell lateral raise, tools/myo/designed_clip.py"),
    "clamshell": (clam_sample, "designed clamshell, tools/myo/designed_clip.py"),
    "l-sit": (lsit_sample, "designed L-sit on parallel bars, tools/myo/designed_clip.py"),
    "lunge": (lunge_alternating_sample, "designed forward lunge, left then right, tools/myo/designed_clip.py"),
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
        if 0.12 <= t <= 0.36 or 0.78 <= t <= 0.95:
            hip_r, *_ = lunge_back_leg(t)
            hip_l = hip_r + (rig["hip.l"] - rig["hip.r"])
            target = rig["ankle.l"] + np.array([0.0, LUNGE_LIFT * keyed(LUNGE["front_lift"], t), LUNGE_STEP * keyed(LUNGE["front_z"], t)])
            th, sh, _ = two_link(hip_l, target, L_THIGH, L_SHIN, bend_forward=True)
            bends.append((t, math.degrees(sh - th)))
    print("lunge step %.2f m; front knee bend while the foot is in the air: %.0f..%.0f deg" % (LUNGE_STEP, min(b for _, b in bends), max(b for _, b in bends)))
    print("  " + "  ".join("%.2f:%.0f" % tb for tb in bends[::2]))
