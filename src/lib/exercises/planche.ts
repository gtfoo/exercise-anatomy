import type { CurvePoint, Exercise } from "./types";

// A full planche, designed (tools/myo/designed_clip.py) because no free
// capture exists: from a crouch with the hands planted, the shoulders lean
// forward past the hands and the feet leave the floor into a tuck planche
// (to t 0.22), the legs extend to the full horizontal planche (to 0.42),
// held to 0.68, then back through the tuck to the crouch. Activation is
// qualitative: a straight-arm push held against the whole body's lever.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const LEAN = t([0, 0.3], [0.12, 0.6], [0.22, 0.85], [0.42, 1], [0.68, 1], [0.85, 0.85], [0.95, 0.5], [1, 0.3]); // the shoulders and chest carry the lean
const ARM = t([0, 0.35], [0.22, 0.75], [0.42, 0.95], [0.68, 0.95], [0.85, 0.75], [1, 0.35]); // straight-arm strength
const BRACE = t([0, 0.3], [0.22, 0.75], [0.42, 0.95], [0.68, 0.95], [0.85, 0.75], [1, 0.3]); // hollow body
const LINE = t([0, 0.15], [0.22, 0.4], [0.42, 0.95], [0.68, 0.95], [0.85, 0.4], [1, 0.15]); // the legs held out straight behind
const TUCK = t([0, 0.2], [0.22, 0.8], [0.42, 0.4], [0.68, 0.4], [0.85, 0.8], [1, 0.2]); // the knees pulled in
const LATS_LONG = t([0, 0.05], [0.22, 0.4], [0.42, 0.7], [0.68, 0.7], [0.85, 0.4], [1, 0.05]); // the leaning shoulder opens the lat

export const planche: Exercise = {
  slug: "planche",
  category: "Push and pull",
  name: "Planche",
  durationMs: 7000,
  anchor: "free",
  native: { clip: "/models/clips/planche.glb" },
  camera: { position: [3.2, 1.0, 1.4], target: [0, 0.4, -0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of a planche exists. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "lean into tuck", t0: 0, t1: 0.22 },
    { name: "extend", t0: 0.22, t1: 0.42 },
    { name: "hold", t0: 0.42, t1: 0.68 },
    { name: "tuck back", t0: 0.68, t1: 0.85 },
    { name: "crouch", t0: 0.85, t1: 1 },
  ],
  muscles: [
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Holds the whole body on shoulders leant far past the hands: the planche's muscle.", curve: LEAN },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "Pulls the arms toward the body against the lean.", curve: LEAN },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "prime-mover", note: "Protracts and pins the shoulder blades: the rounded upper back of a planche.", curve: LEAN },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", role: "synergist", note: "Protracts with the serratus.", curve: t([0, 0.2], [0.42, 0.7], [0.68, 0.7], [1, 0.2]) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Arm", role: "synergist", note: "Helps hold the arm forward against the lean.", curve: t([0, 0.2], [0.42, 0.6], [0.68, 0.6], [1, 0.2]) },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "stabiliser", note: "Straight-arm strength: holds the elbow from hyperextending under the lean.", curve: ARM },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "stabiliser", note: "Locks the elbow.", curve: ARM },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "stabiliser", note: "Locks the elbow with the long head.", curve: ARM },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "stabiliser", note: "Deep elbow lock.", curve: ARM },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Press the fingers into the floor to balance the lean.", curve: ARM },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the extended wrists.", curve: ARM },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Steadies the shoulder; lengthened by the lean.", curve: t([0, 0.2], [0.42, 0.45], [0.68, 0.45], [1, 0.2]), stretch: LATS_LONG },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Holds the hollow body and keeps the hips from sagging.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Brace the trunk.", curve: BRACE },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace with the external obliques.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the spine straight in the line.", curve: t([0, 0.2], [0.42, 0.5], [0.68, 0.5], [1, 0.2]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "prime-mover", note: "Holds the straight legs up level with the trunk.", curve: LINE },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hip", role: "synergist", note: "Hip extension holding the legs out.", curve: LINE },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hip", role: "synergist", note: "Hip extension with biceps femoris.", curve: LINE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Legs", role: "synergist", note: "Pulls the knees in for the tuck; locks them straight in the full planche.", curve: t([0, 0.2], [0.22, 0.8], [0.42, 0.6], [0.68, 0.6], [0.85, 0.8], [1, 0.2]) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Locks the knees straight.", curve: LINE },
    { id: "adductor-longus", name: "Adductor longus", group: "Legs", role: "stabiliser", note: "Squeezes the legs together.", curve: LINE },
    { id: "pectineus", name: "Pectineus", group: "Legs", role: "synergist", note: "Hip flexion into the tuck.", curve: TUCK },
  ],
};
