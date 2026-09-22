import type { CurvePoint, Exercise } from "./types";

// Six racket strokes for a right-handed player, designed
// (tools/myo/designed_clip.py) from coaching descriptions (owner's request,
// 2026-09-22): tennis forehand, two-handed backhand and serve; pickleball
// forehand drive, two-handed backhand and underhand serve. The racket or
// paddle is drawn in the right hand. Activation is qualitative and the two
// sides differ: a forehand loads the left side and unwinds through the right.
// Form followed: on.com/stories/tennis-forehand, feeltennis.net (forehand,
// serve), mouratoglou.com (two-handed backhand), thedinkpickleball.com
// (pickleball forehand and backhand), usapickleball.org (pickleball serve).

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const stroke = (slug: string, name: string, what: string, durationMs: number, props: "racket" | "paddle", camera: Exercise["camera"], phases: Exercise["phases"], muscles: Exercise["muscles"]): Exercise => ({
  slug,
  category: "Racket sports",
  name,
  durationMs,
  anchor: "free",
  props,
  native: { clip: `/models/clips/${slug}.glb` },
  camera,
  disclaimer: what,
  phases,
  muscles,
});

// Ground strokes: ready (0), unit turn (0.3), racket drop (0.45), contact (0.55), follow-through (0.75), ready.
const SWING = t([0, 0.2], [0.3, 0.35], [0.45, 0.7], [0.55, 1], [0.65, 0.7], [0.75, 0.35], [1, 0.2]); // the hitting side through contact
const LOAD = t([0, 0.2], [0.3, 0.8], [0.45, 0.6], [0.55, 0.3], [0.75, 0.25], [1, 0.2]); // the coil into the backswing
const BRAKE = t([0, 0.2], [0.45, 0.25], [0.55, 0.5], [0.65, 0.9], [0.8, 0.6], [1, 0.2]); // slowing the racket after contact
const LEGS = t([0, 0.4], [0.3, 0.7], [0.45, 0.9], [0.55, 0.8], [0.75, 0.5], [1, 0.4]); // the knees bend into the swing and push out of it
const GRIP = t([0, 0.4], [0.3, 0.5], [0.5, 0.9], [0.6, 0.9], [0.8, 0.5], [1, 0.4]);
const LOW = t([0, 0.2], [1, 0.2]);
const GROUND_PHASES = [
  { name: "unit turn", t0: 0, t1: 0.3 },
  { name: "racket drop", t0: 0.3, t1: 0.45 },
  { name: "swing to contact", t0: 0.45, t1: 0.55 },
  { name: "follow-through", t0: 0.55, t1: 0.75 },
  { name: "recover", t0: 0.75, t1: 1 },
];

