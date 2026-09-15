import type { CurvePoint, Exercise } from "./types";

// Surya Namaskar as one continuous designed sequence (tools/myo/designed_clip.py):
// mountain, arms overhead (t 0.08), forward fold (0.18), plank (0.3), cobra
// (0.42), downward dog (0.56), forward fold (0.72), arms overhead (0.84),
// mountain. Each muscle's curve follows the stages it works in. Activation is
// qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;

export const sunSalutation: Exercise = {
  slug: "sun-salutation",
  category: "Yoga",
  name: "Sun salutation",
  durationMs: 14000,
  anchor: "free",
  native: { clip: "/models/clips/sun-salutation.glb" },
  camera: { position: [3.4, 1.3, 1.8], target: [0, 0.7, 0] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The sequence is designed, not captured; where a practitioner steps or jumps between positions the feet slide. Nothing here is estimated or measured. Educational illustration, not training or medical advice. Surya Namaskar.",
  phases: [
    { name: "mountain", t0: 0, t1: 0.05 },
    { name: "arms overhead", t0: 0.05, t1: 0.14 },
    { name: "forward fold", t0: 0.14, t1: 0.25 },
    { name: "plank", t0: 0.25, t1: 0.37 },
    { name: "cobra", t0: 0.37, t1: 0.5 },
    { name: "downward dog", t0: 0.5, t1: 0.65 },
    { name: "forward fold", t0: 0.65, t1: 0.78 },
    { name: "arms overhead", t0: 0.78, t1: 0.92 },
    { name: "mountain", t0: 0.92, t1: 1 },
  ],
  muscles: [
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "prime-mover", note: "Raises the arms overhead, then carries the body in the plank and the dog.", curve: t([0, 0.1], [0.08, 0.6], [0.18, 0.3], [0.3, 0.75], [0.42, 0.5], [0.56, 0.7], [0.72, 0.3], [0.84, 0.6], [1, 0.1]) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "synergist", note: "Straight arms in the plank and the dog; the lift out of cobra.", curve: t([0, 0.1], [0.18, 0.2], [0.3, 0.8], [0.42, 0.6], [0.56, 0.6], [0.72, 0.2], [1, 0.1]) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Arms", role: "synergist", note: "Pins the shoulder blades under the plank and the dog.", curve: t([0, 0.1], [0.3, 0.7], [0.42, 0.4], [0.56, 0.7], [0.72, 0.2], [1, 0.1]) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Arms", role: "synergist", note: "Steadies the arms in the plank; opens across the chest in cobra.", curve: t([0, 0.1], [0.3, 0.5], [0.42, 0.2], [0.56, 0.3], [1, 0.1]), stretch: t([0, 0.05], [0.37, 0.1], [0.42, 0.5], [0.5, 0.1], [1, 0.05]) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Arms", role: "stabiliser", note: "Lengthened with the arms overhead and in the dog.", curve: t([0, 0.2], [1, 0.2]), stretch: t([0, 0.05], [0.08, 0.5], [0.18, 0.2], [0.56, 0.6], [0.72, 0.2], [0.84, 0.5], [1, 0.05]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Lifts the arch in cobra; lengthened in the folds.", curve: t([0, 0.3], [0.18, 0.2], [0.3, 0.5], [0.42, 0.9], [0.56, 0.4], [0.72, 0.2], [0.84, 0.4], [1, 0.3]), stretch: t([0, 0.05], [0.18, 0.6], [0.3, 0.1], [0.72, 0.6], [0.84, 0.05], [1, 0.05]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "synergist", note: "Holds the plank; folds the trunk; lengthened in cobra.", curve: t([0, 0.2], [0.18, 0.5], [0.3, 0.85], [0.42, 0.15], [0.56, 0.4], [0.72, 0.5], [1, 0.2]), stretch: t([0, 0.05], [0.37, 0.1], [0.42, 0.8], [0.5, 0.1], [1, 0.05]) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace, most in the plank.", curve: t([0, 0.3], [0.3, 0.7], [0.42, 0.4], [0.56, 0.5], [1, 0.3]) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips", role: "synergist", note: "Keeps the hips in line in the plank and lifted in cobra.", curve: t([0, 0.2], [0.3, 0.6], [0.42, 0.5], [0.56, 0.3], [1, 0.2]) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Hips", role: "synergist", note: "Locks the knees in the fold and the dog; lengthened in cobra.", curve: t([0, 0.2], [0.18, 0.6], [0.3, 0.5], [0.42, 0.2], [0.56, 0.6], [0.72, 0.6], [1, 0.2]), stretch: t([0, 0.05], [0.37, 0.1], [0.42, 0.5], [0.5, 0.1], [1, 0.05]) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Hips", role: "stabiliser", note: "Straight knees through the plank, the dog and the folds.", curve: t([0, 0.2], [0.18, 0.5], [0.56, 0.5], [0.72, 0.5], [0.92, 0.2], [1, 0.2]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hips", role: "stabiliser", note: "Lengthened in the folds and the dog.", curve: t([0, 0.15], [1, 0.15]), stretch: t([0, 0.05], [0.18, 0.85], [0.3, 0.2], [0.56, 0.85], [0.72, 0.85], [0.84, 0.1], [1, 0.05]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hips", role: "stabiliser", note: "Lengthened with biceps femoris.", curve: t([0, 0.15], [1, 0.15]), stretch: t([0, 0.05], [0.18, 0.85], [0.3, 0.2], [0.56, 0.85], [0.72, 0.85], [0.84, 0.1], [1, 0.05]) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "stabiliser", note: "On the toes in the plank; lengthened in the dog.", curve: t([0, 0.2], [0.3, 0.6], [0.42, 0.3], [0.56, 0.2], [1, 0.2]), stretch: t([0, 0.05], [0.5, 0.1], [0.56, 0.8], [0.65, 0.3], [1, 0.05]) },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Lower leg", role: "stabiliser", note: "With the medial head.", curve: t([0, 0.2], [0.3, 0.6], [0.42, 0.3], [0.56, 0.2], [1, 0.2]), stretch: t([0, 0.05], [0.5, 0.1], [0.56, 0.8], [0.65, 0.3], [1, 0.05]) },
  ],
};
