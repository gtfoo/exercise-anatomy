import type { CurvePoint, Exercise } from "./types";

// Cable machine exercises, designed (tools/myo/designed_clip.py's cable_flow, owner's request 2026-10-19): no free
// capture has one. Each is one rep, symmetric, the arms moved by their joints (the left the right's mirror); the
// cable, handle and weight stack are drawn from the hands each frame, to the pulleys below, which match the
// designed_clip.py constants named beside them. The cable keeps a steady pull through the whole rep, so unlike a
// free weight the working muscles are loaded at the stretched end as well as the shortened one. The load is not
// modelled. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const scale = (c: CurvePoint[], k: number, floor = 0): CurvePoint[] => c.map(([x, v]) => [x, Math.max(floor, v * k)]);
const FLAT = (v: number) => t([0, v], [1, v]);
// A pull or press out to t 0.42, held to 0.52, let back under control to 1: hardest at the squeeze.
const WORK = t([0, 0.45], [0.2, 0.75], [0.42, 1], [0.52, 0.95], [0.75, 0.6], [1, 0.45]);
// The muscle lengthened at the start of the rep, shortened at the squeeze.
const LONG_AT_START = t([0, 0.85], [0.25, 0.35], [0.42, 0.05], [0.52, 0.05], [0.8, 0.45], [1, 0.85]);
// Working most as the movement finishes (the shoulder blades drawn together, the arm turned out).
const FINISH = t([0, 0.25], [0.25, 0.55], [0.42, 1], [0.52, 1], [0.75, 0.45], [1, 0.25]);
const GRIP = t([0, 0.5], [0.42, 0.75], [0.52, 0.75], [1, 0.5]);

const cable = (slug: string, name: string, durationMs: number, scenery: Exercise["scenery"], camera: Exercise["camera"], disclaimer: string, phases: Exercise["phases"], muscles: Exercise["muscles"]): Exercise => ({
  slug,
  category: "Cable machine",
  name,
  durationMs,
  anchor: "free",
  native: { clip: `/models/clips/${slug}.glb` },
  scenery,
  camera,
  disclaimer,
  phases,
  muscles,
});

const PULL_PHASES = [
  { name: "pull", t0: 0, t1: 0.42 },
  { name: "squeeze", t0: 0.42, t1: 0.52 },
  { name: "return", t0: 0.52, t1: 1 },
];

export const cableRow = cable(
  "cable-row",
  "Seated cable row",
  2800,
  {
    kind: "cable",
    pulleys: [{ at: [0, 0.4, 1.2], post: [0, 1.32] }], // ROW_PULLEY
    attachment: "v-handle",
    seat: { top: 0.42, z: -0.1, length: 0.55 }, // ROW_SEAT
    footplate: { y: 0.36, z: 0.82, tilt: 0.44 }, // the soles at ROW_ANKLE, the feet tipped 65 degrees up
  },
  { position: [2.6, 1.3, 1.9], target: [0, 0.75, 0.35] },
  "Seated, feet on the plate, knees a little bent, a V-handle on a low pulley. From the reach, the trunk leaning forward from the hips and the arms long, the trunk comes up as the elbows drive back beside the body and the handle comes to the belly; a pause with the shoulder blades drawn together, and back to the reach.",
  PULL_PHASES,
  [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "prime-mover", note: "Draws the upper arms back and down to the sides; stretched at the reach.", curve: WORK, stretch: LONG_AT_START },
    { id: "rhomboids", name: "Rhomboids", group: "Back", role: "prime-mover", note: "Draw the shoulder blades together as the handle reaches the belly.", curve: FINISH, stretch: scale(LONG_AT_START, 0.7) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "prime-mover", note: "Retracts the shoulder blades with the rhomboids.", curve: FINISH, stretch: scale(LONG_AT_START, 0.7) },
    { id: "teres-major", name: "Teres major", group: "Back", role: "synergist", note: "Pulls the arm back with the latissimus.", curve: scale(WORK, 0.8, 0.2) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Carries the elbows back past the body.", curve: scale(FINISH, 0.8, 0.2) },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Back", role: "stabiliser", note: "Keeps the shoulder blades down as they draw together.", curve: scale(FINISH, 0.6, 0.2) },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "synergist", note: "Bends the elbows as the handle comes in.", curve: scale(WORK, 0.75, 0.25) },
    { id: "brachialis", name: "Brachialis", group: "Arm", role: "synergist", note: "Elbow flexion, whatever the forearm's turn.", curve: scale(WORK, 0.75, 0.25) },
    { id: "brachioradialis", name: "Brachioradialis", group: "Arm", role: "synergist", note: "Elbow flexion; the V-handle's thumbs-up grip suits it.", curve: scale(WORK, 0.7, 0.2) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the handle.", curve: GRIP },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "synergist", note: "Bring the trunk up from the lean and hold the back straight against the cable's pull.", curve: t([0, 0.55], [0.3, 0.7], [0.42, 0.6], [0.52, 0.55], [1, 0.55]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips and legs", role: "stabiliser", note: "Helps bring the trunk up from the hips; the feet press the plate.", curve: t([0, 0.3], [0.3, 0.45], [0.52, 0.3], [1, 0.3]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hips and legs", role: "stabiliser", note: "Lengthened at the reach, with the trunk forward over nearly straight legs.", curve: FLAT(0.2), stretch: t([0, 0.55], [0.3, 0.2], [0.52, 0.1], [0.8, 0.3], [1, 0.55]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Steadies the trunk as it stops upright.", curve: FLAT(0.3) },
  ],
);

