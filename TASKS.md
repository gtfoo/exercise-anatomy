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

- [ ] **Extractor: read the elbow.** `tools/mocap/extract_angles.py` measures
      four angles; a captured pull-up needs elbow flexion too (and the foot).
      `Pose` already carries both.
      `from: exercise-anatomy, 2026-09-08 · pull-up kinematics are designed, not captured`

- [ ] **Case study on gtfoo.com** — `/products/exercise-anatomy`, three edits in
      the parent repo, once the site is live. The parent's own rules apply.
      `from: gtfoo AGENTS.md · case studies`

## Done

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
