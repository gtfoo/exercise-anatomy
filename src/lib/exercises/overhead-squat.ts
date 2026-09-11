import type { CurvePoint, Exercise } from "./types";

// Three Mixamo clips played in sequence: picking the bar up and pressing it
// overhead (5.8 s), the overhead squat itself (1.9 s), and lowering the bar
// to the chest, the hips and the floor (3.5 s). As fractions of the 11.2 s:
// pick up to 0.3, stand to 0.41, press to 0.52, squat down to 0.61, stand
// to 0.68, lower to the chest to 0.77, to the hips to 0.81, set down to
// 0.88, stand. The bar is drawn between the hands. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const LEGS = t([0, 0.3], [0.15, 0.5], [0.3, 0.9], [0.41, 0.5], [0.47, 0.8], [0.52, 0.4], [0.61, 1], [0.68, 0.5], [0.81, 0.4], [0.88, 0.8], [1, 0.3]); // the pick-up, the press dip, the squat, the set-down
const BACK = t([0, 0.5], [0.15, 0.8], [0.3, 0.9], [0.41, 0.7], [0.52, 0.7], [0.61, 0.85], [0.68, 0.7], [0.81, 0.6], [0.88, 0.85], [1, 0.5]);
const OVERHEAD = t([0, 0.1], [0.41, 0.2], [0.47, 0.8], [0.52, 1], [0.61, 1], [0.68, 0.95], [0.75, 0.6], [0.77, 0.3], [0.81, 0.1], [1, 0.1]); // the press, the hold, the squat under it
const HINGE = t([0, 0.5], [0.15, 0.8], [0.3, 0.7], [0.41, 0.4], [0.61, 0.5], [0.81, 0.4], [0.88, 0.7], [1, 0.5]); // hamstrings: hip extension picking up and setting down
const CALF = t([0, 0.2], [0.3, 0.5], [0.41, 0.3], [0.47, 0.8], [0.52, 0.4], [0.61, 0.6], [0.68, 0.4], [1, 0.2]);
const GRIP = t([0, 0.6], [0.3, 0.8], [0.52, 0.7], [0.68, 0.7], [0.88, 0.8], [1, 0.6]);
const BRACE = t([0, 0.5], [0.3, 0.7], [0.52, 0.85], [0.68, 0.85], [0.81, 0.7], [1, 0.5]);

export const overheadSquat: Exercise = {
  slug: "overhead-squat",
  category: "Weights",
  name: "Overhead squat",
  durationMs: 11230, // the three captured clips at their real tempo
  anchor: "free",
  props: "barbell",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/overhead-squat.glb" },
  camera: { position: [3.2, 1.6, 2.2], target: [0, 1.0, 0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is three motion-capture clips in sequence: the bar picked up and pressed, the squat, the bar set down. The bar is drawn between the hands and its weight is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "pick up", t0: 0, t1: 0.3 },
    { name: "stand", t0: 0.3, t1: 0.41 },
    { name: "press", t0: 0.41, t1: 0.52 },
    { name: "squat down", t0: 0.52, t1: 0.61 },
    { name: "stand up", t0: 0.61, t1: 0.68 },
    { name: "lower", t0: 0.68, t1: 0.81 },
    { name: "set down", t0: 0.81, t1: 0.88 },
    { name: "stand", t0: 0.88, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Knee extension out of the squat and the pick-up.", curve: LEGS, stretch: t([0, 0.05], [0.52, 0.1], [0.61, 0.7], [0.68, 0.05], [1, 0.05]) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Knee extension with the other vasti.", curve: LEGS, stretch: t([0, 0.05], [0.52, 0.1], [0.61, 0.7], [0.68, 0.05], [1, 0.05]) },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor.", curve: LEGS },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Knee extension; slack at the bottom where the hip is flexed.", curve: t([0, 0.2], [0.3, 0.6], [0.47, 0.6], [0.61, 0.5], [0.68, 0.6], [1, 0.2]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Hip extension out of the deep squat and the pick-up.", curve: LEGS, stretch: t([0, 0.05], [0.52, 0.1], [0.61, 0.8], [0.68, 0.05], [1, 0.05]) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "stabiliser", note: "Keeps the knees tracking over the feet.", curve: t([0, 0.3], [0.61, 0.7], [1, 0.3]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Hip extension picking the bar up and setting it down.", curve: HINGE },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension with biceps femoris.", curve: HINGE },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Adductors", role: "synergist", note: "Hip extension from the bottom of the squat.", curve: t([0, 0.3], [0.52, 0.4], [0.61, 0.8], [0.68, 0.4], [1, 0.3]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Holds the trunk upright under the overhead bar and flat in the pick-up.", curve: BACK },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "synergist", note: "Ankle balance under the bar.", curve: CALF },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "synergist", note: "Ankle balance with the medial head.", curve: CALF },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "synergist", note: "Ankle work with the knees far forward at the bottom.", curve: t([0, 0.2], [0.52, 0.4], [0.61, 0.8], [0.68, 0.4], [1, 0.2]) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Presses the bar up and holds it overhead through the squat.", curve: OVERHEAD },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "synergist", note: "Overhead support with the anterior fibres.", curve: OVERHEAD },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Locks the elbows out under the bar.", curve: OVERHEAD },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "synergist", note: "Rotates the shoulder blades up and supports the bar overhead.", curve: OVERHEAD },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Shoulder", role: "stabiliser", note: "Keeps the shoulder blades down and back under the bar.", curve: OVERHEAD },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "stabiliser", note: "Seats the shoulder under the load.", curve: OVERHEAD },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, steadying the bar overhead.", curve: OVERHEAD },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Lengthened with the arms overhead; steadies the bar.", curve: t([0, 0.3], [0.52, 0.5], [0.68, 0.5], [1, 0.3]), stretch: t([0, 0.05], [0.47, 0.3], [0.52, 0.6], [0.68, 0.6], [0.77, 0.1], [1, 0.05]) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar.", curve: GRIP },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk under the overhead bar.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace.", curve: BRACE },
  ],
};
