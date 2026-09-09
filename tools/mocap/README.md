# Motion capture → the figure

Two extractors, both working from the clip's joint positions so no foreign
skeleton ever reaches the app:

- `extract_pose3d.py` — **the general one.** One cycle of any motion as
  per-bone world rotations for the rig plus root motion (`MotionClip3D`).
  Handles roll, alternating limbs, arms out of the sagittal plane; finds the
  cycle by autocorrelation of the left wrist's forward travel (`--cycle
  START:END` to override, `all` for a single rep). Needs `rig-joints.json`,
  copied from `tools/blender/out/joints.json` after a figure rebuild. Drives
  the figure when an exercise has `motion3d`.

  Default method is **orientation**: each rig bone follows its source bone's
  full world rotation (a delta from the clip's bind pose), through one
  constant alignment per bone computed from both rest poses, so pronation,
  head tilt and foot pitch survive. The alignment's roll reference is the
  hip line for legs and pelvis, the shoulder line for trunk and head, and the
  palm normal (fingers × thumb) for the arms; the figure rests with its palms
  forward, both clips so far rest in a palms-down T-pose, and the script
  prints what it found. `--method direction` is the older joint-position
  approach, for a BVH with no bind pose; it loses twist.

  Blender's own parser objects to `--cycle` on the command line (it collides
  with `--cycles-*`), so pass it after the `--` and, if it still trips, rely
  on the auto-detected cycle, which the script prints.
- `extract_angles.py` — the four world-space sagittal angles (`shin`, `thigh`,
  `trunk`, `armFwd`). Still the input to the activation estimate, which is
  planar.

Sources so far: Mixamo *Air Squat* (both extractors) and CMU subject 126 trial
12, freestyle (3D only; captured on land with the subject miming the stroke).
CMU terms: free for any use, credit "CMU Graphics Lab Motion Capture Database".

## Inputs (not in git)

`in/` is gitignored on purpose. Mixamo's terms allow its animations to be
*embedded* in a project but not redistributed as raw files; the derived angle
curves in `src/lib/motion/` are the embedded form. CMU (cgspeed BVH) clips are
free for any use with a credit line — still keep the raw file out of git and
cite it in the JSON `source`.

- Mixamo: search "squat", Download → FBX Binary, Without Skin, 30 fps, no
  keyframe reduction → `in/squat.fbx`. Needs an Adobe login, so this step is
  done by a person.
- CMU: any `.bvh` from the cgspeed conversion → `in/<name>.bvh`.

## Run

```bash
# extract one rep as 64 samples (Blender headless; Windows ARM64 build on this laptop)
blender --background --python extract_angles.py -- "in/Air Squat.fbx" out/air-squat.json --credit "Mixamo (Adobe)"

# ship it (out/air-squat.raw.json stays behind; it is every frame, for checking)
cp out/air-squat.json ../../src/lib/motion/bodyweight-squat.json
```

Then in `src/lib/exercises/squat.ts`:

```ts
import motion from "@/lib/motion/bodyweight-squat.json";
export const squat: Exercise = { ..., motion, ... };
```

With `motion` present the app ignores the designed joint-angle function.

## Check it before trusting it

`extract_angles.py` prints the bone mapping it found and the angles at the
bottom of the rep. Sanity values for a bodyweight squat: shin 20–35°, thigh
−70 to −95°, trunk 25–45°, armFwd 60–100°. If a sign is flipped the figure
will fold backwards; the fix is in `sag()`, not in the app.

`synth_bvh.py` writes a BVH from the app's analytic squat; running the
extractor on it must return the same angles (it does, to 0.1°). Run that
round trip again after touching either script.

## Rep cutting

One rep is the span around the lowest hip position where hip height is within
3% of standing. Clips that never stand up fully, or that loop several reps,
get `--rep all` and a manual choice of frames.
