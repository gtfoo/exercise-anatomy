# Exercise anatomy

Which muscles work, and when, through a movement — shown on a rigged écorché
you can orbit and scrub. Two exercises: the bodyweight squat (`/`) and the
pull-up (`/pull-up`).

## Adding an exercise

1. If it uses muscles the figure does not yet name, add them to `TARGETS` in
   `tools/blender/build_figure.py` (`find_muscles.py` gives the atlas names)
   and rebuild. Muscles one exercise names render as resting in the others.
2. A designed joint-angle function in `src/lib/kinematics/` registered by slug
   in `index.ts` — or a captured clip via `tools/mocap/`.
3. The exercise file in `src/lib/exercises/`: phases, muscles with roles and
   notes, the anchor (`feet` or `hands`), a camera. Add it to `index.ts` for
   the switcher, and a one-line page under `src/app/<slug>/`.

## How it works

- **The model** is `public/models/figure.glb`, built from the open Z-Anatomy
  atlas by the scripts in `tools/blender/` (see the README there). Every muscle
  the exercise names is its own skinned mesh; the rest of the muscular system
  and the skeleton are two more. No hand work in Blender: the pipeline is
  re-runnable.
- **The movement** is a joint-angle function, `src/lib/kinematics/squat.ts`,
  not an animation clip. `AnatomyFigure.tsx` rotates the model's bones from it
  every frame and places the pelvis where the planted feet put it. Changing the
  squat means changing four numbers.
- **The activation** is `src/lib/exercises/squat.ts`: each muscle gets a role —
  prime mover, synergist, stabiliser — and a relative curve shaped to that
  role. **It is qualitative.** No muscle carries a `source`, and the UI prints a
  band, never a number, until one does. Do not add a percentage without a
  citation and the conditions it was measured under.

Selecting a muscle fades every other muscle and leaves the skeleton, so deep
muscles (vastus intermedius, gluteus minimus, soleus) can actually be seen.

## Licence of the model

Derived from BodyParts3D (The Database Center for Life Science, CC-BY-SA 2.1
Japan) via Z-Anatomy (CC-BY-SA 4.0). The attribution both require is in the
panel footer; the adapted model is share-alike under the same terms. The code
in this repository is separate from the model.

## Run

Node 22 (`.nvmrc`). Dev server on **3960** — this app's dev block in `INFRA.md`
is 3960-3969.

```bash
npm install
npm run dev -- -p 3960
```

Production is a static export (`npm run build` → `out/`) served by Caddy at
`exercise-anatomy.gtfoo.com`; pushes to `main` deploy it via
`.github/workflows/deploy.yml`.

## Where the numbers come from

- **Movement:** one captured rep of a Mixamo *Air Squat*, reduced to four
  sagittal angles per sample by `tools/mocap/` (credited in the footer; the raw
  clip is not redistributed).
- **Lower-limb activation:** OpenSim static optimisation on the
  RajagopalLaiUhlrich2023 model, from that movement, run in GitHub Actions
  (`tools/opensim/`). Labelled *estimated, not measured* — the ground reaction
  is derived from the motion, not a force plate, and static optimisation
  under-predicts co-contraction (hamstrings read low).
- **Trunk activation, and the whole pull-up:** qualitative by role; the model
  has no trunk, arm or shoulder muscles.

## Next

1. Content-hashed model filename, so the droplet can cache it as immutable.
2. A captured pull-up clip, if Mixamo has a usable one — the hands-anchored
   kinematics take a clip the same way the squat does, once the extractor
   also reads the elbow.
3. Cited EMG (%MVIC with conditions) where a paper exists — the third
   provenance the UI already knows how to show.
