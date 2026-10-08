"""Measure the figure's body for the designed movements' collision checks.

Reads tools/blender/out/figure.glb (the figure in the designs' rest pose, arms down, on the designs' own bones),
fills the whole body into a solid on a 1 cm grid and gives each solid voxel to the bone its nearest vertex is
skinned mostly to. Writes tools/myo/torso_sdf.npz with two signed distance fields, in millimetres (negative
inside), each with its grid's origin: the torso (pelvis and spine: the arms and legs left out, the hollows under
the arms kept) and the head (neck and head, which turn on their own); the neck and head joints they turn about;
and a sample of each arm's skin vertices with their skin weights gathered onto the torso, upper arm, forearm and
hand. The racket strokes skin those vertices as the rig will and keep them out of both fields
(designed_clip.py, arm_skin_clear).

usage: tools/myo/.venv/bin/python tools/myo/measure_torso.py
"""
import json, os, struct
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "blender", "out", "figure.glb")
RIG = os.path.join(HERE, "..", "blender", "out", "figure-mixamo.glb")  # the same mesh on the rig the site plays
OUT = os.path.join(HERE, "torso_sdf.npz")
VOX = 0.01
DILATE = 2  # voxels: closes the gaps between surfaces before the fill; taken off again after it
TORSO = ("pelvis", "spine")
HEAD = ("neck", "head")
RIG_TORSO = ("Hips", "Spine", "Spine1", "Spine2", "LeftShoulder", "RightShoulder")  # the rig's (clavicles ride the chest)
RIG_HEAD = ("Neck", "Head", "HeadTop_End")
ARM_SAMPLES = 6000  # skin vertices kept per arm (2500 missed a wrist on the belly by 1 cm)
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read_skinned(path):
    """A skinned GLB's joints (names, rest positions) and, per mesh, its vertices with their joints and weights."""
    data = open(path, "rb").read()
    off, chunks = 12, []
    while off < len(data):
        ln, _ = struct.unpack_from("<II", data, off)
        chunks.append(data[off + 8 : off + 8 + ln])
        off += 8 + ln
    gl, binc = json.loads(chunks[0]), chunks[1]

    def acc(i):
        a = gl["accessors"][i]
        bv = gl["bufferViews"][a["bufferView"]]
        dt = np.dtype(CT[a["componentType"]])
        n, c = a["count"], NC[a["type"]]
        start = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
        stride = bv.get("byteStride", 0) or dt.itemsize * c
        raw = np.frombuffer(binc, dtype=np.uint8, count=stride * (n - 1) + dt.itemsize * c, offset=start)
        return np.lib.stride_tricks.as_strided(raw, shape=(n, c * dt.itemsize), strides=(stride, 1)).copy().view(dt).reshape(n, c)

    nodes = gl["nodes"]
    skin = gl["skins"][0]
    jnames = [nodes[j]["name"] for j in skin["joints"]]
    ibm = acc(skin["inverseBindMatrices"]).reshape(-1, 4, 4).transpose(0, 2, 1)  # column-major
    joint_pos = {n: np.linalg.inv(ibm[k])[:3, 3] for k, n in enumerate(jnames)}
    meshes = []
    for nd in nodes:
        if "mesh" not in nd:
            continue
        P, JJ, WW = [], [], []
        for prim in gl["meshes"][nd["mesh"]]["primitives"]:
            at = prim["attributes"]
            if "JOINTS_0" not in at:
                continue
            W = acc(at["WEIGHTS_0"]).astype(float)
            P.append(acc(at["POSITION"]).astype(float))
            JJ.append(acc(at["JOINTS_0"]).astype(int))
            WW.append(W / np.maximum(W.sum(axis=1, keepdims=True), 1e-9))
        if P:
            meshes.append((nd.get("name", ""), np.concatenate(P), np.concatenate(JJ), np.concatenate(WW)))
    return jnames, joint_pos, meshes


