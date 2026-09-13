import type { CurvePoint, Exercise, MuscleActivation } from "./types";

// Six more yoga holds, designed (tools/myo/designed_clip.py): each cycle
// enters the position from rest over its first 40 %, holds to 75 %, then
// releases back, so the loop is continuous. Activation is qualitative; the
// muscles rise into the hold and ease off with it.

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
const yoga = (slug: string, name: string, sanskrit: string, camera: Exercise["camera"], muscles: MuscleActivation[], anchor: Exercise["anchor"] = "free"): Exercise => ({
  slug,
  category: "Yoga",
  name,
  durationMs: 6000,
  anchor,
  native: { clip: `/models/clips/${slug}.glb` },
  camera,
  disclaimer: DISCLAIMER + " " + sanskrit + ".",
  phases: PHASES,
  muscles,
});

export const warrior1 = yoga("warrior-1", "Warrior I", "Virabhadrasana I, the left foot forward", { position: [3.2, 1.5, 1.6], target: [0, 0.9, 0] }, [
  m("vastus-lateralis", "Vastus lateralis", "Front leg", "prime-mover", 0.85, "Left: holds the bent front knee at a right angle under the body.", 0.3),
  m("vastus-medialis", "Vastus medialis", "Front leg", "prime-mover", 0.85, "Left: front knee with the other vasti.", 0.3),
  m("rectus-femoris", "Rectus femoris", "Front leg", "synergist", 0.6, "Left: front knee. Right: on stretch across the extended back hip.", 0.25),
  m("gluteus-maximus", "Gluteus maximus", "Hips", "synergist", 0.7, "Left: holds the front hip from sinking. Right: extends the back hip.", 0.6),
  m("gluteus-medius", "Gluteus medius", "Hips", "stabiliser", 0.6, "Left: keeps the front knee over the foot.", 0.4),
  st(m("pectineus", "Pectineus", "Hips", "stabiliser", 0.2, "Right: the back hip's flexors on stretch.", 0.2), 0.05, 0.7),
  st(m("adductor-longus", "Adductor longus", "Hips", "stabiliser", 0.3, "Both steady the stance; the back one lengthened.", 0.3), 0.05, 0.5),
  st(m("gastrocnemius-medial", "Gastrocnemius (medial)", "Lower leg", "stabiliser", 0.4, "Right: lengthened with the back heel pressed down.", 0.2), 0.05, 0.6),
  st(m("gastrocnemius-lateral", "Gastrocnemius (lateral)", "Lower leg", "stabiliser", 0.4, "Right: lengthened with the back heel down.", 0.2), 0.05, 0.6),
  m("soleus", "Soleus", "Lower leg", "stabiliser", 0.5, "Left: steadies the front ankle under the load.", 0.3),
  m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.6, "Holds the trunk tall and the ribs lifted."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.5, "Keeps the pelvis from tipping forward as the back hip opens."),
  m("anterior-deltoid", "Anterior deltoid", "Arms", "synergist", 0.65, "Holds the arms overhead."),
  m("middle-deltoid", "Middle deltoid", "Arms", "synergist", 0.5, "Overhead with the anterior fibres."),
  m("upper-trapezius", "Upper trapezius", "Arms", "synergist", 0.5, "Rotates the shoulder blades up under the raised arms."),
  m("serratus-anterior", "Serratus anterior", "Arms", "synergist", 0.5, "Upward rotation of the shoulder blades with the trapezius."),
  st(m("latissimus-dorsi", "Latissimus dorsi", "Arms", "stabiliser", 0.3, "Lengthened with the arms fully overhead."), 0.6),
]);

