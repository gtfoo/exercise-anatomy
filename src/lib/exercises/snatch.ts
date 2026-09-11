import type { CurvePoint, Exercise } from "./types";

// One snatch from a Mixamo clip, converted bone for bone: from the set
// position, the first pull to the knees (to 0.11), the second pull (to
// 0.19), the catch in the overhead squat (to 0.33), standing up (to 0.48),
// the bar held overhead (to 0.63), lowered to the hips (to 0.72) and the
// hinge back down to the set. The bar is drawn between the hands.
// Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PULL = t([0, 0.5], [0.11, 0.8], [0.17, 1], [0.21, 0.4], [0.3, 0.6], [0.4, 0.9], [0.48, 0.5], [0.63, 0.4], [0.72, 0.5], [0.85, 0.6], [1, 0.5]); // legs and hips: both pulls, out of the overhead squat, the hinge down
const BACK = t([0, 0.7], [0.11, 0.9], [0.17, 1], [0.25, 0.7], [0.4, 0.8], [0.48, 0.6], [0.63, 0.55], [0.72, 0.6], [0.9, 0.85], [1, 0.7]);
const SHRUG = t([0, 0.2], [0.11, 0.4], [0.17, 1], [0.22, 0.7], [0.33, 0.7], [0.63, 0.7], [0.72, 0.3], [1, 0.2]);
const OVERHEAD = t([0, 0.1], [0.17, 0.2], [0.22, 0.9], [0.33, 1], [0.48, 0.9], [0.63, 0.85], [0.7, 0.4], [1, 0.1]);
const CALF = t([0, 0.2], [0.11, 0.3], [0.17, 1], [0.2, 0.3], [0.4, 0.5], [0.48, 0.3], [1, 0.2]);
const GRIP = t([0, 0.7], [0.17, 0.9], [0.33, 0.7], [0.63, 0.7], [0.72, 0.8], [1, 0.7]);
const BRACE = t([0, 0.6], [0.17, 0.8], [0.33, 0.9], [0.48, 0.8], [0.63, 0.7], [1, 0.6]);

export const snatch: Exercise = {
  slug: "snatch",
  category: "Weights",
  name: "Snatch",
  durationMs: 5400, // the captured lift at its real tempo
  anchor: "free",
  props: "barbell",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/snatch.glb" },
  camera: { position: [3.2, 1.6, 2.2], target: [0, 1.0, 0.15] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip; the bar is drawn between the hands and its weight is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "first pull", t0: 0, t1: 0.11 },
    { name: "second pull", t0: 0.11, t1: 0.19 },
    { name: "catch", t0: 0.19, t1: 0.33 },
    { name: "recover", t0: 0.33, t1: 0.48 },
    { name: "overhead", t0: 0.48, t1: 0.63 },
    { name: "lower", t0: 0.63, t1: 0.72 },
    { name: "return", t0: 0.72, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Knee extension in both pulls and out of the overhead squat.", curve: PULL },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Knee extension with the other vasti.", curve: PULL },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor.", curve: PULL },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Hip extension: the second pull is a jump with the bar.", curve: PULL },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "prime-mover", note: "Hip extension through the first pull; on stretch at the set and the hinge back down.", curve: t([0, 0.5], [0.11, 0.9], [0.17, 0.8], [0.25, 0.4], [0.48, 0.5], [0.72, 0.4], [0.9, 0.7], [1, 0.5]), stretch: t([0, 0.7], [0.11, 0.4], [0.17, 0.05], [0.72, 0.05], [0.85, 0.5], [1, 0.7]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension with biceps femoris.", curve: t([0, 0.5], [0.11, 0.85], [0.17, 0.75], [0.25, 0.4], [0.48, 0.5], [0.72, 0.4], [0.9, 0.65], [1, 0.5]), stretch: t([0, 0.7], [0.11, 0.4], [0.17, 0.05], [0.72, 0.05], [0.85, 0.5], [1, 0.7]) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Adductors", role: "synergist", note: "Hip extension out of the deep catch.", curve: t([0, 0.3], [0.17, 0.6], [0.33, 0.8], [0.48, 0.5], [1, 0.3]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Holds the back flat through the pull and upright under the bar.", curve: BACK },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "synergist", note: "Finishes the second pull on the toes.", curve: CALF },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "synergist", note: "Ankle extension with the medial head.", curve: CALF },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "synergist", note: "Ankle extension and balance in the squat.", curve: CALF },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "prime-mover", note: "Shrugs the bar high at the top of the pull; supports it overhead.", curve: SHRUG },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Holds the bar overhead through the catch and the stand.", curve: OVERHEAD },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "synergist", note: "Overhead support with the anterior fibres.", curve: OVERHEAD },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Pulls the elbows high and keeps the bar back overhead.", curve: t([0, 0.2], [0.17, 0.8], [0.22, 0.6], [0.33, 0.7], [0.63, 0.6], [0.72, 0.2], [1, 0.2]) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Locks the elbows out under the bar.", curve: OVERHEAD },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "stabiliser", note: "Seats the shoulder under the wide overhead grip.", curve: OVERHEAD },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, steadying the bar overhead.", curve: OVERHEAD },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "synergist", note: "Keeps the bar close through the pull; steadies it overhead.", curve: t([0, 0.4], [0.11, 0.7], [0.17, 0.6], [0.33, 0.5], [0.63, 0.5], [0.72, 0.4], [1, 0.4]) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar with a wide hand spacing.", curve: GRIP },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the shoulder blades back under the bar.", curve: BRACE },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "stabiliser", note: "Shoulder blade control with the middle trapezius.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk under the overhead bar.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace.", curve: BRACE },
  ],
};
