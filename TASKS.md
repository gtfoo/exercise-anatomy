# Tasks — exercise-anatomy

What this app owes. **Written only by the exercise-anatomy agent**; readable by
anyone. Tasks carry a `from:` pointer, because the reasoning usually lives in a
letter and a one-line task strands the *why*.

## Open

- [ ] **Deploy to `exercise-anatomy.gtfoo.com` as a static site.** Allocation
      requested from the droplet agent 2026-09-07 (hostname, static shape via
      Caddy `file_server`, dev block, deploy key). Then: Actions secrets, the
      deploy workflow (build on a Node 22 runner, rsync `out/`), and the §9
      verification — a static asset and the model return 200 over real DNS.
      `from: owner, 2026-09-07 · ~/Git/MAIL.md#allocation`

- [ ] **Fold the OpenSim estimate into `squat.ts`** once a CI run reports
      small reserve peaks. The merge helper exists (`src/lib/exercises/
      estimated.ts`); the workflow pushes `src/lib/activation/` to the
      `opensim/squat` branch for review. Trunk muscles stay qualitative.
      `from: owner, 2026-09-07 · tools/opensim/README.md`

- [ ] **Per-joint blend width in the figure build.** The owner spotted the
      fibula head and femoral condyle poking through the lateral gastrocnemius
      at deep knee flexion: linear-blend skinning thins a two-joint muscle where
      it wraps a bent joint while the bone stays rigid. The 8 cm blend that
      cured the glute crease is too wide at the knee; make `BLEND_WIDTH` per
      joint (hip wide, knee and ankle narrow) in `tools/blender/build_figure.py`
      and rebuild.
      `from: owner, 2026-09-07 · screenshot at 39% of the rep`

- [ ] **Case study on gtfoo.com** — `/products/exercise-anatomy`, three edits in
      the parent repo, once the site is live. The parent's own rules apply.
      `from: gtfoo AGENTS.md · case studies`
