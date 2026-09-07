"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { levelAt } from "@/lib/exercises/types";
import { squatPose } from "@/lib/kinematics/squat";
import { poseAt } from "@/lib/kinematics/types";
import { useViewer } from "@/lib/store";
import { BONE, COLD, HOT, HIGHLIGHT } from "@/lib/palette";

/**
 * The rigged écorché built by tools/blender/build_figure.py from Z-Anatomy.
 *
 * Y-up, faces +Z, metres. Every muscle the exercise names is its own skinned
 * mesh (node name = muscle id); everything else is `context-muscles` and
 * `skeleton`. Bones: pelvis > spine > neck > head, pelvis > thigh.L > shin.L >
 * foot.L (and .R), spine > upper_arm.L > forearm.L > hand.L (and .R).
 *
 * There is no animation clip. The same joint-angle function that drove the
 * procedural figure rotates these bones about the world X axis each frame, and
 * the pelvis is placed wherever the planted left leg puts it.
 */
export const MODEL_URL = "/models/figure.glb";

/** three's GLTFLoader drops `. [ ] : /` from node names and turns spaces into `_`, so "thigh.L" arrives as "thighL". */
const gltfName = (n: string) => n.replace(/\s/g, "_").replace(/[\[\].:/]/g, "");

const BONE_NAMES = ["pelvis", "spine", "neck", "head", "thigh.L", "shin.L", "foot.L", "thigh.R", "shin.R", "foot.R", "upper_arm.L", "forearm.L", "hand.L", "upper_arm.R", "forearm.R", "hand.R"];

const X = new THREE.Vector3(1, 0, 0);
const rx = (v: THREE.Vector3, a: number) => v.clone().applyAxisAngle(X, a);

const cold = new THREE.Color(COLD);
const hot = new THREE.Color(HOT);
const highlight = new THREE.Color(HIGHLIGHT);

type Rig = {
  bones: Record<string, THREE.Bone>; // keyed by the Blender names above
  restQ: Record<string, THREE.Quaternion>;
  restPelvisPos: THREE.Vector3;
  /** Rest-pose world positions of the left leg joints, for planting the feet. */
  ankle: THREE.Vector3;
  knee: THREE.Vector3;
  hip: THREE.Vector3;
  pelvis: THREE.Vector3;
};

type Live = { materials: Record<string, THREE.MeshStandardMaterial>; rig: Rig | null };

/** Bone's current world orientation from the quaternion chain alone (positions do not matter for it). */
function worldQuat(obj: THREE.Object3D, out: THREE.Quaternion) {
  out.identity();
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) out.premultiply(o.quaternion);
  return out;
}

const tmpQ = new THREE.Quaternion();
const tmpQ2 = new THREE.Quaternion();

/** Rotate a bone about the WORLD X axis by `angle`, relative to its rest pose. Parent must already be posed. */
function setWorldX(bone: THREE.Bone, restLocal: THREE.Quaternion, angle: number) {
  const parent = bone.parent;
  if (!parent) return;
  const pw = worldQuat(parent, tmpQ);
  const qx = tmpQ2.setFromAxisAngle(X, angle);
  // local = pw^-1 * qx * pw * rest
  bone.quaternion.copy(pw).invert().multiply(qx).multiply(pw).multiply(restLocal);
}

/** Which app id a mesh belongs to: walk up to the exporter's node name, minus numeric suffixes. */
function ownerId(mesh: THREE.Object3D, ids: Set<string>): string | null {
  for (let o: THREE.Object3D | null = mesh; o; o = o.parent) {
    let n = o.name;
    while (/[._]?\d+$/.test(n)) n = n.replace(/[._]?\d+$/, "");
    if (ids.has(n) || n === "context-muscles" || n === "skeleton") return n;
  }
  return null;
}

/** Rest pose is captured once per loaded scene, so re-running the effect never re-reads a posed skeleton as rest. */
function getRig(scene: THREE.Group): Rig | null {
  if (scene.userData.rig !== undefined) return scene.userData.rig as Rig | null;
  const bones: Record<string, THREE.Bone> = {};
  const wanted = new Map(BONE_NAMES.map((n) => [gltfName(n), n]));
  scene.traverse((o) => {
    const key = wanted.get(o.name);
    if (key && (o as THREE.Bone).isBone) bones[key] = o as THREE.Bone;
  });
  const missing = BONE_NAMES.filter((n) => !bones[n]);
  let rig: Rig | null = null;
  if (missing.length) {
    console.warn("figure.glb is missing bones:", missing);
  } else {
    scene.updateMatrixWorld(true);
    const restQ: Record<string, THREE.Quaternion> = {};
    for (const n of BONE_NAMES) restQ[n] = bones[n].quaternion.clone();
    const wp = (b: THREE.Bone) => b.getWorldPosition(new THREE.Vector3());
    rig = {
      bones,
      restQ,
      restPelvisPos: bones.pelvis.position.clone(),
      ankle: wp(bones["foot.L"]),
      knee: wp(bones["shin.L"]),
      hip: wp(bones["thigh.L"]),
      pelvis: wp(bones.pelvis),
    };
  }
  scene.userData.rig = rig;
  return rig;
}

