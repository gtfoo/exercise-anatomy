import type { Pose } from "./types";

const DEG = Math.PI / 180;

// Hanging and top positions of a strict pull-up. Plausible joint ranges, not a
// captured individual: at the hang the arms are nearly overhead (172°) with a
// soft elbow; at the top the upper arms are down and slightly forward, the
// elbows flexed ~135°, which puts the bar at collarbone height with the chin
// over it. Legs hang slightly behind and bend a little on the way up.
// A standard strict pull-up: body straight, hands over the shoulders, no kip.
// The legs stay nearly straight (a slight knee bend at the top is normal).
const HANG = { armFwd: 175, elbow: 5, trunk: 2, thigh: -2, knee: 4 };
const TOP = { armFwd: 38, elbow: 138, trunk: -6, thigh: -8, knee: 18 };
const POINT = 35; // plantarflexion of the hanging feet

const mix = (a: number, b: number, f: number) => (a + (b - a) * f) * DEG;

/** Designed pull-up: t = 0 hanging, 0.5 chin over the bar, 1 hanging. */
export function pullUpPose(t: number): Pose {
  const up = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
  const thigh = mix(HANG.thigh, TOP.thigh, up);
  const shin = thigh + mix(HANG.knee, TOP.knee, up); // knee flexion = shin - thigh
  return {
    shin,
    thigh,
    trunk: mix(HANG.trunk, TOP.trunk, up),
    armFwd: mix(HANG.armFwd, TOP.armFwd, up),
    elbow: mix(HANG.elbow, TOP.elbow, up),
    foot: shin + POINT * DEG,
  };
}
