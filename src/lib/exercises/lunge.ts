import type { CurvePoint, Exercise } from "./types";
import type { MotionClip3D } from "@/lib/kinematics/types";
import motion3d from "@/lib/motion/lunge-3d.json";

// One forward lunge from CMU subject 144 trial 17: standing, step and sink,
// push back to standing. Bottom of the lunge at about t = 0.54. Activation is
// qualitative: no estimate has been run for this movement.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Front-leg extensors: load builds through the descent, peaks on the drive back up.
const EXTENSOR = t([0, 0.1], [0.3, 0.45], [0.54, 0.8], [0.7, 1], [0.85, 0.5], [1, 0.1]);
const HIP_EXT = t([0, 0.1], [0.35, 0.3], [0.54, 0.7], [0.72, 0.95], [0.88, 0.4], [1, 0.1]);
// Hamstrings and adductors steady the knee and hip through the deep part.
const STEADY = t([0, 0.1], [0.4, 0.45], [0.54, 0.6], [0.7, 0.55], [0.9, 0.2], [1, 0.1]);
const CALF = t([0, 0.15], [0.3, 0.35], [0.54, 0.5], [0.72, 0.7], [0.9, 0.25], [1, 0.15]);
const BRACE = t([0, 0.2], [0.54, 0.45], [1, 0.2]);

export const lunge: Exercise = {
  slug: "lunge",
  name: "Forward lunge",
  durationMs: 2800, // the captured cycle at its real tempo
  anchor: "free",
  motion3d: motion3d as unknown as MotionClip3D,
  native: { clip: "/models/clips/lunge.glb" },
  camera: { position: [3.0, 1.25, 1.6], target: [0, 0.8, 0.3] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "step", t0: 0, t1: 0.3 },
    { name: "descent", t0: 0.3, t1: 0.54 },
    { name: "drive", t0: 0.54, t1: 0.85 },
    { name: "recover", t0: 0.85, t1: 1 },
  ],
  muscles: [
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "prime-mover", note: "Extends the front knee on the drive back up; also flexes the hip of the stepping leg.", curve: EXTENSOR },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "The front knee's main extensor, hardest on the way up.", curve: EXTENSOR },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Extends the front knee and keeps the kneecap tracking straight.", curve: EXTENSOR },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor under rectus femoris.", curve: EXTENSOR },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Extends the front hip to push the body back to standing.", curve: HIP_EXT },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "stabiliser", note: "Keeps the pelvis level and the front knee from falling inward on one leg.", curve: t([0, 0.2], [0.3, 0.6], [0.54, 0.75], [0.8, 0.6], [1, 0.2]) },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Gluteals", role: "stabiliser", note: "Works with gluteus medius to steady the hip.", curve: t([0, 0.15], [0.3, 0.5], [0.54, 0.65], [0.8, 0.5], [1, 0.15]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Helps extend the front hip and controls the knee.", curve: STEADY },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension and knee control with biceps femoris.", curve: STEADY },
    { id: "semimembranosus", name: "Semimembranosus", group: "Hamstrings", role: "synergist", note: "Hip extension and knee control on the front leg.", curve: STEADY },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Adductors", role: "synergist", note: "Its hamstring-like part extends the hip; the rest steadies the thigh.", curve: STEADY },
    { id: "adductor-longus", name: "Adductor longus", group: "Adductors", role: "stabiliser", note: "Holds the thigh in line while the legs are split.", curve: BRACE },
    { id: "gastrocnemius-medial", name: "Gastrocnemius", group: "Calf", role: "synergist", note: "Pushes off the front foot on the way back.", curve: CALF },
    { id: "soleus", name: "Soleus", group: "Calf", role: "stabiliser", note: "Steadies the ankle under the front knee.", curve: CALF },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Calf", role: "stabiliser", note: "Controls the shin over the planted front foot.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the trunk upright over the split stance.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk with the back muscles.", curve: BRACE },
  ],
};
