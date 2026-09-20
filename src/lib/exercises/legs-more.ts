import type { CurvePoint, Exercise } from "./types";

// A single-leg Romanian deadlift with a knee-up, designed
// (tools/myo/designed_clip.py) to the form at
// sweat.com/exercises/single-leg-romanian-deadlift-knee-up, the owner's
// reference of 2026-09-19: standing on the left leg with its knee softly bent,
// hinge until the trunk is level with the right leg extended behind and the
// arms reaching in front (t 0.35); stand back up on the left leg and draw the
// right knee to the chest (0.78); lower it without touching down. The left
// leg works the hinge; the right leg's hip flexors work the knee-up.
// Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const HINGE = t([0, 0.3], [0.2, 0.6], [0.35, 1], [0.5, 0.9], [0.62, 0.5], [0.78, 0.4], [1, 0.3]); // the standing leg: loaded in the hinge and driving out of it
const LONG = t([0, 0.05], [0.35, 0.95], [0.5, 0.5], [0.62, 0.05], [1, 0.05]); // on stretch at the bottom
const KNEE = t([0, 0.3], [0.35, 0.5], [0.62, 0.5], [0.78, 1], [0.9, 0.6], [1, 0.3]); // the free leg's hip flexors

export const singleLegRdlKneeUp: Exercise = {
  slug: "single-leg-rdl-knee-up",
  category: "Legs and hips",
  name: "Single-leg RDL and knee-up",
  durationMs: 4400,
  anchor: "free",
  native: { clip: "/models/clips/single-leg-rdl-knee-up.glb" },
  camera: { position: [3.2, 1.4, 1.8], target: [0, 0.8, 0] },
  disclaimer:
    "Standing on the left leg, hinge with the right leg behind and the arms in front, stand and bring the right knee up.",
  phases: [
    { name: "hinge", t0: 0, t1: 0.35 },
    { name: "stand", t0: 0.35, t1: 0.62 },
    { name: "knee up", t0: 0.62, t1: 0.78 },
    { name: "lower", t0: 0.78, t1: 1 },
  ],
  muscles: [
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Standing leg", role: "prime-mover", note: "Left: extends the hip to stand out of the hinge. Right: holds the rear leg level in the hinge.", curve: HINGE, right: t([0, 0.2], [0.35, 0.7], [0.62, 0.2], [1, 0.2]) },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Standing leg", role: "prime-mover", note: "Left: loaded on stretch at the bottom, drives the hip back up. Right: holds the rear leg up.", curve: HINGE, right: t([0, 0.2], [0.35, 0.6], [0.62, 0.2], [1, 0.2]), stretch: LONG },
    { id: "semitendinosus", name: "Semitendinosus", group: "Standing leg", role: "prime-mover", note: "Left: with biceps femoris.", curve: HINGE, right: t([0, 0.2], [0.35, 0.55], [0.62, 0.2], [1, 0.2]), stretch: LONG },
    { id: "semimembranosus", name: "Semimembranosus", group: "Standing leg", role: "synergist", note: "Left: with the other hamstrings.", curve: HINGE, right: t([0, 0.2], [0.35, 0.5], [0.62, 0.2], [1, 0.2]), stretch: LONG },
    { id: "gluteus-medius", name: "Gluteus medius", group: "Standing leg", role: "synergist", note: "Left: keeps the pelvis level on one foot the whole time.", curve: t([0, 0.6], [0.35, 0.85], [0.62, 0.7], [0.78, 0.8], [1, 0.6]), right: t([0, 0.2], [1, 0.2]) },
    { id: "gluteus-minimus", name: "Gluteus minimus", group: "Standing leg", role: "synergist", note: "Left: pelvis control with the medius.", curve: t([0, 0.5], [0.35, 0.7], [0.78, 0.65], [1, 0.5]), right: t([0, 0.15], [1, 0.15]) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Standing leg", role: "stabiliser", note: "Left: holds the soft knee angle.", curve: t([0, 0.4], [0.35, 0.55], [1, 0.4]), right: t([0, 0.2], [0.35, 0.4], [0.62, 0.2], [1, 0.2]) },
    { id: "soleus", name: "Soleus", group: "Standing leg", role: "stabiliser", note: "Left: ankle balance.", curve: t([0, 0.5], [0.35, 0.7], [1, 0.5]), right: t([0, 0.1], [1, 0.1]) },
    { id: "fibularis", name: "Fibularis longus and brevis", group: "Standing leg", role: "stabiliser", note: "Left: balances the ankle from the outside.", curve: t([0, 0.5], [0.35, 0.7], [1, 0.5]), right: t([0, 0.1], [1, 0.1]) },
    { id: "tibialis-anterior", name: "Tibialis anterior", group: "Standing leg", role: "stabiliser", note: "Left: ankle balance from the front. Right: points the toes to the floor in the hinge.", curve: t([0, 0.5], [0.35, 0.65], [1, 0.5]), right: t([0, 0.2], [0.35, 0.4], [1, 0.2]) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Free leg", role: "prime-mover", note: "Right: lifts the knee to the chest.", curve: t([0, 0.3], [1, 0.3]), right: KNEE },
    { id: "pectineus", name: "Pectineus", group: "Free leg", role: "synergist", note: "Right: hip flexion with rectus femoris.", curve: t([0, 0.2], [1, 0.2]), right: t([0, 0.25], [0.62, 0.4], [0.78, 0.85], [0.9, 0.5], [1, 0.25]) },
    { id: "adductor-longus", name: "Adductor longus", group: "Free leg", role: "synergist", note: "Right: hip flexion with the knee-up.", curve: t([0, 0.2], [1, 0.2]), right: t([0, 0.2], [0.62, 0.35], [0.78, 0.7], [0.9, 0.4], [1, 0.2]) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Holds the back flat as the trunk goes to level.", curve: t([0, 0.4], [0.35, 1], [0.62, 0.5], [0.78, 0.5], [1, 0.4]) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Keep the trunk from turning on one leg.", curve: t([0, 0.4], [0.35, 0.6], [0.78, 0.6], [1, 0.4]) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Arms", role: "synergist", note: "Holds the arms reaching in front in the hinge.", curve: t([0, 0.2], [0.35, 0.7], [0.62, 0.2], [1, 0.2]) },
  ],
};
