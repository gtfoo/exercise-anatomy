import type { CurvePoint, Exercise } from "./types";

// Snowboarding, designed (tools/myo/designed_clip.py's snowboarding section, owner's request 2026-11-07): no free
// capture rides a board. Regular stance, the left foot forward; the rider stays in place while the snow goes by.
// The board is drawn under both feet each frame. The legs do different work (front and back), so the curves are
// the left (front) leg's with `right` the back's where they differ. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const scale = (c: CurvePoint[], k: number, floor = 0): CurvePoint[] => c.map(([x, v]) => [x, Math.max(floor, v * k)]);
const FLAT = (v: number) => t([0, v], [1, v]);

const board = (slug: string, name: string, durationMs: number, camera: Exercise["camera"], disclaimer: string, phases: Exercise["phases"], muscles: Exercise["muscles"]): Exercise => ({
  slug,
  category: "Snow sports",
  name,
  durationMs,
  anchor: "free",
  props: "snowboard",
  native: { clip: `/models/clips/${slug}.glb` },
  scenery: { kind: "snow" },
  camera,
  disclaimer,
  phases,
  muscles,
});

// The heelside turn (t 0-0.5) sits back on the heel edge, the toeside turn (0.5-1) presses forward on the toes.
const HEEL = t([0, 0.3], [0.12, 0.75], [0.25, 1], [0.38, 0.75], [0.5, 0.3], [1, 0.3]);
const TOE = t([0, 0.3], [0.5, 0.3], [0.62, 0.75], [0.75, 1], [0.88, 0.75], [1, 0.3]);
const BOTH = t([0, 0.45], [0.25, 0.9], [0.5, 0.45], [0.75, 0.9], [1, 0.45]);

export const snowboardTurns = board(
  "snowboard-turns",
  "Snowboard turns",
  2800,
  { position: [0.6, 1.5, 3.4], target: [0, 0.65, 0] },
  "Linked turns, regular stance: a heelside turn then a toeside turn. On the heel edge the hips sit back over the heels with the knees bent; across the flat transition the rider rises; on the toe edge the knees press forward over the toes and the trunk leans in. The trunk and head stay turned toward the nose, the front hand leading.",
  [
    { name: "transition", t0: 0, t1: 0.08 },
    { name: "heelside turn", t0: 0.08, t1: 0.42 },
    { name: "transition", t0: 0.42, t1: 0.58 },
    { name: "toeside turn", t0: 0.58, t1: 0.92 },
    { name: "transition", t0: 0.92, t1: 1 },
  ],
  [
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Holds the bent knees against the turn's pressure, on either edge.", curve: BOTH },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Holds the knees bent with the lateralis.", curve: BOTH },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Knee extension and the flexed hips.", curve: scale(BOTH, 0.8, 0.3) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "synergist", note: "Holds the hips low and back on the heel edge.", curve: scale(HEEL, 0.85, 0.3) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "stabiliser", note: "Steadies the pelvis over the wide stance.", curve: FLAT(0.45) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "prime-mover", note: "Lifts the toes to roll the board onto its heel edge and hold it there.", curve: HEEL },
    { id: "gastrocnemius-medial", name: "Gastrocnemius, medial head", group: "Lower leg", role: "prime-mover", note: "Presses the toes down to roll the board onto its toe edge.", curve: TOE },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "synergist", note: "Holds the toe edge with the gastrocnemius.", curve: scale(TOE, 0.85, 0.2) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "stabiliser", note: "Steadies the knees with the quadriceps.", curve: scale(BOTH, 0.5, 0.2) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Hold the upper body turned toward the nose and steer it into each turn.", curve: scale(BOTH, 0.6, 0.25) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk as it leans in on the toe edge.", curve: scale(TOE, 0.6, 0.3) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the trunk upright over the heel edge.", curve: scale(HEEL, 0.6, 0.35) },
  ],
);

