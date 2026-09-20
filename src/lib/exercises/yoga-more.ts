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
  "Entered from rest, held, released.";
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

export const scalePose = yoga("scale-pose", "Scale pose", "Tolasana: sitting cross-legged, the body lifted off the floor on the hands, on blocks", { position: [2.8, 1.0, 2.0], target: [0, 0.4, 0] }, [
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
], "free");
scalePose.scenery = { kind: "blocks", height: 0.15, spacing: 0.17, z: 0.06 };

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

export const downwardDog = yoga("downward-dog", "Downward dog", "Adho Mukha Svanasana, from all fours", { position: [3.2, 1.3, 1.6], target: [0, 0.55, 0.1] }, [
  m("anterior-deltoid", "Anterior deltoid", "Arms", "prime-mover", 0.65, "Presses the floor away with the arms overhead in line with the trunk."),
  m("triceps-long-head", "Triceps, long head", "Arms", "synergist", 0.55, "Keeps the arms straight."),
  m("serratus-anterior", "Serratus anterior", "Arms", "synergist", 0.6, "Pins the shoulder blades to the ribs with the arms overhead."),
  m("upper-trapezius", "Upper trapezius", "Arms", "synergist", 0.4, "Rotates the shoulder blades up."),
  st(m("latissimus-dorsi", "Latissimus dorsi", "Arms", "stabiliser", 0.3, "Lengthened with the arms fully overhead and the trunk pressed back."), 0.7),
  m("forearm-flexors", "Forearm flexors", "Arms", "stabiliser", 0.5, "Spread the fingers and press the hands down."),
  m("rectus-femoris", "Rectus femoris", "Hips", "prime-mover", 0.6, "Flexes the hips into the fold and locks the knees."),
  m("vastus-lateralis", "Vastus lateralis", "Hips", "synergist", 0.5, "Presses the knees straight."),
  st(m("biceps-femoris", "Biceps femoris", "Hips", "stabiliser", 0.1, "Lengthened over the straight legs by the deep hip fold."), 0.85),
  st(m("semitendinosus", "Semitendinosus", "Hips", "stabiliser", 0.1, "Lengthened with biceps femoris."), 0.85),
  st(m("semimembranosus", "Semimembranosus", "Hips", "stabiliser", 0.1, "Lengthened with the other hamstrings."), 0.85),
  st(m("gastrocnemius-medial", "Gastrocnemius (medial)", "Lower leg", "stabiliser", 0.1, "Lengthened as the heels press toward the floor."), 0.8),
  st(m("gastrocnemius-lateral", "Gastrocnemius (lateral)", "Lower leg", "stabiliser", 0.1, "Lengthened with the medial head."), 0.8),
  st(m("soleus", "Soleus", "Lower leg", "stabiliser", 0.1, "Lengthened by the dropped heels."), 0.6),
  m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.45, "Keeps the back long from the hands to the hips."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.35, "Draws the ribs in under the lifted hips."),
]);

export const cobraPose = yoga("cobra-pose", "Cobra pose", "Bhujangasana, from lying prone", { position: [3.0, 1.1, 1.8], target: [0, 0.35, 0.2] }, [
  m("erector-spinae", "Erector spinae", "Back", "prime-mover", 0.85, "Lifts and arches the spine off the floor: the pose's muscle."),
  m("gluteus-maximus", "Gluteus maximus", "Back", "synergist", 0.4, "Keeps the hips pressed down and the legs long."),
  m("biceps-femoris", "Biceps femoris", "Back", "synergist", 0.25, "Holds the legs down along the floor."),
  m("posterior-deltoid", "Posterior deltoid", "Shoulders", "synergist", 0.5, "Draws the shoulders back and opens the chest."),
  m("middle-trapezius", "Middle trapezius", "Shoulders", "synergist", 0.55, "Pulls the shoulder blades together."),
  m("rhomboids", "Rhomboids", "Shoulders", "synergist", 0.5, "Retraction with the middle trapezius."),
  m("latissimus-dorsi", "Latissimus dorsi", "Shoulders", "synergist", 0.4, "Draws the shoulders down away from the ears."),
  m("triceps-long-head", "Triceps, long head", "Arms", "synergist", 0.5, "Presses partly through the hands; the back does the lifting."),
  st(m("rectus-abdominis", "Rectus abdominis", "Front", "stabiliser", 0.15, "Lengthened over the arched trunk."), 0.85),
  st(m("external-obliques", "External obliques", "Front", "stabiliser", 0.15, "Lengthened with rectus abdominis."), 0.5),
  st(m("rectus-femoris", "Rectus femoris", "Front", "stabiliser", 0.1, "Lengthened over the extended hips."), 0.5),
  st(m("pectoralis-major", "Pectoralis major", "Front", "stabiliser", 0.2, "Lengthened as the chest opens."), 0.5),
  st(m("pectoralis-minor", "Pectoralis minor", "Front", "stabiliser", 0.1, "Lengthened with the shoulders drawn back."), 0.5),
]);

