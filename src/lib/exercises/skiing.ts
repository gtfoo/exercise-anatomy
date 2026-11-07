import type { CurvePoint, Exercise } from "./types";

// Skiing, designed (tools/myo/designed_clip.py's skiing section, owner's request 2026-11-07: "the most common
// movements"): no free capture skis. Seen from the skier, who stays in place facing down the hill while the snow
// goes by. The skis are fixed to the feet and turn and edge with them; the poles are held in the fists. The
// turns alternate, so most curves are the left side's with `right` the right's. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const scale = (c: CurvePoint[], k: number, floor = 0): CurvePoint[] => c.map(([x, v]) => [x, Math.max(floor, v * k)]);
const FLAT = (v: number) => t([0, v], [1, v]);

const ski = (slug: string, name: string, durationMs: number, props: Exercise["props"], tracks: boolean, camera: Exercise["camera"], disclaimer: string, phases: Exercise["phases"], muscles: Exercise["muscles"]): Exercise => ({
  slug,
  category: "Snow sports",
  name,
  durationMs,
  anchor: "free",
  props,
  native: { clip: `/models/clips/${slug}.glb` },
  scenery: { kind: "snow", tracks },
  camera,
  disclaimer,
  phases,
  muscles,
});

// A left turn then a right: each leg works hardest as the outside leg of its turn (the right leg in the left turn,
// t 0-0.5) and lighter as the inside one.
const OUTSIDE_L = t([0, 0.45], [0.15, 0.5], [0.5, 0.45], [0.62, 0.85], [0.75, 1], [0.88, 0.85], [1, 0.45]);
const OUTSIDE_R = t([0, 0.45], [0.12, 0.85], [0.25, 1], [0.38, 0.85], [0.5, 0.45], [0.65, 0.5], [1, 0.45]);
const TURN_PHASES = [
  { name: "plant, into the left turn", t0: 0, t1: 0.08 },
  { name: "left turn", t0: 0.08, t1: 0.5 },
  { name: "plant, into the right turn", t0: 0.5, t1: 0.58 },
  { name: "right turn", t0: 0.58, t1: 1 },
];

export const parallelTurns = ski(
  "parallel-turns",
  "Parallel turns",
  2600,
  "skis",
  false,
  { position: [1.8, 1.5, 3.2], target: [0, 0.7, 0.1] },
  "Linked parallel turns, a left then a right. At each transition the skis run flat under the hips and the pole on the side of the coming turn is planted ahead; through the turn the legs tip into it and the skis turn and roll onto their edges under a quiet upper body that keeps facing down the hill, the outside leg long and the inside leg bent.",
  TURN_PHASES,
  [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Holds the bent knee against the turn's pressure, hardest in the outside leg.", curve: OUTSIDE_L, right: OUTSIDE_R },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "With the lateralis, holding the knee bent under load.", curve: OUTSIDE_L, right: OUTSIDE_R },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor, working the same way.", curve: OUTSIDE_L, right: OUTSIDE_R },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Knee extension; also holds the hip in its flexed stance.", curve: scale(OUTSIDE_L, 0.8, 0.3), right: scale(OUTSIDE_R, 0.8, 0.3) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "synergist", note: "Holds the hips in their crouch and drives the outside leg long.", curve: scale(OUTSIDE_L, 0.8, 0.25), right: scale(OUTSIDE_R, 0.8, 0.25) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "synergist", note: "Steadies the pelvis over the outside ski as the legs tip.", curve: scale(OUTSIDE_L, 0.75, 0.2), right: scale(OUTSIDE_R, 0.75, 0.2) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Hips", role: "stabiliser", note: "Keeps the skis together and parallel.", curve: FLAT(0.4) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "stabiliser", note: "Co-contracts with the quadriceps to steady the knee.", curve: scale(OUTSIDE_L, 0.5, 0.2), right: scale(OUTSIDE_R, 0.5, 0.2) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "stabiliser", note: "Keeps the shin pressed forward into the boot.", curve: FLAT(0.45) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius, medial head", group: "Lower leg", role: "stabiliser", note: "Balances fore and aft in the boot.", curve: FLAT(0.3) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Hold the upper body facing down the hill while the legs turn beneath it.", curve: scale(OUTSIDE_R, 0.6, 0.2), right: scale(OUTSIDE_L, 0.6, 0.2) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Counter-rotation with the opposite external oblique.", curve: scale(OUTSIDE_L, 0.6, 0.2), right: scale(OUTSIDE_R, 0.6, 0.2) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Hold the trunk leaning forward over the skis.", curve: FLAT(0.45) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "stabiliser", note: "Reaches the pole forward to plant, the left before the left turn and the right before the right.", curve: t([0, 0.55], [0.1, 0.2], [0.9, 0.2], [1, 0.55]), right: t([0, 0.2], [0.4, 0.2], [0.5, 0.55], [0.6, 0.2], [1, 0.2]) },
  ],
);

