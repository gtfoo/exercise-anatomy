import type { CurvePoint, Exercise } from "./types";

// One pike walk from a Mixamo clip, converted bone for bone: from a straight
// arm plank the feet walk in toward the hands until the body is folded into
// a pike (t = 0.46), then walk back out. The hamstrings and calves are on
// stretch at the pike; the shoulders carry more of the weight the higher
// the hips go. Activation is qualitative.

const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PIKE = 0.46;
const SHOULDER = t([0, 0.5], [0.25, 0.7], [PIKE, 0.9], [0.7, 0.7], [1, 0.5]); // more weight over the hands as the hips rise
const FOLD = t([0, 0.4], [0.2, 0.7], [PIKE, 0.9], [0.7, 0.7], [1, 0.4]); // the hip flexors and abs pull the hips up and hold the fold
const STEP = t([0, 0.3], [0.1, 0.6], [0.2, 0.5], [0.3, 0.6], [0.4, 0.5], [PIKE, 0.3], [0.55, 0.6], [0.65, 0.5], [0.75, 0.6], [0.85, 0.5], [1, 0.3]); // walking the feet
const LONG = t([0, 0.1], [0.2, 0.4], [PIKE, 0.9], [0.7, 0.4], [1, 0.1]); // on stretch at the fold
const BRACE = t([0, 0.5], [PIKE, 0.65], [1, 0.5]);

export const pikeWalk: Exercise = {
  slug: "pike-walk",
  category: "Push and pull",
  name: "Pike walk",
  durationMs: 6500, // the captured rep at its real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/pike-walk.glb" },
  camera: { position: [3.2, 1.4, 1.2], target: [0, 0.5, -0.2] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "walk in", t0: 0, t1: PIKE },
    { name: "walk out", t0: PIKE, t1: 1 },
  ],
  muscles: [
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Carries the weight over the hands; the more inverted the body, the more it works.", curve: SHOULDER },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", curve: scaled(SHOULDER, 0.8) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Shoulder", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", curve: scaled(SHOULDER, 0.5) },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "synergist", note: "Shoulder support as the arms come overhead in the pike.", curve: SHOULDER },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "synergist", note: "Rotates the shoulder blades up as the arms go overhead.", curve: SHOULDER },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "synergist", note: "Keeps the elbows locked under the load.", curve: SHOULDER },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "synergist", note: "Straightens the elbow with the long head.", curve: SHOULDER },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "synergist", note: "Deep elbow extensor, working in every press and lockout.", curve: SHOULDER },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "stabiliser", note: "Steadies the arms under the shoulders in the plank.", curve: t([0, 0.5], [PIKE, 0.35], [1, 0.5]) },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", role: "stabiliser", note: "Pulls the shoulder blade forward and down under the pectoralis major.", curve: scaled(t([0, 0.5], [PIKE, 0.35], [1, 0.5]), 0.6) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Hold the wrists as the hands take the weight.", curve: SHOULDER },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", curve: scaled(SHOULDER, 0.6) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Folds the trunk and lifts the hips into the pike.", curve: FOLD },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Fold the trunk with rectus abdominis.", curve: FOLD },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace and rotate the trunk with the external obliques, fibres the other way.", curve: FOLD },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace through the whole walk.", curve: BRACE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip flexors", role: "prime-mover", note: "Flexes the hips to walk the feet in and hold the fold.", curve: FOLD },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip flexors", role: "synergist", note: "Hip flexion from the inner thigh.", curve: STEP },
    { id: "pectineus", name: "Pectineus", group: "Hip flexors", role: "synergist", note: "Adducts and flexes the hip with adductor longus.", curve: scaled(STEP, 0.8) },
    { id: "gracilis", name: "Gracilis", group: "Hip flexors", role: "synergist", note: "Adducts the hip along the inner thigh.", curve: scaled(STEP, 0.7) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "synergist", note: "Lifts each foot to step it.", curve: STEP },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Lower leg", role: "stabiliser", note: "Steady the ankle from the outside against tibialis anterior.", curve: scaled(STEP, 0.8) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "stabiliser", note: "On stretch behind the straight legs in the fold.", curve: t([0, 0.2], [1, 0.2]), stretch: LONG },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "stabiliser", note: "On stretch in the fold.", curve: t([0, 0.2], [1, 0.2]), stretch: LONG },
    { id: "semimembranosus", name: "Semimembranosus", group: "Hamstrings", role: "stabiliser", note: "On stretch in the fold.", curve: t([0, 0.2], [1, 0.2]), stretch: LONG },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "stabiliser", note: "Lengthened as the heels press toward the floor in the pike.", curve: t([0, 0.25], [1, 0.25]), stretch: LONG },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "stabiliser", note: "Lengthened with the medial head.", curve: t([0, 0.25], [1, 0.25]), stretch: LONG },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Lengthened with the arms overhead relative to the trunk; steadies the shoulders.", curve: t([0, 0.3], [PIKE, 0.4], [1, 0.3]), stretch: t([0, 0.1], [PIKE, 0.6], [1, 0.1]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the back long as the body folds at the hips, not the spine.", curve: BRACE },
  ],
};
