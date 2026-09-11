import type { CurvePoint, Exercise } from "./types";

// A pistol squat on each leg from a Mixamo clip, converted bone for bone
// and played in place: the clip opens at the bottom on the left leg, stands
// by t = 0.25, lowers onto the right leg to its bottom at t = 0.55, stands
// by 0.75 and lowers onto the left again to close the loop. Whichever leg
// squats, the other is held straight out in front: its own work is holding
// itself up, and its hamstrings are on stretch. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
// The squatting leg: loaded most at the bottom, easing as it stands, then loaded again lowering (eccentric).
const LEFT = t([0, 1], [0.12, 0.8], [0.25, 0.3], [0.3, 0.15], [0.7, 0.15], [0.75, 0.3], [0.9, 0.8], [1, 1]);
const RIGHT = t([0, 0.15], [0.25, 0.15], [0.3, 0.3], [0.45, 0.8], [0.55, 1], [0.67, 0.8], [0.75, 0.3], [0.8, 0.15], [1, 0.15]);
const LEFT_HELP = t([0, 0.7], [0.12, 0.55], [0.25, 0.2], [0.3, 0.1], [0.7, 0.1], [0.75, 0.2], [0.9, 0.55], [1, 0.7]);
const RIGHT_HELP = t([0, 0.1], [0.25, 0.1], [0.3, 0.2], [0.45, 0.55], [0.55, 0.7], [0.67, 0.55], [0.75, 0.2], [0.8, 0.1], [1, 0.1]);
const LEFT_BAL = t([0, 0.8], [0.25, 0.4], [0.3, 0.2], [0.7, 0.2], [0.75, 0.4], [1, 0.8]);
const RIGHT_BAL = t([0, 0.2], [0.25, 0.2], [0.3, 0.4], [0.55, 0.8], [0.75, 0.4], [0.8, 0.2], [1, 0.2]);
// The free leg held out straight: the right while the left squats, the left while the right squats.
const LEFT_OUT = t([0, 0.15], [0.25, 0.2], [0.4, 0.7], [0.55, 0.85], [0.7, 0.7], [0.8, 0.2], [1, 0.15]);
const RIGHT_OUT = t([0, 0.85], [0.12, 0.7], [0.25, 0.2], [0.75, 0.2], [0.88, 0.7], [1, 0.85]);
const LEFT_DEEP = t([0, 0.8], [0.25, 0.05], [0.75, 0.05], [1, 0.8]); // on length at the bottom
const RIGHT_DEEP = t([0, 0.05], [0.3, 0.05], [0.55, 0.8], [0.8, 0.05], [1, 0.05]);
const BRACE = t([0, 0.6], [0.25, 0.4], [0.55, 0.6], [0.75, 0.4], [1, 0.6]);
const ARMS = t([0, 0.6], [0.25, 0.3], [0.55, 0.6], [0.75, 0.3], [1, 0.6]);
const side = (l: CurvePoint[], r: CurvePoint[]) => ({ curve: l, right: r });

export const pistolSquat: Exercise = {
  slug: "pistol-squat",
  category: "Legs and hips",
  name: "Pistol squat",
  durationMs: 4030, // the captured pair of reps at their real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/pistol-squat.glb" },
  camera: { position: [2.6, 1.3, 2.4], target: [0, 0.7, 0.2] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip played in place, one rep on each leg. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "left leg: rise", t0: 0, t1: 0.25 },
    { name: "lower onto the right", t0: 0.25, t1: 0.55 },
    { name: "right leg: rise", t0: 0.55, t1: 0.75 },
    { name: "lower onto the left", t0: 0.75, t1: 1 },
  ],
  muscles: [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Extends the squatting knee through the whole range on one leg.", ...side(LEFT, RIGHT), stretch: LEFT_DEEP, stretchRight: RIGHT_DEEP },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Knee extension, and keeps the kneecap tracking as the knee travels far forward.", ...side(LEFT, RIGHT), stretch: LEFT_DEEP, stretchRight: RIGHT_DEEP },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor of the squatting leg.", ...side(LEFT, RIGHT) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "prime-mover", note: "On the free leg, holds it out straight in front (hip flexion and knee extension); on the squatting leg, knee extension.", ...side(LEFT_OUT, RIGHT_OUT) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Extends the squatting hip out of the deep bottom.", ...side(LEFT, RIGHT), stretch: LEFT_DEEP, stretchRight: RIGHT_DEEP },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "stabiliser", note: "Keeps the pelvis level over the one foot on the floor.", ...side(LEFT_BAL, RIGHT_BAL) },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Gluteals", role: "stabiliser", note: "Pelvis control with gluteus medius.", ...side(LEFT_BAL, RIGHT_BAL) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Hip extension on the squatting leg; on stretch behind the straight, lifted leg.", ...side(LEFT_HELP, RIGHT_HELP), stretch: LEFT_OUT, stretchRight: RIGHT_OUT },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension; on stretch behind the lifted leg.", ...side(LEFT_HELP, RIGHT_HELP), stretch: LEFT_OUT, stretchRight: RIGHT_OUT },
    { id: "semimembranosus", name: "Semimembranosus", group: "Hamstrings", role: "synergist", note: "Hip extension; on stretch behind the lifted leg.", ...side(LEFT_HELP, RIGHT_HELP), stretch: LEFT_OUT, stretchRight: RIGHT_OUT },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Adductors", role: "synergist", note: "Hip extension from the deep bottom.", ...side(LEFT_HELP, RIGHT_HELP) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "stabiliser", note: "Balances the standing ankle under the whole body.", ...side(LEFT_BAL, RIGHT_BAL) },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "stabiliser", note: "Ankle balance with the medial head.", ...side(LEFT_BAL, RIGHT_BAL) },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "stabiliser", note: "Works hard with the knee far forward over the foot.", ...side(LEFT_BAL, RIGHT_BAL), stretch: LEFT_DEEP, stretchRight: RIGHT_DEEP },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "stabiliser", note: "Pulls the shin forward over the standing foot at the bottom; holds the free foot up.", ...side(t([0, 0.7], [0.25, 0.5], [0.55, 0.7], [0.75, 0.5], [1, 0.7]), t([0, 0.7], [0.25, 0.5], [0.55, 0.7], [0.75, 0.5], [1, 0.7])) },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Lower leg", role: "stabiliser", note: "Steady the ankle from the outside against tibialis anterior.", ...side(t([0, 0.7], [0.25, 0.5], [0.55, 0.7], [0.75, 0.5], [1, 0.7]), t([0, 0.7], [0.25, 0.5], [0.55, 0.7], [0.75, 0.5], [1, 0.7])) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the spine as the trunk leans forward to balance.", curve: BRACE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk, and helps hold the free leg up.", curve: BRACE },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "stabiliser", note: "Holds the arms out in front as a counterbalance.", curve: ARMS },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(ARMS, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(ARMS, 0.5) },
  ],
};