export default function AnatomyFigure({ exercise }: { exercise: Exercise }) {
  const { scene } = useGLTF(MODEL_URL);
  const ids = useMemo(() => new Set(exercise.muscles.map((m) => m.id)), [exercise]);

  // Everything mutated per frame lives here and is only touched in effects and useFrame.
  const live = useRef<Live | null>(null);

  useEffect(() => {
    const materials: Record<string, THREE.MeshStandardMaterial> = {};
    for (const id of ids) materials[id] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
    materials["context-muscles"] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
    materials.skeleton = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.8 });

    scene.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      const id = ownerId(mesh, ids);
      mesh.userData.muscleId = id;
      mesh.frustumCulled = false; // rest-pose bounds do not follow the skin
      if (id && materials[id]) mesh.material = materials[id];
      // Pointer picking transforms every vertex of a skinned mesh in JS. Only the
      // 21 targets are clickable; the 300k-vertex context and skeleton are not.
      if (!id || !ids.has(id)) mesh.raycast = () => {};
    });

    live.current = { materials, rig: getRig(scene) };
    return () => {
      for (const m of Object.values(materials)) m.dispose();
      live.current = null;
    };
  }, [scene, ids]);

  const setHovered = useViewer((s) => s.setHovered);
  const setSelected = useViewer((s) => s.setSelected);

  useFrame(() => {
    const l = live.current;
    if (!l) return;
    const { materials, rig } = l;
    const { t, hovered, selected } = useViewer.getState();

    // --- colours ---
    for (const m of exercise.muscles) {
      const mat = materials[m.id];
      if (!mat) continue;
      const level = levelAt(m.curve, t);
      mat.color.copy(cold).lerp(hot, level);
      const lit = hovered === m.id || selected === m.id;
      if (lit) mat.emissive.copy(highlight).multiplyScalar(0.35);
      else mat.emissive.copy(hot).multiplyScalar(level * 0.25);
      mat.opacity = selected !== null && !lit ? 0.12 : 1;
    }
    // Selecting a muscle also fades the resting muscles that may cover it; the skeleton stays as a reference.
    materials["context-muscles"].opacity = selected !== null ? 0.12 : 1;

    // --- pose ---
    if (!rig) return;
    const pose = exercise.motion ? poseAt(exercise.motion, t) : squatPose(t);
    const { bones, restQ } = rig;

    // Pelvis goes where the planted left leg puts it, then everything else is FK
    // from there. setWorldX takes the rotation RELATIVE to the parent's, so each
    // bone gets (its world angle) minus (its parent's world angle).
    const hipNew = rig.ankle.clone().add(rx(rig.knee.clone().sub(rig.ankle), pose.shin)).add(rx(rig.hip.clone().sub(rig.knee), pose.thigh));
    const pelvisNew = hipNew.sub(rx(rig.hip.clone().sub(rig.pelvis), pose.trunk));
    bones.pelvis.position.copy(rig.restPelvisPos).add(pelvisNew.sub(rig.pelvis));
    setWorldX(bones.pelvis, restQ.pelvis, pose.trunk);
    for (const S of ["L", "R"] as const) {
      setWorldX(bones[`thigh.${S}`], restQ[`thigh.${S}`], pose.thigh - pose.trunk);
      setWorldX(bones[`shin.${S}`], restQ[`shin.${S}`], pose.shin - pose.thigh);
      setWorldX(bones[`foot.${S}`], restQ[`foot.${S}`], -pose.shin); // feet stay flat
      setWorldX(bones[`upper_arm.${S}`], restQ[`upper_arm.${S}`], -pose.armFwd - pose.trunk);
    }
    setWorldX(bones.neck, restQ.neck, -pose.trunk * 0.8); // keep the gaze roughly level
  });

  return (
    <primitive
      object={scene}
      onPointerOver={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
        const id = e.object.userData.muscleId as string | null;
        if (!id || !ids.has(id)) return;
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
        if (!id || !ids.has(id)) return;
        e.stopPropagation();
        setSelected(id);
      }}
    />
  );
}

useGLTF.preload(MODEL_URL);
