import type { CurvePoint, Exercise, MuscleActivation } from "./types";

// Five yoga holds, designed (tools/myo/designed_clip.py) because no free
// capture exists. Each is a still position; the muscles listed work the
// whole time, so every curve is flat. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const HOLD = (v: number) => t([0, v], [1, v]);
const DISCLAIMER =
  "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The position is designed, not captured, and held; nothing here is estimated or measured. Educational illustration, not training or medical advice.";
const m = (id: string, name: string, group: string, role: MuscleActivation["role"], v: number, note: string): MuscleActivation => ({ id, name, group, role, note, curve: HOLD(v) });

export const boatPose: Exercise = {
  slug: "boat-pose",
  category: "Yoga",
  name: "Boat pose",
  durationMs: 4000,
  anchor: "free",
  native: { clip: "/models/clips/boat-pose.glb" },
  camera: { position: [3.0, 1.3, 1.6], target: [0, 0.5, 0.3] },
  disclaimer: DISCLAIMER + " Navasana.",
  phases: [{ name: "hold", t0: 0, t1: 1 }],
  muscles: [
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "prime-mover", 0.9, "Holds the trunk up off the floor against the lever of the legs."),
    m("external-obliques", "External obliques", "Trunk", "synergist", 0.6, "Brace the sides of the trunk."),
    m("transversus-abdominis", "Transversus abdominis", "Trunk", "synergist", 0.7, "Deep brace under the obliques."),
    m("rectus-femoris", "Rectus femoris", "Hip flexors", "prime-mover", 0.9, "Holds the straight legs up: hip flexion against gravity."),
    m("adductor-longus", "Adductor longus", "Hip flexors", "synergist", 0.5, "Assists hip flexion and keeps the legs together."),
    m("vastus-lateralis", "Vastus lateralis", "Legs", "synergist", 0.6, "Locks the knees straight."),
    m("vastus-medialis", "Vastus medialis", "Legs", "synergist", 0.6, "Locks the knees with the other vasti."),
    m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.6, "Keeps the back long rather than rounded."),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "stabiliser", 0.5, "Holds the arms out in front."),
    m("tibialis-anterior", "Tibialis anterior", "Legs", "stabiliser", 0.3, "Steadies the ankles."),
  ],
};

export const warrior3: Exercise = {
  slug: "warrior-3",
  category: "Yoga",
  name: "Warrior III",
  durationMs: 4000,
  anchor: "feet",
  native: { clip: "/models/clips/warrior-3.glb" },
  camera: { position: [3.2, 1.5, 1.4], target: [0, 0.95, 0.1] },
  disclaimer: DISCLAIMER + " Virabhadrasana III, standing on the left leg.",
  phases: [{ name: "hold", t0: 0, t1: 1 }],
  muscles: [
    m("gluteus-maximus", "Gluteus maximus", "Standing hip", "prime-mover", 0.8, "Holds the trunk and the lifted leg level against gravity."),
    m("gluteus-medius", "Gluteus medius", "Standing hip", "prime-mover", 0.85, "Keeps the pelvis level on one leg: the balance muscle here."),
    m("gluteus-minimus", "Gluteus minimus", "Standing hip", "synergist", 0.7, "Pelvis control with gluteus medius."),
    m("biceps-femoris", "Biceps femoris", "Lifted leg", "prime-mover", 0.8, "Holds the back leg up in line with the trunk."),
    m("semitendinosus", "Semitendinosus", "Lifted leg", "prime-mover", 0.75, "Hip extension of the lifted leg with biceps femoris."),
    m("semimembranosus", "Semimembranosus", "Lifted leg", "synergist", 0.7, "Hip extension of the lifted leg."),
    m("erector-spinae", "Erector spinae", "Trunk", "prime-mover", 0.85, "Holds the horizontal trunk from folding."),
    m("vastus-lateralis", "Vastus lateralis", "Standing leg", "synergist", 0.6, "Keeps the standing knee straight."),
    m("vastus-medialis", "Vastus medialis", "Standing leg", "synergist", 0.6, "Standing knee with the other vasti."),
    m("gastrocnemius-medial", "Gastrocnemius (medial)", "Standing leg", "stabiliser", 0.5, "Balances the ankle."),
    m("gastrocnemius-lateral", "Gastrocnemius (lateral)", "Standing leg", "stabiliser", 0.5, "Balances the ankle with the medial head."),
    m("soleus", "Soleus", "Standing leg", "stabiliser", 0.5, "Ankle balance."),
    m("tibialis-anterior", "Tibialis anterior", "Standing leg", "stabiliser", 0.5, "Ankle balance from the front."),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.5, "Braces the trunk with the back muscles."),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "synergist", 0.6, "Holds the arms forward in line with the body."),
    m("lower-trapezius", "Lower trapezius", "Arms", "stabiliser", 0.5, "Keeps the shoulder blades down with the arms overhead."),
  ],
};

