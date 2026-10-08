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


def splined(keys, t):
    """Monotone cubic (Fritsch-Butland) through (t, value) keys: continuous velocity through every key, no
    overshoot, flat where the keys are flat. `keyed` stops dead at each key, which made a sequence with many keys
    (the muscle-up) look jerky (owner, 2026-09-11)."""
    ts = [k[0] for k in keys]
    vs = [k[1] for k in keys]
    n = len(keys)
    if t <= ts[0]:
        return vs[0]
    if t >= ts[-1]:
        return vs[-1]
    h = [ts[i + 1] - ts[i] for i in range(n - 1)]
    d = [(vs[i + 1] - vs[i]) / h[i] if h[i] > 0 else 0.0 for i in range(n - 1)]
    m = [0.0] * n
    for i in range(1, n - 1):
        if d[i - 1] * d[i] <= 0:
            m[i] = 0.0
        else:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    for i in range(n - 1):
        if t <= ts[i + 1]:
            u = (t - ts[i]) / h[i]
            h00, h10, h01, h11 = 2 * u**3 - 3 * u**2 + 1, u**3 - 2 * u**2 + u, -2 * u**3 + 3 * u**2, u**3 - u**2
            return h00 * vs[i] + h10 * m[i] * h[i] + h01 * vs[i + 1] + h11 * m[i + 1] * h[i]
    return vs[-1]


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


# ---------- planche and front lever ----------
def sequence(stages, t):
    """Blend through (t, sample) stages with a smoothstep between neighbours, held at the ends."""
    if t <= stages[0][0]:
        return stages[0][1]
    for (ta, a), (tb, b) in zip(stages, stages[1:]):
        if t <= tb:
            return blend_samples(a, b, smooth((t - ta) / (tb - ta)))
    return stages[-1][1]


def planche_stage(shoulder_y, shoulder_z, trunk_deg, thigh_deg, shin_deg, spread_deg, gaze_deg):
    """Hands planted at z = 0; the shoulders placed, the trunk hung from them, the legs by angle. The straight
    arms run from the shoulders to the hands, so the lean sets their angle."""
    q = all_ident()
    trunk = trunk_deg * DEG
    shoulder_mid = np.array([0.0, shoulder_y, shoulder_z])
    hip_mid = shoulder_mid - np.array([0.0, math.cos(trunk), math.sin(trunk)]) * L_TRUNK
    root, pelvis_pos = root_for_hip(hip_mid, rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk - gaze_deg * 0.5 * DEG), rx(trunk - gaze_deg * DEG)
    for S, sgn in (("L", 1), ("R", -1)):
        spread = q_axis([0, 0, 1], sgn * spread_deg * DEG)
        q["thigh." + S] = qmul(rx(thigh_deg * DEG), spread)
        q["shin." + S] = qmul(rx(shin_deg * DEG), spread)
        q["foot." + S] = qmul(rx((shin_deg + POINT) * DEG), spread)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([shoulder[0], 0.03, 0.0])
        d = hand - shoulder
        a = angle_of(d / max(float(np.linalg.norm(d)), 1e-9))
        q["upper_arm." + S], q["forearm." + S] = rx(a), qmul(rx(a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)  # palms flat, fingers forward
    return {"root": [round(float(v), 4) for v in root], "q": q}


def planche_sample(t):
    """A full planche: from a crouch with the hands planted, lean forward into a tuck planche (feet off the floor,
    knees to the chest), extend the legs to the full planche, hold, and back."""
    crouch = planche_stage(0.45, -0.05, 70, -85, 62, 24, 60)
    tuck = planche_stage(0.50, 0.18, 80, -60, 70, 10, 60)
    full = planche_stage(0.46, 0.25, 90, 90, 90, 4, 60)
    return sequence([(0, crouch), (0.22, tuck), (0.42, full), (0.68, full), (0.85, tuck), (1, crouch)], t)


def lever_stage(trunk_deg, thigh_deg, shin_deg, gaze_deg):
    """Hanging from the bar (the converter pins the wrists): the arms stay pointed at the bar while the body
    pivots at the shoulders."""
    q = all_ident()
    trunk = trunk_deg * DEG
    arm = -178 * DEG
    twist = lambda r: qmul(r, PRONATE)
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk + gaze_deg * 0.5 * DEG), rx(trunk + gaze_deg * DEG)
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(thigh_deg * DEG), rx(shin_deg * DEG), rx((shin_deg + POINT) * DEG)
        q["upper_arm." + S], q["forearm." + S] = rx(arm), twist(rx(arm))
        q["hand." + S] = twist(rx(arm + WRIST_FLEX * DEG))
        q["fingers." + S] = twist(rx(arm + (WRIST_FLEX + FINGER_CURL) * DEG))
    return {"root": [0, 0, 0], "q": q}


def front_lever_sample(t):
    """A front lever: from a dead hang, pull the body up into a tuck (face up, knees to the chest), extend the
    legs to the full horizontal lever, hold, and back."""
    hang = lever_stage(2, -2, 2, 0)
    tuck = lever_stage(-80, -165, -70, 30)
    full = lever_stage(-90, -90, -90, 30)
    return sequence([(0, hang), (0.2, tuck), (0.4, full), (0.68, full), (0.85, tuck), (1, hang)], t)


# ---------- foam rolling the glute ----------
# Sitting on a roller (axis along X at z = 0, radius ROLLER_R) with the right
# buttock on it: the trunk leant back on straight arms and tipped to the right,
# the right ankle crossed over the left knee so the right glute is on stretch
# under the roller, the left foot on the floor ahead. The body pushes itself
# back and forth over the roller; the roller stays, the left leg does the
# pushing. Scene.tsx draws the roller from these constants.
ROLLER_R = 0.075
ROLL_TRAVEL = 0.12


