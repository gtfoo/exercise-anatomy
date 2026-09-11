// One ramp, used by both the 3D materials and the panel swatches so they agree.
// Écorché convention: resting muscle is off-white, working muscle goes red.
export const COLD = "#e9e2d9";
export const HOT = "#d3341a";
export const HIGHLIGHT = "#ffb36b";
export const BONE = "#bfb7ae"; // the figure underneath the muscles
export const STUDIO = "#f3f1ee"; // canvas and page background
export const STRETCH = "#1f8f9a"; // lengthened muscle; with activation the two mix to purple

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * The colour of a muscle at a 0..1 activation level and a 0..1 stretch, as
 * [r, g, b] in 0..1: resting off-white, red with activation, teal with
 * stretch, and the two mixed when both apply.
 */
export function muscleRgb(level: number, stretch = 0): [number, number, number] {
  const a = hex(COLD);
  const b = hex(HOT);
  const c = hex(STRETCH);
  const l = Math.min(1, Math.max(0, level));
  const s = Math.min(1, Math.max(0, stretch));
  const w = l + s;
  const out = a.map((v, i) => {
    const target = w > 0 ? (b[i] * l + c[i] * s) / w : v;
    return (v + (target - v) * Math.min(1, w)) / 255;
  });
  return [out[0], out[1], out[2]];
}

/** CSS colour for a 0..1 activation level (and optional stretch) on the same ramp the meshes use. */
export function rampCss(level: number, stretch = 0): string {
  const [r, g, b] = muscleRgb(level, stretch).map((v) => Math.round(v * 255));
  return `rgb(${r} ${g} ${b})`;
}