export const tennisForehand = stroke("tennis-forehand", "Tennis forehand", "A topspin forehand, right-handed: the unit turn, the racket dropped below the ball, contact out in front at hip height, the follow-through over the opposite shoulder.", 2200, "racket", { position: [2.4, 1.5, 3.0], target: [0, 0.9, 0] }, GROUND_PHASES, [
  { id: "pectoralis-major", name: "Pectoralis major", group: "Hitting arm", role: "prime-mover", note: "Right: swings the racket arm forward and across through contact. Left: rests.", curve: LOW, right: SWING },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Hitting arm", role: "prime-mover", note: "Right: brings the arm forward and up into the low-to-high swing.", curve: t([0, 0.2], [0.3, 0.4], [0.55, 0.5], [1, 0.2]), right: SWING },
  { id: "subscapularis", name: "Subscapularis", group: "Hitting arm", role: "synergist", note: "Right: turns the arm in at the shoulder as the racket comes through.", curve: LOW, right: SWING },
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Hitting arm", role: "synergist", note: "Right: pulls the arm down and across from the top of the backswing.", curve: LOW, right: t([0, 0.2], [0.3, 0.3], [0.45, 0.8], [0.55, 0.9], [0.7, 0.4], [1, 0.2]) },
  { id: "infraspinatus", name: "Infraspinatus", group: "Hitting arm", role: "stabiliser", note: "Right: slows the arm's inward turn after contact.", curve: LOW, right: BRAKE },
  { id: "teres-minor", name: "Teres minor", group: "Hitting arm", role: "stabiliser", note: "Right: braking with infraspinatus.", curve: LOW, right: BRAKE },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Hitting arm", role: "synergist", note: "Right: takes the racket back. Left: holds the free arm out toward the side fence.", curve: t([0, 0.2], [0.3, 0.75], [0.45, 0.5], [0.55, 0.2], [1, 0.2]), right: t([0, 0.2], [0.3, 0.7], [0.45, 0.3], [0.7, 0.5], [1, 0.2]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Hitting arm", role: "stabiliser", note: "Right: grip the racket, firmest through contact.", curve: t([0, 0.3], [1, 0.3]), right: GRIP },
  { id: "forearm-extensors", name: "Forearm extensors", group: "Hitting arm", role: "stabiliser", note: "Right: hold the wrist against the racket's weight and the ball's impact.", curve: LOW, right: GRIP },
  { id: "biceps-brachii", name: "Biceps brachii", group: "Hitting arm", role: "stabiliser", note: "Right: keeps the elbow bent through the swing.", curve: LOW, right: t([0, 0.3], [0.45, 0.5], [0.55, 0.6], [1, 0.3]) },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Left: coils the trunk to the right in the unit turn. Right: unwinds it to the left through contact.", curve: LOAD, right: SWING },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Right: coils with the left external oblique. Left: unwinds with the right external oblique.", curve: SWING, right: LOAD },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk tall through the rotation.", curve: t([0, 0.4], [0.5, 0.6], [1, 0.4]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "prime-mover", note: "Right: drives the hips round from the loaded back leg. Left: catches the weight on the front leg.", curve: t([0, 0.3], [0.45, 0.4], [0.55, 0.7], [0.75, 0.5], [1, 0.3]), right: t([0, 0.3], [0.3, 0.6], [0.45, 0.9], [0.55, 0.8], [0.75, 0.3], [1, 0.3]) },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Legs", role: "synergist", note: "Steadies each hip as the weight passes from the back foot to the front.", curve: t([0, 0.3], [0.5, 0.6], [1, 0.3]), right: t([0, 0.3], [0.3, 0.6], [0.5, 0.5], [1, 0.3]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "synergist", note: "Both knees bend into the swing and push out of it, the right more.", curve: LEGS, right: t([0, 0.4], [0.3, 0.8], [0.45, 1], [0.55, 0.8], [0.75, 0.5], [1, 0.4]) },
  { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "stabiliser", note: "Pushes off the back foot as the hips turn.", curve: t([0, 0.3], [0.5, 0.4], [1, 0.3]), right: t([0, 0.3], [0.45, 0.7], [0.55, 0.6], [1, 0.3]) },
]);

