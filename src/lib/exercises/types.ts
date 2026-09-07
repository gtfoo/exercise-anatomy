export type MuscleRole = "prime-mover" | "synergist" | "stabiliser";

/** A [t, level] keyframe: t is normalised time 0..1 across one rep, level is relative activation 0..1. */
export type CurvePoint = readonly [t: number, level: number];

export type MuscleActivation = {
  id: string;
  name: string;
  /** Anatomical group the panel lists it under, e.g. "Quadriceps". Display order follows first appearance. */
  group: string;
  role: MuscleRole;
  /** Relative activation across one rep. Linear between points, clamped at the ends. */
  curve: readonly CurvePoint[];
  /** What this muscle is doing in this exercise — one or two sentences. */
  note: string;
  /**
   * Present only when the curve is grounded in a measurement. Absent means the
   * curve is qualitative (role-based) and the UI must not print a number for it.
   */
  source?: { citation: string; measure: "%MVIC"; conditions: string };
};

export type Phase = { name: string; t0: number; t1: number };

import type { MotionClip } from "@/lib/kinematics/types";

export type Exercise = {
  slug: string;
  name: string;
  /** One rep at default playback speed. */
  durationMs: number;
  phases: readonly Phase[];
  muscles: readonly MuscleActivation[];
  /** Captured motion for one rep. Absent means the designed joint-angle function is used. */
  motion?: MotionClip;
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

export function phaseAt(phases: readonly Phase[], t: number): Phase | undefined {
  return phases.find((p) => t >= p.t0 && t < p.t1) ?? phases[phases.length - 1];
}
