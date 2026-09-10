"""Option B feasibility: can the figure be T-posed through its own weights?

    blender --background --python check_tpose.py -- out

Loads out/figure.glb, raises both arms to a palms-down T-pose the way a
Mixamo bind pose stands, and renders front and back views. Mixamo's skeleton
(and any native playback of its clips) needs the mesh bound in that pose, so
if the shoulders, chest and lats survive this, a re-rig is on; if they tear
or collapse, option B is off and the orientation retargeter stays.
"""

import math
import os
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else ["out"]
OUT = os.path.abspath(argv[0])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, "figure.glb"))
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
print("bones:", [b.name for b in arm.data.bones])


def set_world_rotation(pb, q_world):
    """Rotate a pose bone by q_world (world frame) relative to its rest, like the app's setWorld."""
    rest = (arm.matrix_world @ pb.bone.matrix_local).to_3x3().to_quaternion()
    parent_world = (arm.matrix_world @ pb.parent.matrix).to_3x3().to_quaternion() if pb.parent else Quaternion()
    parent_rest = (arm.matrix_world @ pb.parent.bone.matrix_local).to_3x3().to_quaternion() if pb.parent else Quaternion()
    # Desired world orientation: q_world * rest. Local = inverse(parent_world) * desired, expressed against the rest local.
    desired = q_world @ rest
    local_rest = pb.bone.matrix_local.to_3x3().to_quaternion()
    if pb.parent:
        local_rest = pb.parent.bone.matrix_local.to_3x3().to_quaternion().inverted() @ local_rest
    parent_now = (arm.matrix_world @ pb.parent.matrix).to_3x3().to_quaternion() if pb.parent else arm.matrix_world.to_3x3().to_quaternion()
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = local_rest.inverted() @ (parent_now.inverted() @ desired)


# Blender Z-up after glTF import: forward is -Y, up is Z, the figure's left at +X.
up = Vector((0, 0, 1))
fwd = Vector((0, -1, 0))
bpy.context.view_layer.update()
for side, sign in (("L", 1), ("R", -1)):
    raise_q = Quaternion(fwd, math.radians(-90 * sign))  # arm from down to lateral, about the forward axis
    set_world_rotation(arm.pose.bones["upper_arm." + side], raise_q)
    bpy.context.view_layer.update()
    twist = Quaternion(Vector((sign, 0, 0)), math.radians(90))  # palm forward -> palm down, about the arm axis
    set_world_rotation(arm.pose.bones["forearm." + side], twist @ raise_q)
    bpy.context.view_layer.update()
    set_world_rotation(arm.pose.bones["hand." + side], twist @ raise_q)
    bpy.context.view_layer.update()
    if "fingers." + side in arm.pose.bones:
        set_world_rotation(arm.pose.bones["fingers." + side], twist @ raise_q)
        bpy.context.view_layer.update()

# Report where the wrists ended up.
for side in ("L", "R"):
    pb = arm.pose.bones["hand." + side]
    print("hand.%s head at %s" % (side, [round(v, 3) for v in (arm.matrix_world @ pb.head)]))

# ---- render front and back ----
scene = bpy.context.scene
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
for name, pos, rot in (("front", (0, -6, 0.95), (90, 0, 0)), ("back", (0, 6, 0.95), (90, 0, 180))):
    cam.location = pos
    cam.rotation_euler = tuple(math.radians(a) for a in rot)
    scene.render.filepath = os.path.join(OUT, "check-tpose-%s.png" % name)
    bpy.ops.render.render(write_still=True)
    print("wrote", scene.render.filepath)
