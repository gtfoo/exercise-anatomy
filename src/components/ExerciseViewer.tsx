"use client";

import dynamic from "next/dynamic";
import type { Exercise } from "@/lib/exercises/types";
import Panel from "./Panel";

// three.js touches `window`; the canvas is client-only.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-zinc-400">Loading model…</div>,
});

/**
 * Wide screens: canvas beside a fixed-width panel. Narrow screens: the canvas
 * takes the top of the viewport and the panel scrolls beneath it, so the figure
 * stays in view while the muscle list is browsed. `dvh` follows the mobile
 * browser chrome as it shows and hides.
 */
export default function ExerciseViewer({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex h-dvh w-full flex-col bg-[#f3f1ee] md:flex-row">
      <div className="relative h-[52dvh] min-h-0 w-full shrink-0 md:h-auto md:min-w-0 md:flex-1">
        <Scene exercise={exercise} />
        <p className="pointer-events-none absolute right-4 bottom-3 hidden max-w-56 text-right text-xs text-zinc-400 md:block">
          {exercise.static ? "drag to orbit · scroll to zoom · click a muscle" : "drag to orbit · scroll to zoom · space to play/pause · click a muscle"}
        </p>
      </div>
      <Panel exercise={exercise} />
    </div>
  );
}
