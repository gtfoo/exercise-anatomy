#!/bin/bash
# Compress the exported GLB for the web: prune, dedupe, weld, quantize, meshopt.
# --join/--flatten stay off: the app finds muscles by node name, and joining
# meshes that share a material would fold all 21 targets into one anonymous mesh.
# Usage: tools/blender/optimise.sh  (from the repo root; needs Node 22)
set -e
cd "$(dirname "$0")/../.."
IN=tools/blender/out/figure.glb
OUT=public/models/figure.glb
npx --yes @gltf-transform/cli optimize "$IN" "$OUT" \
  --compress meshopt --texture-compress false --simplify false \
  --join false --flatten false --instance false
ls -l "$IN" "$OUT"