export const tennisBackhand = stroke("tennis-backhand", "Tennis backhand", "A two-handed backhand, right-handed: the unit turn to the left with both hands on the racket, the weight from the back foot to the front, contact just in front of the lead knee, the racket over the right shoulder.", 2200, "racket", { position: [-2.4, 1.5, 3.0], target: [0, 0.9, 0] }, GROUND_PHASES, [
  { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "prime-mover", note: "Left: the top hand's side drives the racket forward, as on a left-handed forehand.", curve: SWING, right: t([0, 0.2], [0.55, 0.4], [1, 0.2]) },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "prime-mover", note: "Left: swings the top arm forward and up.", curve: SWING, right: t([0, 0.2], [0.55, 0.45], [1, 0.2]) },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Arms", role: "prime-mover", note: "Right: the bottom arm pulls the racket through from behind the body.", curve: t([0, 0.2], [0.3, 0.5], [0.55, 0.4], [1, 0.2]), right: SWING },
  { id: "middle-trapezius", name: "Middle trapezius", group: "Arms", role: "synergist", note: "Right: draws the shoulder blade back as the bottom arm leads.", curve: t([0, 0.2], [0.55, 0.35], [1, 0.2]), right: SWING },
  { id: "rhomboids", name: "Rhomboids", group: "Arms", role: "synergist", note: "Right: retraction with the middle trapezius.", curve: t([0, 0.2], [0.55, 0.3], [1, 0.2]), right: SWING },
  { id: "infraspinatus", name: "Infraspinatus", group: "Arms", role: "synergist", note: "Right: turns the bottom arm out through contact, then brakes.", curve: t([0, 0.2], [0.65, 0.5], [1, 0.2]), right: t([0, 0.2], [0.45, 0.6], [0.55, 0.9], [0.7, 0.7], [1, 0.2]) },
  { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "synergist", note: "Both arms straighten through the ball, the right most.", curve: t([0, 0.2], [0.55, 0.6], [1, 0.2]), right: t([0, 0.2], [0.45, 0.5], [0.55, 0.85], [1, 0.2]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Arms", role: "stabiliser", note: "Both grip, firmest at contact.", curve: GRIP, right: GRIP },
  { id: "forearm-extensors", name: "Forearm extensors", group: "Arms", role: "stabiliser", note: "Hold both wrists at contact.", curve: GRIP, right: GRIP },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Right: coils the trunk to the left in the turn. Left: unwinds it to the right through contact.", curve: SWING, right: LOAD },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Left: coils with the right external oblique. Right: unwinds with the left external oblique.", curve: LOAD, right: SWING },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk tall through the rotation.", curve: t([0, 0.4], [0.5, 0.6], [1, 0.4]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "prime-mover", note: "Left: drives the hips round from the loaded back leg. Right: catches the weight on the front leg.", curve: t([0, 0.3], [0.3, 0.6], [0.45, 0.9], [0.55, 0.8], [0.75, 0.3], [1, 0.3]), right: t([0, 0.3], [0.45, 0.4], [0.55, 0.7], [0.75, 0.5], [1, 0.3]) },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Legs", role: "synergist", note: "Steadies each hip as the weight moves from the back foot to the front.", curve: t([0, 0.3], [0.3, 0.6], [0.5, 0.5], [1, 0.3]), right: t([0, 0.3], [0.5, 0.6], [1, 0.3]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "synergist", note: "Both knees bend into the swing and push out of it, the left more.", curve: t([0, 0.4], [0.3, 0.8], [0.45, 1], [0.55, 0.8], [0.75, 0.5], [1, 0.4]), right: LEGS },
  { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "stabiliser", note: "Pushes off the back foot as the hips turn.", curve: t([0, 0.3], [0.45, 0.7], [0.55, 0.6], [1, 0.3]), right: t([0, 0.3], [0.5, 0.4], [1, 0.3]) },
]);

// The serve: stance (0), toss and trophy (0.25), racket drop (0.4), contact (0.5), follow-through (0.7), stance.
const SERVE_PHASES = [
  { name: "toss and trophy", t0: 0, t1: 0.25 },
  { name: "racket drop", t0: 0.25, t1: 0.4 },
  { name: "drive to contact", t0: 0.4, t1: 0.5 },
  { name: "follow-through", t0: 0.5, t1: 0.7 },
  { name: "recover", t0: 0.7, t1: 1 },
];
const HIT = t([0, 0.2], [0.25, 0.4], [0.4, 0.7], [0.5, 1], [0.6, 0.6], [0.7, 0.3], [1, 0.2]);
const DRIVE = t([0, 0.3], [0.25, 0.8], [0.4, 1], [0.5, 0.6], [0.7, 0.3], [1, 0.3]);