export const latPulldown = cable(
  "lat-pulldown",
  "Lat pulldown",
  2800,
  {
    kind: "cable",
    pulleys: [{ at: [0, 2.3, 0.2], post: [0, 0.85] }], // PULLDOWN_PULLEY
    attachment: "bar",
    seat: { top: 0.45, z: -0.05, length: 0.45 }, // PULLDOWN_SEAT
    kneePad: { y: 0.7, z: 0.28 },
  },
  { position: [3.0, 1.6, -0.6], target: [0, 1.2, 0.2] },
  "Seated, thighs under the pads, a wide overhand grip on the bar. From arms long overhead, the bar is drawn down in front of the face to the top of the chest, the elbows pointing down and a little back and the trunk leaning back a little; a pause, and up under control.",
  PULL_PHASES,
  [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "prime-mover", note: "Draws the arms down from overhead to the sides; stretched at the top.", curve: WORK, stretch: LONG_AT_START },
    { id: "teres-major", name: "Teres major", group: "Back", role: "prime-mover", note: "Brings the arm down with the latissimus.", curve: scale(WORK, 0.85, 0.2), stretch: scale(LONG_AT_START, 0.8) },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Back", role: "synergist", note: "Draws the shoulder blades down as the bar comes to the chest.", curve: FINISH },
    { id: "rhomboids", name: "Rhomboids", group: "Back", role: "synergist", note: "Turn the shoulder blades down and draw them in.", curve: scale(FINISH, 0.85, 0.2) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "stabiliser", note: "Holds the shoulder blades in at the bottom.", curve: scale(FINISH, 0.6, 0.2) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "synergist", note: "Its lower fibres help bring the arms down from overhead.", curve: scale(WORK, 0.5, 0.15) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Draws the elbows down and back with a wide grip.", curve: scale(WORK, 0.6, 0.2) },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "synergist", note: "Bends the elbows as the bar comes down.", curve: scale(WORK, 0.7, 0.2) },
    { id: "brachialis", name: "Brachialis", group: "Arm", role: "synergist", note: "Elbow flexion.", curve: scale(WORK, 0.7, 0.2) },
    { id: "brachioradialis", name: "Brachioradialis", group: "Arm", role: "synergist", note: "Elbow flexion with the hands turned palms forward.", curve: scale(WORK, 0.55, 0.15) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "stabiliser", note: "Lengthened with the arm overhead; it crosses the shoulder and helps bring the arm down.", curve: FLAT(0.2), stretch: scale(LONG_AT_START, 0.7) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the bar.", curve: GRIP },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the trunk leaning back a little rather than arching.", curve: t([0, 0.3], [0.42, 0.45], [0.52, 0.45], [1, 0.3]) },
  ],
);

const PUSH_PHASES = [
  { name: "push down", t0: 0, t1: 0.4 },
  { name: "lockout", t0: 0.4, t1: 0.5 },
  { name: "return", t0: 0.5, t1: 1 },
];
const PUSH = t([0, 0.45], [0.2, 0.8], [0.4, 1], [0.5, 0.95], [0.75, 0.6], [1, 0.45]);