def foam_roll_sample(t):
    q = all_ident()
    shift = ROLL_TRAVEL * math.sin(2 * math.pi * t)  # back and forth over the roller
    lean = rx(-32 * DEG)  # leant back on the hands
    tip = q_axis([0, 0, 1], 12 * DEG)  # tipped onto the right buttock
    trunk = qmul(tip, lean)
    hip_mid = np.array([0.0, 2 * ROLLER_R + 0.06, shift])
    root, pelvis_pos = root_for_hip(hip_mid, trunk)
    q["pelvis"], q["spine"] = trunk, trunk
    q["neck"], q["head"] = tip, tip  # looking ahead
    push = 8 * DEG * math.sin(2 * math.pi * t)  # the pushing leg bends and straightens with the roll
    # Left leg: out ahead, the foot on the floor, the knee slightly bent, pushing.
    q["thigh.L"], q["shin.L"], q["foot.L"] = rx(-78 * DEG + push), rx(-70 * DEG - push), rx(-40 * DEG)
    # Right leg: the figure-4, thigh turned out and the ankle resting on the left knee.
    out = q_axis([0, 0, 1], -45 * DEG)
    q["thigh.R"] = qmul(rx(-75 * DEG), out)
    q["shin.R"] = q["foot.R"] = qmul(rx(-20 * DEG), q_axis([0, 0, 1], 70 * DEG))
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        hand = np.array([shoulder[0], 0.03, shoulder[2] - 0.22])  # planted on the floor behind
        d = hand - shoulder
        a = angle_of(d / max(float(np.linalg.norm(d)), 1e-9))
        q["upper_arm." + S], q["forearm." + S] = rx(a), qmul(rx(a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(90 * DEG), PRONATE)  # flat, fingers pointing back
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- standing leg raise (Utthita Hasta Padangusthasana without the toe hold) ----------
def leg_raise_stage(thigh_deg, knee_deg, arms_deg):
    """Standing on the left leg (the converter pins the left foot), the right leg by angle, arms out for balance."""
    q = all_ident()
    q["thigh.L"], q["shin.L"] = rx(3 * DEG), rx(3 * DEG)
    thigh = thigh_deg * DEG
    q["thigh.R"], q["shin.R"], q["foot.R"] = rx(thigh), rx(thigh + knee_deg * DEG), rx(thigh + knee_deg * DEG - 15 * DEG)  # the foot flexed
    for S, sgn in (("L", 1), ("R", -1)):
        for b in ("upper_arm", "forearm", "hand", "fingers"):
            q[b + "." + S] = q_axis([0, 0, 1], sgn * arms_deg * DEG)
    return {"root": [0, 0, 0], "q": q}


def leg_raise_sample(t):
    """From standing: the right knee lifts to the chest, the knee straightens to hold the leg out level, held,
    then the same way down. Arms out to the sides for balance, as in the hands-free variation."""
    stand = leg_raise_stage(0, 0, 0)
    knee_up = leg_raise_stage(-100, 100, 45)
    out = leg_raise_stage(-85, 0, 60)
    return sequence([(0, stand), (0.22, knee_up), (0.42, out), (0.68, out), (0.85, knee_up), (1, stand)], t)


# ---------- six more yoga holds ----------
def flat_foot_turned(deg):
    """A foot flat on the floor, its toes turned about the vertical by deg (positive toward +X, the left)."""
    return q_axis([0, 1, 0], deg * DEG)


def warrior1_hold():
    """Virabhadrasana I: the left foot forward with the knee bent, the right leg straight behind with the foot
    turned out, hips square, trunk upright, arms overhead."""
    q = all_ident()
    hip = np.array([0.0, 0.59, 0.10])
    root, _ = root_for_hip(hip, rx(4 * DEG))
    q["pelvis"], q["spine"] = rx(4 * DEG), rx(4 * DEG)
    q["thigh.L"], q["shin.L"], q["foot.L"] = rx(-75 * DEG), rx(-5 * DEG), IDENT
    q["thigh.R"], q["shin.R"], q["foot.R"] = rx(51 * DEG), rx(51 * DEG), flat_foot_turned(-45)
    set_arms(q, -175 * DEG, -175 * DEG)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def warrior1_sample(t):
    step = all_ident()
    hip = np.array([0.0, 0.8, 0.05])
    r, _ = root_for_hip(hip, rx(4 * DEG))
    step["thigh.L"], step["shin.L"], step["foot.L"] = rx(-45 * DEG), rx(-10 * DEG), rx(-20 * DEG)  # the front foot reaching
    step["thigh.R"], step["shin.R"], step["foot.R"] = rx(25 * DEG), rx(25 * DEG), flat_foot_turned(-30)
    set_arms(step, -90 * DEG, -90 * DEG)
    step["root"] = [round(float(v), 4) for v in r]
    step = {"root": step.pop("root"), "q": step}
    return sequence([(0, stand_sample(0)), (0.22, step), (0.4, warrior1_hold()), (0.75, warrior1_hold()), (0.88, step), (1, stand_sample(0))], t)


def warrior2_hold():
    """Virabhadrasana II: a wide stance along x, the left knee bent over its foot, the right leg straight, both
    arms out level along the stance, the gaze over the front hand."""
    q = all_ident()
    root, _ = root_for_hip(np.array([0.0, 0.62, 0.0]), IDENT)
    q["thigh.L"], q["shin.L"], q["foot.L"] = q_axis([0, 0, 1], 70 * DEG), IDENT, flat_foot_turned(90)
    q["thigh.R"], q["shin.R"], q["foot.R"] = q_axis([0, 0, 1], -48 * DEG), q_axis([0, 0, 1], -48 * DEG), flat_foot_turned(15)
    for S, sgn in (("L", 1), ("R", -1)):
        for b in ("upper_arm", "forearm", "hand", "fingers"):
            q[b + "." + S] = q_axis([0, 0, 1], sgn * 90 * DEG)
    q["neck"], q["head"] = q_axis([0, 1, 0], 30 * DEG), q_axis([0, 1, 0], 65 * DEG)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def warrior2_sample(t):
    wide = all_ident()  # the legs stepped wide before the knee bends
    r, _ = root_for_hip(np.array([0.0, 0.80, 0.0]), IDENT)
    wide["thigh.L"] = wide["shin.L"] = q_axis([0, 0, 1], 30 * DEG)
    wide["thigh.R"] = wide["shin.R"] = q_axis([0, 0, 1], -30 * DEG)
    wide["foot.L"], wide["foot.R"] = flat_foot_turned(60), flat_foot_turned(10)
    for S, sgn in (("L", 1), ("R", -1)):
        for b in ("upper_arm", "forearm", "hand", "fingers"):
            wide[b + "." + S] = q_axis([0, 0, 1], sgn * 45 * DEG)
    wide = {"root": [round(float(v), 4) for v in r], "q": wide}
    return sequence([(0, stand_sample(0)), (0.2, wide), (0.4, warrior2_hold()), (0.75, warrior2_hold()), (0.9, wide), (1, stand_sample(0))], t)


def half_moon_hold():
    """Ardha Chandrasana: standing on the left leg, the trunk tipped over it toward +X and 30 degrees below level,
    the left hand on the floor ahead of the foot, the right leg lifted level to -X, the right arm straight up."""
    q = all_ident()
    roll = q_axis([0, 0, 1], -120 * DEG)
    root, _ = root_for_hip(np.array([0.0, 0.84, 0.05]), roll)
    q["pelvis"], q["spine"], q["neck"], q["head"] = roll, roll, roll, roll
    q["thigh.L"], q["shin.L"], q["foot.L"] = rx(2 * DEG), rx(2 * DEG), IDENT
    q["thigh.R"], q["shin.R"], q["foot.R"] = q_axis([0, 0, 1], -90 * DEG), q_axis([0, 0, 1], -90 * DEG), q_axis([0, 0, 1], -90 * DEG)
    for b in ("upper_arm", "forearm", "hand", "fingers"):
        q[b + ".L"] = IDENT  # straight down to the floor
        q[b + ".R"] = q_axis([0, 0, 1], 180 * DEG)  # straight up
    return {"root": [round(float(v), 4) for v in root], "q": q}


def half_moon_sample(t):
    tip = all_ident()  # tipping: the trunk leant to the left, the right leg starting to lift, arms out
    roll = q_axis([0, 0, 1], -50 * DEG)
    r, _ = root_for_hip(np.array([0.0, 0.86, 0.02]), roll)
    tip["pelvis"], tip["spine"], tip["neck"], tip["head"] = roll, roll, roll, roll
    tip["thigh.R"] = tip["shin.R"] = tip["foot.R"] = q_axis([0, 0, 1], -40 * DEG)
    for b in ("upper_arm", "forearm", "hand", "fingers"):
        tip[b + ".L"], tip[b + ".R"] = q_axis([0, 0, 1], 40 * DEG), q_axis([0, 0, 1], -140 * DEG)
    tip = {"root": [round(float(v), 4) for v in r], "q": tip}
    return sequence([(0, stand_sample(0)), (0.2, tip), (0.4, half_moon_hold()), (0.75, half_moon_hold()), (0.9, tip), (1, stand_sample(0))], t)


BLOCK_H = 0.15  # yoga blocks on edge under the hands: on this figure the arms are no longer than the trunk, so
# with the hands on the floor the hips cannot rise at all (probed 2026-09-20); blocks are the usual answer
BLOCK_Z = 0.06


def scale_stage(hip_y, trunk_deg):
    """Sitting cross-legged with the hands on the floor beside the hips; lifted when hip_y is above the floor.
    The hands stay where they are planted, so sitting with the trunk leant forward bends the elbows and the lift
    straightens them (owner, 2026-09-13)."""
    q = all_ident()
    trunk = rx(trunk_deg * DEG)
    root, pelvis_pos = root_for_hip(np.array([0.0, hip_y, 0.0]), trunk)
    q["pelvis"], q["spine"] = trunk, trunk
    for S, sgn in (("L", 1), ("R", -1)):
        q["thigh." + S] = qmul(rx(-100 * DEG), q_axis([0, 0, 1], sgn * 50 * DEG))  # knees out and forward
        q["shin." + S] = q["foot." + S] = qmul(rx(-30 * DEG), q_axis([0, 0, 1], -sgn * 75 * DEG))  # shins crossing in front
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        hand = np.array([shoulder[0], BLOCK_H + 0.03, BLOCK_Z])  # planted on the blocks beside the hips, the same spot in both stages
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def scale_lift_hip_y(trunk_deg, hand=(BLOCK_H + 0.03, BLOCK_Z)):
    """The hip height at which straight arms from the shoulders reach the planted hands: the lift is only as
    high as that (owner, 2026-09-20: the body floated with the hands off the floor)."""
    trunk = rx(trunk_deg * DEG)
    _, pelvis_pos = root_for_hip(np.array([0.0, 0.0, 0.0]), trunk)
    shoulder = shoulder_from(pelvis_pos, trunk, "l")  # at hip_y = 0: its y is the shoulder's offset above the hips
    reach = L_UPPER + L_FORE - 0.005
    dz = hand[1] - shoulder[2]
    return hand[0] + math.sqrt(max(reach * reach - dz * dz, 0.0)) - shoulder[1]


def scale_sample(t):
    """Tolasana: sitting cross-legged with the elbows bent, press through the hands until the arms are straight
    and the whole body is off the floor, hold, and lower."""
    return entered(scale_stage(0.08, 25), scale_stage(scale_lift_hip_y(6), 6), t)


def headstand_stage(trunk_deg, thigh_deg, knee_deg, point):
    """Supported headstand: the crown on the floor, the forearms down in a triangle with the hands clasped behind
    the head; the body placed from the shoulders, which stay put."""
    q = all_ident()
    trunk = trunk_deg * DEG
    shoulder_mid = np.array([0.0, 0.33, 0.0])
    hip_mid = shoulder_mid - np.array([0.0, math.cos(trunk), math.sin(trunk)]) * L_TRUNK
    root, _ = root_for_hip(hip_mid, rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(180 * DEG), rx(180 * DEG)  # crown down on the floor
    thigh = thigh_deg * DEG
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S] = rx(thigh), rx(thigh + knee_deg * DEG)
        q["foot." + S] = rx(thigh + knee_deg * DEG + (POINT * DEG if point else 0.0))
        q["upper_arm." + S] = IDENT  # down to the elbows on the floor
    q["forearm.L"] = q["hand.L"] = q["fingers.L"] = qmul(q_axis([0, 1, 0], 55 * DEG), rx(90 * DEG))
    q["forearm.R"] = q["hand.R"] = q["fingers.R"] = qmul(q_axis([0, 1, 0], -55 * DEG), rx(90 * DEG))
    return {"root": [round(float(v), 4) for v in root], "q": q}


def headstand_sample(t):
    kneel = headstand_stage(106, 24, 66, False)  # kneeling, head down, shins along the floor
    pike = headstand_stage(159, 35, 0, False)  # hips up, legs straight, toes on the floor
    tuck = headstand_stage(180, -35, 145, True)  # knees drawn in over the chest
    full = headstand_stage(180, 180, 0, True)
    return sequence([(0, kneel), (0.15, pike), (0.28, tuck), (0.4, full), (0.75, full), (0.85, tuck), (0.93, pike), (1, kneel)], t)


def pigeon_stages():
    table = all_ident()  # hands and knees
    trunk = rx(88 * DEG)
    root, pelvis_pos = root_for_hip(np.array([0.0, 0.47, 0.0]), trunk)
    table["pelvis"], table["spine"] = trunk, trunk
    table["neck"], table["head"] = rx(30 * DEG), rx(20 * DEG)
    for S in ("L", "R"):
        table["thigh." + S], table["shin." + S], table["foot." + S] = IDENT, rx(90 * DEG), rx(120 * DEG)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        hand = np.array([shoulder[0], 0.03, shoulder[2]])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        table["upper_arm." + S], table["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        table["hand." + S] = table["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    table = {"root": [round(float(v), 4) for v in root], "q": table}

    pigeon = all_ident()  # the left shin across in front, the right leg back along the floor, trunk upright
    trunk = rx(12 * DEG)
    root, pelvis_pos = root_for_hip(np.array([0.0, 0.20, 0.0]), trunk)
    pigeon["pelvis"], pigeon["spine"] = trunk, trunk
    pigeon["thigh.L"] = qmul(rx(-70 * DEG), q_axis([0, 0, 1], 55 * DEG))
    pigeon["shin.L"] = pigeon["foot.L"] = q_axis([0, 0, 1], -85 * DEG)
    pigeon["thigh.R"], pigeon["shin.R"], pigeon["foot.R"] = rx(95 * DEG), rx(95 * DEG), rx(130 * DEG)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        hand = np.array([shoulder[0], 0.03, shoulder[2] + 0.12])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        pigeon["upper_arm." + S], pigeon["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        pigeon["hand." + S] = pigeon["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    pigeon = {"root": [round(float(v), 4) for v in root], "q": pigeon}
    return table, pigeon


def pigeon_sample(t):
    """Eka Pada Rajakapotasana, the upright preparation: from all fours, the left shin comes across in front and
    the right leg slides back until the hips settle to the floor; held; back to all fours."""
    table, pigeon = pigeon_stages()
    return sequence([(0, table), (0.4, pigeon), (0.75, pigeon), (1, table)], t)


# ---------- downward dog, cobra, child's pose ----------
def downward_dog_sample(t):
    """Adho Mukha Svanasana from all fours: the hips lift and press back until the body is an inverted V, the
    arms in line with the trunk, the heels toward the floor."""
    table, _ = pigeon_stages()
    dog = all_ident()
    trunk = rx(148 * DEG)
    root, _ = root_for_hip(np.array([0.0, 0.85, 0.05]), trunk)
    dog["pelvis"], dog["spine"] = trunk, trunk
    dog["neck"], dog["head"] = rx(138 * DEG), rx(130 * DEG)  # looking back at the feet
    for S in ("L", "R"):
        dog["thigh." + S], dog["shin." + S], dog["foot." + S] = rx(25 * DEG), rx(25 * DEG), IDENT  # heels down
        dog["upper_arm." + S], dog["forearm." + S] = rx(-31 * DEG), qmul(rx(-31 * DEG), PRONATE)  # in line with the trunk
        dog["hand." + S] = dog["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    dog = {"root": [round(float(v), 4) for v in root], "q": dog}
    return entered(table, dog, t)


def cobra_sample(t):
    """Bhujangasana from lying prone with the hands under the shoulders: the chest lifts on partly bent arms, the
    hips stay on the floor."""
    def stage(trunk_deg, gaze_deg):
        q = all_ident()
        trunk = rx(trunk_deg * DEG)
        root, pelvis_pos = root_for_hip(np.array([0.0, 0.12, 0.0]), trunk)
        q["pelvis"], q["spine"] = trunk, trunk
        q["neck"], q["head"] = rx((trunk_deg - gaze_deg * 0.5) * DEG), rx((trunk_deg - gaze_deg) * DEG)
        for S in ("L", "R"):
            q["thigh." + S], q["shin." + S], q["foot." + S] = rx(92 * DEG), rx(92 * DEG), rx(125 * DEG)  # legs back along the floor
        for S, side in (("L", "l"), ("R", "r")):
            shoulder = shoulder_from(pelvis_pos, trunk, side)
            hand = np.array([shoulder[0], 0.03, 0.50])  # under the shoulders as they lie; the hands stay put
            up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
            q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
            q["hand." + S] = q["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
        return {"root": [round(float(v), 4) for v in root], "q": q}
    return entered(stage(90, 0), stage(55, 60), t)


def childs_pose_sample(t):
    """Balasana from kneeling upright: the hips sit back onto the heels, the trunk folds over the thighs, the arms
    reach forward along the floor and the forehead rests down."""
    kneel = all_ident()
    root, _ = root_for_hip(np.array([0.0, 0.48, 0.0]), IDENT)
    for S in ("L", "R"):
        kneel["thigh." + S], kneel["shin." + S], kneel["foot." + S] = IDENT, rx(90 * DEG), rx(120 * DEG)
    set_arms(kneel, 8 * DEG, 8 * DEG)
    kneel = {"root": [round(float(v), 4) for v in root], "q": kneel}

    child = all_ident()
    trunk = rx(116 * DEG)
    root, _ = root_for_hip(np.array([0.0, 0.24, 0.0]), trunk)
    child["pelvis"], child["spine"] = trunk, trunk
    child["neck"], child["head"] = rx(120 * DEG), rx(124 * DEG)  # forehead to the floor
    # The knees wide, so the trunk folds down between the thighs rather than through them (owner, 2026-09-13); the
    # shins angle in a little so the feet stay near each other.
    for S, sgn in (("L", 1), ("R", -1)):
        spread = q_axis([0, 0, 1], sgn * 32 * DEG)
        child["thigh." + S] = qmul(rx(-61 * DEG), spread)
        child["shin." + S] = qmul(rx(90 * DEG), q_axis([0, 0, 1], sgn * 12 * DEG))
        child["foot." + S] = qmul(rx(120 * DEG), q_axis([0, 0, 1], sgn * 12 * DEG))
        child["upper_arm." + S], child["forearm." + S] = rx(-82 * DEG), qmul(rx(-82 * DEG), PRONATE)  # reaching along the floor
        child["hand." + S] = child["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    child = {"root": [round(float(v), 4) for v in root], "q": child}
    return entered(kneel, child, t)


# ---------- stretches ----------
def low_lunge_sample(t):
    """Anjaneyasana, the yoga low lunge, from standing (owner, 2026-09-20): the left foot steps forward into a
    lunge, the right knee lowers to the floor with the shin along it, the hips sink forward and down, the arms
    rise overhead and the chest lifts into a slight backbend, the gaze up; then back up to standing."""
    high = all_ident()  # the step: a lunge with the back knee off the floor, the trunk upright, the arms down
    hip_y = 0.62
    root, _ = root_for_hip(np.array([0.0, hip_y, 0.0]), IDENT)
    front_thigh = -60.0
    knee_y = hip_y - L_THIGH * math.cos(front_thigh * DEG)
    front_shin = math.degrees(math.acos(min(1.0, (knee_y - 0.06) / L_SHIN)))  # the shin down to the planted foot
    high["thigh.L"], high["shin.L"], high["foot.L"] = rx(front_thigh * DEG), rx(front_shin * DEG), IDENT
    back = math.degrees(math.acos(min(1.0, (hip_y - 0.06) / (L_THIGH + L_SHIN))))  # the back leg straight to the ball of the foot
    high["thigh.R"], high["shin.R"], high["foot.R"] = rx(back * DEG), rx(back * DEG), rx((back + 40) * DEG)
    high = {"root": [round(float(v), 4) for v in root], "q": high}

    low = all_ident()
    trunk = rx(-12 * DEG)  # a slight backbend
    hip_y = 0.06 + L_THIGH * math.cos(41 * DEG)  # the back knee on the floor at this thigh angle
    root, _ = root_for_hip(np.array([0.0, hip_y, 0.0]), trunk)
    low["pelvis"], low["spine"] = trunk, trunk
    low["neck"], low["head"] = rx(-18 * DEG), rx(-28 * DEG)  # the gaze up
    front_thigh = -math.degrees(math.acos(-(hip_y - 0.06 - L_SHIN) / L_THIGH))  # the front shin vertical, the knee over the ankle
    low["thigh.L"], low["shin.L"], low["foot.L"] = rx(front_thigh * DEG), rx(0.0), IDENT
    low["thigh.R"], low["shin.R"], low["foot.R"] = rx(41 * DEG), rx(90 * DEG), rx(120 * DEG)  # kneeling, the hip pressed forward and down
    set_arms(low, -172 * DEG, -172 * DEG)  # overhead
    low = {"root": [round(float(v), 4) for v in root], "q": low}
    stand = stand_sample(0)
    return sequence([(0, stand), (0.2, high), (ENTER, low), (RELEASE, low), (0.9, high), (1, stand)], t)


def quad_stretch_sample(t):
    """Standing quad stretch on the left leg: the right heel drawn up to the buttock and held by the right hand,
    the left arm out for balance."""
    def stage(shin_deg, reach, balance_deg):
        q = all_ident()
        q["thigh.R"], q["shin.R"], q["foot.R"] = rx(10 * DEG), rx(shin_deg * DEG), rx((shin_deg + 25) * DEG)
        for b in ("upper_arm", "forearm", "hand", "fingers"):
            q[b + ".L"] = q_axis([0, 0, 1], balance_deg * DEG)
        # The right hand reaches down and back to where the foot is; the shoulder is the standing figure's.
        shoulder = rig["shoulder.r"]
        foot = np.array([float(shoulder[0]), 0.88, -0.21])
        hanging = shoulder + np.array([0.0, -(L_UPPER + L_FORE), 0.0])
        target = hanging + (foot - hanging) * reach  # from hanging at the side to the foot
        up_a, fo_a, _ = two_link(shoulder, target, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm.R"], q["forearm.R"] = rx(up_a), rx(fo_a)
        q["hand.R"] = q["fingers.R"] = rx(fo_a + 40 * DEG * reach)  # the hand curls round the foot
        return {"root": [0, 0, 0], "q": q}
    return entered(stage(10, 0.0, 0), stage(160, 1.0, 55), t)


def calf_stretch_sample(t):
    """Calf stretch: the right leg stepped back straight with the heel down, the left knee bent, the hands on the
    front thigh, leaning in."""
    def stage(hip_y, trunk_deg, back_deg, front_thigh_deg, front_shin_deg, hand_y, hand_z):
        q = all_ident()
        trunk = rx(trunk_deg * DEG)
        root, pelvis_pos = root_for_hip(np.array([0.0, hip_y, 0.05]), trunk)
        q["pelvis"], q["spine"] = trunk, trunk
        q["neck"], q["head"] = rx(trunk_deg * 0.5 * DEG), rx(trunk_deg * 0.3 * DEG)
        q["thigh.R"], q["shin.R"], q["foot.R"] = rx(back_deg * DEG), rx(back_deg * DEG), IDENT  # heel down
        q["thigh.L"], q["shin.L"], q["foot.L"] = rx(front_thigh_deg * DEG), rx(front_shin_deg * DEG), IDENT
        for S, side in (("L", "l"), ("R", "r")):
            # The hands rest on the front thigh (no wall, so the front view is clear: owner, 2026-09-13).
            shoulder = shoulder_from(pelvis_pos, trunk, side)
            hand = np.array([shoulder[0] * 0.7, hand_y, hand_z])
            up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
            q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
            q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a - 50 * DEG), PRONATE)  # palms down on the thigh
        return {"root": [round(float(v), 4) for v in root], "q": q}
    return entered(stage(0.92, 6, 0, 0, 0, 0.85, 0.12), stage(0.78, 20, 31, -35, -8, 0.62, 0.26), t)  # the front knee bent about 30 degrees


CALF_WALL = 0.70


def hamstring_fold_sample(t):
    """Seated hamstring stretch: sitting with the legs straight out and the feet flexed, folding the trunk forward
    over the legs with the arms reaching for the feet."""
    def stage(trunk_deg, arm_deg):
        q = all_ident()
        trunk = rx(trunk_deg * DEG)
        root, _ = root_for_hip(np.array([0.0, 0.10, 0.0]), trunk)
        q["pelvis"], q["spine"] = trunk, trunk
        q["neck"], q["head"] = rx((trunk_deg - 10) * DEG), rx((trunk_deg - 20) * DEG)
        for S in ("L", "R"):
            q["thigh." + S], q["shin." + S], q["foot." + S] = rx(-86 * DEG), rx(-86 * DEG), rx(-116 * DEG)  # legs out, feet flexed
        set_arms(q, arm_deg * DEG, arm_deg * DEG)
        return {"root": [round(float(v), 4) for v in root], "q": q}
    return entered(stage(2, -30), stage(62, -72), t)



# ---------- standing chain from the feet ----------
def hip_from_feet(thigh_deg, shin_deg, ankle=(0.06, 0.0)):
    """The hip joints' midpoint when the ankles sit at (y, z) = ankle and the legs take these angles (rx
    convention, both legs alike): the hips move back as the knees come forward."""
    thigh, shin = thigh_deg * DEG, shin_deg * DEG
    knee = np.array([0.0, ankle[0] + L_SHIN * math.cos(shin), ankle[1] + L_SHIN * math.sin(shin)])
    hip = knee + np.array([0.0, L_THIGH * math.cos(thigh), L_THIGH * math.sin(thigh)])
    return hip


def barbell_standing(thigh_deg, shin_deg, trunk_deg, head_deg, arms=None):
    """A standing lift: legs and trunk by angle from planted feet, arms hanging straight down unless given as
    (upper_deg, fore_deg), the hands gripping."""
    q = all_ident()
    hip = hip_from_feet(thigh_deg, shin_deg)
    trunk = rx(trunk_deg * DEG)
    root, _ = root_for_hip(hip, trunk)
    q["pelvis"], q["spine"] = trunk, trunk
    q["neck"], q["head"] = rx(head_deg * 0.6 * DEG), rx(head_deg * DEG)
    set_legs(q, thigh_deg * DEG, shin_deg * DEG, 0.0)
    if arms is not None:
        up, fo = arms
        for S in ("L", "R"):
            q["upper_arm." + S], q["forearm." + S] = rx(up * DEG), qmul(rx(fo * DEG), PRONATE)
            q["hand." + S] = q["fingers." + S] = qmul(rx(fo * DEG), PRONATE)
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- the barbell lifts ----------
def deadlift_sample(t):
    """A conventional deadlift as a rep from the top: hinge and bend down to the bar, stand back up. The arms hang
    straight; the bar is drawn between the hands."""
    thigh = splined([(0, 0), (0.5, -60), (1, 0)], t)
    shin = splined([(0, 0), (0.5, 20), (1, 0)], t)
    trunk = splined([(0, 0), (0.5, 65), (1, 0)], t)
    return barbell_standing(thigh, shin, trunk, trunk * 0.5)


def rdl_sample(t):
    """A Romanian deadlift: the knees soft and still, the hips hinge back until the trunk is near level and the
    bar hangs below the knees, then stand."""
    trunk = splined([(0, 2), (0.5, 80), (1, 2)], t)
    return barbell_standing(-15, 5, trunk, trunk * 0.45)


def overhead_press_sample(t):
    """A strict overhead press: the bar at the front of the shoulders with the elbows ahead, pressed to straight
    arms overhead, and lowered. The angles interpolate, so the bar travels up the front."""
    up = splined([(0, -45), (0.5, -178), (1, -45)], t)
    q = all_ident()
    root, _ = root_for_hip(np.array([0.0, float(rig["hip.l"][1]), 0.0]), IDENT)
    lean = splined([(0, -6), (0.5, 0), (1, -6)], t)  # a little lean back to clear the chin at the bottom
    q["pelvis"], q["spine"] = rx(lean * DEG), rx(lean * DEG)
    q["neck"], q["head"] = rx(lean * 0.5 * DEG), rx(0.0)
    for S in ("L", "R"):
        q["upper_arm." + S] = rx(up * DEG)
        q["forearm." + S] = q["hand." + S] = q["fingers." + S] = qmul(rx(180 * DEG), PRONATE)  # vertical under the bar
    return {"root": [round(float(v), 4) for v in root], "q": q}


def barbell_row_sample(t):
    """A bent-over barbell row: hinged to 70 degrees with the knees soft, the bar pulled from hanging arms to the
    lower chest with the elbows driven back, and lowered."""
    up = splined([(0, 0), (0.5, 95), (1, 0)], t)
    fo = splined([(0, 0), (0.5, -20), (1, 0)], t)
    return barbell_standing(-15, 5, 70, 40, arms=(up, fo))


BENCH_TOP = 0.45
BENCH_GRIP = 0.40  # each hand this far from the midline on the bar


def aim(v, front=(0.0, 0.0, 1.0)):
    """The quaternion that points a bone (rest direction: down) along v with its front (rest: +z) kept toward
    `front`, so a chain built from these only hinges and never twists as the direction changes (owner,
    2026-09-20: the bench press arms were rotating, not just bending)."""
    v = np.asarray(v, dtype=float)
    y = -v / max(float(np.linalg.norm(v)), 1e-9)  # where the rest +y (up the bone) goes
    f = np.asarray(front, dtype=float)
    z = f - np.dot(f, y) * y
    if float(np.linalg.norm(z)) < 1e-6:
        z = np.array([0.0, 1.0, 0.0]) - y[1] * y
    z = z / max(float(np.linalg.norm(z)), 1e-9)
    x = np.cross(y, z)
    return q_from_matrix(np.column_stack([x, y, z]))


def q_from_matrix(R):
    """Unit quaternion [x, y, z, w] of a rotation matrix (columns: where the rest x, y, z axes go)."""
    tr = R[0, 0] + R[1, 1] + R[2, 2]
    if tr > 0:
        S = math.sqrt(tr + 1.0) * 2
        return [float((R[2, 1] - R[1, 2]) / S), float((R[0, 2] - R[2, 0]) / S), float((R[1, 0] - R[0, 1]) / S), 0.25 * S]
    if R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
        S = math.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2
        return [0.25 * S, float((R[0, 1] + R[1, 0]) / S), float((R[0, 2] + R[2, 0]) / S), float((R[2, 1] - R[1, 2]) / S)]
    if R[1, 1] > R[2, 2]:
        S = math.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2
        return [float((R[0, 1] + R[1, 0]) / S), 0.25 * S, float((R[1, 2] + R[2, 1]) / S), float((R[0, 2] - R[2, 0]) / S)]
    S = math.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2
    return [float((R[0, 2] + R[2, 0]) / S), float((R[1, 2] + R[2, 1]) / S), 0.25 * S, float((R[1, 0] - R[0, 1]) / S)]


def two_link_3d(root, target, l1, l2, bend):
    """The middle joint of a two-link chain from root to target, bent toward the direction `bend` (its part
    perpendicular to the root-target line), in any plane."""
    d = target - root
    dist = min(float(np.linalg.norm(d)), l1 + l2 - 1e-4)
    u = d / max(float(np.linalg.norm(d)), 1e-9)
    a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
    h = math.sqrt(max(l1 * l1 - a * a, 0.0))
    b = np.asarray(bend, dtype=float)
    perp = b - np.dot(b, u) * u
    perp = perp / max(float(np.linalg.norm(perp)), 1e-9)
    return root + u * a + perp * h


def bench_press_sample(t):
    """A bench press: lying on the bench (top at BENCH_TOP), feet on the floor, the bar lowered to the chest with
    the elbows out and down, pressed to straight arms."""
    q = all_ident()
    trunk = rx(-90 * DEG)
    root, _ = root_for_hip(np.array([0.0, BENCH_TOP + 0.07, 0.15]), trunk)
    q["pelvis"], q["spine"], q["neck"], q["head"] = trunk, trunk, trunk, trunk
    hip_l = np.array([0.0, BENCH_TOP + 0.07, 0.15])
    thigh_a, shin_a, _ = two_link(hip_l, np.array([0.0, 0.06, 0.55]), L_THIGH, L_SHIN, bend_forward=True)  # the knee up
    set_legs(q, thigh_a, shin_a, 0.0)  # thighs out to the knees, shins down to the planted feet
    # The hands hold one spot on the bar (owner, 2026-09-20): a fixed grip width, the bar over the lower chest,
    # lowered to the chest and pressed to straight arms; the elbows bend out and down in the frontal plane.
    f = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    _, pelvis_pos = root_for_hip(hip_l, trunk)
    for S, side, sgn in (("L", "l", 1), ("R", "r", -1)):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        grip = np.array([sgn * BENCH_GRIP, 0.0, shoulder[2] + 0.10])
        reach = L_UPPER + L_FORE - 0.01
        dx, dz = grip[0] - shoulder[0], grip[2] - shoulder[2]
        top = shoulder[1] + math.sqrt(max(reach * reach - dx * dx - dz * dz, 0.0))
        hand = np.array([grip[0], shoulder[1] + 0.10 + (top - shoulder[1] - 0.10) * f, grip[2]])
        elbow = two_link_3d(shoulder, hand, L_UPPER, L_FORE, np.array([sgn * 1.0, -0.4, 0.0]))
        q["upper_arm." + S] = aim(elbow - shoulder)
        q["forearm." + S] = q["hand." + S] = q["fingers." + S] = aim(hand - elbow)
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- bridges ----------
def bridge_geometry(f, shoulders, feet_z, trunk_lo, trunk_hi, arms):
    """Supine with the shoulders fixed, the hips lifted by f in 0..1: the trunk pivots about the shoulders, the
    feet stay planted and the knees follow."""
    q = all_ident()
    a = (trunk_lo + (trunk_hi - trunk_lo) * f) * DEG
    hip = shoulders - np.array([0.0, math.cos(a), math.sin(a)]) * L_TRUNK
    root, pelvis_pos = root_for_hip(hip, rx(a))
    q["pelvis"], q["spine"] = rx(a), rx(a)
    q["neck"], q["head"] = rx(-90 * DEG), rx(-90 * DEG)  # the head stays down
    thigh, shin, _ = two_link(hip, np.array([0.0, 0.06, feet_z]), L_THIGH, L_SHIN, bend_forward=True)  # the knee up (probed: False put it under the floor)
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(thigh), rx(shin), IDENT
    arms(q, pelvis_pos, rx(a), hip)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def arms_on_floor(q, pelvis_pos, trunk_q, hip):
    set_arms(q, -90 * DEG, -90 * DEG, palm_down=True)  # along the floor toward the feet, palms down


def glute_bridge_sample(t):
    """A glute bridge rep: lying with the knees bent and feet flat, the hips lift to a line from the knees to the
    shoulders (t 0.5), then lower."""
    f = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    return bridge_geometry(f, np.array([0.0, 0.12, -0.45]), 0.40, -90, -121, arms_on_floor)


def arms_clasped_under(q, pelvis_pos, trunk_q, hip):
    """The arms straight along the floor under the back, drawn in to the midline so the hands clasp under the
    pelvis, the shoulders rolled under."""
    for S, sgn in (("L", 1), ("R", -1)):
        arm = qmul(q_axis([0, 0, 1], -sgn * 16 * DEG), rx(-90 * DEG))
        q["upper_arm." + S] = q["forearm." + S] = q["hand." + S] = q["fingers." + S] = arm


def bridge_pose_sample(t):
    """Setu Bandha Sarvangasana, which is not the glute bridge (owner asked the difference, 2026-09-20): the
    feet closer to the hips, the hips lifted higher into an arch with the chest toward the chin, the hands
    clasped under the back; entered from lying flat, held and released."""
    return bridge_geometry(envelope(t), np.array([0.0, 0.12, -0.45]), 0.32, -90, -132, arms_clasped_under)


def hip_thrust_sample(t):
    """A hip thrust rep: the upper back on a bench (BENCH_TOP), the bar held across the hips, the hips driven up
    to level with the knees over the feet, then lowered."""
    f = 0.5 - 0.5 * math.cos(2 * math.pi * t)

    def arms(q, pelvis_pos, trunk_q, hip):
        for S, side in (("L", "l"), ("R", "r")):
            shoulder = shoulder_from(pelvis_pos, trunk_q, side)
            hand = np.array([shoulder[0], hip[1] + 0.12, hip[2]])  # holding the bar on the hips
            up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
            q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
            q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a), PRONATE)
    return bridge_geometry(f, np.array([0.0, BENCH_TOP + 0.05, -0.35]), 0.45, -55, -90, arms)


# ---------- hanging leg raise and hollow hold ----------
def hanging_leg_raise_sample(t):
    """From a dead hang, the straight legs rise to level (t 0.45), pause, and lower; the pelvis tilts back at the
    top. The converter pins the wrists on the bar."""
    leg = splined([(0, -2), (0.45, -90), (0.6, -90), (1, -2)], t) * DEG
    trunk = splined([(0, 2), (0.45, -15), (0.6, -15), (1, 2)], t) * DEG
    arm = -178 * DEG
    twist = lambda r: qmul(r, PRONATE)
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": rx(0.0), "head": rx(0.0)}
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(leg), rx(leg), rx(leg + POINT * DEG)
        q["upper_arm." + S], q["forearm." + S] = rx(arm), twist(rx(arm))
        q["hand." + S] = twist(rx(arm + WRIST_FLEX * DEG))
        q["fingers." + S] = twist(rx(arm + (WRIST_FLEX + FINGER_CURL) * DEG))
    return {"root": [0, 0, 0], "q": q}


def hollow_hold_sample(t):
    """From lying flat with the arms overhead along the floor: the shoulders and the straight legs lift a little
    off the floor with the lower back pressed down, held, and lowered."""
    def stage(trunk_deg, leg_deg, arm_deg):
        q = all_ident()
        trunk = rx(trunk_deg * DEG)
        root, _ = root_for_hip(np.array([0.0, 0.12, 0.0]), trunk)
        q["pelvis"], q["spine"] = trunk, trunk
        q["neck"], q["head"] = rx((trunk_deg + 10) * DEG), rx((trunk_deg + 20) * DEG)  # chin toward the chest
        set_legs(q, leg_deg * DEG, leg_deg * DEG, (leg_deg + 20) * DEG)
        set_arms(q, arm_deg * DEG, arm_deg * DEG)
        return {"root": [round(float(v), 4) for v in root], "q": q}
    return entered(stage(-90, -90, 90), stage(-70, -110, 101), t)


# ---------- sun salutation ----------
def sun_salutation_sample(t):
    """Surya Namaskar as one continuous sequence: mountain, arms overhead, forward fold, plank, cobra, downward
    dog, forward fold, arms overhead, mountain. The feet slide between stages where a practitioner would step."""
    mountain = stand_sample(0)
    arms_up = stand_sample(0)
    set_arms(arms_up["q"], -175 * DEG, -175 * DEG)

    fold = all_ident()
    trunk = rx(150 * DEG)
    root, _ = root_for_hip(np.array([0.0, 0.88, 0.0]), trunk)
    fold["pelvis"], fold["spine"] = trunk, trunk
    fold["neck"], fold["head"] = rx(158 * DEG), rx(165 * DEG)
    set_legs(fold, -4 * DEG, -4 * DEG, 0.0)
    root, pelvis_pos = root_for_hip(np.array([0.0, 0.88, 0.0]), trunk)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        up_a, fo_a, _ = two_link(shoulder, np.array([shoulder[0], 0.03, shoulder[2] + 0.02]), L_UPPER, L_FORE, bend_forward=False)
        fold["upper_arm." + S], fold["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)  # hanging to the floor
        fold["hand." + S] = fold["fingers." + S] = qmul(rx(fo_a - 90 * DEG), PRONATE)
    fold = {"root": [round(float(v), 4) for v in root], "q": fold}

    plank = all_ident()
    trunk = rx(68 * DEG)
    root, _ = root_for_hip(np.array([0.0, 0.42, 0.0]), trunk)
    plank["pelvis"], plank["spine"] = trunk, trunk
    plank["neck"], plank["head"] = rx(60 * DEG), rx(50 * DEG)
    set_legs(plank, 68 * DEG, 68 * DEG, 95 * DEG)  # on the toes
    for S in ("L", "R"):
        plank["upper_arm." + S] = IDENT
        plank["forearm." + S] = qmul(IDENT, PRONATE)
        plank["hand." + S] = plank["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    plank = {"root": [round(float(v), 4) for v in root], "q": plank}

    cobra = cobra_sample(0.55)
    dog = downward_dog_sample(0.55)
    return sequence([(0, mountain), (0.08, arms_up), (0.18, fold), (0.3, plank), (0.42, cobra), (0.56, dog), (0.72, fold), (0.84, arms_up), (1, mountain)], t)


# ---------- tree, chair, triangle, seated twist ----------
def tree_sample(t):
    """Vrksasana: standing on the left leg, the right foot placed on the inner left thigh with the knee out to the
    side, the palms together overhead. The knee lifts first, then opens out."""
    def stage(thigh_q, shin_q, arm_deg):
        q = all_ident()
        q["thigh.R"], q["shin.R"], q["foot.R"] = thigh_q, shin_q, shin_q
        set_arms(q, arm_deg * DEG, arm_deg * DEG)
        return {"root": [0, 0, 0], "q": q}
    knee_up = stage(rx(-70 * DEG), rx(50 * DEG), -90)
    tree = stage(qmul(rx(-40 * DEG), q_axis([0, 0, 1], -62 * DEG)), q_axis([0, 0, 1], 72 * DEG), -178)
    return sequence([(0, stand_sample(0)), (0.2, knee_up), (0.4, tree), (0.75, tree), (0.9, knee_up), (1, stand_sample(0))], t)


def chair_sample(t):
    """Utkatasana: from standing, the hips sit back and down with the knees bent and the trunk leant forward,
    arms overhead in line with the trunk."""
    def stage(thigh_deg, shin_deg, trunk_deg, arm_deg):
        q = all_ident()
        hip = hip_from_feet(thigh_deg, shin_deg)
        trunk = rx(trunk_deg * DEG)
        root, _ = root_for_hip(hip, trunk)
        q["pelvis"], q["spine"] = trunk, trunk
        q["neck"], q["head"] = rx(trunk_deg * 0.5 * DEG), rx(trunk_deg * 0.3 * DEG)
        set_legs(q, thigh_deg * DEG, shin_deg * DEG, 0.0)
        set_arms(q, arm_deg * DEG, arm_deg * DEG)
        return {"root": [round(float(v), 4) for v in root], "q": q}
    return entered(stage(0, 0, 0, 0), stage(-55, 25, 30, -150), t)


def triangle_sample(t):
    """Utthita Trikonasana: a wide stance with both legs straight, the trunk tipped sideways over the left leg,
    the left hand to the shin, the right arm straight up."""
    def stage(spread_deg, roll_deg, hip_y, arm_l, arm_r):
        q = all_ident()
        roll = q_axis([0, 0, 1], roll_deg * DEG)
        root, _ = root_for_hip(np.array([0.0, hip_y, 0.0]), roll)
        q["pelvis"], q["spine"], q["neck"], q["head"] = roll, roll, roll, roll
        q["thigh.L"] = q["shin.L"] = q_axis([0, 0, 1], spread_deg * DEG)
        q["thigh.R"] = q["shin.R"] = q_axis([0, 0, 1], -spread_deg * DEG)
        q["foot.L"], q["foot.R"] = flat_foot_turned(90 if spread_deg > 20 else 0), flat_foot_turned(15 if spread_deg > 20 else 0)
        for b in ("upper_arm", "forearm", "hand", "fingers"):
            q[b + ".L"], q[b + ".R"] = q_axis([0, 0, 1], arm_l * DEG), q_axis([0, 0, 1], arm_r * DEG)
        return {"root": [round(float(v), 4) for v in root], "q": q}
    wide = stage(30, 0, 0.79, 90, -90)  # stepped wide, arms out level
    tri = stage(30, -62, 0.79, 20, 180)  # tipped over the left leg, the left arm down to the shin, the right up
    return sequence([(0, stand_sample(0)), (0.2, wide), (0.4, tri), (0.75, tri), (0.9, wide), (1, stand_sample(0))], t)


def seated_twist_sample(t):
    """Ardha Matsyendrasana: sitting with the right leg straight, the left foot stepped over it beside the right
    knee, the trunk twisted to the left with the right arm hooked round the left knee and the left hand on the
    floor behind."""
    def stage(twist_deg):
        q = all_ident()
        root, _ = root_for_hip(np.array([0.0, 0.10, 0.0]), IDENT)
        spine = q_axis([0, 1, 0], twist_deg * DEG)
        q["pelvis"], q["spine"] = IDENT, spine
        q["neck"], q["head"] = q_axis([0, 1, 0], twist_deg * 1.4 * DEG), q_axis([0, 1, 0], twist_deg * 1.8 * DEG)
        q["thigh.R"], q["shin.R"], q["foot.R"] = rx(-88 * DEG), rx(-88 * DEG), rx(-78 * DEG)  # straight out, foot flexed
        bent = twist_deg / 45.0
        q["thigh.L"] = qmul(rx(-(88 + 52 * bent) * DEG), q_axis([0, 0, 1], -25 * bent * DEG))  # the left knee up and across
        q["shin.L"], q["foot.L"] = rx(-88 * (1 - bent) * DEG), rx(-78 * (1 - bent) * DEG)
        # The arms are set in the trunk's frame and turned with it: the right reaches forward and across to hook
        # the left knee, the left props on the floor behind.
        r_up = qmul(spine, qmul(q_axis([0, 0, 1], 30 * bent * DEG), rx(-55 * bent * DEG)))
        r_fo = qmul(spine, qmul(q_axis([0, 0, 1], 45 * bent * DEG), rx(-95 * bent * DEG)))
        l_arm = qmul(spine, qmul(q_axis([0, 0, 1], -15 * bent * DEG), rx(40 * bent * DEG)))
        q["upper_arm.R"], q["forearm.R"] = r_up, r_fo
        q["hand.R"] = q["fingers.R"] = r_fo
        q["upper_arm.L"] = q["forearm.L"] = l_arm
        q["hand.L"] = q["fingers.L"] = qmul(spine, qmul(q_axis([0, 0, 1], -15 * bent * DEG), rx(-50 * bent * DEG)))  # palm on the floor
        return {"root": [round(float(v), 4) for v in root], "q": q}
    return entered(stage(0), stage(45), t)



# ---------- crab walk (banded, lateral) ----------
# The owner's reference (sweat.com/exercises/crab-walk, 2026-09-19): a resistance band just above the knees, a
# half squat with the trunk leant forward, side steps that never bring the feet together.
CRAB_STEP = 0.20  # how far the body moves per side step
CRAB_STEPS = 3  # steps to the left, then the same three back to the right
CRAB_NARROW = 0.11  # each foot's distance from the hip line between steps (never together: the band stays taut)
CRAB_THIGH, CRAB_SHIN = -45, 25  # the half squat, knees over the toes
CRAB_SWING = (-52, 30)  # the stepping leg bends a little more, so the foot clears the floor


def crab_walk_sample(t):
    u = CRAB_STEPS * (2 * t if t <= 0.5 else 2 * (1 - t))  # steps to the left, then the leftward half reversed
    k, f = math.floor(u), u - math.floor(u)
    x0 = -CRAB_STEP * CRAB_STEPS / 2 + k * CRAB_STEP  # the hip line at the start of this step
    # The left foot steps out (f 0-0.4) as the body moves half a step; the right foot steps in (0.5-0.9) as the
    # body moves the other half. The trailing foot stays at the narrow width, so the band never slackens.
    a, b = smooth(min(max(f / 0.4, 0.0), 1.0)), smooth(min(max((f - 0.5) / 0.4, 0.0), 1.0))
    hip_x = x0 + CRAB_STEP * (0.5 * a + 0.5 * b)
    x_l = x0 + CRAB_NARROW + CRAB_STEP * a
    x_r = x0 - CRAB_NARROW + CRAB_STEP * b
    lift_l = math.sin(math.pi * a) if 0 < f < 0.4 else 0.0
    lift_r = math.sin(math.pi * b) if 0.5 < f < 0.9 else 0.0
    q = all_ident()
    legs = {}
    for S, x_foot, lift, sgn in (("L", x_l, lift_l, 1), ("R", x_r, lift_r, -1)):
        thigh = CRAB_THIGH + (CRAB_SWING[0] - CRAB_THIGH) * lift
        shin = CRAB_SHIN + (CRAB_SWING[1] - CRAB_SHIN) * lift
        vertical = L_THIGH * math.cos(thigh * DEG) + L_SHIN * math.cos(shin * DEG)
        ab = math.atan2(x_foot - (hip_x + sgn * float(abs(rig["hip.l"][0]))), vertical)
        legs[S] = (thigh, shin, ab, vertical)
    stance = [legs[S] for S in ("L", "R") if (S == "L" and lift_l == 0) or (S == "R" and lift_r == 0)] or list(legs.values())
    hip_y = 0.06 + min(v * math.cos(ab) for (_, _, ab, v) in stance)
    hip_z = L_SHIN * math.sin(CRAB_SHIN * DEG) + L_THIGH * math.sin(CRAB_THIGH * DEG)
    trunk = rx(35 * DEG)
    root, _ = root_for_hip(np.array([hip_x, hip_y, hip_z]), trunk)
    q["pelvis"], q["spine"] = trunk, trunk
    q["neck"], q["head"] = rx(18 * DEG), rx(4 * DEG)
    for S, (thigh, shin, ab, _) in legs.items():
        side = q_axis([0, 0, 1], ab)
        q["thigh." + S] = qmul(side, rx(thigh * DEG))
        q["shin." + S] = qmul(side, rx(shin * DEG))
        q["foot." + S] = IDENT  # flat, toes forward
    for S, sgn in (("L", -1), ("R", 1)):
        q["upper_arm." + S] = rx(-25 * DEG)  # the elbows a little forward
        fore = qmul(q_axis([0, 1, 0], sgn * 48 * DEG), rx(-95 * DEG))  # the forearms level, turned in to meet at the chest
        q["forearm." + S] = q["hand." + S] = q["fingers." + S] = fore
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- ab roller ----------
# The owner's reference (sweat.com/exercises/ab-roller, 2026-09-19): kneeling, a hand on each handle directly
# below the chest, lean forward with a neutral spine so the wheel rolls out, pull it back with the abdominals.
# The knees stay planted; the thighs and trunk open out toward one line and the arms reach along it.
WHEEL_R = 0.10


def ab_roller_stage(thigh_deg, trunk_deg, hand_ahead):
    """Knees on the floor at z = 0 with the shins behind; the thigh and trunk by angle (rx: positive tips the
    hips and shoulders forward); the hands on the wheel's axle, hand_ahead in front of the shoulders."""
    q = all_ident()
    thigh, trunk = thigh_deg * DEG, trunk_deg * DEG
    knee = np.array([0.0, 0.06, 0.0])
    hip = knee + np.array([0.0, math.cos(thigh), math.sin(thigh)]) * L_THIGH
    root, pelvis_pos = root_for_hip(hip, rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk - 12 * DEG), rx(trunk - 25 * DEG)  # the neck in line, the eyes to the floor ahead
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(thigh), rx(90 * DEG), rx(120 * DEG)  # shins on the floor, toes back
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([shoulder[0], WHEEL_R, shoulder[2] + hand_ahead])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a), PRONATE)  # gripping the handles
    return {"root": [round(float(v), 4) for v in root], "q": q}


def ab_roller_sample(t):
    """One rollout from kneeling: out over the first half, back over the second."""
    f = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    thigh = 18 + (60 - 18) * f  # as far as a neutral spine allows, not flat to the floor
    trunk = 62 + (74 - 62) * f
    ahead = 0.08 + (0.46 - 0.08) * f
    return ab_roller_stage(thigh, trunk, ahead)


# ---------- nine from sweat.com (the owner's references, 2026-09-19) ----------
def single_leg_rdl_knee_up_sample(t):
    """sweat.com/exercises/single-leg-romanian-deadlift-knee-up: standing on the left leg with its knee softly
    bent, hinge until the trunk is level with the right leg extended behind (toes to the floor) and the arms
    reaching in front; stand back up on the left leg and bring the right knee to the chest; lower the leg
    without touching down."""
    def stage(trunk_deg, r_thigh, r_shin, r_foot, up_deg, fo_deg, head_deg):
        q = all_ident()
        hip = hip_from_feet(-10, 5)
        trunk = rx(trunk_deg * DEG)
        root, _ = root_for_hip(hip, trunk)
        q["pelvis"], q["spine"] = trunk, trunk
        q["neck"], q["head"] = rx(head_deg * 0.6 * DEG), rx(head_deg * DEG)
        set_legs(q, -10 * DEG, 5 * DEG, 0.0, side="L")
        q["thigh.R"], q["shin.R"], q["foot.R"] = rx(r_thigh * DEG), rx(r_shin * DEG), rx(r_foot * DEG)
        set_arms(q, up_deg * DEG, fo_deg * DEG)
        return {"root": [round(float(v), 4) for v in root], "q": q}
    ready = stage(2, -8, 12, 0, 0, 0, 0)  # tall, the right foot just off the floor
    hinge = stage(85, 85, 85, 90, -88, -88, 45)  # trunk level, the right leg level behind, arms reaching ahead
    tall = stage(0, -8, 12, 0, 0, 0, 0)
    knee = stage(-4, -105, -12, 0, 0, 0, 0)  # the right knee to the chest
    return sequence([(0, ready), (0.35, hinge), (0.62, tall), (0.78, knee), (1, ready)], t)


def windshield_wipers_sample(t):
    """sweat.com/exercises/windshield-wipers: on the back with the arms out in a T, the legs held straight up at
    a right angle to the hips; lower them to the right until nearly parallel with the floor, back up, then to the
    left."""
    def stage(roll_deg):
        q = all_ident()
        flat = rx(-90 * DEG)
        root, _ = root_for_hip(np.array([0.0, 0.12, 0.0]), flat)
        q["spine"], q["neck"], q["head"] = flat, flat, flat
        q["pelvis"] = qmul(q_axis([0, 0, 1], roll_deg * 0.6 * DEG), flat)  # the pelvis turns most of the way with the legs
        legs = qmul(q_axis([0, 0, 1], roll_deg * DEG), rx(180 * DEG))  # straight up, then swung to the side
        for S in ("L", "R"):
            q["thigh." + S], q["shin." + S] = legs, legs
            q["foot." + S] = qmul(q_axis([0, 0, 1], roll_deg * DEG), rx(170 * DEG))
        for S, sgn in (("L", 1), ("R", -1)):
            arm = q_axis([0, 0, 1], sgn * 90 * DEG)  # out along the floor
            q["upper_arm." + S] = q["forearm." + S] = q["hand." + S] = q["fingers." + S] = arm
        return {"root": [round(float(v), 4) for v in root], "q": q}
    up, right, left = stage(0), stage(78), stage(-78)  # +z roll takes the legs toward -x, the right
    return sequence([(0, up), (0.25, right), (0.5, up), (0.75, left), (1, up)], t)


def supine_arms_over(legs_deg=-90):
    """Lying on the back, arms stretched overhead along the floor."""
    s = supine_sample()
    set_arms(s["q"], 90 * DEG, 90 * DEG)
    set_legs(s["q"], legs_deg * DEG, legs_deg * DEG, (legs_deg + 20) * DEG)
    return s


def straight_leg_sit_up_sample(t):
    """sweat.com/exercises/straight-leg-sit-up: from lying with the arms overhead, heels planted, the trunk
    curls up and the hands reach forward to the toes; then back down."""
    def stage(trunk_deg, arm_target):
        q = all_ident()
        trunk = rx(trunk_deg * DEG)
        root, pelvis_pos = root_for_hip(np.array([0.0, 0.12, 0.0]), trunk)
        q["pelvis"], q["spine"] = trunk, trunk
        q["neck"], q["head"] = rx((trunk_deg + 12) * DEG), rx((trunk_deg + 20) * DEG)
        set_legs(q, -90 * DEG, -90 * DEG, -70 * DEG)
        if arm_target is None:
            set_arms(q, 180 * DEG, 180 * DEG)  # straight up
        else:
            for S, side in (("L", "l"), ("R", "r")):
                shoulder = shoulder_from(pelvis_pos, trunk, side)
                up_a, fo_a, _ = two_link(shoulder, np.array([shoulder[0], arm_target[0], arm_target[1]]), L_UPPER, L_FORE, bend_forward=False)
                set_arms(q, up_a, fo_a, side=S)
        return {"root": [round(float(v), 4) for v in root], "q": q}
    down = supine_arms_over()
    rising = stage(-40, None)
    top = stage(48, (0.16, 0.82))  # hands to the toes
    return sequence([(0, down), (0.25, rising), (0.5, top), (0.75, rising), (1, down)], t)


def straight_leg_hold_sample(t):
    """sweat.com/exercises/straight-leg-hold: on the back, both legs raised straight to 45 degrees, feet flexed,
    held; entered from lying flat and released."""
    flat = supine_sample()
    hold = supine_sample()
    set_legs(hold["q"], -135 * DEG, -135 * DEG, -145 * DEG)
    return entered(flat, hold, t)


def v_up_sample(t):
    """sweat.com/exercises/v-up: from lying with the arms overhead and the legs together, raise the arms and legs
    at once and touch the toes; lower."""
    down = supine_arms_over()
    # A V: the trunk a little back from upright, the legs 50 degrees up, so the hip angle is open and the trunk
    # does not run through the thighs (owner, 2026-09-20).
    top = all_ident()
    trunk = rx(-12 * DEG)
    root, pelvis_pos = root_for_hip(np.array([0.0, 0.12, 0.0]), trunk)
    top["pelvis"], top["spine"] = trunk, trunk
    top["neck"], top["head"] = rx(0.0), rx(12 * DEG)  # looking at the toes
    set_legs(top, -140 * DEG, -140 * DEG, -130 * DEG)
    foot_tip = np.array([0.0, 0.12, 0.0]) + np.array([0.0, math.cos(-140 * DEG) * -1, math.sin(-140 * DEG) * -1]) * (L_THIGH + L_SHIN)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        target = np.array([shoulder[0], foot_tip[1] + 0.02, foot_tip[2] - 0.04])
        up_a, fo_a, _ = two_link(shoulder, target, L_UPPER, L_FORE, bend_forward=False)
        set_arms(top, up_a, fo_a, side=S)
    top = {"root": [round(float(v), 4) for v in root], "q": top}
    mid = blend_samples(down, top, 0.5)
    set_arms(mid["q"], 150 * DEG, 150 * DEG)  # the arms come over the top, not through the floor
    return sequence([(0, down), (0.25, mid), (0.5, top), (0.75, mid), (1, down)], t)


def pike_push_up_sample(t):
    """sweat.com/exercises/pike-push-up: hands a little wider than the shoulders, feet behind on the balls, hips
    high in an inverted V; bend the elbows to lower the forehead toward the floor, rocking onto the toes, and
    press back up."""
    f = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    hip = np.array([0.0, 0.78 - 0.06 * f, -0.40 + 0.06 * f])
    shoulder_mid = np.array([0.0, 0.52 - 0.15 * f, -0.03 + 0.02 * f])
    ankle = np.array([0.0, 0.06, -0.83])
    q = all_ident()
    d = shoulder_mid - hip
    trunk_a = math.atan2(d[2], d[1])
    trunk = rx(trunk_a)
    root, pelvis_pos = root_for_hip(hip, trunk)
    q["pelvis"], q["spine"] = trunk, trunk
    q["neck"], q["head"] = rx(trunk_a + 8 * DEG), rx(trunk_a + 15 * DEG)  # the forehead to the floor
    leg = ankle - hip
    leg_a = angle_of(leg / np.linalg.norm(leg))
    set_legs(q, leg_a, leg_a, 75 * DEG)  # on the balls of the feet
    for S, side, sgn in (("L", "l", 1), ("R", "r", -1)):
        shoulder = shoulder_from(pelvis_pos, trunk, side)
        hand = np.array([sgn * (SHOULDER_X + 0.06), 0.0, 0.0])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)  # flat, fingers forward
    return {"root": [round(float(v), 4) for v in root], "q": q}


def high_plank_sample():
    """A plank on straight arms, hands under the shoulders, feet a little wider than the hips."""
    q = all_ident()
    trunk = rx(68 * DEG)
    root, _ = root_for_hip(np.array([0.0, 0.42, 0.0]), trunk)
    q["pelvis"], q["spine"] = trunk, trunk
    q["neck"], q["head"] = rx(60 * DEG), rx(50 * DEG)
    set_legs(q, 68 * DEG, 68 * DEG, 95 * DEG)
    for S in ("L", "R"):
        q["upper_arm." + S], q["forearm." + S] = IDENT, qmul(IDENT, PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def shoulder_tap_sample(t):
    """sweat.com/exercises/shoulder-tap: in a high plank, the right hand crosses to tap the left shoulder and
    returns, then the left hand taps the right shoulder."""
    plank = high_plank_sample()

    def tap(S, sgn):
        s = {"root": list(plank["root"]), "q": dict(plank["q"])}
        across = q_axis([0, 1, 0], sgn * 70 * DEG)  # the arm folds across the chest
        s["q"]["upper_arm." + S] = qmul(across, rx(-40 * DEG))
        s["q"]["forearm." + S] = s["q"]["hand." + S] = s["q"]["fingers." + S] = qmul(across, rx(-130 * DEG))
        return s
    right, left = tap("R", 1), tap("L", -1)  # the right hand (at -x) swings toward +x, the left shoulder
    return sequence([(0, plank), (0.15, right), (0.35, right), (0.5, plank), (0.65, left), (0.85, left), (1, plank)], t)


def double_leg_lift_sample(t):
    """sweat.com/exercises/double-leg-lift: lying on the right side, the right arm along the mat under the head,
    hips stacked and the legs in line; the obliques draw the right hip toward the ribs and lift both legs;
    lower."""
    roll = q_axis([0, 0, 1], -90 * DEG)  # from lying on the back onto the right side, the front toward +x

    def stage(lift_deg):
        q = all_ident()
        body = qmul(roll, rx(-90 * DEG))
        root, _ = root_for_hip(np.array([0.0, 0.14, 0.0]), body)
        q["spine"], q["neck"], q["head"] = body, body, body
        q["pelvis"] = qmul(roll, qmul(q_axis([0, 1, 0], -lift_deg * 0.3 * DEG), rx(-90 * DEG)))  # the hip hikes with the legs
        legs = qmul(roll, qmul(q_axis([0, 1, 0], -lift_deg * DEG), rx(-90 * DEG)))  # the legs rise toward world +y
        for S in ("L", "R"):
            q["thigh." + S], q["shin." + S] = legs, legs
            q["foot." + S] = qmul(roll, qmul(q_axis([0, 1, 0], -lift_deg * DEG), rx(-70 * DEG)))
        q["upper_arm.R"] = q["forearm.R"] = q["hand.R"] = q["fingers.R"] = qmul(roll, rx(90 * DEG))  # along the mat overhead
        q["upper_arm.L"] = qmul(roll, rx(-20 * DEG))  # the left hand on the floor in front
        q["forearm.L"] = q["hand.L"] = q["fingers.L"] = qmul(roll, qmul(q_axis([0, 0, 1], -60 * DEG), rx(-60 * DEG)))
        return {"root": [round(float(v), 4) for v in root], "q": q}
    f = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    return stage(22 * f)


def straight_leg_raise_sample(t):
    """sweat.com/exercises/straight-leg-raise: on the back, legs straight, raise them to a right angle with
    the hips and lower them without touching the floor."""
    f = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    leg = -100 + (-180 + 100) * f
    s = supine_sample()
    set_legs(s["q"], leg * DEG, leg * DEG, (leg - 10) * DEG)
    set_arms(s["q"], -90 * DEG, -90 * DEG, palm_down=True)  # pressing into the floor by the sides
    return s


# ---------- racket sports (owner, 2026-09-22; form from coaching pages, see src/lib/exercises/racket-sports.ts) ----------
# A right-handed player facing the net (+z). Each stroke is a sequence of stages given in the body's own frame:
# the trunk's yaw about the vertical (positive turns the chest toward +x, the left), a forward lean, the knee
# bend, and where each hand is relative to its shoulder in the body frame (x left, y up, z toward the net). The
# arms are solved in 3D (two_link_3d, aim with the body's forward as the front, so they hinge without rolling).
STANCE = 0.20  # each foot this far from the midline


WRIST_MAX = 72 * DEG  # how far the hand may be cocked from the forearm line


def frame_q(along, x_dir):
    """The quaternion for a bone pointing along `along` (rest: down) whose rest +x goes to x_dir (made
    perpendicular to `along`)."""
    y = -np.asarray(along, dtype=float)
    y = y / max(float(np.linalg.norm(y)), 1e-9)
    x = np.asarray(x_dir, dtype=float)
    x = x - np.dot(x, y) * y
    x = x / max(float(np.linalg.norm(x)), 1e-9)
    z = np.cross(x, y)
    return q_from_matrix(np.column_stack([x, y, z]))


def rest_fix(a, b):
    """The least rotation taking the rig's rest direction of the bone from joint a to joint b onto straight
    down. The designs aim each bone as if it hung straight down at rest, but the figure's upper arm hangs 10
    degrees off that and its forearm 17, so the real elbow and wrist landed up to 9 cm from the design (and the
    arms in the chest); aim(v) followed by this puts the real bone along v."""
    u = rig[b] - rig[a]
    u = u / float(np.linalg.norm(u))
    axis = np.cross(u, DOWN)
    s = float(np.linalg.norm(axis))
    if s < 1e-9:
        return IDENT
    return q_axis(axis / s, math.atan2(s, float(np.dot(u, DOWN))))


# The torso in the rest pose as a signed distance field: the figure's own body, filled solid, the part skinned
# mostly to the hips, spine or a clavicle (tools/myo/measure_torso.py writes torso_sdf.npz from the rig the site
# plays). The racket strokes keep the arms outside it (owner, 2026-10-04 and -06: the arms went through the
# body). Convex outlines per height, used before this, cut straight across the hollow under each arm, so they
# could not tell an arm resting at the side from one pressed into the chest.
#
# The arms are tested by their own skin: a sample of each arm's vertices, skinned the way the rig will skin them
# (each blended between the torso, upper arm, forearm and hand by its weights), measured in that field. A capsule
# round the bones cannot see what matters most: the skin of the armpit, up to 14 cm off the upper arm's axis,
# folding into the chest as the arm crosses it.
def _load_torso():
    z = np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), "torso_sdf.npz"))
    arms = {}
    for s in "lr":
        v, w = z["arm_" + s].astype(float), z["arm_" + s + "_w"].astype(float)
        far = np.linalg.norm(v - rig["shoulder." + s], axis=1) > SHOULDER_SKIP
        arms[s] = (v[far], w[far])
    torso = (z["sdf_mm"].astype(float) / 1000.0, z["origin"].astype(float))
    head = (z["head_sdf_mm"].astype(float) / 1000.0, z["head_origin"].astype(float))
    return torso, head, float(z["voxel"]), z["neck_joint"].astype(float), z["head_joint"].astype(float), arms


