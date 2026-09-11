import type { CurvePoint, Exercise } from "./types";

// A strict bar muscle-up, designed (tools/myo/designed_clip.py) because no
// free capture exists: from a dead hang, pull to the chest (to t 0.24), turn
// the wrists over the bar as the chest leans over it (to 0.36), press to
// straight arms above the bar (to 0.46), hold, then lower into the dip,
// back through the transition and down to the hang. Activation is
// qualitative: a pull-up's muscles first, a dip's second.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PULL = t([0, 0.2], [0.1, 0.7], [0.2, 1], [0.28, 0.8], [0.36, 0.4], [0.46, 0.15], [0.62, 0.15], [0.72, 0.3], [0.82, 0.7], [0.92, 0.5], [1, 0.2]);
const PRESS = t([0, 0.1], [0.24, 0.15], [0.32, 0.6], [0.4, 1], [0.46, 0.7], [0.62, 0.5], [0.72, 0.9], [0.82, 0.4], [1, 0.1]);
const TRANSITION = t([0, 0.2], [0.2, 0.4], [0.3, 1], [0.38, 0.9], [0.46, 0.4], [0.62, 0.3], [0.72, 0.6], [0.82, 0.9], [0.9, 0.4], [1, 0.2]);
const GRIP = t([0, 0.6], [0.2, 0.9], [0.36, 1], [0.46, 0.7], [0.62, 0.6], [0.82, 0.9], [1, 0.6]);
const BRACE = t([0, 0.5], [0.2, 0.7], [0.36, 0.9], [0.46, 0.6], [0.62, 0.5], [0.82, 0.8], [1, 0.5]);
const LATS_LONG = t([0, 0.9], [0.15, 0.4], [0.24, 0.05], [0.82, 0.05], [0.92, 0.5], [1, 0.9]); // on stretch in the hang

export const muscleUp: Exercise = {
  slug: "muscle-up",
  category: "Push and pull",
  name: "Muscle-up",
  durationMs: 5000,
  anchor: "hands",
  barHeight: 2.3,
  native: { clip: "/models/clips/muscle-up.glb" },
  camera: { position: [0.6, 2.2, 4.2], target: [0, 1.9, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of a muscle-up exists. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "pull", t0: 0, t1: 0.24 },
    { name: "transition", t0: 0.24, t1: 0.36 },
    { name: "press", t0: 0.36, t1: 0.46 },
    { name: "support", t0: 0.46, t1: 0.62 },
    { name: "dip down", t0: 0.62, t1: 0.72 },
    { name: "transition down", t0: 0.72, t1: 0.82 },
    { name: "lower", t0: 0.82, t1: 1 },
  ],
  muscles: [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "prime-mover", note: "Pulls the body up to the bar and, leaning over it, drives the chest past it. On stretch in the hang.", curve: PULL, stretch: LATS_LONG },
    { id: "teres-major", name: "Teres major", group: "Back", role: "synergist", note: "Pulls with the lat.", curve: PULL, stretch: LATS_LONG },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "prime-mover", note: "Flexes the elbows through the pull; lets go of the work once the wrists turn over.", curve: PULL },
    { id: "brachialis", name: "Brachialis", group: "Arm", role: "prime-mover", note: "Elbow flexion under the biceps.", curve: PULL },
    { id: "brachioradialis", name: "Brachioradialis", group: "Arm", role: "synergist", note: "Elbow flexion with the overhand grip.", curve: PULL },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Draws the elbows back and down in the pull.", curve: PULL },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Shoulder", role: "synergist", note: "Pulls the shoulder blades down into the pull.", curve: PULL },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "synergist", note: "Draws the shoulder blades in through the transition.", curve: TRANSITION },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "synergist", note: "Shoulder blade control with the middle trapezius.", curve: TRANSITION },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "The transition and the dip: brings the chest over the bar and presses out of the bottom.", curve: PRESS },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", role: "stabiliser", note: "Pulls the shoulder blade forward and down under the pectoralis major.", curve: scaled(PRESS, 0.6) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Presses out of the dip with the chest.", curve: PRESS },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(PRESS, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(PRESS, 0.5) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Locks the elbows out above the bar.", curve: PRESS },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Straightens the elbow with the long head.", curve: PRESS },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extensor, working in every press and lockout.", curve: PRESS },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar; the false grip of the transition loads the wrists most.", curve: GRIP },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(GRIP, 0.6) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the body hollow and drives the lean over the bar.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "stabiliser", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: BRACE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip", role: "stabiliser", note: "Holds the legs slightly forward through the transition.", curve: t([0, 0.2], [0.24, 0.3], [0.36, 0.6], [0.46, 0.3], [0.72, 0.5], [0.82, 0.3], [1, 0.2]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "stabiliser", note: "Keeps the hips extended in the hang and the support.", curve: t([0, 0.3], [0.24, 0.4], [0.36, 0.2], [0.46, 0.4], [1, 0.3]) },
  ],
};
