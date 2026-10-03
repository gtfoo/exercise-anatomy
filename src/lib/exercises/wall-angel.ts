import type { CurvePoint, Exercise } from "./types";

// A wall angel, designed (tools/myo/designed_clip.py): back, hips and head
// against the wall, the feet a hand-span out with soft knees; the arms slide
// from a V overhead (t 0) down to a W with the elbows just below the
// shoulders (0.4), hold, and slide back up (1). The backs of the arms stay on
// the wall. Both sides alike. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// Shapes over the rep: V (0, 1) and W (0.4-0.6).
const W = (v: number, low: number) => t([0, low], [0.4, v], [0.6, v], [1, low]); // strongest holding the W
const V = (v: number, low: number) => t([0, v], [0.4, low], [0.6, low], [1, v]); // strongest overhead
const FLAT = (v: number) => t([0, v], [1, v]);

export const wallAngel: Exercise = {
  slug: "wall-angel",
  category: "Stretches",
  name: "Wall angel",
  durationMs: 6000,
  anchor: "free",
  native: { clip: "/models/clips/wall-angel.glb" },
  scenery: { kind: "backwall", z: -0.131, height: 2.2 }, // designed_clip.py wall_angel_geometry
  camera: { position: [1.6, 1.4, 2.8], target: [0, 1.15, -0.05] },
  disclaimer: "Back, hips and head against the wall, the feet a hand-span out: the arms slide from a V overhead down to a W with the elbows just below the shoulders, hold, and slide back up, the backs of the arms on the wall.",
  phases: [
    { name: "slide down", t0: 0, t1: 0.4 },
    { name: "hold the W", t0: 0.4, t1: 0.6 },
    { name: "slide up", t0: 0.6, t1: 1 },
  ],
  muscles: [
    { id: "lower-trapezius", name: "Lower trapezius", group: "Back", role: "prime-mover", note: "Draws the shoulder blades down and turns them up as the arms rise: hardest in the V overhead.", curve: V(0.85, 0.55) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "prime-mover", note: "Pulls the shoulder blades together to keep the elbows on the wall: hardest holding the W.", curve: W(0.85, 0.55) },
    { id: "rhomboids", name: "Rhomboids", group: "Back", role: "synergist", note: "Retraction with the middle trapezius.", curve: W(0.75, 0.45) },
    { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", role: "prime-mover", note: "Turns the arm out so the forearms lie back against the wall.", curve: W(0.85, 0.6) },
    { id: "teres-minor", name: "Teres minor", group: "Shoulder", role: "synergist", note: "External rotation with infraspinatus.", curve: W(0.75, 0.5) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", role: "synergist", note: "Holds the elbows back on the wall.", curve: W(0.7, 0.45) },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "synergist", note: "Holds the arms up and out against gravity, more as they rise.", curve: V(0.6, 0.5) },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "stabiliser", note: "Seats the shoulder as the arm rises.", curve: V(0.5, 0.4) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Turns the shoulder blades up so the arms can reach overhead.", curve: V(0.75, 0.35) },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Back", role: "synergist", note: "Upward rotation with the serratus; it should not shrug the shoulders to the ears.", curve: V(0.55, 0.3) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "stabiliser", note: "Lengthened across the front of the shoulder with the arms turned out and back.", curve: FLAT(0.1), stretch: W(0.75, 0.6) },
    { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", role: "stabiliser", note: "Lengthened as the shoulder blades tip back, most overhead.", curve: FLAT(0.1), stretch: V(0.75, 0.5) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Lengthened with the arms overhead.", curve: FLAT(0.15), stretch: V(0.7, 0.2) },
    { id: "teres-major", name: "Teres major", group: "Back", role: "stabiliser", note: "Lengthened with the lat overhead.", curve: FLAT(0.1), stretch: V(0.6, 0.2) },
    { id: "subscapularis", name: "Subscapularis", group: "Shoulder", role: "stabiliser", note: "Lengthened by the arm's outward turn.", curve: FLAT(0.15), stretch: W(0.7, 0.4) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the ribs down and the lower back from arching off the wall, most with the arms overhead.", curve: V(0.55, 0.4) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace holding the trunk to the wall.", curve: FLAT(0.45) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Its upper fibres hold the upper back against the wall.", curve: FLAT(0.4) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Soft knees, the hips resting on the wall.", curve: FLAT(0.2) },
  ],
};
