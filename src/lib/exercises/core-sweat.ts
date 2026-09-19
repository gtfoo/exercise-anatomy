import type { CurvePoint, Exercise } from "./types";

// Seven abdominal drills designed (tools/myo/designed_clip.py) to the form
// on sweat.com, the owner's references of 2026-09-19: windshield wipers,
// straight-leg sit-up, straight-leg hold, V-up, shoulder tap, double-leg
// lift and straight-leg raise. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const DISCLAIMER = (form: string) =>
  `Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured, to the form at sweat.com: ${form}. Nothing here is estimated or measured. Educational illustration, not training or medical advice.`;
const HOLD = (v: number) => t([0, Math.min(v, 0.15)], [0.4, v], [0.75, v], [1, Math.min(v, 0.15)]);
const REP = t([0, 0.3], [0.25, 0.65], [0.5, 1], [0.75, 0.65], [1, 0.3]); // one rep, hardest at the top (t 0.5)
const core = (slug: string, name: string, form: string, durationMs: number, camera: Exercise["camera"], phases: Exercise["phases"], muscles: Exercise["muscles"]): Exercise => ({
  slug,
  category: "Core",
  name,
  durationMs,
  anchor: "free",
  native: { clip: `/models/clips/${slug}.glb` },
  camera,
  disclaimer: DISCLAIMER(form),
  phases,
  muscles,
});

// Legs straight up, lowered to the right (t 0.25) and to the left (0.75): the side the legs fall toward is
// the side whose obliques pay out; the other side pulls them back.
const WIPE_R = t([0, 0.4], [0.12, 0.7], [0.25, 0.9], [0.38, 1], [0.5, 0.4], [0.62, 0.3], [0.75, 0.35], [0.88, 0.4], [1, 0.4]);
const WIPE_L = t([0, 0.4], [0.12, 0.3], [0.25, 0.35], [0.38, 0.4], [0.5, 0.4], [0.62, 0.7], [0.75, 0.9], [0.88, 1], [1, 0.4]);
export const windshieldWipers = core("windshield-wipers", "Windshield wipers", "arms out in a T, the straight legs at a right angle to the hips lowered to each side and brought back", 5000, { position: [1.2, 1.8, 3.0], target: [0, 0.4, 0.1] }, [
  { name: "to the right", t0: 0, t1: 0.25 },
  { name: "back up", t0: 0.25, t1: 0.5 },
  { name: "to the left", t0: 0.5, t1: 0.75 },
  { name: "back up", t0: 0.75, t1: 1 },
], [
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "The left side lowers the legs to the right under control and pulls them back; the right side does the same for the left.", curve: WIPE_R, right: WIPE_L },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Pair with the opposite external oblique to turn the pelvis back to centre.", curve: WIPE_L, right: WIPE_R },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "synergist", note: "Holds the legs at a right angle and the lower back to the floor.", curve: t([0, 0.7], [0.25, 0.6], [0.5, 0.7], [0.75, 0.6], [1, 0.7]) },
  { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace through the whole swing.", curve: t([0, 0.6], [1, 0.6]) },
  { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "synergist", note: "Hip flexors hold the legs up at the right angle.", curve: t([0, 0.6], [1, 0.6]) },
  { id: "pectineus", name: "Pectineus", group: "Hips", role: "synergist", note: "Hip flexion with rectus femoris.", curve: t([0, 0.5], [1, 0.5]) },
  { id: "adductor-longus", name: "Adductor longus", group: "Hips", role: "stabiliser", note: "Keeps the legs pressed together.", curve: t([0, 0.4], [1, 0.4]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Hips", role: "stabiliser", note: "Locks the knees straight.", curve: t([0, 0.4], [1, 0.4]) },
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Arms", role: "stabiliser", note: "The arms press into the floor to pin the shoulders down.", curve: t([0, 0.3], [0.25, 0.6], [0.5, 0.3], [0.75, 0.6], [1, 0.3]), right: t([0, 0.3], [0.25, 0.6], [0.5, 0.3], [0.75, 0.6], [1, 0.3]) },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Arms", role: "stabiliser", note: "Presses the arms down into the floor.", curve: t([0, 0.3], [0.25, 0.55], [0.5, 0.3], [0.75, 0.55], [1, 0.3]) },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hips", role: "stabiliser", note: "Lengthened behind the straight, raised legs.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.8], [0.25, 0.6], [0.5, 0.8], [0.75, 0.6], [1, 0.8]) },
]);

