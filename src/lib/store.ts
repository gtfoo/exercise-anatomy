import { create } from "zustand";

type ViewerState = {
  t: number;
  playing: boolean;
  /** Playback rate: 1 is the movement's real tempo, 0.5 half of it. */
  speed: 1 | 0.5;
  hovered: string | null;
  selected: string | null;
  setT: (t: number) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setSpeed: (speed: 1 | 0.5) => void;
  setHovered: (id: string | null) => void;
  /** Click semantics: clicking the selected muscle again deselects it. */
  setSelected: (id: string | null) => void;
};

export const useViewer = create<ViewerState>((set) => ({
  t: 0,
  playing: true,
  speed: 1,
  hovered: null,
  selected: null,
  setT: (t) => set({ t }),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  setHovered: (hovered) => set({ hovered }),
  setSelected: (id) => set((s) => ({ selected: s.selected === id ? null : id })),
}));
