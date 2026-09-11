import type { Exercise } from "./types";
import { squat } from "./squat";
import { pullUp } from "./pull-up";
import { freestyle } from "./freestyle";
import { lunge } from "./lunge";
import { jumpingJacks } from "./jumping-jacks";
import { pushUp } from "./push-up";
import { lSit } from "./l-sit";
import { clamshell } from "./clamshell";
import { lateralRaise } from "./lateral-raise";
import { breaststroke } from "./breaststroke";
import { atlas } from "./atlas";
import { kettlebellSwing } from "./kettlebell-swing";
import { bicycleCrunch } from "./bicycle-crunch";
import { sprint } from "./sprint";
import { stairs } from "./stairs";
import { wallClimb } from "./wall-climb";
import { plank } from "./plank";
import { cycling } from "./cycling";
import { boatPose, crowPose, sidePlank, warrior3, wheelPose } from "./yoga";
import { bicepCurl } from "./bicep-curl";
import { burpee } from "./burpee";
import { sitUp } from "./sit-up";
import { pistolSquat } from "./pistol-squat";
import { pikeWalk } from "./pike-walk";
import { cleanAndJerk } from "./clean-and-jerk";
import { snatch } from "./snatch";
import { overheadSquat } from "./overhead-squat";
import { muscleUp } from "./muscle-up";
import { handstand } from "./handstand";
import { dips } from "./dips";
import { planche } from "./planche";
import { frontLever } from "./front-lever";
import { CATEGORIES } from "./types";

/** Display order within a category. Routes are `/` for the atlas and `/<slug>` for the rest. */
export const exercises: readonly Exercise[] = [
  atlas,
  // Legs and hips
  squat,
  lunge,
  pistolSquat,
  stairs,
  clamshell,
  // Push and pull
  pushUp,
  pullUp,
  dips,
  muscleUp,
  handstand,
  planche,
  frontLever,
  wallClimb,
  pikeWalk,
  // Weights
  bicepCurl,
  lateralRaise,
  kettlebellSwing,
  overheadSquat,
  snatch,
  cleanAndJerk,
  // Core
  plank,
  sitUp,
  lSit,
  bicycleCrunch,
  // Cardio
  burpee,
  sprint,
  jumpingJacks,
  cycling,
  // Swimming
  freestyle,
  breaststroke,
  // Yoga
  boatPose,
  warrior3,
  wheelPose,
  crowPose,
  sidePlank,
];

/** The switcher's groups, in CATEGORIES order, each with its exercises in display order. */
export const grouped: readonly { category: string; items: readonly Exercise[] }[] = CATEGORIES.map((category) => ({
  category,
  items: exercises.filter((e) => e.category === category),
})).filter((g) => g.items.length > 0);

export const routeFor = (e: Exercise) => (e === exercises[0] ? "/" : `/${e.slug}`);