export const straightLegSitUp = core("straight-leg-sit-up", "Straight-leg sit-up", "lying with the arms overhead and the heels planted, the trunk curls up and the hands reach the toes", 3600, { position: [3.0, 1.2, 1.8], target: [0, 0.35, 0.2] }, [
  { name: "sit up", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Curls the trunk off the floor and lowers it under control.", curve: t([0, 0.4], [0.15, 0.9], [0.3, 1], [0.5, 0.7], [0.7, 0.9], [0.85, 0.7], [1, 0.4]) },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Trunk flexion with rectus abdominis.", curve: t([0, 0.3], [0.3, 0.8], [0.5, 0.6], [0.7, 0.7], [1, 0.3]) },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "With the external obliques.", curve: t([0, 0.3], [0.3, 0.7], [0.5, 0.55], [0.7, 0.65], [1, 0.3]) },
  { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "synergist", note: "Hip flexors bring the trunk the rest of the way up once the abdominals have curled it.", curve: t([0, 0.2], [0.25, 0.5], [0.45, 0.9], [0.55, 0.8], [0.75, 0.5], [1, 0.2]) },
  { id: "pectineus", name: "Pectineus", group: "Hips", role: "synergist", note: "Hip flexion with rectus femoris.", curve: t([0, 0.2], [0.25, 0.45], [0.45, 0.8], [0.55, 0.7], [0.75, 0.45], [1, 0.2]) },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "synergist", note: "Swings the arms over the top and forward to the toes.", curve: t([0, 0.2], [0.25, 0.7], [0.5, 0.5], [0.75, 0.6], [1, 0.2]) },
  { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "synergist", note: "Brings the arms forward with the deltoid.", curve: t([0, 0.2], [0.25, 0.6], [0.5, 0.4], [1, 0.2]) },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hips", role: "stabiliser", note: "Lengthened in the forward reach.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.05], [0.5, 0.7], [1, 0.05]) },
  { id: "semitendinosus", name: "Semitendinosus", group: "Hips", role: "stabiliser", note: "Lengthened with biceps femoris.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.05], [0.5, 0.7], [1, 0.05]) },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Lengthened as the back rounds up and forward.", curve: t([0, 0.15], [1, 0.15]), stretch: t([0, 0.05], [0.5, 0.6], [1, 0.05]) },
]);

export const straightLegHold = core("straight-leg-hold", "Straight-leg hold", "on the back, the straight legs raised to 45 degrees with the feet flexed and held", 6000, { position: [3.0, 1.2, 1.8], target: [0, 0.3, 0.2] }, [
  { name: "raise", t0: 0, t1: 0.4 },
  { name: "hold", t0: 0.4, t1: 0.75 },
  { name: "lower", t0: 0.75, t1: 1 },
], [
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Keeps the lower back pressed to the floor against the legs' lever.", curve: HOLD(0.9) },
  { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace.", curve: HOLD(0.75) },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace with rectus abdominis.", curve: HOLD(0.6) },
  { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "prime-mover", note: "Holds the legs at 45 degrees.", curve: HOLD(0.85) },
  { id: "pectineus", name: "Pectineus", group: "Hips", role: "synergist", note: "Hip flexion with rectus femoris.", curve: HOLD(0.65) },
  { id: "adductor-longus", name: "Adductor longus", group: "Hips", role: "synergist", note: "Hip flexion and keeps the legs together.", curve: HOLD(0.5) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Locks the knees straight.", curve: HOLD(0.5) },
  { id: "tibialis-anterior", name: "Tibialis anterior", group: "Legs", role: "stabiliser", note: "Holds the feet flexed.", curve: HOLD(0.55) },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Legs", role: "stabiliser", note: "Lengthened behind the raised legs.", curve: HOLD(0.1), stretch: HOLD(0.5) },
]);

export const vUp = core("v-up", "V-up", "lying with the arms overhead and the legs together, arms and legs raised at once to touch the toes", 3000, { position: [3.0, 1.2, 1.8], target: [0, 0.4, 0.2] }, [
  { name: "up", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Folds the trunk up to meet the legs.", curve: REP },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Trunk flexion with rectus abdominis.", curve: t([0, 0.25], [0.5, 0.8], [1, 0.25]) },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "With the external obliques.", curve: t([0, 0.25], [0.5, 0.7], [1, 0.25]) },
  { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "prime-mover", note: "Lifts the straight legs to meet the hands.", curve: REP },
  { id: "pectineus", name: "Pectineus", group: "Hips", role: "synergist", note: "Hip flexion with rectus femoris.", curve: t([0, 0.25], [0.5, 0.8], [1, 0.25]) },
  { id: "adductor-longus", name: "Adductor longus", group: "Hips", role: "synergist", note: "Hip flexion; keeps the legs together.", curve: t([0, 0.25], [0.5, 0.7], [1, 0.25]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Hips", role: "stabiliser", note: "Locks the knees.", curve: t([0, 0.3], [0.5, 0.55], [1, 0.3]) },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "synergist", note: "Swings the arms from overhead to the toes.", curve: t([0, 0.2], [0.3, 0.7], [0.5, 0.5], [1, 0.2]) },
  { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "synergist", note: "Arm swing with the deltoid.", curve: t([0, 0.2], [0.3, 0.6], [0.5, 0.4], [1, 0.2]) },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hips", role: "stabiliser", note: "Lengthened in the fold.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.05], [0.5, 0.75], [1, 0.05]) },
  { id: "semitendinosus", name: "Semitendinosus", group: "Hips", role: "stabiliser", note: "Lengthened with biceps femoris.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.05], [0.5, 0.75], [1, 0.05]) },
]);

