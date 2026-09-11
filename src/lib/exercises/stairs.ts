import type { CurvePoint, Exercise } from "./types";
import { shifted } from "./types";

// Four steps up a staircase from a Mixamo clip played twice with its travel
// carried over, converted bone for bone: the figure climbs 0.88 m in four
// strides and the staircase is drawn to that rise and run. Each leg steps up
// twice per cycle. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
const FOUR = (a: number, b: number): CurvePoint[] => t([0, b], [0.08, a], [0.18, b], [0.25, b], [0.33, a], [0.43, b], [0.5, b], [0.58, a], [0.68, b], [0.75, b], [0.83, a], [0.93, b], [1, b]);
const STEP_UP = FOUR(1, 0.35); // the stance leg lifts the body onto the next step
const PUSH = FOUR(0.85, 0.35);
const SWING = t([0, 0.4], [0.12, 0.4], [0.2, 0.8], [0.25, 0.4], [0.37, 0.4], [0.45, 0.8], [0.5, 0.4], [0.62, 0.4], [0.7, 0.8], [0.75, 0.4], [0.87, 0.4], [0.95, 0.8], [1, 0.4]);
const BRACE = t([0, 0.45], [0.5, 0.5], [1, 0.45]);

export const stairs: Exercise = {
  slug: "stairs",
  category: "Legs and hips",
  name: "Climbing stairs",
  durationMs: 2400, // the captured strides at their real tempo, twice
  anchor: "free",
  credit: "Mixamo (Adobe)",
  // The converted clip climbs 0.22 m and travels 0.227 m per step (leg-length scaled).
  scenery: { kind: "stairs", rise: 0.22, run: 0.227, count: 8, first: 0.16 },
  native: { clip: "/models/clips/stairs.glb" },
  camera: { position: [3.3, 2.0, 1.3], target: [0, 1.2, 0.6] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip played twice over and the staircase is drawn to its rise and run; nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "left step", t0: 0, t1: 0.25 },
    { name: "right step", t0: 0.25, t1: 0.5 },
    { name: "left step", t0: 0.5, t1: 0.75 },
    { name: "right step", t0: 0.75, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Knee", role: "prime-mover", note: "Straightens the knee to lift the body onto the step.", curve: STEP_UP, right: shifted(STEP_UP, 0.25) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Knee", role: "prime-mover", note: "Knee extension with the other vasti.", curve: STEP_UP, right: shifted(STEP_UP, 0.25) },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Knee", role: "prime-mover", note: "Deep knee extensor.", curve: STEP_UP, right: shifted(STEP_UP, 0.25) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Knee", role: "synergist", note: "Extends the knee and lifts the swinging leg to the next step.", curve: SWING, right: shifted(SWING, 0.25) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "prime-mover", note: "Extends the hip to drive the body up each step.", curve: STEP_UP, right: shifted(STEP_UP, 0.25) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Hip", role: "stabiliser", note: "Levels the pelvis on each single-leg step.", curve: FOUR(0.8, 0.35), right: shifted(FOUR(0.8, 0.35), 0.25) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hip", role: "synergist", note: "Helps extend the hip.", curve: FOUR(0.6, 0.3), right: shifted(FOUR(0.6, 0.3), 0.25) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Hip", role: "synergist", note: "Its hamstring-like part adds hip extension.", curve: FOUR(0.55, 0.3), right: shifted(FOUR(0.55, 0.3), 0.25) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Ankle", role: "prime-mover", note: "Pushes off the trailing foot.", curve: PUSH, right: shifted(PUSH, 0.25) },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Ankle", role: "prime-mover", note: "Pushes off the trailing foot.", curve: PUSH, right: shifted(PUSH, 0.25) },
    { id: "soleus", name: "Soleus", group: "Ankle", role: "synergist", note: "Push-off and ankle stiffness.", curve: PUSH, right: shifted(PUSH, 0.25) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Ankle", role: "synergist", note: "Lifts the toes over the next step.", curve: SWING, right: shifted(SWING, 0.25) },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Ankle", role: "stabiliser", note: "Steady the ankle from the outside against tibialis anterior.", curve: scaled(SWING, 0.8), right: scaled(shifted(SWING, 0.25), 0.8) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk upright on the lean.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk.", curve: BRACE },
  ],
};
