import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { levelAt } from "@/lib/exercises/types";
import { BONE, COLD, HOT, HIGHLIGHT, muscleRgb } from "@/lib/palette";

/**
 * The exporter's node name a mesh belongs to, minus numeric suffixes: a muscle
 * id with its side ("gluteus-medius_L"), "context-muscles" or "skeleton".
 */
export function ownerName(mesh: THREE.Object3D): string {
  let top: THREE.Object3D = mesh;
  for (let o: THREE.Object3D | null = mesh; o && !(o as THREE.Bone).isBone && o.type !== "Scene"; o = o.parent) {
    if (o.name && !/^(Armature|Scene)(\.\d+)?$/.test(o.name)) top = o;
  }
  let n = top.name;
  while (/[._]?\d+$/.test(n)) n = n.replace(/[._]?\d+$/, "");
  return n;
}

/** "gluteus-medius_L" -> { id: "gluteus-medius", side: "L" }; an unsided name is its own id with side "L". */
export function splitSide(owner: string): { id: string; side: "L" | "R" } {
  const m = /^(.*)_(L|R)$/.exec(owner);
  return m ? { id: m[1], side: m[2] as "L" | "R" } : { id: owner, side: "L" };
}

export type FigureMaterials = Record<string, THREE.MeshStandardMaterial>;

const key = (id: string, side: "L" | "R") => `${id}_${side}`;

/**
 * One material per muscle side this exercise names, plus the resting context
 * and the skeleton, assigned to every skinned mesh by its owner name. Muscles
 * the exercise does not name render as resting and are not clickable.
 */
export function bindMaterials(scene: THREE.Group, ids: Set<string>): FigureMaterials {
  const materials: FigureMaterials = {};
  for (const id of ids) for (const side of ["L", "R"] as const) materials[key(id, side)] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
  materials["context-muscles"] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
  // Opaque on purpose: in focus mode bone is the one thing allowed to hide a
  // selected muscle (the owner's rule, 2026-09-11); other muscles never do.
  materials.skeleton = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.8 });
  scene.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const owner = ownerName(mesh);
    const { id, side } = splitSide(owner);
    mesh.frustumCulled = false; // rest-pose bounds do not follow the skin
    if (owner === "skeleton") {
      mesh.userData.muscleId = null;
      mesh.material = materials.skeleton;
    } else if (ids.has(id)) {
      mesh.userData.muscleId = id;
      mesh.material = materials[key(id, side)];
    } else {
      mesh.userData.muscleId = null;
      mesh.material = materials["context-muscles"];
    }
    // Pointer picking transforms every vertex of a skinned mesh in JS; only this exercise's muscles are clickable.
    if (!mesh.userData.muscleId) mesh.raycast = () => {};
  });
  return materials;
}

const hot = new THREE.Color(HOT);
const highlight = new THREE.Color(HIGHLIGHT);

/** Per-frame colours: activation ramp per side, hover/selection glow, and the focus fade. */
export function paintMaterials(materials: FigureMaterials, exercise: Exercise, t: number, hovered: string | null, selected: string | null) {
  for (const m of exercise.muscles) {
    for (const side of ["L", "R"] as const) {
      const mat = materials[key(m.id, side)];
      if (!mat) continue;
      const level = levelAt(side === "R" && m.right ? m.right : m.curve, t);
      const stretchCurve = side === "R" && m.stretchRight ? m.stretchRight : m.stretch;
      const stretch = stretchCurve ? levelAt(stretchCurve, t) : 0;
      const [r, g, b] = muscleRgb(level, stretch);
      mat.color.setRGB(r, g, b, THREE.SRGBColorSpace);
      const lit = hovered === m.id || selected === m.id;
      // A selected muscle keeps its activation colour (the owner wants to read it in focus mode, 2026-09-11): it only
      // glows a little in its own colour. The orange tint is for hovering, a passing cue.
      if (selected === m.id) mat.emissive.copy(mat.color).multiplyScalar(0.2);
      else if (lit) mat.emissive.copy(highlight).multiplyScalar(0.35);
      else mat.emissive.copy(hot).multiplyScalar(level * 0.25);
      const faded = selected !== null && !lit;
      mat.opacity = faded ? 0.12 : 1;
      // A faded muscle must not write depth: drawn before the selected one it
      // would still hide it (a clamshell's bent thigh over the abdomen did
      // exactly that). With depth off, a selected muscle is visible from every
      // angle through every other muscle; only the opaque skeleton can hide it.
      mat.depthWrite = !faded;
    }
  }
  materials["context-muscles"].opacity = selected !== null ? 0.12 : 1;
  materials["context-muscles"].depthWrite = selected === null;
}
