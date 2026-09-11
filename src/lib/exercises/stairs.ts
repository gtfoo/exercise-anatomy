import type { CurvePoint, Exercise } from "./types";

// Two steps up a staircase from a Mixamo clip, converted bone for bone with
// its travel kept: the figure climbs 0.5 m in two strides and the staircase
// is drawn to that rise and run. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const TWO = (a: number, b: number): CurvePoint[] => t([0, b], [0.15, a], [0.35, b], [0.5, b], [0.65, a], [0.85, b], [1, b]);
const STEP_UP = TWO(1, 0.35); // the stance leg lifts the body onto the next step
const PUSH = TWO(0.85, 0.35);
const SWING = t([0, 0.4], [0.25, 0.4], [0.4, 0.8], [0.5, 0.4], [0.75, 0.4], [0.9, 0.8], [1, 0.4]);
const BRACE = t([0, 0.45], [0.5, 0.5], [1, 0.45]);

export const stairs: Exercise = {
  slug: "stairs",
  name: "Climbing stairs",
  durationMs: 1200, // the captured strides at their real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  // The converted clip climbs 0.44 m and travels 0.45 m in two strides (leg-length scaled).
  scenery: { kind: "stairs", rise: 0.22, run: 0.227, count: 8, first: 0.16 },
  native: { clip: "/models/clips/stairs.glb" },
  camera: { position: [2.9, 1.7, 1.6], target: [0, 1.0, 0.4] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip and the staircase is drawn to its rise and run; nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "left step", t0: 0, t1: 0.5 },
    { name: "right step", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Knee", role: "prime-mover", note: "Straightens the knee to lift the body onto the step.", curve: STEP_UP },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Knee", role: "prime-mover", note: "Knee extension with the other vasti.", curve: STEP_UP },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Knee", role: "prime-mover", note: "Deep knee extensor.", curve: STEP_UP },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Knee", role: "synergist", note: "Extends the knee and lifts the swinging leg to the next step.", curve: SWING },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "prime-mover", note: "Extends the hip to drive the body up each step.", curve: STEP_UP },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Hip", role: "stabiliser", note: "Levels the pelvis on each single-leg step.", curve: TWO(0.8, 0.35) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hip", role: "synergist", note: "Helps extend the hip.", curve: TWO(0.6, 0.3) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Hip", role: "synergist", note: "Its hamstring-like part adds hip extension.", curve: TWO(0.55, 0.3) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius", group: "Ankle", role: "prime-mover", note: "Pushes off the trailing foot.", curve: PUSH },
    { id: "soleus", name: "Soleus", group: "Ankle", role: "synergist", note: "Push-off and ankle stiffness.", curve: PUSH },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Ankle", role: "synergist", note: "Lifts the toes over the next step.", curve: SWING },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk upright on the lean.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk.", curve: BRACE },
  ],
};