export const tennisServe = stroke("tennis-serve", "Tennis serve", "A flat serve, right-handed: the toss and the trophy position with the knees bent, the racket dropped behind the back as the legs drive up, contact with the arm fully extended above the head, the follow-through across to the opposite hip.", 2600, "racket", { position: [2.6, 1.7, 2.8], target: [0, 1.1, 0] }, SERVE_PHASES, [
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Hitting arm", role: "prime-mover", note: "Right: whips the arm down and forward from the trophy position into contact.", curve: LOW, right: HIT },
  { id: "pectoralis-major", name: "Pectoralis major", group: "Hitting arm", role: "prime-mover", note: "Right: drives the arm forward and turns it in through contact.", curve: LOW, right: HIT },
  { id: "subscapularis", name: "Subscapularis", group: "Hitting arm", role: "prime-mover", note: "Right: the inward turn of the arm at the shoulder, the fastest part of the serve.", curve: LOW, right: t([0, 0.2], [0.4, 0.5], [0.5, 1], [0.6, 0.5], [1, 0.2]) },
  { id: "triceps-long-head", name: "Triceps, long head", group: "Hitting arm", role: "prime-mover", note: "Right: straightens the elbow from the racket drop to full reach at contact.", curve: LOW, right: t([0, 0.2], [0.4, 0.4], [0.5, 1], [0.6, 0.5], [1, 0.2]) },
  { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Hitting arm", role: "synergist", note: "Right: elbow extension with the long head.", curve: LOW, right: t([0, 0.2], [0.4, 0.4], [0.5, 0.9], [0.6, 0.5], [1, 0.2]) },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Hitting arm", role: "synergist", note: "Right: lifts the racket arm to the trophy position and carries it up to contact. Left: raises the toss arm.", curve: t([0, 0.2], [0.25, 0.7], [0.4, 0.4], [1, 0.2]), right: t([0, 0.2], [0.25, 0.7], [0.4, 0.5], [0.5, 0.8], [1, 0.2]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Hitting arm", role: "synergist", note: "Right: snap the wrist and turn the forearm over at contact; grip throughout.", curve: t([0, 0.2], [1, 0.2]), right: t([0, 0.3], [0.4, 0.5], [0.5, 1], [0.6, 0.5], [1, 0.3]) },
  { id: "infraspinatus", name: "Infraspinatus", group: "Hitting arm", role: "stabiliser", note: "Right: turns the arm out into the racket drop, then brakes it after contact.", curve: LOW, right: t([0, 0.2], [0.4, 0.7], [0.5, 0.4], [0.6, 0.9], [0.75, 0.5], [1, 0.2]) },
  { id: "teres-minor", name: "Teres minor", group: "Hitting arm", role: "stabiliser", note: "Right: with infraspinatus.", curve: LOW, right: t([0, 0.2], [0.4, 0.6], [0.5, 0.4], [0.6, 0.8], [0.75, 0.4], [1, 0.2]) },
  { id: "serratus-anterior", name: "Serratus anterior", group: "Hitting arm", role: "stabiliser", note: "Right: turns the shoulder blade up under the raised arm.", curve: LOW, right: t([0, 0.2], [0.25, 0.6], [0.5, 0.8], [1, 0.2]) },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Left: arches and coils the trunk into the trophy. Right: brings the trunk forward and round through contact.", curve: t([0, 0.2], [0.25, 0.7], [0.4, 0.6], [0.5, 0.4], [1, 0.2]), right: t([0, 0.2], [0.4, 0.5], [0.5, 0.9], [0.7, 0.7], [1, 0.2]) },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Lengthened in the arch of the trophy, then folds the trunk forward through contact and the follow-through.", curve: t([0, 0.2], [0.25, 0.3], [0.4, 0.5], [0.5, 0.9], [0.7, 0.8], [1, 0.2]), stretch: t([0, 0.05], [0.25, 0.6], [0.4, 0.3], [0.5, 0.05], [1, 0.05]) },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "synergist", note: "Arches the back into the trophy position.", curve: t([0, 0.3], [0.25, 0.8], [0.4, 0.6], [0.5, 0.4], [1, 0.3]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "prime-mover", note: "Both legs bend under the trophy and drive up into contact.", curve: DRIVE, right: DRIVE },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "prime-mover", note: "Extends the hips in the leg drive.", curve: DRIVE, right: DRIVE },
  { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "synergist", note: "Pushes up onto the toes at the top of the drive.", curve: t([0, 0.2], [0.4, 0.8], [0.5, 0.9], [0.6, 0.3], [1, 0.2]), right: t([0, 0.2], [0.4, 0.8], [0.5, 0.9], [0.6, 0.3], [1, 0.2]) },
  { id: "soleus", name: "Soleus", group: "Legs", role: "synergist", note: "Ankle push with gastrocnemius.", curve: t([0, 0.3], [0.4, 0.7], [0.5, 0.8], [0.6, 0.3], [1, 0.3]) },
]);

