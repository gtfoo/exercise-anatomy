import type { CurvePoint, Exercise, MuscleActivation } from "./types";

// Four stretches, designed (tools/myo/designed_clip.py): each cycle moves
// into the stretch over its first 40 %, holds to 75 %, then eases out. The
// point of each is the teal channel: the muscle being lengthened. What works
// is whatever holds the position. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const ENTER = 0.4;
const RELEASE = 0.75;
const HOLD = (v: number) => t([0, Math.min(v, 0.15)], [ENTER, v], [RELEASE, v], [1, Math.min(v, 0.15)]);
const PHASES = [
  { name: "ease in", t0: 0, t1: ENTER },
  { name: "hold", t0: ENTER, t1: RELEASE },
  { name: "ease out", t0: RELEASE, t1: 1 },
];
const DISCLAIMER =
  "Eased into, held, eased out.";
const m = (id: string, name: string, group: string, role: MuscleActivation["role"], v: number, note: string, vr?: number): MuscleActivation => ({
  id,
  name,
  group,
  role,
  note,
  curve: HOLD(v),
  ...(vr !== undefined ? { right: HOLD(vr) } : {}),
});
const st = (base: MuscleActivation, s: number, sr?: number): MuscleActivation => ({ ...base, stretch: HOLD(s), ...(sr !== undefined ? { stretchRight: HOLD(sr) } : {}) });
const stretch = (slug: string, name: string, what: string, camera: Exercise["camera"], muscles: MuscleActivation[], extra: Partial<Exercise> = {}): Exercise => ({
  slug,
  category: "Stretches",
  name,
  durationMs: 6000,
  anchor: "free",
  native: { clip: `/models/clips/${slug}.glb` },
  camera,
  disclaimer: DISCLAIMER + " " + what,
  phases: PHASES,
  muscles,
  ...extra,
});

export const quadStretch = stretch(
  "quad-stretch",
  "Standing quad stretch",
  "Standing on the left leg, the right heel drawn to the buttock and held.",
  { position: [3.0, 1.4, 1.8], target: [0, 0.9, 0] },
  [
    st(m("rectus-femoris", "Rectus femoris", "Bent leg", "stabiliser", 0.1, "Right: the target, lengthened over both the hip and the fully bent knee.", 0.1), 0.05, 0.9),
    st(m("vastus-lateralis", "Vastus lateralis", "Bent leg", "stabiliser", 0.45, "Right: lengthened by the full knee bend. Left: holds the standing knee.", 0.1), 0.05, 0.6),
    st(m("vastus-medialis", "Vastus medialis", "Bent leg", "stabiliser", 0.45, "Right: lengthened by the knee bend.", 0.1), 0.05, 0.6),
    st(m("vastus-intermedius", "Vastus intermedius", "Bent leg", "stabiliser", 0.3, "Right: lengthened with the other vasti.", 0.1), 0.05, 0.6),
    st(m("pectineus", "Pectineus", "Bent leg", "stabiliser", 0.1, "Right: lengthened as the thigh drops back.", 0.1), 0.05, 0.4),
    m("biceps-femoris", "Biceps femoris", "Bent leg", "synergist", 0.2, "Right: helps hold the heel up to the hand.", 0.35),
    m("gluteus-maximus", "Gluteus maximus", "Bent leg", "synergist", 0.4, "Right: draws the thigh back in line with the body. Left: the standing hip.", 0.5),
    m("gluteus-medius", "Gluteus medius", "Standing leg", "prime-mover", 0.85, "Left: keeps the pelvis level on one foot.", 0.2),
    m("gluteus-minimus", "Gluteus minimus", "Standing leg", "synergist", 0.65, "Left: pelvis control with the medius.", 0.2),
    m("soleus", "Soleus", "Standing leg", "stabiliser", 0.5, "Left: ankle balance.", 0.1),
    m("fibularis", "Fibularis longus and brevis", "Standing leg", "stabiliser", 0.5, "Left: steadies the standing ankle from the outside.", 0.1),
    m("tibialis-anterior", "Tibialis anterior", "Standing leg", "stabiliser", 0.5, "Left: ankle balance from the front.", 0.1),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "synergist", 0.45, "Tucks the pelvis so the front of the hip opens rather than the back arching."),
    m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.4, "Keeps the trunk tall."),
    m("posterior-deltoid", "Posterior deltoid", "Arms", "synergist", 0.3, "Right: holds the arm back to the foot. Left: the balancing arm.", 0.45),
    m("biceps-brachii", "Biceps brachii", "Arms", "stabiliser", 0.1, "Right: holds the foot.", 0.4),
    m("forearm-flexors", "Forearm flexors", "Arms", "stabiliser", 0.1, "Right: grips the foot.", 0.5),
    m("middle-deltoid", "Middle deltoid", "Arms", "stabiliser", 0.5, "Left: holds the arm out for balance.", 0.15),
  ],
);

