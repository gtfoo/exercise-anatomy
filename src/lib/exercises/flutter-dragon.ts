import type { CurvePoint, Exercise } from "./types";

// Flutter kicks and the dragon flag, designed (tools/myo/designed_clip.py's flutter_kicks_sample and
// dragon_flag_sample, owner's request 2026-11-15). Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const FLAT = (v: number) => t([0, v], [1, v]);
const scale = (c: CurvePoint[], k: number, floor = 0): CurvePoint[] => c.map(([x, v]) => [x, Math.max(floor, v * k)]);

// Two scissors a loop: each leg rises at t 0.125 and 0.625 (the left) or 0.375 and 0.875 (the right).
const LIFT_L = t([0, 0.7], [0.125, 0.9], [0.25, 0.7], [0.375, 0.6], [0.5, 0.7], [0.625, 0.9], [0.75, 0.7], [0.875, 0.6], [1, 0.7]);
const LIFT_R = t([0, 0.7], [0.125, 0.6], [0.25, 0.7], [0.375, 0.9], [0.5, 0.7], [0.625, 0.6], [0.75, 0.7], [0.875, 0.9], [1, 0.7]);

export const flutterKicks: Exercise = {
  slug: "flutter-kicks",
  category: "Core",
  name: "Flutter kicks",
  durationMs: 1600,
  anchor: "free",
  native: { clip: "/models/clips/flutter-kicks.glb" },
  camera: { position: [3.0, 1.2, 1.4], target: [0, 0.25, 0.3] },
  disclaimer:
    "Lying on the back, the head lifted a little to look along the body, the hands by the hips, the lower back pressed to the floor. The straight legs hover just off the floor and scissor in small alternating kicks, the toes pointed.",
  phases: [
    { name: "left up", t0: 0, t1: 0.25 },
    { name: "right up", t0: 0.25, t1: 0.5 },
    { name: "left up", t0: 0.5, t1: 0.75 },
    { name: "right up", t0: 0.75, t1: 1 },
  ],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Abdominals", role: "prime-mover", note: "Holds the pelvis tipped back and the lower back on the floor against the pull of the legs.", curve: FLAT(0.85) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Abdominals", role: "synergist", note: "Braces the waist so the back does not arch.", curve: FLAT(0.7) },
    { id: "external-obliques", name: "External obliques", group: "Abdominals", role: "stabiliser", note: "Steady the pelvis as the legs alternate.", curve: FLAT(0.5) },
    { id: "internal-obliques", name: "Internal obliques", group: "Abdominals", role: "stabiliser", note: "Steady the pelvis with the external obliques.", curve: FLAT(0.45) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip flexors", role: "prime-mover", note: "Holds each straight leg off the floor and lifts it in its kick.", curve: LIFT_L, right: LIFT_R },
    { id: "pectineus", name: "Pectineus", group: "Hip flexors", role: "synergist", note: "Helps flex the hip to hold the leg up.", curve: scale(LIFT_L, 0.7), right: scale(LIFT_R, 0.7) },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip flexors", role: "synergist", note: "Helps hold the legs up and close together.", curve: scale(LIFT_L, 0.6), right: scale(LIFT_R, 0.6) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "stabiliser", note: "Keeps the knee straight.", curve: FLAT(0.4) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "stabiliser", note: "Keeps the knee straight with the lateralis.", curve: FLAT(0.4) },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Neck", role: "stabiliser", note: "Helps hold the head up off the floor.", curve: FLAT(0.35) },
  ],
};

// Lowered slowly from high (t 0-0.6), held just above the bench (to 0.7), raised (to 1): hardest near the bench,
// where the body's weight acts furthest from the pivot.
const LOWER = t([0, 0.45], [0.3, 0.75], [0.6, 1], [0.7, 1], [0.85, 0.85], [1, 0.45]);

export const dragonFlag: Exercise = {
  slug: "dragon-flag",
  category: "Core",
  name: "Dragon flag",
  durationMs: 4000,
  anchor: "free",
  native: { clip: "/models/clips/dragon-flag.glb" },
  scenery: { kind: "bench", top: 0.45, length: 1.2, z: -0.25 }, // designed_clip.py's DRAGON_BENCH
  camera: { position: [3.2, 1.4, 1.2], target: [0, 0.85, 0.0] },
  disclaimer:
    "Lying on a bench, gripping it beside the head. The body is held straight as a board from the upper back to the toes, raised high, then lowered slowly as one piece, pivoting on the upper back, until it hovers just above the bench, and raised again. The hips do not bend.",
  phases: [
    { name: "lower", t0: 0, t1: 0.6 },
    { name: "hover", t0: 0.6, t1: 0.7 },
    { name: "raise", t0: 0.7, t1: 1 },
  ],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Abdominals", role: "prime-mover", note: "Holds the body straight against its own weight, lengthening under load on the way down; hardest as it nears the bench.", curve: LOWER },
    { id: "external-obliques", name: "External obliques", group: "Abdominals", role: "synergist", note: "Brace with the rectus to keep the trunk rigid.", curve: scale(LOWER, 0.8, 0.3) },
    { id: "internal-obliques", name: "Internal obliques", group: "Abdominals", role: "synergist", note: "Brace the trunk with the external obliques.", curve: scale(LOWER, 0.75, 0.3) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Abdominals", role: "synergist", note: "Braces the waist so the lower back does not sag.", curve: scale(LOWER, 0.8, 0.35) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back and arms", role: "prime-mover", note: "Pulls the arms down against the bench to hold the body up from the shoulders.", curve: scale(LOWER, 0.9, 0.4) },
    { id: "teres-major", name: "Teres major", group: "Back and arms", role: "synergist", note: "Pulls with the latissimus.", curve: scale(LOWER, 0.75, 0.3) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Back and arms", role: "synergist", note: "Crosses the shoulder: helps pull the arms down against the bench.", curve: scale(LOWER, 0.6, 0.3) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Back and arms", role: "stabiliser", note: "Grip the bench.", curve: FLAT(0.6) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips and legs", role: "stabiliser", note: "Keeps the hips straight so the body does not fold.", curve: scale(LOWER, 0.6, 0.3) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hips and legs", role: "stabiliser", note: "Holds the legs in line and the knees straight.", curve: scale(LOWER, 0.6, 0.3) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Co-contracts with the abdominals to hold the spine straight.", curve: FLAT(0.35) },
  ],
};