// Pickleball ground strokes: ready (0), short backswing (0.3), contact (0.5), follow-through (0.7), ready.
const PSWING = t([0, 0.2], [0.3, 0.3], [0.42, 0.7], [0.5, 1], [0.6, 0.7], [0.7, 0.35], [1, 0.2]);
const PLOAD = t([0, 0.2], [0.3, 0.7], [0.5, 0.3], [0.7, 0.25], [1, 0.2]);
const PBRAKE = t([0, 0.2], [0.45, 0.25], [0.55, 0.6], [0.65, 0.85], [0.8, 0.5], [1, 0.2]);
const PLEGS = t([0, 0.55], [0.3, 0.8], [0.45, 0.9], [0.5, 0.8], [0.7, 0.6], [1, 0.55]); // the knees stay bent throughout
const PGRIP = t([0, 0.4], [0.3, 0.5], [0.45, 0.85], [0.55, 0.85], [0.75, 0.5], [1, 0.4]);
const PICKLE_PHASES = [
  { name: "unit turn", t0: 0, t1: 0.3 },
  { name: "swing to contact", t0: 0.3, t1: 0.5 },
  { name: "follow-through", t0: 0.5, t1: 0.7 },
  { name: "recover", t0: 0.7, t1: 1 },
];

export const pickleballForehand = stroke("pickleball-forehand", "Pickleball forehand", "A forehand drive, right-handed: a short backswing with the paddle pointed at the side wall, the knees bent, a compact low-to-high swing to contact out in front at waist height, the follow-through to the opposite shoulder.", 1800, "paddle", { position: [2.4, 1.5, 3.0], target: [0, 0.85, 0] }, PICKLE_PHASES, [
  { id: "pectoralis-major", name: "Pectoralis major", group: "Hitting arm", role: "prime-mover", note: "Right: swings the paddle arm forward and across through contact.", curve: LOW, right: PSWING },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Hitting arm", role: "prime-mover", note: "Right: lifts the arm through the low-to-high path.", curve: t([0, 0.2], [0.5, 0.45], [1, 0.2]), right: PSWING },
  { id: "subscapularis", name: "Subscapularis", group: "Hitting arm", role: "synergist", note: "Right: turns the arm in through contact.", curve: LOW, right: PSWING },
  { id: "infraspinatus", name: "Infraspinatus", group: "Hitting arm", role: "stabiliser", note: "Right: brakes the arm after contact.", curve: LOW, right: PBRAKE },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Hitting arm", role: "synergist", note: "Right: the short backswing. Left: holds the free arm out for balance.", curve: t([0, 0.2], [0.3, 0.6], [0.5, 0.2], [1, 0.2]), right: t([0, 0.2], [0.3, 0.65], [0.5, 0.3], [1, 0.2]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Hitting arm", role: "stabiliser", note: "Right: a moderate grip, firmest at contact.", curve: t([0, 0.3], [1, 0.3]), right: PGRIP },
  { id: "forearm-extensors", name: "Forearm extensors", group: "Hitting arm", role: "stabiliser", note: "Right: hold the wrist steady at contact.", curve: LOW, right: PGRIP },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Left: coils the trunk to the right. Right: unwinds it through contact.", curve: PLOAD, right: PSWING },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Right: coils with the left external oblique. Left: unwinds with the right.", curve: PSWING, right: PLOAD },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk over the bent knees.", curve: t([0, 0.45], [0.5, 0.6], [1, 0.45]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "prime-mover", note: "Right: drives the hips round from the back leg out of the squat.", curve: t([0, 0.4], [0.5, 0.65], [1, 0.4]), right: t([0, 0.4], [0.3, 0.6], [0.45, 0.9], [0.55, 0.7], [1, 0.4]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "prime-mover", note: "Both knees stay bent, the loading platform the drive comes from.", curve: PLEGS, right: t([0, 0.55], [0.3, 0.85], [0.45, 1], [0.55, 0.8], [0.7, 0.6], [1, 0.55]) },
  { id: "vastus-medialis", name: "Vastus medialis", group: "Legs", role: "synergist", note: "Knee control with the other vasti.", curve: PLEGS, right: PLEGS },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Legs", role: "stabiliser", note: "Steadies the hips as the weight shifts.", curve: t([0, 0.3], [0.5, 0.55], [1, 0.3]), right: t([0, 0.3], [0.3, 0.55], [0.5, 0.5], [1, 0.3]) },
]);

