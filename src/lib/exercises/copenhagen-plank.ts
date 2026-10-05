import type { CurvePoint, Exercise } from "./types";

// A Copenhagen plank, designed (tools/myo/designed_clip.py): on the left
// forearm with the right ankle on a bench, the hips lift from the floor into
// one straight line while the bottom leg rises to touch the underside of the
// bench (t 0-0.4), held, and lowered. The top leg's adductors carry the body;
// the bottom leg's lift it. Left and right differ; the curve is the left
// (lower) side, `right` the top. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const HOLD = (v: number) => t([0, Math.min(v, 0.15)], [0.4, v], [0.75, v], [1, Math.min(v, 0.15)]);

export const copenhagenPlank: Exercise = {
  slug: "copenhagen-plank",
  category: "Core",
  name: "Copenhagen plank",
  durationMs: 6000,
  anchor: "free",
  native: { clip: "/models/clips/copenhagen-plank.glb" },
  scenery: { kind: "bench", top: 0.45, length: 0.9, z: 0, x: -0.45 },
  camera: { position: [0.3, 1.2, 3.0], target: [0.3, 0.35, 0] },
  disclaimer: "On the left forearm with the right ankle on a bench: the hips lift into one line and the bottom leg rises to touch the underside of the bench, held, then lowered.",
  phases: [
    { name: "lift", t0: 0, t1: 0.4 },
    { name: "hold", t0: 0.4, t1: 0.75 },
    { name: "lower", t0: 0.75, t1: 1 },
  ],
  muscles: [
    { id: "adductor-longus", name: "Adductor longus", group: "Inner thigh", role: "prime-mover", note: "Right (top leg, on the bench): presses down into the bench and holds the whole body up: the point of the exercise. Left: lifts the bottom leg to the bench.", curve: HOLD(0.75), right: HOLD(0.95) },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Inner thigh", role: "prime-mover", note: "Right: the largest adductor, carrying the body from the bench. Left: lifts the bottom leg.", curve: HOLD(0.6), right: HOLD(0.9) },
    { id: "adductor-brevis", name: "Adductor brevis", group: "Inner thigh", role: "synergist", note: "Adduction with the longus on both legs.", curve: HOLD(0.55), right: HOLD(0.8) },
    { id: "gracilis", name: "Gracilis", group: "Inner thigh", role: "synergist", note: "The long inner-thigh strap, working on both legs, the top one most.", curve: HOLD(0.6), right: HOLD(0.85) },
    { id: "pectineus", name: "Pectineus", group: "Inner thigh", role: "synergist", note: "Adduction at the top of the inner thigh.", curve: HOLD(0.5), right: HOLD(0.7) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Left (lower side): lifts and holds the hips off the floor against gravity. Right: steadies.", curve: HOLD(0.85), right: HOLD(0.45) },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "synergist", note: "Left: side bend with the external obliques.", curve: HOLD(0.75), right: HOLD(0.4) },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace holding the line.", curve: HOLD(0.6) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Keeps the pelvis from tipping forward or back.", curve: HOLD(0.45) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Left: helps the lower side hold the hips up; both keep the spine straight.", curve: HOLD(0.55), right: HOLD(0.4) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips", role: "stabiliser", note: "Keeps the hips extended, in line with the trunk rather than piked.", curve: HOLD(0.4) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Supporting arm", role: "stabiliser", note: "Left: holds the shoulder blade against the ribs over the propping forearm.", curve: HOLD(0.65), right: HOLD(0.2) },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Supporting arm", role: "stabiliser", note: "Left: holds the shoulder over the elbow.", curve: HOLD(0.5), right: HOLD(0.15) },
    { id: "supraspinatus", name: "Supraspinatus", group: "Supporting arm", role: "stabiliser", note: "Left: seats the loaded shoulder.", curve: HOLD(0.5), right: HOLD(0.15) },
    { id: "lower-trapezius", name: "Lower trapezius", group: "Supporting arm", role: "stabiliser", note: "Left: keeps the shoulder from sinking toward the ear.", curve: HOLD(0.55), right: HOLD(0.2) },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Supporting arm", role: "stabiliser", note: "Left: ties the propped shoulder to the pelvis.", curve: HOLD(0.4), right: HOLD(0.2) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Both knees locked straight.", curve: HOLD(0.4) },
  ],
};
