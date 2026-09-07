// One ramp, used by both the 3D materials and the panel swatches so they agree.
// Écorché convention: resting muscle is off-white, working muscle goes red.
export const COLD = "#e9e2d9";
export const HOT = "#d3341a";
export const HIGHLIGHT = "#ffb36b";
export const BONE = "#bfb7ae"; // the figure underneath the muscles
export const STUDIO = "#f3f1ee"; // canvas and page background

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** CSS colour for a 0..1 activation level on the same ramp the meshes use. */
export function rampCss(level: number): string {
  const a = hex(COLD);
  const b = hex(HOT);
  const l = Math.min(1, Math.max(0, level));
  const [r, g, bl] = a.map((v, i) => Math.round(v + (b[i] - v) * l));
  return `rgb(${r} ${g} ${bl})`;
}
