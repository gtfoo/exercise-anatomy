import type { CurvePoint, Exercise } from "./types";

// The kayak forward stroke, designed (tools/myo/designed_clip.py's
// kayak_sample, owner's request 2026-10-08): sitting in a sit-in kayak, legs
// forward with the knees a little bent, a double-bladed paddle. One cycle is a
// stroke on the right then one on the left. Each is the same: the trunk wound
// so that side's shoulder is forward, the blade put in by the feet (catch) with
// the top hand at about eye level, the trunk unwinding to draw it back to the
// hip (pull), the blade lifted out at the hip (exit) as the shaft rolls over to
// the other side. The power comes from the trunk's rotation and the pulling
// side's back, with the top arm pushing forward across; the foot on the
// stroke's side presses its peg. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// The pulling side through its stroke: right 0-0.27, left 0.5-0.77.
const PULL_R = t([0, 0.55], [0.08, 0.95], [0.18, 1], [0.27, 0.45], [0.35, 0.15], [0.65, 0.15], [0.9, 0.2], [1, 0.55]);
const PULL_L = t([0, 0.15], [0.15, 0.15], [0.4, 0.2], [0.5, 0.55], [0.58, 0.95], [0.68, 1], [0.77, 0.45], [0.85, 0.15], [1, 0.15]);
// The top arm pushing forward while the other side pulls, lighter.
const scale = (c: CurvePoint[], k: number, floor: number): CurvePoint[] => c.map(([x, v]) => [x, Math.max(floor, v * k)]);
const PUSH_R = scale(PULL_L, 0.75, 0.15); // the right hand on top during the left stroke
const PUSH_L = scale(PULL_R, 0.75, 0.15);
const FLAT = (v: number) => t([0, v], [1, v]);
const BOTH = (v: number, dip: number) => t([0, v], [0.27, dip], [0.5, v], [0.77, dip], [1, v]); // eases at each exit

export const kayaking: Exercise = {
  slug: "kayaking",
  category: "Paddle sports",
  name: "Kayaking",
  durationMs: 1800,
  anchor: "free",
  props: "kayak-paddle",
  native: { clip: "/models/clips/kayaking.glb" },
  scenery: { kind: "kayak", seat: 0.05, water: 0.2 }, // designed_clip.py's KAYAK_SEAT and KAYAK_WATER
  camera: { position: [2.2, 1.5, 2.6], target: [0, 0.5, 0.2] },
  disclaimer:
    "The forward stroke in a sit-in kayak: the trunk winds so one shoulder is forward, the blade goes in by the feet with the top hand at eye level, the trunk unwinds to draw it back to the hip, and it comes out as the shaft rolls over to the other side. A stroke on the right, then one on the left.",
  phases: [
    { name: "catch, right", t0: 0, t1: 0.06 },
    { name: "pull, right", t0: 0.06, t1: 0.27 },
    { name: "exit and recover", t0: 0.27, t1: 0.5 },
    { name: "catch, left", t0: 0.5, t1: 0.56 },
    { name: "pull, left", t0: 0.56, t1: 0.77 },
    { name: "exit and recover", t0: 0.77, t1: 1 },
  ],
  muscles: [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Pulling arm", role: "prime-mover", note: "Draws the lower arm, and the blade, back from the feet to the hip on its side.", curve: PULL_L, right: PULL_R },
    { id: "teres-major", name: "Teres major", group: "Pulling arm", role: "synergist", note: "Pulls the arm back and down with the latissimus.", curve: scale(PULL_L, 0.8, 0.1), right: scale(PULL_R, 0.8, 0.1) },
    { id: "posterior-deltoid", name: "Posterior deltoid", group: "Pulling arm", role: "synergist", note: "Carries the lower arm back past the body toward the exit.", curve: scale(PULL_L, 0.75, 0.15), right: scale(PULL_R, 0.75, 0.15) },
    { id: "rhomboids", name: "Rhomboids", group: "Pulling arm", role: "synergist", note: "Draw the pulling side's shoulder blade back as the stroke ends.", curve: t([0, 0.2], [0.55, 0.3], [0.72, 0.75], [0.8, 0.35], [1, 0.2]), right: t([0, 0.3], [0.22, 0.75], [0.3, 0.35], [0.5, 0.2], [1, 0.3]) },
    { id: "middle-trapezius", name: "Middle trapezius", group: "Pulling arm", role: "synergist", note: "Retraction with the rhomboids.", curve: t([0, 0.2], [0.55, 0.3], [0.72, 0.7], [0.8, 0.35], [1, 0.2]), right: t([0, 0.3], [0.22, 0.7], [0.3, 0.35], [0.5, 0.2], [1, 0.3]) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Top arm", role: "synergist", note: "Straightens the top arm as it pushes forward across the boat.", curve: PUSH_L, right: PUSH_R },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Top arm", role: "synergist", note: "Drives the top hand forward at eye level.", curve: PUSH_L, right: PUSH_R },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Top arm", role: "synergist", note: "Pushes the top hand forward and across.", curve: scale(PUSH_L, 0.8, 0.15), right: scale(PUSH_R, 0.8, 0.15) },
    { id: "serratus-anterior", name: "Serratus anterior", group: "Top arm", role: "synergist", note: "Carries the top shoulder blade forward with the push, and the reach of the lower arm to the catch.", curve: scale(PUSH_L, 0.8, 0.25), right: scale(PUSH_R, 0.8, 0.25) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "prime-mover", note: "Unwind the trunk through the stroke: the right one turns it to the left in the right stroke, the left one to the right in the left stroke.", curve: PULL_L, right: PULL_R },
    { id: "internal-obliques", name: "Internal obliques", group: "Trunk", role: "prime-mover", note: "Turn the trunk with the opposite external oblique: the left in the right stroke, the right in the left.", curve: PULL_R, right: PULL_L },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the trunk leaning a little forward against each pull.", curve: BOTH(0.45, 0.3) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the back tall in the seat as the trunk turns.", curve: FLAT(0.45) },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Grip", role: "stabiliser", note: "Hold the shaft, firmest in the lower hand through its pull.", curve: scale(PULL_L, 0.6, 0.35), right: scale(PULL_R, 0.6, 0.35) },
    { id: "forearm-extensors", name: "Forearm extensors", group: "Grip", role: "stabiliser", note: "Keep the wrists straight on the shaft.", curve: FLAT(0.3), right: FLAT(0.3) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Legs", role: "stabiliser", note: "Holds the legs up and forward to the foot pegs.", curve: FLAT(0.3), right: FLAT(0.3) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "synergist", note: "The foot on the stroke's side presses its peg, which helps the hips turn with the trunk.", curve: scale(PULL_L, 0.6, 0.15), right: scale(PULL_R, 0.6, 0.15) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "synergist", note: "Drives the leg pressing the peg.", curve: scale(PULL_L, 0.5, 0.1), right: scale(PULL_R, 0.5, 0.1) },
  ],
};
