import type { CurvePoint, Exercise } from "./types";
import { shifted } from "./types";

// One stroke cycle (a pull with each arm) from CMU subject 126 trial 1, mimed lying on a bench, frames 217-297
// (src/lib/motion/backstroke-3d.json, owner's request 2026-11-14). The arms, shoulders, trunk and its roll are as
// captured; on the bench the legs hung off its end and the head was lifted, so the head follows the trunk and the
// legs are a designed six-beat flutter kick, and each arm is opened a little from the side as it finishes its pull
// (this figure is wider at the hips than the swimmer): tools/mocap/backstroke_kick.py. Timed to the LEFT arm:
// at t = 0 it is straight up in its recovery, it enters the water behind the head at about 0.12, pulls to the thigh
// by about 0.6 and lifts out to recover; the right arm is half a cycle behind. Activation is qualitative: no water,
// no propulsive forces.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const scaled = (c: readonly CurvePoint[], k: number): CurvePoint[] => c.map(([x, y]) => [x, y * k] as CurvePoint);
const PULL = t([0, 0.3], [0.12, 0.45], [0.25, 0.85], [0.45, 1], [0.58, 0.75], [0.68, 0.3], [1, 0.3]);
const PUSH = t([0, 0.2], [0.3, 0.3], [0.45, 0.75], [0.58, 1], [0.66, 0.35], [1, 0.2]);
const RECOVER = t([0, 0.6], [0.12, 0.35], [0.6, 0.25], [0.7, 0.7], [0.85, 0.75], [1, 0.6]);
// Six beats a cycle, the legs in opposition: three upbeats each.
const KICK = t([0, 0.4], [0.08, 0.85], [0.17, 0.4], [0.25, 0.4], [0.42, 0.85], [0.5, 0.4], [0.58, 0.4], [0.75, 0.85], [0.83, 0.4], [1, 0.4]);
const STEADY = (v: number) => t([0, v], [1, v]);

export const backstroke: Exercise = {
  slug: "backstroke",
  category: "Swimming",
  name: "Backstroke swimming",
  durationMs: 2667, // the captured cycle at its real tempo
  anchor: "free",
  environment: "water",
  waterLevel: 0.95,
  camera: { position: [3.6, 2.4, 1.6], target: [0, 0.9, -0.05] },
  native: { clip: "/models/clips/backstroke.glb" },
  credit: "the CMU Graphics Lab Motion Capture Database (subject 126, trial 1: the arms and trunk; the flutter kick is designed)",
  disclaimer: "Captured on land, lying on a bench, not in water; the kick is designed.",
  phases: [
    { name: "left recovery, right pull", t0: 0, t1: 0.12 },
    { name: "left catch", t0: 0.12, t1: 0.25 },
    { name: "left pull", t0: 0.25, t1: 0.45 },
    { name: "left push", t0: 0.45, t1: 0.62 },
    { name: "left recovery", t0: 0.62, t1: 1 },
  ],
  muscles: [
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "prime-mover", note: "The engine of the pull: brings the arm from overhead down to the thigh through the water.", curve: PULL, right: shifted(PULL, 0.5) },
    { id: "teres-major", name: "Teres major", group: "Back", role: "synergist", note: "Pulls with the latissimus through the middle of the stroke.", curve: scaled(PULL, 0.85), right: scaled(shifted(PULL, 0.5), 0.85) },
    { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "synergist", note: "Its lower fibres help draw the arm down from overhead in the first half of the pull.", curve: scaled(PULL, 0.7), right: scaled(shifted(PULL, 0.5), 0.7) },
    { id: "triceps-long-head", name: "Triceps, long head", group: "Arms", role: "synergist", note: "Straightens the elbow to push the water down past the thigh at the end of the pull.", curve: PUSH, right: shifted(PUSH, 0.5) },
    { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arms", role: "synergist", note: "The push's elbow extension with the long head.", curve: scaled(PUSH, 0.85), right: scaled(shifted(PUSH, 0.5), 0.85) },
    { id: "subscapularis", name: "Subscapularis", group: "Rotator cuff", role: "stabiliser", note: "Turns the upper arm in and holds its head in the socket through the pull.", curve: scaled(PULL, 0.6), right: scaled(shifted(PULL, 0.5), 0.6) },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "synergist", note: "Lifts the straight arm out of the water and up over the shoulder.", curve: RECOVER, right: shifted(RECOVER, 0.5) },
    { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "synergist", note: "Carries the recovering arm up and back to the entry behind the head.", curve: scaled(RECOVER, 0.85), right: scaled(shifted(RECOVER, 0.5), 0.85) },
    { id: "infraspinatus", name: "Infraspinatus", group: "Rotator cuff", role: "stabiliser", note: "Steadies the shoulder as the arm turns over the top of its recovery.", curve: scaled(RECOVER, 0.6), right: scaled(shifted(RECOVER, 0.5), 0.6) },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "synergist", note: "Roll the body onto the pulling side with each stroke.", curve: scaled(PULL, 0.6), right: scaled(shifted(PULL, 0.5), 0.6) },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Holds the hips up near the surface and the body long.", curve: STEADY(0.45) },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Keeps the body straight along the water.", curve: STEADY(0.35) },
    { id: "rectus-femoris", name: "Rectus femoris", group: "Legs", role: "prime-mover", note: "Drives each upbeat of the kick, the propulsive one on the back: the hip lifts and the knee snaps straight.", curve: KICK, right: shifted(KICK, 1 / 6) },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "synergist", note: "Straightens the knee in the upbeat.", curve: scaled(KICK, 0.8), right: scaled(shifted(KICK, 1 / 6), 0.8) },
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "synergist", note: "Takes the leg back down in the downbeat and keeps the hips high.", curve: scaled(shifted(KICK, 1 / 12), 0.7), right: scaled(shifted(KICK, 1 / 4), 0.7) },
    { id: "gastrocnemius-medial", name: "Gastrocnemius, medial head", group: "Legs", role: "stabiliser", note: "Holds the toes pointed, the foot in line with the shin.", curve: STEADY(0.4) },
  ],
};
