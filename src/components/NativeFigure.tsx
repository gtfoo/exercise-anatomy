"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { useViewer } from "@/lib/store";
import { bindMaterials, paintMaterials, type FigureMaterials } from "./figureMaterials";
import hashes from "@/lib/model-hashes.json";

/**
 * The droplet serves /models/* with a one-day cache and the filenames never
 * change, so every URL carries a content hash (scripts/hash-models.mjs, run
 * before dev and build): a re-converted clip is a new URL, not a stale hit.
 */
export function versioned(path: string): string {
  const h = (hashes as Record<string, string>)[path];
  return h ? `${path}?v=${h}` : path;
}

/**
 * The écorché bound to a Mixamo skeleton (tools/blender/build_mixamo_rig.py),
 * playing a clip converted onto that skeleton (tools/blender/convert_clip.py).
 * The clip file holds only bones and one animation; its tracks are named by
 * bone, and the mixer binds them onto the figure's bones by name. No
 * retargeting happens here: a mixer scrubs the clip to the transport's t.
 */
export const FIGURE_URL = "/models/figure-mixamo.glb";

type Live = { materials: FigureMaterials; mixer: THREE.AnimationMixer; action: THREE.AnimationAction; duration: number };

/**
 * Hand-held equipment, parented to the hand bones so it follows the clip.
 * The Mixamo hand bone points along the fingers (local Y) with local Z out
 * of the back of the hand and local X across the palm, so a dumbbell handle
 * lies along X, a little way down the hand and just on the palm side.
 * Returns the function that removes it again.
 */
function attachProps(scene: THREE.Group, props: Exercise["props"]): () => void {
  if (props !== "dumbbells") return () => {};
  const steel = new THREE.MeshStandardMaterial({ color: "#4a4744", roughness: 0.5, metalness: 0.6 });
  const added: THREE.Object3D[] = [];
  for (const side of ["Left", "Right"]) {
    const hand = scene.getObjectByName(`mixamorig${side}Hand`);
    if (!hand) continue;
    const g = new THREE.Group();
    g.position.set(0, 0.07, 0.03);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.17, 16), steel);
    handle.rotation.z = Math.PI / 2;
    g.add(handle);
    for (const x of [-0.095, 0.095]) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 24), steel);
      plate.rotation.z = Math.PI / 2;
      plate.position.x = x;
      g.add(plate);
    }
    hand.add(g);
    added.push(g);
  }
  return () => {
    for (const g of added) g.removeFromParent();
    steel.dispose();
  };
}

export default function NativeFigure({ exercise }: { exercise: Exercise }) {
  const figureUrl = versioned(exercise.native?.figure ?? FIGURE_URL);
  const clipUrl = versioned(exercise.native!.clip);
  const { scene } = useGLTF(figureUrl);
  const { animations } = useGLTF(clipUrl);
  const ids = useMemo(() => new Set(exercise.muscles.map((m) => m.id)), [exercise]);
  const live = useRef<Live | null>(null);

  useEffect(() => {
    const materials = bindMaterials(scene, ids);
    const props = attachProps(scene, exercise.props);
    const clip = animations[0];
    if (!clip) {
      console.warn(`${clipUrl} has no animation clip`);
      live.current = null;
      return () => {
        props();
        for (const m of Object.values(materials)) m.dispose();
      };
    }
    // The figure is shared across pages; whatever the previous clip left on
    // its bones is overwritten by this clip's first update.
    const mixer = new THREE.AnimationMixer(scene);
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
    action.paused = true; // the transport drives time, not the clock
    live.current = { materials, mixer, action, duration: clip.duration };
    return () => {
      action.stop();
      mixer.uncacheRoot(scene);
      props();
      for (const m of Object.values(materials)) m.dispose();
      live.current = null;
    };
  }, [scene, animations, ids, clipUrl, exercise.props]);

  const setHovered = useViewer((s) => s.setHovered);
  const setSelected = useViewer((s) => s.setSelected);

  useFrame(() => {
    const l = live.current;
    if (!l) return;
    const { t, hovered, selected } = useViewer.getState();
    paintMaterials(l.materials, exercise, t, hovered, selected);
    // Scrub: the clip's last frame equals its first for a loop, so t = 1 wraps to 0.
    l.action.time = (t % 1) * l.duration;
    l.mixer.update(0);
  });

  return (
    <primitive
      object={scene}
      onPointerOver={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
        const id = e.object.userData.muscleId as string | null;
        if (!id) return;
        e.stopPropagation();
        setHovered(id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
        const id = e.object.userData.muscleId as string | null;
        if (!id) return;
        e.stopPropagation();
        setSelected(id);
      }}
    />
  );
}

useGLTF.preload(versioned(FIGURE_URL));
