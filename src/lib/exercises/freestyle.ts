import type { CurvePoint, Exercise } from "./types";
import type { MotionClip3D } from "@/lib/kinematics/types";
import motion3d from "@/lib/motion/freestyle-3d.json";

// One stroke cycle (two arm pulls) from CMU subject 126 trial 12, captured on
// land with the subject miming the stroke. Timed to the LEFT arm: t = 0 is its
// entry in front, the pull runs to ~0.45, recovery over the water follows; the
// right arm is half a cycle out of phase. Activation is qualitative: no water,
// no propulsive forces, so nothing can be estimated.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Left-arm timing; the right arm is shifted by half a cycle, and both sides are one mesh, so curves are summed roughly.
const PULLER = t([0, 0.35], [0.15, 0.85], [0.3, 1], [0.45, 0.7], [0.55, 0.45], [0.65, 0.75], [0.8, 0.95], [0.9, 0.6], [1, 0.35]);
const FINISH = t([0, 0.2], [0.25, 0.55], [0.4, 0.85], [0.5, 0.4], [0.7, 0.55], [0.85, 0.85], [1, 0.2]);
const RECOVERY = t([0, 0.2], [0.45, 0.35], [0.55, 0.7], [0.7, 0.8], [0.85, 0.5], [1, 0.2]);
const CUFF = t([0, 0.4], [0.5, 0.5], [1, 0.4]);
const KICK = t([0, 0.55], [0.12, 0.8], [0.25, 0.55], [0.37, 0.8], [0.5, 0.55], [0.62, 0.8], [0.75, 0.55], [0.87, 0.8], [1, 0.55]);
const BRACE = t([0, 0.35], [0.5, 0.45], [1, 0.35]);

export const freestyle: Exercise = {
  slug: "freestyle",
  name: "Freestyle swimming",
  durationMs: 2230, // the captured cycle at its real tempo
  anchor: "free",
  // The clip's root sits at the figure's standing pelvis height; lifted so the back breaks the surface.
  rootOffset: [0, 0.08, 0],
  environment: "water",
  waterLevel: 0.92,
  camera: { position: [2.6, 2.2, 2.4], target: [0, 0.95, 0] },
  motion3d: motion3d as unknown as MotionClip3D,
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement was captured on land, not in water, and no hydrodynamic forces are modelled, so nothing here is estimated or measured. Educational illustration, not coaching or medical advice.",
  phases: [
    { name: "catch", t0: 0, t1: 0.15 },
    { name: "pull", t0: 0.15, t1: 0.35 },
    { name: "push", t0: 0.35, t1: 0.5 },
    { name: "recovery", t0: 0.5, t1: 1 },
  ],
  muscles: [
    // Back and shoulder
    {
      id: "latissimus-dorsi",
      name: "Latissimus dorsi",
      group: "Back",
      role: "prime-mover",
      note: "The engine of the pull: brings the arm from extended in front to the hip against the water.",
      curve: PULLER,
    },
    {
      id: "teres-major",
      name: "Teres major",
      group: "Back",
      role: "synergist",
      note: "Pulls with the lat through the middle of the stroke.",
      curve: PULLER,
    },
    {
      id: "pectoralis-major",
      name: "Pectoralis major",
      group: "Chest",
      role: "prime-mover",
      note: "Drives the early pull, sweeping the arm down and in from the catch.",
      curve: PULLER,
    },
    {
      id: "posterior-deltoid",
      name: "Posterior deltoid",
      group: "Shoulder",
      role: "synergist",
      note: "Lifts the elbow out of the water and leads the recovery.",
      curve: RECOVERY,
    },
    {
      id: "middle-trapezius",
      name: "Middle trapezius",
      group: "Shoulder",
      role: "synergist",
      note: "Holds the shoulder blade back through the recovery and re-entry.",
      curve: RECOVERY,
    },
    {
      id: "rhomboids",
      name: "Rhomboids",
      group: "Shoulder",
      role: "synergist",
      note: "Retract the shoulder blade during recovery.",
      curve: RECOVERY,
    },
    {
      id: "infraspinatus",
      name: "Infraspinatus",
      group: "Shoulder",
      role: "stabiliser",
      note: "Rotator cuff. Keeps the humeral head centred through the full circle of the stroke; the muscle most swimmers injure.",
      curve: CUFF,
    },
    {
      id: "teres-minor",
      name: "Teres minor",
      group: "Shoulder",
      role: "stabiliser",
      note: "Rotator cuff, with infraspinatus.",
      curve: CUFF,
    },

    // Arm
    {
      id: "triceps-long-head",
      name: "Triceps, long head",
      group: "Arm",
      role: "prime-mover",
      note: "Finishes the stroke: extends the elbow to push water past the hip.",
      curve: FINISH,
    },
    {
      id: "biceps-brachii",
      name: "Biceps brachii",
      group: "Arm",
      role: "synergist",
      note: "Bends the elbow into the high-elbow catch, then relaxes.",
      curve: t([0, 0.55], [0.1, 0.75], [0.25, 0.5], [0.5, 0.25], [0.6, 0.5], [0.75, 0.6], [1, 0.55]),
    },
    {
      id: "forearm-flexors",
      name: "Forearm flexors",
      group: "Arm",
      role: "stabiliser",
      note: "Hold the hand as a paddle against the water.",
      curve: PULLER,
    },

    // Trunk
    {
      id: "rectus-abdominis",
      name: "Rectus abdominis",
      group: "Trunk",
      role: "stabiliser",
      note: "Keeps the body long and level between the strokes.",
      curve: BRACE,
    },
    {
      id: "external-obliques",
      name: "External obliques",
      group: "Trunk",
      role: "synergist",
      note: "Drive and control the body roll from one side to the other.",
      curve: t([0, 0.6], [0.25, 0.4], [0.5, 0.6], [0.75, 0.4], [1, 0.6]),
    },
    {
      id: "erector-spinae",
      name: "Erector spinae",
      group: "Trunk",
      role: "stabiliser",
      note: "Hold the spine straight against the kick and the roll.",
      curve: BRACE,
    },

    // Kick
    {
      id: "gluteus-maximus",
      name: "Gluteus maximus",
      group: "Kick",
      role: "prime-mover",
      note: "Powers the upbeat of the flutter kick with the hamstrings.",
      curve: KICK,
    },
    {
      id: "rectus-femoris",
      name: "Rectus femoris",
      group: "Kick",
      role: "prime-mover",
      note: "Flexes the hip for the downbeat, the propulsive half of the kick.",
      curve: KICK,
    },
    {
      id: "biceps-femoris",
      name: "Biceps femoris",
      group: "Kick",
      role: "synergist",
      note: "Extends the hip on the upbeat and controls the knee.",
      curve: KICK,
    },
    {
      id: "gastrocnemius-medial",
      name: "Gastrocnemius",
      group: "Kick",
      role: "stabiliser",
      note: "Points the foot so the kick pushes water rather than dragging.",
      curve: BRACE,
    },
  ],
};
