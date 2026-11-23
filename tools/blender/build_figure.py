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
    # Named 2026-11-22 (owner: "do we have tensor fasciae latae?"): until then CONTEXT_EXCLUDE's "fascia" caught its
    # name, and the front of the hip had no muscle at all.
    "tensor-fasciae-latae": ["Tensor fasciae latae"],
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
BUDGET_LIGAMENTS = 45000
BUDGET_TENDONS = 30000  # the separate tendons, aponeuroses, retinacula and tendon sheaths (section 2c)  # the joints' ligaments, capsules, labra, menisci and discs (section 2b), shared by size
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


# The tendons that the atlas models apart from their muscles go out the same way, "tendon-<id>" or
# "tendon-<id>_L/_R" (owner, 2026-11-22: "now add tendons"), with ids matching src/lib/tendons.ts: the calcaneal
# tendon and the iliotibial tract (until now drawn as resting muscle), the aponeuroses, retinacula and tendon
# sheaths (until now left out with the fasciae). Most tendons are part of their muscle's mesh in this atlas (the
# quadriceps and patellar tendons, the biceps' and the hamstrings'), and go on being drawn with it. The fasciae
# and the scalp's aponeurosis stay out: they wrap whole muscles, or the skull, and would cover them.
TENDON_GROUPS = [
    ("achilles", True, r"^calcaneal tendon$"),
    ("it-band", True, r"^iliotibial tract$"),
    ("thoracolumbar-fascia", True, r"^(anterior|middle|posterior) layer of thoracolumbar fascia$"),
    ("linea-alba", False, r"^linea alba$"),
    ("inguinal-ligament", True, r"^inguinal ligament$"),
    ("plantar-fascia", True, r"^(plantar aponeurosis|superficial transverse metatarsal ligament)$"),
    ("palmar-aponeurosis", True, r"^(palmar aponeurosis|superficial transverse metacarpal ligament)$"),
    ("wrist-retinacula", True, r"^(flexor|extensor) retinaculum of wrist$"),
    ("ankle-retinacula", True, r"^((superior|inferior) extensor retinaculum of ankle|flexor retinaculum of ankle|(superior|inferior) fibular retinaculum)$"),
    ("patellar-retinacula", True, r"^(lateral|medial) patellar retinaculum$"),
    ("toe-extensor-tendons", True, r"^tendon of extensor digitorum longus$"),
    ("hand-tendon-sheaths", True, r"^(common flexor tendon sheath|tendon sheath - abd\. pollicis longus - ext\. pollicis brevis|tendon sheath of (extensor carpi ulnaris|extensor digiti minimi manus|extensor digitorum and extensor indicis|extensor pollicis longus|extensors carpi radialis|flexor carpi radialis|flexor pollicis longus)|synovial sheaths of digits of hand|cruciform part of fibrous sheath of digit of hand)$"),
    ("foot-tendon-sheaths", True, r"^(common tendon sheath of fibularis muscles|plantar tendon sheath of fibularis longus muscle|tendon sheath of (extensor digitorum longus|extensor hallucis longus|flexor digitorum longus|flexor hallucis longus|tibialis anterior|tibialis posterior muscle))$"),
    ("biceps-tendon-sheath", True, r"^intertubercular tendon sheath$"),
    ("digastric-tendon", True, r"^intermediate tendon of digastric muscle$"),
]
TENDON_GROUPS = [(gid, sided, re.compile(rx, re.I)) for gid, sided, rx in TENDON_GROUPS]
tendon_members = {}
for o in inv["objects"]:
    if not (real_mesh(o) and in_collection(o, "4: Muscular system")) or o["name"] in used:
        continue
    n = o["name"]
    base = re.sub(r"\.[lr]$", "", n)
    side = "L" if n.endswith(".l") else "R" if n.endswith(".r") else None
    for gid, sided, rx in TENDON_GROUPS:
        if rx.search(base):
            key = "tendon-%s_%s" % (gid, side) if sided and side else "tendon-%s" % gid
            tendon_members.setdefault(key, []).append(n)
            break
for names in tendon_members.values():
    used.update(names)  # out of the resting context muscles: the calcaneal tendon and iliotibial tract were in it
