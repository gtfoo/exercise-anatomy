import type { CurvePoint, Exercise } from "./types";
import { inHalf } from "./types";

// A designed forward lunge (tools/myo/designed_clip.py): the left leg steps,
// then the right; front thigh horizontal and shin vertical at each bottom
// (t = 0.275 and 0.775), back knee a hand above the floor, both legs in the
// sagittal plane, arms at the sides. The only free capture (CMU subject 144, tried 2026-09-10) had a
// wide martial-arts stance with the back thigh swung 28° out; the owner
// chose textbook form. Activation is qualitative.

// One cycle is a lunge on the left leg then one on the right. Leg muscles
// get a single lunge's shape in their own half (left first, right second)
// and rest in the other; the trunk braces through both.
const twice = (pts: [number, number][]): CurvePoint[] => [...pts.map(([x, v]) => [x / 2, v] as CurvePoint), ...pts.map(([x, v]) => [0.5 + x / 2, v] as CurvePoint)];
const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
const leftHalf = (c: CurvePoint[]) => inHalf(c, 0, c[0][1]);
const rightHalf = (c: CurvePoint[]) => inHalf(c, 1, c[0][1]);
// Front-leg extensors: load builds through the descent, peaks on the drive back up.
const EXTENSOR = t([0, 0.1], [0.3, 0.45], [0.54, 0.8], [0.7, 1], [0.85, 0.5], [1, 0.1]);
const HIP_EXT = t([0, 0.1], [0.35, 0.3], [0.54, 0.7], [0.72, 0.95], [0.88, 0.4], [1, 0.1]);
// Hamstrings and adductors steady the knee and hip through the deep part.
const STEADY = t([0, 0.1], [0.4, 0.45], [0.54, 0.6], [0.7, 0.55], [0.9, 0.2], [1, 0.1]);
const CALF = t([0, 0.15], [0.3, 0.35], [0.54, 0.5], [0.72, 0.7], [0.9, 0.25], [1, 0.15]);
const BRACE = twice([[0, 0.2], [0.54, 0.45], [1, 0.2]]);

export const lunge: Exercise = {
  slug: "lunge",
  category: "Legs and hips",
  name: "Forward lunge",
  durationMs: 5600, // two lunges, one on each leg
  anchor: "free",
  native: { clip: "/models/clips/lunge.glb" },
  camera: { position: [3.0, 1.25, 1.6], target: [0, 0.8, 0.3] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed to textbook form, not captured: the only free capture used a wide stance. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "left step", t0: 0, t1: 0.15 },
    { name: "left descent", t0: 0.15, t1: 0.275 },
    { name: "left drive", t0: 0.275, t1: 0.425 },
    { name: "recover", t0: 0.425, t1: 0.5 },
    { name: "right step", t0: 0.5, t1: 0.65 },
    { name: "right descent", t0: 0.65, t1: 0.775 },
    { name: "right drive", t0: 0.775, t1: 0.925 },
    { name: "recover", t0: 0.925, t1: 1 },
  ],
  muscles: [
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "prime-mover", note: "Extends the front knee on the drive back up; also flexes the hip of the stepping leg.", curve: leftHalf(EXTENSOR), stretch: inHalf([[0, 0.1], [0.3, 0.4], [0.55, 0.7], [0.75, 0.4], [1, 0.1]], 1, 0.05), stretchRight: inHalf([[0, 0.1], [0.3, 0.4], [0.55, 0.7], [0.75, 0.4], [1, 0.1]], 0, 0.05), right: rightHalf(EXTENSOR) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "The front knee's main extensor, hardest on the way up.", curve: leftHalf(EXTENSOR), right: rightHalf(EXTENSOR) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Extends the front knee and keeps the kneecap tracking straight.", curve: leftHalf(EXTENSOR), right: rightHalf(EXTENSOR) },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor under rectus femoris.", curve: leftHalf(EXTENSOR), right: rightHalf(EXTENSOR) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Extends the front hip to push the body back to standing.", curve: leftHalf(HIP_EXT), stretch: inHalf([[0, 0.05], [0.3, 0.5], [0.55, 0.75], [0.8, 0.2], [1, 0.05]], 0, 0.05), stretchRight: inHalf([[0, 0.05], [0.3, 0.5], [0.55, 0.75], [0.8, 0.2], [1, 0.05]], 1, 0.05), right: rightHalf(HIP_EXT) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "stabiliser", note: "Keeps the pelvis level and the front knee from falling inward on one leg.", curve: leftHalf(t([0, 0.2], [0.3, 0.6], [0.54, 0.75], [0.8, 0.6], [1, 0.2])), right: rightHalf(t([0, 0.2], [0.3, 0.6], [0.54, 0.75], [0.8, 0.6], [1, 0.2])) },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Gluteals", role: "stabiliser", note: "Works with gluteus medius to steady the hip.", curve: leftHalf(t([0, 0.15], [0.3, 0.5], [0.54, 0.65], [0.8, 0.5], [1, 0.15])), right: rightHalf(t([0, 0.15], [0.3, 0.5], [0.54, 0.65], [0.8, 0.5], [1, 0.15])) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Helps extend the front hip and controls the knee.", curve: leftHalf(STEADY), right: rightHalf(STEADY) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension and knee control with biceps femoris.", curve: leftHalf(STEADY), right: rightHalf(STEADY) },
    { id: "semimembranosus", name: "Semimembranosus", group: "Hamstrings", role: "synergist", note: "Hip extension and knee control on the front leg.", curve: leftHalf(STEADY), right: rightHalf(STEADY) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Adductors", role: "synergist", note: "Its hamstring-like part extends the hip; the rest steadies the thigh.", curve: leftHalf(STEADY), right: rightHalf(STEADY) },
    { id: "adductor-longus", name: "Adductor longus", group: "Adductors", role: "stabiliser", note: "Holds the thigh in line while the legs are split.", curve: BRACE, stretch: inHalf([[0, 0.05], [0.55, 0.6], [1, 0.05]], 1, 0.05), stretchRight: inHalf([[0, 0.05], [0.55, 0.6], [1, 0.05]], 0, 0.05) },
    { id: "pectineus", name: "Pectineus", group: "Adductors", role: "synergist", note: "Adducts and flexes the hip with adductor longus.", curve: scaled(BRACE, 0.8) },
    { id: "gracilis", name: "Gracilis", group: "Adductors", role: "synergist", note: "Adducts the hip along the inner thigh.", curve: scaled(BRACE, 0.7) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Calf", role: "synergist", note: "Pushes off the front foot on the way back.", curve: leftHalf(CALF), right: rightHalf(CALF) },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Calf", role: "synergist", note: "Pushes off the front foot on the way back.", curve: leftHalf(CALF), right: rightHalf(CALF) },
    { id: "soleus", name: "Soleus", group: "Calf", role: "stabiliser", note: "Steadies the ankle under the front knee.", curve: leftHalf(CALF), right: rightHalf(CALF) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Calf", role: "stabiliser", note: "Controls the shin over the planted front foot.", curve: leftHalf(BRACE), right: rightHalf(BRACE) },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Calf", role: "stabiliser", note: "Steady the ankle from the outside against tibialis anterior.", curve: scaled(leftHalf(BRACE), 0.8), right: scaled(rightHalf(BRACE), 0.8) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the trunk upright over the split stance.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk with the back muscles.", curve: BRACE },
  ],
};
