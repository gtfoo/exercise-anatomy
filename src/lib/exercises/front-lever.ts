import type { CurvePoint, Exercise } from "./types";

// A front lever, designed (tools/myo/designed_clip.py) because no free
// capture exists: from a dead hang, the body pulls up face-up into a tuck
// (to t 0.2), the legs extend to the full horizontal lever (to 0.4), held
// to 0.68, then back through the tuck to the hang. Activation is
// qualitative: a straight-arm pull held against the whole body's lever.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PULL = t([0, 0.25], [0.1, 0.6], [0.2, 0.85], [0.4, 1], [0.68, 1], [0.85, 0.85], [0.95, 0.5], [1, 0.25]); // the lats and shoulder extensors hold the body up on straight arms
const ARM = t([0, 0.35], [0.2, 0.75], [0.4, 0.95], [0.68, 0.95], [0.85, 0.75], [1, 0.35]);
const HOLLOW = t([0, 0.3], [0.2, 0.8], [0.4, 1], [0.68, 1], [0.85, 0.8], [1, 0.3]); // the abs hold the hips and legs up
const LINE = t([0, 0.15], [0.2, 0.4], [0.4, 0.95], [0.68, 0.95], [0.85, 0.4], [1, 0.15]);
const TUCK = t([0, 0.2], [0.2, 0.85], [0.4, 0.6], [0.68, 0.6], [0.85, 0.85], [1, 0.2]);
const LATS_LONG = t([0, 0.8], [0.15, 0.3], [0.4, 0.05], [0.68, 0.05], [0.9, 0.4], [1, 0.8]); // on stretch in the hang

export const frontLever: Exercise = {
  slug: "front-lever",
  category: "Push and pull",
  name: "Front lever",
  durationMs: 7000,
  anchor: "hands",
  barHeight: 2.3,
  native: { clip: "/models/clips/front-lever.glb" },
  camera: { position: [3.4, 2.2, 2.0], target: [0, 1.7, 0.2] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of a front lever exists. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "pull into tuck", t0: 0, t1: 0.2 },
    { name: "extend", t0: 0.2, t1: 0.4 },
    { name: "hold", t0: 0.4, t1: 0.68 },
    { name: "tuck back", t0: 0.68, t1: 0.85 },
    { name: "hang", t0: 0.85, t1: 1 },
  ],
  muscles: [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "prime-mover", note: "Holds the arms down against the bar with the body as a lever: the front lever's muscle. On stretch in the hang.", curve: PULL, stretch: LATS_LONG },
    { id: "teres-major", name: "Teres major", group: "Back", role: "synergist", note: "Shoulder extension with the lat.", curve: PULL, stretch: LATS_LONG },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Shoulder extension from behind.", curve: PULL },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "synergist", note: "Its lower fibres pull the arms down from overhead.", curve: t([0, 0.2], [0.4, 0.6], [0.68, 0.6], [1, 0.2]) },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Shoulder", role: "synergist", note: "Pulls the shoulder blades down and holds them there.", curve: PULL },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "synergist", note: "Retracts the shoulder blades.", curve: PULL },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "synergist", note: "Retraction with the middle trapezius.", curve: PULL },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "stabiliser", note: "Straight-arm strength: holds the elbow against the pull.", curve: ARM },
    { id: "brachialis", name: "Brachialis", group: "Arm", role: "stabiliser", note: "Elbow control with the biceps.", curve: ARM },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "synergist", note: "Crosses the shoulder: helps extend the arm against the bar and locks the elbow.", curve: ARM },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar.", curve: ARM },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrists against the grip.", curve: t([0, 0.2], [0.4, 0.55], [0.68, 0.55], [1, 0.2]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Holds the hollow body: the hips and legs up in line.", curve: HOLLOW },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace the trunk.", curve: HOLLOW },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace with the external obliques.", curve: HOLLOW },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace.", curve: HOLLOW },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip", role: "prime-mover", note: "Flexes the hips to hold the legs level, and pulls the knees in for the tuck.", curve: t([0, 0.2], [0.2, 0.85], [0.4, 0.9], [0.68, 0.9], [0.85, 0.85], [1, 0.2]) },
    { id: "pectineus", name: "Pectineus", group: "Hip", role: "synergist", note: "Hip flexion into the tuck.", curve: TUCK },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip", role: "synergist", note: "Hip flexion and keeps the legs together.", curve: LINE },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Locks the knees straight.", curve: LINE },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "stabiliser", note: "Keeps the hips from piking: extension against the hip flexors.", curve: t([0, 0.2], [0.4, 0.5], [0.68, 0.5], [1, 0.2]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the spine straight in the line.", curve: t([0, 0.2], [0.4, 0.45], [0.68, 0.45], [1, 0.2]) },
  ],
};
