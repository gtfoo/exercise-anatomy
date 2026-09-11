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

type Live = {
  materials: FigureMaterials;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction;
  duration: number;
  barbell?: Barbell;
};

type Barbell = { update: () => void; dispose: () => void };

/**
 * A barbell drawn between the hands: not parented to either, because a
 * clean or a snatch turns the hands over, but placed each frame at their
 * midpoint and pointed from one to the other, so it stays in both palms.
 */
function attachBarbell(scene: THREE.Group): Barbell {
  const steel = new THREE.MeshStandardMaterial({
    color: "#4a4744",
    roughness: 0.5,
    metalness: 0.6,
  });
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.0, 16), steel);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  for (const x of [-0.82, 0.82]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 32), steel);
    plate.rotation.z = Math.PI / 2;
    plate.position.x = x;
    g.add(plate);
  }
  scene.add(g);
  const left = scene.getObjectByName("mixamorigLeftHand");
  const right = scene.getObjectByName("mixamorigRightHand");
  const L = new THREE.Vector3();
  const R = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const X = new THREE.Vector3(1, 0, 0);
  return {
    update() {
      if (!left || !right) return;
      scene.updateMatrixWorld(true);
      left.localToWorld(L.set(0, 0.08, 0.03)); // in the palm, a little down the fingers
      right.localToWorld(R.set(0, 0.08, 0.03));
      g.position.copy(L).add(R).multiplyScalar(0.5);
      g.quaternion.setFromUnitVectors(X, dir.copy(R).sub(L).normalize());
    },
    dispose() {
      g.removeFromParent();
      steel.dispose();
    },
  };
}

type Hold = { x: number; y: number; z: number; limb: "hand" | "foot" };

/**
 * Climbing holds, read off the clip: the animation is sampled through one
 * cycle and wherever a hand's fingertips or a foot's toes stay still for a
 * while above the floor, a hold is placed there (the same spot reached on
 * the way up and the way down merges into one). Nothing is stored in the
 * exercise file, so a re-converted clip moves its own holds.
 */
function findHolds(scene: THREE.Group, action: THREE.AnimationAction, mixer: THREE.AnimationMixer, duration: number): Hold[] {
  // Name, offset along the bone to the contact, kind, how long it must stay still (as a share of the cycle) and how
  // still: a foot is placed for a step and shuffles, so it gets more room than a hand that grips.
  const limbs = [
    ["mixamorigLeftHand", 0.1, "hand", 0.025, 0.03],
    ["mixamorigRightHand", 0.1, "hand", 0.025, 0.03],
    ["mixamorigLeftToeBase", 0.02, "foot", 0.015, 0.045],
    ["mixamorigRightToeBase", 0.02, "foot", 0.015, 0.045],
  ] as const;
  const N = 160;
  const tracks = limbs.map(([name, off, limb, minRun, still]) => ({
    bone: scene.getObjectByName(name),
    off,
    limb,
    minRun: Math.round(N * minRun),
    still,
    pts: [] as THREE.Vector3[],
  }));
  for (let i = 0; i < N; i++) {
    action.time = (i / N) * duration;
    mixer.update(0);
    scene.updateMatrixWorld(true);
    for (const tr of tracks) tr.pts.push(tr.bone ? tr.bone.localToWorld(new THREE.Vector3(0, tr.off, 0)) : new THREE.Vector3());
  }
  const holds: Hold[] = [];
  const MERGE = 0.12;
  for (const tr of tracks) {
    if (!tr.bone) continue;
    const flush = (a: number, b: number) => {
      if (b - a + 1 < tr.minRun) return;
      const c = new THREE.Vector3();
      for (let k = a; k <= b; k++) c.add(tr.pts[k]);
      c.divideScalar(b - a + 1);
      if (c.y < 0.08) return; // the floor
      if (holds.some((h) => Math.hypot(h.x - c.x, h.y - c.y) < MERGE)) return;
      holds.push({ x: c.x, y: c.y, z: c.z, limb: tr.limb });
    };
    let start = 0;
    for (let i = 1; i < N; i++) {
      if (tr.pts[i].distanceTo(tr.pts[i - 1]) > tr.still) {
        flush(start, i - 1);
        start = i;
      }
    }
    flush(start, N - 1);
  }
  return holds;
}

const HOLD_COLOURS = ["#c2603f", "#3f7fbf", "#6aa84f", "#d4a017", "#8e5fa8"];

/**
 * Draws the holds into `group`: a rounded hold at each contact point and,
 * where the contact is well ahead of the wall face (the hands reach over
 * the top of this clip's wall while the feet push on its face), a plaster
 * volume behind the hold out to the face. Returns the remover.
 */
