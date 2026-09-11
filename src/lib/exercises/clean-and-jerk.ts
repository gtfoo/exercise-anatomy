import type { CurvePoint, Exercise } from "./types";

// One clean and jerk from a Mixamo clip (frames 103-505 of a longer take
// that walked up to the bar and away again), converted bone for bone. The
// bar is drawn between the hands. Timeline, as fractions of the 13.4 s:
// set-up to 0.09, first pull to 0.24, second pull to 0.29, catch in the
// front squat to 0.36, stand to 0.44, rack held to 0.61, dip and drive to
// 0.65, split jerk to 0.72, recover to 0.81, then lower to the shoulders,
// the hips and the floor. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const BACK = t([0, 0.5], [0.09, 0.7], [0.2, 0.95], [0.27, 1], [0.36, 0.8], [0.44, 0.85], [0.61, 0.6], [0.72, 0.7], [0.81, 0.6], [0.96, 0.85], [1, 0.5]); // the spine held through the pull and under the rack
const SHRUG = t([0, 0.2], [0.2, 0.4], [0.27, 1], [0.32, 0.6], [0.44, 0.5], [0.61, 0.5], [0.66, 0.9], [0.72, 0.7], [0.81, 0.6], [0.87, 0.3], [1, 0.2]); // the second pull and the jerk
const OVERHEAD = t([0, 0.1], [0.61, 0.15], [0.65, 0.7], [0.68, 1], [0.72, 0.95], [0.81, 0.85], [0.84, 0.4], [1, 0.1]); // shoulders and triceps: the jerk and the lockout
const GRIP = t([0, 0.6], [0.27, 0.9], [0.36, 0.5], [0.61, 0.5], [0.81, 0.7], [0.9, 0.8], [1, 0.6]);
const BRACE = t([0, 0.5], [0.2, 0.7], [0.36, 0.8], [0.61, 0.7], [0.72, 0.85], [0.81, 0.7], [1, 0.5]);
// The split jerk lands the LEFT foot forward (t 0.65-0.72): the front leg's quads and glutes catch and then push
// back to recover; the back (right) foot is on its toes with the hip extended, so its calf works and its hip flexor
// is on stretch.
const PULL_L = t([0, 0.3], [0.09, 0.6], [0.2, 0.9], [0.27, 1], [0.32, 0.3], [0.36, 0.7], [0.44, 0.9], [0.5, 0.4], [0.61, 0.5], [0.64, 0.9], [0.66, 1], [0.68, 0.8], [0.72, 0.9], [0.81, 0.4], [0.9, 0.5], [0.96, 0.7], [1, 0.3]);
const PULL_R = t([0, 0.3], [0.09, 0.6], [0.2, 0.9], [0.27, 1], [0.32, 0.3], [0.36, 0.7], [0.44, 0.9], [0.5, 0.4], [0.61, 0.5], [0.64, 0.9], [0.66, 0.5], [0.68, 0.35], [0.72, 0.5], [0.81, 0.4], [0.9, 0.5], [0.96, 0.7], [1, 0.3]);
const CALF_L = t([0, 0.2], [0.24, 0.4], [0.27, 1], [0.3, 0.3], [0.61, 0.3], [0.64, 1], [0.67, 0.3], [0.72, 0.5], [0.81, 0.3], [1, 0.2]);
const CALF_R = t([0, 0.2], [0.24, 0.4], [0.27, 1], [0.3, 0.3], [0.61, 0.3], [0.64, 1], [0.67, 0.9], [0.72, 0.8], [0.76, 0.4], [0.81, 0.3], [1, 0.2]);
const BACK_HIP = t([0, 0], [0.64, 0], [0.67, 0.6], [0.72, 0.5], [0.78, 0], [1, 0]); // the back leg's hip flexor lengthened in the split
const ARMPULL = t([0, 0.1], [0.24, 0.2], [0.29, 0.7], [0.33, 0.9], [0.4, 0.5], [0.61, 0.4], [0.84, 0.6], [0.9, 0.4], [1, 0.1]); // pulling under the bar, then holding the rack

