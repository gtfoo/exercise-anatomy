import type { CurvePoint, Exercise } from "./types";

// One breaststroke cycle from a Mixamo clip (converted bone for bone onto
// the rig): arms sweep out and in, then recover forward; legs draw up, kick
// out and squeeze together, then glide. Timed to the arms: t = 0 is the
// glide with the arms extended and the legs drawn. Activation is
// qualitative: no water, no propulsive forces, so nothing can be estimated.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PULL = t([0, 0.3], [0.1, 0.7], [0.25, 1], [0.4, 0.6], [0.55, 0.3], [0.8, 0.25], [1, 0.3]);
const RECOVER = t([0, 0.25], [0.3, 0.3], [0.45, 0.75], [0.6, 0.85], [0.75, 0.4], [1, 0.25]);
const KICK = t([0, 0.25], [0.35, 0.3], [0.5, 0.7], [0.62, 1], [0.75, 0.7], [0.9, 0.35], [1, 0.25]);
const DRAW = t([0, 0.3], [0.2, 0.3], [0.35, 0.7], [0.5, 0.8], [0.6, 0.4], [1, 0.3]);
const BRACE = t([0, 0.35], [0.3, 0.55], [0.6, 0.55], [1, 0.35]);

export const breaststroke: Exercise = {
  slug: "breaststroke",
  category: "Swimming",
  name: "Breaststroke swimming",
  durationMs: 2000, // the captured cycle at its real tempo
  anchor: "free",
  environment: "water",
  waterLevel: 0.62, // the clip puts the hips at 0.55-0.57 m; the back breaks the surface
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/breaststroke.glb" },
  camera: { position: [2.6, 1.9, 2.4], target: [0, 0.55, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip performed out of water; no hydrodynamic forces are modelled, so nothing here is estimated or measured. Educational illustration, not coaching or medical advice.",
  phases: [
    { name: "pull", t0: 0, t1: 0.4 },
    { name: "recover", t0: 0.4, t1: 0.6 },
    { name: "kick", t0: 0.6, t1: 0.8 },
    { name: "glide", t0: 0.8, t1: 1 },
  ],
  muscles: [
    { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "prime-mover", note: "Sweeps the arms in against the water.", curve: PULL },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Arms", role: "stabiliser", note: "Pulls the shoulder blade forward and down under the pectoralis major.", curve: scaled(PULL, 0.6) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Arms", role: "prime-mover", note: "Pulls the arms down and back through the outsweep.", curve: PULL },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arms", role: "synergist", note: "Bends the elbows as the hands come together.", curve: PULL },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "synergist", note: "Drives the arms forward on the recovery.", curve: RECOVER },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Arms", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(RECOVER, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Arms", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(RECOVER, 0.5) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "synergist", note: "Straightens the arms into the glide.", curve: RECOVER },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arms", role: "synergist", note: "Straightens the elbow with the long head.", curve: RECOVER },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arms", role: "synergist", note: "Deep elbow extensor, working in every press and lockout.", curve: RECOVER },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arms", role: "stabiliser", note: "Hold the hands as paddles.", curve: PULL },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arms", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(PULL, 0.6) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Kick", role: "prime-mover", note: "Squeezes the legs together: the propulsive part of the kick.", curve: KICK },
    { id: "adductor-longus", name: "Adductor longus", group: "Kick", role: "prime-mover", note: "Squeezes the legs together with adductor magnus.", curve: KICK },
    { id: "pectineus", name: "Pectineus", group: "Kick", role: "synergist", note: "Adducts and flexes the hip with adductor longus.", curve: scaled(KICK, 0.8) },
    { id: "gracilis", name: "Gracilis", group: "Kick", role: "synergist", note: "Adducts the hip along the inner thigh.", curve: scaled(KICK, 0.7) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Kick", role: "prime-mover", note: "Extends the hips as the legs snap back.", curve: KICK },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Kick", role: "synergist", note: "Straightens the knees through the kick.", curve: KICK },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Kick", role: "synergist", note: "Straightens the knees with the other vasti.", curve: KICK },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Kick", role: "synergist", note: "Draws the heels up toward the hips before the kick.", curve: DRAW },
    { id: "semitendinosus", name: "Semitendinosus", group: "Kick", role: "synergist", note: "Draws the heels up with biceps femoris.", curve: DRAW },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Kick", role: "stabiliser", note: "Points the feet at the end of the kick.", curve: KICK },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Kick", role: "stabiliser", note: "Points the feet at the end of the kick.", curve: KICK },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Kick", role: "synergist", note: "Flexes the feet to catch the water on the outsweep.", curve: DRAW },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Kick", role: "stabiliser", note: "Steady the ankle from the outside against tibialis anterior.", curve: scaled(DRAW, 0.8) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "synergist", note: "Lifts the chest for the breath as the arms sweep in.", curve: PULL },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Brings the body back flat for the glide.", curve: BRACE },
  ],
};
