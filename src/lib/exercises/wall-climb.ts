import type { CurvePoint, Exercise } from "./types";

// A wall climb up and back down from two Mixamo clips played in sequence:
// from the ground, pull, step and climb 1.2 m up the wall, then reverse it.
// The clips climb in place, so the wall is drawn as a face with climbing
// holds wherever a hand or foot rests still in the capture. The first half is the
// climb (concentric), the second the descent (the same muscles, lowering).
// Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Read off the clips: the right hand holds and pulls while the left reaches (t 0-0.15) with the left foot pushing
// and the right foot stepping up; then the left hand pulls, the right reaches, the right foot pushes and the left
// steps (t 0.27-0.42). Coming down, the left arm and right leg lower the body first (t 0.6-0.75), then the right
// arm and left leg (t 0.83-1). Each side's muscles follow its own limb.
const LEFT_PULL = t([0, 0.3], [0.1, 0.35], [0.2, 0.6], [0.3, 1], [0.4, 0.85], [0.5, 0.4], [0.6, 0.7], [0.72, 0.8], [0.8, 0.4], [1, 0.3]);
const RIGHT_PULL = t([0, 0.85], [0.08, 1], [0.17, 0.6], [0.3, 0.35], [0.5, 0.3], [0.7, 0.35], [0.85, 0.75], [0.95, 0.85], [1, 0.85]);
const LEFT_PUSH = t([0, 0.2], [0.2, 0.4], [0.3, 0.85], [0.38, 0.9], [0.45, 0.4], [0.6, 0.6], [0.7, 0.5], [1, 0.2]); // pressing down on its hold while the other arm reaches
const RIGHT_PUSH = t([0, 0.8], [0.06, 0.9], [0.15, 0.4], [0.5, 0.2], [0.8, 0.5], [0.9, 0.7], [1, 0.8]);
const LEFT_LEG = t([0, 0.85], [0.1, 1], [0.18, 0.5], [0.27, 0.3], [0.4, 0.35], [0.5, 0.3], [0.7, 0.35], [0.85, 0.8], [0.95, 0.9], [1, 0.85]); // the foot on its hold driving up, later lowering
const RIGHT_LEG = t([0, 0.3], [0.15, 0.35], [0.27, 0.7], [0.35, 1], [0.42, 0.8], [0.5, 0.4], [0.6, 0.8], [0.72, 0.85], [0.8, 0.4], [1, 0.3]);
const LEFT_STEP = t([0, 0.2], [0.25, 0.3], [0.32, 0.9], [0.4, 0.6], [0.5, 0.2], [1, 0.2]); // lifting the knee to the next hold
const RIGHT_STEP = t([0, 0.9], [0.1, 0.7], [0.15, 0.3], [0.9, 0.2], [1, 0.6]);
const LEFT_GRIP = t([0, 0.5], [0.05, 0.4], [0.12, 0.9], [0.3, 1], [0.5, 0.8], [0.75, 0.9], [0.85, 0.7], [0.93, 0.4], [1, 0.5]); // slack only while that hand moves
const RIGHT_GRIP = t([0, 0.95], [0.1, 1], [0.3, 0.9], [0.38, 0.5], [0.47, 0.9], [0.55, 0.9], [0.6, 0.5], [0.7, 0.9], [1, 0.95]);
const BRACE = t([0, 0.5], [0.25, 0.7], [0.5, 0.55], [0.75, 0.7], [1, 0.5]);
// Lengthened: the reaching arm's lat and teres at full stretch overhead (left reaches t 0-0.12, right 0.35-0.47,
// and again reaching down at 0.6-0.67 and 0.87-1); the stepping leg's glutes with the foot placed high and the
// hip deeply flexed (right foot high 0.12-0.3, left 0.4-0.55).
const LEFT_REACH = t([0, 0.8], [0.08, 0.9], [0.15, 0.2], [0.55, 0.1], [0.62, 0.2], [0.87, 0.2], [0.95, 0.8], [1, 0.8]);
const RIGHT_REACH = t([0, 0.1], [0.33, 0.2], [0.42, 0.9], [0.5, 0.4], [0.58, 0.3], [0.65, 0.7], [0.72, 0.2], [1, 0.1]);
const LEFT_HIGH = t([0, 0.1], [0.35, 0.1], [0.42, 0.7], [0.5, 0.8], [0.6, 0.3], [0.7, 0.7], [0.8, 0.2], [1, 0.1]);
const RIGHT_HIGH = t([0, 0.2], [0.1, 0.5], [0.18, 0.85], [0.28, 0.6], [0.4, 0.1], [0.8, 0.1], [0.88, 0.6], [0.95, 0.5], [1, 0.2]);
const side = (l: CurvePoint[], r: CurvePoint[]) => ({ curve: l, right: r });

