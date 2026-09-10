"""Option B trial: rebind the écorché to a Mixamo skeleton so Mixamo clips play natively.

    blender --background --python build_mixamo_rig.py -- out "../mocap/in/Air Squat.fbx" [norender]

Steps:
1. import out/figure.glb (our rig, anatomical rest) and pose it into an exact
   palms-down T-pose through its own weights, then bake that pose into every mesh;
2. import the Mixamo FBX and build a new armature with Mixamo's bone names,
   hierarchy and REST ORIENTATIONS, placed at OUR joints (proportions differ,
   rotations do not), so a Mixamo clip's local rotations apply unchanged;
3. remap the vertex groups (our 18 bones -> Mixamo names; the single spine
   split over Spine/Spine1/Spine2 by height; fingers -> the middle finger);
4. copy the clip's rotations bone-for-bone and the hips' translation scaled
   by leg length, keyed on the new armature;
5. export out/figure-mixamo.glb with the animation, and render the deepest
   frame front and side for a look.

The raw FBX never leaves tools/mocap/in; the GLB embeds the derived motion,
which is what Mixamo's terms allow.
"""

import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
OUT = os.path.abspath(argv[0])
FBX = os.path.abspath(argv[1])
NORENDER = "norender" in argv

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def armature_with(bone):
    return next(o for o in bpy.data.objects if o.type == "ARMATURE" and bone in o.data.bones)


def ensure_object_mode():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


# ---------- 1. our figure, T-posed and baked ----------
bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, "figure.glb"))
ours = armature_with("pelvis")
meshes = [o for o in bpy.data.objects if o.type == "MESH" and any(m.type == "ARMATURE" and m.object == ours for m in o.modifiers)]
print("figure: %d meshes, bones %s" % (len(meshes), [b.name for b in ours.data.bones]))


def world_q(pb):
    return (ours.matrix_world @ pb.matrix).to_3x3().to_quaternion()


def set_world_rotation(pb, q_world):
    """World-frame rotation q_world applied on top of the bone's rest, like the app's setWorldAbsolute."""
    rest = (ours.matrix_world @ pb.bone.matrix_local).to_3x3().to_quaternion()
    desired = q_world @ rest
    local_rest = pb.bone.matrix_local.to_3x3().to_quaternion()
    if pb.parent:
        local_rest = pb.parent.bone.matrix_local.to_3x3().to_quaternion().inverted() @ local_rest
        parent_now = world_q(pb.parent)
    else:
        parent_now = ours.matrix_world.to_3x3().to_quaternion()
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = local_rest.inverted() @ (parent_now.inverted() @ desired)
    bpy.context.view_layer.update()


def head_w(pb):
    return ours.matrix_world @ pb.head


def tail_w(pb):
    return ours.matrix_world @ pb.tail


# Blender Z-up after the glTF import: forward is -Y. Rest palms face forward (-Y); Mixamo's T-pose palms face down (-Z).
TWIST = Quaternion((1, 0, 0), math.radians(90))  # about world X: -Y -> -Z, for both arms
for side, sign in (("L", 1), ("R", -1)):
    target = Vector((sign, 0, 0))
    for bone, twist in (("upper_arm", False), ("forearm", True), ("hand", True), ("fingers", True)):
        name = "%s.%s" % (bone, side)
        if name not in ours.pose.bones:
            continue
        pb = ours.pose.bones[name]
        # From the REST direction: set_world_rotation composes on top of the rest orientation, not the current one.
        d = ((ours.matrix_world @ pb.bone.tail_local) - (ours.matrix_world @ pb.bone.head_local)).normalized()
        q = d.rotation_difference(target)  # shortest arc: the arm swings up about the forward axis, palm stays forward
        set_world_rotation(pb, (TWIST @ q) if twist else q)
for side in ("L", "R"):
    pb = ours.pose.bones["hand." + side]
    print("T-pose %s: shoulder %s elbow %s wrist %s" % (side, [round(v, 3) for v in head_w(ours.pose.bones["upper_arm." + side])], [round(v, 3) for v in head_w(ours.pose.bones["forearm." + side])], [round(v, 3) for v in head_w(pb)]))

