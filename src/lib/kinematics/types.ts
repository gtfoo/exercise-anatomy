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

/**
 * Full 3D motion for one cycle, from tools/mocap/extract_pose3d.py: per sample,
 * the root (pelvis) translation from the cycle's first frame, and for each rig
 * bone its WORLD rotation relative to rest as an [x, y, z, w] quaternion.
 * Handles anything the four sagittal angles cannot: roll, alternating limbs,
 * arms out of the plane.
 */
export type Quat = readonly [number, number, number, number];
export type Pose3DSample = { root: readonly [number, number, number]; q: Readonly<Record<string, Quat>> };
export type MotionClip3D = {
  source: string;
  credit?: string;
  fps: number;
  cycle: { start: number; end: number; seconds: number };
  samples: readonly Pose3DSample[];
};

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** Normalised spherical interpolation of two [x,y,z,w] quaternions, taking the short way round. */
function slerpQ(a: Quat, b: Quat, f: number): Quat {
  let [bx, by, bz, bw] = b;
  let cos = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (cos < 0) {
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
    cos = -cos;
  }
  let wa = 1 - f;
  let wb = f;
  if (cos < 0.9995) {
    const th = Math.acos(cos);
    const s = Math.sin(th);
    wa = Math.sin((1 - f) * th) / s;
    wb = Math.sin(f * th) / s;
  }
  const x = wa * a[0] + wb * bx;
  const y = wa * a[1] + wb * by;
  const z = wa * a[2] + wb * bz;
  const w = wa * a[3] + wb * bw;
  const n = Math.hypot(x, y, z, w) || 1;
  return [x / n, y / n, z / n, w / n];
}

export function poseAt3D(clip: MotionClip3D, t: number): Pose3DSample {
  const n = clip.samples.length;
  const x = ((t % 1) + 1) % 1 * n;
  const i = Math.floor(x);
  const f = x - i;
  const a = clip.samples[i % n];
  const b = clip.samples[(i + 1) % n];
  const q: Record<string, Quat> = {};
  for (const k of Object.keys(a.q)) q[k] = b.q[k] ? slerpQ(a.q[k], b.q[k], f) : a.q[k];
  return {
    root: [lerp(a.root[0], b.root[0], f), lerp(a.root[1], b.root[1], f), lerp(a.root[2], b.root[2], f)],
    q,
  };
}
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
