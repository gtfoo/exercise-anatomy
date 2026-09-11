"""Convert one clip onto the Mixamo-rig figure: an animation-only GLB the app plays on figure-mixamo.glb.

    # a Mixamo FBX: rotations copied bone for bone, hips scaled by leg length
    blender --background --python convert_clip.py -- out/mixamo-rig.json out/clips/bodyweight-squat.glb \
        --fbx "../mocap/in/Air Squat.fbx" --name "Air Squat"

    # a MotionClip3D for OUR rig (extract_pose3d.py, or tools/myo/designed_clip.py):
    # world deltas mapped through the rest alignment, the root placed by the anchor
    blender --background --python convert_clip.py -- out/mixamo-rig.json out/clips/freestyle.glb \
        --clip3d ../../src/lib/motion/freestyle-3d.json --anchor free --root-offset 0 0.08 0 --name freestyle
    blender --background --python convert_clip.py -- out/mixamo-rig.json out/clips/pull-up.glb \
        --clip3d ../myo/out/pull-up-3d.json --anchor hands --bar 2.3 --name pull-up
    # --arms rest holds the arms at the sides when the capture's arm motion is not the exercise
    # --head level keeps the gaze forward; --head follow keeps the head in line with the trunk

The GLB holds the armature (no meshes) and one animation whose tracks are
named by bone; three.js binds them onto the figure's bones by name. The
anchor is baked into the hips' translation: planted left foot, left wrist on
the bar, or the clip's own root plus an offset. A hanging clip also curls the
four fingers if the clip carries a `fingers.L/R` rotation.
"""

import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
RIG, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
opt = lambda flag, default: argv[argv.index(flag) + 1] if flag in argv else default
FBX = opt("--fbx", None)
CLIP3D = opt("--clip3d", None)
ANCHOR = opt("--anchor", "feet")
BAR = float(opt("--bar", "2.3"))
NAME = opt("--name", os.path.splitext(os.path.basename(OUT))[0])
ROOT_OFFSET = [float(argv[argv.index("--root-offset") + 1 + i]) for i in range(3)] if "--root-offset" in argv else [0, 0, 0]
# --arms rest: ignore the clip's arm rotations and hold the arms at the figure's
# rest (hanging at the sides). For a capture whose performer did something with
# the arms that is not the exercise (CMU's lunge subject threw punches).
ARMS = opt("--arms", "clip")
# --head level: neck and head stay upright (gaze forward) whatever the trunk does;
# --head follow: neck and head keep their rest relation to the trunk (a swimmer
# looking down the pool). The CMU conversions' head bone maps with a forward
# droop that the Mixamo clips do not have; until that is understood, this.
HEAD = opt("--head", "clip")
# --loop-blend N: append N frames that ease from the last pose back to the
# first, so a clip cut from a longer take does not snap when it repeats (the
# swims: the owner saw missing frames between the end and the start).
LOOP_BLEND = int(opt("--loop-blend", "0"))
if not (FBX or CLIP3D):
    raise SystemExit(__doc__)