print("tendon groups: %d, %d source meshes" % (len(tendon_members), sum(len(v) for v in tendon_members.values())))

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
pending.append((ctx, ctx_ranges, BUDGET_CONTEXT, False))
built.append(ctx)

# The skeleton goes out as named groups, "bone-<id>" or "bone-<id>_L/_R", so
# the atlas page can list and select them (owner, 2026-09-20). The ids match
# src/lib/bones.ts. Anything no group claims stays in an unnamed "skeleton".
BONE_GROUPS = [
    ("skull", False, re.compile(r"^(frontal bone|parietal bone|temporal bone|occipital bone|sphenoid bone|ethmoid bone|.*cells of ethmoid bone|sinus of (frontal|sphenoid) bone|zygomatic bone|maxilla|nasal bone|lacrimal bone|palatine bone|vomer|inferior nasal concha bone|nasal septal cartilage|lateral process of nasal septal cartilage|major alar cartilage|malleus|incus|stapes)$", re.I)),
    ("mandible", False, re.compile(r"^mandible$", re.I)),
    ("teeth", False, re.compile(r"incisor|canine|premolar|molar tooth", re.I)),
    ("hyoid", False, re.compile(r"^hyoid bone$", re.I)),
    ("laryngeal-cartilages", False, re.compile(r"^(thyroid|cricoid|arytenoid|corniculate) cartilage$", re.I)),
    ("cervical-vertebrae", False, re.compile(r"^(atlas \(c1\)|axis \(c2\)|vertebra c[3-7])$", re.I)),
    ("thoracic-vertebrae", False, re.compile(r"^vertebra t\d+$", re.I)),
    ("lumbar-vertebrae", False, re.compile(r"^vertebra l[1-5]$", re.I)),
    ("sacrum", False, re.compile(r"^sacrum$", re.I)),
    ("coccyx", False, re.compile(r"^coccyx$", re.I)),
    ("sternum", False, re.compile(r"^(manubrium of sternum|body of sternum|xiphoid process)$", re.I)),
    ("ribs", True, re.compile(r"^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) rib$", re.I)),
    ("costal-cartilages", True, re.compile(r"^costal cartilage of", re.I)),
    ("clavicle", True, re.compile(r"^clavicle$", re.I)),
    ("scapula", True, re.compile(r"^scapula$", re.I)),
    ("humerus", True, re.compile(r"^humerus$", re.I)),
    ("radius", True, re.compile(r"^radius$", re.I)),
    ("ulna", True, re.compile(r"^ulna$", re.I)),
    ("carpals", True, re.compile(r"^(scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate) bone$", re.I)),
    ("metacarpals", True, re.compile(r"metacarpal bone$", re.I)),
    ("finger-phalanges", True, re.compile(r"phalanx of \w+ finger of hand$", re.I)),
    ("hip-bone", True, re.compile(r"^hip bone$", re.I)),
    ("femur", True, re.compile(r"^femur$", re.I)),
    ("patella", True, re.compile(r"^patella$", re.I)),
    ("tibia", True, re.compile(r"^tibia$", re.I)),
    ("fibula", True, re.compile(r"^fibula$", re.I)),
    ("talus", True, re.compile(r"^talus$", re.I)),
    ("calcaneus", True, re.compile(r"^calcaneus$", re.I)),
    ("midfoot-bones", True, re.compile(r"^(navicular|cuboid|medial cuneiform|intermediate cuneiform|lateral cuneiform) bone$", re.I)),
    ("metatarsals", True, re.compile(r"(metatarsal bone|sesamoid bones of foot)$", re.I)),
    ("toe-phalanges", True, re.compile(r"phalanx of \w+ finger of foot$", re.I)),
]
bone_members = {}
unclaimed = []
for n in skeleton_names:
    base = re.sub(r"\.[lr]$", "", n)
    side = "L" if n.endswith(".l") else "R" if n.endswith(".r") else None
    for gid, sided, rx in BONE_GROUPS:
        if rx.search(base):
            key = "bone-%s_%s" % (gid, side) if sided and side else "bone-%s" % gid
            bone_members.setdefault(key, []).append(n)
            break
    else:
        unclaimed.append(n)
