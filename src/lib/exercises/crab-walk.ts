import type { CurvePoint, Exercise } from "./types";

// The banded crab walk, designed (tools/myo/designed_clip.py) to the form
// at sweat.com/exercises/crab-walk (the owner's reference, 2026-09-19): a
// resistance band just above the knees, a half squat with the trunk leant
// forward, three side steps to the left (t 0-0.5) and the same three back
// to the right. The band is drawn between the knees. Activation is
// qualitative; the band's tension is not modelled.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const STEPS = 3;
// A level plus a ripple once per step. In the leftward half the left foot steps out first (phase 0 peaks
// then) and the right foot steps in half a step later; the rightward half is the leftward half reversed, so
// the same curve read backwards is right.
const step = (base: number, amp: number, phase: number): CurvePoint[] => {
  const pts: CurvePoint[] = [];
  for (let i = 0; i <= 48; i++) {
    const x = i / 48;
    const u = x <= 0.5 ? STEPS * 2 * x : STEPS * 2 * (1 - x);
    pts.push([x, Math.round((base + amp * Math.cos(2 * Math.PI * (u - phase))) * 100) / 100]);
  }
  return pts;
};
const HOLD = (v: number) => t([0, v], [1, v]);

export const crabWalk: Exercise = {
  slug: "crab-walk",
  category: "Legs and hips",
  name: "Crab walk",
  durationMs: 6000,
  anchor: "free",
  props: "band",
  native: { clip: "/models/clips/crab-walk.glb" },
  camera: { position: [0.6, 1.3, 3.4], target: [0, 0.7, 0] },
  disclaimer:
    "A band above the knees, three steps to the left and the same three back.",
  phases: [
    { name: "step left", t0: 0, t1: 0.5 },
    { name: "step right", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "gluteus-medius", name: "Gluteus medius", group: "Outer hip", role: "prime-mover", note: "The stepping leg pushes the foot out against the band; the standing leg holds the pelvis level and its knee out.", curve: step(0.75, 0.2, 0.1), right: step(0.75, 0.2, 0.6) },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Outer hip", role: "prime-mover", note: "Abduction with the medius.", curve: step(0.6, 0.2, 0.1), right: step(0.6, 0.2, 0.6) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Outer hip", role: "synergist", note: "Its upper fibres abduct and turn the thighs out against the band; it also holds the half squat.", curve: step(0.55, 0.15, 0.1), right: step(0.55, 0.15, 0.6) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Holds the half squat the whole time, most on the leg the body passes over.", curve: step(0.7, 0.15, 0.35), right: step(0.7, 0.15, 0.85) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Knee extension with the other vasti.", curve: step(0.7, 0.15, 0.35), right: step(0.7, 0.15, 0.85) },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "synergist", note: "Deep knee extensor.", curve: step(0.6, 0.15, 0.35), right: step(0.6, 0.15, 0.85) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Knee extension; lifts the stepping thigh a little.", curve: step(0.45, 0.15, 0.1), right: step(0.45, 0.15, 0.6) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "stabiliser", note: "Holds the hips back in the squat with the glutes.", curve: HOLD(0.4) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "stabiliser", note: "With biceps femoris.", curve: HOLD(0.35) },
    { id: "adductor-longus", name: "Adductor longus", group: "Inner thigh", role: "synergist", note: "Draws the trailing foot back in and steadies the knee; lengthened when the feet are widest.", curve: step(0.4, 0.2, 0.6), right: step(0.4, 0.2, 0.1), stretch: step(0.25, 0.2, 0.35), stretchRight: step(0.25, 0.2, 0.35) },
    { id: "gracilis", name: "Gracilis", group: "Inner thigh", role: "stabiliser", note: "Lengthened when the feet are widest.", curve: HOLD(0.2), stretch: step(0.25, 0.2, 0.35), stretchRight: step(0.25, 0.2, 0.35) },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "stabiliser", note: "Holds the shins over the feet in the squat.", curve: step(0.5, 0.1, 0.35), right: step(0.5, 0.1, 0.85) },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Lower leg", role: "stabiliser", note: "Keep the feet flat as the weight shifts sideways.", curve: step(0.45, 0.15, 0.35), right: step(0.45, 0.15, 0.85) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "stabiliser", note: "Lifts the toes of the stepping foot.", curve: step(0.35, 0.15, 0.1), right: step(0.35, 0.15, 0.6) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Holds the leant trunk flat through the whole walk.", curve: HOLD(0.65) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk.", curve: HOLD(0.4) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Keep the trunk from tipping as the weight shifts.", curve: step(0.4, 0.15, 0.35), right: step(0.4, 0.15, 0.85) },
  ],
};
