import type { CurvePoint, Exercise } from "./types";
import type { MotionClip3D } from "@/lib/kinematics/types";
import motion3d from "@/lib/motion/jumping-jacks-3d.json";

// One jumping jack from CMU subject 14 trial 6: arms overhead and feet apart
// at t = 0, together at about t = 0.5, apart again at t = 1, with a real hop
// each way (subject 13's take, tried first, was a step-jack: the hips moved
// 2 mm). Activation is qualitative: no estimate has been run for this movement.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// The jump itself: the calves fire twice a cycle, at each take-off.
const JUMP = t([0, 0.3], [0.15, 0.9], [0.3, 0.3], [0.5, 0.4], [0.65, 0.9], [0.8, 0.3], [1, 0.3]);
// Abductors drive the legs apart on the way to t = 1; adductors bring them together toward t = 0.5.
const ABDUCT = t([0, 0.3], [0.25, 0.25], [0.5, 0.35], [0.75, 0.9], [0.9, 0.7], [1, 0.3]);
const ADDUCT = t([0, 0.35], [0.25, 0.9], [0.45, 0.7], [0.6, 0.3], [0.85, 0.3], [1, 0.35]);
// Shoulders: lifting the arms overhead (toward t = 1) and controlling their fall (after t = 0).
const ARM_UP = t([0, 0.4], [0.2, 0.25], [0.5, 0.3], [0.7, 0.85], [0.9, 0.9], [1, 0.4]);
const ARM_DOWN = t([0, 0.4], [0.15, 0.8], [0.35, 0.6], [0.5, 0.3], [0.8, 0.3], [1, 0.4]);
const BRACE = t([0, 0.35], [0.5, 0.45], [1, 0.35]);

export const jumpingJacks: Exercise = {
  slug: "jumping-jacks",
  category: "Cardio",
  name: "Jumping jacks",
  durationMs: 1070, // the captured cycle at its real tempo
  anchor: "free",
  motion3d: motion3d as unknown as MotionClip3D,
  native: { clip: "/models/clips/jumping-jacks.glb" },
  camera: { position: [2.4, 1.5, 2.6], target: [0, 0.95, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "in", t0: 0, t1: 0.5 },
    { name: "out", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Calf", role: "prime-mover", note: "Springs the body off the floor at each hop.", curve: JUMP },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Calf", role: "prime-mover", note: "Springs the body off the floor with the medial head.", curve: JUMP },
    { id: "soleus", name: "Soleus", group: "Calf", role: "synergist", note: "Adds to the push-off and cushions each landing.", curve: JUMP },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Calf", role: "stabiliser", note: "Lifts the toes clear between hops and steadies the ankle on landing.", curve: BRACE },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Hip", role: "prime-mover", note: "Swings the legs apart in the air.", curve: ABDUCT },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Hip", role: "synergist", note: "Abducts the hip with gluteus medius.", curve: ABDUCT },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip", role: "prime-mover", note: "Brings the legs back together.", curve: ADDUCT },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Hip", role: "synergist", note: "Adducts the thigh with the other adductors.", curve: ADDUCT },
    { id: "adductor-brevis", name: "Adductor brevis", group: "Hip", role: "synergist", note: "Adducts the thigh.", curve: ADDUCT },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Straightens the knee for each take-off.", curve: JUMP },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "synergist", note: "Knee extension for the hop and a soft landing.", curve: JUMP },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "prime-mover", note: "Swings the arms out and up overhead.", curve: ARM_UP },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "synergist", note: "Starts each arm raise from the sides.", curve: ARM_UP },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "synergist", note: "Rotates the shoulder blade upward as the arms pass horizontal.", curve: ARM_UP },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Helps raise the arms overhead.", curve: ARM_UP },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "synergist", note: "Rotates the shoulder blade upward as the arms rise.", curve: ARM_UP },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Shoulder", role: "synergist", note: "Upward rotation of the shoulder blade with the middle fibres.", curve: ARM_UP },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Shoulder", role: "synergist", note: "Pulls the arms back down to the sides.", curve: ARM_DOWN },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Shoulder", role: "synergist", note: "Brings the arms down and in with the lats.", curve: ARM_DOWN },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk through the hops.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the spine upright while the limbs swing.", curve: BRACE },
  ],
};
