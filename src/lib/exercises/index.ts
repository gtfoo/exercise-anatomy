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
import { atlas, bonesAtlas } from "./atlas";
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
import { foamRolling } from "./foam-rolling";
import { standingLegRaise } from "./standing-leg-raise";
import { warrior1, warrior2, halfMoon, scalePose, headstand, pigeonPose, downwardDog, cobraPose, childsPose } from "./yoga-more";
import { hipFlexorStretch, quadStretch, calfStretch, hamstringStretch } from "./stretches";
import { deadlift, romanianDeadlift, benchPress, overheadPress, barbellRow, hipThrust } from "./weights-more";
import { gluteBridge, hangingLegRaise, hollowHold } from "./core-more";
import { sunSalutation } from "./sun-salutation";
import { crabWalk } from "./crab-walk";
import { abRoller } from "./ab-roller";
import { singleLegRdlKneeUp } from "./legs-more";
import { windshieldWipers, straightLegSitUp, straightLegHold, vUp, shoulderTap, doubleLegLift, straightLegRaise } from "./core-sweat";
import { pikePushUp } from "./push-more";
import { treePose, chairPose, trianglePose, bridgePose, seatedTwist } from "./yoga-more";
import { CATEGORIES } from "./types";

/** Display order within a category. Routes are `/` for the atlas and `/<slug>` for the rest. */
export const exercises: readonly Exercise[] = [
  atlas,
  bonesAtlas,
  // Legs and hips
  squat,
  lunge,
  pistolSquat,
  stairs,
  clamshell,
  foamRolling,
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
  warrior1,
  warrior2,
  warrior3,
  halfMoon,
  standingLegRaise,
  pigeonPose,
  scalePose,
  headstand,
  downwardDog,
  cobraPose,
  childsPose,
  wheelPose,
  crowPose,
  sidePlank,
  // Stretches
  hipFlexorStretch,
  quadStretch,
  calfStretch,
  hamstringStretch,
  // Later additions; the switcher sorts by name
  deadlift,
  romanianDeadlift,
  benchPress,
  overheadPress,
  barbellRow,
  hipThrust,
  gluteBridge,
  hangingLegRaise,
  hollowHold,
  sunSalutation,
  treePose,
  chairPose,
  trianglePose,
  bridgePose,
  seatedTwist,
  crabWalk,
  abRoller,
  singleLegRdlKneeUp,
  windshieldWipers,
  straightLegSitUp,
  straightLegHold,
  vUp,
  pikePushUp,
  shoulderTap,
  doubleLegLift,
  straightLegRaise,
];

/** The switcher's groups, categories and exercises both in alphabetical order (owner, 2026-09-13). */
const byName = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });
export const grouped: readonly { category: string; items: readonly Exercise[] }[] = [...CATEGORIES]
  .sort(byName)
  .map((category) => ({
    category,
    items: exercises.filter((e) => e.category === category).sort((a, b) => byName(a.name, b.name)),
  }))
  .filter((g) => g.items.length > 0);

export const routeFor = (e: Exercise) => (e === exercises[0] ? "/" : `/${e.slug}`);
