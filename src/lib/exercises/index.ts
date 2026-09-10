import type { Exercise } from "./types";
import { squat } from "./squat";
import { pullUp } from "./pull-up";
import { freestyle } from "./freestyle";
import { lunge } from "./lunge";
import { jumpingJacks } from "./jumping-jacks";

/** Display order. Routes are `/` for the first and `/<slug>` for the rest. */
export const exercises: readonly Exercise[] = [squat, lunge, jumpingJacks, pullUp, freestyle];

export const routeFor = (e: Exercise) => (e === exercises[0] ? "/" : `/${e.slug}`);