export const tricepsPushdown = cable(
  "triceps-pushdown",
  "Triceps pushdown",
  2200,
  {
    kind: "cable",
    pulleys: [{ at: [0, 2.05, 0.45], post: [0, 0.62] }], // PUSHDOWN_PULLEY
    attachment: "rope",
  },
  { position: [2.6, 1.4, 2.0], target: [0, 1.05, 0.15] },
  "Standing close to a high pulley with a rope, leaning a little forward, the upper arms held at the sides. The forearms straighten from the chest down past the hips, the rope's ends drawn apart at the bottom, and come back up with the elbows still.",
  PUSH_PHASES,
  [
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Straightens the elbow, hardest at the lockout.", curve: PUSH },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Elbow extension through the whole range.", curve: PUSH },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Elbow extension; with the arm at the side it is less stretched than in an overhead extension.", curve: scale(PUSH, 0.85, 0.3) },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "stabiliser", note: "Lengthened as the elbow straightens; it lets go rather than works.", curve: FLAT(0.1), stretch: t([0, 0.1], [0.4, 0.55], [0.5, 0.55], [1, 0.1]) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the rope.", curve: GRIP },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Keep the wrists straight as the hands turn out.", curve: t([0, 0.3], [0.4, 0.5], [0.5, 0.5], [1, 0.3]) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Holds the upper arms down at the sides against the cable.", curve: scale(PUSH, 0.45, 0.25) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "stabiliser", note: "Keeps the elbows from drifting forward.", curve: scale(PUSH, 0.35, 0.2) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the trunk still as the hands push down.", curve: FLAT(0.35) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the slight forward lean.", curve: FLAT(0.3) },
  ],
);

export const cableCrossover = cable(
  "cable-crossover",
  "Cable crossover",
  2800,
  {
    kind: "cable",
    pulleys: [
      { at: [1.05, 1.95, -0.15], post: [1.17, -0.15] }, // CROSSOVER_PULLEY, the figure's left
      { at: [-1.05, 1.95, -0.15], post: [-1.17, -0.15] },
    ],
    attachment: "handles",
  },
  { position: [0.9, 1.6, 3.4], target: [0, 1.15, 0] },
  "High to low, between two columns: leaning a little forward with the knees soft, the arms sweep from wide and high, the chest open, down and in until the hands meet in front of the hips, the elbows softly bent and still; a pause, and back up and out.",
  [
    { name: "sweep in", t0: 0, t1: 0.42 },
    { name: "squeeze", t0: 0.42, t1: 0.52 },
    { name: "open", t0: 0.52, t1: 1 },
  ],
  [
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "Brings the arms down and across; from high to low its lower fibres do most. Stretched with the arms wide.", curve: WORK, stretch: LONG_AT_START },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "synergist", note: "Brings the arms forward with the chest.", curve: scale(WORK, 0.65, 0.2), stretch: scale(LONG_AT_START, 0.6) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "synergist", note: "Draws the upper arm forward and in.", curve: scale(WORK, 0.55, 0.15) },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", role: "synergist", note: "Draws the shoulder blades down and forward as the hands meet low.", curve: scale(FINISH, 0.6, 0.15) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Carries the shoulder blades forward round the ribs at the squeeze.", curve: scale(FINISH, 0.6, 0.2) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "synergist", note: "Helps bring the arms down from high.", curve: scale(WORK, 0.45, 0.15) },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "stabiliser", note: "Holds the elbows softly bent.", curve: FLAT(0.3) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the handles.", curve: GRIP },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the trunk from being pulled back as the arms open.", curve: FLAT(0.35) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the forward lean.", curve: FLAT(0.35) },
  ],
);