export const warrior2 = yoga("warrior-2", "Warrior II", "Virabhadrasana II, the left knee bent", { position: [0.9, 1.4, 3.2], target: [0, 0.85, 0] }, [
  m("vastus-lateralis", "Vastus lateralis", "Front leg", "prime-mover", 0.85, "Left: holds the bent knee over the foot in the wide stance.", 0.35),
  m("vastus-medialis", "Vastus medialis", "Front leg", "prime-mover", 0.85, "Left: front knee with the other vasti; keeps it tracking over the toes.", 0.35),
  m("rectus-femoris", "Rectus femoris", "Front leg", "synergist", 0.55, "Left: front knee. Right: keeps the back knee straight.", 0.4),
  m("gluteus-maximus", "Gluteus maximus", "Hips", "synergist", 0.65, "Left: turns the front thigh out and holds the hip open.", 0.5),
  m("gluteus-medius", "Gluteus medius", "Hips", "prime-mover", 0.75, "Both: hold the hips level across the wide stance and the front knee from falling in.", 0.6),
  st(m("adductor-longus", "Adductor longus", "Hips", "stabiliser", 0.35, "Both lengthened by the wide stance; the back leg's most.", 0.3), 0.4, 0.7),
  st(m("gracilis", "Gracilis", "Hips", "stabiliser", 0.2, "On stretch along the inner thighs.", 0.2), 0.4, 0.7),
  st(m("pectineus", "Pectineus", "Hips", "stabiliser", 0.2, "Lengthened, more on the straight back leg.", 0.2), 0.3, 0.6),
  m("soleus", "Soleus", "Lower leg", "stabiliser", 0.5, "Steady the ankles across the stance.", 0.4),
  m("fibularis", "Fibularis longus and brevis", "Lower leg", "stabiliser", 0.5, "Keep the outer edges of the feet down.", 0.5),
  m("middle-deltoid", "Middle deltoid", "Arms", "prime-mover", 0.8, "Holds both arms out level along the stance."),
  m("supraspinatus", "Supraspinatus", "Arms", "synergist", 0.5, "Abduction with the middle deltoid."),
  m("posterior-deltoid", "Posterior deltoid", "Arms", "synergist", 0.5, "Draws the arms back into one line."),
  m("middle-trapezius", "Middle trapezius", "Arms", "synergist", 0.5, "Holds the shoulder blades back and down."),
  m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.55, "Keeps the trunk upright over the hips, not leant to the front leg."),
  m("external-obliques", "External obliques", "Trunk", "stabiliser", 0.45, "Resist the trunk tipping toward the bent knee."),
]);

export const halfMoon = yoga("half-moon", "Half moon", "Ardha Chandrasana, standing on the left leg", { position: [0.7, 1.3, 3.2], target: [0, 0.75, 0] }, [
  m("gluteus-medius", "Gluteus medius", "Hips", "prime-mover", 0.9, "Left: holds the pelvis over the one foot. Right: lifts the top leg out level.", 0.85),
  m("gluteus-minimus", "Gluteus minimus", "Hips", "synergist", 0.7, "Abduction on both sides with the medius.", 0.7),
  m("gluteus-maximus", "Gluteus maximus", "Hips", "synergist", 0.6, "Right: holds the lifted leg back in line with the trunk. Left: the standing hip.", 0.65),
  m("vastus-lateralis", "Vastus lateralis", "Legs", "synergist", 0.6, "Left: the standing knee. Right: locks the lifted knee.", 0.6),
  m("vastus-medialis", "Vastus medialis", "Legs", "synergist", 0.6, "Knee lock on both sides.", 0.6),
  st(m("biceps-femoris", "Biceps femoris", "Legs", "stabiliser", 0.35, "Left: on stretch under the hinged trunk over the straight standing leg.", 0.3), 0.8, 0.1),
  st(m("semitendinosus", "Semitendinosus", "Legs", "stabiliser", 0.3, "Left: on stretch with biceps femoris.", 0.3), 0.8, 0.1),
  st(m("semimembranosus", "Semimembranosus", "Legs", "stabiliser", 0.3, "Left: on stretch.", 0.3), 0.8, 0.1),
  m("tibialis-anterior", "Tibialis anterior", "Legs", "stabiliser", 0.6, "Left: balances the ankle from the front. Right: flexes the lifted foot.", 0.5),
  m("fibularis", "Fibularis longus and brevis", "Legs", "stabiliser", 0.6, "Left: balances the standing ankle from the outside.", 0.2),
  m("gastrocnemius-medial", "Gastrocnemius (medial)", "Legs", "stabiliser", 0.5, "Left: ankle balance.", 0.2),
  m("external-obliques", "External obliques", "Trunk", "prime-mover", 0.6, "Right: holds the trunk open and level against gravity. Left: the lower side braces.", 0.8),
  m("internal-obliques", "Internal obliques", "Trunk", "synergist", 0.5, "Brace and rotate the trunk open with the external obliques.", 0.6),
  m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.6, "Keeps the spine long from the standing hip to the head."),
  m("middle-deltoid", "Middle deltoid", "Arms", "synergist", 0.4, "Left: steadies the support arm. Right: holds the top arm straight up.", 0.65),
  m("triceps-long-head", "Triceps, long head", "Arms", "stabiliser", 0.5, "Left: keeps the support arm locked.", 0.3),
]);

