import type { Exercise } from "./types";
import { MUSCLES } from "@/lib/muscles";
import { BONES } from "@/lib/bones";
import { LIGAMENTS } from "@/lib/ligaments";
import { TENDONS } from "@/lib/tendons";

/**
 * The home page: the figure standing still, every named muscle it carries and
 * every named bone, ligament and tendon group, on four tabs of the panel
 * (owner, 2026-09-20: one atlas, the reader switches between muscles and bones;
 * 2026-11-22: and ligaments, and tendons). No movement, no roles, no curves;
 * click a muscle to isolate it, anything else to light it up.
 */
export const atlas: Exercise = {
  slug: "atlas",
  category: "Atlas",
  name: "Muscles, bones, ligaments and tendons",
  static: true,
  durationMs: 1000,
  anchor: "free",
  native: { clip: "/models/clips/stand.glb" },
  camera: { position: [2.4, 1.4, 2.6], target: [0, 0.95, 0] },
  disclaimer:
    "Every muscle, bone, ligament and tendon the figure names, at rest: switch between them in the panel. Click a muscle to isolate it, anything else to light it up; the exercise pages show which muscles work, and when, through a movement. Most tendons are drawn as part of their muscle; the Tendons list has the ones modelled on their own.",
  phases: [{ name: "rest", t0: 0, t1: 1 }],
  muscles: MUSCLES.map((m) => ({ id: m.id, name: m.name, group: m.group, role: "stabiliser", note: m.note, curve: [[0, 0]] })),
  bones: BONES,
  ligaments: LIGAMENTS,
  tendons: TENDONS,
};