// The snowplough's turns load the outside ski, which is the right in the left turn (t 0-0.5).
const WEDGE_L = t([0, 0.55], [0.25, 0.45], [0.5, 0.55], [0.75, 0.9], [1, 0.55]);
const WEDGE_R = t([0, 0.55], [0.25, 0.9], [0.5, 0.55], [0.75, 0.45], [1, 0.55]);

export const snowplough = ski(
  "snowplough",
  "Snowplough turns",
  3000,
  "skis",
  false,
  { position: [1.4, 1.6, 3.0], target: [0, 0.65, 0.2] },
  "The beginner's wedge: the ski tips together and the tails apart, both skis on their inside edges, the knees soft. To turn left the weight goes onto the right ski, the hips moving over it and its knee bending and pressing; then the same to the right.",
  [
    { name: "wedge", t0: 0, t1: 0.1 },
    { name: "left turn", t0: 0.1, t1: 0.45 },
    { name: "wedge", t0: 0.45, t1: 0.6 },
    { name: "right turn", t0: 0.6, t1: 0.95 },
    { name: "wedge", t0: 0.95, t1: 1 },
  ],
  [
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "prime-mover", note: "Pushes the ski tails out and holds the wedge open; the loaded side most.", curve: WEDGE_L, right: WEDGE_R },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Holds the bent knee, pressing the turning ski.", curve: WEDGE_L, right: WEDGE_R },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Holds the knee as it presses in toward the inside edge.", curve: WEDGE_L, right: WEDGE_R },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Knee extension and the flexed hip.", curve: scale(WEDGE_L, 0.8, 0.3), right: scale(WEDGE_R, 0.8, 0.3) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "synergist", note: "Holds the hips in the stance.", curve: scale(WEDGE_L, 0.7, 0.3), right: scale(WEDGE_R, 0.7, 0.3) },
    { id: "adductor-longus", name: "Adductor longus", group: "Hips", role: "stabiliser", note: "Stops the wedge opening too far and keeps the tips together.", curve: FLAT(0.4) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "stabiliser", note: "Holds the shin forward in the boot.", curve: FLAT(0.4) },
    { id: "fibularis", name: "Fibularis", group: "Lower leg", role: "stabiliser", note: "Rolls each foot onto the ski's inside edge.", curve: FLAT(0.4) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Hold the trunk tall over the skis.", curve: FLAT(0.35) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Steadies the trunk as the weight shifts.", curve: FLAT(0.3) },
  ],
);

// The diagonal stride: the right arm pushes 0-0.5 while the left leg glides and the right leg kicks; then the
// mirror. KICK is the kicking leg's push-off, POLE the pushing arm's.
const KICK_R = t([0, 0.85], [0.15, 1], [0.3, 0.45], [0.5, 0.2], [0.85, 0.25], [1, 0.85]);
const KICK_L = t([0, 0.25], [0.35, 0.25], [0.5, 0.85], [0.65, 1], [0.8, 0.45], [1, 0.25]);
const POLE_R = t([0, 0.7], [0.15, 1], [0.35, 0.8], [0.5, 0.2], [0.9, 0.2], [1, 0.7]);
const POLE_L = t([0, 0.2], [0.4, 0.2], [0.5, 0.7], [0.65, 1], [0.85, 0.8], [1, 0.2]);