export const childsPose = yoga("childs-pose", "Child's pose", "Balasana, from kneeling", { position: [3.0, 1.1, 1.8], target: [0, 0.3, 0.2] }, [
  st(m("erector-spinae", "Erector spinae", "Back", "stabiliser", 0.1, "Lengthened along the whole rounded back."), 0.7),
  st(m("latissimus-dorsi", "Latissimus dorsi", "Back", "stabiliser", 0.1, "Lengthened by the arms reaching along the floor."), 0.7),
  st(m("gluteus-maximus", "Gluteus maximus", "Hips", "stabiliser", 0.1, "Lengthened by the deep hip fold onto the heels."), 0.65),
  st(m("gluteus-medius", "Gluteus medius", "Hips", "stabiliser", 0.1, "Lengthened with the maximus."), 0.4),
  st(m("vastus-lateralis", "Vastus lateralis", "Legs", "stabiliser", 0.1, "Lengthened over the fully bent knees."), 0.6),
  st(m("vastus-medialis", "Vastus medialis", "Legs", "stabiliser", 0.1, "Lengthened with the other vasti."), 0.6),
  st(m("rectus-femoris", "Rectus femoris", "Legs", "stabiliser", 0.1, "Lengthened over the bent knees; the flexed hips slacken it in part."), 0.4),
  st(m("tibialis-anterior", "Tibialis anterior", "Legs", "stabiliser", 0.1, "Lengthened with the tops of the feet on the floor."), 0.5),
  m("anterior-deltoid", "Anterior deltoid", "Arms", "stabiliser", 0.2, "Reaches the arms forward along the floor; otherwise the pose rests."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.15, "Barely working: this is a resting pose."),
]);

export const lowLunge = yoga("low-lunge", "Low lunge", "Anjaneyasana, from standing: the left foot steps into a lunge, the back knee lowers, the hips sink, the arms rise, the chest lifts", { position: [3.0, 1.3, 2.0], target: [0, 0.7, 0] }, [
  st(m("rectus-femoris", "Rectus femoris", "Back leg", "stabiliser", 0.2, "Right: lengthened across the front of the hip and thigh as the hips sink forward: the stretch of the pose.", 0.1), 0.05, 0.9),
  st(m("pectineus", "Pectineus", "Back leg", "stabiliser", 0.15, "Right: lengthened with the other hip flexors.", 0.1), 0.05, 0.7),
  st(m("adductor-longus", "Adductor longus", "Back leg", "stabiliser", 0.15, "Right: lengthened at the front of the extended hip.", 0.1), 0.05, 0.55),
  st(m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.25, "Lengthened by the backbend, working just enough to keep the ribs from flaring."), 0.5),
  m("gluteus-maximus", "Gluteus maximus", "Front leg", "prime-mover", 0.7, "Left: holds the front hip as the weight sinks into it. Right: presses the back hip forward.", 0.5),
  m("vastus-lateralis", "Vastus lateralis", "Front leg", "prime-mover", 0.7, "Left: holds the front knee at a right angle under the body.", 0.15),
  m("vastus-medialis", "Vastus medialis", "Front leg", "synergist", 0.65, "Left: knee control with the other vasti.", 0.15),
  m("biceps-femoris", "Biceps femoris", "Front leg", "synergist", 0.45, "Left: steadies the front hip and knee.", 0.15),
  m("gluteus-medius", "Gluteus medius", "Front leg", "stabiliser", 0.5, "Left: keeps the front knee tracking over the foot.", 0.3),
  m("erector-spinae", "Erector spinae", "Trunk", "prime-mover", 0.7, "Lifts the chest into the backbend and holds the spine long."),
  m("anterior-deltoid", "Anterior deltoid", "Arms", "synergist", 0.6, "Holds the arms overhead."),
  m("upper-trapezius", "Upper trapezius", "Arms", "synergist", 0.45, "Rotates the shoulder blades up under the raised arms."),
  st(m("latissimus-dorsi", "Latissimus dorsi", "Arms", "stabiliser", 0.25, "Lengthened with the arms overhead and the chest lifted."), 0.5),
  m("gastrocnemius-medial", "Gastrocnemius (medial)", "Front leg", "stabiliser", 0.4, "Left: steadies the front ankle.", 0.1),
  m("tibialis-anterior", "Tibialis anterior", "Front leg", "stabiliser", 0.4, "Left: balances the front shin over the foot.", 0.15),
]);