rig = json.load(open(RIG))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- the armature, exactly as built ----------
data = bpy.data.armatures.new("MixamoArmature")
arm = bpy.data.objects.new("Armature", data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for name, b in rig["bones"].items():
    eb = data.edit_bones.new(name)
    eb.head, eb.tail, eb.roll = Vector(b["head"]), Vector(b["tail"]), b["roll"]
for name, b in rig["bones"].items():
    if b["parent"]:
        data.edit_bones[name].parent = data.edit_bones[b["parent"]]
        data.edit_bones[name].use_connect = False
bpy.ops.object.mode_set(mode="OBJECT")
for pb in arm.pose.bones:
    pb.rotation_mode = "QUATERNION"
rest_world = {b.name: b.matrix_local.to_3x3().to_quaternion() for b in arm.data.bones}
print("armature: %d bones from %s" % (len(arm.data.bones), os.path.basename(RIG)))

arm.animation_data_create()
act = bpy.data.actions.new(NAME)
arm.animation_data.action = act
if hasattr(act, "slots"):
    arm.animation_data.action_slot = act.slots.new("OBJECT", arm.name)


def world_q(pb):
    return pb.matrix.to_3x3().to_quaternion()


def set_world_orientation(pb, desired):
    """Give a bone the absolute world orientation `desired`; its parent must already be posed."""
    local_rest = pb.bone.matrix_local.to_3x3().to_quaternion()
    if pb.parent:
        local_rest = pb.parent.bone.matrix_local.to_3x3().to_quaternion().inverted() @ local_rest
        parent_now = world_q(pb.parent)
    else:
        parent_now = Quaternion()
    pb.rotation_quaternion = local_rest.inverted() @ (parent_now.inverted() @ desired)


def key_all(frame):
    for pb in arm.pose.bones:
        pb.keyframe_insert("rotation_quaternion", frame=frame)
    arm.pose.bones["mixamorig:Hips"].keyframe_insert("location", frame=frame)


def capture_pose():
    return {pb.name: pb.rotation_quaternion.copy() for pb in arm.pose.bones}, arm.pose.bones["mixamorig:Hips"].location.copy()


def blend_to(first, last, n, frame):
    """Key n frames easing from pose `last` to pose `first`, starting at `frame`; returns the next free frame."""
    for k in range(1, n + 1):
        f = k / (n + 1)
        f = f * f * (3 - 2 * f)
        for pb in arm.pose.bones:
            pb.rotation_quaternion = last[0][pb.name].slerp(first[0][pb.name], f)
        arm.pose.bones["mixamorig:Hips"].location = last[1].lerp(first[1], f)
        key_all(frame)
        frame += 1
    return frame


# ---------- A. Mixamo FBX: bone for bone ----------
if FBX:
    # Several files, comma-separated, play one after another (a climb up then
    # down); --repeat N plays the whole sequence N times. Each following pass
    # starts from the hips position the previous one ended at, so travel
    # continues (two more stairs) instead of snapping back.
    RANGE = opt("--range", None)  # START:END frames of the FIRST file to keep; keyed from 0
    REPEAT = int(opt("--repeat", "1"))
    # --root-motion vertical keeps only the hips' up-and-down and holds them
    # over the origin (a swimmer or runner stays in the camera's view); full
    # copies the clip's travel. Mixamo's Hips bone rests with its local Y up.
    ROOT_MOTION = opt("--root-motion", "full")
    files = [os.path.abspath(p.strip()) for p in FBX.split(",")]
    out_frame = 0
    hips_z = []
    carry = Vector((0.0, 0.0, 0.0))  # where the previous pass left the hips, minus where the next one starts
    for rep in range(REPEAT):
        for fi, path in enumerate(files):
            bpy.ops.import_scene.fbx(filepath=path, use_anim=True, automatic_bone_orientation=False)
            mx = next(o for o in bpy.data.objects if o.type == "ARMATURE" and o != arm)
            f0, f1 = mx.animation_data.action.frame_range
            if RANGE and fi == 0:
                a, b = (int(v) for v in RANGE.split(":"))
                frames = list(range(a, b + 1))
            else:
                frames = list(range(int(f0), int(math.ceil(f1)) + 1))
            for pb in mx.pose.bones:
                pb.rotation_mode = "QUATERNION"
            hip_scale = rig["leg_scale"] * mx.matrix_world.to_scale().x
            first_loc = last_loc = None
            for k, f in enumerate(frames):
                if rep + fi > 0 and k == 0:
                    continue  # the first frame of a following clip repeats the last frame of the previous one
                scene.frame_set(f)
                for pb in arm.pose.bones:
                    src = mx.pose.bones.get(pb.name)
                    if src is None:
                        continue
                    pb.rotation_quaternion = src.rotation_quaternion.copy()
                    if pb.name == "mixamorig:Hips":
                        loc = src.location * hip_scale
                        if first_loc is None:
                            first_loc = loc.copy()
                            if rep + fi > 0:
                                carry = last_end - first_loc
                        loc = loc + carry
                        if ROOT_MOTION == "vertical":
                            loc = Vector((0.0, loc.y, 0.0))
                        pb.location = loc
                        last_loc = loc.copy()
                key_all(out_frame)
                if out_frame == 0:
                    first_pose = capture_pose()
                out_frame += 1
                bpy.context.view_layer.update()
                hips_z.append((arm.pose.bones["mixamorig:Hips"].head).z)
            last_end = last_loc
            mx_action = mx.animation_data.action
            bpy.data.objects.remove(mx, do_unlink=True)
            bpy.data.actions.remove(mx_action)
    if LOOP_BLEND:
        out_frame = blend_to(first_pose, capture_pose(), LOOP_BLEND, out_frame)
    scene.frame_start, scene.frame_end = 0, out_frame - 1
    print("copied %d frames from %s x%d (loop blend %d); hips height %.2f..%.2f m" % (out_frame, ", ".join(os.path.basename(p) for p in files), REPEAT, LOOP_BLEND, min(hips_z), max(hips_z)))

# ---------- B. MotionClip3D for our rig ----------
else:
    clip = json.load(open(os.path.abspath(CLIP3D)))
    samples = clip["samples"]
    N = len(samples)
    seconds = float(clip["cycle"]["seconds"])
    # Frame i at i/N of the cycle; frame N repeats sample 0 so the loop closes.
    scene.render.fps = N
    scene.render.fps_base = seconds
    A2B = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))  # app (Y-up, +Z forward) -> Blender (Z-up, -Y forward)

    def q_app(q):
        x, y, z, w = q
        v = A2B @ Vector((x, y, z))
        return Quaternion((w, v.x, v.y, v.z))

    MIX = {"pelvis": ["mixamorig:Hips"], "spine": ["mixamorig:Spine"], "neck": ["mixamorig:Neck"], "head": ["mixamorig:Head"]}
    for side, S in (("L", "Left"), ("R", "Right")):
        MIX["thigh." + side] = ["mixamorig:%sUpLeg" % S]
        MIX["shin." + side] = ["mixamorig:%sLeg" % S]
        MIX["foot." + side] = ["mixamorig:%sFoot" % S]
        MIX["upper_arm." + side] = ["mixamorig:%sArm" % S]
        MIX["forearm." + side] = ["mixamorig:%sForeArm" % S]
        MIX["hand." + side] = ["mixamorig:%sHand" % S]
        MIX["fingers." + side] = ["mixamorig:%sHand%s1" % (S, f) for f in ("Index", "Middle", "Ring", "Pinky")]
    ORDER = ["pelvis", "spine", "neck", "head", "thigh.L", "shin.L", "foot.L", "thigh.R", "shin.R", "foot.R", "upper_arm.L", "forearm.L", "hand.L", "fingers.L", "upper_arm.R", "forearm.R", "hand.R", "fingers.R"]
    cb_inv = {k: Quaternion(v).inverted() for k, v in rig["cb"].items()}
    hips = arm.pose.bones["mixamorig:Hips"]
    hips_rest = rest_world["mixamorig:Hips"]
    foot_rest = Vector(rig["bones"]["mixamorig:LeftFoot"]["head"])
    # The bar-held wrist sits where the STANDING figure's wrist is (arm at the
    # side, 0.27 m from the midline), not where the T-posed rig's LeftHand
    # head is (0.71 m out along the arm); using the latter hung the pull-up
    # 0.44 m to one side of the bar until 2026-09-11. rig-joints.json is the
    # standing rest, Blender Z-up.
    joints_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mocap", "rig-joints.json")
    standing = json.load(open(joints_path))
    wrist_rest = Vector(standing["wrist.l"])
    shifts = []
    # Frame N repeats sample 0 so the loop closes; with a loop blend the eased
    # frames close it instead.
    for i in range(N if LOOP_BLEND else N + 1):
        s = samples[i % N]
        for pb in arm.pose.bones:
            pb.rotation_quaternion = Quaternion()
        hips.location = Vector((0, 0, 0))
        for our in ORDER:
            q = s["q"].get(our)
            if ARMS == "rest" and our.split(".")[0] in ("upper_arm", "forearm", "hand", "fingers"):
                q = [0, 0, 0, 1]  # our rest: arms down at the sides, whatever the trunk does
            if our in ("neck", "head"):
                if HEAD == "level":
                    q = [0, 0, 0, 1]
                elif HEAD == "follow":
                    q = s["q"].get("spine", q)
            if q is None:
                continue
            delta = q_app(q) @ cb_inv.get(our, Quaternion())
            for mx_name in MIX[our]:
                pb = arm.pose.bones[mx_name]
                bpy.context.view_layer.update()
                set_world_orientation(pb, delta @ rest_world[mx_name])
        bpy.context.view_layer.update()
        if ANCHOR == "free":
            r = s["root"]
            shift = A2B @ Vector((r[0] + ROOT_OFFSET[0], r[1] + ROOT_OFFSET[1], r[2] + ROOT_OFFSET[2]))
        elif ANCHOR == "hands":
            target = Vector((wrist_rest.x, 0.03, BAR - 0.015))  # app (x, bar-0.015, -0.03)
            shift = target - arm.pose.bones["mixamorig:LeftHand"].head
        else:
            shift = foot_rest - arm.pose.bones["mixamorig:LeftFoot"].head
        hips.location = hips_rest.inverted() @ shift
        shifts.append(shift)
        key_all(i)
        if i == 0:
            first_pose = capture_pose()
    last_frame = N
    if LOOP_BLEND:
        last_frame = blend_to(first_pose, capture_pose(), LOOP_BLEND, N) - 1
    scene.frame_start, scene.frame_end = 0, last_frame
    zs = [v.z for v in shifts]
    print("converted %d samples (%.3f s) from %s; anchor %s, hips shift z %.3f..%.3f" % (N, seconds, os.path.basename(CLIP3D), ANCHOR, min(zs), max(zs)))

# ---------- export: armature and animation only ----------
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_animations=True, export_yup=True, export_skins=False, export_apply=False)
print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")
