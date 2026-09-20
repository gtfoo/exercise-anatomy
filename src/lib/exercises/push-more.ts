import type { CurvePoint, Exercise } from "./types";

// A pike push-up, designed (tools/myo/designed_clip.py) to the form at
// sweat.com/exercises/pike-push-up, the owner's reference of 2026-09-19:
// hands a little wider than the shoulders, feet behind on the balls, hips
// high in an inverted V; bend the elbows to lower the forehead toward the
// floor, rocking onto the toes (t 0.5), and press back up. Activation is
// qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const PRESS = t([0, 0.4], [0.25, 0.65], [0.5, 0.9], [0.6, 1], [0.8, 0.7], [1, 0.4]); // lowered under control, hardest pressing out of the bottom

export const pikePushUp: Exercise = {
  slug: "pike-push-up",
  category: "Push and pull",
  name: "Pike push-up",
  durationMs: 3200,
  anchor: "free",
  native: { clip: "/models/clips/pike-push-up.glb" },
  camera: { position: [3.2, 1.3, 1.8], target: [0, 0.5, -0.3] },
  disclaimer:
    "After the form at sweat.com: an inverted V, the forehead lowered toward the floor and pressed back.",
  phases: [
    { name: "lower", t0: 0, t1: 0.5 },
    { name: "press", t0: 0.5, t1: 1 },
  ],
  muscles: [
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulders", role: "prime-mover", note: "Presses the body back up: with the trunk near vertical this is an overhead press.", curve: PRESS },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulders", role: "prime-mover", note: "Presses with the anterior fibres.", curve: t([0, 0.35], [0.5, 0.8], [0.6, 0.9], [0.8, 0.6], [1, 0.35]) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "prime-mover", note: "Straightens the elbows out of the bottom.", curve: t([0, 0.4], [0.5, 0.85], [0.6, 1], [0.8, 0.7], [1, 0.4]) },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arms", role: "prime-mover", note: "Elbow extension with the long head.", curve: t([0, 0.4], [0.5, 0.85], [0.6, 1], [0.8, 0.7], [1, 0.4]) },
    { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arms", role: "synergist", note: "Deep elbow extension.", curve: t([0, 0.35], [0.5, 0.8], [0.6, 0.9], [0.8, 0.6], [1, 0.35]) },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulders", role: "synergist", note: "Rotates the shoulder blades up as the arms press overhead.", curve: t([0, 0.4], [0.5, 0.7], [0.6, 0.8], [1, 0.4]) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulders", role: "synergist", note: "Upward rotation with the trapezius; steadies the blades on the hands.", curve: t([0, 0.5], [0.5, 0.75], [0.6, 0.85], [1, 0.5]) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "synergist", note: "Its upper fibres help the press.", curve: t([0, 0.3], [0.5, 0.55], [0.6, 0.6], [1, 0.3]) },
    { id: "supraspinatus", name: "Supraspinatus", group: "Shoulders", role: "stabiliser", note: "Seats the shoulders under load.", curve: t([0, 0.4], [0.5, 0.6], [1, 0.4]) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Arms", role: "stabiliser", note: "Grip the floor.", curve: t([0, 0.5], [0.5, 0.65], [1, 0.5]) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the pike: the hips folded and high.", curve: t([0, 0.6], [0.5, 0.7], [1, 0.6]) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Trunk", role: "stabiliser", note: "Hip flexors hold the fold; the knees locked.", curve: t([0, 0.55], [1, 0.55]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Legs", role: "stabiliser", note: "Lengthened in the pike.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.7], [1, 0.7]) },
    { id: "semitendinosus", name: "Semitendinosus", group: "Legs", role: "stabiliser", note: "Lengthened with biceps femoris.", curve: t([0, 0.1], [1, 0.1]), stretch: t([0, 0.7], [1, 0.7]) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "stabiliser", note: "On the balls of the feet, rocking forward at the bottom.", curve: t([0, 0.5], [0.5, 0.7], [1, 0.5]) },
  ],
};
