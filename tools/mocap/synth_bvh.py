"""Write a synthetic BVH squat from the app's analytic joint-angle function.

    python3 synth_bvh.py out/synthetic-squat.bvh

This is a round-trip test for extract_angles.py, not a motion source: the
extractor should read back the same four angles it was built from, within a
fraction of a degree. It uses a Mixamo-like hierarchy, Y-up, facing +Z.
"""

import math
import sys

OUT = sys.argv[1]
FPS = 30
FRAMES = 90
DEG = math.pi / 180
BOTTOM = {"ankle": 28, "knee": 112, "hip": 118, "shoulder": 115}  # keep in step with src/lib/kinematics/squat.ts

SHIN, THIGH = 0.42, 0.43
HIP_X, ANKLE_Y = 0.09, 0.02


def pose(t):
    depth = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    ankle, knee, hip, shoulder = (BOTTOM[k] * depth * DEG for k in ("ankle", "knee", "hip", "shoulder"))
    trunk = ankle - knee + hip
    return {"shin": ankle, "thigh": ankle - knee, "trunk": trunk, "armFwd": shoulder - trunk}


def rot_x(v, a):
    x, y, z = v
    return (x, y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a))


hierarchy = """HIERARCHY
ROOT Hips
{
\tOFFSET 0.00 %.2f 0.00
\tCHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
\tJOINT Spine
\t{
\t\tOFFSET 0.00 0.10 0.00
\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\tJOINT Neck
\t\t{
\t\t\tOFFSET 0.00 0.45 0.00
\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\tJOINT Head
\t\t\t{
\t\t\t\tOFFSET 0.00 0.08 0.00
\t\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\t\tEnd Site
\t\t\t\t{
\t\t\t\t\tOFFSET 0.00 0.18 0.00
\t\t\t\t}
\t\t\t}
\t\t}
\t\tJOINT LeftArm
\t\t{
\t\t\tOFFSET 0.20 0.43 0.00
\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\tJOINT LeftForeArm
\t\t\t{
\t\t\t\tOFFSET 0.00 -0.30 0.00
\t\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\t\tEnd Site
\t\t\t\t{
\t\t\t\t\tOFFSET 0.00 -0.27 0.00
\t\t\t\t}
\t\t\t}
\t\t}
\t\tJOINT RightArm
\t\t{
\t\t\tOFFSET -0.20 0.43 0.00
\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\tJOINT RightForeArm
\t\t\t{
\t\t\t\tOFFSET 0.00 -0.30 0.00
\t\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\t\tEnd Site
\t\t\t\t{
\t\t\t\t\tOFFSET 0.00 -0.27 0.00
\t\t\t\t}
\t\t\t}
\t\t}
\t}
\tJOINT LeftUpLeg
\t{
\t\tOFFSET %.2f 0.00 0.00
\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\tJOINT LeftLeg
\t\t{
\t\t\tOFFSET 0.00 -%.2f 0.00
\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\tJOINT LeftFoot
\t\t\t{
\t\t\t\tOFFSET 0.00 -%.2f 0.00
\t\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\t\tEnd Site
\t\t\t\t{
\t\t\t\t\tOFFSET 0.00 -0.02 0.15
\t\t\t\t}
\t\t\t}
\t\t}
\t}
\tJOINT RightUpLeg
\t{
\t\tOFFSET -%.2f 0.00 0.00
\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\tJOINT RightLeg
\t\t{
\t\t\tOFFSET 0.00 -%.2f 0.00
\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\tJOINT RightFoot
\t\t\t{
\t\t\t\tOFFSET 0.00 -%.2f 0.00
\t\t\t\tCHANNELS 3 Zrotation Xrotation Yrotation
\t\t\t\tEnd Site
\t\t\t\t{
\t\t\t\t\tOFFSET 0.00 -0.02 0.15
\t\t\t\t}
\t\t\t}
\t\t}
\t}
}
""" % (ANKLE_Y + SHIN + THIGH, HIP_X, THIGH, SHIN, HIP_X, THIGH, SHIN)

# Channel order in the file: Hips(6) Spine Neck Head LeftArm LeftForeArm RightArm RightForeArm
# LeftUpLeg LeftLeg LeftFoot RightUpLeg RightLeg RightFoot, each 3 rotations (Z X Y).
lines = []
hip_rest_y = ANKLE_Y + SHIN + THIGH
for f in range(FRAMES):
    p = pose(f / FRAMES)
    knee = rot_x((0, SHIN, 0), p["shin"])
    hip = rot_x((0, THIGH, 0), p["thigh"])
    hips_pos = (0.0, ANKLE_Y + knee[1] + hip[1], knee[2] + hip[2])
    d = lambda r: "%.4f" % math.degrees(r)
    rot = lambda r: "0.0000 %s 0.0000" % d(r)
    chans = [
        "%.4f %.4f %.4f" % hips_pos,
        rot(p["trunk"]),  # Hips carries the trunk lean
        rot(0.0),  # Spine
        rot(-p["trunk"] * 0.8),  # Neck: gaze roughly level
        rot(0.0),  # Head
        rot(-p["armFwd"] - p["trunk"]),  # LeftArm, relative to the (leaning) spine
        rot(0.0),
        rot(-p["armFwd"] - p["trunk"]),  # RightArm
        rot(0.0),
        rot(p["thigh"] - p["trunk"]),  # LeftUpLeg
        rot(p["shin"] - p["thigh"]),  # LeftLeg
        rot(-p["shin"]),  # LeftFoot: flat on the floor
        rot(p["thigh"] - p["trunk"]),
        rot(p["shin"] - p["thigh"]),
        rot(-p["shin"]),
    ]
    lines.append(" ".join(chans))

with open(OUT, "w") as fh:
    fh.write(hierarchy)
    fh.write("MOTION\nFrames: %d\nFrame Time: %.6f\n" % (FRAMES, 1 / FPS))
    fh.write("\n".join(lines) + "\n")
print("wrote", OUT, "%d frames" % FRAMES)
b = pose(0.5)
print("bottom (degrees): shin %.1f thigh %.1f trunk %.1f armFwd %.1f" % tuple(math.degrees(b[k]) for k in ("shin", "thigh", "trunk", "armFwd")))
