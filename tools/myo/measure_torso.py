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
OUT = os.path.join(HERE, "torso_sdf.npz")
VOX = 0.01
DILATE = 2  # voxels: closes the gaps between surfaces before the fill; taken off again after it
TORSO = ("pelvis", "spine")
HEAD = ("neck", "head")
ARM_SAMPLES = 6000  # skin vertices kept per arm (2500 missed a wrist on the belly by 1 cm)
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def main():
    data = open(SRC, "rb").read()
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
    P, dom, JJ, WW = [], [], [], []
    for nd in nodes:
        if "mesh" not in nd:
            continue
        for prim in gl["meshes"][nd["mesh"]]["primitives"]:
            at = prim["attributes"]
            if "JOINTS_0" not in at:
                continue
            J = acc(at["JOINTS_0"]).astype(int)
            W = acc(at["WEIGHTS_0"]).astype(float)
            P.append(acc(at["POSITION"]).astype(float))
            JJ.append(J)
            WW.append(W / np.maximum(W.sum(axis=1, keepdims=True), 1e-9))
            dom.append(J[np.arange(len(J)), W.argmax(axis=1)])
    P, dom, JJ, WW = np.concatenate(P), np.concatenate(dom), np.concatenate(JJ), np.concatenate(WW)

    # Each arm's skin, sampled, with its weights gathered onto four parts (torso, upper arm, forearm, hand and
    # fingers), so a design can skin it the way the rig will.
    def part(n, side):
        return {"upper_arm." + side: 1, "forearm." + side: 2, "hand." + side: 3, "fingers." + side: 3}.get(n, 0)
    arms = {}
    rng = np.random.default_rng(0)
    for side in ("L", "R"):
        jp = np.array([part(n, side) for n in jnames])
        idx = np.flatnonzero(jp[dom] > 0)
        idx = np.sort(rng.choice(idx, size=min(len(idx), ARM_SAMPLES), replace=False))
        w4 = np.zeros((len(idx), 4))
        for k in range(JJ.shape[1]):
            np.add.at(w4, (np.arange(len(idx)), jp[JJ[idx, k]]), WW[idx, k])
        arms[side] = (P[idx], w4)

    lo = P.min(axis=0) - 0.1
    shape = np.ceil((P.max(axis=0) + 0.1 - lo) / VOX).astype(int) + 1
    grid = np.zeros(shape, bool)
    idx = np.floor((P - lo) / VOX).astype(int)
    grid[idx[:, 0], idx[:, 1], idx[:, 2]] = True
    solid = ndimage.binary_fill_holes(ndimage.binary_dilation(grid, iterations=DILATE))
    solid = ndimage.binary_erosion(solid, iterations=DILATE)
    # each solid voxel belongs to the bone its nearest vertex is skinned to
    cells = np.argwhere(solid)
    _, nb = cKDTree(P).query(lo + (cells + 0.5) * VOX)
    owner = dom[nb]

    def field(names):
        keep = [i for i, n in enumerate(jnames) if n in names]
        body = np.zeros(shape, bool)
        t = cells[np.isin(owner, keep)]
        body[t[:, 0], t[:, 1], t[:, 2]] = True
        ix = np.argwhere(body)
        a, b = np.maximum(ix.min(axis=0) - 12, 0), np.minimum(ix.max(axis=0) + 13, shape)  # cropped, with a margin
        body = body[a[0] : b[0], a[1] : b[1], a[2] : b[2]]
        sdf = (ndimage.distance_transform_edt(~body) - ndimage.distance_transform_edt(body)) * VOX
        occ = np.argwhere(body) * VOX + lo + a * VOX
        print("  %s: %s voxels, x %.3f..%.3f y %.3f..%.3f z %.3f..%.3f" % ("+".join(names), body.shape, occ[:, 0].min(), occ[:, 0].max(), occ[:, 1].min(), occ[:, 1].max(), occ[:, 2].min(), occ[:, 2].max()))
        return np.round(sdf * 1000).astype(np.int16), lo + a * VOX + 0.5 * VOX

    torso_sdf, torso_origin = field(TORSO)
    head_sdf, head_origin = field(HEAD)
    np.savez_compressed(OUT, sdf_mm=torso_sdf, origin=torso_origin, head_sdf_mm=head_sdf, head_origin=head_origin, voxel=np.float64(VOX),
                        neck_joint=joint_pos["neck"], head_joint=joint_pos["head"],
                        arm_l=arms["L"][0].astype(np.float16), arm_l_w=arms["L"][1].astype(np.float16),
                        arm_r=arms["R"][0].astype(np.float16), arm_r_w=arms["R"][1].astype(np.float16),
                        source=np.array("tools/blender/out/figure.glb rest pose; torso: %s; head: %s" % (", ".join(TORSO), ", ".join(HEAD))))
    print("wrote %s (neck joint %s, head joint %s)" % (OUT, np.round(joint_pos["neck"], 3), np.round(joint_pos["head"], 3)))


if __name__ == "__main__":
    main()