export const treePose = yoga("tree-pose", "Tree pose", "Vrksasana, standing on the left leg", { position: [3.0, 1.4, 1.8], target: [0, 0.95, 0] }, [
  m("gluteus-medius", "Gluteus medius", "Standing leg", "prime-mover", 0.85, "Left: keeps the pelvis level on one foot. Right: turns the lifted thigh out.", 0.5),
  m("gluteus-minimus", "Gluteus minimus", "Standing leg", "synergist", 0.65, "Left: pelvis control with the medius.", 0.4),
  m("gluteus-maximus", "Gluteus maximus", "Standing leg", "synergist", 0.5, "Left: holds the standing hip. Right: turns the lifted thigh out.", 0.55),
  m("vastus-lateralis", "Vastus lateralis", "Standing leg", "stabiliser", 0.45, "Left: holds the standing knee.", 0.1),
  m("soleus", "Soleus", "Standing leg", "stabiliser", 0.55, "Left: ankle balance.", 0.1),
  m("fibularis", "Fibularis longus and brevis", "Standing leg", "stabiliser", 0.6, "Left: balances the standing ankle from the outside.", 0.1),
  m("tibialis-anterior", "Tibialis anterior", "Standing leg", "stabiliser", 0.55, "Left: ankle balance from the front.", 0.1),
  st(m("adductor-longus", "Adductor longus", "Lifted leg", "stabiliser", 0.15, "Right: lengthened by the turned-out, lifted thigh. Left: presses the standing thigh against the foot.", 0.4), 0.05, 0.6),
  st(m("pectineus", "Pectineus", "Lifted leg", "stabiliser", 0.15, "Right: lengthened with the adductors.", 0.3), 0.05, 0.5),
  m("biceps-femoris", "Biceps femoris", "Lifted leg", "synergist", 0.2, "Right: holds the knee bent with the foot on the thigh.", 0.45),
  m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.5, "Keeps the trunk tall over the standing leg."),
  m("external-obliques", "External obliques", "Trunk", "stabiliser", 0.45, "Steady the trunk against tipping.", 0.45),
  m("anterior-deltoid", "Anterior deltoid", "Arms", "synergist", 0.6, "Holds the arms overhead, palms together."),
  m("upper-trapezius", "Upper trapezius", "Arms", "synergist", 0.45, "Rotates the shoulder blades up under the raised arms."),
]);

