import type { CurvePoint, Exercise } from "./types";
import { shifted } from "./types";

// An alternating dumbbell curl from a Mixamo clip, converted bone for bone
// and played in place: the right arm curls and lowers in the first half of
// the clip, the left in the second. Each side's muscles follow their own
// arm. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
// The right arm's curl: up through the first quarter, held, lowered under control by 0.4.
const CURL = t([0, 0.15], [0.08, 0.55], [0.17, 0.95], [0.24, 0.9], [0.32, 0.55], [0.4, 0.15], [1, 0.15]);
const HELP = t([0, 0.1], [0.08, 0.4], [0.17, 0.7], [0.24, 0.65], [0.32, 0.4], [0.4, 0.1], [1, 0.1]);
const BRACE = t([0, 0.3], [0.17, 0.45], [0.4, 0.3], [0.67, 0.45], [1, 0.3]);
const GRIP = t([0, 0.5], [1, 0.5]);
// The curve for a muscle that follows its own arm: left in the second half, right in the first.
const arm = (c: CurvePoint[]) => ({ curve: shifted(c, 0.5), right: c });

export const bicepCurl: Exercise = {
  slug: "bicep-curl",
  category: "Weights",
  name: "Dumbbell bicep curl",
  durationMs: 5900, // the captured pair of curls at their real tempo
  anchor: "free",
  props: "dumbbells",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/bicep-curl.glb" },
  camera: { position: [0.9, 1.5, 3.0], target: [0, 1.0, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip; the dumbbells' weight is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "right arm", t0: 0, t1: 0.5 },
    { name: "left arm", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "prime-mover", note: "Flexes the elbow and turns the palm up: the curl.", ...arm(CURL) },
    { id: "brachialis", name: "Brachialis", group: "Arm", role: "prime-mover", note: "Deep to the biceps; flexes the elbow whatever the grip.", ...arm(CURL) },
    { id: "brachioradialis", name: "Brachioradialis", group: "Arm", role: "synergist", note: "Elbow flexion from the forearm side.", ...arm(HELP) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the dumbbell and hold the wrist straight.", curve: GRIP },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(GRIP, 0.6) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "stabiliser", note: "Keeps the upper arm still at the side as the elbow bends.", ...arm(HELP) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", ...arm(HELP) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", ...arm(HELP) },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "stabiliser", note: "Steadies the shoulder girdle under the load.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the trunk upright and still.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces so the body does not swing the weight up.", curve: BRACE },
  ],
};
