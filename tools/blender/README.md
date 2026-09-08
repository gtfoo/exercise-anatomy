# Figure pipeline

Builds `public/models/figure.glb` — the rigged écorché the app animates — from
the Z-Anatomy atlas. Everything is scripted; nothing is done by hand in Blender.

## Inputs (not in git)

- `vendor/Z-Anatomy.zip` from https://github.com/Z-Anatomy/The-blend (master),
  86.7 MB, unzipped to `vendor/Z-Anatomy/Startup.blend` (307 MB). Licence
  CC BY-SA 4.0; derived from BodyParts3D, CC BY-SA 2.1 Japan. The attribution
  both require is rendered in the app's panel footer — keep it there.
- Blender 5.2 LTS, run headless. On this laptop that is the Windows ARM64 build
  in `C:\Users\gtfoo\tools\blender\`; WSL is aarch64 and has no official build.

## Steps

```bash
# 1. what is in the atlas: names, collections, vertex counts, bounding boxes
blender --background vendor/Z-Anatomy/Startup.blend --python inventory.py -- out
python3 query_inventory.py out/inventory.json     # answers the mapping questions
python3 find_outliers.py out/inventory.json       # anything parked away from the body

# 2. build: merge, decimate, rig, weight, export (add `norender` to skip the PNG checks)
blender --background vendor/Z-Anatomy/Startup.blend --python build_figure.py -- out norender

# 3. ship
cp out/figure.glb ../../public/models/figure.glb
```

Opening the 307 MB atlas takes a few minutes; the rest is under a minute.

## What `build_figure.py` decides

- **Which meshes.** `TARGETS` maps each app muscle id to Z-Anatomy object names
  (both sides merged into one mesh named by the id) — the union of every
  exercise's muscles, since the app renders any named muscle an exercise does
  not use as resting. `find_muscles.py` looks names up. Every other real
  muscle becomes `context-muscles`; the skeleton becomes `skeleton`. Bursae,
  sheaths, fasciae and the `.j/.i/.g/.ol/.or/.el/.er` label objects are
  dropped.
- **Rigid overrides.** `RIGID_OVERRIDE` pins skeleton parts whose centroid sits
  on a joint line to the right bone by name; the patella was equidistant from
  femur and tibia, fell to the femur, and at deep flexion sat on top of the
  knee.
- **Joints come from the bones.** Femoral head, condyles, talus, humeral head
  and so on are centroids of the actual bone meshes, so the armature fits the
  model instead of the model being fitted to a guessed armature.
- **Weights by envelope, not heat.** Blender's automatic weights fail on merged
  anatomy. Each vertex is weighted between the two bones whose *envelope*
  (segment distance minus a per-bone radius, `ENVELOPE`) it is nearest, blended
  over `BLEND_WIDTH`. Region rules on top: arm bones cannot claim vertices
  inside the torso, thigh bones cannot claim anything above the hip joint, the
  pelvis cannot reach down the thigh. Plain nearest-segment weighting handed the
  chest to the upper-arm bones (they hang closer to the ribs than the spine
  does) and the belly to the femurs, which is what a collapsed, hunched squat
  looks like. The rules are soft ramps, not cut-offs — a hard cut-off put a fold
  across the gluteus maximus — and the result is passed through Blender's own
  `vertex_group_smooth`, the standard fix for a crease at a joint, which unlike
  Corrective Smooth bakes into the export. Skeleton bones are rigid, one bone
  per source object, so a rib or hip bone never tears.
- **Hand-rolled where a standard exists, deliberately.** Bone-heat automatic
  weights reject merged anatomy; motion capture (Mixamo, CMU BVH) retargeted
  onto this armature would replace the joint-angle function; OpenSim would
  replace the qualitative curves with estimated activation. Each is a step up
  in effort, in that order.
- **No animation clip.** The app rotates the bones from the same joint-angle
  function that drove the old procedural figure (`src/lib/kinematics`). The
  bottom-of-squat PNG check uses the same angles so the two agree.
- **Vertex budgets** (`BUDGET_*`) are where file size is traded for detail.

## Traps

- three.js's GLTFLoader strips `.` from node names, so `thigh.L` arrives as
  `thighL`. `AnatomyFigure.tsx` sanitises the same way; do not rename bones to
  work around it.
- `Object.to_mesh()` ignores modifiers. The atlas objects have none; if that
  changes, evaluate through the depsgraph as `decimate()` does.
- Never save the vendor `.blend`. The scripts never do; neither should you.
