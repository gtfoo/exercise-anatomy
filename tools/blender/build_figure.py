"""Build the rigged ecorche GLB from the Z-Anatomy atlas.

    blender --background vendor/Z-Anatomy/Startup.blend --python build_figure.py -- <out_dir>

Reads <out_dir>/inventory.json (from inventory.py) to pick objects, then:

1. merges each target muscle (both sides) into one mesh named by its app id;
2. merges every other real muscle into `context-muscles`, and the skeleton into `skeleton`;
3. decimates each to a vertex budget;
4. builds an armature whose joints come from the bone meshes themselves;
5. weights vertices by distance to bone segments (bones rigid, muscles blended);
6. exports <out_dir>/figure.glb (rest pose, Y-up) and renders PNG checks,
   including one posed at the bottom of a squat with the same joint angles the app uses.

Never saves the .blend: the vendor file stays pristine.
"""

import json
import math
import os
import re
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)

# ---------- what to extract ----------

# app muscle id -> Z-Anatomy base names (without .l/.r). "re:" entries are regexes.
TARGETS = {
    "rectus-femoris": ["Rectus femoris muscle"],
    "vastus-lateralis": ["Vastus lateralis muscle"],
    "vastus-medialis": ["Vastus medialis muscle"],
    "vastus-intermedius": ["Vastus intermedius muscle"],
    "gluteus-maximus": ["Gluteus maximus muscle"],
    "gluteus-medius": ["Gluteus medius muscle"],
    "gluteus-minimus": ["Gluteus minimus muscle"],
    "biceps-femoris": ["Long head of biceps femoris", "Short head of biceps femoris"],
    "semitendinosus": ["Semitendinosus muscle"],
    "semimembranosus": ["Semimembranosus muscle"],
    "adductor-magnus": ["Adductor magnus"],
    "adductor-longus": ["Adductor longus"],
    "adductor-brevis": ["Adductor brevis"],
    "soleus": ["Soleus muscle"],
    "gastrocnemius-medial": ["Medial head of gastrocnemius"],
    "gastrocnemius-lateral": ["Lateral head of gastrocnemius"],
    "tibialis-anterior": ["Tibialis anterior muscle"],
    "erector-spinae": [
        "Iliocostalis lumborum muscle",
        "Iliocostalis thoracis muscle",
        "Longissimus thoracis muscle",
        "Spinalis thoracis muscle",
    ],
    "rectus-abdominis": ["Rectus abdominis muscle"],
    "external-obliques": ["re:^External (abdominal )?oblique"],
    "transversus-abdominis": ["Transversus abdominis muscle"],
    # Pull-up
    "latissimus-dorsi": ["Latissimus dorsi muscle"],
    "teres-major": ["Teres major muscle"],
    "teres-minor": ["Teres minor muscle"],
    "infraspinatus": ["Infraspinatus muscle"],
    "biceps-brachii": ["Long head of biceps brachii", "Short head of biceps brachii"],
    "brachialis": ["Brachialis muscle"],
    "brachioradialis": ["Brachioradialis muscle"],
    "posterior-deltoid": ["Scapular spinal part of deltoid muscle"],
    "middle-deltoid": ["Acromial part of deltoid muscle"],
    "anterior-deltoid": ["Clavicular part of deltoid muscle"],
    "upper-trapezius": ["Descending part of trapezius muscle"],
    "supraspinatus": ["Supraspinatus muscle"],
    "lower-trapezius": ["Ascending part of trapezius muscle"],
    "middle-trapezius": ["Transverse part of trapezius muscle"],
    "rhomboids": ["Rhomboid major muscle", "Rhomboid minor muscle"],
    "pectoralis-major": ["Sternocostal head of pectoralis major muscle", "Clavicular head of pectoralis major muscle"],
    "triceps-long-head": ["Long head of triceps brachii"],
    # The owner's list of 2026-09-11: the rest of the triceps, the deep chest and
    # cuff, the extensors that balance the grip, the deep obliques, the serratus,
    # the smaller adductors and the outside of the calf.
    "triceps-lateral-head": ["Lateral head of triceps brachii"],
    "triceps-medial-head": ["Medial head of triceps brachii"],
    "coracobrachialis": ["Coracobrachialis muscle"],
    "forearm-extensors": [
        "Extensor carpi radialis longus",
        "Extensor carpi radialis brevis",
        "Humeral head of extensor carpi ulnaris",
        "Ulnar head of extensor carpi ulnaris",
        "Extensor digitorum",
        "Extensor digiti minimi",
    ],
    "pectoralis-minor": ["Pectoralis minor muscle"],
    "subscapularis": ["Subscapularis muscle"],
    "serratus-anterior": ["Serratus anterior muscle"],
    "internal-obliques": ["Internal abdominal oblique muscle"],
    "gracilis": ["Gracilis muscle"],
    "pectineus": ["Pectineus muscle"],
    "fibularis": ["Fibularis longus muscle", "Fibularis brevis muscle"],
    "forearm-flexors": [
        "Flexor digitorum profundus",
        "Humero-ulnar head of flexor digitorum superficialis",
        "Radial head of flexor digitorum superficialis",
        "Flexor carpi radialis",
        "Humeral head of flexor carpi ulnaris",
        "Ulnar head of flexor carpi ulnaris",
    ],
}

