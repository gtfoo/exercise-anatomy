import type { Exercise } from "./types";
import { MUSCLES } from "@/lib/muscles";
import { BONES } from "@/lib/bones";

/**
 * The home page: the figure standing still, and every named muscle it
 * carries. No movement, no roles, no curves; click a muscle to isolate it.
 * The bones have their own page below (the owner found them odd under a
 * page called "All muscles", 2026-09-20).
 */
export const atlas: Exercise = {
  slug: "atlas",
  category: "Atlas",
  name: "All muscles",
  static: true,
  durationMs: 1000,
  anchor: "free",
  native: { clip: "/models/clips/stand.glb" },
  camera: { position: [2.4, 1.4, 2.6], target: [0, 0.95, 0] },
  disclaimer:
    "Every muscle the figure names, at rest. Click one to isolate it; the exercise pages show which of them work, and when, through a movement. Educational illustration, not training or medical advice.",
  phases: [{ name: "rest", t0: 0, t1: 1 }],
  muscles: MUSCLES.map((m) => ({ id: m.id, name: m.name, group: m.group, role: "stabiliser", note: m.note, curve: [[0, 0]] })),
};

/**
 * The skeleton page: the same resting figure with the muscles ghosted so the
 * bones read, and every named bone group listed. Click one to light it up.
 */
export const bonesAtlas: Exercise = {
  slug: "bones",
  category: "Atlas",
  name: "All bones",
  static: true,
  durationMs: 1000,
  anchor: "free",
  native: { clip: "/models/clips/stand.glb" },
  camera: { position: [2.4, 1.4, 2.6], target: [0, 0.95, 0] },
  disclaimer:
    "Every bone the figure names, at rest, with the muscles faded so the skeleton shows. Click a bone to light it up. The small bones of the wrist, midfoot and toes are listed as groups, the vertebrae by region and the skull as one. Educational illustration, not training or medical advice.",
  phases: [{ name: "rest", t0: 0, t1: 1 }],
  muscles: [],
  bones: BONES,
};
