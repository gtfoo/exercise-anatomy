"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { STUDIO } from "@/lib/palette";
import { useViewer } from "@/lib/store";
import AnatomyFigure from "./AnatomyFigure";
import NativeFigure from "./NativeFigure";

function Ticker({ durationMs }: { durationMs: number }) {
  useFrame((_, delta) => {
    const s = useViewer.getState();
    if (!s.playing) return;
    s.setT((s.t + (delta * 1000 * s.speed) / durationMs) % 1);
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

/** Two parallel bars running forward, one under each hand, on posts. */
function ParallelBars({ height, spacing }: { height: number; spacing: number }) {
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a5652", roughness: 0.45, metalness: 0.6 }), []);
  const length = 1.6;
  return (
    <group>
      {[-spacing, spacing].map((x) => (
        <group key={x}>
          <mesh material={steel} position={[x, height, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.02, 0.02, length, 24]} />
          </mesh>
          {[-length / 2 + 0.1, length / 2 - 0.1].map((z) => (
            <mesh key={z} material={steel} position={[x, height / 2, z]}>
              <cylinderGeometry args={[0.022, 0.022, height, 16]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** A tube between two points. */
function Tube({ a, b, r = 0.018, material }: { a: [number, number, number]; b: [number, number, number]; r?: number; material: THREE.Material }) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh material={material} position={mid} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 12]} />
    </mesh>
  );
}

/**
 * A bicycle the designed cycling clip sits on: bottom bracket at (0, 0.30, 0.20),
 * saddle top at 0.92, handlebar at (0, 0.98, 0.55) — the same numbers as
 * tools/myo/designed_clip.py. Cranks and pedals ride on the feet (props).
 */
function Bike() {
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3d3a37", roughness: 0.5, metalness: 0.5 }), []);
  const rubber = useMemo(() => new THREE.MeshStandardMaterial({ color: "#26241f", roughness: 0.9 }), []);
  const bb: [number, number, number] = [0, 0.3, 0.2];
  const seat: [number, number, number] = [0, 0.88, -0.02];
  const head: [number, number, number] = [0, 0.86, 0.5];
  const rear: [number, number, number] = [0, 0.34, -0.32];
  const front: [number, number, number] = [0, 0.34, 0.74];
  return (
    <group>
      {[rear, front].map((c, i) => (
        <mesh key={i} material={rubber} position={c} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.34, 0.022, 12, 40]} />
        </mesh>
      ))}
      <Tube a={bb} b={seat} material={steel} />
      <Tube a={bb} b={head} material={steel} />
      <Tube a={seat} b={head} material={steel} />
      <Tube a={bb} b={rear} material={steel} r={0.012} />
      <Tube a={seat} b={rear} material={steel} r={0.012} />
      <Tube a={head} b={front} material={steel} r={0.012} />
      <Tube a={head} b={[0, 0.98, 0.55]} material={steel} r={0.014} />
      <mesh material={steel} position={[0, 0.98, 0.55]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.014, 0.014, 0.52, 12]} />
      </mesh>
      <mesh material={rubber} position={[0, 0.905, -0.02]}>
        <boxGeometry args={[0.14, 0.05, 0.26]} />
      </mesh>
    </group>
  );
}

/** A wall face in front of the figure, for a climb, and a staircase rising away from it, drawn to the clip's rise and run. */
function Scenery({ scenery }: { scenery: NonNullable<Exercise["scenery"]> }) {
  const plaster = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9d4cc", roughness: 0.95 }), []);
  if (scenery.kind === "wall") {
    // The face sits at `front`; ledges stand 12 cm proud of it at the heights the hands and feet land.
    return (
      <group>
        <mesh material={plaster} position={[0, scenery.height / 2, scenery.front + 0.15]}>
          <boxGeometry args={[3, scenery.height, 0.3]} />
        </mesh>
        {(scenery.ledges ?? []).map((y) => (
          <mesh key={y} material={plaster} position={[0, y - 0.02, scenery.front - 0.06]}>
            <boxGeometry args={[3, 0.04, 0.12]} />
          </mesh>
        ))}
      </group>
    );
  }
  if (scenery.kind === "bike") return <Bike />;
  const { rise, run, count, first } = scenery;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} material={plaster} position={[0, (rise * (i + 1)) / 2, first + run * i + run / 2]}>
          <boxGeometry args={[1.6, rise * (i + 1), run]} />
        </mesh>
      ))}
    </group>
  );
}

/** A translucent surface: the figure is drawn through it, which is what a swimmer at the surface looks like. */
function Water({ level }: { level: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, level, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#8fc1de" transparent opacity={0.42} roughness={0.2} metalness={0.1} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Scene({ exercise }: { exercise: Exercise }) {
  // Near-side view: the sagittal chain reads best from here. Exercises can override.
  // A narrow (portrait) viewport gets the camera closer, or the figure is a
  // sliver in the top half of a phone screen. Read once: this file is
  // client-only and the Canvas takes its camera at mount.
  const target = exercise.camera?.target ?? [0, 0.85, 0];
  const base = exercise.camera?.position ?? [3.0, 1.25, 1.1];
  const narrow = typeof window !== "undefined" && window.innerWidth < 768;
  const position: [number, number, number] = narrow
    ? [target[0] + (base[0] - target[0]) * 0.8, target[1] + (base[1] - target[1]) * 0.8, target[2] + (base[2] - target[2]) * 0.8]
    : base;
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

      <Suspense fallback={null}>{exercise.native ? <NativeFigure exercise={exercise} /> : <AnatomyFigure exercise={exercise} />}</Suspense>
      <Ticker durationMs={exercise.durationMs} />
      {exercise.anchor === "hands" && <Bar height={exercise.barHeight ?? 2.3} />}
      {exercise.anchor === "bars" && <ParallelBars height={exercise.barHeight ?? 1.0} spacing={exercise.barSpacing ?? 0.27} />}
      {exercise.scenery && <Scenery scenery={exercise.scenery} />}
      {exercise.environment === "water" ? <Water level={exercise.waterLevel ?? 0.95} /> : exercise.anchor !== "hands" && <FloorShadow />}

      <OrbitControls target={target} minDistance={1.2} maxDistance={7} maxPolarAngle={Math.PI / 2 - 0.02} enablePan={false} />
    </Canvas>
  );
}