# Joint positions in the T-pose, world, before the modifiers are baked (the armature keeps this pose).
J = {}
J["pelvis"], J["l5"] = head_w(ours.pose.bones["pelvis"]), tail_w(ours.pose.bones["pelvis"])
J["t1"], J["c7"], J["skull"] = tail_w(ours.pose.bones["spine"]), tail_w(ours.pose.bones["neck"]), tail_w(ours.pose.bones["head"])
for side, s in (("L", "l"), ("R", "r")):
    J["hip." + s], J["knee." + s], J["ankle." + s], J["toe." + s] = head_w(ours.pose.bones["thigh." + side]), head_w(ours.pose.bones["shin." + side]), head_w(ours.pose.bones["foot." + side]), tail_w(ours.pose.bones["foot." + side])
    J["shoulder." + s], J["elbow." + s], J["wrist." + s] = head_w(ours.pose.bones["upper_arm." + side]), head_w(ours.pose.bones["forearm." + side]), head_w(ours.pose.bones["hand." + side])
    J["mcp." + s] = tail_w(ours.pose.bones["hand." + side])
    J["fingertip." + s] = tail_w(ours.pose.bones["fingers." + side]) if "fingers." + side in ours.pose.bones else J["mcp." + s] + Vector((0.08 if s == "l" else -0.08, 0, 0))

ensure_object_mode()
for o in meshes:
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    for m in [m for m in o.modifiers if m.type == "ARMATURE"]:
        bpy.ops.object.modifier_apply(modifier=m.name)
    o.parent = None
    o.matrix_world = Matrix.Identity(4) @ o.matrix_world  # keep world placement
print("T-pose baked into %d meshes" % len(meshes))

# ---------- 2. Mixamo armature at our joints ----------
bpy.ops.import_scene.fbx(filepath=FBX, use_anim=True, automatic_bone_orientation=False)
mx = armature_with("mixamorig:Hips")
mx_frames = None
if mx.animation_data and mx.animation_data.action:
    f0, f1 = mx.animation_data.action.frame_range
    mx_frames = list(range(int(f0), int(math.ceil(f1)) + 1))
print("mixamo: %d bones, %d frames" % (len(mx.data.bones), len(mx_frames or [])))


def mx_rest(b):
    return (mx.matrix_world @ b.matrix_local).to_3x3().normalized()


def mx_head(b):
    return mx.matrix_world @ b.head_local


# Explicit placements; every other Mixamo bone sits at its parent's placement plus Mixamo's own offset, scaled per segment.
PLACE = {
    "mixamorig:Hips": J["pelvis"],
    "mixamorig:Spine": J["l5"],
    "mixamorig:Spine1": J["l5"] + (J["t1"] - J["l5"]) / 3,
    "mixamorig:Spine2": J["l5"] + (J["t1"] - J["l5"]) * 2 / 3,
    "mixamorig:Neck": J["t1"],
    "mixamorig:Head": J["c7"],
    "mixamorig:HeadTop_End": J["skull"],
}
for S, s in (("Left", "l"), ("Right", "r")):
    PLACE.update(
        {
            "mixamorig:%sShoulder" % S: J["t1"] + (J["shoulder." + s] - J["t1"]) * 0.35,
            "mixamorig:%sArm" % S: J["shoulder." + s],
            "mixamorig:%sForeArm" % S: J["elbow." + s],
            "mixamorig:%sHand" % S: J["wrist." + s],
            "mixamorig:%sHandMiddle1" % S: J["mcp." + s],
            "mixamorig:%sUpLeg" % S: J["hip." + s],
            "mixamorig:%sLeg" % S: J["knee." + s],
            "mixamorig:%sFoot" % S: J["ankle." + s],
            "mixamorig:%sToeBase" % S: J["toe." + s],
        }
    )
hand_scale = {s: (J["fingertip." + s] - J["wrist." + s]).length / (mx_head(mx.data.bones["mixamorig:%sHandMiddle3" % S]) - mx_head(mx.data.bones["mixamorig:%sHand" % S])).length for S, s in (("Left", "l"), ("Right", "r"))}
leg_scale = (J["hip.l"] - J["ankle.l"]).length / (mx_head(mx.data.bones["mixamorig:LeftUpLeg"]) - mx_head(mx.data.bones["mixamorig:LeftFoot"])).length
print("scales: hand l %.2f r %.2f, leg %.3f" % (hand_scale["l"], hand_scale["r"], leg_scale))

