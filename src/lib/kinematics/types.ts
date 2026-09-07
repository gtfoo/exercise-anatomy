/**
 * A body pose as WORLD-space sagittal angles, in radians, +Z forward, Y up.
 * Positive means the segment's top tips forward — except `armFwd`, which is
 * the upper arm's swing forward from hanging straight down.
 *
 * World angles rather than joint angles so a measured pose (motion capture)
 * and a designed one (a joint-angle function) are the same shape.
 */
export type Pose = {
  shin: number;
  thigh: number;
  trunk: number;
  armFwd: number;
};

/** Sampled motion for one rep: `samples[i]` is the pose at t = i / samples.length. Wraps. */
export type MotionClip = {
  source: string;
  /** Who to credit for the capture; shown in the UI. */
  credit?: string;
  fps: number;
  samples: readonly Pose[];
};

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export function poseAt(clip: MotionClip, t: number): Pose {
  const n = clip.samples.length;
  const x = ((t % 1) + 1) % 1 * n;
  const i = Math.floor(x);
  const f = x - i;
  const a = clip.samples[i % n];
  const b = clip.samples[(i + 1) % n];
  return {
    shin: lerp(a.shin, b.shin, f),
    thigh: lerp(a.thigh, b.thigh, f),
    trunk: lerp(a.trunk, b.trunk, f),
    armFwd: lerp(a.armFwd, b.armFwd, f),
  };
}
