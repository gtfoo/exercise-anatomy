import type { CurvePoint, Exercise } from "./types";
import { shifted } from "./types";

// One bicycle-crunch cycle (both sides) from a Mixamo clip, converted bone for
// bone: lying on the back, elbow to the opposite knee as the other leg
// extends, then the other way. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
const TWO = (a: number, b: number): CurvePoint[] => t([0, b], [0.12, a], [0.3, b], [0.5, b], [0.62, a], [0.8, b], [1, b]);
const CRUNCH = t([0, 0.5], [0.15, 0.95], [0.35, 0.6], [0.5, 0.5], [0.65, 0.95], [0.85, 0.6], [1, 0.5]);
const TWIST = TWO(1, 0.45);
const HIPFLEX = t([0, 0.6], [0.5, 0.65], [1, 0.6]); // both legs are held off the floor throughout
const BRACE = t([0, 0.6], [0.5, 0.65], [1, 0.6]);

export const bicycleCrunch: Exercise = {
  slug: "bicycle-crunch",
  category: "Core",
  name: "Bicycle crunch",
  durationMs: 1100, // the captured cycle at its real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/bicycle-crunch.glb" },
  camera: { position: [2.5, 1.7, 1.9], target: [0, 0.3, 0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "left elbow to right knee", t0: 0, t1: 0.5 },
    { name: "right elbow to left knee", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Curls the trunk up off the floor on every rep.", curve: CRUNCH },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Twist the trunk to bring the elbow across to the opposite knee.", curve: TWIST, right: shifted(TWIST, 0.5) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: TWIST, right: shifted(TWIST, 0.5) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the lower back to the floor.", curve: BRACE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip", role: "synergist", note: "Holds the legs up and draws each knee in.", curve: HIPFLEX, right: shifted(HIPFLEX, 0.5) },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip", role: "synergist", note: "Helps flex the hip on the knee that comes in.", curve: HIPFLEX, right: shifted(HIPFLEX, 0.5) },
    { id: "pectineus", name: "Pectineus", group: "Hip", role: "synergist", note: "Adducts and flexes the hip with adductor longus.", curve: scaled(HIPFLEX, 0.8), right: scaled(shifted(HIPFLEX, 0.5), 0.8) },
    { id: "gracilis", name: "Gracilis", group: "Hip", role: "synergist", note: "Adducts the hip along the inner thigh.", curve: scaled(HIPFLEX, 0.7), right: scaled(shifted(HIPFLEX, 0.5), 0.7) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Leg", role: "synergist", note: "Straightens the leg that extends out.", curve: TWO(0.8, 0.35), right: shifted(TWO(0.8, 0.35), 0.5) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Leg", role: "synergist", note: "Bends the knee that comes in.", curve: TWO(0.7, 0.3), right: shifted(TWO(0.7, 0.3), 0.5) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Leg", role: "stabiliser", note: "Holds the feet flexed.", curve: BRACE },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Leg", role: "stabiliser", note: "Steady the ankle from the outside against tibialis anterior.", curve: scaled(BRACE, 0.8) },
  ],
};
