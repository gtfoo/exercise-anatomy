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

  The frame range flag is `--range START:END` (Blender's own parser grabs
  `--cycle` as an abbreviation of its `--cycles-*` flags, even after `--`).
  Root motion is relative to the cycle's first frame, so a cut from the
  middle of a long take starts at the figure's rest height.

- `probe_clip.py` — a coarse timeline of a take (hips height, wrist heights
  above the hips, knee angle) every N frames, with `--from/--to` to zoom in,
  for choosing the range by eye. The CMU takes are long and mixed (subject 1
  trial 12 is climb, pull up, dangle, sit, lower), so this is how the cuts
  below were found.

Cuts in use (CMU FBX from Hugging Face `gbionics/cmu-fbx`, 30 fps):

| exercise | take | frames | anchor |
|---|---|---|---|
| pull-up | 01_12 | 117:213 | hands, bar 2.3 |
| jumping jacks | 14_06 | 64:96 | free (13_29's jacks are a step-jack, hips move 2 mm) |
| forward lunge | (designed, `tools/myo/designed_clip.py`) | | 144_17 frames 168-252 was tried: back thigh 28° out |
| push-up | (designed) | | no free floor push-up exists |
| freestyle | 126_12 | 297:364 | free, root offset y 0.216 |

Mixamo clips (owner's downloads, converted straight from the FBX with
`convert_clip.py --fbx`): Air Squat, Swimming breaststroke (61:121, root
vertical), Kettlebell Swing, Sprint, Bicycle Crunch, Bicep Curl (all root
vertical), Climbing Up Wall + Climbing Down Wall and Walking Up The Stairs
(full root motion; the viewer draws a wall with holds or a staircase to
match), and from 2026-09-11: Push Up, Start Plank + Plank, Burpee, Situps,
Pistol (the whole take: left leg, then right, and it closes on itself at
frame 122; root vertical), Pike Walk, Clean And Jerk (103:505, the walk to
and from the bar cut), Snatch, and Overhead Squat (2) + Overhead Squat +
Overhead Squat (1) (pick up, squat, set down). Push Up and Plank replaced
designed movements. `probe_clip.py` prints each clip's timeline; the cut
frames above came from it. A cycle cut from a longer take rarely closes:
`convert_clip.py --loop-blend N` appends N eased frames from the last pose
back to the first (breaststroke 8, freestyle 6) so the repeat is continuous.

Also on disk: 88_02 (acrobatics) holds handstand push-ups, not floor ones;
13_29 frames 1041-1121 is a deep bodyweight squat, unused since the Mixamo
squat is the estimator's input.
- `extract_angles.py` — the four world-space sagittal angles (`shin`, `thigh`,
  `trunk`, `armFwd`). Still the input to the activation estimate, which is
  planar.

Sources so far: Mixamo *Air Squat* (both extractors) and CMU subjects 126
(freestyle, mimed on land), 14 (jumping jacks) and 144 (lunges), all 3D
only. Subject 1's playground pull-up was tried and rejected (knees tucked,
a swing); the pull-up is designed. CMU terms: free for any use, credit
"CMU Graphics Lab Motion Capture Database".

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