SHOULDER_SKIP = 0.12  # the top of the upper arm is the deltoid joining the shoulder
SKIN_TOLERANCE = 0.005  # a resting arm's skin may press this far into the side
FOREARM_MARGIN = 0.01  # how far the forearm and hand are kept off the body
BELLY_TOP = 1.2  # the height (at rest) up to which the belly turns less than the chest
FOREARM_SKIN = 0.045  # the forearm's skin from its bone, for keeping the other hand off it (at 3.5 cm the rig
# still showed the right fingers 1.7 cm into the left forearm as the hands met on a paddle, 2026-10-08)
TORSO_FIELD, HEAD_FIELD, FIELD_VOX, NECK_J, HEAD_J, ARM_SKIN = _load_torso()
FOREARM_RADIUS = 0.035  # for keeping the other hand off the forearm


def _qinv(q):
    return [-q[0], -q[1], -q[2], q[3]]


def torso_rest(p, pelvis_pos, qp, qs):
    """A world point into the rest torso frame (below L5 by the pelvis, above by the chest), and the way back."""
    l5_w = pelvis_pos + q_rot(qp, rig["l5"] - rig["pelvis"])
    above = rig["l5"] + q_rot(_qinv(qs), p - l5_w)
    if above[1] >= rig["l5"][1]:
        return above, (lambda r: l5_w + q_rot(qs, r - rig["l5"]))
    return rig["pelvis"] + q_rot(_qinv(qp), p - pelvis_pos), (lambda r: pelvis_pos + q_rot(qp, r - rig["pelvis"]))


