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

- [ ] **Tell the droplet agent `/models/*` can go immutable.** Every model
      URL now carries a content hash as a query string (`?v=<sha1[:10]>`,
      `scripts/hash-models.mjs` before dev and build), so a re-converted
      clip is a new URL. The one-day cache the droplet set bit on
      2026-09-11: the owner saw yesterday's pull-up after a deploy. With the
      hashes in place a year-long immutable cache is safe; write the letter.
      `from: droplet · MAIL-ARCHIVE.md#held-the-caddy-host-block · owner 2026-09-11 "i dont see any updates"`

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

- [ ] **Free-source clips: what was found** (the pull-up, lunge and jumping
      jacks below are now live; the rest is what remains for later).
      Mixamo has no pull-up; the page runs the designed kinematics. Browsed
      2026-09-10 (owner: free for now, list the paid): **CMU** (free for any
      use, FBX on Hugging Face `gbionics/cmu-fbx`) has 01_12 "playground -
      climb, pull up, dangle" (546 KB), 13_29 / 14_06 "jumping jacks, side
      twists, squats, stretches", 88_02 "handstands, vertical pushups",
      144_17 "Lunges", 79_02 "swimming". **ActorCore** free set (32 clips):
      nothing gym; paid items $1.50-4.50 each (Push Ups on Yoga Mat $4.50,
      Lift Dumbbells $2.25, Spin Bike, Treadmill, Stretch $4.50, Warrior on
      Yoga Mat $4.50, packs $49-149); no pull-up or squat found. **MocapFlow**
      needs a Google sign-in and credits; catalogue is AI-from-video
      (Bodybuilding, Gymnastics); no pull-up found; licence allows
      commercial use and modification. **SFU**: research only, no commercial;
      jumping, jump rope, no gym work. **Rokoko**: library lives inside the
      desktop app, not browsable on the web. **Bandai Namco**: CC BY-NC-ND,
      out. Any FBX/BVH goes through `extract_pose3d.py` then `convert_clip.py`.
      `from: owner, 2026-09-10 · "browse those sites and check ... free models for now"`

- [ ] **Case study on gtfoo.com** — `/products/exercise-anatomy`, three edits in
      the parent repo, once the site is live. The parent's own rules apply.
      `from: gtfoo AGENTS.md · case studies`

- [ ] **Why does the CMU head droop?** Every CMU conversion (lunge, jumping
      jacks, swim) had the skull tilted forward; the Mixamo squat did not.
      Masked with `convert_clip.py --head level|follow` (2026-09-11). The
      cause is in `extract_pose3d.py`'s rest alignment of the `head` bone:
      the CMU skeleton's head bone direction or its rest pose differs from
      ours, and the shoulder-line roll reference cannot fix pitch. Compare
      the CMU rest head bone (head -> tail) with ours (c7 -> skull) and add
      a pitch reference (the neck-to-head line) if they differ.
      `from: owner, 2026-09-11 · "the skull like dropping, like the neck is broken"`

## Done

- [x] **A jumping jack that jumps** (2026-09-11): CMU subject 13's take was
      a step-jack (hips moved 2 mm). Subject 14 take 6 hops about 10 cm;
      frames 64-96 replace it. No synthetic hop was added: the page shows
      captures, not inventions.
      `from: owner, 2026-09-11 · "the model isn't jumping??"`

- [x] **Pull-up back to the designed strict movement; lunge arms at rest**
      (2026-09-11). The captured playground pull-up (knees tucked, swing)
      was rejected: "a standard pull up, just up and down". The lunge's
      capture had the performer throwing punches; `convert_clip.py --arms
      rest` holds the arms at the sides.
      `from: owner, 2026-09-11`
- [x] **Captured pull-up, forward lunge and jumping jacks** (2026-09-10),
      all from CMU takes cut with the new `probe_clip.py` and converted onto
      the rig: 01_12 frames 117-213 (pull-up on a low playground bar, knees
      bent, said on the page), 144_17 frames 168-252, 13_29 frames 402-434.
      Both new exercises are qualitative. The extractor's root motion is now
      relative to the cycle start, which moved the swimmer's offset from
      0.08 to 0.216 to keep it at the surface.
      `from: owner, 2026-09-10 · "proceed with the downloads"`
- [x] **Option B chosen and applied to every page** (2026-09-10): the owner
      found A and B "similar" and asked for B on the pull-up and swim. One
      rigged figure (`figure-mixamo.glb`) plus a 50-70 KB clip file per
      exercise from `convert_clip.py`: the squat from its FBX, the pull-up
      from the designed kinematics (pronation and finger curl now in
      `designed_clip.py`), the swim from the CMU retarget. The lab page and
      the old model came out; `AnatomyFigure.tsx` stays as the fallback for
      an exercise without a converted clip.
      `from: owner, 2026-09-10 · "both look similar, can you apply to pull up and swimming?"`
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