export const chairPose = yoga("chair-pose", "Chair pose", "Utkatasana, from standing", { position: [3.2, 1.4, 1.8], target: [0, 0.85, 0] }, [
  m("vastus-lateralis", "Vastus lateralis", "Legs", "prime-mover", 0.9, "Holds the bent knees against the whole body's weight."),
  m("vastus-medialis", "Vastus medialis", "Legs", "prime-mover", 0.9, "Knee extension with the other vasti."),
  m("vastus-intermedius", "Vastus intermedius", "Legs", "prime-mover", 0.85, "Deep knee extensor."),
  m("rectus-femoris", "Rectus femoris", "Legs", "synergist", 0.6, "Knee extension; slack at the flexed hip."),
  m("gluteus-maximus", "Gluteus maximus", "Hips", "prime-mover", 0.8, "Holds the hips from sinking further back and down."),
  m("gluteus-medius", "Gluteus medius", "Hips", "stabiliser", 0.5, "Keeps the knees tracking over the feet."),
  m("adductor-longus", "Adductor longus", "Hips", "stabiliser", 0.45, "Squeezes the knees together."),
  m("soleus", "Soleus", "Lower leg", "stabiliser", 0.6, "Holds the shins forward over the heels."),
  m("tibialis-anterior", "Tibialis anterior", "Lower leg", "stabiliser", 0.5, "Balances the weight over the heels."),
  m("erector-spinae", "Erector spinae", "Trunk", "prime-mover", 0.8, "Holds the leant trunk long from the hips to the raised arms."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.5, "Keeps the ribs in and the pelvis from tipping."),
  m("anterior-deltoid", "Anterior deltoid", "Arms", "synergist", 0.65, "Holds the arms overhead in line with the trunk."),
  m("middle-deltoid", "Middle deltoid", "Arms", "synergist", 0.5, "Overhead with the anterior fibres."),
  m("upper-trapezius", "Upper trapezius", "Arms", "synergist", 0.5, "Rotates the shoulder blades up."),
  st(m("latissimus-dorsi", "Latissimus dorsi", "Arms", "stabiliser", 0.3, "Lengthened with the arms overhead."), 0.5),
]);

export const trianglePose = yoga("triangle-pose", "Triangle pose", "Utthita Trikonasana, tipped over the left leg", { position: [0.8, 1.3, 3.2], target: [0, 0.8, 0] }, [
  m("gluteus-medius", "Gluteus medius", "Hips", "prime-mover", 0.8, "Left: holds the pelvis over the front leg as the trunk tips. Right: keeps the back hip open.", 0.6),
  m("gluteus-maximus", "Gluteus maximus", "Hips", "synergist", 0.5, "Both turn the thighs out in the wide stance.", 0.55),
  m("vastus-lateralis", "Vastus lateralis", "Legs", "synergist", 0.6, "Both knees locked straight.", 0.5),
  m("vastus-medialis", "Vastus medialis", "Legs", "synergist", 0.6, "Knee lock with the other vasti.", 0.5),
  st(m("biceps-femoris", "Biceps femoris", "Legs", "stabiliser", 0.3, "Left: on stretch as the trunk folds sideways over the straight front leg.", 0.25), 0.85, 0.2),
  st(m("semitendinosus", "Semitendinosus", "Legs", "stabiliser", 0.3, "Left: on stretch with biceps femoris.", 0.25), 0.85, 0.2),
  st(m("semimembranosus", "Semimembranosus", "Legs", "stabiliser", 0.3, "Left: on stretch.", 0.25), 0.85, 0.2),
  st(m("adductor-longus", "Adductor longus", "Legs", "stabiliser", 0.3, "Both lengthened by the wide stance; the back leg's most.", 0.3), 0.5, 0.7),
  st(m("gracilis", "Gracilis", "Legs", "stabiliser", 0.2, "On stretch along the inner thighs.", 0.2), 0.5, 0.7),
  m("fibularis", "Fibularis longus and brevis", "Lower leg", "stabiliser", 0.5, "Keep the outer edges of the feet down.", 0.5),
  m("external-obliques", "External obliques", "Trunk", "prime-mover", 0.55, "Right: holds the top side of the trunk long and open. Left: the lower side braces.", 0.8),
  m("internal-obliques", "Internal obliques", "Trunk", "synergist", 0.5, "Brace and turn the trunk open with the external obliques.", 0.6),
  m("erector-spinae", "Erector spinae", "Trunk", "stabiliser", 0.6, "Keeps the spine long from the hips to the head."),
  m("middle-deltoid", "Middle deltoid", "Arms", "synergist", 0.35, "Left: steadies the lower arm. Right: holds the top arm straight up.", 0.65),
  m("supraspinatus", "Supraspinatus", "Arms", "stabiliser", 0.3, "Right: seats the raised shoulder.", 0.5),
]);

