"use client";

import Link from "next/link";
import type { Exercise } from "@/lib/exercises/types";
import { grouped, routeFor } from "@/lib/exercises";
import { useViewer } from "@/lib/store";

/**
 * The exercise switcher as its own panel on the left of wide screens: one
 * block per category with the exercises as chips, the current one filled.
 * Collapses to a tab on the canvas edge (the owner asked for both panels to
 * collapse, 2026-09-11). Narrow screens keep the select in the muscle panel.
 */
export default function ExerciseNav({ exercise }: { exercise: Exercise }) {
  const open = useViewer((s) => s.leftOpen);
  const setOpen = useViewer((s) => s.setLeftOpen);
  if (!open) return null;
  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-white p-4 text-zinc-800 md:flex" aria-label="Exercises">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Exercises</h2>
        <button type="button" onClick={() => setOpen(false)} className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Hide the exercise list">
          ‹
        </button>
      </div>
      <nav className="flex flex-col gap-4">
        {grouped.map((g) => (
          <div key={g.category}>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{g.category}</h3>
            <div className="flex flex-wrap gap-1">
              {g.items.map((e) =>
                e.slug === exercise.slug ? (
                  <span key={e.slug} className="rounded-full border border-zinc-900 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white" aria-current="page">
                    {e.name}
                  </span>
                ) : (
                  <Link
                    key={e.slug}
                    href={routeFor(e)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-400 hover:bg-white hover:text-zinc-900"
                  >
                    {e.name}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
