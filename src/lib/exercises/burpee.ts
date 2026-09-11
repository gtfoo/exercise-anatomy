import type { CurvePoint, Exercise } from "./types";

// One burpee from a Mixamo clip, converted bone for bone: t = 0 at the
// bottom of the push-up, the feet jump in, the body stands and jumps with
// the arms overhead, lands, squats, the hands go down and the feet kick
// back to the bottom again. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PRESS = t([0, 0.9], [0.1, 0.7], [0.2, 0.2], [0.75, 0.2], [0.85, 0.5], [0.95, 0.8], [1, 0.9]); // push-up at both ends
const JUMP = t([0, 0.2], [0.15, 0.4], [0.28, 0.7], [0.38, 1], [0.45, 0.4], [0.55, 0.8], [0.65, 0.6], [0.75, 0.5], [0.85, 0.3], [1, 0.2]); // extend to jump, absorb the landing, squat
const CALF = t([0, 0.2], [0.3, 0.5], [0.4, 1], [0.48, 0.3], [0.56, 0.8], [0.7, 0.4], [1, 0.2]);
const TUCK = t([0, 0.3], [0.15, 0.9], [0.25, 0.4], [0.8, 0.3], [0.9, 0.8], [1, 0.3]); // hip flexors jumping the feet in and kicking them back
const BRACE = t([0, 0.6], [0.3, 0.5], [0.5, 0.6], [1, 0.6]);
const ARMS = t([0, 0.4], [0.25, 0.3], [0.35, 0.7], [0.45, 0.6], [0.6, 0.3], [1, 0.4]);

export const burpee: Exercise = {
  slug: "burpee",
  category: "Cardio",
  name: "Burpee",
  durationMs: 3100, // the captured rep at its real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/burpee.glb" },
  camera: { position: [3.4, 1.6, 2.0], target: [0, 0.8, 0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip; ground forces are not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "push up", t0: 0, t1: 0.12 },
    { name: "jump in", t0: 0.12, t1: 0.25 },
    { name: "jump", t0: 0.25, t1: 0.5 },
    { name: "land", t0: 0.5, t1: 0.62 },
    { name: "squat", t0: 0.62, t1: 0.8 },
    { name: "kick back", t0: 0.8, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Drives the jump and absorbs the landing.", curve: JUMP },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Knee extension with the other vasti.", curve: JUMP },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor.", curve: JUMP },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "prime-mover", note: "Extends the knee for the jump and flexes the hips to bring the feet in.", curve: t([0, 0.3], [0.15, 0.9], [0.28, 0.6], [0.38, 1], [0.5, 0.4], [0.8, 0.4], [0.9, 0.8], [1, 0.3]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Extends the hips into the jump.", curve: JUMP },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Hip extension for the jump; kicks the legs back at the end.", curve: t([0, 0.3], [0.38, 0.8], [0.5, 0.4], [0.85, 0.5], [0.95, 0.8], [1, 0.3]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension with biceps femoris.", curve: t([0, 0.3], [0.38, 0.75], [0.5, 0.4], [0.85, 0.5], [0.95, 0.75], [1, 0.3]) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "prime-mover", note: "Pushes off the floor for the jump.", curve: CALF },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "prime-mover", note: "Push-off with the medial head.", curve: CALF },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "synergist", note: "Push-off and landing under the gastrocnemius.", curve: CALF },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "Presses the body up off the floor at the start, and lowers it at the end.", curve: PRESS },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Presses with the chest, then swings the arms overhead for the jump.", curve: t([0, 0.9], [0.1, 0.7], [0.2, 0.3], [0.35, 0.7], [0.45, 0.6], [0.6, 0.3], [0.85, 0.5], [0.95, 0.8], [1, 0.9]) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Straightens the elbows out of the push-up.", curve: PRESS },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "synergist", note: "Raises the arms overhead in the jump.", curve: ARMS },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the plank line and pulls the knees in.", curve: t([0, 0.7], [0.15, 0.85], [0.3, 0.5], [0.8, 0.5], [0.9, 0.8], [1, 0.7]) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk through every transition.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Straightens the back coming up and holds it in the plank.", curve: t([0, 0.4], [0.3, 0.7], [0.38, 0.8], [0.5, 0.5], [0.7, 0.6], [1, 0.4]) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "stabiliser", note: "Lifts the toes to clear the floor on the jump in and out.", curve: TUCK },
  ],
};
