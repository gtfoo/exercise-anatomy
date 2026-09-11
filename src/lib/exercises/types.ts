export type MuscleRole = "prime-mover" | "synergist" | "stabiliser";

/** A [t, level] keyframe: t is normalised time 0..1 across one rep, level is relative activation 0..1. */
export type CurvePoint = readonly [t: number, level: number];

export type MuscleActivation = {
  id: string;
  name: string;
  /** Anatomical group the panel lists it under, e.g. "Quadriceps". Display order follows first appearance. */
  group: string;
  role: MuscleRole;
  /** Relative activation across one rep. Linear between points, clamped at the ends. The left side, and the right unless `right` is given. */
  curve: readonly CurvePoint[];
  /** The right side's curve when the movement is asymmetric (a side plank, a lunge one leg at a time). */
  right?: readonly CurvePoint[];
  /**
   * How far the muscle is lengthened beyond its resting length, 0..1, across
   * the rep: a hamstring in a forward fold, a hip flexor behind a lunge, or a
   * muscle working while it lengthens (the glutes on the way down a squat).
   * Drawn teal; with activation it reads purple. Absent means not tracked.
   */
  stretch?: readonly CurvePoint[];
  /** The right side's stretch when asymmetric. */
  stretchRight?: readonly CurvePoint[];
  /** What this muscle is doing in this exercise — one or two sentences. */
  note: string;
  /**
   * Present only when the curve is grounded in something outside this file:
   * a measurement (%MVIC) or a model estimate. Absent means the curve is
   * qualitative (role-based) and the UI must not print a number for it.
   * "estimated-activation" is never presented as measured.
   */
  source?: { citation: string; measure: "%MVIC" | "estimated-activation"; conditions: string };
};

export type Phase = { name: string; t0: number; t1: number };

/** Switcher groups, in display order. */
export const CATEGORIES = ["Atlas", "Legs and hips", "Push and pull", "Core", "Cardio", "Swimming", "Yoga"] as const;
export type ExerciseCategory = (typeof CATEGORIES)[number];

import type { MotionClip, MotionClip3D } from "@/lib/kinematics/types";

export type Exercise = {
  slug: string;
  name: string;
  /** One rep at default playback speed. */
  durationMs: number;
  phases: readonly Phase[];
  muscles: readonly MuscleActivation[];
  /** Captured motion for one rep as four sagittal angles. Absent means the designed joint-angle function is used. */
  motion?: MotionClip;
  /** Full 3D motion for one cycle. When present it drives the figure; `motion` still feeds the activation estimate. */
  motion3d?: MotionClip3D;
  /**
   * The clip to play on the Mixamo-skeleton figure (tools/blender/convert_clip.py
   * writes one animation-only GLB per exercise). When present the viewer scrubs
   * that animation with a mixer and ignores `motion`/`motion3d` for display;
   * `figure` overrides the default rigged model.
   */
  native?: { clip: string; figure?: string };
  /**
   * What the body is fixed to: feet on the floor (default), hands on a pull-up
   * bar, hands on parallel bars, or nothing (root follows the clip). "bars"
   * only draws the parallel bars; a converted clip already carries the root.
   */
  anchor?: "feet" | "hands" | "bars" | "free";
  /** Bar height in metres when anchored by the hands (pull-up bar, or the top of the parallel bars). */
  barHeight?: number;
  /** Half the distance between parallel bars, metres: where the hands rest. */
  barSpacing?: number;
  /** Equipment the viewer attaches to bones: to the hands, or pedals to the feet. */
  props?: "dumbbells" | "kettlebell" | "pedals";
  /** Fixed scenery besides the floor: a wall to climb, a staircase, or a bicycle (drawn to tools/myo/designed_clip.py's BIKE_* constants). */
  scenery?:
    | { kind: "wall"; height: number; front: number; ledges?: number[] }
    | { kind: "stairs"; rise: number; run: number; count: number; first: number }
    | { kind: "bike" };
  /** Where the switcher lists it. */
  category: ExerciseCategory;
  /** Who captured the movement, when the clip came straight from a source file rather than through `motion`/`motion3d`. */
  credit?: string;
  /** A resting figure and a plain muscle list: no transport, no roles, no provenance line. */
  static?: boolean;
  /** Added to the root when free: where to put a body the clip does not place (a swimmer at the surface). */
  rootOffset?: [number, number, number];
  /** Floor by default; water draws a surface at `waterLevel` and no floor shadow. */
  environment?: "floor" | "water";
  waterLevel?: number;
  /** Where to look from; the default frames a standing figure. */
  camera?: { position: [number, number, number]; target: [number, number, number] };
  /** Shown under the title. Says what is and is not being claimed. */
  disclaimer: string;
};

export const ROLE_LABEL: Record<MuscleRole, string> = {
  "prime-mover": "prime mover",
  synergist: "synergist",
  stabiliser: "stabiliser",
};

export function levelAt(curve: readonly CurvePoint[], t: number): number {
  if (curve.length === 0) return 0;
  if (t <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [t1, v1] = curve[i];
    if (t <= t1) {
      const [t0, v0] = curve[i - 1];
      const f = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * f;
    }
  }
  return curve[curve.length - 1][1];
}

/** The same curve later in the cycle by `d` (0..1), wrapping: the other side of an alternating movement. */
export function shifted(curve: readonly CurvePoint[], d: number, n = 24): CurvePoint[] {
  const out: CurvePoint[] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    out.push([x, levelAt(curve, (((x - d) % 1) + 1) % 1)]);
  }
  return out;
}

/** A curve that plays `curve` compressed into one half of the cycle and rests at `rest` in the other. */
export function inHalf(curve: readonly CurvePoint[], half: 0 | 1, rest: number, n = 24): CurvePoint[] {
  const out: CurvePoint[] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const own = half === 0 ? x < 0.5 : x >= 0.5;
    out.push([x, own ? levelAt(curve, (x - half * 0.5) * 2) : rest]);
  }
  return out;
}

export function phaseAt(phases: readonly Phase[], t: number): Phase | undefined {
  return phases.find((p) => t >= p.t0 && t < p.t1) ?? phases[phases.length - 1];
}
