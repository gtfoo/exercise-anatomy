import type { CurvePoint, Exercise } from "./types";

// Cat-cow, designed (tools/myo/designed_clip.py): on hands and knees, from a
// neutral back into cow (t 0.25: tail up, belly down, chest and gaze up),
// back through neutral, into cat (0.75: pelvis tucked, back rounded, chin to
// chest), and back. The trunk muscles alternate between working and being
// lengthened. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// A value at neutral (0, 0.5, 1), in cow (0.25) and in cat (0.75).
const flow = (neutral: number, cow: number, cat: number): CurvePoint[] => t([0, neutral], [0.25, cow], [0.5, neutral], [0.75, cat], [1, neutral]);

export const catCow: Exercise = {
  slug: "cat-cow",
  category: "Yoga",
  name: "Cat-cow",
  durationMs: 7000,
  anchor: "free",
  native: { clip: "/models/clips/cat-cow.glb" },
  camera: { position: [3.0, 1.0, 0.6], target: [0, 0.5, 0.15] },
  disclaimer: "Marjaryasana-Bitilasana, on hands and knees: cow lifts the tail and chest and drops the belly, cat tucks the pelvis and rounds the back with the chin to the chest.",
  phases: [
    { name: "into cow", t0: 0, t1: 0.25 },
    { name: "back to neutral", t0: 0.25, t1: 0.5 },
    { name: "into cat", t0: 0.5, t1: 0.75 },
    { name: "back to neutral", t0: 0.75, t1: 1 },
  ],
  muscles: [
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Arches the back into cow; lengthened along the spine in cat.", curve: flow(0.3, 0.75, 0.15), stretch: flow(0.05, 0.05, 0.7) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "prime-mover", note: "Rounds the back and tucks the pelvis into cat; lengthened as the belly drops in cow.", curve: flow(0.2, 0.15, 0.75), stretch: flow(0.05, 0.7, 0.05) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Help round the trunk in cat; lengthened in cow.", curve: flow(0.2, 0.15, 0.55), stretch: flow(0.05, 0.5, 0.05) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Flexion with the external obliques.", curve: flow(0.2, 0.15, 0.5), stretch: flow(0.05, 0.45, 0.05) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Draws the belly in, most in cat.", curve: flow(0.3, 0.25, 0.6) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips", role: "synergist", note: "Tucks the pelvis under in cat.", curve: flow(0.2, 0.15, 0.5) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulders", role: "synergist", note: "Pushes the floor away and spreads the shoulder blades as the upper back rounds in cat.", curve: flow(0.4, 0.35, 0.75) },
    { id: "rhomboids", name: "Rhomboids", group: "Shoulders", role: "stabiliser", note: "Draw the shoulder blades together as the chest opens in cow; lengthened in cat.", curve: flow(0.3, 0.45, 0.15), stretch: flow(0.05, 0.05, 0.5) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Shoulders", role: "stabiliser", note: "With the rhomboids.", curve: flow(0.3, 0.45, 0.15), stretch: flow(0.05, 0.05, 0.5) },
    { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulders", role: "synergist", note: "Lifts the head and gaze in cow.", curve: flow(0.25, 0.5, 0.15) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Shoulders", role: "stabiliser", note: "Lengthened across the chest as it opens in cow.", curve: flow(0.15, 0.15, 0.2), stretch: flow(0.05, 0.35, 0.05) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "stabiliser", note: "Holds the arms straight under the shoulders.", curve: flow(0.35, 0.35, 0.4) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "stabiliser", note: "Keeps the elbows straight.", curve: flow(0.35, 0.35, 0.4) },
  ],
};