if unclaimed:
    print("skeleton meshes no bone group claims (kept as 'skeleton'):", unclaimed)
    bone_members["skeleton"] = unclaimed
skel_total = sum(by_name[n]["verts"] for n in skeleton_names) or 1
pending_names = {}
for key, names in bone_members.items():
    obj, ranges = merge(key, [O[n] for n in names])
    budget = max(400, int(BUDGET_SKELETON * sum(by_name[n]["verts"] for n in names) / skel_total))
    pending.append((obj, ranges, budget, True))
    pending_names[obj.name] = names
    built.append(obj)
print("bone groups: %d" % len(bone_members))

# The joints go out the same way, "lig-<id>" or "lig-<id>_L/_R" (owner, 2026-11-22: ligaments on the atlas page):
# the ligaments, capsules, labra, menisci and intervertebral discs of the atlas's "3: Joints" collection, grouped
# by joint as an anatomy chart labels them, with ids matching src/lib/ligaments.ts. They cross joints, so they are
# weighted like muscles, blended between the bones on either side, not rigid like bones. Left out: the larynx's
# membranes (not joints of movement), the child's triradiate cartilage, two empty helper objects, and each disc's
# nucleus pulposus (inside its disc, never seen). Anything else no group claims goes out as an unnamed "ligaments".
LIGAMENT_SKIP = re.compile(r"^(cricopharyngeal ligament|quadrangular membrane|(lateral|median) thyrohyoid ligament|median cricothyroid ligament|joints\.g|median atlanto-axial joint\.j|triradiate cartilage|nucleus pulposus .*)$", re.I)
LIGAMENT_GROUPS = [
    # Spine and thorax
    ("discs-cervical", False, r"^intervertebral disc c\d-(c\d|t1)$"),
    ("discs-thoracic", False, r"^intervertebral disc t\d+-(t\d+|l1)$"),
    ("discs-lumbar", False, r"^intervertebral disc l\d-(l\d|s1)$"),
    ("anterior-longitudinal", False, r"^anterior longitudinal ligament$"),
    ("posterior-longitudinal", False, r"^posterior longitudinal ligament$"),
    ("ligamenta-flava", False, r"^ligamenta flava$"),
    ("spinous-ligaments", False, r"^(supraspinous|interspinous) ligaments?$"),
    ("nuchal-ligament", False, r"^nuchal ligament$"),
    ("intertransverse", False, r"^intertransverse ligaments$"),
    ("rib-joints", False, r"^(radiate ligament of head of rib|intra-articular ligament of head of rib|costotransverse ligament)$"),
    ("intercostal-membranes", False, r"^(external|internal) intercostal membrane$"),
    # Jaw
    ("jaw", True, r"^(articular capsule of temporomandibular joint|articular disc of temporomandibular joint|lateral temporomandibular ligament|sphenomandibular ligament|stylomandibular ligament|pterygospinous ligament|stylohyoid ligament)$"),
    # Shoulder girdle and shoulder
    ("sternoclavicular", True, r"^(articular capsule of sternoclavicular joint|articular disc of sternoclavicular joint|(anterior|posterior) sternoclavicular ligament|interclavicular ligament|costoclavicular ligament)$"),
    ("acromioclavicular", True, r"^(articular capsule of acromioclavicular joint|articular disc of acromioclavicular joint|acromioclavicular ligament)$"),
    ("coracoclavicular", True, r"^(conoid|trapezoid) ligament$"),
    ("scapular-ligaments", True, r"^(coraco-acromial ligament|(superior|inferior) transverse scapular ligament)$"),
    ("shoulder-capsule", True, r"^(articular capsule of glenohumeral joint|(superior|middle|inferior) glenohumeral ligament|coracohumeral ligament|transverse humeral ligament)$"),
    ("glenoid-labrum", True, r"^glenoid labrum$"),
    # Elbow and forearm
    ("elbow-capsule", True, r"^articular capsule of elbow joint$"),
    ("elbow-ulnar-collateral", True, r"^ulnar collateral ligament$"),
    ("elbow-radial-collateral", True, r"^(radial collateral ligament|annular ligament of radius|quadrate ligament)$"),
    ("forearm-membrane", True, r"^(interosseous membrane of forearm|oblique cord)$"),
    ("distal-radio-ulnar", True, r"^(articular disc of distal radio-ulnar joint|(dorsal|palmar) radio-ulnar ligament)$"),
    # Wrist and hand
    ("wrist", True, r"^(articular capsule of radiocarpal joint|dorsal radiocarpal ligament|(radial|ulnar) collateral ligament of wrist joint|radioscaphocapitate ligament|radiocapitate ligament|ulnolunate ligament|ulnotriquetral ligament|ulnocapitate ligament|dorsal ulnocarpal ligament|ulnopisiform ligament)$"),
    ("carpal", True, r"^(scapholunate interosseous|lunotriquetral interosseous|palmar lunotriquetral|capitohamate interosseous|palmar capitohamate|trapeziotrapezoidal interosseous|trapezoideocapitate interosseous|palmar trapezoideocapitate|triquetrocapitate|triquetrohamate|scaphocapitate|scaphotrapeziotrapezoidal|(dorsal|palmar) scaphotriquetral|radiate carpal|pisohamate|pisometacarpal|pisotriquetral|dorsal intercarpal) ligaments?$"),
    ("metacarpal", True, r"^((dorsal|palmar) carpometacarpal|(dorsal|palmar|interosseous) metacarpal|deep transverse metacarpal) ligaments?$"),
    ("finger-joints", True, r"^(articular capsules of (metacarpophalangeal|proximal interphalangeal|distal interphalangeal) joints|collateral metacarpophalangeal ligaments|collateral interphalangeal ligaments of hand|palmar interphalangeal ligaments)$"),
    # Pelvis and hip
    ("sacro-iliac", True, r"^((anterior|posterior|interosseous) sacro-iliac|iliolumbar) ligament$"),
    ("sacrotuberous", True, r"^(sacrotuberous|sacrospinous) ligament$"),
    ("pubic-symphysis", False, r"^(pubic symphysis|interpubic disc|(superior|inferior) pubic ligament)$"),
    ("sacrococcygeal", False, r"^(sacrococcygeal symphysis|intercornual ligament)$"),
    ("obturator-membrane", True, r"^obturator membrane$"),
    ("iliofemoral", True, r"^(descending|transverse) part of iliofemoral ligament$"),
    ("hip-capsule", True, r"^(articular capsule of hip joint|zona orbicularis|frenula capsulae|pubofemoral ligament|ischiofemoral ligament)$"),  # the frenula run along the femur's neck
    ("acetabular-labrum", True, r"^(acetabular labrum|transverse acetabular ligament)$"),
    ("ligament-head-femur", True, r"^ligament of head of femur$"),
    # Knee and leg
    ("acl", True, r"^anterior cruciate ligament$"),
    ("pcl", True, r"^posterior cruciate ligament$"),
    ("mcl", True, r"^(superficial|deep) part of tibial collateral ligament$"),
    ("lcl", True, r"^fibular collateral ligament$"),
    ("medial-meniscus", True, r"^(medial meniscus|(anterior|posterior) meniscotibial ligament \(medial meniscus\))$"),
    ("lateral-meniscus", True, r"^(lateral meniscus|(anterior|posterior) meniscotibial ligament \(lateral meniscus\))$"),
    ("knee-capsule", True, r"^(articular capsule of knee joint|(arcuate|oblique) popliteal ligament|popliteofibular ligament|infrapatellar fat pad|meniscopatellar ligament|transverse ligament of knee)$"),
    ("proximal-tibiofibular", True, r"^(articular capsule of superior tibiofibular joint|(anterior|posterior) ligament of fibular head)$"),
    ("leg-membrane", True, r"^interosseous membrane of leg$"),
    ("distal-tibiofibular", True, r"^(anterior|posterior|transverse) tibiofibular ligament$"),
    # Ankle and foot
    ("lateral-ankle", True, r"^((anterior|posterior) talofibular|calcaneofibular) ligament$"),
    ("deltoid-ligament", True, r"^(posterior tibiotalar|tibiocalcaneal|tibionavicular) ligament$"),
    ("subtalar", True, r"^((anterior|lateral|medial|posterior) talocalcaneal|talocalcaneal interosseous) ligament$"),
    ("plantar-ligaments", True, r"^(long plantar ligament|plantar (calcaneocuboid|calcaneonavicular|cuboideonavicular|cuneocuboid|cuneonavicular|intercuneiform|tarsometatarsal|metatarsal) ligaments?)$"),
    ("midfoot-ligaments", True, r"^(talonavicular|calcaneocuboid|calcaneonavicular|dorsal (calcaneocuboid|cuboideonavicular|cuneocuboid|cuneonavicular|intercuneiform|tarsometatarsal|metatarsal)|cuneocuboid interosseous|cuneometatarsal interosseous|intercuneiform interosseous|metatarsal interosseous) ligaments?$"),
    ("toe-joints", True, r"^(articular capsules? of (metatarsophalangeal joints|interphalangeal joint of great toe|proximal interphalangeal joints of foot|distal interphalangeal joints of foot)|collateral (metatarsophalangeal|interphalangeal) ligaments( of foot)?|plantar (metatarsophalangeal|interphalangeal) ligaments|deep transverse metatarsal ligament|intersesamoid ligament)$"),
]
LIGAMENT_GROUPS = [(gid, sided, re.compile(rx, re.I)) for gid, sided, rx in LIGAMENT_GROUPS]
joint_names = [o["name"] for o in inv["objects"] if real_mesh(o) and in_collection(o, "3: Joints") and not LIGAMENT_SKIP.search(re.sub(r"\.[lr]$", "", o["name"]))]
lig_members = {}
lig_unclaimed = []
for n in joint_names:
    base = re.sub(r"\.[lr]$", "", n)
    side = "L" if n.endswith(".l") else "R" if n.endswith(".r") else None
    if side is None and abs(sum(by_name[n]["bbox"][i][0] for i in (0, 1))) > 0.04:
        side = "L" if sum(by_name[n]["bbox"][i][0] for i in (0, 1)) > 0 else "R"  # an unsuffixed piece off the midline (one ulnopisiform ligament)
    for gid, sided, rx in LIGAMENT_GROUPS:
        if rx.search(base):
            key = "lig-%s_%s" % (gid, side) if sided and side else "lig-%s" % gid
            lig_members.setdefault(key, []).append(n)
            break
    else:
        lig_unclaimed.append(n)
