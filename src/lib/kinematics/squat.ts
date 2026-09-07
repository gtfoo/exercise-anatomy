import type { Pose } from "./types";

const DEG = Math.PI / 180;

// Bottom-position joint angles for a moderately deep bodyweight squat. These are
// plausible joint ranges, not a captured individual; a motion-capture clip on
// the exercise replaces this function entirely. Shoulder flexion is measured
// against the torso, which is itself leaning ~34 degrees forward at the bottom,
// so ~115 is what brings the arms to horizontal in front.
const BOTTOM = { ankle: 28, knee: 112, hip: 118, shoulder: 115 };

/** Designed squat: t = 0 standing, 0.5 bottom, 1 standing. */
export function squatPose(t: number): Pose {
  const depth = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
  const ankle = BOTTOM.ankle * depth * DEG; // dorsiflexion: shin tips forward
  const knee = BOTTOM.knee * depth * DEG; // flexion
  const hip = BOTTOM.hip * depth * DEG; // flexion, torso to thigh
  const shoulder = BOTTOM.shoulder * depth * DEG; // flexion, arm to torso
  const trunk = ankle - knee + hip;
  return {
    shin: ankle,
    thigh: ankle - knee,
    trunk,
    armFwd: shoulder - trunk,
  };
}
