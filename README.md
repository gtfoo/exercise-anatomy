# Exercise anatomy

Which muscles work, and when, through a movement — shown on a rigged écorché
you can orbit and scrub. One exercise so far: the bodyweight squat.

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

Node 22 (`.nvmrc`). Dev server on **3901** — the gtfoo dev block in `INFRA.md`,
because this app has no allocation of its own yet.

```bash
npm install
npm run dev -- -p 3901
```

## Next

1. **Motion capture for the squat.** The pipeline in `tools/mocap/` is built
   and round-trip tested; it needs a Mixamo squat FBX in `tools/mocap/in/`
   (a person downloads it — Adobe login). Output goes to `src/lib/motion/` and
   is wired in with one line in `squat.ts`.
2. **OpenSim for activation.** Static optimisation on the Rajagopal model,
   fed by the same angle curves, run in GitHub Actions (no ARM64 build exists
   for this laptop). Output replaces the qualitative curves with *estimated*
   ones and a `source` line. Needs the repo on GitHub first.
3. A second exercise, to find out what in `squat.ts` is really per-exercise.