export const bridgePose = yoga("bridge-pose", "Bridge pose", "Setu Bandha Sarvangasana, from lying on the back: feet close, hips high, hands clasped under the back", { position: [2.8, 1.1, 2.0], target: [0, 0.3, -0.05] }, [
  m("gluteus-maximus", "Gluteus maximus", "Hips", "prime-mover", 0.85, "Lifts and holds the hips up in a line from the knees to the shoulders."),
  m("biceps-femoris", "Biceps femoris", "Hips", "synergist", 0.6, "Hip extension through the planted heels."),
  m("semitendinosus", "Semitendinosus", "Hips", "synergist", 0.55, "Hip extension with biceps femoris."),
  m("erector-spinae", "Erector spinae", "Trunk", "prime-mover", 0.7, "Holds the arch from the shoulders to the hips."),
  m("gluteus-medius", "Gluteus medius", "Hips", "stabiliser", 0.45, "Keeps the knees in line over the feet."),
  m("vastus-lateralis", "Vastus lateralis", "Legs", "stabiliser", 0.4, "Holds the knee angle over the feet."),
  m("posterior-deltoid", "Posterior deltoid", "Arms", "stabiliser", 0.4, "Presses the arms into the floor to lift the chest."),
  m("triceps-long-head", "Triceps, long head", "Arms", "stabiliser", 0.4, "Presses the arms down along the floor."),
  st(m("rectus-femoris", "Rectus femoris", "Front", "stabiliser", 0.15, "Lengthened over the extended hips."), 0.6),
  st(m("pectineus", "Pectineus", "Front", "stabiliser", 0.1, "Lengthened with rectus femoris."), 0.5),
  st(m("rectus-abdominis", "Rectus abdominis", "Front", "stabiliser", 0.2, "Lengthened over the arch, working just enough to keep the ribs from flaring."), 0.6),
  st(m("pectoralis-major", "Pectoralis major", "Front", "stabiliser", 0.15, "Lengthened as the chest lifts toward the chin."), 0.4),
]);

export const seatedTwist = yoga("seated-twist", "Seated twist", "Ardha Matsyendrasana, twisting to the left", { position: [2.6, 1.3, 2.4], target: [0, 0.45, 0.1] }, [
  m("external-obliques", "External obliques", "Trunk", "prime-mover", 0.8, "Right: turns the trunk to the left. Left: lengthened by the same turn.", 0.3),
  m("internal-obliques", "Internal obliques", "Trunk", "prime-mover", 0.35, "Left: turns the trunk to the left with the right external oblique.", 0.75),
  m("erector-spinae", "Erector spinae", "Trunk", "synergist", 0.6, "Keeps the spine tall through the twist; its deeper fibres rotate it."),
  m("rectus-abdominis", "Rectus abdominis", "Trunk", "stabiliser", 0.35, "Keeps the trunk upright, not slumped."),
  m("gluteus-maximus", "Gluteus maximus", "Hips", "stabiliser", 0.2, "Left: lengthened by the crossed, flexed hip.", 0.2),
  st(m("gluteus-medius", "Gluteus medius", "Hips", "stabiliser", 0.2, "Left: on stretch with the knee drawn across.", 0.2), 0.6, 0.05),
  m("rectus-femoris", "Rectus femoris", "Legs", "stabiliser", 0.5, "Left: holds the bent knee up. Right: locks the straight leg.", 0.35),
  m("tibialis-anterior", "Tibialis anterior", "Legs", "stabiliser", 0.3, "Right: flexes the straight leg's foot.", 0.5),
  m("posterior-deltoid", "Posterior deltoid", "Arms", "synergist", 0.4, "Right: hooks the arm round the knee and pulls the twist. Left: props the hand behind.", 0.55),
  m("biceps-brachii", "Biceps brachii", "Arms", "stabiliser", 0.2, "Right: holds the hook on the knee.", 0.45),
  m("triceps-long-head", "Triceps, long head", "Arms", "stabiliser", 0.45, "Left: props the trunk on the hand behind.", 0.2),
]);

