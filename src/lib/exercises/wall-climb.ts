import type { CurvePoint, Exercise } from "./types";

// A wall climb up and back down from two Mixamo clips played in sequence:
// from the ground, pull, step and climb 1.2 m up the wall, then reverse it.
// The clips climb in place, so the wall is drawn as a face with ledges at
// the heights the hands and feet land in the capture. The first half is the
// climb (concentric), the second the descent (the same muscles, lowering).
// Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PULL = t([0, 0.4], [0.08, 0.9], [0.18, 1], [0.3, 0.7], [0.45, 0.4], [0.5, 0.35], [0.65, 0.55], [0.85, 0.8], [0.95, 0.55], [1, 0.4]);
const PUSH = t([0, 0.2], [0.15, 0.4], [0.25, 0.85], [0.35, 1], [0.45, 0.5], [0.5, 0.3], [0.6, 0.8], [0.75, 0.5], [1, 0.2]);
const LEGS = t([0, 0.35], [0.1, 0.6], [0.2, 0.9], [0.3, 0.8], [0.42, 0.9], [0.5, 0.4], [0.6, 0.8], [0.8, 0.7], [0.95, 0.6], [1, 0.35]);
const GRIP = t([0, 0.7], [0.2, 0.9], [0.5, 0.7], [0.75, 0.9], [1, 0.7]);
const BRACE = t([0, 0.5], [0.25, 0.7], [0.5, 0.55], [0.75, 0.7], [1, 0.5]);

export const wallClimb: Exercise = {
  slug: "wall-climb",
  category: "Push and pull",
  name: "Wall climb",
  durationMs: 4000, // the two captured clips at their real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  // Ledge heights: where the hands and feet rest in the clips, scaled to the figure (the probe's --contacts).
  // The hands and feet rest 0.20-0.25 m ahead of the hips; the ledges reach out to there and the face stays behind them,
  // so nothing of the body sits inside the wall.
  scenery: { kind: "wall", height: 3.2, front: 0.34, ledges: [0.65, 0.88, 1.16, 1.21, 1.65, 1.78, 2.24, 2.76] },
  native: { clip: "/models/clips/wall-climb.glb" },
  camera: { position: [3.2, 2.2, -2.6], target: [0, 1.6, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is two motion-capture clips, up and then down; the wall and its ledges are drawn to where the hands and feet land, not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "pull", t0: 0, t1: 0.2 },
    { name: "mantle", t0: 0.2, t1: 0.38 },
    { name: "top", t0: 0.38, t1: 0.55 },
    { name: "lower", t0: 0.55, t1: 0.85 },
    { name: "step down", t0: 0.85, t1: 1 },
  ],
  muscles: [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Pull", role: "prime-mover", note: "Pulls the body up the wall.", curve: PULL },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Pull", role: "prime-mover", note: "Bends the elbows on the pull.", curve: PULL },
    { id: "brachialis", name: "Brachialis", group: "Pull", role: "prime-mover", note: "Elbow flexion under the biceps.", curve: PULL },
    { id: "brachioradialis", name: "Brachioradialis", group: "Pull", role: "synergist", note: "Elbow flexion in the hanging grip.", curve: PULL },
    { id: "teres-major", name: "Teres major", group: "Pull", role: "synergist", note: "Pulls with the lat.", curve: PULL },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Pull", role: "synergist", note: "Draws the arms down and back.", curve: PULL },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Pull", role: "stabiliser", note: "Grip the edge the whole way.", curve: GRIP },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Mantle", role: "prime-mover", note: "Presses the body up over the edge.", curve: PUSH },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Mantle", role: "synergist", note: "Presses down on the edge with the triceps.", curve: PUSH },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Mantle", role: "synergist", note: "Presses over the edge.", curve: PUSH },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "prime-mover", note: "Straightens the stepping leg to drive up.", curve: LEGS },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Legs", role: "synergist", note: "Lifts the knee to the foothold and extends it.", curve: LEGS },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "prime-mover", note: "Extends the hip as the foot pushes on the wall.", curve: LEGS },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "synergist", note: "Pushes off the toes against the wall.", curve: LEGS },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Legs", role: "synergist", note: "Pushes off the toes against the wall.", curve: LEGS },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the body tight to the wall.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the back through the pull and mantle.", curve: BRACE },
  ],
};
