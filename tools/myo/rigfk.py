"""Forward kinematics of the figure's rig from a MotionClip3D sample, mirroring
AnatomyFigure.tsx so the estimator sees exactly what the viewer shows.

Frames are the app's: Y-up, +Z forward, metres. Joint positions come from
tools/mocap/rig-joints.json (Blender Z-up, converted here).
"""

import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
RIG_JSON = os.path.join(HERE, "..", "mocap", "rig-joints.json")

# bone -> (head joint, tail joint, parent bone)
BONES = {
    "pelvis": ("pelvis", "l5", None),
    "spine": ("l5", "t1", "pelvis"),
    "neck": ("t1", "c7", "spine"),
    "head": ("c7", "skull", "neck"),
}
for s, S in (("l", "L"), ("r", "R")):
    BONES["thigh." + S] = ("hip." + s, "knee." + s, "pelvis")
    BONES["shin." + S] = ("knee." + s, "ankle." + s, "thigh." + S)
    BONES["foot." + S] = ("ankle." + s, "toe." + s, "shin." + S)
    BONES["upper_arm." + S] = ("shoulder." + s, "elbow." + s, "spine")
    BONES["forearm." + S] = ("elbow." + s, "wrist." + s, "upper_arm." + S)
    BONES["hand." + S] = ("wrist." + s, "mcp." + s, "forearm." + S)
ORDER = ["pelvis", "spine", "neck", "head", "thigh.L", "shin.L", "foot.L", "thigh.R", "shin.R", "foot.R", "upper_arm.L", "forearm.L", "hand.L", "upper_arm.R", "forearm.R", "hand.R"]


def quat_to_mat(q):
    x, y, z, w = q
    return np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ]
    )


def load_rig():
    raw = json.load(open(RIG_JSON))
    return {k: np.array([v[0], v[2], -v[1]]) for k, v in raw.items()}  # Blender Z-up -> Y-up


class RigFK:
    """Posed joint positions and bone rotation matrices for one sample."""

    def __init__(self, rig):
        self.rig = rig

    def pose(self, sample, anchor="feet", bar_height=2.3, root_offset=(0, 0, 0)):
        rig = self.rig
        R = {b: quat_to_mat(sample["q"][b]) if b in sample["q"] else np.eye(3) for b in ORDER}
        # Each bone's head sits where its parent's chain put it; its tail follows its own rotation.
        pos = {}
        pelvis_head = rig["pelvis"].copy()
        pos["pelvis"] = pelvis_head
        for b in ORDER:
            h, t, parent = BONES[b]
            head = pelvis_head if parent is None else pos[parent + "/" + h] if (parent + "/" + h) in pos else None
            if head is None:
                # A child bone's head is a joint of the parent segment: find it by rotating the parent's rest offset.
                ph, pt, _ = BONES[parent]
                head = pos[parent] + R[parent] @ (rig[h] - rig[ph])
            pos[b] = head
            pos[b + "/" + t] = head + R[b] @ (rig[t] - rig[h])
        # Anchor: shift everything so the reference point lands where it must.
        if anchor == "free":
            shift = np.array(sample["root"]) + np.array(root_offset)
        elif anchor == "hands":
            target = np.array([rig["wrist.l"][0], bar_height - 0.015, -0.03])
            shift = target - pos["hand.L"]
        else:
            shift = rig["ankle.l"] - pos["foot.L"]
        joints = {}
        for b in ORDER:
            h, t, _ = BONES[b]
            joints[h] = pos[b] + shift
            joints[t] = pos[b + "/" + t] + shift
        return joints, R
