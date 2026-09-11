import type { CurvePoint, Exercise } from "./types";

// Parallel-bar dips, designed (tools/myo/designed_clip.py) because no free
// capture exists: from a straight-arm support with the legs hanging, lower
// until the upper arms are level with the trunk leant forward (t 0.42),
// press back up (to 0.88), and hold the support. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Pressers: working eccentrically on the way down, hardest driving out of the bottom.
const PRESS = t([0, 0.35], [0.2, 0.55], [0.42, 0.85], [0.55, 1], [0.75, 0.7], [0.88, 0.4], [1, 0.35]);
// The chest and the front of the shoulder are open at the bottom.
const OPEN = t([0, 0.05], [0.2, 0.4], [0.42, 0.9], [0.5, 0.9], [0.7, 0.4], [0.88, 0.05], [1, 0.05]);
const SUPPORT = t([0, 0.6], [0.42, 0.7], [0.88, 0.6], [1, 0.6]);
const BRACE = t([0, 0.4], [0.42, 0.6], [0.55, 0.6], [0.88, 0.4], [1, 0.4]);

export const dips: Exercise = {
  slug: "dips",
  category: "Push and pull",
  name: "Dips",
  durationMs: 3000,
  anchor: "bars",
  barHeight: 1.3,
  barSpacing: 0.27, // the rest wrist x
  native: { clip: "/models/clips/dips.glb" },
  camera: { position: [2.9, 1.6, 2.3], target: [0, 1.2, 0.05] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of a dip exists. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "lower", t0: 0, t1: 0.42 },
    { name: "press", t0: 0.42, t1: 0.88 },
    { name: "support", t0: 0.88, t1: 1 },
  ],
  muscles: [
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "Its lower fibres drive the body up from the bottom; open and loaded there.", curve: PRESS, stretch: OPEN },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", role: "stabiliser", note: "Pulls the shoulder blade forward and down under the pectoralis major.", curve: scaled(PRESS, 0.6) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Straightens the elbows: the more upright the dip, the more it takes.", curve: PRESS },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Straightens the elbow with the long head.", curve: PRESS },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extensor, working in every press and lockout.", curve: PRESS },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Brings the upper arm forward out of the bottom; on stretch with the elbows back.", curve: PRESS, stretch: t([0, 0.05], [0.42, 0.7], [0.5, 0.7], [0.88, 0.05], [1, 0.05]) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(PRESS, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(PRESS, 0.5) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "synergist", note: "Pulls the upper arm down to the side at the top of the press.", curve: t([0, 0.4], [0.42, 0.3], [0.7, 0.6], [0.88, 0.5], [1, 0.4]) },
    { id: "teres-major", name: "Teres major", group: "Back", role: "synergist", note: "Adducts the arm with the lat.", curve: t([0, 0.35], [0.42, 0.3], [0.7, 0.55], [0.88, 0.45], [1, 0.35]) },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Shoulder", role: "stabiliser", note: "Keeps the shoulder blades down in the support: no shrugging into the ears.", curve: SUPPORT },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the shoulder blades in as the elbows go back.", curve: SUPPORT },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "stabiliser", note: "Shoulder blade control with the middle trapezius.", curve: SUPPORT },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff: keeps the humeral head centred with the elbows behind.", curve: SUPPORT },
    { id: "subscapularis", name: "Subscapularis", group: "Shoulder", role: "stabiliser", note: "The front of the rotator cuff: holds the humeral head in the socket under load.", curve: SUPPORT },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "stabiliser", note: "Steadies the elbow against the triceps.", curve: BRACE },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bars and hold the wrists.", curve: SUPPORT },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(SUPPORT, 0.6) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the trunk still, leant forward, with the legs hanging.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "stabiliser", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: BRACE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip", role: "stabiliser", note: "Holds the hanging legs still.", curve: t([0, 0.25], [1, 0.25]) },
  ],
};
