import type { CurvePoint, Exercise } from "./types";
import { shifted } from "./types";

// One sprint stride cycle (both legs) from a Mixamo clip, converted bone for
// bone and played in place. Each leg drives once per cycle, half a cycle
// apart; both sides are one mesh, so the curves carry two peaks. Activation
// is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const TWO = (a: number, b: number): CurvePoint[] => t([0, b], [0.12, a], [0.3, b], [0.5, b], [0.62, a], [0.8, b], [1, b]);
const DRIVE = TWO(1, 0.45); // hip and knee extension at ground contact
const PUSH = TWO(0.95, 0.4); // ankle push-off
const SWING = t([0, 0.5], [0.2, 0.4], [0.35, 0.9], [0.5, 0.5], [0.7, 0.4], [0.85, 0.9], [1, 0.5]); // hip flexors bringing the leg through
const BRACE = t([0, 0.55], [0.5, 0.6], [1, 0.55]);
const ARMS = TWO(0.75, 0.4);

export const sprint: Exercise = {
  slug: "sprint",
  category: "Cardio",
  name: "Sprint",
  durationMs: 570, // the captured stride at its real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/sprint.glb" },
  camera: { position: [2.8, 1.3, 2.2], target: [0, 0.95, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip played in place; ground forces are not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "left drive", t0: 0, t1: 0.5 },
    { name: "right drive", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip", role: "prime-mover", note: "Drives the hip through as the foot strikes.", curve: DRIVE, right: shifted(DRIVE, 0.5) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hip", role: "prime-mover", note: "Extends the hip and pulls the ground back; the sprinter's hamstring.", curve: DRIVE, right: shifted(DRIVE, 0.5) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hip", role: "prime-mover", note: "Hip extension with biceps femoris.", curve: DRIVE, right: shifted(DRIVE, 0.5) },
    { id: "semimembranosus", name: "Semimembranosus", group: "Hip", role: "prime-mover", note: "Hip extension with the other hamstrings.", curve: DRIVE, right: shifted(DRIVE, 0.5) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hip", role: "prime-mover", note: "Flexes the hip to swing the leg through, then extends the knee.", curve: SWING, right: shifted(SWING, 0.5) },
    { id: "adductor-longus", name: "Adductor longus", group: "Hip", role: "synergist", note: "Helps bring the thigh forward on the swing.", curve: SWING, right: shifted(SWING, 0.5) },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Hip", role: "stabiliser", note: "Levels the pelvis on each single-leg stance.", curve: TWO(0.8, 0.35), right: shifted(TWO(0.8, 0.35), 0.5) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Knee", role: "synergist", note: "Straightens the knee through stance.", curve: DRIVE, right: shifted(DRIVE, 0.5) },
    { id: "vastus-medialis", name: "Vastus medialis", group: "Knee", role: "synergist", note: "Knee extension with the other vasti.", curve: DRIVE, right: shifted(DRIVE, 0.5) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Ankle", role: "prime-mover", note: "The push-off from the ball of the foot.", curve: PUSH, right: shifted(PUSH, 0.5) },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Ankle", role: "prime-mover", note: "Push-off with the medial head.", curve: PUSH, right: shifted(PUSH, 0.5) },
    { id: "soleus", name: "Soleus", group: "Ankle", role: "synergist", note: "Adds to the push-off and stiffens the ankle at contact.", curve: PUSH, right: shifted(PUSH, 0.5) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Ankle", role: "synergist", note: "Lifts the toes clear on the swing.", curve: SWING, right: shifted(SWING, 0.5) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the trunk from folding under the leg drive.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Resist the twist of the arm and leg swing.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Hold the trunk tall.", curve: BRACE },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "synergist", note: "Drives the arm forward.", curve: ARMS, right: shifted(ARMS, 0.5) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Arms", role: "synergist", note: "Drives the arm back.", curve: ARMS, right: shifted(ARMS, 0.5) },
  ],
};
