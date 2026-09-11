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
import { CATEGORIES } from "./types";

/** Display order within a category. Routes are `/` for the atlas and `/<slug>` for the rest. */
export const exercises: readonly Exercise[] = [
  atlas,
  // Legs and hips
  squat,
  lunge,
  stairs,
  kettlebellSwing,
  clamshell,
  // Push and pull
  pushUp,
  pullUp,
  lateralRaise,
  wallClimb,
  // Core
  plank,
  lSit,
  bicycleCrunch,
  // Cardio
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
