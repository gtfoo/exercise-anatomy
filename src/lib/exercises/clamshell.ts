import type { CurvePoint, Exercise } from "./types";

// A designed clamshell (tools/myo/designed_clip.py): lying on the left side,
// hips bent 45 and knees 90 with the feet together, the top (right) knee
// opens 40 degrees and closes while the pelvis stays still. Designed because
// no free capture exists. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Abductors and external rotators: work through the opening, hold, and control the close.
const OPEN = t([0, 0.2], [0.2, 0.7], [0.42, 1], [0.58, 0.95], [0.8, 0.6], [0.95, 0.25], [1, 0.2]);
const BRACE = t([0, 0.3], [0.42, 0.5], [0.58, 0.5], [1, 0.3]);

export const clamshell: Exercise = {
  slug: "clamshell",
  category: "Legs and hips",
  name: "Clamshell",
  durationMs: 3000,
  anchor: "free",
  native: { clip: "/models/clips/clamshell.glb" },
  // The body lies along X, head toward +X; look at it from the front, a little above.
  camera: { position: [-0.3, 0.9, 3.0], target: [0, 0.3, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured. The tensor fasciae latae and the deep rotators (piriformis and the gemelli) are not modelled in the atlas. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "open", t0: 0, t1: 0.42 },
    { name: "hold", t0: 0.42, t1: 0.58 },
    { name: "close", t0: 0.58, t1: 1 },
  ],
  muscles: [
    // The top leg is the right one: the work is on the right side; the bottom (left) hip only rests on the floor.
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "prime-mover", note: "Abducts and externally rotates the top (right) hip to open the knee; the muscle the exercise is for.", curve: t([0, 0.2], [1, 0.2]), right: OPEN },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Gluteals", role: "prime-mover", note: "Works under gluteus medius on the same movement, top side.", curve: t([0, 0.15], [1, 0.15]), right: OPEN },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "synergist", note: "Its upper fibres help rotate the top hip outward.", curve: t([0, 0.1], [1, 0.1]), right: t([0, 0.15], [0.42, 0.6], [0.58, 0.55], [1, 0.15]) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Keep the pelvis from rolling back as the knee opens.", curve: BRACE },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "stabiliser", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk with the obliques.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace that holds the pelvis still.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keep the spine neutral on the side.", curve: BRACE },
    { id: "adductor-longus", name: "Adductor longus", group: "Bottom leg", role: "stabiliser", note: "Holds the bottom (left) leg still as a base.", curve: BRACE, right: t([0, 0.15], [1, 0.15]) },
    { id: "pectineus", name: "Pectineus", group: "Bottom leg", role: "synergist", note: "Adducts and flexes the hip with adductor longus.", curve: scaled(BRACE, 0.8), right: scaled(t([0, 0.15], [1, 0.15]), 0.8) },
    { id: "gracilis", name: "Gracilis", group: "Bottom leg", role: "synergist", note: "Adducts the hip along the inner thigh.", curve: scaled(BRACE, 0.7), right: scaled(t([0, 0.15], [1, 0.15]), 0.7) },
  ],
};
