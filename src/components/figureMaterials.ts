import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { levelAt } from "@/lib/exercises/types";
import { BONE, COLD, HOT, HIGHLIGHT } from "@/lib/palette";

/** The exporter's node name a mesh belongs to, minus numeric suffixes: a muscle id, "context-muscles" or "skeleton". */
export function ownerName(mesh: THREE.Object3D): string {
  let top: THREE.Object3D = mesh;
  for (let o: THREE.Object3D | null = mesh; o && !(o as THREE.Bone).isBone && o.type !== "Scene"; o = o.parent) {
    if (o.name && !/^(Armature|Scene)(\.\d+)?$/.test(o.name)) top = o;
  }
  let n = top.name;
  while (/[._]?\d+$/.test(n)) n = n.replace(/[._]?\d+$/, "");
  return n;
}

export type FigureMaterials = Record<string, THREE.MeshStandardMaterial>;

/**
 * One material per muscle this exercise names, plus the resting context and the
 * skeleton, assigned to every skinned mesh by its owner name. Muscles the
 * exercise does not name render as resting and are not clickable.
 */
export function bindMaterials(scene: THREE.Group, ids: Set<string>): FigureMaterials {
  const materials: FigureMaterials = {};
  for (const id of ids) materials[id] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
  materials["context-muscles"] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
  materials.skeleton = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.8 });
  scene.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const owner = ownerName(mesh);
    mesh.frustumCulled = false; // rest-pose bounds do not follow the skin
    if (owner === "skeleton") {
      mesh.userData.muscleId = null;
      mesh.material = materials.skeleton;
    } else if (ids.has(owner)) {
      mesh.userData.muscleId = owner;
      mesh.material = materials[owner];
    } else {
      mesh.userData.muscleId = null;
      mesh.material = materials["context-muscles"];
    }
    // Pointer picking transforms every vertex of a skinned mesh in JS; only this exercise's muscles are clickable.
    if (!mesh.userData.muscleId) mesh.raycast = () => {};
  });
  return materials;
}

const cold = new THREE.Color(COLD);
const hot = new THREE.Color(HOT);
const highlight = new THREE.Color(HIGHLIGHT);

/** Per-frame colours: activation ramp, hover/selection glow, and the focus fade. */
export function paintMaterials(materials: FigureMaterials, exercise: Exercise, t: number, hovered: string | null, selected: string | null) {
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
  materials["context-muscles"].opacity = selected !== null ? 0.12 : 1;
}
