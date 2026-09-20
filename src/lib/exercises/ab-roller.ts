import type { CurvePoint, Exercise } from "./types";

// A kneeling ab wheel rollout, designed (tools/myo/designed_clip.py) to the
// form at sweat.com/exercises/ab-roller (the owner's reference, 2026-09-19):
// kneeling with a hand on each handle below the chest, lean forward with a
// neutral spine so the wheel rolls out (t 0-0.5), pull it back with the
// abdominals (0.5-1). The knees stay planted; the wheel is drawn between the
// hands. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Hardest at full reach (t 0.5) and through the pull back.
const REACH = t([0, 0.3], [0.25, 0.6], [0.5, 1], [0.7, 0.9], [0.9, 0.5], [1, 0.3]);
const HOLD = (v: number) => t([0, v], [1, v]);

export const abRoller: Exercise = {
  slug: "ab-roller",
  category: "Core",
  name: "Ab roller",
  durationMs: 4000,
  anchor: "free",
  props: "wheel",
  native: { clip: "/models/clips/ab-roller.glb" },
  camera: { position: [3.0, 1.3, 1.8], target: [0, 0.45, 0.5] },
  disclaimer:
    "After the form at sweat.com: kneeling, rolled out as far as a neutral spine allows and pulled back.",
  phases: [
    { name: "roll out", t0: 0, t1: 0.5 },
    { name: "pull back", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Holds the spine from arching as the lever lengthens, then pulls the wheel back: the exercise.", curve: REACH },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Brace with rectus abdominis against the arch.", curve: t([0, 0.3], [0.5, 0.85], [0.7, 0.8], [1, 0.3]) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Brace with the external obliques.", curve: t([0, 0.3], [0.5, 0.75], [0.7, 0.7], [1, 0.3]) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "synergist", note: "Deep brace holding the ribs to the pelvis.", curve: t([0, 0.4], [0.5, 0.85], [0.7, 0.8], [1, 0.4]) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Pull", role: "prime-mover", note: "Pulls the arms back down toward the hips to bring the wheel in.", curve: t([0, 0.3], [0.4, 0.5], [0.5, 0.8], [0.65, 1], [0.85, 0.6], [1, 0.3]) },
    { id: "teres-major", name: "Teres major", group: "Pull", role: "synergist", note: "Shoulder extension with the lat.", curve: t([0, 0.25], [0.5, 0.6], [0.65, 0.8], [0.85, 0.5], [1, 0.25]) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "synergist", note: "Keeps the elbows straight and, crossing the shoulder, helps pull the arms back.", curve: t([0, 0.4], [0.5, 0.8], [0.65, 0.85], [1, 0.4]) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "synergist", note: "Its lower fibres pull the arms down and in on the way back; open at full reach.", curve: t([0, 0.3], [0.5, 0.5], [0.65, 0.75], [1, 0.3]), stretch: t([0, 0.05], [0.5, 0.5], [1, 0.05]) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "stabiliser", note: "Steadies the shoulders; lengthened with the arms overhead at full reach.", curve: t([0, 0.4], [0.5, 0.5], [1, 0.4]), stretch: t([0, 0.05], [0.5, 0.6], [1, 0.05]) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Arms", role: "stabiliser", note: "Pins the shoulder blades as the arms reach.", curve: t([0, 0.4], [0.5, 0.7], [1, 0.4]) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arms", role: "stabiliser", note: "Grip the handles.", curve: HOLD(0.55) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "synergist", note: "Hip flexors hold the hips from sagging at full reach and help fold them on the way back.", curve: t([0, 0.3], [0.5, 0.8], [0.7, 0.7], [1, 0.3]) },
    { id: "pectineus", name: "Pectineus", group: "Hips", role: "synergist", note: "Hip flexion with rectus femoris.", curve: t([0, 0.25], [0.5, 0.65], [0.7, 0.6], [1, 0.25]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips", role: "stabiliser", note: "Squeezed to keep the pelvis tucked.", curve: t([0, 0.35], [0.5, 0.5], [1, 0.35]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the spine neutral, working against the abdominals, not arching.", curve: t([0, 0.35], [0.5, 0.5], [1, 0.35]) },
  ],
};
