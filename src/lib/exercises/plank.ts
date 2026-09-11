import type { CurvePoint, Exercise } from "./types";

// Two Mixamo clips played in sequence: getting down from standing, through
// kneeling, into a straight-arm plank (4.9 s), then the plank held (3.0 s).
// They replaced a designed forearm hold on 2026-09-11. Activation is
// qualitative: nothing much works until the body is straight, then
// everything listed holds steadily.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const DOWN = 0.62; // where the hold begins
// Rises through the last part of getting down, then holds at v.
const HOLD = (v: number) => t([0, 0.1], [0.4, 0.2], [0.55, v * 0.8], [DOWN, v], [1, v]);

export const plank: Exercise = {
  slug: "plank",
  category: "Core",
  name: "Plank",
  durationMs: 7930, // both captured clips at their real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/plank.glb" },
  camera: { position: [3.4, 1.3, 1.6], target: [0, 0.45, 0.2] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is two motion-capture clips, getting down and then holding. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "get down", t0: 0, t1: DOWN },
    { name: "hold", t0: DOWN, t1: 1 },
  ],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Holds the hips up: the plank is this muscle's isometric.", curve: HOLD(0.85) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "prime-mover", note: "Deep brace that keeps the trunk a single rigid piece.", curve: HOLD(0.8) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace the sides and resist any twist.", curve: HOLD(0.65) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the spine from rounding.", curve: HOLD(0.45) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "synergist", note: "Keeps the hips extended in line with the trunk.", curve: HOLD(0.55) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Leg", role: "stabiliser", note: "Keeps the knees straight.", curve: HOLD(0.45) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Leg", role: "stabiliser", note: "Knee extension with rectus femoris.", curve: HOLD(0.4) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "synergist", note: "Holds the shoulders over the hands.", curve: HOLD(0.6) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "stabiliser", note: "Steadies the straight arms under the shoulders.", curve: HOLD(0.45) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "stabiliser", note: "Keeps the elbows locked.", curve: HOLD(0.5) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "stabiliser", note: "Keeps the shoulder blades flat on the ribcage.", curve: HOLD(0.45) },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "stabiliser", note: "Shoulder blade control with the middle trapezius.", curve: HOLD(0.4) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the wrists as the hands take the weight.", curve: HOLD(0.5) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Leg", role: "stabiliser", note: "Holds the ankles dorsiflexed on the toes.", curve: HOLD(0.4) },
  ],
};
