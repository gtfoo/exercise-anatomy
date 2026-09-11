import type { CurvePoint, Exercise } from "./types";

// A standard strict pull-up, designed (src/lib/kinematics/pull-up.ts, mirrored
// by tools/myo/designed_clip.py): body straight, hands over the shoulders,
// up and down. No free capture of one exists (Mixamo has none; CMU's, subject
// 1 trial 12, is on a low playground bar with the knees tucked and a swing,
// tried on 2026-09-10 and rejected by the owner).
//
// Qualitative curves. The MyoFullBody estimate (src/lib/activation/
// pull-up-myofullbody.json) had every arm and shoulder muscle at maximum
// through the whole pull, the generic model being too weak for an 84 kg
// pull-up; it was shown for a day and pulled. See TASKS.md before wiring it
// back in. Curves are shaped to role and to the pull (0-0.42) / lower
// (0.48-1) parts of the rep: concentric work peaks mid-pull, the lowering
// half carries a lower, steadier eccentric load.

const PRIME: CurvePoint[] = [[0, 0.2], [0.15, 0.6], [0.3, 0.95], [0.45, 1], [0.55, 0.85], [0.7, 0.6], [0.85, 0.45], [1, 0.2]];
const HELPER: CurvePoint[] = [[0, 0.15], [0.2, 0.45], [0.4, 0.65], [0.5, 0.6], [0.7, 0.4], [1, 0.15]];
const SCAPULAR: CurvePoint[] = [[0, 0.2], [0.1, 0.5], [0.3, 0.7], [0.5, 0.75], [0.7, 0.5], [0.9, 0.3], [1, 0.2]];
const STEADY: CurvePoint[] = [[0, 0.3], [0.5, 0.4], [1, 0.3]];
const GRIP: CurvePoint[] = [[0, 0.5], [0.3, 0.7], [0.5, 0.7], [0.8, 0.6], [1, 0.5]];

const baseline: Exercise = {
  slug: "pull-up",
  category: "Push and pull",
  name: "Pull-up",
  durationMs: 3600,
  anchor: "hands",
  barHeight: 2.3,
  // The designed movement converted onto the rigged figure's skeleton with the wrists placed on the bar.
  native: { clip: "/models/clips/pull-up.glb" },
  // Straight-on front view: the body hangs at the middle of the bar, and any angled view puts a post
  // between the camera and the body or shifts the body toward one end by perspective.
  camera: { position: [0, 2.0, 3.9], target: [0, 1.55, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured: no free motion capture of a strict pull-up exists. The musculoskeletal model used to estimate the squat has no arm or shoulder muscles, so nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "pull", t0: 0, t1: 0.45 },
    { name: "top", t0: 0.45, t1: 0.55 },
    { name: "lower", t0: 0.55, t1: 1 },
  ],
  muscles: [
    // Back
    {
      id: "latissimus-dorsi",
      name: "Latissimus dorsi",
      group: "Back",
      role: "prime-mover",
      note: "Pulls the upper arm down and back from overhead — the movement the pull-up is. Loaded most through the middle of the pull.",
      curve: PRIME,
    },
    {
      id: "teres-major",
      name: "Teres major",
      group: "Back",
      role: "synergist",
      note: "Works alongside the lat, pulling the arm down and in from overhead.",
      curve: HELPER,
    },
    {
      id: "lower-trapezius",
      name: "Lower trapezius",
      group: "Back",
      role: "synergist",
      note: "Depresses the shoulder blade: the initial shrug-down at the bottom and holding the blades down through the pull.",
      curve: SCAPULAR,
    },
    {
      id: "middle-trapezius",
      name: "Middle trapezius",
      group: "Back",
      role: "synergist",
      note: "Retracts the shoulder blade toward the spine as the chest rises to the bar.",
      curve: SCAPULAR,
    },
    {
      id: "rhomboids",
      name: "Rhomboids",
      group: "Back",
      role: "synergist",
      note: "Retract and stabilise the shoulder blades with the middle trapezius.",
      curve: SCAPULAR,
    },

    // Shoulder
    {
      id: "posterior-deltoid",
      name: "Posterior deltoid",
      group: "Shoulder",
      role: "synergist",
      note: "Extends the shoulder, helping bring the elbow down and back.",
      curve: HELPER,
    },
    {
      id: "infraspinatus",
      name: "Infraspinatus",
      group: "Shoulder",
      role: "stabiliser",
      note: "Rotator cuff. Keeps the humeral head centred in the socket under the hanging load.",
      curve: STEADY,
    },
    {
      id: "teres-minor",
      name: "Teres minor",
      group: "Shoulder",
      role: "stabiliser",
      note: "Rotator cuff, with infraspinatus.",
      curve: STEADY,
    },

    // Arm
    {
      id: "biceps-brachii",
      name: "Biceps brachii",
      group: "Arm",
      role: "prime-mover",
      note: "Flexes the elbow. Contributes most with a supinated (chin-up) grip, and plenty with an overhand one.",
      curve: PRIME,
    },
    {
      id: "brachialis",
      name: "Brachialis",
      group: "Arm",
      role: "prime-mover",
      note: "Deep to the biceps, flexes the elbow regardless of grip. Often the harder-working of the two.",
      curve: PRIME,
    },
    {
      id: "brachioradialis",
      name: "Brachioradialis",
      group: "Arm",
      role: "synergist",
      note: "Forearm-side elbow flexor; more involved with a neutral or overhand grip.",
      curve: HELPER,
    },
    {
      id: "triceps-long-head",
      name: "Triceps, long head",
      group: "Arm",
      role: "synergist",
      note: "Crosses the shoulder, so it helps extend and adduct the arm even while the elbow flexes.",
      curve: [[0, 0.1], [0.3, 0.35], [0.5, 0.4], [0.7, 0.3], [1, 0.1]],
    },

    // Chest and forearm
    {
      id: "pectoralis-major",
      name: "Pectoralis major",
      group: "Chest",
      role: "synergist",
      note: "The lower fibres help pull the arm down from overhead in the first half of the pull.",
      curve: [[0, 0.15], [0.2, 0.45], [0.35, 0.5], [0.5, 0.35], [0.75, 0.25], [1, 0.15]],
    },
    {
      id: "forearm-flexors",
      name: "Forearm flexors",
      group: "Forearm",
      role: "stabiliser",
      note: "Grip. Isometric for the whole rep, and often what gives out first.",
      curve: GRIP,
    },

    // Trunk
    {
      id: "rectus-abdominis",
      name: "Rectus abdominis",
      group: "Trunk",
      role: "stabiliser",
      note: "Holds the hollow-body position against the pull into extension.",
      curve: STEADY,
    },
    {
      id: "external-obliques",
      name: "External obliques",
      group: "Trunk",
      role: "stabiliser",
      note: "Brace the trunk with the abdominals and resist swinging.",
      curve: STEADY,
    },
  ],
};

export const pullUp: Exercise = baseline;
