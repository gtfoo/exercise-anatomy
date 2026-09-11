import type { CurvePoint, Exercise } from "./types";

// One sit-up from a Mixamo clip, converted bone for bone: lying on the back
// with the knees bent, the trunk curls up to sitting by t = 0.45 and lowers
// again. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const CURL = t([0, 0.4], [0.1, 0.8], [0.25, 1], [0.45, 0.7], [0.6, 0.6], [0.8, 0.8], [1, 0.4]); // hardest lifting the shoulders off, working again lowering
const HIPFLEX = t([0, 0.2], [0.2, 0.5], [0.35, 0.9], [0.45, 0.7], [0.65, 0.6], [0.85, 0.5], [1, 0.2]); // once the trunk is up, the hip flexors finish the sit
const BRACE = t([0, 0.4], [0.3, 0.6], [0.6, 0.55], [1, 0.4]);
const ANCHOR = t([0, 0.4], [0.35, 0.8], [0.5, 0.6], [1, 0.4]); // the feet hold the floor down

export const sitUp: Exercise = {
  slug: "sit-up",
  category: "Core",
  name: "Sit-up",
  durationMs: 2200, // the captured rep at its real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/sit-up.glb" },
  camera: { position: [2.8, 1.4, 1.6], target: [0, 0.35, 0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "sit up", t0: 0, t1: 0.45 },
    { name: "lower", t0: 0.45, t1: 1 },
  ],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Curls the trunk off the floor and lowers it again.", curve: CURL },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Flex the trunk with rectus abdominis.", curve: t([0, 0.3], [0.25, 0.75], [0.45, 0.55], [0.8, 0.6], [1, 0.3]) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace under the movers.", curve: BRACE },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip flexors", role: "prime-mover", note: "Flexes the hips to bring the trunk the rest of the way up to sitting.", curve: HIPFLEX },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip flexors", role: "synergist", note: "Assists hip flexion from the inner thigh.", curve: t([0, 0.15], [0.35, 0.55], [0.65, 0.4], [1, 0.15]) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", role: "stabiliser", note: "Pulls the feet down against the floor to anchor the legs.", curve: ANCHOR },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Lengthened as the back rounds up; controls the lowering.", curve: t([0, 0.15], [0.45, 0.25], [0.7, 0.35], [1, 0.15]), stretch: t([0, 0.1], [0.3, 0.5], [0.45, 0.7], [0.65, 0.5], [1, 0.1]) },
  ],
};
