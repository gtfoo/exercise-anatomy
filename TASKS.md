# Tasks — exercise-anatomy

What this app owes. **Written only by the exercise-anatomy agent**; readable by
anyone. Tasks carry a `from:` pointer, because the reasoning usually lives in a
letter and a one-line task strands the *why*.

## Open

- [ ] **Go live: waiting on the Caddy host block.** Allocation granted and
      `out/` rsynced (37 files, 6.4 MB) on 2026-09-07; the droplet agent adds
      the block once told `out/` exists, which the reply of the same day does.
      Then the deploy workflow's real-DNS check turns green on its own. After
      that: the owner may overwrite `DROPLET_HOST`/`DROPLET_PORT` from
      `INFRA-PRIVATE.md` (precedent from rain-sg); the current values are the
      public hostname and a probed port 22.
      `from: droplet · MAIL-ARCHIVE.md#allocated`

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

- [x] OpenSim estimate folded into `squat.ts` (2026-09-07), after six CI runs:
      absolute paths; centre of pressure under the centre of mass; ground
      reaction from inverse dynamics rather than BodyKinematics (which reports
      free fall); rep analysed at the displayed 3.2 s tempo, which brought the
      pelvis reserves from 173 N to 20 N.
