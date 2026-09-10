"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { useViewer } from "@/lib/store";
import { bindMaterials, paintMaterials, type FigureMaterials } from "./figureMaterials";

/**
 * The écorché bound to a Mixamo skeleton (tools/blender/build_mixamo_rig.py),
 * playing a clip converted onto that skeleton (tools/blender/convert_clip.py).
 * The clip file holds only bones and one animation; its tracks are named by
 * bone, and the mixer binds them onto the figure's bones by name. No
 * retargeting happens here: a mixer scrubs the clip to the transport's t.
 */
export const FIGURE_URL = "/models/figure-mixamo.glb";

type Live = { materials: FigureMaterials; mixer: THREE.AnimationMixer; action: THREE.AnimationAction; duration: number };

export default function NativeFigure({ exercise }: { exercise: Exercise }) {
  const figureUrl = exercise.native?.figure ?? FIGURE_URL;
  const clipUrl = exercise.native!.clip;
  const { scene } = useGLTF(figureUrl);
  const { animations } = useGLTF(clipUrl);
  const ids = useMemo(() => new Set(exercise.muscles.map((m) => m.id)), [exercise]);
  const live = useRef<Live | null>(null);

  useEffect(() => {
    const materials = bindMaterials(scene, ids);
    const clip = animations[0];
    if (!clip) {
      console.warn(`${clipUrl} has no animation clip`);
      live.current = null;
      return () => {
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
      for (const m of Object.values(materials)) m.dispose();
      live.current = null;
    };
  }, [scene, animations, ids, clipUrl]);

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

useGLTF.preload(FIGURE_URL);
