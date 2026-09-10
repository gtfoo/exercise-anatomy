import type { Exercise } from "./types";
import { squat } from "./squat";

/**
 * Lab page, not in the switcher: the same squat, same muscles and curves, but
 * played on the Mixamo-skeleton build of the figure with the clip embedded,
 * so the two motion pipelines can be compared side by side. See
 * tools/blender/build_mixamo_rig.py and TASKS.md (option B).
 */
export const squatNative: Exercise = {
  ...squat,
  slug: "lab-native-squat",
  name: "Bodyweight squat — native rig (lab)",
  native: { url: "/models/figure-mixamo.glb" },
  disclaimer:
    "Lab comparison: the figure is bound to a Mixamo skeleton in a T-pose and plays the Mixamo clip directly, with no retargeting. Muscle curves are the same estimate as the main squat page. " +
    squat.disclaimer,
};
