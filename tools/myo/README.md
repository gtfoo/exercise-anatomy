# Whole-body activation with MyoFullBody (MuJoCo)

Estimates muscle activation over one exercise cycle with the MyoFullBody model
from [amathislab/musclemimic_models](https://github.com/amathislab/musclemimic_models)
(MyoSuite legs, torso and arms joined; 416 muscles; Apache-2.0). It replaces
the OpenSim pipeline in `tools/opensim` for display, because that model has no
arm or shoulder muscles and could not say anything about a pull-up. The
OpenSim pipeline stays as a cross-check for the squat.

Runs locally in WSL: MuJoCo ships aarch64 wheels, OpenSim does not.

## Setup

```bash
git clone --depth 1 https://github.com/amathislab/musclemimic_models tools/myo/vendor/musclemimic_models
python3 -m venv tools/myo/.venv
tools/myo/.venv/bin/pip install mujoco numpy scipy
```

`vendor/`, `.venv/` and `out/` are gitignored.

## Run

```bash
tools/myo/.venv/bin/python tools/myo/estimate.py src/lib/motion/bodyweight-squat-3d.json tools/myo/out/squat.json --anchor feet --duration 3.2
tools/myo/.venv/bin/python tools/myo/designed_clip.py pull-up tools/myo/out/pull-up-3d.json
tools/myo/.venv/bin/python tools/myo/estimate.py tools/myo/out/pull-up-3d.json tools/myo/out/pull-up.json --anchor hands --bar 2.3 --duration 3.6
```

`--duration` must match the exercise's `durationMs`: the accelerations, and so
the reserves, depend on the tempo. Copy the result to `src/lib/activation/`
and wrap the exercise with `withEstimatedActivation`. `--stage ik|id` stops
after that stage for checking.

## What it does, and what to check in its output

1. **IK.** `rigfk.py` poses the app's rig exactly as `AnatomyFigure.tsx` does
   (same anchoring), then per frame a bounded least squares over the trunk,
   hip, knee, ankle, shoulder and elbow coordinates makes the model's segment
   directions match the figure's. Roll-like coordinates (hip rotation, plane
   of elevation, trunk twist) are pulled gently to rest because directions do
   not fix them. Coupled joints (knee translations, patella, scapula) follow
   the model's own equalities. For `--anchor feet` the heels are planted and
   the feet held flat; for `hands` the whole body is swung about the bar until
   the centre of mass hangs under it, which two hand forces require. The
   trajectory is then low-passed at 6 Hz over the cycle.
   *Check:* the printed joint ranges. The model's knee stops at 120° and the
   ankle at 30° dorsiflexion; the captured squat wants ~134° and more, so the
   bottom of the squat is the model's deepest squat, not the figure's.
2. **Inverse dynamics.** `mj_inverse` with contacts and joint limits off gives
   the total generalised force the motion needs. The six root rows are what the
   floor or the bar must supply: for the feet, a wrench at each foot's centre
   of pressure (under the centre of mass, within the foot), moments penalised;
   for the hands, forces only, since hands turn freely on a bar. What is left
   in the root rows after that is unphysical and printed as "unmet".
   *Check:* the vertical reaction should bracket body weight (827 N).
3. **Static optimisation.** Per frame, `lsq_linear` over all 416 activations in
   [0, 1] with a small quadratic penalty, against every non-root, non-coupled
   dof. The residual per dof is the reserve torque; the six largest are printed
   and written into `conditions`.
   *Check:* reserves above ~30 N m mean the model could not do the movement as
   posed — usually a joint at its range limit, or a strength the generic model
   lacks (the pull-up saturates the elbow flexors and shoulder extensors).
4. **Mapping.** `muscle-map.json` maps atlas ids to actuator name patterns;
   sub-parts and sides are averaged, activations get a three-sample cyclic
   average (their own rise time), and the result is written in the
   `EstimatedActivation` shape with 33 points per curve. Atlas muscles with no
   actuator (trapezius, rhomboids, transversus) are listed and stay qualitative.

Naming in the model: legs and trunk carry `_r`/`_l`; the arms are bare for
the right side and `_left` for the left.

## Known limits

- Generic 84 kg model, unscaled to the figure; leg lengths differ by ~2 cm.
- Direction-only IK: forearm pronation and hand orientation are not matched.
- A designed clip (`designed_clip.py`) has no dynamics of its own; the swing
  correction makes it hang honestly but the bar-axis moment it cannot balance
  is reported, not resolved.
- The 3D retargeter pitches the squat's foot ~20° toes-down; the flat-foot
  rule here hides that, the viewer does not (see `TASKS.md`).
