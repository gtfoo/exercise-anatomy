import type { CurvePoint, Exercise } from "./types";

// One push-up from a Mixamo clip, converted bone for bone: t = 0 is the
// bottom with the chest just off the floor, t = 0.5 the top with the arms
// straight, t = 1 the bottom again. It replaced a designed movement on
// 2026-09-11 when the owner supplied the clip. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Pressers: hardest driving out of the bottom, easing at the top, working eccentrically on the way back down.
const PRESS = t([0, 0.8], [0.12, 1], [0.35, 0.65], [0.5, 0.35], [0.7, 0.5], [0.9, 0.75], [1, 0.8]);
// The chest and front of the shoulder are open at the bottom: on stretch, and working at the same time.
const OPEN = t([0, 0.9], [0.25, 0.45], [0.5, 0.1], [0.75, 0.45], [1, 0.9]);
const BRACE = t([0, 0.65], [0.5, 0.5], [1, 0.65]);
const SCAPULA = t([0, 0.7], [0.3, 0.6], [0.5, 0.4], [0.7, 0.6], [1, 0.7]);
const CUFF = t([0, 0.55], [0.5, 0.35], [1, 0.55]);

export const pushUp: Exercise = {
  slug: "push-up",
  category: "Push and pull",
  name: "Push-up",
  durationMs: 1500, // the captured rep at its real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/push-up.glb" },
  // The body lies along z with the hands ahead of the shoulders; look at its middle from the side, a little ahead.
  camera: { position: [3.5, 1.3, 1.5], target: [0, 0.3, 0.2] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "push", t0: 0, t1: 0.5 },
    { name: "lower", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "Presses the body up: brings the upper arms together and forward. Open and loaded at the bottom.", curve: PRESS, stretch: OPEN },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", role: "stabiliser", note: "Pulls the shoulder blade forward and down under the pectoralis major.", curve: scaled(PRESS, 0.6) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Presses with the chest: brings the upper arm forward under the body.", curve: PRESS, stretch: t([0, 0.8], [0.25, 0.4], [0.5, 0.1], [0.75, 0.4], [1, 0.8]) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(PRESS, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(PRESS, 0.5) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Straightens the elbows on the push.", curve: PRESS, stretch: t([0, 0.7], [0.25, 0.3], [0.5, 0.05], [0.75, 0.3], [1, 0.7]) },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Straightens the elbow with the long head.", curve: PRESS},
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extensor, working in every press and lockout.", curve: PRESS},
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "stabiliser", note: "Steadies the shoulder from behind.", curve: CUFF },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff: keeps the humeral head centred under load.", curve: CUFF },
    { id: "subscapularis", name: "Subscapularis", group: "Shoulder", role: "stabiliser", note: "The front of the rotator cuff: holds the humeral head in the socket under load.", curve: CUFF },
    { id: "teres-minor", name: "Teres minor", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, with infraspinatus.", curve: CUFF },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the shoulder blades against the ribcage.", curve: SCAPULA },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "stabiliser", note: "Control the shoulder blades as they spread at the top and draw in at the bottom.", curve: SCAPULA },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "stabiliser", note: "Steadies the elbow against the triceps.", curve: BRACE },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the wrists as the hands take the body weight.", curve: BRACE },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(BRACE, 0.6) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the hips from sagging: the plank inside the push-up.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "stabiliser", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace under the obliques.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the spine straight in the plank line.", curve: BRACE },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "stabiliser", note: "Keeps the hips extended in line with the trunk.", curve: BRACE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Leg", role: "stabiliser", note: "Keeps the knees straight.", curve: BRACE },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Leg", role: "stabiliser", note: "Knee extension with the other quadriceps.", curve: BRACE },
  ],
};