def main():
    jnames, joint_pos, meshes = read_skinned(SRC)
    P = np.concatenate([m[1] for m in meshes])
    JJ = np.concatenate([m[2] for m in meshes])
    WW = np.concatenate([m[3] for m in meshes])
    dom = JJ[np.arange(len(JJ)), WW.argmax(axis=1)]

    # Each arm's skin, sampled: the vertices where they rest in the designs' pose (figure.glb), with the RIG's
    # skin weights (figure-mixamo.glb, the same mesh in the same vertex order), gathered onto four parts (torso,
    # upper arm, forearm, hand and fingers), so a design skins it as the site will. The design figure's own
    # weights differ most where it matters, under the arm: tested with them, a serve passed that the rig
    # showed 3 cm into the side (2026-10-07).
    rnames, _, rmeshes = read_skinned(RIG)
    rig_by_name = {m[0]: m for m in rmeshes}

    def part(n, side):
        n = n.replace("mixamorig:", "")
        S = {"L": "Left", "R": "Right"}[side]
        if n.startswith(S + "Hand"):
            return 3
        return {S + "Arm": 1, S + "ForeArm": 2}.get(n, 0)
    arms = {}
    rng = np.random.default_rng(0)
    for side in ("L", "R"):
        jp = np.array([part(n, side) for n in rnames])
        pos, w4s = [], []
        for name, p, _, _ in meshes:
            rm = rig_by_name.get(name)
            if rm is None or len(rm[1]) != len(p):
                continue  # not the same vertices on the rig (the skeleton's pieces); none is an arm's skin
            J, W = rm[2], rm[3]
            on = jp[J[np.arange(len(J)), W.argmax(axis=1)]] > 0
            if not on.any():
                continue
            w4 = np.zeros((int(on.sum()), 4))
            for k in range(J.shape[1]):
                np.add.at(w4, (np.arange(int(on.sum())), jp[J[on, k]]), W[on, k])
            pos.append(p[on])
            w4s.append(w4)
        pos, w4s = np.concatenate(pos), np.concatenate(w4s)
        idx = np.sort(rng.choice(len(pos), size=min(len(pos), ARM_SAMPLES), replace=False))
        arms[side] = (pos[idx], w4s[idx])

    lo = P.min(axis=0) - 0.1
    shape = np.ceil((P.max(axis=0) + 0.1 - lo) / VOX).astype(int) + 1
    grid = np.zeros(shape, bool)
    idx = np.floor((P - lo) / VOX).astype(int)
    grid[idx[:, 0], idx[:, 1], idx[:, 2]] = True
    solid = ndimage.binary_fill_holes(ndimage.binary_dilation(grid, iterations=DILATE))
    solid = ndimage.binary_erosion(solid, iterations=DILATE)
    # each solid voxel belongs to what its nearest vertex is skinned to: 1 the torso, 2 the head, 0 anything
    # else, by the RIG's weights where the rig has the same vertices. The design figure gives the back of the
    # armpit to the upper arm and the rig gives it to the spine, so a field labelled by the design's weights
    # passed a serve whose arm, swung back, ran 3 cm into that skin on the rig (2026-10-07).
    label = []
    for name, p, J, W in meshes:
        rm = rig_by_name.get(name)
        if rm is not None and len(rm[1]) == len(p):
            names = [rnames[j].replace("mixamorig:", "") for j in rm[2][np.arange(len(p)), rm[3].argmax(axis=1)]]
            label.append([1 if n in RIG_TORSO else 2 if n in RIG_HEAD else 0 for n in names])
        else:
            names = [jnames[j] for j in J[np.arange(len(p)), W.argmax(axis=1)]]
            label.append([1 if n in TORSO else 2 if n in HEAD else 0 for n in names])
    label = np.concatenate([np.array(x, dtype=int) for x in label])
    cells = np.argwhere(solid)
    _, nb = cKDTree(P).query(lo + (cells + 0.5) * VOX)
    owner = label[nb]

    def field(names, which):
        body = np.zeros(shape, bool)
        t = cells[owner == which]
        body[t[:, 0], t[:, 1], t[:, 2]] = True
        ix = np.argwhere(body)
        a, b = np.maximum(ix.min(axis=0) - 12, 0), np.minimum(ix.max(axis=0) + 13, shape)  # cropped, with a margin
        body = body[a[0] : b[0], a[1] : b[1], a[2] : b[2]]
        sdf = (ndimage.distance_transform_edt(~body) - ndimage.distance_transform_edt(body)) * VOX
        occ = np.argwhere(body) * VOX + lo + a * VOX
        print("  %s: %s voxels, x %.3f..%.3f y %.3f..%.3f z %.3f..%.3f" % ("+".join(names), body.shape, occ[:, 0].min(), occ[:, 0].max(), occ[:, 1].min(), occ[:, 1].max(), occ[:, 2].min(), occ[:, 2].max()))
        return np.round(sdf * 1000).astype(np.int16), lo + a * VOX + 0.5 * VOX

    torso_sdf, torso_origin = field(TORSO, 1)
    head_sdf, head_origin = field(HEAD, 2)
    np.savez_compressed(OUT, sdf_mm=torso_sdf, origin=torso_origin, head_sdf_mm=head_sdf, head_origin=head_origin, voxel=np.float64(VOX),
                        neck_joint=joint_pos["neck"], head_joint=joint_pos["head"],
                        arm_l=arms["L"][0].astype(np.float16), arm_l_w=arms["L"][1].astype(np.float16),
                        arm_r=arms["R"][0].astype(np.float16), arm_r_w=arms["R"][1].astype(np.float16),
                        source=np.array("tools/blender/out/figure.glb rest pose, labelled and arm-weighted by figure-mixamo.glb; torso: %s; head: %s" % (", ".join(RIG_TORSO), ", ".join(RIG_HEAD))))
    print("wrote %s (neck joint %s, head joint %s)" % (OUT, np.round(joint_pos["neck"], 3), np.round(joint_pos["head"], 3)))


if __name__ == "__main__":
    main()
