"use client";

import { useEffect, useMemo } from "react";
import type { Exercise, MuscleActivation } from "@/lib/exercises/types";
import { ROLE_LABEL, levelAt, phaseAt } from "@/lib/exercises/types";
import { rampCss } from "@/lib/palette";
import { useViewer } from "@/lib/store";

export default function Panel({ exercise }: { exercise: Exercise }) {
  const t = useViewer((s) => s.t);
  const playing = useViewer((s) => s.playing);
  const hovered = useViewer((s) => s.hovered);
  const selected = useViewer((s) => s.selected);
  const setT = useViewer((s) => s.setT);
  const setPlaying = useViewer((s) => s.setPlaying);
  const togglePlaying = useViewer((s) => s.togglePlaying);
  const setHovered = useViewer((s) => s.setHovered);
  const setSelected = useViewer((s) => s.setSelected);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.key === " ") && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        togglePlaying();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlaying]);

  const phase = phaseAt(exercise.phases, t);
  const detail = exercise.muscles.find((m) => m.id === selected);

  // Group order is first appearance in the exercise file.
  const groups = useMemo(() => {
    const by = new Map<string, MuscleActivation[]>();
    for (const m of exercise.muscles) {
      if (!by.has(m.group)) by.set(m.group, []);
      by.get(m.group)!.push(m);
    }
    return [...by.entries()];
  }, [exercise]);

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-zinc-200 bg-white p-5 text-zinc-800">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{exercise.name}</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{exercise.disclaimer}</p>
      </header>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlaying}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs uppercase tracking-wide text-zinc-600">
            {phase?.name}
          </span>
          <span className="ml-auto font-mono text-xs text-zinc-400">{Math.round(t * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(t * 1000)}
          onPointerDown={() => setPlaying(false)}
          onChange={(e) => setT(Number(e.target.value) / 1000)}
          className="w-full accent-red-600"
          aria-label="Scrub through the rep"
        />
      </section>

      {detail && (
        <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-medium text-zinc-900">{detail.name}</h3>
            <span className="text-right text-[10px] uppercase tracking-wide text-zinc-500">
              {detail.group} · {ROLE_LABEL[detail.role]}
            </span>
          </div>
          <p className="mt-1 leading-relaxed text-zinc-700">{detail.note}</p>
          <p className="mt-2 text-xs text-zinc-500">
            {detail.source ? `${detail.source.measure} · ${detail.source.citation}` : "Qualitative — not measured."}
          </p>
        </section>
      )}

      {groups.map(([group, muscles]) => (
        <section key={group}>
          <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{group}</h2>
          <ul className="flex flex-col">
            {muscles.map((m) => {
              const level = levelAt(m.curve, t);
              const active = hovered === m.id || selected === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(m.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(m.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-2 py-1 text-left text-sm transition-colors ${
                      active ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-1 ring-zinc-300"
                      style={{ background: rampCss(level) }}
                    />
                    <span className="flex-1">{m.name}</span>
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">{ROLE_LABEL[m.role]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Required by the model licences; keep the wording as the sources specify it. */}
      <footer className="mt-auto border-t border-zinc-200 pt-3 text-[11px] leading-relaxed text-zinc-500">
        3D model derived from{" "}
        <a href="https://lifesciencedb.jp/bp3d/" className="underline decoration-zinc-300 hover:text-zinc-700">
          BodyParts3D
        </a>{" "}
        — The Database Center for Life Science — CC-BY-SA 2.1 Japan, via{" "}
        <a href="https://www.z-anatomy.com/" className="underline decoration-zinc-300 hover:text-zinc-700">
          Z-Anatomy
        </a>{" "}
        — The libre 3D atlas of anatomy — CC-BY-SA 4.0. The adapted model is shared under the same licence.
        {exercise.motion?.credit && <> Movement captured from {exercise.motion.credit}.</>}
      </footer>
    </aside>
  );
}