export const pickleballBackhand = stroke("pickleball-backhand", "Pickleball backhand", "A two-handed backhand, right-handed: shoulders and hips turn to the left as a unit with both hands on the paddle, a short backswing, the top hand doing most of the work through contact in front, the paddle finishing toward the right shoulder.", 1800, "paddle", { position: [-2.4, 1.5, 3.0], target: [0, 0.85, 0] }, PICKLE_PHASES, [
  { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "prime-mover", note: "Left: the top hand's side drives the paddle forward.", curve: PSWING, right: t([0, 0.2], [0.5, 0.35], [1, 0.2]) },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "prime-mover", note: "Left: swings the top arm forward and up.", curve: PSWING, right: t([0, 0.2], [0.5, 0.4], [1, 0.2]) },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Arms", role: "prime-mover", note: "Right: the bottom arm pulls the paddle through from behind the body.", curve: t([0, 0.2], [0.3, 0.45], [1, 0.2]), right: PSWING },
  { id: "middle-trapezius", name: "Middle trapezius", group: "Arms", role: "synergist", note: "Right: draws the shoulder blade back as the bottom arm leads.", curve: t([0, 0.2], [0.5, 0.3], [1, 0.2]), right: PSWING },
  { id: "infraspinatus", name: "Infraspinatus", group: "Arms", role: "synergist", note: "Right: turns the bottom arm out through contact.", curve: t([0, 0.2], [0.6, 0.45], [1, 0.2]), right: t([0, 0.2], [0.42, 0.6], [0.5, 0.85], [0.65, 0.6], [1, 0.2]) },
  { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "synergist", note: "Both arms straighten through the ball.", curve: t([0, 0.2], [0.5, 0.55], [1, 0.2]), right: t([0, 0.2], [0.5, 0.8], [1, 0.2]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Arms", role: "stabiliser", note: "Both grip, the top hand tighter.", curve: t([0, 0.4], [0.45, 0.95], [0.55, 0.95], [1, 0.4]), right: PGRIP },
  { id: "forearm-extensors", name: "Forearm extensors", group: "Arms", role: "stabiliser", note: "Hold both wrists at contact.", curve: PGRIP, right: PGRIP },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Right: coils the trunk to the left. Left: unwinds it through contact.", curve: PSWING, right: PLOAD },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Left: coils with the right external oblique. Right: unwinds with the left.", curve: PLOAD, right: PSWING },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk over the bent knees.", curve: t([0, 0.45], [0.5, 0.6], [1, 0.45]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "prime-mover", note: "Left: drives the hips round from the back leg. Right: catches the weight on the front.", curve: t([0, 0.4], [0.3, 0.6], [0.45, 0.9], [0.55, 0.7], [1, 0.4]), right: t([0, 0.4], [0.5, 0.65], [1, 0.4]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "prime-mover", note: "Both knees stay bent through the stroke.", curve: t([0, 0.55], [0.3, 0.85], [0.45, 1], [0.55, 0.8], [0.7, 0.6], [1, 0.55]), right: PLEGS },
  { id: "vastus-medialis", name: "Vastus medialis", group: "Legs", role: "synergist", note: "Knee control with the other vasti.", curve: PLEGS, right: PLEGS },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Legs", role: "stabiliser", note: "Steadies the hips as the weight shifts.", curve: t([0, 0.3], [0.3, 0.55], [0.5, 0.5], [1, 0.3]), right: t([0, 0.3], [0.5, 0.55], [1, 0.3]) },
]);

