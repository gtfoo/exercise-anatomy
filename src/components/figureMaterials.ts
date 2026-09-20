import * as THREE from "three";
import type { Exercise } from "@/lib/exercises/types";
import { levelAt } from "@/lib/exercises/types";
import { BONE, COLD, HOT, HIGHLIGHT, muscleRgb } from "@/lib/palette";

/**
 * The exporter's node name a mesh belongs to, minus numeric suffixes: a muscle
 * id with its side ("gluteus-medius_L"), a bone group ("bone-femur_L",
 * "bone-sacrum"), "context-muscles" or "skeleton".
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
const isBone = (id: string) => id.startsWith("bone-") || id === "skeleton";

/**
 * One material per muscle side this exercise names, one per bone group it
 * lists, plus the resting context and the rest of the skeleton, assigned to
 * every skinned mesh by its owner name. Muscles the exercise does not name
 * render as resting and are not clickable; bones it does not list render as
 * plain skeleton and are not clickable either.
 */
export function bindMaterials(scene: THREE.Group, ids: Set<string>, boneIds: Set<string> = new Set()): FigureMaterials {
  const materials: FigureMaterials = {};
  for (const id of ids) for (const side of ["L", "R"] as const) materials[key(id, side)] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
  materials["context-muscles"] = new THREE.MeshStandardMaterial({ color: COLD, roughness: 0.62, transparent: true });
  // Opaque on purpose: in focus mode bone is the one thing allowed to hide a
  // selected muscle (the owner's rule, 2026-09-11); other muscles never do.
  materials.skeleton = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.8 });
  for (const id of boneIds) for (const side of ["L", "R"] as const) materials[key(id, side)] = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.8 });
  scene.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const owner = ownerName(mesh);
    const { id, side } = splitSide(owner);
    mesh.frustumCulled = false; // rest-pose bounds do not follow the skin
    if (isBone(id)) {
      const named = boneIds.has(id);
      mesh.userData.partId = named ? id : null;
      mesh.material = named ? materials[key(id, side)] : materials.skeleton;
    } else if (ids.has(id)) {
      mesh.userData.partId = id;
      mesh.material = materials[key(id, side)];
    } else {
      mesh.userData.partId = null;
      mesh.material = materials["context-muscles"];
    }
    // Pointer picking transforms every vertex of a skinned mesh in JS; only this page's named parts are clickable.
    if (!mesh.userData.partId) mesh.raycast = () => {};
  });
  return materials;
}

const hot = new THREE.Color(HOT);
const highlight = new THREE.Color(HIGHLIGHT);
const bone = new THREE.Color(BONE);

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
      // On the atlas nothing is working, so a selected muscle would stay off-white against off-white bone: paint it
      // the working red instead (owner, 2026-09-11), and glow a little so it reads through the skeleton's shading.
      if (selected === m.id && exercise.static) {
        mat.color.copy(hot);
        mat.emissive.copy(hot).multiplyScalar(0.3);
      } else if (selected === m.id) mat.emissive.copy(mat.color).multiplyScalar(0.2);
      else if (lit) mat.emissive.copy(highlight).multiplyScalar(0.35);
      else mat.emissive.copy(hot).multiplyScalar(level * 0.25);
      // A selected bone fades the muscles too, so it can be seen through them.
      const faded = selected !== null && !lit;
      mat.opacity = faded ? 0.12 : 1;
      // A faded muscle must not write depth: drawn before the selected one it
      // would still hide it (a clamshell's bent thigh over the abdomen did
      // exactly that). With depth off, a selected muscle is visible from every
      // angle through every other muscle; only the opaque skeleton can hide it.
      mat.depthWrite = !faded;
    }
  }
  const ghost = selected !== null || (exercise.muscles.length === 0 && (exercise.bones?.length ?? 0) > 0);
  materials["context-muscles"].opacity = ghost ? 0.12 : 1;
  materials["context-muscles"].depthWrite = !ghost;
  // Bones stay opaque and bone-coloured whatever is selected; a selected bone is painted the working red, a hovered one
  // glows orange, so a rib cage or a femur reads against the rest of the skeleton.
  for (const b of exercise.bones ?? []) {
    for (const side of ["L", "R"] as const) {
      const mat = materials[key(b.id, side)];
      if (!mat) continue;
      if (selected === b.id) {
        mat.color.copy(hot);
        mat.emissive.copy(hot).multiplyScalar(0.3);
      } else {
        mat.color.copy(bone);
        mat.emissive.copy(highlight).multiplyScalar(hovered === b.id ? 0.35 : 0);
      }
    }
  }
}
