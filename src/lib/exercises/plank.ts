import type { CurvePoint, Exercise } from "./types";

// A designed forearm plank (tools/myo/designed_clip.py): a hold, elbows under
// the shoulders, body straight from the heels to the head. Designed because
// no free capture exists. Activation is qualitative and steady: nothing
// moves, everything listed is working the whole time.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const HOLD = (v: number) => t([0, v], [1, v]);

export const plank: Exercise = {
  slug: "plank",
  category: "Core",
  name: "Plank",
  durationMs: 4000,
  anchor: "free",
  native: { clip: "/models/clips/plank.glb" },
  camera: { position: [3.4, 1.2, 1.5], target: [0, 0.3, 0.85] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The position is designed, not captured, and held; nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [{ name: "hold", t0: 0, t1: 1 }],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Holds the hips up: the plank is this muscle's isometric.", curve: HOLD(0.85) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "prime-mover", note: "Deep brace that keeps the trunk a single rigid piece.", curve: HOLD(0.8) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace the sides and resist any twist.", curve: HOLD(0.65) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the spine from rounding.", curve: HOLD(0.45) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "synergist", note: "Keeps the hips extended in line with the trunk.", curve: HOLD(0.55) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Leg", role: "stabiliser", note: "Keeps the knees straight.", curve: HOLD(0.45) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Leg", role: "stabiliser", note: "Knee extension with rectus femoris.", curve: HOLD(0.4) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "synergist", note: "Holds the shoulders over the elbows.", curve: HOLD(0.6) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Shoulder", role: "stabiliser", note: "Steadies the shoulder girdle.", curve: HOLD(0.4) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the shoulder blades flat.", curve: HOLD(0.45) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "stabiliser", note: "Steadies the elbow on the floor.", curve: HOLD(0.35) },
  ],
};
