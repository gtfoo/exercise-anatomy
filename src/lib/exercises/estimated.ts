import type { CurvePoint, Exercise } from "./types";

/** Shape of tools/opensim/out/squat-activation.json, as pushed to src/lib/activation by the workflow. */
export type EstimatedActivation = {
  method: string;
  model: string;
  motion: string;
  conditions: string;
  measure: "estimated-activation";
  durationS: number;
  muscles: Record<string, { curve: CurvePoint[]; peak: number; parts: string[] }>;
};

/**
 * Replace the qualitative curve of every muscle the estimate covers, and mark
 * it as estimated. Muscles the model has no actuator for (the trunk) keep their
 * role-based curve and stay "qualitative" in the UI.
 */
export function withEstimatedActivation(exercise: Exercise, est: EstimatedActivation): Exercise {
  return {
    ...exercise,
    muscles: exercise.muscles.map((m) => {
      const e = est.muscles[m.id];
      if (!e) return m;
      return {
        ...m,
        curve: e.curve,
        source: { citation: `${est.method}; ${est.model}`, measure: "estimated-activation", conditions: est.conditions },
      };
    }),
  };
}
