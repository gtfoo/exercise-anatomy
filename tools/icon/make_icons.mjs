// The app's icons, from one drawing: a muscle in the écorché style (a red fusiform belly with its fibres, cream
// tendons, the bone it pulls on at each end), set diagonally on the studio background, in the palette of
// src/lib/palette.ts (owner, 2026-11-24: the PWA icon was still create-next-app's Vercel one).
//
//   node tools/icon/make_icons.mjs        (from the repo root; uses the sharp that ships with Next)
//
// Writes:
//   src/app/icon.svg          the browser icon (rounded square), any size
//   src/app/favicon.ico       16, 32 and 48 px PNGs in an ICO, for browsers that want one
//   src/app/apple-icon.png    180 px, full bleed: iOS rounds the corners itself
//   public/icons/icon-192.png, icon-512.png   the web app manifest's icons, full bleed, the muscle inside the
//                                             central 80% circle so a launcher's mask (purpose "maskable") never cuts it
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const STUDIO = "#f3f1ee";
const HOT = "#d3341a";

/** The drawing on a 512 square; `rounded` gives the browser icon its corners, the app icons are full bleed. */
function svg({ rounded }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="belly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e5512f"/>
      <stop offset="0.55" stop-color="${HOT}"/>
      <stop offset="1" stop-color="#a92611"/>
    </linearGradient>
    <linearGradient id="tendon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4efe7"/>
      <stop offset="1" stop-color="#d9d0c4"/>
    </linearGradient>
    <clipPath id="belly-clip"><path d="M108 256C158 244 190 186 256 186C322 186 354 244 404 256C354 268 322 326 256 326C190 326 158 268 108 256Z"/></clipPath>
  </defs>
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ""} fill="${STUDIO}"/>
  <g transform="rotate(-35 256 256)">
    <!-- the bone each end pulls on -->
    <circle cx="66" cy="256" r="20" fill="#cdc4b8"/>
    <circle cx="446" cy="256" r="20" fill="#cdc4b8"/>
    <!-- tendons -->
    <rect x="64" y="246" width="80" height="20" rx="10" fill="url(#tendon)" stroke="#bdb3a6" stroke-width="3"/>
    <rect x="368" y="246" width="80" height="20" rx="10" fill="url(#tendon)" stroke="#bdb3a6" stroke-width="3"/>
    <!-- the belly and its fibres -->
    <path d="M108 256C158 244 190 186 256 186C322 186 354 244 404 256C354 268 322 326 256 326C190 326 158 268 108 256Z" fill="url(#belly)" stroke="#8f200e" stroke-width="5"/>
    <g clip-path="url(#belly-clip)" fill="none" stroke="#f07a5c" stroke-width="6" stroke-linecap="round" opacity="0.55">
      <path d="M118 256C190 214 322 214 394 256"/>
      <path d="M118 256C190 236 322 236 394 256"/>
      <path d="M118 256C190 276 322 276 394 256"/>
      <path d="M118 256C190 298 322 298 394 256"/>
    </g>
    <!-- a highlight along the top of the belly -->
    <path d="M190 222C224 202 288 202 322 222" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.28"/>
  </g>
</svg>
`;
}

/** An ICO holding PNG images (every browser since IE 11 reads PNG entries). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const png = (s, size) => sharp(Buffer.from(s), { density: 72 * (size / 512) * 4 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

const rounded = svg({ rounded: true });
const bleed = svg({ rounded: false });
mkdirSync("public/icons", { recursive: true });
writeFileSync("src/app/icon.svg", rounded);
writeFileSync("src/app/favicon.ico", ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) })))));
writeFileSync("src/app/apple-icon.png", await png(bleed, 180));
writeFileSync("public/icons/icon-192.png", await png(bleed, 192));
writeFileSync("public/icons/icon-512.png", await png(bleed, 512));
console.log("icons written: src/app/icon.svg, favicon.ico, apple-icon.png; public/icons/icon-192.png, icon-512.png");