export const cleanAndJerk: Exercise = {
  slug: "clean-and-jerk",
  category: "Weights",
  name: "Clean and jerk",
  durationMs: 13400, // the captured lift at its real tempo
  anchor: "free",
  props: "barbell",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/clean-and-jerk.glb" },
  camera: { position: [3.2, 1.5, 2.2], target: [0, 1.0, 0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip; the bar is drawn between the hands and its weight is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "set", t0: 0, t1: 0.09 },
    { name: "first pull", t0: 0.09, t1: 0.24 },
    { name: "second pull", t0: 0.24, t1: 0.29 },
    { name: "catch", t0: 0.29, t1: 0.36 },
    { name: "front squat", t0: 0.36, t1: 0.44 },
    { name: "rack", t0: 0.44, t1: 0.61 },
    { name: "dip and drive", t0: 0.61, t1: 0.65 },
    { name: "split jerk (left foot forward)", t0: 0.65, t1: 0.72 },
    { name: "recover", t0: 0.72, t1: 0.81 },
    { name: "lower", t0: 0.81, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Knee extension in both pulls, out of the front squat, and in the drive.", curve: PULL_L, right: PULL_R },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Knee extension with the other vasti.", curve: PULL_L, right: PULL_R },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor.", curve: PULL_L, right: PULL_R },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Knee extension; slack when the hip is flexed at the bottom. On the back leg of the split it is on stretch.", curve: t([0, 0.2], [0.27, 0.7], [0.44, 0.6], [0.64, 0.7], [0.81, 0.4], [1, 0.2]), stretchRight: BACK_HIP },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Hip extension: the second pull, standing from the front squat, the split recovery.", curve: PULL_L, right: PULL_R },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "prime-mover", note: "Hip extension through the first pull, on stretch at the set.", curve: t([0, 0.4], [0.09, 0.7], [0.2, 0.9], [0.27, 0.8], [0.36, 0.5], [0.44, 0.7], [0.61, 0.4], [0.72, 0.6], [0.81, 0.5], [0.96, 0.7], [1, 0.4]), stretch: t([0, 0.7], [0.09, 0.7], [0.2, 0.3], [0.27, 0.05], [0.9, 0.05], [0.96, 0.6], [1, 0.7]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension with biceps femoris.", curve: t([0, 0.4], [0.09, 0.65], [0.2, 0.85], [0.27, 0.75], [0.36, 0.5], [0.44, 0.65], [0.61, 0.4], [0.72, 0.55], [0.81, 0.5], [0.96, 0.65], [1, 0.4]), stretch: t([0, 0.7], [0.09, 0.7], [0.2, 0.3], [0.27, 0.05], [0.9, 0.05], [0.96, 0.6], [1, 0.7]) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Adductors", role: "synergist", note: "Hip extension from the deep catch.", curve: t([0, 0.3], [0.2, 0.6], [0.36, 0.8], [0.44, 0.7], [0.61, 0.3], [0.72, 0.6], [1, 0.3]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Holds the back flat through the pulls and upright under the rack and the jerk.", curve: BACK },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "synergist", note: "Finishes the second pull and the drive on the toes.", curve: CALF_L, right: CALF_R },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "synergist", note: "Ankle extension with the medial head.", curve: CALF_L, right: CALF_R },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "synergist", note: "Ankle extension and balance in the split.", curve: CALF_L, right: CALF_R },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "prime-mover", note: "Shrugs the bar high in the second pull; supports it in the rack and overhead.", curve: SHRUG },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Drives the bar up in the jerk and holds it overhead.", curve: OVERHEAD },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "synergist", note: "Overhead support with the anterior fibres.", curve: OVERHEAD },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Locks the elbows out overhead.", curve: OVERHEAD },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "stabiliser", note: "Seats the shoulder under the overhead load.", curve: t([0, 0.2], [0.61, 0.3], [0.68, 0.8], [0.81, 0.7], [0.87, 0.3], [1, 0.2]) },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, steadying the bar overhead.", curve: t([0, 0.2], [0.61, 0.3], [0.68, 0.7], [0.81, 0.6], [0.87, 0.3], [1, 0.2]) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "synergist", note: "Keeps the bar close to the body through the pull.", curve: t([0, 0.4], [0.2, 0.7], [0.27, 0.6], [0.36, 0.3], [0.81, 0.4], [0.9, 0.6], [1, 0.4]) },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "synergist", note: "Pulls the body under the bar into the rack.", curve: ARMPULL },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar.", curve: GRIP },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulder", role: "stabiliser", note: "Holds the shoulder blades back under the bar.", curve: BRACE },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulder", role: "stabiliser", note: "Shoulder blade control with the middle trapezius.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk under the rack and the overhead bar.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace.", curve: BRACE },
  ],
};
