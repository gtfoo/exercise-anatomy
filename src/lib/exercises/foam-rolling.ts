import type { CurvePoint, Exercise } from "./types";

// Foam rolling the right glute, designed (tools/myo/designed_clip.py): sitting
// on the roller leant back on the hands, the right ankle crossed over the left
// knee so the right glute is on stretch under the roller, the body pushed back
// and forth over it by the left leg. The muscle under the roller is not
// working; it is being lengthened and pressed. The work is in the arms that
// hold the trunk up and the leg that pushes. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const HOLD = (v: number) => t([0, v], [1, v]);
const PUSH = t([0, 0.4], [0.25, 0.8], [0.5, 0.4], [0.75, 0.6], [1, 0.4]); // the left leg drives the roll
const LOW = HOLD(0.1);

export const foamRolling: Exercise = {
  slug: "foam-rolling",
  category: "Legs and hips",
  name: "Foam rolling the glutes",
  durationMs: 3000, // one pass back and forth
  anchor: "free",
  scenery: { kind: "roller", radius: 0.075, z: 0 },
  native: { clip: "/models/clips/foam-rolling.glb" },
  camera: { position: [2.6, 1.3, 2.4], target: [0, 0.4, 0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured. The glute under the roller is shown lengthened, not working; the pressure of the roller itself is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "roll back", t0: 0, t1: 0.5 },
    { name: "roll forward", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "stabiliser", note: "Right: on the roller, lengthened by the crossed leg and pressed as the body rolls over it. Left: keeps the hips steady.", curve: HOLD(0.3), right: LOW, stretch: LOW, stretchRight: HOLD(0.85) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "stabiliser", note: "Right: under the roller with the maximus, on stretch. Left: holds the pelvis against the tip.", curve: HOLD(0.45), right: LOW, stretch: LOW, stretchRight: HOLD(0.7) },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Gluteals", role: "stabiliser", note: "Right: lengthened with the medius. Left: pelvis control.", curve: HOLD(0.35), right: LOW, stretch: LOW, stretchRight: HOLD(0.6) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Left: straightens the knee to push the body back over the roller.", curve: PUSH, right: LOW },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Left: knee extension with the other vasti.", curve: PUSH, right: LOW },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Left: knee extension. Right: holds the crossed thigh up.", curve: PUSH, right: HOLD(0.35) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Left: pulls the body forward again through the planted heel.", curve: t([0, 0.4], [0.25, 0.3], [0.5, 0.4], [0.75, 0.8], [1, 0.4]), right: LOW },
    { id: "adductor-longus", name: "Adductor longus", group: "Adductors", role: "stabiliser", note: "Right: lengthened with the thigh turned out.", curve: HOLD(0.2), right: LOW, stretch: LOW, stretchRight: HOLD(0.5) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Locks the elbows: the arms hold the trunk up off the floor.", curve: HOLD(0.7) },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Elbow lock with the long head.", curve: HOLD(0.65) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Holds the arms back behind the body under load.", curve: HOLD(0.55) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "synergist", note: "Steadies the shoulders as the body slides over the arms.", curve: HOLD(0.45) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the wrists as the hands take the weight.", curve: HOLD(0.5) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the trunk leant back rather than collapsing onto the roller.", curve: HOLD(0.55) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Left: holds the tip onto the right buttock.", curve: HOLD(0.55), right: HOLD(0.3) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the back long against the lean.", curve: HOLD(0.4) },
  ],
};
