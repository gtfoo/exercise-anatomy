import type { CurvePoint, Exercise, MuscleActivation } from "./types";

// Five yoga holds, designed (tools/myo/designed_clip.py) because no free
// capture exists. Each cycle enters the position from rest (lying, standing
// or crouching) over its first 40 %, holds it to 75 %, then releases back,
// so the loop is continuous. The muscles listed rise into the hold and ease
// off with it. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const ENTER = 0.4;
const RELEASE = 0.75;
const HOLD = (v: number) => t([0, Math.min(v, 0.15)], [ENTER, v], [RELEASE, v], [1, Math.min(v, 0.15)]);
const PHASES = [
  { name: "enter", t0: 0, t1: ENTER },
  { name: "hold", t0: ENTER, t1: RELEASE },
  { name: "release", t0: RELEASE, t1: 1 },
];
const DISCLAIMER =
  "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The position is designed, not captured: entered from rest, held, released; nothing here is estimated or measured. Educational illustration, not training or medical advice.";
// v is the left side's level; vr the right side's, when the hold is asymmetric.
const m = (id: string, name: string, group: string, role: MuscleActivation["role"], v: number, note: string, vr?: number): MuscleActivation => ({
  id,
  name,
  group,
  role,
  note,
  curve: HOLD(v),
  ...(vr !== undefined ? { right: HOLD(vr) } : {}),
});
// A muscle held on stretch through the pose: s is how far it is lengthened (left), sr the right.
const st = (base: MuscleActivation, s: number, sr?: number): MuscleActivation => ({ ...base, stretch: HOLD(s), ...(sr !== undefined ? { stretchRight: HOLD(sr) } : {}) });

export const boatPose: Exercise = {
  slug: "boat-pose",
  category: "Yoga",
  name: "Boat pose",
  durationMs: 6000,
  anchor: "free",
  native: { clip: "/models/clips/boat-pose.glb" },
  camera: { position: [3.0, 1.3, 1.6], target: [0, 0.5, 0.3] },
  disclaimer: DISCLAIMER + " Navasana.",
  phases: PHASES,
  muscles: [
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "prime-mover", 0.9, "Holds the trunk up off the floor against the lever of the legs."),
    m("external-obliques", "External obliques", "Trunk", "synergist", 0.6, "Brace the sides of the trunk."),
    m("transversus-abdominis", "Transversus abdominis", "Trunk", "synergist", 0.7, "Deep brace under the obliques."),
    m("rectus-femoris", "Rectus femoris", "Hip flexors", "prime-mover", 0.9, "Holds the straight legs up: hip flexion against gravity."),
    m("adductor-longus", "Adductor longus", "Hip flexors", "synergist", 0.5, "Assists hip flexion and keeps the legs together."),
    m("vastus-lateralis", "Vastus lateralis", "Legs", "synergist", 0.6, "Locks the knees straight."),
    m("vastus-medialis", "Vastus medialis", "Legs", "synergist", 0.6, "Locks the knees with the other vasti."),
    st(m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.6, "Keeps the back long rather than rounded."), 0.35),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "stabiliser", 0.5, "Holds the arms out in front."),
    m("tibialis-anterior", "Tibialis anterior", "Legs", "stabiliser", 0.3, "Steadies the ankles."),
  ],
};

