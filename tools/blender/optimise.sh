#!/bin/bash
# Compress the exported GLB for the web: prune, dedupe, weld, quantize, meshopt.
# --join/--flatten stay off: the app finds muscles by node name, and joining
# meshes that share a material would fold all 21 targets into one anonymous mesh.
# Usage: tools/blender/optimise.sh [in.glb] [out.glb]  (from the repo root; needs Node 22)
#   default: tools/blender/out/figure.glb -> public/models/figure.glb
#   the Mixamo-rig build: tools/blender/optimise.sh tools/blender/out/figure-mixamo.glb public/models/figure-mixamo.glb
set -e
cd "$(dirname "$0")/../.."
IN=${1:-tools/blender/out/figure.glb}
OUT=${2:-public/models/figure.glb}
npx --yes @gltf-transform/cli optimize "$IN" "$OUT" \
  --compress meshopt --texture-compress false --simplify false \
  --join false --flatten false --instance false
ls -l "$IN" "$OUT"