def torso_clear(pr, radius):
    """Distance from a rest-frame point's surface (a sphere of `radius`) to the torso; < 0 is inside."""
    return float(_sdf(TORSO_FIELD, np.asarray(pr, dtype=float)[None, :])[0]) - radius


def torso_push_front(p, pelvis_pos, qp, qs, radius):
    """A hand inside (or within `radius` of) the torso moved straight forward in the torso's frame until clear:
    a hand crossing the body passes in front of it, never through it."""
    pr, back = torso_rest(p, pelvis_pos, qp, qs)
    if torso_clear(pr, radius) >= 0:
        return p
    pr = pr.copy()
    for _ in range(500):
        pr[2] += 0.002
        if torso_clear(pr, radius) >= 0:
            break
    return back(pr)


def _qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def _sdf(field, pts):
    """A field (distances, origin) at rest-frame points, trilinear; off the field is clear."""
    F, origin = field
    g = (pts - origin) / FIELD_VOX
    i = np.floor(g).astype(int)
    ok = ((i >= 0) & (i + 1 < np.array(F.shape))).all(axis=1)
    out = np.ones(len(pts))
    i, f = i[ok], g[ok] - i[ok]
    acc = np.zeros(len(i))
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                wgt = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                acc += wgt * F[i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz]
    out[ok] = acc
    return out


def arm_skin_world(side, q_up, q_fo, q_ha, shoulder_w, pelvis_pos, qp, qs, parts=(1, 2, 3)):
    """The arm's sampled skin vertices mostly skinned to one of `parts` (1 upper arm, 2 forearm, 3 hand), skinned
    by the arm's bone rotations (world, from rest) and the torso's; with the elbow and wrist."""
    v, w = ARM_SKIN[side]
    sh, el, wr = rig["shoulder." + side], rig["elbow." + side], rig["wrist." + side]
    R_up, R_fo, R_ha = _qmat(q_up), _qmat(q_fo), _qmat(q_ha)
    el_w = shoulder_w + R_up @ (el - sh)
    wr_w = el_w + R_fo @ (wr - el)
    l5_w = pelvis_pos + q_rot(qp, rig["l5"] - rig["pelvis"])
    keep = np.isin(w.argmax(axis=1), parts)
    v, w = v[keep], w[keep]
    world = (w[:, :1] * (l5_w + (v - rig["l5"]) @ _qmat(qs).T) + w[:, 1:2] * (shoulder_w + (v - sh) @ R_up.T)
             + w[:, 2:3] * (el_w + (v - el) @ R_fo.T) + w[:, 3:4] * (wr_w + (v - wr) @ R_ha.T))
    return world, el_w, wr_w


def arm_skin_clear(side, q_up, q_fo, q_ha, shoulder_w, pelvis_pos, qp, qs, qn=None, qh=None, parts=(1, 2, 3)):
    """How far the arm's skin is outside the body (< 0 inside): the torso, in its rest frame, and, given the neck
    and head rotations, the head in its own (it turns less than the chest, so the chin meets an arm the chest
    would have missed)."""
    world, _, _ = arm_skin_world(side, q_up, q_fo, q_ha, shoulder_w, pelvis_pos, qp, qs, parts)
    if not len(world):
        return 1.0
    l5_w = pelvis_pos + q_rot(qp, rig["l5"] - rig["pelvis"])
    R_s = _qmat(qs)
    rest = rig["l5"] + (world - l5_w) @ R_s
    low = rest[:, 1] < rig["l5"][1]
    if low.any():
        rest[low] = rig["pelvis"] + (world[low] - pelvis_pos) @ _qmat(qp)
    worst = float(_sdf(TORSO_FIELD, rest).min())
    # The belly turns part of the way between the hips and the chest, so at its height the torso is also tried
    # turned halfway (the forehands' backswing grazed it where the chest alone said clear).
    belly = rest[:, 1] < BELLY_TOP
    if belly.any():
        mid = q_slerp(qp, qs, 0.5)
        worst = min(worst, float(_sdf(TORSO_FIELD, rig["l5"] + (world[belly] - (pelvis_pos + q_rot(qp, rig["l5"] - rig["pelvis"]))) @ _qmat(mid)).min()))
    if qh is not None:
        neck_w = l5_w + R_s @ (NECK_J - rig["l5"])
        head_w = neck_w + _qmat(qn) @ (HEAD_J - NECK_J)
        worst = min(worst, float(_sdf(HEAD_FIELD, HEAD_J + (world - head_w) @ _qmat(qh)).min()))
    return worst


def hands_apart(skin_l, skin_r):
    """How far each hand's skin is from the other forearm's (< 0 inside it). Each skin is (hand vertices,
    elbow, wrist)."""
    worst = 1.0
    for (hand, _, _), (_, el, wr) in ((skin_l, skin_r), (skin_r, skin_l)):
        if not len(hand):
            continue
        ax = wr - el
        t = np.clip((hand - el) @ ax / float(ax @ ax), 0.0, 1.0)
        worst = min(worst, float(np.linalg.norm(hand - (el + t[:, None] * ax), axis=1).min()) - FOREARM_SKIN)
    return worst


def elbow_clear_of_torso(shoulder, hand, bend, clear_fn, avoid=None):
    """The elbow on its circle about the shoulder-hand line: the one nearest the intended bend whose arm's skin
    stays out of the torso (clear_fn(elbow, wrist) says by how much), with the forearm off the `avoid` points
    (each a point and a radius), or failing that the clearest."""
    d = hand - shoulder
    n = max(float(np.linalg.norm(d)), 1e-9)
    u = d / n
    dist = min(n, L_UPPER + L_FORE - 1e-4)
    a = (L_UPPER ** 2 - L_FORE ** 2 + dist ** 2) / (2 * dist)
    h = math.sqrt(max(L_UPPER ** 2 - a * a, 0.0))
    c = shoulder + u * a
    wrist = shoulder + u * dist
    b = np.asarray(bend, dtype=float)
    e1 = b - np.dot(b, u) * u
    if float(np.linalg.norm(e1)) < 1e-6:
        e1 = np.cross(u, [0.0, 0.0, 1.0])
    e1 = e1 / float(np.linalg.norm(e1))
    e2 = np.cross(u, e1)
    best_clear, best_any = None, None
    for k in range(72):
        th = k * 5 * DEG
        elbow = c + h * (math.cos(th) * e1 + math.sin(th) * e2)
        clr = clear_fn(elbow, wrist) + SKIN_TOLERANCE
        for p, rad in avoid or ():
            # the other hand: kept off this forearm
            for j in range(1, 6):
                pt = elbow + (wrist - elbow) * j / 6
                clr = min(clr, float(np.linalg.norm(pt - p)) - rad - FOREARM_RADIUS)
        dev = min(th, 2 * math.pi - th)
        if clr >= 0 and (best_clear is None or dev < best_clear[0]):
            best_clear = (dev, elbow)
        if best_any is None or clr > best_any[0]:
            best_any = (clr, elbow)
    return (best_clear or best_any)[1], wrist


def _racket_body(yaw_deg, lean_deg, thigh_deg, shin_deg, r_hand, l_hand, hip_yaw=0.4, r_bend=(-0.6, -1.0, -0.4), l_bend=(0.6, -1.0, -0.4), rdir=None, both=0.0, **_):
    """One stage of a stroke without its arms, in the body's frame (x left, y up, z toward the net): the trunk's
    yaw and lean, the knee bend, each hand's offset from its shoulder, and `rdir`, the way the racket points
    from the hand. With `both` the left hand holds the handle just above the right."""
    q = all_ident()
    yaw = q_axis([0, 1, 0], yaw_deg * DEG)
    trunk = qmul(yaw, rx(lean_deg * DEG))
    pelvis = qmul(q_axis([0, 1, 0], yaw_deg * hip_yaw * DEG), rx(lean_deg * 0.4 * DEG))
    hip_y = 0.06 + L_SHIN * math.cos(shin_deg * DEG) + L_THIGH * math.cos(thigh_deg * DEG)
    root, pelvis_pos = root_for_hip(np.array([0.0, hip_y, 0.0]), pelvis)
    q["pelvis"], q["spine"] = pelvis, trunk
    q["neck"] = qmul(q_axis([0, 1, 0], yaw_deg * 0.6 * DEG), rx(lean_deg * 0.3 * DEG))
    q["head"] = qmul(q_axis([0, 1, 0], yaw_deg * 0.3 * DEG), rx(lean_deg * 0.15 * DEG))  # the eyes stay nearer the net
    ab = math.atan2(STANCE - float(abs(rig["hip.l"][0])), hip_y - 0.06)
    for S, sgn in (("L", 1), ("R", -1)):
        side = q_axis([0, 0, 1], sgn * ab)
        q["thigh." + S], q["shin." + S], q["foot." + S] = qmul(side, rx(thigh_deg * DEG)), qmul(side, rx(shin_deg * DEG)), IDENT
    sh = {"R": shoulder_from(pelvis_pos, trunk, "r"), "L": shoulder_from(pelvis_pos, trunk, "l")}
    return {"q": q, "root": root, "pelvis_pos": pelvis_pos, "pelvis": pelvis, "trunk": trunk, "front": q_rot(yaw, np.array([0.0, 0.0, 1.0])),
            "sh": sh, "r": q_rot(yaw, np.asarray(rdir, dtype=float) / float(np.linalg.norm(rdir))),
            "hand_R": sh["R"] + q_rot(yaw, np.asarray(r_hand, dtype=float)), "hand_L": sh["L"] + q_rot(yaw, np.asarray(l_hand, dtype=float)),
            "bend": {"R": q_rot(yaw, np.asarray(r_bend, dtype=float)), "L": q_rot(yaw, np.asarray(l_bend, dtype=float))},
            # how much the left hand holds the racket: 0 free, 1 on the handle, eased in between
            "both": float(both), "l_holds": float(np.clip((float(both) - 0.3) / 0.4, 0.0, 1.0)) ** 2 * (3 - 2 * float(np.clip((float(both) - 0.3) / 0.4, 0.0, 1.0)))}


