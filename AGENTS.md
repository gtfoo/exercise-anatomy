<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Shared droplet contract

@~/Git/INFRA.md

## Correspondence and tasks

Live mail is in `MAIL.md`, closed mail and carbon copies in `MAIL-ARCHIVE.md`,
what this app owes in `TASKS.md`. None is imported — mail churns, and loaded
into every session it buries the rules below it. Read `MAIL.md` and `TASKS.md`
before starting work; an empty inbox is the read receipt. The letter format and
the flow are in `~/Git/COMMS.md`, read when writing, not from memory.

---

# Rules for this app

exercise-anatomy.gtfoo.com shows which muscles work, and when, through a
movement: one rep of a bodyweight squat on a rigged écorché, scrubbable, with
each named muscle coloured by activation and a focus mode that fades all but
the selected muscle and the skeleton. In focus mode faded muscles do not
write depth, so the selected muscle is visible from every angle through
every other muscle; only bone may hide it (owner's rule, 2026-09-11). Educational; it says so on the page.

## Three provenances, and the UI must never blur them

Every muscle curve is one of:

- **qualitative** — a role (prime mover / synergist / stabiliser) and a curve
  shaped to it by hand. No `source`. The panel prints "Qualitative — not
  measured" and never a number.
- **estimated** — static optimisation on a published musculoskeletal model,
  from the motion shown: OpenSim (`tools/opensim`, lower limb only) is what
  the squat displays. MyoFullBody in MuJoCo (`tools/myo`, whole body, 416
  muscles) runs but is NOT displayed: its first results saturated muscles
  that cannot be maximal in a bodyweight squat and jittered, and the owner
  saw it at once (2026-09-10). It stays a tool until its curves are credible;
  `TASKS.md` says what that needs. `source.measure` is `estimated-activation`;
  the panel prints "Estimated, not measured" with the citation, and
  `conditions` carries the reserve torques, which say how far the model was
  from able to do the movement. Muscles no displayed model has (the whole
  trunk, arms and shoulders today) stay qualitative.
- **measured** — `%MVIC` from a cited EMG study *with the conditions it was
  measured under*. None yet. Do not add a percentage without both.

The rule exists because the first honest version of this app rendered "role
bands" and it would have been trivial to fake precision with a number that
looked measured. A curve's colour on the figure is the same ramp regardless of
provenance; the words under it are what tell the reader.

## Licences are part of the build, not a footnote

- The model is BodyParts3D via Z-Anatomy, **CC BY-SA**. The attribution lines in
  the panel footer are required text; the adapted model is share-alike, so it
  can never be made proprietary. Keep the wording as the sources specify it.
- The movement is a **Mixamo** clip. Mixamo allows embedding in a project and
  forbids redistributing the raw file, so `tools/mocap/in/` is gitignored and
  only the derived joint angles (`src/lib/motion/`) are shipped, credited in the
  footer. Never commit an FBX.
- The OpenSim model is MIT; cite Rajagopal 2016, Lai 2017 and Uhlrich 2022.
  MyoFullBody is Apache-2.0 from `amathislab/musclemimic_models` (MyoSuite
  parts); the estimate's `model` string names it and the panel shows that.

## Pipelines are scripts, and two of them cannot run here

`tools/blender/` builds the figure from the atlas, rebinds it to a Mixamo
skeleton (`build_mixamo_rig.py`, once) and converts every clip onto that
skeleton (`convert_clip.py`, one small GLB per exercise in
`public/models/clips/`); the site plays those with a mixer and no
retargeting. `tools/mocap/` turns a captured clip into angles or a
`MotionClip3D` for our rig, which `convert_clip.py` accepts; `tools/myo/`
estimates whole-body activation (MuJoCo, runs in WSL); `tools/opensim/` is
the lower-limb estimate the squat displays. All are re-runnable
and documented in their own READMEs. This laptop is ARM64: Blender runs from
the Windows ARM64 build in `C:\Users\gtfoo\tools\blender\`, and OpenSim has
no ARM64 build at all, so it runs in GitHub Actions (`.github/workflows/
opensim.yml`) and pushes results to the `opensim/squat` branch for review.

Two traps that cost real time: three.js strips `.` from glTF node names
(`thigh.L` arrives as `thighL`), and `gltf-transform optimize` joins meshes
that share a material unless `--join false`, which folds all 21 named muscles
into one anonymous mesh.

## It is a static site, on purpose

`output: "export"`. No database, no API routes, no server actions — the whole
app is `out/` and a 4.7 MB model, served by Caddy with no process on the box.
Do not add a feature that needs a server without reopening that decision with
the droplet agent; it is what makes this the cheapest app in the fleet.

Dev servers bind **3960-3969**, this app's block in `INFRA.md` (allocated
2026-09-07; 3960 is the one in `.claude/launch.json`, which is this repo's,
not gtfoo's). Nothing is served on a port: the site is `exercise-anatomy.gtfoo.com`,
a Caddy `file_server` over `/home/deploy/exercise-anatomy/out`, shipped by
`.github/workflows/deploy.yml` with rsync as `deploy`.

## Never `git add -A`

Stage paths explicitly and read what you stage. `tools/*/vendor`, `tools/*/out`
and `tools/mocap/in` are gitignored for licence and size reasons; the commit
scripts refuse if any of them appear in the index.
