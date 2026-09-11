import type { Exercise } from "./types";
import { MUSCLES } from "@/lib/muscles";

/**
 * The home page: the figure standing still, and every named muscle it
 * carries. No movement, no roles, no curves; click a muscle to isolate it.
 */
export const atlas: Exercise = {
  slug: "atlas",
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