export const scalePose = yoga("scale-pose", "Scale pose", "Tolasana: sitting cross-legged, the body lifted off the floor on the hands", { position: [2.8, 1.0, 2.0], target: [0, 0.4, 0] }, [
  m("triceps-long-head", "Triceps, long head", "Arms", "prime-mover", 0.9, "Locks the elbows as the hands press the floor away."),
  m("triceps-lateral-head", "Triceps, lateral head", "Arms", "prime-mover", 0.85, "Elbow lock with the long head."),
  m("triceps-medial-head", "Triceps, medial head", "Arms", "prime-mover", 0.85, "Deep elbow lock."),
  m("anterior-deltoid", "Anterior deltoid", "Arms", "prime-mover", 0.8, "Presses down through the arms."),
  m("pectoralis-major", "Pectoralis major", "Arms", "synergist", 0.6, "Presses the arms in against the body."),
  m("latissimus-dorsi", "Latissimus dorsi", "Arms", "prime-mover", 0.85, "Pulls the shoulders down away from the ears: the depression that lifts the seat."),
  m("lower-trapezius", "Lower trapezius", "Arms", "synergist", 0.7, "Depresses the shoulder blades with the lat."),
  m("pectoralis-minor", "Pectoralis minor", "Arms", "synergist", 0.5, "Shoulder blade depression from the front."),
  m("forearm-flexors", "Forearm flexors", "Arms", "stabiliser", 0.7, "Press the hands into the floor."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "prime-mover", 0.85, "Curls the trunk and lifts the folded legs off the floor."),
  m("transversus-abdominis", "Transversus abdominis", "Trunk", "synergist", 0.7, "Deep brace holding the lift."),
  m("rectus-femoris", "Rectus femoris", "Hips", "prime-mover", 0.7, "Flexes the hips to hold the crossed legs up."),
  m("pectineus", "Pectineus", "Hips", "synergist", 0.6, "Hip flexion with rectus femoris."),
  st(m("adductor-longus", "Adductor longus", "Hips", "stabiliser", 0.3, "Lengthened by the crossed, turned-out thighs."), 0.5),
  st(m("gracilis", "Gracilis", "Hips", "stabiliser", 0.2, "On stretch along the inner thighs."), 0.5),
]);