export const warrior3: Exercise = {
  slug: "warrior-3",
  category: "Yoga",
  name: "Warrior III",
  durationMs: 6000,
  anchor: "feet",
  native: { clip: "/models/clips/warrior-3.glb" },
  camera: { position: [3.2, 1.5, 1.4], target: [0, 0.95, 0.1] },
  disclaimer: DISCLAIMER + " Virabhadrasana III, standing on the left leg.",
  phases: PHASES,
  muscles: [
    m("gluteus-maximus", "Gluteus maximus", "Standing hip", "prime-mover", 0.75, "Left: holds the trunk level over the standing leg. Right: holds the lifted leg up.", 0.9),
    m("gluteus-medius", "Gluteus medius", "Standing hip", "prime-mover", 0.85, "Keeps the pelvis level on the standing (left) leg: the balance muscle here.", 0.35),
    m("gluteus-minimus", "Gluteus minimus", "Standing hip", "synergist", 0.7, "Pelvis control with gluteus medius on the standing side.", 0.3),
    st(m("biceps-femoris", "Biceps femoris", "Lifted leg", "prime-mover", 0.4, "Holds the lifted (right) leg up in line with the trunk.", 0.8), 0.85, 0.1),
    st(m("semitendinosus", "Semitendinosus", "Lifted leg", "prime-mover", 0.35, "Hip extension of the lifted leg with biceps femoris.", 0.75), 0.85, 0.1),
    st(m("semimembranosus", "Semimembranosus", "Lifted leg", "synergist", 0.35, "Hip extension of the lifted leg.", 0.7), 0.85, 0.1),
    m("erector-spinae", "Erector spinae", "Trunk", "prime-mover", 0.85, "Holds the horizontal trunk from folding."),
    m("vastus-lateralis", "Vastus lateralis", "Standing leg", "synergist", 0.6, "Keeps the standing knee straight.", 0.3),
    m("vastus-medialis", "Vastus medialis", "Standing leg", "synergist", 0.6, "Standing knee with the other vasti.", 0.3),
    m("gastrocnemius-medial", "Gastrocnemius (medial)", "Standing leg", "stabiliser", 0.5, "Balances the standing ankle.", 0.2),
    m("gastrocnemius-lateral", "Gastrocnemius (lateral)", "Standing leg", "stabiliser", 0.5, "Balances the standing ankle with the medial head.", 0.2),
    m("soleus", "Soleus", "Standing leg", "stabiliser", 0.5, "Ankle balance.", 0.2),
    m("tibialis-anterior", "Tibialis anterior", "Standing leg", "stabiliser", 0.5, "Ankle balance from the front.", 0.2),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.5, "Braces the trunk with the back muscles."),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "synergist", 0.6, "Holds the arms forward in line with the body."),
    m("lower-trapezius", "Lower trapezius", "Arms", "stabiliser", 0.5, "Keeps the shoulder blades down with the arms overhead."),
  ],
};

export const wheelPose: Exercise = {
  slug: "wheel-pose",
  category: "Yoga",
  name: "Wheel pose",
  durationMs: 6000,
  anchor: "free",
  native: { clip: "/models/clips/wheel-pose.glb" },
  camera: { position: [3.0, 1.2, 1.4], target: [0, 0.5, 0] },
  disclaimer: DISCLAIMER + " Urdhva Dhanurasana.",
  phases: PHASES,
  muscles: [
    m("gluteus-maximus", "Gluteus maximus", "Hips", "prime-mover", 0.9, "Extends the hips to lift the arch."),
    m("biceps-femoris", "Biceps femoris", "Hips", "synergist", 0.6, "Hip extension with the glutes."),
    m("semimembranosus", "Semimembranosus", "Hips", "synergist", 0.55, "Hip extension."),
    m("erector-spinae", "Erector spinae", "Back", "prime-mover", 0.9, "Arches the spine and holds it there."),
    m("vastus-lateralis", "Vastus lateralis", "Legs", "synergist", 0.7, "Pushes the floor away through the bent knees."),
    m("vastus-medialis", "Vastus medialis", "Legs", "synergist", 0.7, "Knee extension with the other vasti."),
    m("triceps-long-head", "Triceps, long head", "Arms", "prime-mover", 0.85, "Straightens the arms to press the shoulders up."),
    st(m("anterior-deltoid", "Anterior deltoid", "Arms", "prime-mover", 0.8, "Presses overhead into the floor."), 0.5),
    m("middle-deltoid", "Middle deltoid", "Arms", "synergist", 0.5, "Shoulder support with the anterior fibres."),
    m("upper-trapezius", "Upper trapezius", "Arms", "synergist", 0.5, "Shoulder blade rotation with the arms overhead."),
    m("forearm-flexors", "Forearm flexors", "Arms", "stabiliser", 0.5, "Press the hands into the floor."),
    st(m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.3, "Lengthened, controlling the arch."), 0.9),
  ],
};