// The ollie: load (0-0.18), pop (to 0.3), the tuck in the air (to 0.56), the landing (to 0.68), riding on.
const POP = t([0, 0.25], [0.18, 0.5], [0.26, 1], [0.32, 0.5], [0.45, 0.15], [0.62, 0.2], [0.7, 0.85], [0.8, 0.5], [1, 0.25]);
const TUCK = t([0, 0.15], [0.26, 0.4], [0.36, 0.9], [0.48, 0.8], [0.58, 0.3], [1, 0.15]);

export const ollie = board(
  "ollie",
  "Snowboard ollie",
  1600,
  { position: [0.8, 1.4, 3.4], target: [0, 0.75, 0] },
  "An ollie on flat snow: from riding, the rider sinks to load, pulls the front foot up as the back foot snaps the tail so the nose rises, springs and tucks both knees up so the board lifts level under the feet, then lands flat and absorbs.",
  [
    { name: "ride", t0: 0, t1: 0.06 },
    { name: "load", t0: 0.06, t1: 0.2 },
    { name: "pop", t0: 0.2, t1: 0.32 },
    { name: "air", t0: 0.32, t1: 0.6 },
    { name: "land", t0: 0.6, t1: 0.78 },
    { name: "ride", t0: 0.78, t1: 1 },
  ],
  [
    { id: "gastrocnemius-medial", name: "Gastrocnemius, medial head", group: "Lower leg", role: "prime-mover", note: "The back foot's snap of the tail, and the spring off it.", curve: scale(POP, 0.7, 0.15), right: POP },
    { id: "soleus", name: "Soleus", group: "Lower leg", role: "synergist", note: "Pushes through the back ankle with the gastrocnemius.", curve: scale(POP, 0.6, 0.15), right: scale(POP, 0.9, 0.15) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Straightens the knees to spring, then catches the landing deep.", curve: POP },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Spring and landing with the lateralis.", curve: POP },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Drives the hips up out of the load and holds the landing.", curve: POP },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "synergist", note: "Lifts the front knee to raise the nose, then pulls both knees up in the air.", curve: t([0, 0.2], [0.22, 0.85], [0.32, 0.6], [0.42, 0.8], [0.56, 0.3], [0.7, 0.6], [1, 0.2]), right: TUCK },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "synergist", note: "Lifts the front toes to pull the nose up, and the board with the feet in the air.", curve: TUCK, right: scale(TUCK, 0.6, 0.15) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "synergist", note: "Draws the knees and hips up in the tuck.", curve: TUCK },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk through the spring and the landing.", curve: scale(POP, 0.6, 0.3) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Bends the knees to tuck the board up.", curve: scale(TUCK, 0.7, 0.15) },
  ],
);

// The sideslip sinks and sets the edge (t 0.5) to slow, then rises to slide on.
const SET = t([0, 0.5], [0.5, 0.95], [1, 0.5]);

export const heelsideSlip = board(
  "heelside-slip",
  "Heelside sideslip",
  3000,
  { position: [0.4, 1.4, 3.2], target: [0, 0.65, 0] },
  "The beginner's controlled descent: the board across the slope on its heel edge, the rider facing down the hill, sliding straight down. To slow down the rider sinks and sets the edge harder; to slide on, rises a little and lets it flatten.",
  [
    { name: "slide", t0: 0, t1: 0.25 },
    { name: "sink and set the edge", t0: 0.25, t1: 0.6 },
    { name: "rise, slide on", t0: 0.6, t1: 1 },
  ],
  [
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "prime-mover", note: "Lifts the toes to hold the board on its heel edge; harder to slow down.", curve: SET },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "prime-mover", note: "Holds the bent knees as the rider sinks.", curve: SET },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "prime-mover", note: "Holds the knees with the lateralis.", curve: SET },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "synergist", note: "Holds the hips sitting back over the heels.", curve: scale(SET, 0.85, 0.3) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "stabiliser", note: "Steadies the hips and knees in the sit.", curve: scale(SET, 0.6, 0.2) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the trunk from falling back onto the slope.", curve: scale(SET, 0.6, 0.3) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk tall over the heel edge.", curve: FLAT(0.4) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "stabiliser", note: "Holds the arms forward for balance.", curve: FLAT(0.25) },
  ],
);
