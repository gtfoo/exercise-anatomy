"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { useViewer } from "@/lib/store";
import { bindMaterials, paintMaterials, type FigureMaterials } from "./figureMaterials";

/**
 * A figure whose clip is embedded in the model: the Mixamo-skeleton build,
 * where the écorché is bound in Mixamo's T-pose to an armature with Mixamo's
 * bone orientations, so a Mixamo clip's rotations play untouched. No
 * retargeting in the app: a mixer scrubs the clip to the transport's t.
 */
type Live = { materials: FigureMaterials; mixer: THREE.AnimationMixer; action: THREE.AnimationAction; duration: number };

export default function NativeFigure({ exercise }: { exercise: Exercise }) {
  const url = exercise.native!.url;
  const { scene, animations } = useGLTF(url);
  const ids = useMemo(() => new Set(exercise.muscles.map((m) => m.id)), [exercise]);
  const live = useRef<Live | null>(null);

  useEffect(() => {
    const materials = bindMaterials(scene, ids);
    const wanted = exercise.native?.clip;
    const clip = (wanted && animations.find((a) => a.name === wanted)) ?? animations[0];
    if (!clip) {
      console.warn(`${url} has no animation clip`);
      live.current = null;
      return () => {
        for (const m of Object.values(materials)) m.dispose();
      };
    }
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
  }, [scene, animations, ids, url, exercise.native?.clip]);

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