export const crossCountryClassic = ski(
  "cross-country-classic",
  "Cross-country classic stride",
  1800,
  "xc-skis",
  true,
  { position: [3.2, 1.4, 1.4], target: [0, 0.8, 0.0] },
  "The diagonal stride in a classic track: one ski glides forward under a bent knee while the other leg kicks back long, and the opposite arm plants its pole ahead by the gliding foot and pushes back past the hip to a long arm behind; then the other side.",
  [
    { name: "right pole, left glide", t0: 0, t1: 0.5 },
    { name: "left pole, right glide", t0: 0.5, t1: 1 },
  ],
  [
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Drives the kicking leg back.", curve: KICK_L, right: KICK_R },
    { id: "gastrocnemius-medial", name: "Gastrocnemius, medial head", group: "Lower leg", role: "prime-mover", note: "The kick's last push through the ball of the foot.", curve: KICK_L, right: KICK_R },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "synergist", note: "Pushes through the ankle with the gastrocnemius.", curve: scale(KICK_L, 0.85, 0.2), right: scale(KICK_R, 0.85, 0.2) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "synergist", note: "Straightens the knee in the kick and holds the gliding knee bent.", curve: scale(KICK_L, 0.8, 0.35), right: scale(KICK_R, 0.8, 0.35) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Hip extension in the kick.", curve: scale(KICK_L, 0.7, 0.2), right: scale(KICK_R, 0.7, 0.2) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Swings the leg forward after its kick; lengthened as the kick ends.", curve: scale(KICK_R, 0.6, 0.2), right: scale(KICK_L, 0.6, 0.2), stretch: t([0, 0.1], [0.5, 0.1], [0.65, 0.5], [0.8, 0.1], [1, 0.1]), stretchRight: t([0, 0.4], [0.15, 0.5], [0.3, 0.1], [1, 0.4]) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "stabiliser", note: "Balances the hips over the gliding ski.", curve: scale(KICK_R, 0.7, 0.3), right: scale(KICK_L, 0.7, 0.3) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back and arms", role: "prime-mover", note: "Pulls the planted pole back past the body.", curve: POLE_L, right: POLE_R },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Back and arms", role: "prime-mover", note: "Straightens the arm through the end of the push.", curve: POLE_L, right: POLE_R },
    { id: "teres-major", name: "Teres major", group: "Back and arms", role: "synergist", note: "Draws the arm back with the latissimus.", curve: scale(POLE_L, 0.8, 0.2), right: scale(POLE_R, 0.8, 0.2) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Back and arms", role: "synergist", note: "Carries the arm back behind the hip.", curve: scale(POLE_L, 0.7, 0.2), right: scale(POLE_R, 0.7, 0.2) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Back and arms", role: "synergist", note: "Swings the arm forward to the next plant.", curve: scale(POLE_R, 0.6, 0.15), right: scale(POLE_L, 0.6, 0.15) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "synergist", note: "Crunches the trunk down onto the poles as each pushes.", curve: t([0, 0.55], [0.15, 0.7], [0.4, 0.4], [0.5, 0.55], [0.65, 0.7], [0.9, 0.4], [1, 0.55]) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Turn the trunk with each stride.", curve: scale(POLE_R, 0.5, 0.2), right: scale(POLE_L, 0.5, 0.2) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Back and arms", role: "stabiliser", note: "Hold the pole grips.", curve: scale(POLE_L, 0.5, 0.2), right: scale(POLE_R, 0.5, 0.2) },
  ],
);

export const skiTuck = ski(
  "ski-tuck",
  "Downhill tuck",
  3000,
  "skis",
  false,
  { position: [2.4, 1.1, 2.2], target: [0, 0.55, 0.1] },
  "The racer's crouch: deep in the knees, the back flat and near level, the head up to look ahead, the hands together in front of the chin with the elbows ahead of the knees, the poles tucked back under the arms. A hold, absorbing a little as the snow goes by.",
  [{ name: "hold", t0: 0, t1: 1 }],
  [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Holds the deep knee bend: the tuck burns here first.", curve: t([0, 0.85], [0.5, 0.95], [1, 0.85]) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Holds the knee deep with the lateralis.", curve: t([0, 0.85], [0.5, 0.95], [1, 0.85]) },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "prime-mover", note: "Deep knee extensor, holding.", curve: t([0, 0.85], [0.5, 0.95], [1, 0.85]) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Holds the knee; slack at the hip, folded deep.", curve: FLAT(0.6) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "synergist", note: "Holds the hips folded and the trunk from tipping further.", curve: FLAT(0.65), stretch: FLAT(0.45) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "stabiliser", note: "Steadies the hips and knees in the crouch.", curve: FLAT(0.45) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Holds the back flat and near level against its own weight.", curve: FLAT(0.75) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk with the back.", curve: FLAT(0.45) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "stabiliser", note: "Holds the shins forward against the boots.", curve: FLAT(0.55) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius, medial head", group: "Lower leg", role: "stabiliser", note: "Balances fore and aft over the feet.", curve: FLAT(0.4) },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Neck and shoulders", role: "stabiliser", note: "Holds the head up to look ahead.", curve: FLAT(0.5) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Neck and shoulders", role: "stabiliser", note: "Holds the hands forward in front of the chin.", curve: FLAT(0.35) },
  ],
);