new_data = bpy.data.armatures.new("MixamoArmature")
new = bpy.data.objects.new("Armature", new_data)
scene.collection.objects.link(new)
bpy.ops.object.select_all(action="DESELECT")
new.select_set(True)
bpy.context.view_layer.objects.active = new
bpy.ops.object.mode_set(mode="EDIT")
placed = {}
order = [b for b in mx.data.bones]  # parents come before children in Blender's bone order
for b in order:
    if b.name in PLACE:
        pos = PLACE[b.name]
    else:
        parent = b.parent
        sc = hand_scale["l"] if "Left" in b.name else hand_scale["r"] if "Right" in b.name else leg_scale
        pos = placed[parent.name] + (mx_head(b) - mx_head(parent)) * sc
    placed[b.name] = pos
    R = mx_rest(b)
    # Length: to the first explicitly placed child if any, else Mixamo's own length scaled.
    child = next((c for c in b.children if c.name in PLACE), None)
    L = (PLACE[child.name] - pos).length if child else max(b.length * (mx.matrix_world.to_scale().x) * leg_scale, 0.02)
    eb = new_data.edit_bones.new(b.name)
    eb.head = pos
    eb.tail = pos + R @ Vector((0, L, 0))
    eb.matrix = Matrix.Translation(pos) @ R.to_4x4()  # sets the roll so local axes equal Mixamo's
    eb.length = L
for b in order:
    if b.parent:
        new_data.edit_bones[b.name].parent = new_data.edit_bones[b.parent.name]
        new_data.edit_bones[b.name].use_connect = False
bpy.ops.object.mode_set(mode="OBJECT")
# Verify the orientations really match.
worst = 0
for b in new.data.bones:
    d = (b.matrix_local.to_3x3() @ mx_rest(mx.data.bones[b.name]).inverted()).to_quaternion().angle
    worst = max(worst, d)
print("armature: %d bones, largest rest-orientation mismatch %.3f deg" % (len(new.data.bones), math.degrees(worst)))

# ---------- 3. weights ----------
RENAME = {"pelvis": "mixamorig:Hips", "neck": "mixamorig:Neck", "head": "mixamorig:Head"}
for side, S in (("L", "Left"), ("R", "Right")):
    RENAME.update({"thigh." + side: "mixamorig:%sUpLeg" % S, "shin." + side: "mixamorig:%sLeg" % S, "foot." + side: "mixamorig:%sFoot" % S, "upper_arm." + side: "mixamorig:%sArm" % S, "forearm." + side: "mixamorig:%sForeArm" % S, "hand." + side: "mixamorig:%sHand" % S, "fingers." + side: "mixamorig:%sHandMiddle1" % S})
z_l5, z_t1 = J["l5"].z, J["t1"].z


def split_spine(obj):
    vg = obj.vertex_groups.get("spine")
    if vg is None:
        return
    gi = vg.index
    n = len(obj.data.vertices)
    w = np.zeros(n)
    for v in obj.data.vertices:
        for g in v.groups:
            if g.group == gi:
                w[v.index] = g.weight
    idx = np.where(w > 0)[0]
    if not len(idx):
        obj.vertex_groups.remove(vg)
        return
    co = np.array([obj.data.vertices[i].co for i in idx])
    zw = (obj.matrix_world @ Matrix.Identity(4)).to_3x3()
    z = np.array([(obj.matrix_world @ obj.data.vertices[i].co).z for i in idx])
    u = np.clip((z - z_l5) / (z_t1 - z_l5), 0, 1)
    # Piecewise-linear split with bone centres at 1/6, 1/2, 5/6 of the trunk.
    a = np.clip((u - 1 / 6) / (1 / 3), 0, 1)  # Spine -> Spine1
    b = np.clip((u - 1 / 2) / (1 / 3), 0, 1)  # Spine1 -> Spine2
    parts = {"mixamorig:Spine": (1 - a), "mixamorig:Spine1": a * (1 - b), "mixamorig:Spine2": b}
    obj.vertex_groups.remove(vg)
    for name, frac in parts.items():
        g = obj.vertex_groups.new(name=name)
        ww = np.round(w[idx] * frac * 100).astype(int)
        for qv in np.unique(ww):
            if qv == 0:
                continue
            sel = idx[ww == qv]
            g.add(sel.tolist(), float(qv) / 100, "REPLACE")


