import type { CurvePoint, Exercise } from "./types";

// Overhead dumbbell triceps extensions, designed (tools/myo/designed_clip.py's overhead_triceps_*_sample, owner's
// request 2026-11-15): standing, the upper arm held up beside the head while only the elbow bends, the dumbbell
// lowered behind the head (t 0-0.45), a moment at the bottom, and pressed back to straight arms. With the arm
// overhead the triceps' long head, which crosses the shoulder, is stretched further than in any other triceps
// exercise; it is loaded hardest from the bottom. The load is not modelled. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const scale = (c: CurvePoint[], k: number, floor = 0): CurvePoint[] => c.map(([x, v]) => [x, Math.max(floor, v * k)]);
const FLAT = (v: number) => t([0, v], [1, v]);
// Lowering (eccentric), held at the bottom, then pressed: hardest out of the bottom.
const EXTEND = t([0, 0.35], [0.25, 0.6], [0.45, 0.85], [0.55, 1], [0.75, 0.85], [1, 0.35]);
// The long head lengthens as the elbow bends with the arm overhead.
const LONG = t([0, 0.35], [0.45, 1], [0.55, 1], [1, 0.35]);
const HOLD_UP = t([0, 0.5], [0.5, 0.6], [1, 0.5]);
const PHASES = [
  { name: "lower", t0: 0, t1: 0.45 },
  { name: "bottom", t0: 0.45, t1: 0.55 },
  { name: "press", t0: 0.55, t1: 1 },
];

const extension = (slug: string, name: string, props: Exercise["props"], disclaimer: string, muscles: Exercise["muscles"]): Exercise => ({
  slug,
  category: "Weights",
  name,
  durationMs: 2600,
  anchor: "free",
  props,
  native: { clip: `/models/clips/${slug}.glb` },
  camera: { position: [2.6, 1.6, 1.6], target: [0, 1.35, -0.05] },
  disclaimer,
  phases: PHASES,
  muscles,
});

export const overheadTricepsExtension = extension(
  "overhead-triceps-extension",
  "Overhead triceps extension",
  "overhead-dumbbell",
  "Two hands, one dumbbell: standing tall, the dumbbell held upright above the head with the palms cupped under its top plate. The elbows bend to lower it behind the head, the upper arms staying still and pointing up, and straighten to press it back.",
  [
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Straightens the elbow; with the arm overhead it is stretched further than in any other triceps exercise, and loaded hardest from the bottom.", curve: EXTEND, stretch: LONG },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Elbow extension with the long head.", curve: EXTEND },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extension, working through the whole range.", curve: EXTEND },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "stabiliser", note: "Holds the upper arms up beside the head.", curve: HOLD_UP },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the shoulder blades up and turned under the raised arms.", curve: HOLD_UP },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "stabiliser", note: "Turns the shoulder blades up so the arms can stay overhead.", curve: HOLD_UP },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Lengthened with the arms overhead; it steadies the shoulder against the weight behind the head.", curve: FLAT(0.25), stretch: FLAT(0.6) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the dumbbell's top plate in the cupped palms.", curve: FLAT(0.45) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the ribs down so the lower back does not arch under the weight overhead.", curve: scale(EXTEND, 0.5, 0.3) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk tall.", curve: FLAT(0.35) },
  ],
);

// One arm, the right: each curve is the left side's, `right` the right's.
export const oneArmOverheadTricepsExtension = extension(
  "one-arm-overhead-triceps-extension",
  "One-arm overhead triceps extension",
  "dumbbell",
  "One arm, the right: standing tall, the dumbbell above the head in a neutral grip, the left hand on the hip. The elbow bends to lower it behind the head, the upper arm staying still beside the head, and straightens to press it back. One side shown.",
  [
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Straightens the right elbow; with the arm overhead it is stretched furthest, and loaded hardest from the bottom.", curve: FLAT(0.05), right: EXTEND, stretchRight: LONG },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Elbow extension with the long head.", curve: FLAT(0.05), right: EXTEND },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extension through the whole range.", curve: FLAT(0.05), right: EXTEND },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "stabiliser", note: "Holds the right upper arm up beside the head.", curve: FLAT(0.1), right: HOLD_UP },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the right shoulder blade up under the raised arm.", curve: FLAT(0.15), right: HOLD_UP },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "stabiliser", note: "Turns the right shoulder blade up so the arm can stay overhead.", curve: FLAT(0.1), right: HOLD_UP },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the dumbbell.", curve: FLAT(0.1), right: FLAT(0.5) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Keep the trunk from leaning away from the weight on one side.", curve: scale(EXTEND, 0.5, 0.25), right: scale(EXTEND, 0.35, 0.2) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the ribs down so the lower back does not arch.", curve: scale(EXTEND, 0.45, 0.3) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk tall.", curve: FLAT(0.35) },
  ],
);
