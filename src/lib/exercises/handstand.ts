import type { CurvePoint, Exercise } from "./types";

// A handstand kicked up from standing, designed (tools/myo/designed_clip.py)
// because no free capture exists: the left foot steps forward as the trunk
// folds and the hands go to the floor (to t 0.16), the right leg kicks up
// (to 0.24), the left follows and the body straightens to vertical (to
// 0.4), holds, and comes down the same way. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
const SUPPORT = t([0, 0.1], [0.12, 0.2], [0.16, 0.6], [0.24, 0.85], [0.4, 0.9], [0.62, 0.9], [0.78, 0.85], [0.86, 0.6], [0.9, 0.2], [1, 0.1]); // the arms and shoulders carry the body while the hands are down
const INVERTED = t([0, 0.1], [0.16, 0.2], [0.32, 0.7], [0.4, 0.85], [0.62, 0.85], [0.7, 0.7], [0.86, 0.2], [1, 0.1]); // the trunk held straight upside down
const KICK_R = t([0, 0.2], [0.12, 0.3], [0.18, 0.7], [0.24, 1], [0.32, 0.6], [0.4, 0.4], [0.62, 0.4], [0.7, 0.6], [0.78, 0.8], [0.86, 0.3], [1, 0.2]); // the right hip drives the kick and controls the descent
const KICK_L = t([0, 0.2], [0.12, 0.5], [0.24, 0.8], [0.32, 1], [0.4, 0.4], [0.62, 0.4], [0.7, 0.9], [0.78, 0.6], [0.86, 0.3], [1, 0.2]); // the left leg pushes off, then follows up
const STANCE_L = t([0, 0.3], [0.06, 0.6], [0.16, 0.9], [0.24, 0.7], [0.3, 0.2], [0.7, 0.2], [0.78, 0.7], [0.86, 0.9], [0.95, 0.6], [1, 0.3]); // the stepping (left) leg bears the fold
const LEGS_UP = t([0, 0.1], [0.24, 0.2], [0.4, 0.7], [0.62, 0.7], [0.78, 0.2], [1, 0.1]); // holding the legs together and straight overhead
const FOLD_LONG = t([0, 0.05], [0.1, 0.5], [0.16, 0.9], [0.24, 0.6], [0.32, 0.2], [0.7, 0.2], [0.78, 0.6], [0.86, 0.9], [0.92, 0.5], [1, 0.05]); // hamstrings on stretch in the fold

export const handstand: Exercise = {
  slug: "handstand",
  category: "Push and pull",
  name: "Handstand",
  durationMs: 7000,
  anchor: "free",
  native: { clip: "/models/clips/handstand.glb" },
  camera: { position: [3.4, 1.4, 1.2], target: [0, 0.95, 0.35] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of a handstand exists. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "fold", t0: 0, t1: 0.16 },
    { name: "kick up", t0: 0.16, t1: 0.4 },
    { name: "hold", t0: 0.4, t1: 0.62 },
    { name: "come down", t0: 0.62, t1: 0.86 },
    { name: "stand", t0: 0.86, t1: 1 },
  ],
  muscles: [
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Carries the body over the hands: the shoulders press the floor away.", curve: SUPPORT },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(SUPPORT, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(SUPPORT, 0.5) },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "prime-mover", note: "Holds the arms overhead under the whole body.", curve: SUPPORT },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "synergist", note: "Shrugs the shoulders up to the ears, rotating the shoulder blades under the load.", curve: SUPPORT },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "stabiliser", note: "Seats the shoulders under the inverted load.", curve: SUPPORT },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "stabiliser", note: "Rotator cuff, steadying the balance.", curve: SUPPORT },
    { id: "subscapularis", name: "Subscapularis", group: "Shoulder", role: "stabiliser", note: "The front of the rotator cuff: holds the humeral head in the socket under load.", curve: SUPPORT },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Keeps the elbows locked.", curve: SUPPORT },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Straightens the elbow with the long head.", curve: SUPPORT },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extensor, working in every press and lockout.", curve: SUPPORT },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "The fingers press the floor to balance: the handstand's ankles.", curve: SUPPORT },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(SUPPORT, 0.6) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Lengthened with the arms fully overhead; steadies the shoulders.", curve: t([0, 0.1], [0.24, 0.3], [0.4, 0.4], [0.62, 0.4], [0.86, 0.3], [1, 0.1]), stretch: t([0, 0.05], [0.24, 0.5], [0.4, 0.7], [0.62, 0.7], [0.78, 0.5], [0.9, 0.05], [1, 0.05]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Holds the trunk straight and the ribs down when inverted; the hollow body.", curve: INVERTED },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace the trunk against tipping sideways.", curve: INVERTED },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: INVERTED },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace.", curve: INVERTED },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the spine from folding as the legs go over; lengthened in the fold.", curve: t([0, 0.2], [0.16, 0.3], [0.24, 0.6], [0.4, 0.5], [0.62, 0.5], [0.78, 0.6], [0.86, 0.3], [1, 0.2]), stretch: t([0, 0.05], [0.16, 0.5], [0.24, 0.2], [0.78, 0.2], [0.86, 0.5], [1, 0.05]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "prime-mover", note: "Right: drives the kick up. Both: keep the hips extended in line overhead.", curve: KICK_L, right: KICK_R },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hip", role: "synergist", note: "Hip extension in the kick; on stretch in the fold.", curve: KICK_L, right: KICK_R, stretch: FOLD_LONG, stretchRight: FOLD_LONG },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hip", role: "synergist", note: "Hip extension with biceps femoris; on stretch in the fold.", curve: KICK_L, right: KICK_R, stretch: FOLD_LONG, stretchRight: FOLD_LONG },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "synergist", note: "Left: bears the fold and pushes off. Both: lock the knees overhead.", curve: STANCE_L, right: LEGS_UP },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Legs", role: "stabiliser", note: "Locks the knees straight overhead.", curve: LEGS_UP },
    { id: "adductor-longus", name: "Adductor longus", group: "Legs", role: "stabiliser", note: "Squeezes the legs together overhead.", curve: LEGS_UP },
    { id: "pectineus", name: "Pectineus", group: "Legs", role: "synergist", note: "Adducts and flexes the hip with adductor longus.", curve: scaled(LEGS_UP, 0.8) },
    { id: "gracilis", name: "Gracilis", group: "Legs", role: "synergist", note: "Adducts the hip along the inner thigh.", curve: scaled(LEGS_UP, 0.7) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "synergist", note: "Left: the push-off into the kick. Both: point the toes.", curve: t([0, 0.2], [0.16, 0.5], [0.24, 0.9], [0.32, 0.5], [0.4, 0.4], [0.62, 0.4], [0.78, 0.3], [1, 0.2]), right: LEGS_UP },
  ],
};
