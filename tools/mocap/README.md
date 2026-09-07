# Motion capture → joint angles

Turns a captured clip into the four world-space sagittal angles the app
animates (`shin`, `thigh`, `trunk`, `armFwd`; see `src/lib/kinematics/types.ts`).
No retargeting: the clip's own skeleton is read and the angles are measured
from joint positions, so the app never sees a foreign rig.

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
