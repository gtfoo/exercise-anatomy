import type { Exercise } from "./types";
import { MUSCLES } from "@/lib/muscles";
import { BONES } from "@/lib/bones";

/**
 * The home page: the figure standing still, every named muscle it carries
 * and every named bone group. No movement, no roles, no curves; click a
 * muscle to isolate it, or a bone to light it up.
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
    "Every muscle and bone the figure names, at rest. Click a muscle to isolate it, or a bone to light it up; the exercise pages show which muscles work, and when, through a movement. Educational illustration, not training or medical advice.",
  phases: [{ name: "rest", t0: 0, t1: 1 }],
  muscles: MUSCLES.map((m) => ({ id: m.id, name: m.name, group: m.group, role: "stabiliser", note: m.note, curve: [[0, 0]] })),
  bones: BONES,
};