export const crowPose: Exercise = {
  slug: "crow-pose",
  category: "Yoga",
  name: "Crow pose",
  durationMs: 6000,
  anchor: "free",
  native: { clip: "/models/clips/crow-pose.glb" },
  camera: { position: [2.8, 1.1, 1.8], target: [0, 0.45, 0.15] },
  disclaimer: DISCLAIMER + " Bakasana.",
  phases: PHASES,
  muscles: [
    m("pectoralis-major", "Pectoralis major", "Arms", "prime-mover", 0.8, "Holds the bent arms against the load of the whole body."),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "prime-mover", 0.85, "Carries the weight over the hands."),
    m("triceps-long-head", "Triceps, long head", "Arms", "prime-mover", 0.85, "Keeps the elbows from collapsing."),
    m("forearm-flexors", "Forearm flexors", "Arms", "prime-mover", 0.8, "Grip the floor and balance the whole body through the fingers."),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "prime-mover", 0.85, "Rounds the trunk and lifts the hips high."),
    m("transversus-abdominis", "Transversus abdominis", "Trunk", "synergist", 0.7, "Deep brace that holds the ball shape."),
    m("external-obliques", "External obliques", "Trunk", "synergist", 0.6, "Brace the sides."),
    m("rectus-femoris", "Rectus femoris", "Legs", "synergist", 0.7, "Holds the knees tucked to the arms."),
    m("adductor-longus", "Adductor longus", "Legs", "synergist", 0.6, "Squeezes the knees onto the arms."),
    m("biceps-femoris", "Biceps femoris", "Legs", "synergist", 0.6, "Holds the heels up to the buttocks."),
    st(m("middle-trapezius", "Middle trapezius", "Shoulder blades", "stabiliser", 0.5, "Rounds and steadies the upper back."), 0.6),
  ],
};

export const sidePlank: Exercise = {
  slug: "side-plank",
  category: "Yoga",
  name: "Side plank",
  durationMs: 6000,
  anchor: "free",
  native: { clip: "/models/clips/side-plank.glb" },
  camera: { position: [0.2, 1.2, 3.0], target: [0, 0.5, 0] },
  disclaimer: DISCLAIMER + " Vasisthasana, on the left hand.",
  phases: PHASES,
  muscles: [
    st(m("external-obliques", "External obliques", "Trunk", "prime-mover", 0.9, "The lower (left) side holds the hips up off the floor; the top side only braces.", 0.35), 0.05, 0.45),
    m("transversus-abdominis", "Transversus abdominis", "Trunk", "synergist", 0.7, "Deep brace along the whole trunk."),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "synergist", 0.55, "Keeps the body a straight line."),
    m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.5, "Keeps the spine long."),
    m("gluteus-medius", "Gluteus medius", "Hips", "prime-mover", 0.85, "The lower hip's abductors hold the pelvis up; the top hip only keeps the leg in line.", 0.4),
    m("gluteus-minimus", "Gluteus minimus", "Hips", "synergist", 0.7, "Pelvis support with gluteus medius on the lower side.", 0.3),
    m("adductor-longus", "Adductor longus", "Hips", "synergist", 0.5, "Presses the legs together."),
    m("middle-deltoid", "Middle deltoid", "Support arm", "prime-mover", 0.8, "Left: holds the shoulder up over the hand. Right: holds the top arm raised.", 0.5),
    m("supraspinatus", "Supraspinatus", "Support arm", "synergist", 0.6, "Seats the loaded left shoulder.", 0.4),
    m("triceps-long-head", "Triceps, long head", "Support arm", "synergist", 0.7, "Keeps the support arm locked straight.", 0.2),
    m("latissimus-dorsi", "Latissimus dorsi", "Support arm", "stabiliser", 0.5, "Steadies the support shoulder from below.", 0.15),
    m("forearm-flexors", "Forearm flexors", "Support arm", "stabiliser", 0.5, "Grip the floor with the support hand.", 0.1),
    m("middle-trapezius", "Middle trapezius", "Support arm", "stabiliser", 0.5, "Holds the support shoulder blade flat against the ribs.", 0.3),
  ],
};
