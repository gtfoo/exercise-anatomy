"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Exercise, MuscleActivation } from "@/lib/exercises/types";
import { ILLUSTRATION_NOTE, ROLE_LABEL, levelAt, phaseAt } from "@/lib/exercises/types";
import { exercises, grouped, routeFor } from "@/lib/exercises";
import { MUSCLES } from "@/lib/muscles";
import { rampCss } from "@/lib/palette";
import { useViewer } from "@/lib/store";

export default function Panel({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const t = useViewer((s) => s.t);
  const playing = useViewer((s) => s.playing);
  const hovered = useViewer((s) => s.hovered);
  const selected = useViewer((s) => s.selected);
  const setT = useViewer((s) => s.setT);
  const setPlaying = useViewer((s) => s.setPlaying);
  const togglePlaying = useViewer((s) => s.togglePlaying);
  const speed = useViewer((s) => s.speed);
  const setSpeed = useViewer((s) => s.setSpeed);
  const setHovered = useViewer((s) => s.setHovered);
  const tab = useViewer((s) => s.tab);
  const setTab = useViewer((s) => s.setTab);
  const boneTab = !!exercise.bones && tab === "bones";
  const setSelected = useViewer((s) => s.setSelected);
  const rightOpen = useViewer((s) => s.rightOpen);
  const setRightOpen = useViewer((s) => s.setRightOpen);

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
  const boneDetail = exercise.bones?.find((b) => b.id === selected);

  // Every muscle is listed under its atlas group (src/lib/muscles.ts), so the
  // same muscle never sits under "calf" on one page and "ankle" on another;
  // an exercise file's own `group` is only a fallback. The atlas lists the
  // groups from the shoulders down; an exercise page lists them by how hard
  // they work, the group with the strongest peak first and, within a group,
  // the strongest muscle first (owner, 2026-09-20). Peaks are taken over the
  // whole rep, so the order holds still while the figure moves.
  const groups = useMemo(() => {
    const canon = new Map(MUSCLES.map((m) => [m.id, m.group]));
    const order = [...new Set(MUSCLES.map((m) => m.group))];
    const peak = (m: MuscleActivation) => Math.max(...m.curve.map(([, v]) => v), ...(m.right ?? []).map(([, v]) => v));
    const by = new Map<string, MuscleActivation[]>();
    for (const m of exercise.muscles) {
      const g = canon.get(m.id) ?? m.group;
      if (!by.has(g)) by.set(g, []);
      by.get(g)!.push(m);
    }
    const atlasRank = (g: string) => (order.indexOf(g) === -1 ? 99 : order.indexOf(g));
    if (exercise.static) return [...by.entries()].sort(([a], [b]) => atlasRank(a) - atlasRank(b));
    const strongest = (ms: MuscleActivation[]) => Math.max(...ms.map(peak));
    return [...by.entries()]
      .map(([g, ms]) => [g, [...ms].sort((a, b) => peak(b) - peak(a))] as [string, MuscleActivation[]])
      .sort(([a, am], [b, bm]) => strongest(bm) - strongest(am) || atlasRank(a) - atlasRank(b));
  }, [exercise]);
  const groupOf = (m: MuscleActivation) => MUSCLES.find((x) => x.id === m.id)?.group ?? m.group;
  const boneGroups = useMemo(() => {
    const by = new Map<string, NonNullable<Exercise["bones"]>[number][]>();
    for (const b of exercise.bones ?? []) {
      if (!by.has(b.group)) by.set(b.group, []);
      by.get(b.group)!.push(b);
    }
    return [...by.entries()];
  }, [exercise]);

  return (
    <aside
      className={`flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto border-t border-zinc-200 bg-white p-4 text-zinc-800 md:w-80 md:flex-none md:gap-5 md:border-t-0 md:border-l md:p-5 ${
        rightOpen ? "" : "md:hidden"
      }`}
    >
      <header>
        <button
          type="button"
          onClick={() => setRightOpen(false)}
          className="float-right -mt-1 -mr-1 hidden rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 md:block"
          aria-label="Hide the muscle panel"
        >
          ›
        </button>
        {/* Narrow screens: one grouped select. Wide screens: the groups laid out with headings. */}
        <label className="mb-2 block md:hidden">
          <span className="sr-only">Exercise</span>
          <select
            value={exercise.slug}
            onChange={(e) => {
              const target = exercises.find((x) => x.slug === e.target.value);
              if (target) router.push(routeFor(target));
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            aria-label="Exercise"
          >
            {grouped.map((g) => (
              <optgroup key={g.category} label={g.category}>
                {g.items.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{exercise.name}</h1>
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-500 md:line-clamp-none">
          {exercise.static ? "" : ILLUSTRATION_NOTE}
          {exercise.disclaimer.trim() ? `${exercise.static ? "" : " "}${exercise.disclaimer.trim()}` : ""}
        </p>
      </header>

      {!exercise.static && (
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
            <button
              type="button"
              onClick={() => setSpeed(speed === 1 ? 0.5 : 1)}
              className="rounded-md border border-zinc-300 px-2 py-1 font-mono text-xs text-zinc-600 hover:bg-zinc-50"
              aria-label={speed === 1 ? "Play at half speed" : "Play at full speed"}
              title="Playback speed"
            >
              {speed === 1 ? "1×" : "0.5×"}
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
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: rampCss(1) }} /> working
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: rampCss(0, 1) }} /> lengthened
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: rampCss(1, 1) }} /> both
            </span>
            {exercise.muscles.some((m) => m.right || m.stretchRight) && (
              <span title="This movement works the two sides differently">· a dot split in two: left half is the left side, right half the right</span>
            )}
          </p>
        </section>
      )}

      {exercise.bones && (
        <div className="flex gap-1 rounded-md bg-zinc-100 p-1 text-sm" role="tablist" aria-label="What the panel lists">
          {(["muscles", "bones"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`flex-1 rounded px-2 py-1 capitalize transition-colors ${tab === k ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {detail && !boneTab && (
        <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-medium text-zinc-900">{detail.name}</h3>
            <span className="text-right text-[10px] uppercase tracking-wide text-zinc-500">
              {groupOf(detail)}
              {!exercise.static && <> · {ROLE_LABEL[detail.role]}</>}
            </span>
          </div>
          <p className="mt-1 leading-relaxed text-zinc-700">{detail.note}</p>
          {!exercise.static && (
            <p className="mt-2 text-xs text-zinc-500">
              {!detail.source
                ? "Qualitative — not measured."
                : detail.source.measure === "estimated-activation"
                  ? `Estimated, not measured — ${detail.source.citation}`
                  : `${detail.source.measure} · ${detail.source.citation}`}
            </p>
          )}
        </section>
      )}

      {boneDetail && (
        <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-medium text-zinc-900">{boneDetail.name}</h3>
            <span className="text-right text-[10px] uppercase tracking-wide text-zinc-500">{boneDetail.group} · bone</span>
          </div>
          <p className="mt-1 leading-relaxed text-zinc-700">{boneDetail.note}</p>
        </section>
      )}

      {!boneTab &&
        groups.map(([group, muscles]) => (
        <section key={group}>
          <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{group}</h2>
          <ul className="flex flex-col">
            {muscles.map((m) => {
              const level = levelAt(m.curve, t);
              const levelRight = m.right ? levelAt(m.right, t) : null;
              const stretch = m.stretch ? levelAt(m.stretch, t) : 0;
              const stretchRight = m.stretchRight ? levelAt(m.stretchRight, t) : stretch;
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
                    {!exercise.static &&
                      (levelRight === null && !m.stretchRight ? (
                        <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-zinc-300" style={{ background: rampCss(level, stretch) }} />
                      ) : (
                        // Asymmetric movement: the left and right sides as two half-dots, left on the left.
                        <span className="flex h-3 w-3 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-300" title="left · right">
                          <span className="h-full w-1/2" style={{ background: rampCss(level, stretch) }} />
                          <span className="h-full w-1/2" style={{ background: rampCss(levelRight ?? level, stretchRight) }} />
                        </span>
                      ))}
                    <span className="flex-1">{m.name}</span>
                    {!exercise.static && <span className="text-[10px] uppercase tracking-wide text-zinc-400">{ROLE_LABEL[m.role]}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {boneTab &&
        boneGroups.map(([group, bones]) => (
        <section key={`bone-${group}`}>
          <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{group}</h2>
          <ul className="flex flex-col">
            {bones.map((b) => {
              const active = hovered === b.id || selected === b.id;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(b.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(b.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-2 py-1 text-left text-sm transition-colors ${active ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
                  >
                    <span className="flex-1">{b.name}</span>
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
        {(exercise.credit ?? exercise.motion3d?.credit ?? exercise.motion?.credit) && (
          <> Movement captured from {exercise.credit ?? exercise.motion3d?.credit ?? exercise.motion?.credit}.</>
        )}
      </footer>
    </aside>
  );
}