# Not muscle bellies, or bellies nobody can see from outside (inner intercostal
# layers, diaphragm, pelvic floor, tongue, eye, larynx, pharynx). They clutter the
# context mesh and spend vertex budget on nothing.
CONTEXT_EXCLUDE = re.compile(
    r"bursa|sheath|fascia|retinacul|aponeurosis|tendinous|septum|linea|tendon of|sheath of"
    r"|(internal|innermost) intercostal|diaphragm|levator ani|coccygeus|transversus thoracis"
    r"|pharyn|palat|laryn|arytenoid|crico|thyro|stapedius|tensor tympani"
    r"|glossus|muscle of tongue|rectus (superior|inferior|medial|lateral)|(superior|inferior) oblique muscle"
    r"|levator palpebrae|ciliary|pupillae|bulbospongiosus|ischiocavernosus|cremaster|dartos",
    re.I,
)
# .j/.i are 2-vertex label anchors, .ol/.or/.el/.er origin and insertion markers,
# .g the group-title text meshes parked a metre to the left of the body.
LABEL_SUFFIX = re.compile(r"\.(j|i|g|o[lr]|e\d?[lr])$")

BUDGET_TARGET = 9000  # verts per target muscle (both sides together)
BUDGET_CONTEXT = 220000
BUDGET_SKELETON = 100000
BLEND_WIDTH = 0.08  # metres of effective distance over which muscle weights blend between two bones

# Envelope radius per bone: a vertex within this distance of the segment is "on"
# the bone. The torso bones are fat because ribs, abdomen and lats sit 10-15 cm
# from the spine, while the upper-arm bones hang only 5-8 cm from the same
# vertices; plain nearest-segment weighting handed the chest to the arms.
ENVELOPE = {"pelvis": 0.13, "spine": 0.13, "neck": 0.08, "head": 0.10, "thigh": 0.07, "shin": 0.05, "foot": 0.04, "upper_arm": 0.045, "forearm": 0.04, "hand": 0.035, "fingers": 0.025}

# ---------- helpers ----------

inv = json.load(open(os.path.join(OUT, "inventory.json"), encoding="utf-8"))
by_name = {o["name"]: o for o in inv["objects"]}


def in_collection(o, needle):
    return any(needle in c for c in o["collections"])


def real_mesh(o):
    return o["type"] == "MESH" and o["verts"] and o["verts"] > 2 and not LABEL_SUFFIX.search(o["name"])


def side_names(base):
    """Both sides of a base name, or the bare name if it has no sides."""
    if base.startswith("re:"):
        rx = re.compile(base[3:], re.I)
        return sorted(n for n in by_name if rx.search(n) and real_mesh(by_name[n]) and in_collection(by_name[n], "4: Muscular system"))
    out = [n for n in (base + ".l", base + ".r") if n in by_name]
    return out or ([base] if base in by_name else [])


def world_verts(obj):
    me = obj.data
    arr = np.empty(len(me.vertices) * 3, dtype=np.float64)
    me.vertices.foreach_get("co", arr)
    arr = arr.reshape(-1, 3)
    m = np.array(obj.matrix_world)
    return arr @ m[:3, :3].T + m[:3, 3]