for o in meshes:
    split_spine(o)
    for vg in o.vertex_groups:
        if vg.name in RENAME:
            vg.name = RENAME[vg.name]
    o.parent = new
    mod = o.modifiers.new("Armature", "ARMATURE")
    mod.object = new
print("weights remapped")

# ---------- 4. the clip, bone for bone ----------
for pb in new.pose.bones:
    pb.rotation_mode = "QUATERNION"
for pb in mx.pose.bones:
    pb.rotation_mode = "QUATERNION"
new.animation_data_create()
act = bpy.data.actions.new("Air Squat")
new.animation_data.action = act
try:
    # Blender 4.4+ slotted actions: bind the armature to a slot so the keys land.
    if hasattr(act, "slots"):
        slot = act.slots.new("OBJECT", new.name)
        new.animation_data.action_slot = slot
except Exception as e:
    print("slot binding skipped:", e)
mx_scale = mx.matrix_world.to_scale().x
hip_scale = leg_scale * mx_scale
lowest, lowest_f = 1e9, mx_frames[0]
for f in mx_frames:
    scene.frame_set(f)
    for pb in new.pose.bones:
        src = mx.pose.bones[pb.name]
        pb.rotation_quaternion = src.rotation_quaternion.copy()
        pb.keyframe_insert("rotation_quaternion", frame=f)
        if pb.name == "mixamorig:Hips":
            pb.location = src.location * hip_scale
            pb.keyframe_insert("location", frame=f)
    hz = (new.matrix_world @ new.pose.bones["mixamorig:Hips"].head).z
    if hz < lowest:
        lowest, lowest_f = hz, f
scene.frame_start, scene.frame_end = mx_frames[0], mx_frames[-1]
print("clip copied: frames %d-%d, deepest at %d (hips %.3f m)" % (mx_frames[0], mx_frames[-1], lowest_f, lowest))

# ---------- 5. export ----------
mx_action = mx.animation_data.action if mx.animation_data else None
bpy.data.objects.remove(mx, do_unlink=True)
bpy.data.objects.remove(ours, do_unlink=True)
if mx_action is not None:
    bpy.data.actions.remove(mx_action)  # or the exporter ships the FBX's own clip as a second animation
new.name = "Armature"  # the app treats "Armature" (and "Scene") as non-owner nodes when it names a mesh's muscle
for o in bpy.data.objects:
    o.select_set(o in meshes or o == new)
glb = os.path.join(OUT, "figure-mixamo.glb")
scene.frame_set(mx_frames[0])
kwargs = dict(filepath=glb, export_format="GLB", use_selection=True, export_apply=False, export_animations=True, export_skins=True, export_yup=True, export_rest_position_armature=True)
try:
    bpy.ops.export_scene.gltf(**kwargs)
except TypeError as e:
    print("export arg not accepted, retrying without the rest-position flag:", e)
    kwargs.pop("export_rest_position_armature")
    bpy.ops.export_scene.gltf(**kwargs)
print("exported", glb, os.path.getsize(glb) // 1024, "KB")

if NORENDER:
    sys.exit(0)
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.show_object_outline = True
scene.render.resolution_x, scene.render.resolution_y = 900, 1100
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type = "ORTHO"
cam.data.ortho_scale = 2.1
scene.collection.objects.link(cam)
scene.camera = cam
for frame, tag in ((mx_frames[0], "start"), (lowest_f, "deep")):
    scene.frame_set(frame)
    for name, pos, rot in (("front", (0, -6, 0.95), (90, 0, 0)), ("side", (6, 0, 0.95), (90, 0, 90))):
        cam.location = pos
        cam.rotation_euler = tuple(math.radians(a) for a in rot)
        scene.render.filepath = os.path.join(OUT, "check-mixamo-%s-%s.png" % (tag, name))
        bpy.ops.render.render(write_still=True)
        print("wrote", scene.render.filepath)