if lig_unclaimed:
    print("joint meshes no ligament group claims (kept as 'ligaments'):", lig_unclaimed)
    lig_members["ligaments"] = lig_unclaimed
lig_total = sum(by_name[n]["verts"] for n in joint_names) or 1
for key, names in lig_members.items():
    obj, ranges = merge(key, [O[n] for n in names])
    budget = max(150, int(BUDGET_LIGAMENTS * sum(by_name[n]["verts"] for n in names) / lig_total))
    pending.append((obj, ranges, budget, False))
    built.append(obj)
print("ligament groups: %d, %d source meshes" % (len(lig_members), len(joint_names)))
tendon_total = sum(by_name[n]["verts"] for v in tendon_members.values() for n in v) or 1
for key, names in tendon_members.items():
    obj, ranges = merge(key, [O[n] for n in names])
    budget = max(150, int(BUDGET_TENDONS * sum(by_name[n]["verts"] for n in names) / tendon_total))
    pending.append((obj, ranges, budget, False))
    built.append(obj)

# ---------- 2d. nerves ----------
# The peripheral nerves (owner, 2026-11-23: "let's do it"), "nerve-<id>_L/_R" with ids matching src/lib/nerves.ts,
# and the cutaneous nerves, roots and sympathetic chain as one unnamed "nerves" mesh. In the atlas they are Bezier
# CURVES in "7: Nervous system & Sense organs", not meshes (an inventory of meshes alone found none, 2026-11-22),
# bevelled at 0.5 mm times each point's radius. Here they become tubes: 3 steps per segment and 6 sides, not the
# atlas's 12 and 12 (588k vertices), at twice the atlas radius so a median nerve is ~4 mm across, with point radii
# capped so the sciatic's root (x12) is ~8 mm, not 24. Half the curves are mirrored (scale -1), which turns their
# faces inside out: those are flipped back. The cranial nerves stay out (inside the skull) but the accessory nerve,
# which crosses the neck to the trapezius. Weighted like muscles, blended between the bones either side, and never
# decimated: a collapse decimator breaks a thin tube.
NERVE_BEVEL = 0.001
NERVE_RADIUS_CAP = 4.0
NERVE_RES_U = 3
NERVE_BEVEL_RES = 1
NERVE_GROUPS = [
    ("accessory", r"^accessory nerve \(xi\)$"),
    ("dorsal-scapular", r"^dorsal scapular nerve$"),
    ("long-thoracic", r"^long thoracic nerve$"),
    ("suprascapular", r"^suprascapular nerve$"),
    ("pectoral", r"^(lateral|medial) pectoral nerve$"),
    ("subscapular", r"^(superior|inferior) subscapular nerve$"),
    ("thoracodorsal", r"^thoracodorsal nerve$"),
    ("brachial-plexus", r"^(roots of brachial plexus|(superior|middle|inferior) trunk of brachial plexus|(anterior|posterior) division of (superior|middle|inferior) trunk of brachial plexus|posterior cord of brachial plexus)$"),
    ("axillary", r"^(axillary nerve|muscular branches of axillary nerve|superior lateral brachial cutaneous nerve)$"),
    ("musculocutaneous", r"^(musculocutaneous nerve|lateral antebrachial cutaneous nerve)$"),
    ("radial", r"^(radial nerve|(deep|superficial) branch of radial nerve|muscular branches of radial nerve|posterior interosseous nerve of forearm|dorsal digital branches of radial nerve|posterior antebrachial cutaneous nerve|inferior lateral brachial cutaneous nerve)$"),
    ("median", r"^(median nerve|muscular branches of median nerve|anterior interosseous nerve of forearm|palmar branch of median nerve|(common|proper) palmar digital branches of median nerve|\(communicating branch of median nerve with ulnar nerve\))$"),
    ("ulnar", r"^(ulnar nerve|(deep|superficial|dorsal|palmar) branch of ulnar nerve|muscular branches of ulnar nerve|(common|proper) palmar digital branches of ulnar nerve|dorsal digital branches of ulnar nerve)$"),
    ("thoracoabdominal", r"^intercostal nerves$"),
    ("iliohypogastric", r"^(iliohypogastric nerve|ilio-inguinal nerve)$"),
    ("superior-gluteal", r"^superior gluteal nerve$"),
    ("femoral", r"^(femoral nerve|anterior cutaneous branches of femoral nerve|saphenous nerve|infrapatellar branch of saphenous nerve|medial crural cutaneous branches of saphenous nerve)$"),
    ("obturator", r"^(obturator nerve|(anterior|posterior) branch of obturator nerve)$"),
    ("sciatic", r"^sciatic nerve$"),
    ("tibial", r"^(tibial nerve|(medial|lateral) plantar nerve|(common|proper) plantar digital branches of (medial|lateral) plantar nerve|medial sural cutaneous nerve|sural nerve)$"),
    ("common-fibular", r"^(common fibular nerve|sural communicating branch of common fibular nerve)$"),
    ("deep-fibular", r"^(deep fibular nerve|muscular branches of deep fibular nerve|dorsal digital branches of deep fibular nerve)$"),
    ("superficial-fibular", r"^(superficial fibular nerve|dorsal digital branches of superficial fibular nerve|(intermediate|medial) dorsal cutaneous nerve of foot)$"),
]
NERVE_GROUPS = [(gid, re.compile(rx, re.I)) for gid, rx in NERVE_GROUPS]
NERVE_CONTEXT = re.compile(
    r"^(medial antebrachial cutaneous nerve|(anterior|posterior) branch of medial antebrachial cutaneous nerve|medial brachial cutaneous nerve|lateral femoral cutaneous nerve|posterior femoral cutaneous nerve|(anterior|posterior) root of posterior femoral cutaneous nerve|genitofemoral nerve|(femoral|genital) branch of genitofemoral nerve|pudendal nerve|nerve to (piriformis|quadratus femoris) muscle|subclavian nerve|sympathetic trunk|sympathetic nerves|cauda equina|(anterior|posterior) root of spinal nerve)$",
    re.I,
)
nerve_curves = [o["name"] for o in inv["objects"] if o["type"] == "CURVE" and in_collection(o, "7: Nervous system") and o["name"] in O]
nerve_members = {}
nerve_left_out = []
for n in nerve_curves:
    base = re.sub(r"\.[lr]$", "", n)
    side = "L" if n.endswith(".l") else "R" if n.endswith(".r") else None
    for gid, rx in NERVE_GROUPS:
        if rx.search(base):
            if side is None:  # an unsuffixed curve off the midline (the right foot's common plantar digital branches)
                pts = [O[n].matrix_world @ p.co for sp in O[n].data.splines for p in (sp.bezier_points if sp.type == "BEZIER" else sp.points)]
                x = sum(p.x for p in pts) / max(1, len(pts))
                side = ("L" if x > 0 else "R") if abs(x) > 0.04 else None
            key = "nerve-%s_%s" % (gid, side) if side else "nerve-%s" % gid
            nerve_members.setdefault(key, []).append(n)
            break
    else:
        if NERVE_CONTEXT.search(base):
            nerve_members.setdefault("nerves", []).append(n)
        else:
            nerve_left_out.append(base)