export const headstand = yoga("headstand", "Headstand", "Sirsasana, supported on the forearms", { position: [3.2, 1.2, 1.6], target: [0, 0.85, 0] }, [
  m("upper-trapezius", "Upper trapezius", "Neck and shoulders", "prime-mover", 0.7, "Holds the neck long so the crown, not the neck, takes the weight."),
  m("anterior-deltoid", "Anterior deltoid", "Neck and shoulders", "prime-mover", 0.75, "Presses the forearms into the floor and lifts the shoulders away from the ears."),
  m("middle-deltoid", "Middle deltoid", "Neck and shoulders", "synergist", 0.55, "Shoulder support with the anterior fibres."),
  m("serratus-anterior", "Serratus anterior", "Neck and shoulders", "synergist", 0.6, "Pins the shoulder blades to the ribs under the inverted load."),
  m("triceps-long-head", "Triceps, long head", "Arms", "synergist", 0.5, "Presses the forearms down."),
  m("forearm-flexors", "Forearm flexors", "Arms", "stabiliser", 0.6, "The clasped hands and the forearms grip the floor."),
  m("erector-spinae", "Erector spinae", "Trunk", "prime-mover", 0.7, "Holds the spine straight upside down."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "prime-mover", 0.8, "Keeps the ribs in and the hips over the shoulders: the balance."),
  m("external-obliques", "External obliques", "Trunk", "synergist", 0.6, "Resist tipping sideways."),
  m("transversus-abdominis", "Transversus abdominis", "Trunk", "synergist", 0.6, "Deep brace."),
  m("gluteus-maximus", "Gluteus maximus", "Legs", "synergist", 0.6, "Holds the hips extended so the legs stay in line."),
  m("rectus-femoris", "Rectus femoris", "Legs", "synergist", 0.5, "Locks the knees; draws them in on the way up and down."),
  m("vastus-lateralis", "Vastus lateralis", "Legs", "stabiliser", 0.5, "Locks the knees straight overhead."),
  m("adductor-longus", "Adductor longus", "Legs", "stabiliser", 0.5, "Squeezes the legs together."),
  m("gastrocnemius-medial", "Gastrocnemius (medial)", "Legs", "stabiliser", 0.4, "Points the toes."),
]);

export const pigeonPose = yoga("pigeon-pose", "Pigeon pose", "Eka Pada Rajakapotasana, the upright preparation with the left shin forward", { position: [2.8, 1.3, 2.4], target: [0, 0.4, 0.1] }, [
  st(m("gluteus-maximus", "Gluteus maximus", "Front hip", "stabiliser", 0.15, "Left: the pose's target, lengthened by the flexed, turned-out front hip. Right: extends the back hip.", 0.4), 0.9, 0.05),
  st(m("gluteus-medius", "Gluteus medius", "Front hip", "stabiliser", 0.15, "Left: on stretch with the maximus.", 0.3), 0.7, 0.05),
  st(m("gluteus-minimus", "Gluteus minimus", "Front hip", "stabiliser", 0.15, "Left: lengthened with the medius.", 0.3), 0.6, 0.05),
  st(m("adductor-longus", "Adductor longus", "Front hip", "stabiliser", 0.15, "Left: lengthened by the turned-out thigh.", 0.2), 0.4, 0.1),
  st(m("rectus-femoris", "Rectus femoris", "Back hip", "stabiliser", 0.2, "Right: the back hip's flexor on stretch with the leg extended behind.", 0.3), 0.05, 0.7),
  st(m("pectineus", "Pectineus", "Back hip", "stabiliser", 0.15, "Right: hip flexor on stretch.", 0.15), 0.05, 0.6),
  m("vastus-lateralis", "Vastus lateralis", "Back hip", "stabiliser", 0.15, "Right: keeps the back knee straight.", 0.35),
  m("erector-spinae", "Erector spinae", "Trunk", "prime-mover", 0.6, "Holds the trunk upright and the chest lifted over the front hip."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.35, "Keeps the pelvis square rather than tipped to the front leg."),
  m("external-obliques", "External obliques", "Trunk", "stabiliser", 0.35, "Square the pelvis with rectus abdominis.", 0.45),
  m("anterior-deltoid", "Anterior deltoid", "Arms", "stabiliser", 0.4, "The hands on the floor take some of the trunk's weight."),
  m("triceps-long-head", "Triceps, long head", "Arms", "stabiliser", 0.4, "Props the trunk on the hands."),
]);