export const wheelPose: Exercise = {
  slug: "wheel-pose",
  category: "Yoga",
  name: "Wheel pose",
  durationMs: 4000,
  anchor: "free",
  native: { clip: "/models/clips/wheel-pose.glb" },
  camera: { position: [3.0, 1.2, 1.4], target: [0, 0.5, 0] },
  disclaimer: DISCLAIMER + " Urdhva Dhanurasana.",
  phases: [{ name: "hold", t0: 0, t1: 1 }],
  muscles: [
    m("gluteus-maximus", "Gluteus maximus", "Hips", "prime-mover", 0.9, "Extends the hips to lift the arch."),
    m("biceps-femoris", "Biceps femoris", "Hips", "synergist", 0.6, "Hip extension with the glutes."),
    m("semimembranosus", "Semimembranosus", "Hips", "synergist", 0.55, "Hip extension."),
    m("erector-spinae", "Erector spinae", "Back", "prime-mover", 0.9, "Arches the spine and holds it there."),
    m("vastus-lateralis", "Vastus lateralis", "Legs", "synergist", 0.7, "Pushes the floor away through the bent knees."),
    m("vastus-medialis", "Vastus medialis", "Legs", "synergist", 0.7, "Knee extension with the other vasti."),
    m("triceps-long-head", "Triceps, long head", "Arms", "prime-mover", 0.85, "Straightens the arms to press the shoulders up."),
    m("anterior-deltoid", "Anterior deltoid", "Arms", "prime-mover", 0.8, "Presses overhead into the floor."),
    m("middle-deltoid", "Middle deltoid", "Arms", "synergist", 0.5, "Shoulder support with the anterior fibres."),
    m("upper-trapezius", "Upper trapezius", "Arms", "synergist", 0.5, "Shoulder blade rotation with the arms overhead."),
    m("forearm-flexors", "Forearm flexors", "Arms", "stabiliser", 0.5, "Press the hands into the floor."),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.3, "Lengthened, controlling the arch."),
  ],
};

export const crowPose: Exercise = {
  slug: "crow-pose",
  category: "Yoga",
  name: "Crow pose",
  durationMs: 4000,
  anchor: "free",
  native: { clip: "/models/clips/crow-pose.glb" },
  camera: { position: [2.8, 1.1, 1.8], target: [0, 0.45, 0.15] },
  disclaimer: DISCLAIMER + " Bakasana.",
  phases: [{ name: "hold", t0: 0, t1: 1 }],
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
    m("middle-trapezius", "Middle trapezius", "Shoulder blades", "stabiliser", 0.5, "Rounds and steadies the upper back."),
  ],
};

export const sidePlank: Exercise = {
  slug: "side-plank",
  category: "Yoga",
  name: "Side plank",
  durationMs: 4000,
  anchor: "free",
  native: { clip: "/models/clips/side-plank.glb" },
  camera: { position: [0.2, 1.2, 3.0], target: [0, 0.5, 0] },
  disclaimer: DISCLAIMER + " Vasisthasana, on the left hand.",
  phases: [{ name: "hold", t0: 0, t1: 1 }],
  muscles: [
    m("external-obliques", "External obliques", "Trunk", "prime-mover", 0.9, "The lower side holds the hips up off the floor."),
    m("transversus-abdominis", "Transversus abdominis", "Trunk", "synergist", 0.7, "Deep brace along the whole trunk."),
    m("rectus-abdominis", "Rectus abdominis", "Trunk", "synergist", 0.55, "Keeps the body a straight line."),
    m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.5, "Keeps the spine long."),
    m("gluteus-medius", "Gluteus medius", "Hips", "prime-mover", 0.85, "The lower hip's abductors hold the pelvis up."),
    m("gluteus-minimus", "Gluteus minimus", "Hips", "synergist", 0.7, "Pelvis support with gluteus medius."),
    m("adductor-longus", "Adductor longus", "Hips", "synergist", 0.5, "Presses the legs together."),
    m("middle-deltoid", "Middle deltoid", "Support arm", "prime-mover", 0.8, "Holds the shoulder up over the hand."),
    m("supraspinatus", "Supraspinatus", "Support arm", "synergist", 0.6, "Seats the loaded shoulder."),
    m("triceps-long-head", "Triceps, long head", "Support arm", "synergist", 0.7, "Keeps the arm locked straight."),
    m("latissimus-dorsi", "Latissimus dorsi", "Support arm", "stabiliser", 0.5, "Steadies the shoulder from below."),
    m("forearm-flexors", "Forearm flexors", "Support arm", "stabiliser", 0.5, "Grip the floor."),
    m("middle-trapezius", "Middle trapezius", "Support arm", "stabiliser", 0.5, "Holds the shoulder blade flat against the ribs."),
  ],
};