export const calfStretch = stretch(
  "calf-stretch",
  "Calf stretch",
  "The right leg back straight with the heel down, the left knee bent, the hands on the front thigh, leaning in.",
  { position: [1.6, 1.2, 3.0], target: [0, 0.75, 0.1] },
  [
    st(m("gastrocnemius-medial", "Gastrocnemius (medial)", "Back leg", "stabiliser", 0.1, "Right: the target, lengthened over the straight knee and the dropped heel.", 0.1), 0.05, 0.9),
    st(m("gastrocnemius-lateral", "Gastrocnemius (lateral)", "Back leg", "stabiliser", 0.1, "Right: lengthened with the medial head.", 0.1), 0.05, 0.9),
    st(m("soleus", "Soleus", "Back leg", "stabiliser", 0.15, "Right: lengthened by the dropped heel; more so with the knee bent, which this version does not do.", 0.15), 0.05, 0.6),
    st(m("biceps-femoris", "Biceps femoris", "Back leg", "stabiliser", 0.15, "Right: mildly lengthened behind the straight leg.", 0.15), 0.05, 0.3),
    m("tibialis-anterior", "Tibialis anterior", "Back leg", "synergist", 0.2, "Right: pulls the shin forward over the planted heel.", 0.5),
    m("vastus-lateralis", "Vastus lateralis", "Back leg", "synergist", 0.3, "Right: locks the back knee straight. Left: the bent front knee.", 0.45),
    m("gluteus-maximus", "Gluteus maximus", "Back leg", "synergist", 0.2, "Right: extends the back hip as the body leans in.", 0.45),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "stabiliser", 0.2, "Rests the hands on the front thigh."),
    m("triceps-long-head", "Triceps, long head", "Arms", "stabiliser", 0.25, "Props a little of the lean on the front thigh."),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.4, "Holds the body in one line from the heel to the head."),
    m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.35, "Keeps the back straight through the lean."),
  ],
);

export const hamstringStretch = stretch(
  "hamstring-stretch",
  "Seated hamstring stretch",
  "Sitting with the legs straight and the feet flexed, folding forward over them.",
  { position: [3.0, 1.2, 1.6], target: [0, 0.4, 0.3] },
  [
    st(m("biceps-femoris", "Biceps femoris", "Hamstrings", "stabiliser", 0.1, "The target: lengthened over the straight knees as the trunk folds over the legs."), 0.9),
    st(m("semitendinosus", "Semitendinosus", "Hamstrings", "stabiliser", 0.1, "Lengthened with biceps femoris."), 0.9),
    st(m("semimembranosus", "Semimembranosus", "Hamstrings", "stabiliser", 0.1, "Lengthened with the other hamstrings."), 0.9),
    st(m("gastrocnemius-medial", "Gastrocnemius (medial)", "Lower leg", "stabiliser", 0.1, "Lengthened by the flexed feet with the knees straight."), 0.5),
    st(m("gastrocnemius-lateral", "Gastrocnemius (lateral)", "Lower leg", "stabiliser", 0.1, "Lengthened by the flexed feet."), 0.5),
    st(m("gluteus-maximus", "Gluteus maximus", "Hips", "stabiliser", 0.1, "Lengthened by the deep hip fold."), 0.5),
    st(m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.2, "Lengthened as the back rounds over the legs."), 0.6),
    m("rectus-femoris", "Rectus femoris", "Hips", "prime-mover", 0.55, "Pulls the trunk forward at the hip and locks the knees straight."),
    m("pectineus", "Pectineus", "Hips", "synergist", 0.45, "Hip flexion with rectus femoris."),
    m("vastus-lateralis", "Vastus lateralis", "Legs", "synergist", 0.4, "Keeps the knees pressed straight."),
    m("tibialis-anterior", "Tibialis anterior", "Lower leg", "synergist", 0.55, "Flexes the feet, toes toward the shins."),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "synergist", 0.4, "Folds the trunk forward."),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "stabiliser", 0.3, "Reaches the arms toward the feet."),
  ],
);
