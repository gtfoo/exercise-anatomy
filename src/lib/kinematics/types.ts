/**
 * A body pose as WORLD-space sagittal angles, in radians, +Z forward, Y up.
 * Positive means the segment's top tips forward — except `armFwd`, which is
 * the upper arm's swing forward from hanging straight down (π is overhead),
 * and `elbow`, which is flexion relative to the upper arm.
 *
 * World angles rather than joint angles so a measured pose (motion capture)
 * and a designed one (a joint-angle function) are the same shape.
 */
export type Pose = {
  shin: number;
  thigh: number;
  trunk: number;
  armFwd: number;
  /** Elbow flexion, 0 = straight. Optional: the squat never bends it. */
  elbow?: number;
  /** World angle of the foot; absent means flat on the floor. */
  foot?: number;
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
const lerpOpt = (a: number | undefined, b: number | undefined, f: number) =>
  a === undefined && b === undefined ? undefined : lerp(a ?? 0, b ?? 0, f);

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
    elbow: lerpOpt(a.elbow, b.elbow, f),
    foot: lerpOpt(a.foot, b.foot, f),
  };
}
