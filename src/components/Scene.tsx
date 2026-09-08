"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { STUDIO } from "@/lib/palette";
import { useViewer } from "@/lib/store";
import AnatomyFigure from "./AnatomyFigure";

function Ticker({ durationMs }: { durationMs: number }) {
  useFrame((_, delta) => {
    const s = useViewer.getState();
    if (!s.playing) return;
    s.setT((s.t + (delta * 1000) / durationMs) % 1);
  });
  return null;
}

/**
 * A soft disc under the feet. The feet never move, so a static gradient does the
 * job of a contact shadow without re-rendering 450k skinned vertices into a
 * depth buffer every frame.
 */
function FloorShadow() {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(40,30,25,0.42)");
    g.addColorStop(0.55, "rgba(40,30,25,0.16)");
    g.addColorStop(1, "rgba(40,30,25,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0.05]} scale={[1.1, 0.8, 1]}>
      <planeGeometry args={[1.4, 1.4]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/** A pull-up bar on two posts, at the height the exercise hangs from. */
function Bar({ height }: { height: number }) {
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a5652", roughness: 0.45, metalness: 0.6 }), []);
  return (
    <group>
      <mesh material={steel} position={[0, height, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.017, 0.017, 1.5, 24]} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} material={steel} position={[x, height / 2, 0]}>
          <cylinderGeometry args={[0.022, 0.022, height, 16]} />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene({ exercise }: { exercise: Exercise }) {
  // Near-side view: the sagittal chain reads best from here. Exercises can override.
  const position = exercise.camera?.position ?? [3.0, 1.25, 1.1];
  const target = exercise.camera?.target ?? [0, 0.85, 0];
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position, fov: 40 }}
      onPointerMissed={() => useViewer.getState().setSelected(null)}
    >
      <color attach="background" args={[STUDIO]} />
      {/* Soft studio light: bright sky, warm-grey bounce from the floor. */}
      <hemisphereLight args={["#ffffff", "#b9b2aa", 1.1]} />
      <directionalLight position={[3, 5, 2.5]} intensity={1.6} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} />

      <Suspense fallback={null}>
        <AnatomyFigure exercise={exercise} />
      </Suspense>
      <Ticker durationMs={exercise.durationMs} />
      {exercise.anchor === "hands" ? <Bar height={exercise.barHeight ?? 2.3} /> : <FloorShadow />}

      <OrbitControls target={target} minDistance={1.2} maxDistance={7} maxPolarAngle={Math.PI / 2 - 0.02} enablePan={false} />
    </Canvas>
  );
}
