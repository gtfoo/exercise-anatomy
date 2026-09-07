# OpenSim → estimated activation

Turns the captured squat (`src/lib/motion/bodyweight-squat.json`) into
per-muscle activation estimates with OpenSim static optimisation, so the colours
in the app come from a published musculoskeletal model instead of role-based
guesses. Trunk muscles stay qualitative: the model actuates the lumbar joint
with torque actuators, not muscles.

## Where it runs

GitHub Actions (`.github/workflows/opensim.yml`), linux-64. OpenSim has no
ARM64 build, and this repo is developed on an ARM64 laptop. The workflow runs
on `workflow_dispatch` and on pushes that touch `tools/opensim/**` or
`src/lib/motion/**`. It uploads `tools/opensim/out/` as an artifact and pushes
`src/lib/activation/bodyweight-squat.json` to the `opensim/squat` branch. A
person reviews the printed sanity checks and merges.

## Model

`RajagopalLaiUhlrich2023.osim` from `opensim-org/opensim-models` (MIT licence
per SimTK). Chosen over `Rajagopal2016.osim` because the Lai 2017 update raises
the knee range to 140°; the Mixamo squat flexes to ~134°. Cite Rajagopal et al.
2016, Lai et al. 2017, Uhlrich et al. 2022. 80 lower-limb muscles, 75 kg,
unscaled.

`inspect_model.py` prints coordinates, ranges, muscle and body names from an
`.osim` without OpenSim installed — that is how the range problem was found.

## What the script decides (`run_static_optimization.py`)

- **Signs are calibrated, not assumed.** Each coordinate is nudged +0.3 rad and
  a landmark's motion is checked against the anatomical meaning we need
  (positive knee angle must move the ankle backward, and so on). Conventions
  differ between OpenSim models; this makes the script indifferent to them.
- **Feet planted** by translating the pelvis per frame so the ankle stays put.
- **Ground reaction from the centre of mass**: F = m (a − g) from the model's
  own COM trajectory, split equally, applied at the midfoot. No force plate,
  hence "estimated". The printed vertical range should bracket body weight.
- **Reserve actuators** on every coordinate at 1 N·m. Their printed peaks are
  the honesty check: if a reserve carries tens of N·m, the muscles could not
  balance that joint and the activations there are not to be trusted.
- **Static optimisation** minimises the sum of squared activations. Known bias:
  it under-predicts co-contraction, so antagonists (hamstrings in a squat) will
  read low.

## Output

`squat-activation.json`: per app muscle id, a 16-point `[t, activation]`
curve (absolute, 0–1, averaged over sub-parts and both sides), the peak, the
model parts used, and the provenance strings the UI shows. `src/lib/exercises/
squat.ts` merges it in and marks those muscles `estimated-activation`.