// The right hand taps (t 0.15-0.35), then the left (0.65-0.85): the planted side carries the body.
const TAP_R = t([0, 0.5], [0.15, 0.9], [0.35, 0.9], [0.5, 0.5], [0.65, 0.4], [0.85, 0.4], [1, 0.5]);
const TAP_L = t([0, 0.5], [0.15, 0.4], [0.35, 0.4], [0.5, 0.5], [0.65, 0.9], [0.85, 0.9], [1, 0.5]);
export const shoulderTap = core("shoulder-tap", "Shoulder tap", "in a high plank, the right hand taps the left shoulder and returns, then the left hand the right", 3200, { position: [2.8, 1.5, 2.4], target: [0, 0.5, 0] }, [
  { name: "right hand", t0: 0, t1: 0.5 },
  { name: "left hand", t0: 0.5, t1: 1 },
], [
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Stop the hips turning as one hand leaves the floor; the side opposite the planted hand works hardest.", curve: t([0, 0.5], [0.15, 0.7], [0.35, 0.7], [0.5, 0.5], [0.65, 0.95], [0.85, 0.95], [1, 0.5]), right: t([0, 0.5], [0.15, 0.95], [0.35, 0.95], [0.5, 0.5], [0.65, 0.7], [0.85, 0.7], [1, 0.5]) },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Anti-rotation with the external obliques.", curve: t([0, 0.5], [0.15, 0.9], [0.35, 0.9], [0.5, 0.5], [0.65, 0.7], [0.85, 0.7], [1, 0.5]), right: t([0, 0.5], [0.15, 0.7], [0.35, 0.7], [0.5, 0.5], [0.65, 0.9], [0.85, 0.9], [1, 0.5]) },
  { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace the whole time.", curve: t([0, 0.7], [1, 0.7]) },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "synergist", note: "Holds the plank line.", curve: t([0, 0.6], [1, 0.6]) },
  { id: "serratus-anterior", name: "Serratus anterior", group: "Arms", role: "prime-mover", note: "The planted arm's shoulder blade holds the whole upper body.", curve: TAP_R, right: TAP_L },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "synergist", note: "Carries the body on the planted arm; lifts the tapping arm.", curve: t([0, 0.5], [0.15, 0.8], [0.35, 0.8], [0.5, 0.5], [0.65, 0.7], [0.85, 0.7], [1, 0.5]), right: t([0, 0.5], [0.15, 0.7], [0.35, 0.7], [0.5, 0.5], [0.65, 0.8], [0.85, 0.8], [1, 0.5]) },
  { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "synergist", note: "Locks the planted elbow.", curve: TAP_R, right: TAP_L },
  { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "synergist", note: "Steadies the planted shoulder; draws the tapping hand across.", curve: t([0, 0.4], [0.15, 0.6], [0.35, 0.6], [0.5, 0.4], [0.65, 0.6], [0.85, 0.6], [1, 0.4]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips", role: "stabiliser", note: "Keeps the hips level and in line.", curve: t([0, 0.5], [1, 0.5]) },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Hips", role: "stabiliser", note: "Stops the hips swaying as the base narrows.", curve: t([0, 0.4], [0.15, 0.6], [0.35, 0.6], [0.5, 0.4], [0.65, 0.6], [0.85, 0.6], [1, 0.4]) },
  { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "stabiliser", note: "Holds the straight legs.", curve: t([0, 0.4], [1, 0.4]) },
]);

