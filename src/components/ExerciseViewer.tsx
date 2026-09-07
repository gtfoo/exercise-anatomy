"use client";

import dynamic from "next/dynamic";
import type { Exercise } from "@/lib/exercises/types";
import Panel from "./Panel";

// three.js touches `window`; the canvas is client-only.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-zinc-400">Loading model…</div>,
});

export default function ExerciseViewer({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex h-dvh w-full bg-[#f3f1ee]">
      <div className="relative min-w-0 flex-1">
        <Scene exercise={exercise} />
        <p className="pointer-events-none absolute right-4 bottom-3 max-w-56 text-right text-xs text-zinc-400">
          drag to orbit · scroll to zoom · space to play/pause · click a muscle
        </p>
      </div>
      <Panel exercise={exercise} />
    </div>
  );
}