def merge(name, sources):
    """One mesh object, in world space, from many source objects.

    Returns (obj, ranges): ranges are (start, count) vertex spans per source, in
    order, so weights can still be assigned per source object after merging.
    """
    import bmesh

    bm = bmesh.new()
    ranges = []
    for src in sources:
        me = src.to_mesh()
        me.transform(src.matrix_world)
        start = len(bm.verts)
        bm.from_mesh(me)
        ranges.append((start, len(me.vertices)))
        src.to_mesh_clear()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj, ranges


def decimate(obj, budget):
    n = len(obj.data.vertices)
    if n <= budget:
        return n
    mod = obj.modifiers.new("dec", "DECIMATE")
    mod.ratio = budget / n
    mod.use_collapse_triangulate = True
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    obj.modifiers.remove(mod)
    old = obj.data
    obj.data = me
    bpy.data.meshes.remove(old)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    return len(me.vertices)


def centroid_where(obj, mask_fn):
    v = world_verts(obj)
    sel = v[mask_fn(v)]
    return Vector(sel.mean(axis=0)) if len(sel) else Vector(v.mean(axis=0))


def bbox_center(obj):
    v = world_verts(obj)
    return Vector((v.min(axis=0) + v.max(axis=0)) / 2)


O = bpy.data.objects
print("=== build_figure: %d objects loaded ===" % len(O))

# ---------- 1. joints from the skeleton ----------

joints = {}
for s in ("l", "r"):
    femur, tibia, talus, humerus, radius, mt1 = (O["Femur." + s], O["Tibia." + s], O["Talus." + s], O["Humerus." + s], O["Radius." + s], O["First metatarsal bone." + s])
    fz = world_verts(femur)[:, 2]
    joints["hip." + s] = centroid_where(femur, lambda v: v[:, 2] > fz.max() - 0.045)
    joints["knee." + s] = centroid_where(femur, lambda v: v[:, 2] < fz.min() + 0.03)
    joints["ankle." + s] = bbox_center(talus)
    mv = world_verts(mt1)
    joints["toe." + s] = Vector(mv[mv[:, 1].argmin()])  # anterior is -Y
    hz = world_verts(humerus)[:, 2]
    joints["shoulder." + s] = centroid_where(humerus, lambda v: v[:, 2] > hz.max() - 0.04)
    joints["elbow." + s] = centroid_where(humerus, lambda v: v[:, 2] < hz.min() + 0.03)
    rz = world_verts(radius)[:, 2]
    joints["wrist." + s] = centroid_where(radius, lambda v: v[:, 2] < rz.min() + 0.02)
    # Knuckles: the distal ends of metacarpals 2-5. Fingertips: the distal phalanges of the same fingers.
    mcs = np.concatenate([world_verts(O["%s metacarpal bone.%s" % (n, s)]) for n in ("Second", "Third", "Fourth", "Fifth")])
    joints["mcp." + s] = Vector(mcs[mcs[:, 2] < mcs[:, 2].min() + 0.012].mean(axis=0))
    tips = np.concatenate([world_verts(O["Distal phalanx of %s finger of hand.%s" % (n, s)]) for n in ("second", "third", "fourth", "fifth")])
    joints["fingertip." + s] = Vector(tips.mean(axis=0))

joints["pelvis"] = (joints["hip.l"] + joints["hip.r"]) / 2
joints["l5"] = bbox_center(O["Vertebra L5"])
joints["t1"] = bbox_center(O["Vertebra T1"])
joints["c7"] = bbox_center(O["Vertebra C7"])
# The head nods on the atlas, so that is where the neck bone ends and the head
# bone begins. With the joint at C7 the whole cervical spine was welded to the
# skull and every neck rotation acted on a two-centimetre stub, which is why
# the skull looked stretched in a crow or a warrior III (owner, 2026-09-12).
joints["c1"] = bbox_center(next(O[n] for n in ("Atlas (C1)", "Atlas", "Anterior arch of atlas") if n in O))
occ = world_verts(O["Occipital bone"])
joints["skull"] = Vector((0, joints["c7"].y - 0.02, inv["mesh_extent"]["max"][2]))
for k, v in joints.items():
    print("joint %-12s %s" % (k, [round(c, 3) for c in v]))