// Lying on the right side: the right (lower) obliques lift, the left (upper) side abducts the top leg.
export const doubleLegLift = core("double-leg-lift", "Double-leg lift", "lying on the right side with the arm along the mat under the head, hips stacked, both legs lifted by drawing the hip to the ribs", 3200, { position: [3.2, 1.2, 0.6], target: [0, 0.3, 0] }, [
  { name: "lift", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "The right (lower) side draws the hip toward the ribs and lifts the legs.", curve: t([0, 0.3], [0.5, 0.5], [1, 0.3]), right: REP },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Side bend with the external obliques, the lower side most.", curve: t([0, 0.3], [0.5, 0.45], [1, 0.3]), right: t([0, 0.3], [0.5, 0.9], [1, 0.3]) },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "synergist", note: "The lower side helps bend the trunk sideways.", curve: t([0, 0.25], [0.5, 0.35], [1, 0.25]), right: t([0, 0.25], [0.5, 0.65], [1, 0.25]) },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Hips", role: "prime-mover", note: "The left (upper) leg is held up by its abductors; the right steadies the pelvis.", curve: REP, right: t([0, 0.3], [0.5, 0.5], [1, 0.3]) },
  { id: "gluteus-minimus", name: "Gluteus minimus", group: "Hips", role: "synergist", note: "Abduction of the upper leg with the medius.", curve: t([0, 0.25], [0.5, 0.8], [1, 0.25]), right: t([0, 0.25], [0.5, 0.4], [1, 0.25]) },
  { id: "adductor-longus", name: "Adductor longus", group: "Hips", role: "prime-mover", note: "The right (lower) leg lifts against gravity by adduction.", curve: t([0, 0.25], [0.5, 0.4], [1, 0.25]), right: REP },
  { id: "gracilis", name: "Gracilis", group: "Hips", role: "synergist", note: "Adduction of the lower leg with adductor longus.", curve: t([0, 0.2], [0.5, 0.3], [1, 0.2]), right: t([0, 0.25], [0.5, 0.75], [1, 0.25]) },
  { id: "adductor-magnus", name: "Adductor magnus", group: "Hips", role: "synergist", note: "Adduction of the lower leg.", curve: t([0, 0.2], [0.5, 0.3], [1, 0.2]), right: t([0, 0.25], [0.5, 0.7], [1, 0.25]) },
  { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the ribs drawn to the hips.", curve: t([0, 0.5], [1, 0.5]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Keeps the legs straight and in line.", curve: t([0, 0.35], [1, 0.35]) },
]);

export const straightLegRaise = core("straight-leg-raise", "Straight-leg raise", "on the back, the straight legs raised to a right angle with the hips and lowered without touching the floor", 3600, { position: [3.0, 1.2, 1.8], target: [0, 0.4, 0.2] }, [
  { name: "raise", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "prime-mover", note: "Flexes the hips to lift the straight legs; hardest near the floor, where the lever is longest.", curve: t([0, 0.9], [0.25, 0.8], [0.5, 0.5], [0.75, 0.8], [1, 0.9]) },
  { id: "pectineus", name: "Pectineus", group: "Hips", role: "synergist", note: "Hip flexion with rectus femoris.", curve: t([0, 0.75], [0.25, 0.65], [0.5, 0.4], [0.75, 0.65], [1, 0.75]) },
  { id: "adductor-longus", name: "Adductor longus", group: "Hips", role: "synergist", note: "Hip flexion and keeps the legs together.", curve: t([0, 0.6], [0.25, 0.55], [0.5, 0.35], [0.75, 0.55], [1, 0.6]) },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Keeps the lower back pressed to the floor, most when the legs are low.", curve: t([0, 0.95], [0.25, 0.8], [0.5, 0.55], [0.75, 0.8], [1, 0.95]) },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace with rectus abdominis.", curve: t([0, 0.7], [0.5, 0.45], [1, 0.7]) },
  { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace.", curve: t([0, 0.7], [0.5, 0.5], [1, 0.7]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Locks the knees straight.", curve: t([0, 0.5], [1, 0.5]) },
  { id: "tibialis-anterior", name: "Tibialis anterior", group: "Legs", role: "stabiliser", note: "Holds the feet flexed.", curve: t([0, 0.45], [1, 0.45]) },
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Arms", role: "stabiliser", note: "The arms press into the floor by the sides.", curve: t([0, 0.4], [1, 0.4]) },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Legs", role: "stabiliser", note: "Lengthened behind the legs at the top.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.1], [0.5, 0.8], [1, 0.1]) },
  { id: "semitendinosus", name: "Semitendinosus", group: "Legs", role: "stabiliser", note: "Lengthened with biceps femoris.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.1], [0.5, 0.8], [1, 0.1]) },
]);
