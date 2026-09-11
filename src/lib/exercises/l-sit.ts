import type { CurvePoint, Exercise } from "./types";

// A designed L-sit on parallel bars (tools/myo/designed_clip.py): straight
// support with the arms locked and the feet off the floor, legs raised to
// horizontal with the knees locked and toes pointed, a hold, and back down.
// Designed because no free capture exists. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Hip flexors and abdominals: hardest at the top of the raise and through the hold.
const RAISE = t([0, 0.25], [0.15, 0.55], [0.42, 1], [0.62, 0.95], [0.8, 0.6], [0.95, 0.3], [1, 0.25]);
// Support muscles: shoulders depressed and elbows locked the whole time, more in the L.
const SUPPORT = t([0, 0.6], [0.42, 0.85], [0.62, 0.85], [1, 0.6]);
const KNEE = t([0, 0.3], [0.42, 0.85], [0.62, 0.85], [1, 0.3]);
const BRACE = t([0, 0.4], [0.42, 0.7], [0.62, 0.7], [1, 0.4]);

export const lSit: Exercise = {
  slug: "l-sit",
  category: "Core",
  name: "L-sit",
  durationMs: 4000,
  anchor: "bars",
  barHeight: 0.985, // the rest wrist height plus the 0.15 m the support lifts the body, minus the palm
  barSpacing: 0.27, // the rest wrist x
  native: { clip: "/models/clips/l-sit.glb" },
  camera: { position: [2.9, 1.3, 2.3], target: [0, 0.85, 0.25] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of an L-sit exists. The iliopsoas, the deepest hip flexor, is not modelled in the atlas. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "support", t0: 0, t1: 0.08 },
    { name: "raise", t0: 0.08, t1: 0.42 },
    { name: "hold", t0: 0.42, t1: 0.62 },
    { name: "lower", t0: 0.62, t1: 1 },
  ],
  muscles: [
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip flexors", role: "prime-mover", note: "Flexes the hip to lift the legs and keeps the knee straight at the same time.", curve: RAISE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Tilts the pelvis back and holds the legs up against their own weight.", curve: RAISE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace under the obliques.", curve: BRACE },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "synergist", note: "Locks the knee so the leg stays straight.", curve: KNEE },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", role: "synergist", note: "Locks the knee with the other vasti.", curve: KNEE },
    { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", role: "synergist", note: "Deep knee extensor.", curve: KNEE },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Support", role: "prime-mover", note: "Presses the shoulders down on the bars: the support itself.", curve: SUPPORT },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Support", role: "synergist", note: "Depresses the shoulder blades with the lats.", curve: SUPPORT },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Support", role: "synergist", note: "Helps hold the body up between the bars.", curve: SUPPORT },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Support", role: "stabiliser", note: "Pulls the shoulder blade forward and down under the pectoralis major.", curve: scaled(SUPPORT, 0.6) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Support", role: "synergist", note: "Keeps the elbows locked.", curve: SUPPORT },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Support", role: "synergist", note: "Straightens the elbow with the long head.", curve: SUPPORT },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Support", role: "synergist", note: "Deep elbow extensor, working in every press and lockout.", curve: SUPPORT },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Support", role: "stabiliser", note: "Steadies the shoulder in the support.", curve: BRACE },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Support", role: "stabiliser", note: "Grip the bars.", curve: BRACE },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Support", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(BRACE, 0.6) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the spine long as the trunk leans back.", curve: BRACE },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip flexors", role: "synergist", note: "Assists hip flexion from the hanging position.", curve: RAISE },
    { id: "pectineus", name: "Pectineus", group: "Hip flexors", role: "synergist", note: "Adducts and flexes the hip with adductor longus.", curve: scaled(RAISE, 0.8) },
    { id: "gracilis", name: "Gracilis", group: "Hip flexors", role: "synergist", note: "Adducts the hip along the inner thigh.", curve: scaled(RAISE, 0.7) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Leg", role: "stabiliser", note: "Steadies the ankle; the calves point the toes.", curve: BRACE },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Leg", role: "stabiliser", note: "Steady the ankle from the outside against tibialis anterior.", curve: scaled(BRACE, 0.8) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Leg", role: "synergist", note: "Points the toes.", curve: KNEE },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Leg", role: "synergist", note: "Points the toes.", curve: KNEE },
  ],
};
