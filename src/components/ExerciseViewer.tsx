"use client";

import dynamic from "next/dynamic";
import type { Exercise } from "@/lib/exercises/types";
import Panel from "./Panel";
import ExerciseNav from "./ExerciseNav";
import { useViewer } from "@/lib/store";

// three.js touches `window`; the canvas is client-only.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-zinc-400">Loading model…</div>,
});

/**
 * Wide screens: the exercise panel on the left, the canvas in the middle, the
 * muscle panel on the right; either panel collapses to a tab on the canvas.
 * Narrow screens: the canvas takes the top of the viewport and the muscle
 * panel (with an exercise select) scrolls beneath it, so the figure stays in
 * view while the list is browsed. `dvh` follows the mobile browser chrome.
 */
export default function ExerciseViewer({ exercise }: { exercise: Exercise }) {
  const rightOpen = useViewer((s) => s.rightOpen);
  const setRightOpen = useViewer((s) => s.setRightOpen);
  return (
    <div className="flex h-dvh w-full flex-col bg-[#f3f1ee] md:flex-row">
      <ExerciseNav exercise={exercise} />
      <div className="relative h-[52dvh] min-h-0 w-full shrink-0 md:h-auto md:min-w-0 md:flex-1">
        <Scene exercise={exercise} />
        <ExerciseNavTab />
        {!rightOpen && (
          <button
            type="button"
            onClick={() => setRightOpen(true)}
            className="absolute top-3 right-3 z-10 hidden rounded-md border border-zinc-300 bg-white/90 px-2.5 py-1 text-xs text-zinc-600 shadow-sm hover:bg-white md:block"
            aria-label="Show the muscle panel"
          >
            ‹ Muscles
          </button>
        )}
        <p className="pointer-events-none absolute right-4 bottom-3 hidden max-w-56 text-right text-xs text-zinc-400 md:block">
          {exercise.static ? "drag to orbit · scroll to zoom · click a muscle" : "drag to orbit · scroll to zoom · space to play/pause · click a muscle"}
        </p>
      </div>
      <Panel exercise={exercise} />
    </div>
  );
}

/** The left panel's reopen tab lives on the canvas so it stays visible when the panel is gone. */
function ExerciseNavTab() {
  const open = useViewer((s) => s.leftOpen);
  const setOpen = useViewer((s) => s.setLeftOpen);
  if (open) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="absolute top-3 left-3 z-10 hidden rounded-md border border-zinc-300 bg-white/90 px-2.5 py-1 text-xs text-zinc-600 shadow-sm hover:bg-white md:block"
      aria-label="Show the exercise list"
    >
      Exercises ›
    </button>
  );
}
