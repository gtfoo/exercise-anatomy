# Tasks — exercise-anatomy

What this app owes. **Written only by the exercise-anatomy agent**; readable by
anyone. Tasks carry a `from:` pointer, because the reasoning usually lives in a
letter and a one-line task strands the *why*.

## Open

- [ ] **Content-hashed model filename**, then tell the droplet agent so
      `/models/*` becomes `Cache-Control: immutable` for a year.
      `from: droplet · MAIL-ARCHIVE.md#held-the-caddy-host-block`

- [ ] **Owner to confirm the calf and the kneecaps.** Per-joint blend widths
      (2026-09-07) for the fibula head showing through the lateral
      gastrocnemius; the patella pinned to the tibia (2026-09-08) after it
      followed the femur onto the top of the knee. Both look clean to me at the
      bottom of the squat; the owner spotted both and should close them.
      `from: owner, 2026-09-07/08 · screenshots at 39% and 52% of the rep`

- [ ] **A model that can squat below 120° and pull itself up.** MyoFullBody's
      knee stops at 120° and its ankle at 30° of dorsiflexion, so the bottom
      of the squat is the model's deepest, not the figure's, and the knee
      reserve there is ~70 N m; its generic arms cannot make the pull-up's
      shoulder torque (reserves ~110 N m), so every arm muscle reads maximal.
      Options: widen the ranges in a patched MJCF (the muscle paths may not
      survive it), or scale strength to a stronger subject and say so.
      `from: exercise-anatomy, 2026-09-09 · tools/myo/README.md`

- [ ] **Limb twist and foot pitch in the 3D retargeter.** `extract_pose3d.py`
      recovers each segment's direction, not its roll; forearm pronation and
      hand orientation are lost, and a captured pull-up would show the wrong
      grip. It also pitches the squat's foot ~20° toes-down (the toe tip is
      1.3 cm under the floor at every frame); the estimator holds the feet flat
      instead, the viewer does not. Source orientations relative to a matched
      rest pose would fix both.
      `from: exercise-anatomy, 2026-09-08/09 · tools/mocap/README.md, tools/myo/README.md`

- [ ] **Case study on gtfoo.com** — `/products/exercise-anatomy`, three edits in
      the parent repo, once the site is live. The parent's own rules apply.
      `from: gtfoo AGENTS.md · case studies`

## Done

- [x] **Whole-body activation with MyoFullBody** (2026-09-09): `tools/myo`
      runs in WSL (MuJoCo has aarch64 wheels), IK from the figure's own rig
      pose, the floor or bar reaction solved through the anchor Jacobians,
      per-frame bounded least squares over 416 activations. The squat and the
      pull-up now show it; the squat's trunk is estimated for the first time.
      Freestyle stays qualitative (no water model). What the model cannot do
      is a task above. `from: owner, 2026-09-08 · "let's go with MuscleMimic → MyoFullBody"`
- [x] **Freestyle swimming** (2026-09-08): a general 3D pose player (per-bone
      world rotations from any clip, anchors solved on the posed skeleton,
      free root motion) and CMU subject 126 trial 12 retargeted onto it.
      Mixamo had no swimming clip; the CMU capture is on land, mimed.
- [x] **Live at `https://exercise-anatomy.gtfoo.com`** (2026-09-08). Allocation,
      key and directory on 2026-09-07; `out/` rsynced the same evening; the
      Caddy block landed overnight and the hostname answered 200 by morning.
      `DROPLET_HOST` is the public hostname and `DROPLET_PORT` a probed 22:
      `INFRA-PRIVATE.md` turned out not to hold the box's public address at
      all, so there was nothing more private to use.
- [x] OpenSim estimate folded into `squat.ts` (2026-09-07), after six CI runs:
      absolute paths; centre of pressure under the centre of mass; ground
      reaction from inverse dynamics rather than BodyKinematics (which reports
      free fall); rep analysed at the displayed 3.2 s tempo, which brought the
      pelvis reserves from 173 N to 20 N.
