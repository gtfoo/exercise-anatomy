import type { CurvePoint, Exercise } from "./types";

// A designed dumbbell lateral raise (tools/myo/designed_clip.py): standing,
// dumbbells at the sides, arms raised to shoulder height in the scapular
// plane with a soft elbow, palms ending face down, lowered under control.
// Designed because no free capture exists. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Abductors: rising through the lift, hardest near the top, still working on the way down.
const LIFT = t([0, 0.2], [0.2, 0.6], [0.45, 1], [0.55, 0.95], [0.75, 0.7], [0.95, 0.25], [1, 0.2]);
const START = t([0, 0.4], [0.15, 0.8], [0.45, 0.6], [0.55, 0.55], [1, 0.4]); // the supraspinatus starts the movement
const SCAPULA = t([0, 0.3], [0.45, 0.8], [0.55, 0.8], [1, 0.3]);
const BRACE = t([0, 0.35], [0.45, 0.5], [0.55, 0.5], [1, 0.35]);

export const lateralRaise: Exercise = {
  slug: "lateral-raise",
  category: "Weights",
  name: "Dumbbell lateral raise",
  durationMs: 3000,
  anchor: "free",
  props: "dumbbells",
  native: { clip: "/models/clips/lateral-raise.glb" },
  camera: { position: [0.6, 1.5, 3.2], target: [0, 1.05, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "raise", t0: 0, t1: 0.45 },
    { name: "top", t0: 0.45, t1: 0.55 },
    { name: "lower", t0: 0.55, t1: 1 },
  ],
  muscles: [
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "prime-mover", note: "Lifts the arm out to the side; the muscle the exercise is for.", curve: LIFT },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "synergist", note: "Rotator cuff: starts the lift and keeps the humeral head seated.", curve: START },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "synergist", note: "Adds to the lift as the arm comes a little forward of the body.", curve: LIFT },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(LIFT, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(LIFT, 0.5) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "stabiliser", note: "Steadies the shoulder from behind.", curve: BRACE },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder blade", role: "synergist", note: "Rotates the shoulder blade upward as the arm passes horizontal.", curve: SCAPULA },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Shoulder blade", role: "synergist", note: "Upward rotation with the upper fibres, and keeps the blade down.", curve: SCAPULA },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder blade", role: "stabiliser", note: "Holds the shoulder blade against the ribcage.", curve: BRACE },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, keeping the joint centred under load.", curve: BRACE },
    { id: "subscapularis", name: "Subscapularis", group: "Shoulder", role: "stabiliser", note: "The front of the rotator cuff: holds the humeral head in the socket under load.", curve: BRACE },
    { id: "teres-minor", name: "Teres minor", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, with infraspinatus.", curve: BRACE },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the dumbbells.", curve: BRACE },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(BRACE, 0.6) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the trunk upright; no swing from the back.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk with the back muscles.", curve: BRACE },
  ],
};
