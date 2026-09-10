# Tasks — exercise-anatomy

What this app owes. **Written only by the exercise-anatomy agent**; readable by
anyone. Tasks carry a `from:` pointer, because the reasoning usually lives in a
letter and a one-line task strands the *why*.

## Open

- [ ] **Make the MyoFullBody estimate credible before showing it again.** It
      was displayed for a day (2026-09-09) and pulled when the owner saw
      muscles "lighting up at random". Known causes: per-frame independent
      least squares (no temporal smoothness, so curves jitter); the generic
      model at its strength limit (arm muscles at 1.0 through the pull-up,
      tibialis anterior at 1.0 in the squat with the centre of mass over the
      heels); the IK matching segment directions only. To try, in order:
      solve all frames together with a smoothness term; weight reserves so
      the optimiser prefers a reserve over a saturated muscle; scale the
      model's strength to the task, or say plainly it cannot do it; compare
      each curve against the OpenSim lower-limb result before trusting it.
      `from: owner, 2026-09-10 · "the muscles are just lighting up at random period"`

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

- [ ] **Owner to compare `/` with `/lab/native-squat/` and pick the
      hundred-exercise path.** Option B is built (below). If B wins: one
      rigged figure plus one small clip file per exercise (three.js plays a
      clip from another GLB when the bone names match), `build_mixamo_rig.py`
      split into a one-off rig build and a per-clip converter, and CMU
      clips converted onto the Mixamo rig with the orientation retargeter.
      If A wins: nothing to do; the lab page and the second model come out.
      `from: owner, 2026-09-09 · "let's go with option A first, then try B"`

- [ ] **Case study on gtfoo.com** — `/products/exercise-anatomy`, three edits in
      the parent repo, once the site is live. The parent's own rules apply.
      `from: gtfoo AGENTS.md · case studies`

## Done

- [x] **Option B trial: the Mixamo-skeleton rig** (2026-09-10). No Adobe
      upload needed: the figure T-poses cleanly through its own weights
      (`check_tpose.py`), so `build_mixamo_rig.py` bakes that pose, builds a
      Mixamo-named armature with Mixamo's exact rest orientations at our
      joints, remaps the weights and copies the clip bone for bone. Plays on
      `/lab/native-squat/` (5.6 MB second model) with the same muscle curves
      as `/`: arms, palms and head all right with no retargeting code.
      `from: owner, 2026-09-09 · "then try B"`
- [x] **Orientation retargeting** (2026-09-09, option A): `extract_pose3d.py`
      now transfers each source bone's full rotation through a per-bone rest
      alignment (palm normal for the arms), so the swimmer's head, forearm
      pronation and the squat's foot pitch are captured rather than guessed.
      Both clips re-extracted; the squat estimate re-run on the new clip.
      `from: owner, 2026-09-09 · "the pull up movements are really weird now / the head joint is really off"`
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
