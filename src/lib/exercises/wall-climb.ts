import type { CurvePoint, Exercise } from "./types";

// A wall climb from a Mixamo clip, converted bone for bone: from a hang on
// the wall, pull, step and mantle up about 1.3 m, one climb per cycle. The
// clip climbs in place, so the wall is drawn as a face the figure goes up.
// Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PULL = t([0, 0.4], [0.15, 0.9], [0.35, 1], [0.55, 0.7], [0.75, 0.5], [0.9, 0.35], [1, 0.4]);
const PUSH = t([0, 0.2], [0.3, 0.4], [0.5, 0.85], [0.7, 1], [0.85, 0.6], [1, 0.2]);
const LEGS = t([0, 0.35], [0.2, 0.6], [0.4, 0.9], [0.6, 0.8], [0.8, 0.9], [1, 0.35]);
const GRIP = t([0, 0.7], [0.4, 0.9], [0.7, 0.7], [1, 0.7]);
const BRACE = t([0, 0.5], [0.5, 0.7], [1, 0.5]);

export const wallClimb: Exercise = {
  slug: "wall-climb",
  name: "Wall climb",
  durationMs: 2000, // the captured climb at its real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  scenery: { kind: "wall", height: 3.2, front: 0.32 },
  native: { clip: "/models/clips/wall-climb.glb" },
  camera: { position: [3.2, 2.2, -2.6], target: [0, 1.6, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip; the wall is drawn, not modelled, and nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "pull", t0: 0, t1: 0.4 },
    { name: "mantle", t0: 0.4, t1: 0.75 },
    { name: "stand", t0: 0.75, t1: 1 },
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
    { id: "gastrocnemius-medial", name: "Gastrocnemius", group: "Legs", role: "synergist", note: "Pushes off the toes against the wall.", curve: LEGS },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the body tight to the wall.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the back through the pull and mantle.", curve: BRACE },
  ],
};