def _cyc_smooth(a, sigma, w=None):
    """Gaussian smoothing of the rows of `a` (frames by values) around the loop, weighted by `w`."""
    a = np.asarray(a, dtype=float).reshape(len(a), -1)
    w = np.ones(len(a)) if w is None else np.asarray(w, dtype=float)
    r = max(1, int(math.ceil(3 * sigma)))
    num, den = np.zeros_like(a), np.zeros(len(a))
    for o in range(-r, r + 1):
        k = math.exp(-0.5 * (o / sigma) ** 2)
        num += k * np.roll(a * w[:, None], -o, axis=0)
        den += k * np.roll(w, -o)
    return num / np.maximum(den, 1e-12)[:, None]


def _cyc_envelope(a, radius):
    """The running maximum around the loop, so a correction a frame needs is in place before and after it."""
    return np.max([np.roll(a, o, axis=0) for o in range(-radius, radius + 1)], axis=0)


def _cock(d, r):
    """The hand's direction for a forearm along d holding a racket along r: the racket runs out of the palm, so
    the hand lies across the racket, cocked from the forearm line by at most WRIST_MAX."""
    h = d - np.dot(d, r) * r
    n = float(np.linalg.norm(h))
    h = d if n < 1e-6 else h / n
    ang = math.acos(max(-1.0, min(1.0, float(np.dot(d, h)))))
    if ang > WRIST_MAX:
        axis = np.cross(d, h)
        axis = axis / max(float(np.linalg.norm(axis)), 1e-9)
        h = q_rot(q_axis(axis, WRIST_MAX), d)
    return h


def _frame_from(y_down, x):
    """The rotation taking a bone's rest frame (down along -y) to point along y_down with its +x along x."""
    y = -np.asarray(y_down, dtype=float)
    y = y / float(np.linalg.norm(y))
    x = np.asarray(x, dtype=float) - np.dot(x, y) * y
    x = x / max(float(np.linalg.norm(x)), 1e-9)
    return q_from_matrix(np.column_stack([x, y, np.cross(x, y)]))


def _continuous_x(dirs, want, conf, sigma=1.0, want_b=None, blend=None):
    """Each frame's x axis for a bone pointing along dirs[i], as near the wanted x as the neighbours allow: the
    wanted angle about the bone, measured from a reference carried along the bone without twist (and closed
    round the loop), smoothed with weights `conf`. With `want_b` and `blend`, the wanted angle is eased from
    want's to want_b's by blend, along the arc that changes least from frame to frame. A bone's roll is undefined in some poses (an arm pointing
    straight at the chest's front, a forearm along the racket), and taking it frame by frame flipped it by up
    to 180 degrees between two frames (owner, 2026-10-07: the swings moved in a weird way)."""
    n = len(dirs)
    y = np.array([-v / float(np.linalg.norm(v)) for v in dirs])

    def carry(x, y0, y1):
        axis = np.cross(y0, y1)
        sn = float(np.linalg.norm(axis))
        if sn > 1e-9:
            x = q_rot(q_axis(axis / sn, math.atan2(sn, float(np.dot(y0, y1)))), x)
        x = x - np.dot(x, y1) * y1
        return x / float(np.linalg.norm(x))

    x0 = want[0] - np.dot(want[0], y[0]) * y[0]
    if float(np.linalg.norm(x0)) < 1e-6:
        x0 = np.cross(y[0], [0.0, 0.0, 1.0]) if abs(y[0][2]) < 0.9 else np.cross(y[0], [1.0, 0.0, 0.0])
    ref = [x0 / float(np.linalg.norm(x0))]
    for i in range(1, n):
        ref.append(carry(ref[-1], y[i - 1], y[i]))
    back = carry(ref[-1], y[-1], y[0])
    hol = math.atan2(float(np.dot(np.cross(ref[0], back), y[0])), float(np.dot(ref[0], back)))
    ref = [q_rot(q_axis(y[i], -hol * i / n), ref[i]) for i in range(n)]
    def angles(wants):
        ang, cs = np.zeros(n), np.zeros(n)
        for i in range(n):
            x = wants[i] - np.dot(wants[i], y[i]) * y[i]
            cs[i] = float(np.linalg.norm(x))
            if cs[i] > 1e-9:
                x = x / cs[i]
                ang[i] = math.atan2(float(np.dot(np.cross(ref[i], x), y[i])), float(np.dot(ref[i], x)))
        return ang, cs

    ang, cs = angles(want)
    if want_b is not None:
        ang_b, cs_b = angles(want_b)
        diff = np.unwrap(ang_b - ang)
        bl = np.asarray(blend, dtype=float)
        ang = ang + bl * diff
        cs = (1 - bl) * cs + bl * cs_b
    sm = _smooth_angles(ang, cs * np.asarray(conf, dtype=float), sigma)
    return [q_rot(q_axis(y[i], sm[i]), ref[i]) for i in range(n)]


def _smooth_angles(ang, w, sigma):
    """Angles round the loop, smoothed with weights w: unwrapped through the frames that are sure of theirs
    (w at least a fifth of the most), filled in between them, then smoothed. Where an angle is undefined for a
    few frames and comes back half a turn away, it turns through those frames instead of flipping in one."""
    n = len(ang)
    w = np.asarray(w, dtype=float)
    sure = np.flatnonzero(w >= 0.2 * max(float(w.max()), 1e-9))
    if len(sure) == 0:
        return np.zeros(n)
    steps = [math.atan2(math.sin(ang[sure[(k + 1) % len(sure)]] - ang[sure[k]]), math.cos(ang[sure[(k + 1) % len(sure)]] - ang[sure[k]])) for k in range(len(sure))]
    unw = np.concatenate([[ang[sure[0]]], ang[sure[0]] + np.cumsum(steps[:-1])]) if len(sure) > 1 else np.array([ang[sure[0]]])
    wind = float(sum(steps)) if len(sure) > 1 else 0.0  # whole turns round the loop
    flat = unw - wind * sure / n
    xs = np.concatenate([sure - n, sure, sure + n])
    full = np.interp(np.arange(n), xs, np.concatenate([flat, flat, flat]))
    sm = _cyc_smooth(full, sigma, w + 0.05 * max(float(w.max()), 1e-9))[:, 0]
    return sm + wind * np.arange(n) / n


def _front_x(v, front):
    """A bone's x axis with its front (+z) kept toward the chest's front, as at rest; and how sure that is (it
    is undefined for a bone pointing straight along the front)."""
    y = -v / float(np.linalg.norm(v))
    z = front - np.dot(front, y) * y
    c = float(np.linalg.norm(z))
    if c < 1e-6:
        z = np.array([0.0, 1.0, 0.0]) - y[1] * y
    z = z / float(np.linalg.norm(z))
    return np.cross(y, z), c


def _arm_q(S, shoulder, elbow, wrist, r, holds, front):
    """An arm's bone rotations for testing an elbow, rolled as the final pose rolls them (_racket_arm_q): the
    upper arm (and a free forearm and hand) with its front kept toward the chest's front, a holding forearm and
    hand by the racket. The upper arm's roll decides how the armpit's skin folds: rolled as a hinge instead, a
    serve's arm swung back creased 3 cm into the side on the rig (2026-10-07), so it keeps its rest roll."""
    s = S.lower()
    d = (wrist - elbow) / max(float(np.linalg.norm(wrist - elbow)), 1e-9)
    q_up = qmul(_frame_from(elbow - shoulder, _front_x(elbow - shoulder, front)[0]), rest_fix("shoulder." + s, "elbow." + s))
    if holds >= 0.5:
        h = holds * _cock(d, r) + (1 - holds) * d
        q_fo = qmul(_frame_from(d, -r), rest_fix("elbow." + s, "wrist." + s))
        q_ha = _frame_from(h / float(np.linalg.norm(h)), -r)
    else:
        xf = _front_x(d, front)[0]
        q_fo = qmul(_frame_from(d, xf), rest_fix("elbow." + s, "wrist." + s))
        q_ha = _frame_from(d, xf)
    return q_up, q_fo, q_ha


ELBOW_STEPS = 72  # elbow positions tried on its circle, 5 degrees apart
CORRIDOR = 8  # a hand is pushed forward until this many elbow positions (40 degrees of its circle) clear the
# body: with one or two clear, the elbow was forced through a gap far from where it had been a frame before
REACH = 0.97  # the hand kept within this much of the arm's length: at full reach the elbow's circle shrinks to a
# point, and the elbow came out of it on the other side, the upper arm rolled half a turn in a frame


def _elbow_table(S, f, target, r_skin=None):
    """For one arm at one frame: the elbow on each of ELBOW_STEPS positions round its circle (starting at the
    intended bend), the wrist, and each one's clearance (the upper arm's skin may press SKIN_TOLERANCE into the
    body, where its armpit folds; the forearm and hand keep FOREARM_MARGIN off it, and off the other forearm)."""
    s = S.lower()
    shoulder = f["sh"][S]
    d = target - shoulder
    n = max(float(np.linalg.norm(d)), 1e-9)
    u = d / n
    dist = min(n, REACH * (L_UPPER + L_FORE))
    a = (L_UPPER ** 2 - L_FORE ** 2 + dist ** 2) / (2 * dist)
    h = math.sqrt(max(L_UPPER ** 2 - a * a, 0.0))
    c, wrist = shoulder + u * a, shoulder + u * dist
    e1 = f["bend"][S] - np.dot(f["bend"][S], u) * u
    if float(np.linalg.norm(e1)) < 1e-6:
        e1 = np.cross(u, [0.0, 0.0, 1.0])
    e1 = e1 / float(np.linalg.norm(e1))
    e2 = np.cross(u, e1)
    holds = 1.0 if S == "R" else f["l_holds"]
    r = f["r"]
    elbows, clear, line, apart = [], [], [], []
    args = (f["pelvis_pos"], f["pelvis"], f["trunk"], f["q"]["neck"], f["q"]["head"])
    for k in range(ELBOW_STEPS):
        th = 2 * math.pi * k / ELBOW_STEPS
        elbow = c + h * (math.cos(th) * e1 + math.sin(th) * e2)
        qa = _arm_q(S, shoulder, elbow, wrist, r, holds, f["front"])
        clr = min(arm_skin_clear(s, *qa, shoulder, *args[:3], args[3], args[4], parts=(1,)) + SKIN_TOLERANCE,
                  arm_skin_clear(s, *qa, shoulder, *args[:3], args[3], args[4], parts=(2, 3)) - FOREARM_MARGIN)
        ap = 1.0
        if r_skin is not None:
            mine = arm_skin_world(s, *qa, shoulder, f["pelvis_pos"], f["pelvis"], f["trunk"], parts=(3,))
            ap = hands_apart(mine, r_skin) - SKIN_TOLERANCE
        apart.append(ap)
        clr = min(clr, ap)
        elbows.append(elbow)
        clear.append(clr)
        # how near the forearm lies to the racket's line: the racket leaves the palm across the hand, so a
        # racket along the forearm wants the wrist bent 90 degrees, and as the forearm passes that line the
        # hand swaps sides (the hand flipped over in a frame); kept off by the elbow's choice
        dd = (wrist - elbow) / max(float(np.linalg.norm(wrist - elbow)), 1e-9)
        line.append(holds * max(0.0, abs(float(np.dot(dd, r))) - math.cos(40 * DEG)) / (1 - math.cos(40 * DEG)))
    return np.array(elbows), wrist, np.array(clear), np.array(line), np.array(apart)


def _elbow_path(tables):
    """The elbow at every frame, chosen over the whole loop at once: clear of the body, as near the intended bend
    as that allows, and moving as little as possible from frame to frame (choosing each frame's elbow on its own
    let it leap across its circle between frames). Clearance is a cost, not a wall: a centimetre within the
    tolerances costs less than a leap of 10 cm, which a wall had forced wherever the clear region moved."""
    n = len(tables)
    E = [t[0] for t in tables]
    unary = []
    for elbows, _, clear, line, _ in tables:
        dev = 1 - np.cos(2 * np.pi * np.arange(ELBOW_STEPS) / ELBOW_STEPS)
        pen = np.maximum(0.0, -clear) / 0.01  # cm into the body (past the tolerances)
        unary.append(3.0 * dev + 8.0 * line + 30.0 * np.minimum(pen, 1.0) + 400.0 * np.maximum(0.0, pen - 1.0))
    order = list(range(n)) * 3  # the loop unrolled three times; the middle pass is kept
    cost = unary[order[0]].copy()
    back = []
    for a, b in zip(order[:-1], order[1:]):
        dist = np.sqrt(np.sum((E[a][:, None, :] - E[b][None, :, :]) ** 2, axis=2))
        pair = (dist / 0.04) ** 2 + (np.maximum(0.0, dist - 0.07) / 0.01) ** 2  # a leap costs more than a graze
        tot = cost[:, None] + pair
        arg = np.argmin(tot, axis=0)
        back.append(arg)
        cost = tot[arg, np.arange(ELBOW_STEPS)] + unary[b]
    k = int(np.argmin(cost))
    path = [k]
    for arg in reversed(back):
        k = int(arg[k])
        path.append(k)
    path = path[::-1]
    return [path[n + i] for i in range(n)]


