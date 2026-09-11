// Writes src/lib/model-hashes.json: a short content hash for every file under
// public/models, so the viewer can request /models/x.glb?v=<hash>. The droplet
// serves /models/* with a one-day cache and the filenames never change, so
// without this a re-converted clip is invisible to a returning browser until
// the next day. Runs before `next dev` and `next build` (package.json).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const modelsDir = join(root, "public", "models");
const out = join(root, "src", "lib", "model-hashes.json");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const hashes = {};
for (const file of walk(modelsDir).sort()) {
  const rel = "/" + relative(join(root, "public"), file).split("\\").join("/");
  hashes[rel] = createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 10);
}
writeFileSync(out, JSON.stringify(hashes, null, 2) + "\n");
console.log(`model hashes: ${Object.keys(hashes).length} files -> ${relative(root, out)}`);