function placeHolds(group: THREE.Group, holds: Hold[], front: number): () => void {
  const sphere = new THREE.SphereGeometry(1, 20, 14);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const materials = HOLD_COLOURS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  const plaster = new THREE.MeshStandardMaterial({ color: "#cfc9c0", roughness: 0.95 });
  holds.forEach((h, i) => {
    const hand = h.limb === "hand";
    const m = new THREE.Mesh(sphere, materials[i % materials.length]);
    // The fingers curl over the top of a hold and the toes rest on it, so the hold sits just under the contact point.
    m.position.set(h.x, h.y - 0.03, h.z + 0.03);
    m.scale.set(hand ? 0.075 : 0.06, hand ? 0.045 : 0.035, 0.06);
    group.add(m);
    const gap = front - (h.z + 0.06);
    if (gap > 0.03) {
      const v = new THREE.Mesh(box, plaster);
      v.position.set(h.x, h.y - 0.05, h.z + 0.06 + gap / 2);
      v.scale.set(hand ? 0.2 : 0.16, hand ? 0.14 : 0.1, gap);
      group.add(v);
    }
  });
  return () => {
    group.clear();
    sphere.dispose();
    box.dispose();
    plaster.dispose();
    for (const m of materials) m.dispose();
  };
}

/**
 * Hand-held equipment, parented to the hand bones so it follows the clip.
 * The Mixamo hand bone points along the fingers (local Y) with local Z out
 * of the back of the hand and local X across the palm, so a dumbbell handle
 * lies along X, a little way down the hand and just on the palm side.
 * Returns the function that removes it again.
 */
function attachProps(scene: THREE.Group, props: Exercise["props"]): () => void {
  if (!props || props === "barbell") return () => {}; // the barbell is placed per frame, see attachBarbell
  const steel = new THREE.MeshStandardMaterial({
    color: "#4a4744",
    roughness: 0.5,
    metalness: 0.6,
  });
  const added: THREE.Object3D[] = [];
  if (props === "pedals") {
    // A pedal platform under each foot, on the sole side (local +Z of the Mixamo foot bone is the top of the foot in its T-pose bind).
    for (const side of ["Left", "Right"]) {
      const foot = scene.getObjectByName(`mixamorig${side}Foot`);
      if (!foot) continue;
      const g = new THREE.Group();
      g.position.set(0, 0.12, -0.06);
      const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.07), steel);
      g.add(pedal);
      foot.add(g);
      added.push(g);
    }
    return () => {
      for (const g of added) g.removeFromParent();
      steel.dispose();
    };
  }
  if (props === "kettlebell") {
    // One bell held in both hands: parented to the left hand, offset toward the
    // right one, the handle across the palms and the bell hanging below them.
    const hand = scene.getObjectByName("mixamorigLeftHand");
    if (hand) {
      const g = new THREE.Group();
      g.position.set(-0.05, 0.07, 0.03);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 12, 32, Math.PI), steel);
      handle.rotation.set(0, 0, 0); // arc in the local XY plane, open toward -Y (the wrist), bell side at +Y... rotated below
      handle.rotation.x = Math.PI / 2;
      handle.rotation.z = Math.PI;
      handle.position.z = 0.0;
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), steel);
      bell.position.set(0, 0, 0.13);
      g.add(handle, bell);
      hand.add(g);
      added.push(g);
    }
    return () => {
      for (const g of added) g.removeFromParent();
      steel.dispose();
    };
  }
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
  const holdsGroup = useRef<THREE.Group>(null);
  const wall = exercise.scenery?.kind === "wall" ? exercise.scenery : null;

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
    const barbell = exercise.props === "barbell" ? attachBarbell(scene) : undefined;
    const holds = wall?.holds && holdsGroup.current ? placeHolds(holdsGroup.current, findHolds(scene, action, mixer, clip.duration), wall.front) : () => {};
    live.current = {
      materials,
      mixer,
      action,
      duration: clip.duration,
      barbell,
    };
    return () => {
      action.stop();
      mixer.uncacheRoot(scene);
      props();
      barbell?.dispose();
      holds();
      for (const m of Object.values(materials)) m.dispose();
      live.current = null;
    };
  }, [scene, animations, ids, clipUrl, exercise.props, wall]);

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
    l.barbell?.update();
  });

  return (
    <>
      <group ref={holdsGroup} />
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
    </>
  );
}

useGLTF.preload(versioned(FIGURE_URL));
