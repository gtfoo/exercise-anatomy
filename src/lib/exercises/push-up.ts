import type { CurvePoint, Exercise } from "./types";

// A designed push-up (tools/myo/designed_clip.py): body straight from toes to
// shoulders pivoting on the toes, hands under the shoulders, elbows bending
// straight back to about 100° at the bottom (t = 0.5). No free capture of a
// floor push-up exists (CMU's "vertical pushups" are handstand push-ups).
// Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Pressers work eccentrically on the way down, hardest on the push back up.
const PRESS = t([0, 0.35], [0.25, 0.55], [0.5, 0.8], [0.65, 1], [0.85, 0.6], [1, 0.35]);
const BRACE = t([0, 0.5], [0.5, 0.65], [1, 0.5]);
const SCAPULA = t([0, 0.4], [0.5, 0.7], [0.7, 0.6], [1, 0.4]);
const CUFF = t([0, 0.35], [0.5, 0.55], [1, 0.35]);

export const pushUp: Exercise = {
  slug: "push-up",
  category: "Push and pull",
  name: "Push-up",
  durationMs: 2400,
  anchor: "free",
  native: { clip: "/models/clips/push-up.glb" },
  // The body lies from the toes at z = 0.2 to the hands at z = 1.6; look at its middle from the side, a little ahead.
  camera: { position: [3.7, 1.3, 1.7], target: [0, 0.3, 0.95] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of a floor push-up exists. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "lower", t0: 0, t1: 0.5 },
    { name: "push", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "Presses the body up: brings the upper arms together and forward.", curve: PRESS },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Presses with the chest: brings the upper arm forward under the body.", curve: PRESS },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Straightens the elbows on the push.", curve: PRESS },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "stabiliser", note: "Steadies the shoulder from behind.", curve: CUFF },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff: keeps the humeral head centred under load.", curve: CUFF },
    { id: "teres-minor", name: "Teres minor", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, with infraspinatus.", curve: CUFF },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the shoulder blades against the ribcage.", curve: SCAPULA },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "stabiliser", note: "Control the shoulder blades as they spread at the top and draw in at the bottom.", curve: SCAPULA },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "stabiliser", note: "Steadies the elbow against the triceps.", curve: BRACE },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the wrists as the hands take the body weight.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the hips from sagging: the plank inside the push-up.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace under the obliques.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the spine straight in the plank line.", curve: BRACE },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "stabiliser", note: "Keeps the hips extended in line with the trunk.", curve: BRACE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Leg", role: "stabiliser", note: "Keeps the knees straight.", curve: BRACE },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Leg", role: "stabiliser", note: "Knee extension with the other quadriceps.", curve: BRACE },
  ],
};
