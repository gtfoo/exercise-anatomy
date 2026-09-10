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
   * Present only when the curve is grounded in something outside this file:
   * a measurement (%MVIC) or a model estimate. Absent means the curve is
   * qualitative (role-based) and the UI must not print a number for it.
   * "estimated-activation" is never presented as measured.
   */
  source?: { citation: string; measure: "%MVIC" | "estimated-activation"; conditions: string };
};

export type Phase = { name: string; t0: number; t1: number };

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
   * A figure with the clip already embedded (the Mixamo-skeleton build from
   * tools/blender/build_mixamo_rig.py). When present the viewer plays that
   * animation with a mixer, scrubbed by t, and ignores `motion`/`motion3d`.
   */
  native?: { url: string; clip?: string };
  /** What the body is fixed to: feet on the floor (default), hands on a bar, or nothing (root follows the clip). */
  anchor?: "feet" | "hands" | "free";
  /** Bar height in metres when anchored by the hands. */
  barHeight?: number;
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

export function phaseAt(phases: readonly Phase[], t: number): Phase | undefined {
  return phases.find((p) => t >= p.t0 && t < p.t1) ?? phases[phases.length - 1];
}