// The pickleball serve: stance (0), backswing (0.3), contact (0.5), follow-through (0.72), stance.
const PSERVE = t([0, 0.2], [0.3, 0.3], [0.42, 0.7], [0.5, 1], [0.6, 0.6], [0.72, 0.3], [1, 0.2]);
export const pickleballServe = stroke("pickleball-serve", "Pickleball serve", "An underhand serve, right-handed: sideways to the net with the ball held out in front, the paddle swung back low and forward in an arc to contact below the waist in front of the body, the hand finishing in line with the opposite shoulder.", 2000, "paddle", { position: [2.6, 1.5, 2.8], target: [0, 0.85, 0] }, [
  { name: "backswing", t0: 0, t1: 0.3 },
  { name: "swing to contact", t0: 0.3, t1: 0.5 },
  { name: "follow-through", t0: 0.5, t1: 0.72 },
  { name: "recover", t0: 0.72, t1: 1 },
], [
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Hitting arm", role: "prime-mover", note: "Right: swings the straight arm forward and up from behind the hip: the pendulum. Left: holds the ball out in front.", curve: t([0, 0.2], [0.3, 0.5], [0.5, 0.4], [1, 0.2]), right: PSERVE },
  { id: "pectoralis-major", name: "Pectoralis major", group: "Hitting arm", role: "synergist", note: "Right: brings the arm across as it rises to the opposite shoulder.", curve: LOW, right: t([0, 0.2], [0.5, 0.7], [0.65, 0.8], [1, 0.2]) },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Hitting arm", role: "synergist", note: "Right: takes the paddle back behind the hip.", curve: LOW, right: t([0, 0.2], [0.3, 0.75], [0.5, 0.25], [1, 0.2]) },
  { id: "biceps-brachii", name: "Biceps brachii", group: "Hitting arm", role: "synergist", note: "Right: holds the elbow's slight bend through the swing.", curve: LOW, right: t([0, 0.25], [0.5, 0.5], [1, 0.25]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Hitting arm", role: "stabiliser", note: "Right: a relaxed grip, firmest at contact.", curve: t([0, 0.3], [1, 0.3]), right: PGRIP },
  { id: "forearm-extensors", name: "Forearm extensors", group: "Hitting arm", role: "stabiliser", note: "Right: hold the wrist as the paddle meets the ball.", curve: LOW, right: PGRIP },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "The trunk turns from sideways toward the net through contact: the right side unwinds it.", curve: t([0, 0.25], [0.3, 0.45], [0.5, 0.3], [1, 0.25]), right: t([0, 0.25], [0.42, 0.6], [0.5, 0.8], [0.72, 0.5], [1, 0.25]) },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Rotation with the external obliques.", curve: t([0, 0.25], [0.42, 0.55], [0.5, 0.7], [0.72, 0.45], [1, 0.25]), right: t([0, 0.25], [0.3, 0.4], [1, 0.25]) },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk upright through the swing.", curve: t([0, 0.4], [1, 0.4]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "synergist", note: "Right: the weight moves from the back foot forward as the hips turn to the net.", curve: t([0, 0.3], [0.5, 0.55], [1, 0.3]), right: t([0, 0.3], [0.42, 0.6], [0.5, 0.75], [1, 0.3]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Soft knees through the swing.", curve: t([0, 0.4], [0.3, 0.55], [0.5, 0.5], [1, 0.4]), right: t([0, 0.4], [0.3, 0.55], [0.5, 0.5], [1, 0.4]) },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Legs", role: "stabiliser", note: "Steadies the hips through the weight shift.", curve: t([0, 0.3], [0.5, 0.5], [1, 0.3]), right: t([0, 0.3], [0.5, 0.5], [1, 0.3]) },
]);
