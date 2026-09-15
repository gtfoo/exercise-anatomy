import type { CurvePoint, Exercise } from "./types";

// A glute bridge rep, a hanging leg raise rep and a hollow hold, designed
// (tools/myo/designed_clip.py). Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const DISCLAIMER =
  "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured. Nothing here is estimated or measured. Educational illustration, not training or medical advice.";
const HOLD = (v: number) => t([0, Math.min(v, 0.15)], [0.4, v], [0.75, v], [1, Math.min(v, 0.15)]);

export const gluteBridge: Exercise = {
  slug: "glute-bridge",
  category: "Core",
  name: "Glute bridge",
  durationMs: 2600,
  anchor: "free",
  native: { clip: "/models/clips/glute-bridge.glb" },
  camera: { position: [2.8, 1.1, 2.0], target: [0, 0.3, -0.05] },
  disclaimer: DISCLAIMER,
  phases: [
    { name: "lift", t0: 0, t1: 0.5 },
    { name: "lower", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Lifts the hips to a line from the knees to the shoulders.", curve: t([0, 0.3], [0.3, 0.8], [0.5, 1], [0.7, 0.7], [1, 0.3]) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "synergist", note: "Keeps the knees from falling in.", curve: t([0, 0.25], [0.5, 0.55], [1, 0.25]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Hip extension with the glutes, through the planted heels.", curve: t([0, 0.3], [0.5, 0.7], [1, 0.3]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension with biceps femoris.", curve: t([0, 0.3], [0.5, 0.65], [1, 0.3]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk straight from the shoulders.", curve: t([0, 0.3], [0.5, 0.5], [1, 0.3]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Tucks the ribs so the lift comes from the hips, not the back.", curve: t([0, 0.3], [0.5, 0.55], [1, 0.3]) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "stabiliser", note: "Lengthened at the top with the hips fully extended.", curve: t([0, 0.15], [1, 0.15]), stretch: t([0, 0.05], [0.5, 0.5], [1, 0.05]) },
    { id: "pectineus", name: "Pectineus", group: "Hips", role: "stabiliser", note: "Lengthened at the top with rectus femoris.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.05], [0.5, 0.4], [1, 0.05]) },
  ],
};

export const hangingLegRaise: Exercise = {
  slug: "hanging-leg-raise",
  category: "Core",
  name: "Hanging leg raise",
  durationMs: 3400,
  anchor: "hands",
  barHeight: 2.3,
  native: { clip: "/models/clips/hanging-leg-raise.glb" },
  camera: { position: [3.4, 2.0, 2.0], target: [0, 1.5, 0.2] },
  disclaimer: DISCLAIMER,
  phases: [
    { name: "raise", t0: 0, t1: 0.45 },
    { name: "top", t0: 0.45, t1: 0.6 },
    { name: "lower", t0: 0.6, t1: 1 },
  ],
  muscles: [
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip flexors", role: "prime-mover", note: "Flexes the hips to lift the straight legs.", curve: t([0, 0.25], [0.25, 0.8], [0.45, 1], [0.6, 0.95], [0.8, 0.6], [1, 0.25]) },
    { id: "pectineus", name: "Pectineus", group: "Hip flexors", role: "synergist", note: "Hip flexion with rectus femoris.", curve: t([0, 0.2], [0.25, 0.7], [0.45, 0.85], [0.6, 0.8], [0.8, 0.5], [1, 0.2]) },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip flexors", role: "synergist", note: "Hip flexion and keeps the legs together.", curve: t([0, 0.2], [0.25, 0.6], [0.45, 0.75], [0.6, 0.7], [0.8, 0.45], [1, 0.2]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Tilts the pelvis back at the top: the part that makes it an abdominal exercise.", curve: t([0, 0.3], [0.3, 0.6], [0.45, 1], [0.6, 1], [0.8, 0.6], [1, 0.3]) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Pelvic tilt and brace with rectus abdominis.", curve: t([0, 0.3], [0.45, 0.8], [0.6, 0.8], [1, 0.3]) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace with the external obliques.", curve: t([0, 0.3], [0.45, 0.7], [0.6, 0.7], [1, 0.3]) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Locks the knees straight.", curve: t([0, 0.3], [0.45, 0.6], [0.6, 0.6], [1, 0.3]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Legs", role: "stabiliser", note: "On stretch behind the straight, lifted legs.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.05], [0.45, 0.8], [0.6, 0.8], [1, 0.05]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Legs", role: "stabiliser", note: "On stretch with biceps femoris.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.05], [0.45, 0.8], [0.6, 0.8], [1, 0.05]) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Hang", role: "stabiliser", note: "Holds the shoulders packed in the hang.", curve: t([0, 0.5], [0.45, 0.6], [1, 0.5]) },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Hang", role: "stabiliser", note: "Keeps the shoulder blades down in the hang.", curve: t([0, 0.45], [1, 0.45]) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Hang", role: "stabiliser", note: "Grip the bar.", curve: t([0, 0.7], [1, 0.7]) },
  ],
};

export const hollowHold: Exercise = {
  slug: "hollow-hold",
  category: "Core",
  name: "Hollow hold",
  durationMs: 6000,
  anchor: "free",
  native: { clip: "/models/clips/hollow-hold.glb" },
  camera: { position: [3.0, 1.2, 1.8], target: [0, 0.3, 0.1] },
  disclaimer: DISCLAIMER + " Entered from lying flat, held, released.",
  phases: [
    { name: "lift", t0: 0, t1: 0.4 },
    { name: "hold", t0: 0.4, t1: 0.75 },
    { name: "release", t0: 0.75, t1: 1 },
  ],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Curls the trunk and presses the lower back into the floor: the hollow.", curve: HOLD(0.95) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace holding the shape.", curve: HOLD(0.8) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace the sides.", curve: HOLD(0.65) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace with the external obliques.", curve: HOLD(0.6) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "prime-mover", note: "Holds the straight legs just off the floor.", curve: HOLD(0.75) },
    { id: "pectineus", name: "Pectineus", group: "Hips", role: "synergist", note: "Hip flexion with rectus femoris.", curve: HOLD(0.6) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Locks the knees.", curve: HOLD(0.45) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "stabiliser", note: "Holds the arms overhead just off the floor.", curve: HOLD(0.45) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Arms", role: "stabiliser", note: "Lengthened with the arms overhead.", curve: HOLD(0.2), stretch: HOLD(0.5) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Lengthened as the back rounds into the floor.", curve: HOLD(0.1), stretch: HOLD(0.45) },
  ],
};
