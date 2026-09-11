import type { CurvePoint, Exercise } from "./types";

// Designed cycling (tools/myo/designed_clip.py): seated on a drawn bike,
// trunk leant to the handlebar, the pedals a half turn apart. t = 0 is the
// left pedal at the bottom of its circle; each leg pushes from the top of
// the stroke (t about 0.5 for the left, 0 for the right). Both sides are
// one mesh, so the curves carry two pushes per turn. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Down-stroke: the pushing leg works from the top of the circle to the bottom.
const PUSH = t([0, 0.55], [0.1, 0.35], [0.25, 0.9], [0.4, 1], [0.5, 0.55], [0.6, 0.35], [0.75, 0.9], [0.9, 1], [1, 0.55]);
const HIPFLEX = t([0, 0.4], [0.15, 0.85], [0.3, 0.5], [0.5, 0.4], [0.65, 0.85], [0.8, 0.5], [1, 0.4]);
const CALF = t([0, 0.5], [0.3, 0.85], [0.45, 0.7], [0.5, 0.5], [0.8, 0.85], [0.95, 0.7], [1, 0.5]);
const BRACE = t([0, 0.4], [1, 0.4]);

export const cycling: Exercise = {
  slug: "cycling",
  category: "Cardio",
  name: "Cycling",
  durationMs: 1000, // one pedal turn at 60 rpm
  anchor: "free",
  props: "pedals",
  scenery: { kind: "bike" },
  native: { clip: "/models/clips/cycling.glb" },
  camera: { position: [2.9, 1.3, 1.4], target: [0, 0.75, 0.2] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured; the bike is drawn and the pedal load is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "right push", t0: 0, t1: 0.5 },
    { name: "left push", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Knee", role: "prime-mover", note: "Straightens the knee through the down-stroke: the main pedalling force.", curve: PUSH },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Knee", role: "prime-mover", note: "Knee extension with the other vasti.", curve: PUSH },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Knee", role: "prime-mover", note: "Deep knee extensor.", curve: PUSH },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Knee", role: "synergist", note: "Extends the knee and lifts the thigh over the top of the stroke.", curve: HIPFLEX },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "prime-mover", note: "Extends the hip from the top of the stroke through the front.", curve: PUSH },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hip", role: "synergist", note: "Pulls back through the bottom of the circle.", curve: t([0, 0.9], [0.15, 0.5], [0.35, 0.35], [0.5, 0.9], [0.65, 0.5], [0.85, 0.35], [1, 0.9]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hip", role: "synergist", note: "Pulls back through the bottom with biceps femoris.", curve: t([0, 0.85], [0.15, 0.5], [0.35, 0.35], [0.5, 0.85], [0.65, 0.5], [0.85, 0.35], [1, 0.85]) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Ankle", role: "synergist", note: "Points the foot through the bottom of the stroke.", curve: CALF },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Ankle", role: "synergist", note: "Ankle push with the medial head.", curve: CALF },
    { id: "soleus", name: "Soleus", group: "Ankle", role: "synergist", note: "Steadies the ankle on the pedal.", curve: CALF },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Ankle", role: "synergist", note: "Lifts the toes on the up-stroke.", curve: HIPFLEX },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the leant trunk.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk against the leg drive.", curve: BRACE },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "stabiliser", note: "Props the trunk on the handlebar.", curve: BRACE },
  ],
};
