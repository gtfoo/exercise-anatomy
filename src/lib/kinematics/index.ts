import type { Pose } from "./types";
import { squatPose } from "./squat";
import { pullUpPose } from "./pull-up";

/**
 * Designed joint-angle functions by exercise slug. Looked up client-side
 * because a function cannot cross the server/client boundary as a prop; an
 * exercise with a captured `motion` clip never needs one.
 */
export const designedPose: Record<string, (t: number) => Pose> = {
  "bodyweight-squat": squatPose,
  "pull-up": pullUpPose,
};
