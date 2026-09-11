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

/** Display order. Routes are `/` for the first (the resting atlas) and `/<slug>` for the rest. */
export const exercises: readonly Exercise[] = [atlas, squat, lunge, jumpingJacks, pushUp, pullUp, lSit, clamshell, lateralRaise, freestyle, breaststroke];

export const routeFor = (e: Exercise) => (e === exercises[0] ? "/" : `/${e.slug}`);