print("nerve curves left out (cranial and others):", sorted(set(nerve_left_out)))


# Every curve is set up first and the scene evaluated once: each evaluation of this atlas prints its dependency
# cycles again (megabytes), and one per group stalled the first build for over an hour on its output pipe.
for names in nerve_members.values():
    for n in names:
        cu = O[n].data
        cu.bevel_mode = "ROUND"
        cu.bevel_depth = NERVE_BEVEL
        cu.bevel_resolution = NERVE_BEVEL_RES
        cu.resolution_u = NERVE_RES_U
        cu.use_fill_caps = True
        for sp in cu.splines:
            for p in sp.bezier_points if sp.type == "BEZIER" else sp.points:
                p.radius = max(0.3, min(p.radius, NERVE_RADIUS_CAP))
nerve_dg = bpy.context.evaluated_depsgraph_get()


def merge_curves(name, sources):
    """merge() for curves: the tube each evaluates to, gathered in world space, right side out."""
    import bmesh

    dg = nerve_dg
    bm = bmesh.new()
    ranges = []
    for src in sources:
        ev = src.evaluated_get(dg)
        me = ev.to_mesh()
        tmp = bmesh.new()
        tmp.from_mesh(me)
        ev.to_mesh_clear()
        bmesh.ops.transform(tmp, matrix=src.matrix_world, verts=tmp.verts)
        if src.matrix_world.determinant() < 0:
            bmesh.ops.reverse_faces(tmp, faces=tmp.faces)
        me2 = bpy.data.meshes.new("tmp")
        tmp.to_mesh(me2)
        tmp.free()
        start = len(bm.verts)
        bm.from_mesh(me2)
        ranges.append((start, len(me2.vertices)))
        bpy.data.meshes.remove(me2)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj, ranges


for key, names in sorted(nerve_members.items()):
    obj, ranges = merge_curves(key, [O[n] for n in names])
    pending.append((obj, ranges, 10**9, False))  # no decimation
    built.append(obj)
    print("  %-30s %3d curves, %6d verts" % (key, len(names), len(obj.data.vertices)))
print("nerve groups: %d, %d curves, %d verts" % (len(nerve_members), sum(len(v) for v in nerve_members.values()), sum(len(O[k].data.vertices) for k in nerve_members)))

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
m_ligament = material("ligament", (0.91, 0.88, 0.83, 1))
m_nerve = material("nerve", (0.93, 0.86, 0.45, 1))
for o in built:
    if o.name.startswith(("lig-", "tendon-")) or o.name == "ligaments":
        o.data.materials.append(m_ligament)
    elif o.name.startswith("nerve-") or o.name == "nerves":
        o.data.materials.append(m_nerve)
    else:
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
