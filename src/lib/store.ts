import { create } from "zustand";

type ViewerState = {
  t: number;
  playing: boolean;
  hovered: string | null;
  selected: string | null;
  setT: (t: number) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setHovered: (id: string | null) => void;
  /** Click semantics: clicking the selected muscle again deselects it. */
  setSelected: (id: string | null) => void;
};

export const useViewer = create<ViewerState>((set) => ({
  t: 0,
  playing: true,
  hovered: null,
  selected: null,
  setT: (t) => set({ t }),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setHovered: (hovered) => set({ hovered }),
  setSelected: (id) => set((s) => ({ selected: s.selected === id ? null : id })),
}));