# Bone name -> (head, tail, parent). Names follow the glTF/Blender .L/.R habit the app expects.
BONES = {
    "pelvis": ("pelvis", "l5", None),
    "spine": ("l5", "t1", "pelvis"),
    "neck": ("t1", "c1", "spine"),
    "head": ("c1", "skull", "neck"),
}
for s, S in (("l", "L"), ("r", "R")):
    BONES["thigh." + S] = ("hip." + s, "knee." + s, "pelvis")
    BONES["shin." + S] = ("knee." + s, "ankle." + s, "thigh." + S)
    BONES["foot." + S] = ("ankle." + s, "toe." + s, "shin." + S)
    BONES["upper_arm." + S] = ("shoulder." + s, "elbow." + s, "spine")
    BONES["forearm." + S] = ("elbow." + s, "wrist." + s, "upper_arm." + S)
    BONES["hand." + S] = ("wrist." + s, "mcp." + s, "forearm." + S)
    BONES["fingers." + S] = ("mcp." + s, "fingertip." + s, "hand." + S)  # fingers 2-5 as one flap, so a hand can close on a bar

# ---------- 2. pick and merge meshes ----------

used = set()
targets = {}
for mid, bases in TARGETS.items():
    names = []
    for b in bases:
        names += side_names(b)
    if not names:
        print("WARNING: no source for", mid, bases)
        continue
    used.update(names)
    targets[mid] = names
    print("%-24s <- %s" % (mid, names))

context_names = [
    o["name"]
    for o in inv["objects"]
    if real_mesh(o) and in_collection(o, "4: Muscular system") and o["name"] not in used and not CONTEXT_EXCLUDE.search(o["name"])
]
skeleton_names = [o["name"] for o in inv["objects"] if real_mesh(o) and in_collection(o, "1: Skeletal system")]
print("context muscles: %d meshes | skeleton: %d meshes" % (len(context_names), len(skeleton_names)))