def _smooth_elbows(tables, path, sigma=1.2):
    """The chosen elbows, smoothed over the loop and put back on each frame's circle; a frame keeps its chosen
    elbow where the smoothed one would be less clear. The elbow's clear region can move fast (the hand swinging
    behind the hip), and following it exactly left a one-frame hitch."""
    n = len(tables)
    E = np.array([tables[i][0][path[i]] for i in range(n)])
    Es = _cyc_smooth(E, sigma)
    out = []
    for i in range(n):
        el, _, clear = tables[i][0], tables[i][1], tables[i][2]
        c = el.mean(axis=0)
        rad = float(np.linalg.norm(el[0] - c))
        nrm = np.cross(el[0] - c, el[ELBOW_STEPS // 4] - c)
        nrm = nrm / max(float(np.linalg.norm(nrm)), 1e-12)
        v = Es[i] - c
        v = v - np.dot(v, nrm) * nrm
        if rad < 1e-6 or float(np.linalg.norm(v)) < 1e-9:
            out.append(E[i])
            continue
        p = c + rad * v / float(np.linalg.norm(v))
        # its clearance, between the two candidates either side of it
        ang = (np.arctan2(np.dot(np.cross(el[0] - c, p - c), nrm), np.dot(el[0] - c, p - c)) % (2 * np.pi)) / (2 * np.pi) * ELBOW_STEPS
        k0 = int(math.floor(ang)) % ELBOW_STEPS
        k1 = (k0 + 1) % ELBOW_STEPS
        fr = ang - math.floor(ang)
        clr = clear[k0] * (1 - fr) + clear[k1] * fr
        out.append(p if clr >= min(0.0, float(clear[path[i]])) else E[i])
    return out


def _racket_solve(keys, body=None, params=None):
    """A whole stroke, solved over its loop of N frames at once so that it moves smoothly (_racket_solve_once),
    then checked as built: a frame whose arm still enters the body (or the other arm) has its hand pushed further
    and the stroke is solved again, up to three times. `body` builds a frame from `params(keys, t)` (a racket
    stroke's own by default; the kayak stroke has its own)."""
    body, params = body or _racket_body, params or _racket_params
    frames = [body(**params(keys, i / N)) for i in range(N)]
    extra = {"R": np.zeros(N), "L": np.zeros(N), "up": np.zeros(N)}
    for _ in range(4):
        out, bad = _racket_solve_once(frames, extra)
        if not bad:
            break
        for S, i, which in bad:
            extra[which][i] += 0.02
    RACKET_DEBUG[repr(keys)] = RACKET_DEBUG.pop("last")
    return out


def _arm_clear_final(S, f, q, r_skin=None):
    """How far a built arm is from the body (and, for the left, the right hand from its forearm and back),
    with the tolerances the elbow choice uses; and which of the two it was."""
    s = S.lower()
    a = (q["upper_arm." + S], q["forearm." + S], q["hand." + S], f["sh"][S], f["pelvis_pos"], f["pelvis"], f["trunk"], f["q"]["neck"], f["q"]["head"])
    body = min(arm_skin_clear(s, *a, parts=(1,)) + SKIN_TOLERANCE, arm_skin_clear(s, *a, parts=(2, 3)) - FOREARM_MARGIN)
    if r_skin is None:
        return body, "body"
    ap = hands_apart(arm_skin_world(s, *a[:7], parts=(3,)), r_skin) - SKIN_TOLERANCE
    return (body, "body") if body <= ap else (ap, "apart")


def _racket_solve_once(frames, extra):
    """One solve of a stroke: the hand targets kept in front of the torso and pushed forward (the left hand
    also up the handle, above the right) where too few elbow positions clear the body (CORRIDOR), plus
    `extra`, the pushes spread over the neighbouring frames; the elbow path chosen over all frames
    (_elbow_path); each bone's roll made continuous (_racket_arm_q). Returns the frames and the ones that,
    as built, still have an arm in the body."""
    fronts = [f["front"] for f in frames]
    tR = [torso_push_front(f["hand_R"], f["pelvis_pos"], f["pelvis"], f["trunk"], 0.04) for f in frames]
    pushR = np.zeros(N)
    for i, f in enumerate(frames):
        best = None
        for _ in range(16):
            clr = _elbow_table("R", f, tR[i] + f["front"] * pushR[i])[2]
            if (clr >= 0).sum() >= CORRIDOR:
                break
            if best is not None and np.sort(clr)[-CORRIDOR] < best + 0.002:
                pushR[i] -= 0.01  # pushing further did not help: an arm at the side, not one in front of the body
                break
            best = float(np.sort(clr)[-CORRIDOR])
            pushR[i] += 0.01
    pushR = _cyc_smooth(_cyc_envelope(pushR + extra["R"], 3), 1.5)[:, 0]
    tR = [tR[i] + fronts[i] * pushR[i] for i in range(N)]
    tabR = [_elbow_table("R", frames[i], tR[i]) for i in range(N)]
    pathR = _elbow_path(tabR)
    elR = _smooth_elbows(tabR, pathR)
    wrR = [tabR[i][1] for i in range(N)]
    qR = _racket_arm_q("R", frames, elR, wrR, [1.0] * N)
    r_skin = [arm_skin_world("r", qR[i]["upper_arm.R"], qR[i]["forearm.R"], qR[i]["hand.R"], frames[i]["sh"]["R"], frames[i]["pelvis_pos"], frames[i]["pelvis"], frames[i]["trunk"], parts=(3,)) for i in range(N)]
    r_full = [(r_skin[i][0], r_skin[i][1], r_skin[i][2]) for i in range(N)]

    tL, upL, pushL = [], np.zeros(N), np.zeros(N)
    for i, f in enumerate(frames):
        up = f["r"]
        on_handle = wrR[i] + up * 0.11  # the top hand on the handle, a hand's width up
        t = f["hand_L"] + (on_handle - f["hand_L"]) * f["both"]
        tL.append(torso_push_front(t, f["pelvis_pos"], f["pelvis"], f["trunk"], 0.04))
        hand_pts = r_skin[i][0]
        while f["both"] > 0 and upL[i] < 0.3 and float(np.linalg.norm(hand_pts - (tL[i] + up * upL[i]), axis=1).min()) < 0.05:
            upL[i] += 0.005  # the left hand comes to the handle above the right, never through it
        best, last = None, None
        for _ in range(24):
            tab = _elbow_table("L", f, tL[i] + up * upL[i] + f["front"] * pushL[i], r_full[i])
            if (tab[2] >= 0).sum() >= CORRIDOR:
                break
            score = float(np.sort(tab[2])[-CORRIDOR])
            if best is not None and score < best + 0.002:
                if last == "up":
                    upL[i] -= 0.01
                else:
                    pushL[i] -= 0.01
                break  # it did not help
            best = score
            # where the hands are what stops it (the right hand against the left forearm), the left hand goes
            # further up the handle; where the body is, forward
            if f["both"] > 0 and (tab[4] >= 0).sum() < CORRIDOR and upL[i] < 0.12:
                upL[i] += 0.01
                last = "up"
            else:
                pushL[i] += 0.01
                last = "fwd"
    upL = _cyc_smooth(_cyc_envelope(upL + extra["up"], 3), 1.5)[:, 0]
    pushL = _cyc_smooth(_cyc_envelope(pushL + extra["L"], 3), 1.5)[:, 0]
    for i, f in enumerate(frames):
        tL[i] = tL[i] + f["r"] * upL[i] + f["front"] * pushL[i]
    tabL = [_elbow_table("L", frames[i], tL[i], r_full[i]) for i in range(N)]
    pathL = _elbow_path(tabL)
    qL = _racket_arm_q("L", frames, _smooth_elbows(tabL, pathL), [tabL[i][1] for i in range(N)], [f["l_holds"] for f in frames])
    out, bad = [], []
    for i, f in enumerate(frames):
        q = dict(f["q"])
        q.update(qR[i])
        q.update(qL[i])
        out.append({"root": [round(float(v), 4) for v in f["root"]], "q": q})
        cR, _ = _arm_clear_final("R", f, q)
        if cR < -0.005:
            bad.append(("R", i, "R"))
        cL, why = _arm_clear_final("L", f, q, r_full[i])
        if cL < -0.005:
            bad.append(("L", i, "up" if why == "apart" and f["both"] > 0 else "L"))
    RACKET_DEBUG["last"] = {"pushR": pushR, "pushL": pushL, "upL": upL, "tabR": tabR, "pathR": pathR, "tabL": tabL, "pathL": pathL, "tL": tL, "tR": tR, "bad": bad}
    return out, bad


RACKET_DEBUG = {}  # the last solve's working, for probes


def _racket_arm_q(S, frames, elbows, wrists, holds):
    """An arm's bone rotations over the loop from its joint positions: the upper arm keeping its rest roll
    (front toward the chest's front), the forearm and hand rolled by the racket when the hand holds it (the
    racket runs out of the palm) and like the upper arm when free, every roll continuous."""
    s = S.lower()
    n = len(frames)
    sh = [f["sh"][S] for f in frames]
    up = [elbows[i] - sh[i] for i in range(n)]
    d = [(wrists[i] - elbows[i]) / max(float(np.linalg.norm(wrists[i] - elbows[i])), 1e-9) for i in range(n)]
    r = [f["r"] for f in frames]
    # the upper arm keeps its rest roll, front toward the chest's front (_arm_q says why), carried through the
    # poses where that is undefined
    want_x, conf = [], []
    for i in range(n):
        x, c = _front_x(up[i], frames[i]["front"])
        want_x.append(x)
        conf.append(c)
    x_up = _continuous_x(up, want_x, conf)
    free_x = [_front_x(d[i], frames[i]["front"]) for i in range(n)]
    # the hand's direction: across the racket when it holds it, along the forearm when free, eased between
    # which way round the racket the hand lies: toward the forearm, but where the forearm runs along the
    # racket that is undefined, so it is followed round continuously (it had flipped to the other side)
    across, conf_a = [], []
    for i in range(n):
        h = d[i] - np.dot(d[i], r[i]) * r[i]
        across.append(h)
        conf_a.append(float(np.linalg.norm(h)))
    around = _continuous_x([-v for v in r], across, conf_a, sigma=1.5)
    hdir = []
    for i in range(n):
        h = around[i]
        ang = math.acos(max(-1.0, min(1.0, float(np.dot(d[i], h)))))
        if ang > WRIST_MAX:
            axis = np.cross(d[i], h)
            axis = axis / max(float(np.linalg.norm(axis)), 1e-9)
            h = q_rot(q_axis(axis, WRIST_MAX), d[i])
        v = holds[i] * h + (1 - holds[i]) * d[i]
        hdir.append(v / float(np.linalg.norm(v)))
    # the forearm and hand: rolled with the racket (-x along it) when holding, else front kept forward
    x_fo = _continuous_x(d, [x for x, _ in free_x], [c for _, c in free_x], want_b=[-v for v in r], blend=holds)
    x_ha = _continuous_x(hdir, [x for x, _ in free_x], [c for _, c in free_x], want_b=[-v for v in r], blend=holds)
    fix_up, fix_fo = rest_fix("shoulder." + s, "elbow." + s), rest_fix("elbow." + s, "wrist." + s)
    out = []
    for i in range(n):
        q_ha = _frame_from(hdir[i], x_ha[i])
        out.append({"upper_arm." + S: qmul(_frame_from(up[i], x_up[i]), fix_up), "forearm." + S: qmul(_frame_from(d[i], x_fo[i]), fix_fo),
                    "hand." + S: q_ha, "fingers." + S: q_ha})
    return out


def racket_report(sample_fn, stages):
    """For a probe: the wrist cock and the racket-to-forearm angle at each stage time."""
    for name, t in stages:
        s = sample_fn(t)
        q = s["q"]
        d = q_rot(q["forearm.R"], DOWN)
        h = q_rot(q["hand.R"], DOWN)
        rk = q_rot(q["hand.R"], np.array([-1.0, 0.0, 0.0]))
        print("  %-8s t=%.2f wrist %3.0f deg, racket-forearm %3.0f deg" % (name, t, math.degrees(math.acos(max(-1, min(1, float(np.dot(d, h)))))), math.degrees(math.acos(max(-1, min(1, float(np.dot(d, rk))))))))


def key(yaw, lean, thigh, shin, r_hand, l_hand, head, r_bend=(-0.6, -1.0, -0.4), l_bend=(0.6, -1.0, -0.4), both=0.0, hip_yaw=0.4):
    """A stroke stage as parameters for _racket_body."""
    return dict(yaw_deg=yaw, lean_deg=lean, thigh_deg=thigh, shin_deg=shin, r_hand=tuple(r_hand), l_hand=tuple(l_hand), head=tuple(head), r_bend=tuple(r_bend), l_bend=tuple(l_bend), both=float(both), hip_yaw=hip_yaw)


def loop_spline(keys, t, monotone=False):
    """A cubic through (t, value) keys from t=0 to t=1 that loops: the velocity carries on through every key
    and round the loop (Bessel tangents from each key's neighbours, or with `monotone` the Fritsch-Butland
    ones, for a value that only ever grows). Unlike `splined` it does not stop at a key where a value turns
    back: a stroke's hand turns back at contact in one coordinate or another, and stopping there slowed the
    swing at the very moment it should be fastest (owner, 2026-10-07: the swings were not uniform)."""
    ts = [k[0] for k in keys]
    vs = [k[1] for k in keys]
    n = len(keys)
    h = [ts[i + 1] - ts[i] for i in range(n - 1)]
    d = [(vs[i + 1] - vs[i]) / h[i] if h[i] > 0 else 0.0 for i in range(n - 1)]
    m = [0.0] * n

    def tangent(d0, d1, h0, h1):
        if not monotone:
            return (h1 * d0 + h0 * d1) / (h0 + h1)
        if d0 * d1 <= 0:
            return 0.0
        w1, w2 = 2 * h1 + h0, h1 + 2 * h0
        return (w1 + w2) / (w1 / d0 + w2 / d1)

    for i in range(1, n - 1):
        m[i] = tangent(d[i - 1], d[i], h[i - 1], h[i])
    m[0] = m[n - 1] = tangent(d[n - 2], d[0], h[n - 2], h[0])  # round the loop: the last segment meets the first
    t = min(max(t, ts[0]), ts[-1])
    for i in range(n - 1):
        if t <= ts[i + 1] or i == n - 2:
            u = (t - ts[i]) / h[i]
            h00, h10, h01, h11 = 2 * u**3 - 3 * u**2 + 1, u**3 - 2 * u**2 + u, -2 * u**3 + 3 * u**2, u**3 - u**2
            return h00 * vs[i] + h10 * m[i] * h[i] + h01 * vs[i + 1] + h11 * m[i + 1] * h[i]
    return vs[-1]


def _racket_params(keys, t):
    """The stage parameters at t, on loop splines through the stages (a stroke starts and ends at the same
    stage). The racket follows as a direction (from the stage's hand to its head), not as a head position: a
    head splined on its own passed close by the hand and the racket spun round it in a few frames (owner,
    2026-10-07)."""
    params = {}
    for n, v0 in keys[0][1].items():
        if isinstance(v0, tuple):
            params[n] = tuple(loop_spline([(tk, d[n][i]) for tk, d in keys], t) for i in range(len(v0)))
        else:
            params[n] = loop_spline([(tk, d[n]) for tk, d in keys], t)
    params["both"] = min(1.0, max(0.0, params["both"]))
    # The direction turns along great-circle arcs from stage to stage, the angle turned so far splined in time,
    # so the racket turns at a steady rate through each arc and without a stop at the stages it passes;
    # splining the direction's components instead shrank it to nothing between stages 130-160 degrees apart.
    dirs = []
    for tk, d in keys:
        v = np.asarray(d["head"], dtype=float) - np.asarray(d["r_hand"], dtype=float)
        dirs.append(v / float(np.linalg.norm(v)))
    arcs = [math.acos(max(-1.0, min(1.0, float(np.dot(dirs[i], dirs[i + 1]))))) for i in range(len(dirs) - 1)]
    cum = [0.0]
    for a in arcs:
        cum.append(cum[-1] + a)
    turned = loop_spline([(keys[i][0], cum[i]) for i in range(len(keys))], t, monotone=True)
    turned = min(max(turned, 0.0), cum[-1])
    j = 0
    while j < len(arcs) - 1 and turned > cum[j + 1]:
        j += 1
    u = 0.0 if arcs[j] < 1e-9 else min(1.0, max(0.0, (turned - cum[j]) / arcs[j]))
    a, b = dirs[j], dirs[j + 1]
    if arcs[j] < 1e-6:
        v = a
    else:
        v = (math.sin((1 - u) * arcs[j]) * a + math.sin(u * arcs[j]) * b) / math.sin(arcs[j])
    params["rdir"] = tuple(float(x) for x in v)
    return params


_racket_cache = {}


def racket_flow(keys, t, body=None, params=None):
    """The stroke at t, from the stroke solved as a whole (_racket_solve, once per stroke): the parameters follow
    splines through the stages, the pose is rebuilt at each frame so the arms clear the body between the stages
    as well as at them, and every correction is made over the loop so that nothing jumps between frames."""
    k = repr(keys)
    if k not in _racket_cache:
        _racket_cache[k] = _racket_solve(keys, body, params)
    frames = _racket_cache[k]
    x = (t % 1.0) * N
    i = int(math.floor(x + 1e-9)) % N
    f = x - math.floor(x + 1e-9)
    if f < 1e-6:
        return frames[i]
    a, b = frames[i], frames[(i + 1) % N]
    return {"root": [round(float(u + (v - u) * f), 4) for u, v in zip(a["root"], b["root"])], "q": {n: q_slerp(a["q"][n], b["q"][n], f) for n in a["q"]}}


def ready_key(thigh=-18, shin=18, head=(0.14, 0.26, 0.36)):
    """The ready position: knees soft, the racket held up in front with both hands."""
    return key(0, 6, thigh, shin, (0.10, -0.16, 0.30), (0.0, -0.18, 0.32), head, r_bend=(-0.7, -1.0, -0.2), l_bend=(0.7, -1.0, -0.2), both=1)


TWO = dict(r_bend=(0.6, -1.0, -0.4), l_bend=(0.8, -1.0, -0.2), both=1)


def tennis_forehand_sample(t):
    """A topspin forehand, traced from the owner's motion-capture playback (001_Basic_forehand.mp4, 2026-09-22):
    the racket held up in front at the ready with both hands; the elbow bends and the racket head drops low
    behind the right hip as the shoulders turn, the free arm reaching out toward the net; the arm straightens
    and swings low to high to a contact out in front at hip height, the racket pointing out to the right; the
    follow-through wraps across in front of the chest to finish beside the left shoulder, racket up."""
    return racket_flow([
        (0, ready_key()),
        (0.28, key(-60, 8, -20, 20, (-0.30, -0.24, -0.18), (0.50, -0.14, 0.26), (-0.40, -0.60, -0.42), r_bend=(-1.0, -0.4, 0.1))),
        (0.42, key(-30, 10, -22, 22, (-0.30, -0.44, 0.0), (0.36, -0.20, 0.30), (-0.52, -0.60, -0.36))),
        (0.52, key(5, 8, -18, 18, (-0.30, -0.32, 0.46), (0.06, -0.22, 0.22), (-0.73, -0.30, 0.54))),
        (0.64, key(40, 6, -15, 15, (0.30, -0.06, 0.32), (0.05, -0.20, 0.22), (0.42, 0.30, 0.60), r_bend=(0.2, -1.0, 0.2))),
        (0.78, key(30, 6, -15, 15, (0.28, 0.02, 0.24), (0.05, -0.20, 0.22), (0.20, 0.44, 0.36), r_bend=(0.2, -1.0, 0.2))),
        (1, ready_key()),
    ], t)


def tennis_backhand_sample(t):
    """A two-handed backhand: the unit turn to the left with both hands on the racket, the hands taken back in
    front of the left hip and the racket head low behind; the swing low to high with the weight moving to the
    front foot, to a contact just in front of the lead knee with the racket pointing out to the left; the finish
    over the right shoulder, the racket head pointing back."""
    return racket_flow([
        (0, ready_key()),
        (0.3, key(70, 8, -22, 22, (0.19, -0.23, 0.37), (0.12, -0.30, 0.42), (0.30, -0.66, -0.12), **TWO)),
        (0.45, key(40, 10, -26, 26, (0.14, -0.27, 0.36), (0.10, -0.42, 0.42), (0.46, -0.70, 0.06), **TWO)),
        (0.55, key(-5, 8, -20, 20, (0.18, -0.30, 0.32), (0.04, -0.32, 0.38), (0.58, -0.30, 0.56), r_bend=(0.2, -1.0, -0.3), l_bend=(0.6, -1.0, -0.3), both=1)),
        (0.75, key(-45, 6, -15, 15, (0.02, 0.12, 0.34), (-0.24, 0.06, 0.44), (-0.16, 0.40, 0.10), r_bend=(-0.6, -1.0, -0.3), l_bend=(-0.3, -1.0, 0.1), both=1)),
        (1, ready_key()),
    ], t)


def tennis_serve_sample(t):
    """A flat serve: sideways to the net, the toss arm rises straight as the racket arm comes up to the trophy
    position with the knees bent; the racket drops behind the back as the legs drive up; contact with the arm
    fully extended above the head; the racket follows through across the body to the opposite hip."""
    return racket_flow([
        (0, key(-60, 4, -8, 8, (-0.10, -0.42, 0.28), (0.02, -0.42, 0.32), (0.02, -0.62, 0.66))),
        (0.25, key(-60, -8, -30, 30, (-0.24, 0.30, -0.28), (0.06, 0.52, 0.12), (-0.20, 0.72, -0.42), r_bend=(-1.0, 0.2, -0.6), l_bend=(0.6, -0.2, -1.0))),
        (0.4, key(-45, -6, -14, 14, (-0.12, 0.10, -0.36), (0.08, 0.30, 0.10), (0.0, -0.30, -0.42), r_bend=(-1.0, 0.8, -0.3), l_bend=(0.6, -0.5, -1.0))),
        (0.5, key(-10, 6, -2, 2, (-0.06, 0.50, 0.16), (0.06, -0.20, 0.14), (0.0, 0.94, 0.26), r_bend=(-1.0, 0.2, -0.5))),
        (0.7, key(15, 26, -10, 10, (0.20, -0.33, 0.32), (0.08, -0.30, 0.14), (0.52, -0.62, 0.52), r_bend=(0.3, -0.6, -1.0))),
        (0.85, key(-25, 12, -10, 10, (-0.16, -0.42, 0.18), (0.06, -0.36, 0.24), (-0.10, -0.66, 0.50))),  # the recovery comes down the right side
        (1, key(-60, 4, -8, 8, (-0.10, -0.42, 0.28), (0.02, -0.42, 0.32), (0.02, -0.62, 0.66))),
    ], t)


def pickleball_forehand_sample(t):
    """A pickleball forehand drive: a short backswing with the paddle pointed at the side wall, a low knee bend,
    a compact low-to-high swing to a contact out in front at waist height, the follow-through to the opposite
    shoulder, in front of the chest."""
    ready = ready_key(-28, 28, head=(0.14, 0.20, 0.36))
    return racket_flow([
        (0, ready),
        (0.3, key(-50, 10, -34, 34, (-0.32, -0.30, -0.12), (0.34, -0.16, 0.18), (-0.55, -0.50, -0.30))),
        (0.5, key(0, 8, -30, 30, (-0.26, -0.36, 0.42), (0.06, -0.28, 0.20), (-0.58, -0.36, 0.50))),
        (0.7, key(35, 6, -24, 24, (0.22, 0.04, 0.30), (0.05, -0.24, 0.20), (0.32, 0.30, 0.48), r_bend=(0.2, -1.0, -0.6))),
        (1, ready),
    ], t)


def pickleball_backhand_sample(t):
    """A two-handed pickleball backhand: shoulders and hips turn to the left as a unit with both hands on the
    paddle, a short backswing to in front of the left hip, the free hand doing most of the work through a
    contact in front, the paddle finishing toward the right shoulder."""
    ready = ready_key(-28, 28, head=(0.14, 0.20, 0.36))
    return racket_flow([
        (0, ready),
        (0.3, key(45, 10, -34, 34, (0.17, -0.24, 0.37), (0.10, -0.32, 0.42), (0.32, -0.56, 0.02), **TWO)),
        (0.5, key(-5, 8, -30, 30, (0.17, -0.31, 0.31), (0.02, -0.32, 0.36), (0.46, -0.32, 0.48), r_bend=(0.2, -1.0, -0.3), l_bend=(0.6, -1.0, -0.3), both=1)),
        (0.7, key(-35, 6, -24, 24, (0.06, 0.04, 0.38), (-0.14, 0.02, 0.42), (-0.06, 0.32, 0.10), r_bend=(-0.6, -1.0, -0.3), l_bend=(-0.2, -1.0, 0.4), both=1)),
        (1, ready),
    ], t)


def pickleball_serve_sample(t):
    """A pickleball serve: sideways to the net, the ball held out in front by the free hand; the paddle swings
    back low and forward in an underhand arc to a contact below the waist in front of the body, finishing with
    the hand in line with the opposite shoulder."""
    stance = key(-45, 6, -12, 12, (-0.10, -0.46, 0.10), (0.06, -0.34, 0.36), (-0.14, -0.76, 0.22))
    return racket_flow([
        (0, stance),
        (0.3, key(-55, 8, -16, 16, (-0.20, -0.46, -0.30), (0.06, -0.34, 0.36), (-0.26, -0.70, -0.56), r_bend=(-0.8, -0.6, 0.4))),
        (0.5, key(-10, 8, -12, 12, (-0.14, -0.50, 0.34), (0.10, -0.30, 0.14), (-0.28, -0.60, 0.62), r_bend=(-0.8, -0.6, -0.3))),
        (0.72, key(15, 6, -8, 8, (0.20, -0.06, 0.40), (0.08, -0.30, 0.14), (0.36, 0.20, 0.56), r_bend=(-0.6, -0.6, -0.6))),
        (1, stance),
    ], t)


# ---------- wall angel (owner, 2026-10-02) ----------
# Back, hips and head against a wall behind the figure, the feet a hand-span out with soft knees; the arms slide
# from a V overhead down to a W (elbows a little below the shoulders, forearms upright), hold, and back up. The
# backs of the arms stay on the wall, so the upper arm runs back from the shoulder to the wall plane and the
# forearm lies in it. Contact was checked by reading the skinned vertices' depth in the scene (2026-10-02).
WALL_BACK = 0.122  # the body's back surface behind the hip joints, in this pose (measured in the scene)
ARM_HALF = 0.072  # the upper arm's depth behind its bone axis (deltoid and triceps), measured in the scene
FORE_HALF = 0.040  # the forearm's
FEET_OUT = 0.12  # the ankles this far forward of where they stand at rest


def wall_angel_geometry():
    hip_mid = (rig["hip.l"] + rig["hip.r"]) / 2
    wall_z = float(hip_mid[2]) - WALL_BACK
    return hip_mid, wall_z


def wall_angel_stage(theta_deg, phi_deg):
    """theta: the upper arm's abduction from hanging (90 is level), phi: the forearm's (180 is straight up)."""
    q = all_ident()
    hip_mid, wall_z = wall_angel_geometry()
    hip = hip_mid + np.array([0.0, -0.03, 0.0])  # the soft knees lower the hips a little down the wall
    root, pelvis_pos = root_for_hip(hip, IDENT)
    q["neck"], q["head"] = rx(-6 * DEG), rx(2 * DEG)  # a chin tuck, the back of the head toward the wall
    for S, side in (("L", "l"), ("R", "r")):
        hip_side = hip_from(pelvis_pos, IDENT, side)
        ankle = rig["ankle." + side] + np.array([0.0, 0.0, FEET_OUT])
        th, sh, _ = two_link(hip_side, ankle, L_THIGH, L_SHIN, bend_forward=True)
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(th), rx(sh), IDENT
    z_arm = wall_z + ARM_HALF
    for S, side, sgn in (("L", "l", 1.0), ("R", "r", -1.0)):
        shoulder = shoulder_from(pelvis_pos, IDENT, side)
        back = min(max((float(shoulder[2]) - z_arm) / L_UPPER, 0.0), 0.8)
        c = math.sqrt(1.0 - back * back)
        th = theta_deg * DEG
        u = np.array([sgn * math.sin(th) * c, -math.cos(th) * c, -back])  # out to the side and back to the wall
        ph = phi_deg * DEG
        back_f = min(max((z_arm - (wall_z + FORE_HALF)) / L_FORE, 0.0), 0.6)  # the thinner forearm leans back onto the wall
        cf = math.sqrt(1.0 - back_f * back_f)
        f = np.array([sgn * math.sin(ph) * cf, -math.cos(ph) * cf, -back_f])
        # The humerus is turned out so its front faces up and in (perpendicular to it in the frontal plane); the
        # forearm and hand turn the palm forward, the back of the hand to the wall.
        front_u = np.array([sgn * math.cos(th), math.sin(th), 0.0])
        q["upper_arm." + S] = aim(u, front_u)
        q["forearm." + S] = q["hand." + S] = q["fingers." + S] = aim(f, np.array([0.0, 0.0, 1.0]))
    return {"root": [round(float(v), 4) for v in root], "q": q}


def wall_angel_sample(t):
    """From the V overhead, slide down to the W (t 0.4), hold, and slide back up to the V."""
    theta = keyed([(0, 150), (0.4, 80), (0.6, 80), (1, 150)], t)
    phi = keyed([(0, 162), (0.4, 170), (0.6, 170), (1, 162)], t)
    return wall_angel_stage(theta, phi)


def wall_angel_report():
    hip_mid, wall_z = wall_angel_geometry()
    print("wall z %.3f (hip line z %.3f)" % (wall_z, float(hip_mid[2])))
    for name, t in (("V", 0.0), ("mid", 0.2), ("W", 0.5)):
        s = wall_angel_sample(t)
        r = np.array(s["root"], float)
        pelvis = rig["pelvis"] + r
        for S, side in (("L", "l"), ("R", "r")):
            sh = pelvis + q_rot(s["q"]["spine"], rig["shoulder." + side] - rig["pelvis"])
            el = sh + q_rot(s["q"]["upper_arm." + S], DOWN * L_UPPER)
            ha = el + q_rot(s["q"]["forearm." + S], DOWN * L_FORE)
            palm = q_rot(s["q"]["hand." + S], np.array([0.0, 0.0, 1.0]))
            print("  %-3s %s shoulder z %.3f elbow %s hand %s palm %s" % (name, S, sh[2], np.round(el, 3), np.round(ha, 3), np.round(palm, 2)))


# ---------- Copenhagen plank (owner, 2026-10-04) ----------
# A side plank on the left forearm with the right (top) ankle on a bench: from lying on the side with the hips
# on the floor, the hips lift until the body is one straight line and the bottom leg rises to touch the
# underside of the bench; held; lowered. Lying on the left side with the head toward +x, as the side plank.
# Everything is solved from the geometry: the trunk tilt that keeps the lower shoulder propped over the elbow,
# the hip x that puts the straight top leg's ankle on the bench, and the hip height where trunk and top leg
# make one line.
COPEN_X = -0.45  # the bench's x: the top ankle rests on it
COPEN_SHOULDER_Y = 0.04 + L_UPPER  # the lower shoulder over the elbow on the floor
COPEN_LEG = L_THIGH + L_SHIN
_copen_cache = {}


def copen_roll(a):
    return q_axis([0, 0, 1], -(90 * DEG - a))  # lying on the left side, rising by a toward the head


def copen_body(hip_y):
    key = round(hip_y, 5)
    if key in _copen_cache:
        return _copen_cache[key]
    mid = (rig["hip.l"] + rig["hip.r"]) / 2

    def sh_y(a):
        q = copen_roll(a)
        _, pp = root_for_hip(np.array([0.0, hip_y, 0.0]), q)
        return float(shoulder_from(pp, q, "l")[1])

    lo, hi = -40 * DEG, 70 * DEG  # the shoulder rises with the tilt: bisect
    for _ in range(50):
        m_ = (lo + hi) / 2
        if sh_y(m_) < COPEN_SHOULDER_Y:
            lo = m_
        else:
            hi = m_
    a = (lo + hi) / 2
    q = copen_roll(a)
    off_r = q_rot(q, rig["hip.r"] - mid)
    B = np.array([COPEN_X, BENCH_TOP + 0.05, 0.0])  # the top ankle on the bench
    dy = B[1] - (hip_y + off_r[1])
    hip_x = B[0] + math.sqrt(max(COPEN_LEG ** 2 - dy * dy, 0.0)) - off_r[0]
    res = (a, q, np.array([hip_x, hip_y, 0.0]), B, off_r)
    _copen_cache[key] = res
    return res


def copen_heights():
    """The hip height lying on the side (the lower hip 0.10 above the floor) and in the plank (one line)."""
    if "heights" in _copen_cache:
        return _copen_cache["heights"]
    mid = (rig["hip.l"] + rig["hip.r"]) / 2
    y0 = 0.2
    for _ in range(4):
        a, q, hip, B, off_r = copen_body(y0)
        y0 = 0.10 - float(q_rot(q, rig["hip.l"] - mid)[1])
    best = None
    for i in range(0, 161):
        y = 0.15 + i * 0.004
        a, q, hip, B, off_r = copen_body(y)
        rh = hip + off_r
        leg_a = math.atan2(rh[1] - B[1], rh[0] - B[0])
        err = abs(leg_a - a)
        if best is None or err < best[0]:
            best = (err, y)
    _copen_cache["heights"] = (y0, best[1])
    return y0, best[1]


def copenhagen_sample(t):
    y0, y1 = copen_heights()
    f = envelope(t)
    a, q_tr, hip, B, _ = copen_body(y0 + (y1 - y0) * f)
    root, pelvis_pos = root_for_hip(hip, q_tr)
    q = all_ident()
    for b in ("pelvis", "spine", "neck", "head"):
        q[b] = q_tr
    front = np.array([0.0, 0.0, 1.0])
    rh = hip_from(pelvis_pos, q_tr, "r")
    lh = hip_from(pelvis_pos, q_tr, "l")
    floor_pt = np.array([COPEN_X - 0.04, 0.08, 0.0])  # the bottom leg resting on the floor under the bench
    under = np.array([COPEN_X, BENCH_TOP - 0.06 - 0.05, 0.0])  # touching the underside of the bench top
    target = floor_pt + (under - floor_pt) * f
    qr, ql = aim(B - rh, front), aim(target - lh, front)
    q["thigh.R"] = q["shin.R"] = q["foot.R"] = qr
    q["thigh.L"] = q["shin.L"] = q["foot.L"] = ql
    q["upper_arm.L"] = IDENT  # straight down from the shoulder to the elbow on the floor
    q["forearm.L"] = q["hand.L"] = q["fingers.L"] = qmul(rx(-90 * DEG), PRONATE)  # along the floor in front, palm down
    body = np.array([math.cos(a), math.sin(a), 0.0])
    q["upper_arm.R"] = q["forearm.R"] = q["hand.R"] = q["fingers.R"] = aim(-body + np.array([0.0, 0.0, 0.18]), np.array([0.0, -1.0, 0.0]))  # the top hand on the hip
    return {"root": [round(float(v), 4) for v in root], "q": q}


def copenhagen_report():
    y0, y1 = copen_heights()
    print("hips: lying %.3f, plank %.3f; bench x %.2f top %.2f" % (y0, y1, COPEN_X, BENCH_TOP))
    for name, t in (("lying", 0.0), ("plank", 0.55)):
        s = copenhagen_sample(t)
        r = np.array(s["root"], float)
        pelvis = rig["pelvis"] + r
        out = []
        for S, side in (("L", "l"), ("R", "r")):
            hp = pelvis + q_rot(s["q"]["pelvis"], rig["hip." + side] - rig["pelvis"])
            an = hp + q_rot(s["q"]["thigh." + S], DOWN * (L_THIGH + L_SHIN))
            out.append("%s ankle %s" % (S, np.round(an, 3)))
        sh = pelvis + q_rot(s["q"]["spine"], rig["shoulder.l"] - rig["pelvis"])
        el = sh + q_rot(s["q"]["upper_arm.L"], DOWN * L_UPPER)
        print("  %-5s %s | L shoulder %s elbow %s" % (name, " | ".join(out), np.round(sh, 3), np.round(el, 3)))


# ---------- cat-cow (owner, 2026-10-04) ----------
# On hands and knees, the hands planted under the shoulders and the knees under the hips. Cow: the pelvis tips
# forward so the tail rises and the belly drops, the chest lifts, the gaze goes up. Cat: the pelvis tucks, the
# back rounds up between the shoulder blades, the chin comes to the chest. The spine bends at L5 between the
# pelvis and the chest bones, and the hands stay where they were planted.
CAT_HIP = np.array([0.0, 0.47, 0.0])
CAT_NEUTRAL = (84, 82)  # pelvis and chest angles of the neutral table: the arms near straight under the shoulders


def cat_cow_shoulder(pelvis_q, spine_q, side):
    _, pelvis_pos = root_for_hip(CAT_HIP, pelvis_q)
    l5 = pelvis_pos + q_rot(pelvis_q, rig["l5"] - rig["pelvis"])
    return l5 + q_rot(spine_q, rig["shoulder." + side] - rig["l5"])


def cat_cow_stage(pelvis_deg, spine_deg, neck_deg, head_deg):
    q = all_ident()
    qp, qs = rx(pelvis_deg * DEG), rx(spine_deg * DEG)
    root, _ = root_for_hip(CAT_HIP, qp)
    q["pelvis"], q["spine"] = qp, qs
    q["neck"], q["head"] = rx(neck_deg * DEG), rx(head_deg * DEG)
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = IDENT, rx(90 * DEG), rx(120 * DEG)  # knees under the hips
    for S, side in (("L", "l"), ("R", "r")):
        neutral = cat_cow_shoulder(rx(CAT_NEUTRAL[0] * DEG), rx(CAT_NEUTRAL[1] * DEG), side)
        hand = np.array([neutral[0], 0.03, neutral[2]])  # planted under the shoulders of the neutral table
        sh = cat_cow_shoulder(qp, qs, side)
        up_a, fo_a, _ = two_link(sh, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)
    return {"root": [round(float(v), 4) for v in root], "q": q}


CAT_COW = {
    # The shoulders stay near their neutral height (the arms straight, as taught): cow sways the pelvis and lifts
    # the chest a little; cat tucks the pelvis so L5 rises and the back rounds over it.
    "pelvis": [(0, 84), (0.25, 104), (0.5, 84), (0.75, 66), (1, 84)],
    "spine": [(0, 82), (0.25, 76), (0.5, 82), (0.75, 87), (1, 82)],
    "neck": [(0, 80), (0.25, 45), (0.5, 80), (0.75, 120), (1, 80)],
    "head": [(0, 88), (0.25, 40), (0.5, 88), (0.75, 135), (1, 88)],
}


def cat_cow_sample(t):
    """Neutral, into cow (t 0.25), back through neutral, into cat (0.75), and back."""
    k = lambda n: splined(CAT_COW[n], t)
    return cat_cow_stage(k("pelvis"), k("spine"), k("neck"), k("head"))


def cat_cow_report():
    for name, t in (("neutral", 0.0), ("cow", 0.25), ("cat", 0.75)):
        k = lambda n: splined(CAT_COW[n], t)
        qp, qs = rx(k("pelvis") * DEG), rx(k("spine") * DEG)
        sh = cat_cow_shoulder(qp, qs, "l")
        neutral = cat_cow_shoulder(rx(CAT_NEUTRAL[0] * DEG), rx(CAT_NEUTRAL[1] * DEG), "l")
        reach = float(np.linalg.norm(sh - np.array([neutral[0], 0.03, neutral[2]])))
        _, pelvis_pos = root_for_hip(CAT_HIP, qp)
        l5 = pelvis_pos + q_rot(qp, rig["l5"] - rig["pelvis"])
        print("  %-7s L5 y %.3f shoulder %s reach %.3f of %.3f" % (name, l5[1], np.round(sh, 3), reach, L_UPPER + L_FORE))


# ---------- dips on parallel bars ----------
# Support on locked arms with the legs hanging (knees bent back), lower
# until the upper arms are level with the elbows behind and the trunk leant
# forward, press back to the support, hold. The hands stay on the bars: the
# body is placed from the bent arm each frame.
DIP_BAR = 1.30
DIPS = {
    "arm": [(0, 0), (0.05, 0), (0.42, 92), (0.5, 92), (0.88, 0), (1, 0)],  # upper arm from vertical, elbow back
    "trunk": [(0, 5), (0.05, 5), (0.42, 26), (0.5, 26), (0.88, 5), (1, 5)],  # leant forward at the bottom
}


def dips_sample(t):
    a = splined(DIPS["arm"], t) * DEG
    trunk = splined(DIPS["trunk"], t) * DEG
    upper_dy = float(rig["shoulder.l"][1] - rig["elbow.l"][1])
    fore_dy = float(rig["elbow.l"][1] - rig["wrist.l"][1])
    hand = np.array([0.0, DIP_BAR + 0.015, 0.0])  # the palms on top of the bars (x is the rest wrist's)
    shoulder_target = hand + np.array([0.0, fore_dy + upper_dy * math.cos(a), upper_dy * math.sin(a)])
    shoulder_mid = np.array([0.0, float(rig["shoulder.l"][1]), float(rig["shoulder.l"][2])])
    pelvis_pos = shoulder_target - q_rot(rx(trunk), shoulder_mid - rig["pelvis"])
    root = pelvis_pos - rig["pelvis"]
    palm_down = lambda r: qmul(r, PRONATE)
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": IDENT, "head": IDENT}
    thigh = 8 * DEG
    for S in ("L", "R"):
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(thigh), rx(thigh + 85 * DEG), rx(thigh + 115 * DEG)
        q["upper_arm." + S], q["forearm." + S] = rx(a), IDENT  # the elbow goes back; the forearm stays vertical over the bar
        q["hand." + S] = palm_down(rx(-90 * DEG))  # flat on the bar, fingers forward
        q["fingers." + S] = palm_down(rx(-60 * DEG))
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
# Each hold is entered from a resting position over the first ENTER of the
# cycle, held to RELEASE, then released back to rest, so the loop is
# continuous (the owner asked for the way in, as the plank has, 2026-09-11).
ENTER, RELEASE = 0.4, 0.75


def q_slerp(a, b, f):
    dot = sum(x * y for x, y in zip(a, b))
    if dot < 0:
        b, dot = [-v for v in b], -dot
    if dot > 0.9995:
        q = [x + (y - x) * f for x, y in zip(a, b)]
        n = math.sqrt(sum(v * v for v in q))
        return [v / n for v in q]
    th = math.acos(min(1.0, dot))
    s = math.sin(th)
    wa, wb = math.sin((1 - f) * th) / s, math.sin(f * th) / s
    return [x * wa + y * wb for x, y in zip(a, b)]


def blend_samples(a, b, f):
    q = {k: q_slerp(a["q"][k], b["q"].get(k, a["q"][k]), f) for k in a["q"]}
    root = [round(a["root"][i] + (b["root"][i] - a["root"][i]) * f, 4) for i in range(3)]
    return {"root": root, "q": q}


def envelope(t):
    """0 at rest, 1 in the hold: eases in over ENTER, holds to RELEASE, eases out."""
    if t < ENTER:
        return smooth(t / ENTER)
    if t < RELEASE:
        return 1.0
    return 1 - smooth((t - RELEASE) / (1 - RELEASE))


def entered(start, hold, t):
    return blend_samples(start, hold, envelope(t))


def supine_sample(knees_bent=False, hands_by_ears=False):
    """Lying on the back, head to -Z, feet to +Z. Optionally the knees up with the feet flat, and the hands on the
    floor beside the ears (the way into a wheel)."""
    q = all_ident()
    trunk = -90 * DEG
    root, _ = root_for_hip(np.array([0.0, 0.12, 0.0]), rx(trunk))
    q["pelvis"], q["spine"], q["neck"], q["head"] = rx(trunk), rx(trunk), rx(trunk), rx(trunk)
    if knees_bent:
        set_legs(q, -127 * DEG, -10 * DEG, 0.0)  # thighs up and forward, shins near vertical, feet flat
    else:
        set_legs(q, -90 * DEG, -90 * DEG, -90 * DEG + 20 * DEG)  # legs along the floor
    if hands_by_ears:
        for S in ("L", "R"):
            q["upper_arm." + S] = rx(143 * DEG)  # elbows up and back toward the head
            q["forearm." + S] = qmul(rx(45 * DEG), PRONATE)  # down to the floor beside the ears
            q["hand." + S] = q["fingers." + S] = qmul(rx(-90 * DEG), PRONATE)  # palms flat, fingers toward the feet
    else:
        set_arms(q, -90 * DEG, -90 * DEG, palm_down=False)  # arms along the sides on the floor
    return {"root": [round(float(v), 4) for v in root], "q": q}


def boat_hold():
    """Navasana: seated, trunk leant back 30, legs straight up at 30 above horizontal, arms forward."""
    q = all_ident()
    trunk = -30 * DEG
    root, _ = root_for_hip(np.array([0.0, 0.13, 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk + 20 * DEG), rx(trunk + 20 * DEG)
    set_legs(q, -120 * DEG, -120 * DEG, -120 * DEG + 30 * DEG)
    set_arms(q, -90 * DEG, -90 * DEG, palm_down=False)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def boat_sample(t):
    return entered(supine_sample(), boat_hold(), t)


def warrior3_sample(t):
    return entered(stand_sample(0), warrior3_hold(), t)


def warrior3_hold():
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
    return entered(supine_sample(knees_bent=True, hands_by_ears=True), wheel_hold(), t)


def wheel_hold():
    """Urdhva Dhanurasana: belly up on hands and feet, the trunk arched back until the head hangs toward the floor."""
    q = all_ident()
    trunk = -125 * DEG
    knee_f, shin_a = -52 * DEG, 0.0  # thighs sloping forward-down from the lifted hips, shins vertical
    hip_y = 0.09 + L_SHIN + L_THIGH * math.cos(knee_f)
    root, pelvis_pos = root_for_hip(np.array([0.0, hip_y, 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk), rx(trunk + 10 * DEG)  # the head hangs in line with the arch, relaxed, face toward the floor
    set_legs(q, knee_f, shin_a, 0.0)
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([shoulder[0], 0.03, shoulder[2] - 0.12])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a - 90 * DEG), PRONATE)  # palms flat on the floor, fingers toward the feet
    return {"root": [round(float(v), 4) for v in root], "q": q}


def crow_sample(t):
    return entered(crouch_sample(), crow_hold(), t)


def crouch_sample():
    """The way into a crow: a deep squat, knees out, hands planted on the floor just ahead of the feet."""
    q = all_ident()
    trunk = 70 * DEG
    root, pelvis_pos = root_for_hip(np.array([0.0, 0.30, 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    q["neck"], q["head"] = rx(trunk - 60 * DEG), rx(trunk - 60 * DEG)
    for S, sgn in (("L", 1), ("R", -1)):
        spread = q_axis([0, 0, 1], sgn * 24 * DEG)
        q["thigh." + S] = qmul(rx(-85 * DEG), spread)
        q["shin." + S] = qmul(rx(62 * DEG), spread)
        q["foot." + S] = spread
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([shoulder[0], 0.03, shoulder[2] + 0.05])
        up_a, fo_a, _ = two_link(shoulder, hand, L_UPPER, L_FORE, bend_forward=False)
        q["upper_arm." + S], q["forearm." + S] = rx(up_a), qmul(rx(fo_a), PRONATE)
        q["hand." + S] = q["fingers." + S] = qmul(rx(fo_a - 90 * DEG), PRONATE)
    return {"root": [round(float(v), 4) for v in root], "q": q}


def crow_hold():
    """Bakasana: hands on the floor, elbows bent, knees on the backs of the upper arms, feet lifted behind.
    The legs spread so the knees sit outside the arms, not through them (owner, 2026-09-11)."""
    q = all_ident()
    trunk = 95 * DEG  # chest just past the hands, near level; the elbows bend about 90 degrees under it
    root, pelvis_pos = root_for_hip(np.array([0.0, 0.55, 0.0]), rx(trunk))
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    # The neck extends 70 degrees in all, what a neck can do, split between the neck bone and the head: the gaze
    # ends 25 degrees below horizontal, at the floor a little ahead, as in a real crow. Asking for 90 degrees
    # (2026-09-11) pivoted the whole cervical column out of the trapezius on our one neck bone.
    q["neck"], q["head"] = rx(trunk - 40 * DEG), rx(trunk - 70 * DEG)
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
    """Vasisthasana on a straight arm, entered the way it is taught (YouTube, 2026-09-11): sitting on the left
    hip with the legs out along the floor, the lower hand already planted and that arm straight, angled out
    toward the feet; then the hips press up into one line from the feet to the head while the top arm rises
    from the hip to straight up. The trunk is propped the whole time, so the shoulder hardly moves."""
    f = envelope(t)
    leg_tilt = 22 * DEG * f  # the legs from lying flat to the line
    trunk_tilt = (55 + (22 - 55) * f) * DEG  # the propped trunk settles into the line as the hips rise
    roll_legs = q_axis([0, 0, 1], -(90 * DEG - leg_tilt))  # lying on the left side, head to +X
    roll_trunk = q_axis([0, 0, 1], -(90 * DEG - trunk_tilt))
    q = {"pelvis": roll_trunk, "spine": roll_trunk, "neck": roll_trunk, "head": roll_trunk}
    for S in ("L", "R"):
        q["thigh." + S] = q["shin." + S] = q["foot." + S] = roll_legs
    for b in ("upper_arm", "forearm", "hand", "fingers"):
        q[b + ".L"] = q_axis([0, 0, 1], -30 * DEG * (1 - f))  # planted: angled toward the feet at first, vertical in the line
        q[b + ".R"] = q_axis([0, 0, 1], -(90 + 90 * f) * DEG)  # from resting along the top thigh to straight up
    body_dir = q_rot(roll_legs, UP)
    ankle_low = np.array([0.0, 0.06 + 0.06 * (1 - f), 0.0])  # sitting, the hips rest on the floor at the body's half-width
    hip_mid = ankle_low + body_dir * (L_SHIN + L_THIGH)
    root, _ = root_for_hip(hip_mid, roll_trunk)
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- muscle-up ----------
# A strict bar muscle-up from a dead hang: pull to the chest, the wrists turn
# over the bar as the chest leans over it, press to straight arms above the
# bar, hold, and back down the same way. Keys in t: upper arm forward of down
# (degrees), elbow bend, trunk lean, thigh, knee, and how far the wrists have
# turned over onto the top of the bar.
MUSCLE_UP = {
    # Strict form (YouTube, 2026-09-11): pull high with the chest up, then lean the chest over the bar as the legs
    # swing back under it and the elbows come up behind, press out, and reverse. The wrists stay on the bar; the
    # lean is what carries the shoulders across it.
    "armFwd": [(0, 175), (0.2, 55), (0.3, 20), (0.38, -25), (0.48, -8), (0.6, -8), (0.7, -35), (0.8, 20), (0.9, 100), (1, 175)],
    "elbow": [(0, 5), (0.2, 130), (0.3, 120), (0.38, 100), (0.48, 3), (0.6, 3), (0.7, 95), (0.8, 125), (0.9, 70), (1, 5)],
    "trunk": [(0, 2), (0.2, -5), (0.3, 25), (0.38, 35), (0.48, 8), (0.6, 8), (0.7, 28), (0.8, 22), (0.9, 2), (1, 2)],
    "thigh": [(0, -2), (0.2, -15), (0.3, 25), (0.38, 20), (0.48, 5), (0.6, 5), (0.7, 15), (0.8, 20), (0.9, 0), (1, -2)],
    "knee": [(0, 4), (0.2, 15), (0.3, 30), (0.38, 30), (0.48, 10), (0.6, 10), (0.7, 25), (0.8, 30), (0.9, 10), (1, 4)],
    "wrist": [(0, 0), (0.2, 0), (0.28, 30), (0.38, 80), (0.48, 85), (0.6, 85), (0.7, 85), (0.8, 30), (0.88, 0), (1, 0)],
}


def muscle_up_sample(t):
    k = lambda name: splined(MUSCLE_UP[name], t) * DEG
    thigh = k("thigh")
    shin = thigh + k("knee")
    foot = shin + POINT * DEG
    trunk, arm, elbow, wrist = k("trunk"), -k("armFwd"), k("elbow"), k("wrist")
    twist = lambda r: qmul(r, PRONATE)
    q = {"pelvis": rx(trunk), "spine": rx(trunk), "neck": rx(0.3 * trunk), "head": rx(0.3 * trunk)}
    for S in ("L", "R"):
        q["thigh." + S] = rx(thigh)
        q["shin." + S] = rx(shin)
        q["foot." + S] = rx(foot)
        q["upper_arm." + S] = rx(arm)
        q["forearm." + S] = twist(rx(arm - elbow))
        # Hanging, the hand bends toward the bar; turned over, it lies flat on top of it (the false grip of the transition).
        q["hand." + S] = twist(rx(arm - elbow + WRIST_FLEX * DEG + wrist))
        q["fingers." + S] = twist(rx(arm - elbow + (WRIST_FLEX + FINGER_CURL) * DEG + wrist * 0.4))
    return {"root": [0, 0, 0], "q": q}


# ---------- handstand ----------
# Kicked up from standing: the left foot steps forward as the trunk folds
# and the hands go to the floor, the right leg kicks up, the left follows,
# the body straightens to vertical, holds, and comes down the same way.
# Keys in t: trunk angle (0 standing, 180 inverted), the shoulders' height
# and forward position, each leg's thigh and knee.
HANDSTAND = {
    "trunk": [(0, 0), (0.06, 12), (0.16, 137), (0.24, 160), (0.32, 173), (0.40, 180), (0.62, 180), (0.70, 173), (0.78, 160), (0.86, 137), (0.95, 12), (1, 0)],
    "sh_y": [(0, 1.38), (0.06, 1.3), (0.16, 0.55), (0.24, 0.56), (0.78, 0.56), (0.86, 0.55), (0.95, 1.3), (1, 1.38)],
    "sh_z": [(0, 0), (0.06, 0.06), (0.16, 0.50), (0.24, 0.55), (0.78, 0.55), (0.86, 0.50), (0.95, 0.06), (1, 0)],
    "thigh_l": [(0, 0), (0.06, -25), (0.16, -10), (0.24, -15), (0.32, 120), (0.40, 180), (0.62, 180), (0.70, 120), (0.78, -15), (0.86, -10), (0.95, -25), (1, 0)],
    "knee_l": [(0, 0), (0.06, 20), (0.16, 8), (0.24, 25), (0.32, 20), (0.40, 0), (0.62, 0), (0.70, 20), (0.78, 25), (0.86, 8), (0.95, 20), (1, 0)],
    "thigh_r": [(0, 0), (0.06, 5), (0.16, 14), (0.24, 130), (0.32, 170), (0.40, 180), (0.62, 180), (0.70, 170), (0.78, 130), (0.86, 14), (0.95, 5), (1, 0)],
    "knee_r": [(0, 0), (0.06, 5), (0.16, 10), (0.24, 15), (0.32, 5), (0.40, 0), (0.62, 0), (0.70, 5), (0.78, 15), (0.86, 10), (0.95, 5), (1, 0)],
    "planted": [(0, 0), (0.12, 0), (0.16, 1), (0.86, 1), (0.90, 0), (1, 0)],
}
HAND_Z = 0.55


def handstand_sample(t):
    k = lambda name: splined(HANDSTAND[name], t)
    trunk = k("trunk") * DEG
    shoulder_mid = np.array([0.0, k("sh_y"), k("sh_z")])
    hip_mid = shoulder_mid - np.array([0.0, math.cos(trunk), math.sin(trunk)]) * L_TRUNK
    root, pelvis_pos = root_for_hip(hip_mid, rx(trunk))
    q = all_ident()
    q["pelvis"], q["spine"] = rx(trunk), rx(trunk)
    # The head looks between the hands: extended against the trunk once inverted, level while standing.
    gaze = splined([(0, 0), (0.16, -40), (0.40, -45), (0.62, -45), (0.86, -40), (1, 0)], t) * DEG
    q["neck"], q["head"] = rx(trunk + gaze * 0.5), rx(trunk + gaze)
    for S, side in (("L", "l"), ("R", "r")):
        thigh = k("thigh_" + side) * DEG
        shin = thigh + k("knee_" + side) * DEG
        lifted = smooth(min(1.0, max(0.0, (k("thigh_" + side) - 20) / 60)))
        q["thigh." + S], q["shin." + S], q["foot." + S] = rx(thigh), rx(shin), rx(shin + POINT * DEG * lifted)
    planted = k("planted")
    for S, side in (("L", "l"), ("R", "r")):
        shoulder = shoulder_from(pelvis_pos, rx(trunk), side)
        hand = np.array([shoulder[0], 0.03, HAND_Z])
        d = hand - shoulder
        reach = angle_of(d / max(float(np.linalg.norm(d)), 1e-9))  # the straight arm from the shoulder to the planted hand
        swing = splined([(0, 0), (0.06, -10), (0.16, reach / DEG), (0.86, reach / DEG), (0.95, -10), (1, 0)], t) * DEG
        arm = swing if planted < 1 else reach
        q["upper_arm." + S] = q["forearm." + S] = qmul(rx(arm), PRONATE) if planted > 0 else rx(arm)
        q["hand." + S] = q["fingers." + S] = qmul(rx(arm - 90 * DEG * planted), PRONATE) if planted > 0 else rx(arm)
    return {"root": [round(float(v), 4) for v in root], "q": q}


# ---------- kayaking: the forward stroke ----------
# Sitting in a sit-in kayak (owner's request, 2026-10-08): the legs forward to the foot pegs with the knees a
# little bent, a double-bladed paddle held with both hands. One cycle is a stroke on the right then one on the
# left, the second the mirror of the first. The catch: the trunk wound so that side's shoulder is forward, the
# lower hand reaching forward low, the top hand at about eye level, the blade put in by the feet. The pull: the
# trunk unwinds, drawing the blade back to the hip. The exit: the blade lifts out at the hip as the shaft rolls
# over to put the other blade forward. The boat floats with its seat KAYAK_SEAT above the floor and the water's
# surface at KAYAK_WATER, deep enough that the blade never reaches the floor (the lake bed, seen through the
# water). The arms are solved as the racket strokes are (_racket_solve_once), both hands holding the shaft.
KAYAK_SEAT = 0.35
KAYAK_WATER = 0.50
KAYAK_HIP = KAYAK_SEAT + 0.10  # a seated hip joint sits this far above what it sits on (seated_twist_sample)
KAYAK_PEGS = (0.15, KAYAK_SEAT + 0.12, 0.80)  # each ankle at a foot peg: out from the midline, up, forward


def _kayak_body(yaw_deg, lean_deg, r_hand, l_hand, r_bend, l_bend, **_):
    """One moment of the stroke without its arms: the trunk's yaw and lean over hips that stay in the seat, the
    legs to the pegs, and both hands' places on the shaft (in the boat's frame: x left, y up, z forward)."""
    q = all_ident()
    yaw = q_axis([0, 1, 0], yaw_deg * DEG)
    trunk = qmul(yaw, rx(lean_deg * DEG))
    pelvis = qmul(q_axis([0, 1, 0], yaw_deg * 0.15 * DEG), rx(lean_deg * 0.3 * DEG))  # the hips stay in the seat
    root, pelvis_pos = root_for_hip(np.array([0.0, KAYAK_HIP, 0.0]), pelvis)
    q["pelvis"], q["spine"] = pelvis, trunk
    q["neck"] = qmul(q_axis([0, 1, 0], yaw_deg * 0.5 * DEG), rx(lean_deg * 0.2 * DEG))
    q["head"] = q_axis([0, 1, 0], yaw_deg * 0.2 * DEG)  # the eyes stay ahead, on the bow
    up = np.array([0.0, 1.0, 0.0])
    for S, sgn in (("L", 1), ("R", -1)):
        hip = pelvis_pos + q_rot(pelvis, rig["hip." + S.lower()] - rig["pelvis"])
        ankle = np.array([sgn * KAYAK_PEGS[0], KAYAK_PEGS[1], KAYAK_PEGS[2]])
        knee = two_link_3d(hip, ankle, L_THIGH, L_SHIN, np.array([sgn * 0.4, 1.0, 0.0]))  # knees up and out, braced
        q["thigh." + S] = aim(knee - hip, up)  # the kneecap up
        q["shin." + S] = aim(ankle - knee, up)
        q["foot." + S] = rx(-75 * DEG)  # the sole on the peg, toes up
    sh = {"R": shoulder_from(pelvis_pos, trunk, "r"), "L": shoulder_from(pelvis_pos, trunk, "l")}
    hR, hL = np.asarray(r_hand, dtype=float), np.asarray(l_hand, dtype=float)
    r = (hL - hR) / float(np.linalg.norm(hL - hR))  # the shaft, from the right hand to the left
    return {"q": q, "root": root, "pelvis_pos": pelvis_pos, "pelvis": pelvis, "trunk": trunk, "front": q_rot(yaw, np.array([0.0, 0.0, 1.0])),
            "sh": sh, "r": r, "hand_R": hR, "hand_L": hL,
            "bend": {"R": q_rot(yaw, np.asarray(r_bend, dtype=float)), "L": q_rot(yaw, np.asarray(l_bend, dtype=float))},
            "both": 0.0, "l_holds": 1.0}  # both hands hold the shaft; each has its own place on it


def kayak_key(yaw, lean, r_hand, l_hand, r_bend, l_bend):
    return dict(yaw_deg=yaw, lean_deg=lean, r_hand=tuple(r_hand), l_hand=tuple(l_hand), r_bend=tuple(r_bend), l_bend=tuple(l_bend))


def kayak_mirror(k):
    """The same moment on the other side: left for right, x reversed."""
    m = lambda v: (-v[0], v[1], v[2])
    return kayak_key(-k["yaw_deg"], k["lean_deg"], m(k["l_hand"]), m(k["r_hand"]), m(k["l_bend"]), m(k["r_bend"]))


LOWER_R, TOP_L = (-0.6, -1.0, -0.2), (0.8, -1.0, -0.1)  # the lower elbow down and out, the top one down and out
KAYAK_RIGHT = [  # the right stroke; the left is its mirror half a cycle on
    (0.0, kayak_key(40, 14, (-0.22, 0.72, 0.52), (0.16, 1.08, 0.40), LOWER_R, TOP_L)),  # catch by the right foot
    (0.14, kayak_key(15, 10, (-0.26, 0.68, 0.22), (0.12, 1.06, 0.36), LOWER_R, TOP_L)),  # the pull
    (0.27, kayak_key(-12, 8, (-0.34, 0.74, -0.02), (0.24, 0.98, 0.28), (-0.4, -1.0, -0.6), TOP_L)),  # the exit at the hip, the elbow back and down
    (0.38, kayak_key(-28, 12, (-0.20, 0.95, 0.20), (0.25, 0.84, 0.40), (-0.8, -1.0, -0.1), (0.6, -1.0, -0.2))),  # over
]


def kayak_sample(t):
    keys = KAYAK_RIGHT + [(0.5 + tk, kayak_mirror(k)) for tk, k in KAYAK_RIGHT] + [(1.0, KAYAK_RIGHT[0][1])]
    return racket_flow(keys, t, body=_kayak_body, params=_kayak_params)


def _kayak_params(keys, t):
    """The stroke's parameters at t, each on a loop spline through the keys."""
    params = {}
    for n, v0 in keys[0][1].items():
        if isinstance(v0, tuple):
            params[n] = tuple(loop_spline([(tk, d[n][i]) for tk, d in keys], t) for i in range(len(v0)))
        else:
            params[n] = loop_spline([(tk, d[n]) for tk, d in keys], t)
    return params


CLIPS = {
    "stand": (stand_sample, "rest pose, tools/myo/designed_clip.py"),
    "plank": (plank_sample, "designed forearm plank, tools/myo/designed_clip.py"),
    "cycling": (cycling_sample, "designed cycling, tools/myo/designed_clip.py"),
    "boat-pose": (boat_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "warrior-3": (warrior3_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "wheel-pose": (wheel_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "crow-pose": (crow_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "muscle-up": (muscle_up_sample, "designed bar muscle-up, tools/myo/designed_clip.py"),
    "handstand": (handstand_sample, "designed handstand kick-up, tools/myo/designed_clip.py"),
    "dips": (dips_sample, "designed parallel-bar dips, tools/myo/designed_clip.py"),
    "planche": (planche_sample, "designed planche, tools/myo/designed_clip.py"),
    "front-lever": (front_lever_sample, "designed front lever, tools/myo/designed_clip.py"),
    "foam-rolling": (foam_roll_sample, "designed foam rolling, tools/myo/designed_clip.py"),
    "standing-leg-raise": (leg_raise_sample, "designed standing leg raise, tools/myo/designed_clip.py"),
    "warrior-1": (warrior1_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "warrior-2": (warrior2_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "half-moon": (half_moon_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "scale-pose": (scale_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "headstand": (headstand_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "pigeon-pose": (pigeon_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "downward-dog": (downward_dog_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "cobra-pose": (cobra_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "childs-pose": (childs_pose_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "crab-walk": (crab_walk_sample, "designed movement, tools/myo/designed_clip.py"),
    "ab-roller": (ab_roller_sample, "designed movement, tools/myo/designed_clip.py"),
    "wall-angel": (wall_angel_sample, "designed movement, tools/myo/designed_clip.py"),
    "copenhagen-plank": (copenhagen_sample, "designed hold, tools/myo/designed_clip.py"),
    "cat-cow": (cat_cow_sample, "designed flow, tools/myo/designed_clip.py"),
    "tennis-forehand": (tennis_forehand_sample, "designed stroke, tools/myo/designed_clip.py"),
    "tennis-backhand": (tennis_backhand_sample, "designed stroke, tools/myo/designed_clip.py"),
    "tennis-serve": (tennis_serve_sample, "designed stroke, tools/myo/designed_clip.py"),
    "pickleball-forehand": (pickleball_forehand_sample, "designed stroke, tools/myo/designed_clip.py"),
    "pickleball-backhand": (pickleball_backhand_sample, "designed stroke, tools/myo/designed_clip.py"),
    "pickleball-serve": (pickleball_serve_sample, "designed stroke, tools/myo/designed_clip.py"),
    "kayaking": (kayak_sample, "designed stroke, tools/myo/designed_clip.py"),
    "single-leg-rdl-knee-up": (single_leg_rdl_knee_up_sample, "designed movement, tools/myo/designed_clip.py"),
    "windshield-wipers": (windshield_wipers_sample, "designed movement, tools/myo/designed_clip.py"),
    "straight-leg-sit-up": (straight_leg_sit_up_sample, "designed movement, tools/myo/designed_clip.py"),
    "straight-leg-hold": (straight_leg_hold_sample, "designed hold, tools/myo/designed_clip.py"),
    "v-up": (v_up_sample, "designed movement, tools/myo/designed_clip.py"),
    "pike-push-up": (pike_push_up_sample, "designed movement, tools/myo/designed_clip.py"),
    "shoulder-tap": (shoulder_tap_sample, "designed movement, tools/myo/designed_clip.py"),
    "double-leg-lift": (double_leg_lift_sample, "designed movement, tools/myo/designed_clip.py"),
    "straight-leg-raise": (straight_leg_raise_sample, "designed movement, tools/myo/designed_clip.py"),
    "deadlift": (deadlift_sample, "designed barbell lift, tools/myo/designed_clip.py"),
    "romanian-deadlift": (rdl_sample, "designed barbell lift, tools/myo/designed_clip.py"),
    "bench-press": (bench_press_sample, "designed barbell lift, tools/myo/designed_clip.py"),
    "overhead-press": (overhead_press_sample, "designed barbell lift, tools/myo/designed_clip.py"),
    "barbell-row": (barbell_row_sample, "designed barbell lift, tools/myo/designed_clip.py"),
    "glute-bridge": (glute_bridge_sample, "designed movement, tools/myo/designed_clip.py"),
    "hip-thrust": (hip_thrust_sample, "designed barbell lift, tools/myo/designed_clip.py"),
    "hanging-leg-raise": (hanging_leg_raise_sample, "designed movement, tools/myo/designed_clip.py"),
    "hollow-hold": (hollow_hold_sample, "designed hold, tools/myo/designed_clip.py"),
    "sun-salutation": (sun_salutation_sample, "designed yoga sequence, tools/myo/designed_clip.py"),
    "tree-pose": (tree_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "chair-pose": (chair_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "triangle-pose": (triangle_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "bridge-pose": (bridge_pose_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "seated-twist": (seated_twist_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "low-lunge": (low_lunge_sample, "designed yoga hold, tools/myo/designed_clip.py"),
    "quad-stretch": (quad_stretch_sample, "designed stretch, tools/myo/designed_clip.py"),
    "calf-stretch": (calf_stretch_sample, "designed stretch, tools/myo/designed_clip.py"),
    "hamstring-stretch": (hamstring_fold_sample, "designed stretch, tools/myo/designed_clip.py"),
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