export const facePull = cable(
  "face-pull",
  "Face pull",
  2400,
  {
    kind: "cable",
    pulleys: [{ at: [0, 1.7, 1.15], post: [0, 1.3] }], // FACE_PULL_PULLEY
    attachment: "rope",
  },
  { position: [2.6, 1.7, 1.7], target: [0, 1.4, 0.3] },
  "A rope at forehead height. From the arms long toward the pulley, the rope is drawn to the face with the elbows high and wide and the upper arms turned out, the hands finishing beside the ears; a pause, and back.",
  PULL_PHASES,
  [
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "prime-mover", note: "Draws the elbows back and out at shoulder height.", curve: WORK },
    { id: "infraspinatus", name: "Infraspinatus", group: "Rotator cuff", role: "prime-mover", note: "Turns the upper arms out as the hands come up beside the head.", curve: FINISH },
    { id: "teres-minor", name: "Teres minor", group: "Rotator cuff", role: "prime-mover", note: "Turns the arm out with the infraspinatus.", curve: scale(FINISH, 0.9, 0.2) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "prime-mover", note: "Draws the shoulder blades together.", curve: FINISH, stretch: scale(LONG_AT_START, 0.6) },
    { id: "rhomboids", name: "Rhomboids", group: "Back", role: "synergist", note: "Retract the shoulder blades with the middle trapezius.", curve: scale(FINISH, 0.85, 0.2), stretch: scale(LONG_AT_START, 0.6) },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Back", role: "synergist", note: "Keeps the shoulder blades down and turned up as the arms stay high.", curve: scale(FINISH, 0.7, 0.2) },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Back", role: "stabiliser", note: "Supports the shoulder girdle with the elbows at shoulder height.", curve: t([0, 0.3], [0.42, 0.5], [0.52, 0.5], [1, 0.3]) },
    { id: "supraspinatus", name: "Supraspinatus", group: "Rotator cuff", role: "stabiliser", note: "Holds the head of the arm in its socket with the arm raised.", curve: FLAT(0.4) },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "synergist", note: "Bends the elbows as the rope comes in.", curve: scale(WORK, 0.55, 0.15) },
    { id: "brachialis", name: "Brachialis", group: "Arm", role: "synergist", note: "Elbow flexion.", curve: scale(WORK, 0.55, 0.15) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the rope.", curve: GRIP },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the trunk from being pulled toward the pulley.", curve: FLAT(0.3) },
  ],
);

// The Pallof press: the cable pulls the hands toward the figure's left (the pulley's side) and so tries to turn the
// trunk to the left, more the further out the hands are. The muscles that turn it to the right hold it square: the
// left external oblique and the right internal oblique. The curves are the left side's, `right` the right side's.
const ANTI = t([0, 0.35], [0.3, 0.95], [0.62, 1], [0.9, 0.35], [1, 0.35]);
const PRESS = t([0, 0.25], [0.15, 0.7], [0.3, 0.75], [0.62, 0.65], [0.9, 0.3], [1, 0.25]);

export const pallofPress = cable(
  "pallof-press",
  "Pallof press",
  3600,
  {
    kind: "cable",
    pulleys: [{ at: [1.0, 1.22, 0.3], post: [1.12, 0.3] }], // PALLOF_PULLEY, out to the figure's left
    attachment: "handle",
  },
  { position: [-1.4, 1.5, 3.0], target: [0.3, 1.1, 0.2] },
  "Standing side-on to a chest-height pulley on the left, feet apart, knees soft, the handle held at the breastbone in both hands. The handle is pressed straight out, held there while the trunk refuses to turn toward the pulley, and drawn back in. The work is in not moving.",
  [
    { name: "press out", t0: 0, t1: 0.3 },
    { name: "hold", t0: 0.3, t1: 0.62 },
    { name: "draw in", t0: 0.62, t1: 0.9 },
    { name: "reset", t0: 0.9, t1: 1 },
  ],
  [
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "The left one works hardest: it turns the trunk to the right, against the cable's pull to the left.", curve: ANTI, right: scale(ANTI, 0.45, 0.15) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "The right one works with the left external oblique to hold the trunk square.", curve: scale(ANTI, 0.45, 0.15), right: ANTI },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Braces the whole waist.", curve: scale(ANTI, 0.8, 0.3) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the ribs down as the arms go out.", curve: scale(ANTI, 0.55, 0.2) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the back tall; the right side helps resist the turn.", curve: scale(ANTI, 0.4, 0.2), right: scale(ANTI, 0.55, 0.2) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Hips", role: "stabiliser", note: "Keeps the hips square to the front, not drawn round with the trunk.", curve: scale(ANTI, 0.45, 0.15), right: scale(ANTI, 0.6, 0.2) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "synergist", note: "Presses the handle out and holds it at chest height.", curve: PRESS },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "synergist", note: "Presses the handle out; the left side also resists it being drawn away.", curve: scale(PRESS, 0.85, 0.2), right: scale(PRESS, 0.7, 0.2) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Carries the shoulder blades forward as the arms reach out.", curve: scale(PRESS, 0.8, 0.2) },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "synergist", note: "Straightens the elbows to press out.", curve: t([0, 0.2], [0.15, 0.7], [0.3, 0.5], [0.62, 0.45], [0.9, 0.2], [1, 0.2]) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the handle.", curve: FLAT(0.45) },
  ],
);