export const wallClimb: Exercise = {
  slug: "wall-climb",
  category: "Push and pull",
  name: "Wall climb",
  durationMs: 4000, // the two captured clips at their real tempo
  anchor: "free",
  credit: "Mixamo (Adobe)",
  // The face stays behind every contact (the feet push on it at z 0.5, the hands reach over its top at z 0.2), so nothing
  // of the body sits inside the wall. The holds are found from the clip, wherever a hand or foot rests still
  // (NativeFigure's findHolds), each on a volume out from the face.
  scenery: { kind: "wall", height: 3.2, front: 0.58, holds: true },
  native: { clip: "/models/clips/wall-climb.glb" },
  camera: { position: [3.2, 2.2, -2.6], target: [0, 1.6, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is two motion-capture clips, up and then down; the wall and its holds are drawn to where the hands and feet rest, not modelled; each side follows its own limb. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "pull", t0: 0, t1: 0.2 },
    { name: "mantle", t0: 0.2, t1: 0.38 },
    { name: "top", t0: 0.38, t1: 0.55 },
    { name: "lower", t0: 0.55, t1: 0.85 },
    { name: "step down", t0: 0.85, t1: 1 },
  ],
  muscles: [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Pull", role: "prime-mover", note: "Pulls the body up the wall; on stretch when that arm reaches overhead.", ...side(LEFT_PULL, RIGHT_PULL), stretch: LEFT_REACH, stretchRight: RIGHT_REACH },
    { id: "biceps-brachii", name: "Biceps brachii", group: "Pull", role: "prime-mover", note: "Bends the elbows on the pull.", ...side(LEFT_PULL, RIGHT_PULL) },
    { id: "brachialis", name: "Brachialis", group: "Pull", role: "prime-mover", note: "Elbow flexion under the biceps.", ...side(LEFT_PULL, RIGHT_PULL) },
    { id: "brachioradialis", name: "Brachioradialis", group: "Pull", role: "synergist", note: "Elbow flexion in the hanging grip.", ...side(LEFT_PULL, RIGHT_PULL) },
    { id: "teres-major", name: "Teres major", group: "Pull", role: "synergist", note: "Pulls with the lat.", ...side(LEFT_PULL, RIGHT_PULL), stretch: LEFT_REACH, stretchRight: RIGHT_REACH },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Pull", role: "synergist", note: "Draws the arms down and back.", ...side(LEFT_PULL, RIGHT_PULL) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Pull", role: "stabiliser", note: "Grip the holds; a hand only lets go to reach.", ...side(LEFT_GRIP, RIGHT_GRIP) },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Pull", role: "stabiliser", note: "Hold the wrist steady from the back against the flexors' grip.", ...side(LEFT_GRIP, RIGHT_GRIP) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Press", role: "prime-mover", note: "Presses down on its hold while the other arm reaches.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Press", role: "prime-mover", note: "Straightens the elbow with the long head.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Press", role: "prime-mover", note: "Deep elbow extensor, working in every press and lockout.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Press", role: "synergist", note: "Presses down on the hold with the triceps.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Press", role: "stabiliser", note: "Pulls the shoulder blade forward and down under the pectoralis major.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Press", role: "synergist", note: "Presses on the hold with the triceps.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Press", role: "synergist", note: "Pins the shoulder blade to the ribs and pulls it forward as the arm reaches or presses.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "coracobrachialis", name: "Coracobrachialis", group: "Press", role: "stabiliser", note: "Helps lift the arm forward and draws it in to the body.", ...side(LEFT_PUSH, RIGHT_PUSH) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "prime-mover", note: "Straightens the stepping leg to drive up.", ...side(LEFT_LEG, RIGHT_LEG) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Legs", role: "synergist", note: "Lifts the knee to the next foothold.", ...side(LEFT_STEP, RIGHT_STEP) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "prime-mover", note: "Extends the hip as the foot pushes on the wall; on stretch while that foot is placed high.", ...side(LEFT_LEG, RIGHT_LEG), stretch: LEFT_HIGH, stretchRight: RIGHT_HIGH },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "synergist", note: "Pushes off the toes against the wall.", ...side(LEFT_LEG, RIGHT_LEG) },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Legs", role: "synergist", note: "Pushes off the toes against the wall.", ...side(LEFT_LEG, RIGHT_LEG) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the body tight to the wall.", curve: BRACE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the back through the pull and mantle.", curve: BRACE },
  ],
};