# Merge now, weight (section 5) before decimating: the Decimate modifier carries
# vertex groups through, and per-source-object weighting needs the original spans.
built = []
pending = []  # (obj, ranges, budget, rigid)
# Each muscle becomes TWO meshes, "<id>_L" and "<id>_R" (underscores survive
# three's node-name sanitiser; dots do not), so a page can colour the two
# sides differently: a side plank works one side, a lunge one leg at a time.
# A source with no side suffix goes to both halves' budget-neutral "_L".
for mid, names in targets.items():
    sides = {"L": [n for n in names if n.endswith(".l")], "R": [n for n in names if n.endswith(".r")]}
    unsided = [n for n in names if not (n.endswith(".l") or n.endswith(".r"))]
    sides["L"] += unsided
    for side, side_names_ in sides.items():
        if not side_names_:
            continue
        obj, ranges = merge("%s_%s" % (mid, side), [O[n] for n in side_names_])
        pending.append((obj, ranges, BUDGET_TARGET // 2, False))
        built.append(obj)
ctx, ctx_ranges = merge("context-muscles", [O[n] for n in context_names])
skel, skel_ranges = merge("skeleton", [O[n] for n in skeleton_names])
pending += [(ctx, ctx_ranges, BUDGET_CONTEXT, False), (skel, skel_ranges, BUDGET_SKELETON, True)]
pending_names = {skel.name: skeleton_names}
built += [ctx, skel]

# Everything from the atlas goes; only our meshes remain. Frees memory too.
keep = {o.name for o in built}
for o in list(O):
    if o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
for me in list(bpy.data.meshes):
    if me.users == 0:
        bpy.data.meshes.remove(me)
print("scene reduced to %d objects" % len(O))

# ---------- 3. materials (viewport colours for the PNG checks; the app overrides) ----------


def material(name, rgba):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = 0.65
    return m


m_target = material("muscle-target", (0.72, 0.18, 0.10, 1))
m_context = material("muscle-resting", (0.90, 0.87, 0.83, 1))
m_bone = material("bone", (0.78, 0.75, 0.70, 1))
for o in built:
    o.data.materials.append(m_target if o.name not in ("context-muscles", "skeleton") else (m_bone if o.name == "skeleton" else m_context))

# ---------- 4. armature ----------

arm_data = bpy.data.armatures.new("Armature")
arm = bpy.data.objects.new("Armature", arm_data)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
eb = {}
for name, (h, t, parent) in BONES.items():
    b = arm_data.edit_bones.new(name)
    b.head = joints[h]
    b.tail = joints[t]
    eb[name] = b
for name, (h, t, parent) in BONES.items():
    if parent:
        eb[name].parent = eb[parent]
        eb[name].use_connect = False
bpy.ops.object.mode_set(mode="OBJECT")
print("armature: %d bones" % len(arm_data.bones))

# ---------- 5. weights by distance to bone segments ----------

seg_names = list(BONES)
heads = np.array([np.array(joints[BONES[n][0]]) for n in seg_names])
tails = np.array([np.array(joints[BONES[n][1]]) for n in seg_names])
radii = np.array([ENVELOPE[n.split(".")[0]] for n in seg_names])
HIP_Z = joints["hip.l"].z
KNEE_Z = joints["knee.l"].z
ANKLE_Z = joints["ankle.l"].z
SHOULDER_Z = joints["shoulder.l"].z
T1_Z = joints["t1"].z
C1_Z = joints["c1"].z
FAR = 1e3


def seg_dist(P):
    """P: (n,3) -> (n, nbones) distance to each bone segment."""
    d = np.empty((len(P), len(seg_names)))
    for i in range(len(seg_names)):
        a, b = heads[i], tails[i]
        ab = b - a
        t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
        d[:, i] = np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
    return d


def ramp(v, k=2.5):
    """Soft exclusion: 0 on the allowed side of a line, growing k metres per metre past it.
    A hard cut-off here put a visible fold across the gluteus maximus, where a
    vertex went from a 50/50 blend to 100% pelvis in a single step."""
    return np.maximum(v, 0) * k


def eff_dist(P):
    """Envelope distance (segment distance minus the bone radius, floored at 0),
    plus soft region penalties that keep limbs from claiming the trunk and vice versa."""
    d = np.maximum(seg_dist(P) - radii[None, :], 0)
    x = np.abs(P[:, 0])
    z = P[:, 2]
    for i, n in enumerate(seg_names):
        base = n.split(".")[0]
        if base in ("upper_arm", "forearm", "hand", "fingers"):
            d[:, i] += ramp(0.15 - x)  # inside the torso: chest, lats, abdomen belong to the trunk
            if base == "upper_arm":
                d[:, i] += ramp(z - (SHOULDER_Z + 0.02))  # top of the shoulder is trapezius territory
        elif base in ("thigh", "shin", "foot"):
            d[:, i] += ramp(x - 0.19)  # hanging hands sit beside the thighs; they are not thigh
            if base == "thigh":
                d[:, i] += ramp(z - HIP_Z)  # fades out above the hip joint line
        elif base == "pelvis":
            d[:, i] += ramp((HIP_Z - 0.03) - z)  # fades out below the hip joint line
        elif base == "spine":
            d[:, i] += ramp(x - 0.22)
            # Above T1 the neck muscles belong to the neck bone: the trunk's wide envelope
            # had claimed them, and the cervical column swung out of a trapezius that
            # stayed behind (owner, 2026-09-12, cycling and warrior III).
            d[:, i] += ramp(z - (T1_Z + 0.01))
        elif base == "neck":
            d[:, i] += ramp(x - 0.22)
            d[:, i] += ramp((T1_Z - 0.04) - z)  # and the neck does not reach down into the back
        else:  # head
            d[:, i] += ramp(x - 0.22)
            d[:, i] += ramp((C1_Z - 0.02) - z)  # the skull's bone stops at the atlas; below it is neck
    return d


# Skeleton parts pinned to a bone by name, where the envelope rule would choose
# wrong. The patella is equidistant from femur and tibia and fell to the femur;
# at deep flexion that put it on top of the knee instead of in front of the
# condyles, where following the tibia leaves it. The finger phalanges follow the
# fingers bone so a hand can close; the thumb stays with the hand.
RIGID_OVERRIDE = [
    # Everything of the skull, the jaw and the hyoid rides on the head bone; the
    # cervical vertebrae below the atlas and their discs on the neck bone.
    (re.compile(r"cranium|skull|occipital|parietal|temporal bone|frontal bone|sphenoid|ethmoid|zygomatic|maxilla|nasal bone|palatine bone|lacrimal bone|vomer|mandib|hyoid|tooth|teeth|incisor|canine|molar|^atlas|arch of atlas|facet of atlas|tubercle of atlas", re.I), "head"),
    (re.compile(r"^(vertebra c[2-7]|axis \(c2\)|dens axis|intervertebral disc c)", re.I), "neck"),
    (re.compile(r"^patella", re.I), "shin"),
    (re.compile(r"phalanx of (second|third|fourth|fifth) finger of hand", re.I), "fingers"),
    (re.compile(r"phalanx of first finger of hand", re.I), "hand"),
]


def assign_weights(obj, ranges, rigid, names=None):
    P = world_verts(obj)
    n = len(P)
    if rigid:
        # One bone per source object, chosen by its centroid: a rib or a hip bone never tears.
        order = np.zeros((n, 2), dtype=int)
        for k, (start, count) in enumerate(ranges):
            c = P[start : start + count].mean(axis=0, keepdims=True)
            bone = int(np.argmin(eff_dist(c)[0]))
            name = names[k] if names else ""
            for rx, seg in RIGID_OVERRIDE:
                if rx.search(name):
                    side = "L" if name.endswith(".l") else "R" if name.endswith(".r") else None
                    if seg in seg_names:  # an unsided bone: pelvis, spine, neck, head
                        bone = seg_names.index(seg)
                    elif side:
                        bone = seg_names.index("%s.%s" % (seg, side))
                    break
            order[start : start + count, 0] = bone
        w1 = np.ones(n)
    else:
        d = eff_dist(P)
        order = np.argsort(d, axis=1)[:, :2]
        d1 = d[np.arange(n), order[:, 0]]
        d2 = d[np.arange(n), order[:, 1]]
        # Blend width per joint. Wide at the hip, where a narrow blend put a fold
        # across the glutes; narrow at the knee and ankle, where a wide one let
        # linear-blend skinning thin the two-joint calf and quad muscles enough
        # for the condyles and fibula head to poke through at deep flexion.
        z = P[:, 2]
        bw = np.full(n, BLEND_WIDTH * 0.75)
        bw[np.abs(z - KNEE_Z) < 0.12] = BLEND_WIDTH * 0.5
        bw[np.abs(z - ANKLE_Z) < 0.10] = BLEND_WIDTH * 0.5
        bw[np.abs(z - HIP_Z) < 0.15] = BLEND_WIDTH
        s = np.clip((d2 - d1) / bw, 0, 1)  # 0 at equal distance, 1 beyond the blend width
        w1 = 0.5 + 0.5 * (s * s * (3 - 2 * s))  # smoothstep: no kink where the blend starts or ends
    w2 = 1 - w1
    groups = {n: obj.vertex_groups.new(name=n) for n in seg_names}
    # Batch by (bone, quantised weight) so we make hundreds of calls, not hundreds of thousands.
    q1 = np.round(w1 * 100).astype(int)
    q2 = np.round(w2 * 100).astype(int)
    for bi, name in enumerate(seg_names):
        for q, arr in ((q1, order[:, 0]), (q2, order[:, 1])):
            sel = np.where(arr == bi)[0]
            if not len(sel):
                continue
            for qv in np.unique(q[sel]):
                if qv == 0:
                    continue
                idx = sel[q[sel] == qv]
                groups[name].add(idx.tolist(), float(qv) / 100, "REPLACE")
    obj.parent = arm
    mod = obj.modifiers.new("Armature", "ARMATURE")
    mod.object = arm


def smooth_weights(obj, repeat=8, factor=0.5):
    """Blender's own weight-map smoothing: the standard fix for a crease at a joint,
    and unlike Corrective Smooth it bakes into the exported weights."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        # The operator polls for weight-paint (or edit) mode; object mode is "context is incorrect".
        bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
        bpy.ops.object.vertex_group_smooth(group_select_mode="ALL", factor=factor, repeat=repeat, expand=0.0)
        bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)
        return True
    except RuntimeError as e:
        print("  weight smoothing skipped:", e)
        return False
    finally:
        if obj.mode != "OBJECT":
            bpy.ops.object.mode_set(mode="OBJECT")
        obj.select_set(False)


for obj, ranges, budget, rigid in pending:
    n0 = len(obj.data.vertices)
    assign_weights(obj, ranges, rigid, pending_names.get(obj.name))
    n1 = decimate(obj, budget)
    smoothed = False if rigid else smooth_weights(obj)
    print("  %-24s %7d -> %6d verts, weighted%s" % (obj.name, n0, n1, " (rigid per bone)" if rigid else (", smoothed" if smoothed else "")))

# ---------- 6. export GLB (rest pose) ----------

for o in bpy.data.objects:
    o.select_set(o in built or o == arm)
glb = os.path.join(OUT, "figure.glb")
kwargs = dict(filepath=glb, export_format="GLB", use_selection=True, export_apply=True, export_animations=False, export_skins=True, export_yup=True)
try:
    bpy.ops.export_scene.gltf(**kwargs)
except TypeError as e:
    print("export arg not accepted, retrying minimal:", e)
    bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=True)
print("exported", glb, os.path.getsize(glb) // 1024, "KB")

# ---------- 7. PNG checks: rest front, rest side, squat-bottom side ----------

json.dump({k: list(v) for k, v in joints.items()}, open(os.path.join(OUT, "joints.json"), "w"), indent=1)
if "norender" in argv:
    print("=== done (renders skipped) ===")
    sys.exit(0)

scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.show_object_outline = True
scene.render.resolution_x = 800
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
if scene.world is None:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.93, 0.92, 0.90)
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 60
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam


def render(name, location, rotation):
    cam.location = location
    cam.rotation_euler = rotation
    scene.render.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    print("rendered", name)


render("check-rest-front.png", (0, -5.2, 0.95), (math.radians(90), 0, 0))
render("check-rest-side.png", (5.2, 0, 0.95), (math.radians(90), 0, math.radians(90)))

# Pose the armature at the bottom of the squat with the app's angles, in pose space.
DEG = math.pi / 180
ankle, knee, hip, shoulder = 28 * DEG, 112 * DEG, 118 * DEG, 60 * DEG
trunk = ankle - knee + hip
pb = arm.pose.bones


def rot_about(pivot, angle):
    return Matrix.Translation(pivot) @ Matrix.Rotation(angle, 4, "X") @ Matrix.Translation(-pivot)


def rotate_bone(name, angle):
    b = pb[name]
    b.matrix = rot_about(b.matrix.translation.copy(), angle) @ b.matrix
    bpy.context.view_layer.update()


# Feet planted: the pelvis moves where the leg chain puts it.
ank = joints["ankle.l"]
kne = joints["knee.l"]
hp = joints["hip.l"]
Rs = Matrix.Rotation(ankle, 3, "X")
Rt = Matrix.Rotation(ankle - knee, 3, "X")
Rp = Matrix.Rotation(trunk, 3, "X")
hip_new = ank + Rs @ (kne - ank) + Rt @ (hp - kne)
pelvis_new = hip_new - Rp @ (hp - joints["pelvis"])
b = pb["pelvis"]
b.matrix = Matrix.Translation(pelvis_new - joints["pelvis"]) @ rot_about(joints["pelvis"], trunk) @ b.matrix
bpy.context.view_layer.update()
for S in ("L", "R"):
    rotate_bone("thigh." + S, -hip)
    rotate_bone("shin." + S, knee)
    rotate_bone("foot." + S, -ankle)
    rotate_bone("upper_arm." + S, -shoulder)
rotate_bone("neck", -trunk * 0.8)
render("check-squat-side.png", (5.2, 0, 0.8), (math.radians(90), 0, math.radians(90)))
render("check-squat-front.png", (0, -5.2, 0.8), (math.radians(90), 0, 0))

json.dump({k: list(v) for k, v in joints.items()}, open(os.path.join(OUT, "joints.json"), "w"), indent=1)
print("=== done ===")
