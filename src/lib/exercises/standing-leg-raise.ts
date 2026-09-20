import type { CurvePoint, Exercise } from "./types";

// Utthita Hasta Padangusthasana without the toe hold: the hands-free
// variation, arms out for balance. Designed (tools/myo/designed_clip.py):
// standing on the left leg, the right knee lifts to the chest (to t 0.22),
// the knee straightens to hold the leg out level (to 0.42), held to 0.68,
// then the same way down. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const LIFT = t([0, 0.15], [0.22, 0.7], [0.42, 1], [0.68, 1], [0.85, 0.7], [1, 0.15]); // the right hip flexors hold the leg up
const KNEE = t([0, 0.1], [0.22, 0.2], [0.42, 0.9], [0.68, 0.9], [0.85, 0.2], [1, 0.1]); // the right knee locked straight
const BALANCE = t([0, 0.3], [0.22, 0.75], [0.42, 0.9], [0.68, 0.9], [0.85, 0.75], [1, 0.3]); // the standing side
const STRETCH = t([0, 0.05], [0.22, 0.2], [0.42, 0.85], [0.68, 0.85], [0.85, 0.2], [1, 0.05]); // the right hamstrings behind the straight, lifted leg
const LOW = t([0, 0.1], [1, 0.1]);
const ARMS = t([0, 0.1], [0.22, 0.5], [0.42, 0.6], [0.68, 0.6], [0.85, 0.5], [1, 0.1]);
const side = (l: CurvePoint[], r: CurvePoint[]) => ({ curve: l, right: r });

export const standingLegRaise: Exercise = {
  slug: "standing-leg-raise",
  category: "Yoga",
  name: "Standing leg raise",
  durationMs: 7000,
  anchor: "feet",
  native: { clip: "/models/clips/standing-leg-raise.glb" },
  camera: { position: [3.2, 1.5, 1.6], target: [0, 0.9, 0.2] },
  disclaimer:
    "Utthita Hasta Padangusthasana in its hands-free variation, standing on the left leg with the arms out for balance.",
  phases: [
    { name: "knee to chest", t0: 0, t1: 0.22 },
    { name: "extend", t0: 0.22, t1: 0.42 },
    { name: "hold", t0: 0.42, t1: 0.68 },
    { name: "fold", t0: 0.68, t1: 0.85 },
    { name: "stand", t0: 0.85, t1: 1 },
  ],
  muscles: [
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "prime-mover", note: "Right: flexes the hip to hold the leg up and locks the knee straight, both at once. Left: steadies the standing knee.", ...side(t([0, 0.2], [0.42, 0.45], [0.68, 0.45], [1, 0.2]), LIFT) },
    { id: "pectineus", name: "Pectineus", group: "Adductors", role: "synergist", note: "Right: hip flexion with rectus femoris.", ...side(LOW, LIFT) },
    { id: "adductor-longus", name: "Adductor longus", group: "Adductors", role: "synergist", note: "Right: hip flexion from the inner thigh.", ...side(LOW, t([0, 0.1], [0.22, 0.6], [0.42, 0.7], [0.68, 0.7], [0.85, 0.6], [1, 0.1])) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "synergist", note: "Right: locks the lifted knee. Left: holds the standing knee.", ...side(BALANCE, KNEE) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "synergist", note: "Right: knee lock with the other vasti. Left: standing knee.", ...side(BALANCE, KNEE) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "synergist", note: "Right: flexes the lifted foot. Left: ankle balance from the front.", ...side(BALANCE, LIFT) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "stabiliser", note: "Right: on stretch behind the straight, lifted leg. Left: steadies the standing hip.", ...side(t([0, 0.2], [0.42, 0.4], [0.68, 0.4], [1, 0.2]), LOW), stretch: LOW, stretchRight: STRETCH },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "stabiliser", note: "Right: on stretch behind the lifted leg.", ...side(t([0, 0.2], [0.42, 0.35], [0.68, 0.35], [1, 0.2]), LOW), stretch: LOW, stretchRight: STRETCH },
    { id: "semimembranosus", name: "Semimembranosus", group: "Hamstrings", role: "stabiliser", note: "Right: on stretch behind the lifted leg.", ...side(t([0, 0.2], [0.42, 0.35], [0.68, 0.35], [1, 0.2]), LOW), stretch: LOW, stretchRight: STRETCH },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "stabiliser", note: "Right: lengthened by the deep hip flexion. Left: holds the standing hip extended.", ...side(BALANCE, LOW), stretch: LOW, stretchRight: t([0, 0.05], [0.22, 0.7], [0.42, 0.6], [0.68, 0.6], [0.85, 0.7], [1, 0.05]) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "prime-mover", note: "Left: keeps the pelvis level over the one foot on the floor: the balance muscle here.", ...side(BALANCE, LOW) },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Gluteals", role: "synergist", note: "Left: pelvis control with gluteus medius.", ...side(BALANCE, LOW) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "stabiliser", note: "Left: balances the standing ankle.", ...side(BALANCE, LOW) },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "stabiliser", note: "Left: ankle balance with the medial head.", ...side(BALANCE, LOW) },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "stabiliser", note: "Left: ankle balance.", ...side(BALANCE, LOW) },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Lower leg", role: "stabiliser", note: "Left: steadies the standing ankle from the outside.", ...side(BALANCE, LOW) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the trunk tall over the standing leg.", curve: t([0, 0.3], [0.42, 0.6], [0.68, 0.6], [1, 0.3]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the pelvis so the lifted leg does not tip it back.", curve: t([0, 0.3], [0.42, 0.65], [0.68, 0.65], [1, 0.3]) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Resist the twist toward the lifted leg.", curve: t([0, 0.3], [0.42, 0.55], [0.68, 0.55], [1, 0.3]) },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "stabiliser", note: "Holds the arms out to the sides for balance.", curve: ARMS },
  ],
};
