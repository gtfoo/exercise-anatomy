import type { CurvePoint, Exercise, MuscleActivation } from "./types";
import { LIGAMENTS } from "@/lib/ligaments";
import { TENDONS } from "@/lib/tendons";

/**
 * What every exercise page gets beyond its own file (owner, 2026-11-22: "now add them to the exercises"):
 *
 * - The ligaments and tendons at the joints the movement works, on their own tabs as on the atlas. A joint counts as
 *   worked when a muscle crossing it works hard enough for this exercise (MUSCLE_JOINTS, `score`); each joint brings
 *   its ligaments and tendons (JOINT_PARTS), each with its atlas note and a line naming this exercise's muscles that
 *   work that joint. Nothing here is activation: a ligament or tendon is shown, not coloured by a level.
 * - The tensor fasciae latae (a named muscle since 2026-11-22), which no exercise file lists: it abducts and steadies
 *   the hip with the gluteus medius, so where that muscle is listed it follows its curve at 70%; in the hip-flexion
 *   moves where it helps lift the thigh, it follows the rectus femoris at half. Qualitative, as every curve there.
 *
 * The atlas page is left as it is.
 */

type Joint = "neck" | "spine-thoracic" | "spine-lumbar" | "abdomen" | "pelvis" | "hip" | "knee" | "ankle" | "foot" | "shoulder" | "shoulder-girdle" | "elbow" | "forearm" | "wrist" | "hand";

/** The joints each muscle the figure names works across. */
const MUSCLE_JOINTS: Record<string, readonly Joint[]> = {
  "rectus-abdominis": ["spine-lumbar", "abdomen"],
  "external-obliques": ["spine-lumbar", "spine-thoracic", "abdomen"],
  "internal-obliques": ["spine-lumbar", "spine-thoracic", "abdomen"],
  "transversus-abdominis": ["spine-lumbar", "abdomen"],
  "erector-spinae": ["spine-lumbar", "spine-thoracic"],
  "vastus-lateralis": ["knee"],
  "vastus-medialis": ["knee"],
  "vastus-intermedius": ["knee"],
  "rectus-femoris": ["knee", "hip"],
  "biceps-femoris": ["knee", "hip"],
  semitendinosus: ["knee", "hip"],
  semimembranosus: ["knee", "hip"],
  "gluteus-maximus": ["hip", "pelvis"],
  "gluteus-medius": ["hip"],
  "gluteus-minimus": ["hip"],
  "tensor-fasciae-latae": ["hip", "knee"],
  "adductor-longus": ["hip"],
  "adductor-brevis": ["hip"],
  "adductor-magnus": ["hip"],
  gracilis: ["hip", "knee"],
  pectineus: ["hip"],
  "gastrocnemius-medial": ["ankle", "knee"],
  "gastrocnemius-lateral": ["ankle", "knee"],
  soleus: ["ankle"],
  "tibialis-anterior": ["ankle", "foot"],
  fibularis: ["ankle", "foot"],
  "anterior-deltoid": ["shoulder"],
  "middle-deltoid": ["shoulder"],
  "posterior-deltoid": ["shoulder"],
  supraspinatus: ["shoulder"],
  infraspinatus: ["shoulder"],
  "teres-minor": ["shoulder"],
  subscapularis: ["shoulder"],
  "teres-major": ["shoulder"],
  coracobrachialis: ["shoulder"],
  "pectoralis-major": ["shoulder"],
  "latissimus-dorsi": ["shoulder", "spine-lumbar"],
  "upper-trapezius": ["shoulder-girdle", "neck"],
  "middle-trapezius": ["shoulder-girdle"],
  "lower-trapezius": ["shoulder-girdle"],
  rhomboids: ["shoulder-girdle"],
  "serratus-anterior": ["shoulder-girdle"],
  "pectoralis-minor": ["shoulder-girdle"],
  "triceps-long-head": ["elbow", "shoulder"],
  "triceps-lateral-head": ["elbow"],
  "triceps-medial-head": ["elbow"],
  "biceps-brachii": ["elbow", "shoulder", "forearm"],
  brachialis: ["elbow"],
  brachioradialis: ["elbow", "forearm"],
  "forearm-flexors": ["wrist", "hand"],
  "forearm-extensors": ["wrist", "hand"],
};

/** What each joint brings: its ligaments and tendons, by their atlas ids (without the lig- / tendon- prefix). */
const JOINT_PARTS: Record<Joint, { name: string; ligaments: readonly string[]; tendons: readonly string[] }> = {
  neck: { name: "neck", ligaments: ["discs-cervical", "nuchal-ligament"], tendons: [] },
  "spine-thoracic": { name: "upper back", ligaments: ["discs-thoracic", "rib-joints"], tendons: [] },
  "spine-lumbar": { name: "lower back", ligaments: ["discs-lumbar", "anterior-longitudinal", "posterior-longitudinal", "ligamenta-flava", "spinous-ligaments"], tendons: ["thoracolumbar-fascia"] },
  abdomen: { name: "abdominal wall", ligaments: [], tendons: ["linea-alba", "inguinal-ligament"] },
  pelvis: { name: "pelvis", ligaments: ["sacro-iliac", "sacrotuberous", "pubic-symphysis"], tendons: [] },
  hip: { name: "hip", ligaments: ["iliofemoral", "hip-capsule", "acetabular-labrum", "ligament-head-femur"], tendons: ["it-band"] },
  knee: { name: "knee", ligaments: ["acl", "pcl", "mcl", "lcl", "medial-meniscus", "lateral-meniscus", "knee-capsule"], tendons: ["patellar-retinacula", "it-band"] },
  ankle: { name: "ankle", ligaments: ["lateral-ankle", "deltoid-ligament", "distal-tibiofibular", "subtalar"], tendons: ["achilles", "ankle-retinacula", "foot-tendon-sheaths"] },
  foot: { name: "foot", ligaments: ["plantar-ligaments", "midfoot-ligaments", "toe-joints"], tendons: ["plantar-fascia", "toe-extensor-tendons"] },
  shoulder: { name: "shoulder", ligaments: ["shoulder-capsule", "glenoid-labrum", "scapular-ligaments"], tendons: ["biceps-tendon-sheath"] },
  "shoulder-girdle": { name: "shoulder girdle", ligaments: ["acromioclavicular", "coracoclavicular", "sternoclavicular"], tendons: [] },
  elbow: { name: "elbow", ligaments: ["elbow-capsule", "elbow-ulnar-collateral", "elbow-radial-collateral"], tendons: [] },
  forearm: { name: "forearm", ligaments: ["forearm-membrane", "distal-radio-ulnar"], tendons: [] },
  wrist: { name: "wrist", ligaments: ["wrist", "carpal", "distal-radio-ulnar"], tendons: ["wrist-retinacula", "hand-tendon-sheaths"] },
  hand: { name: "hand", ligaments: ["finger-joints", "metacarpal"], tendons: ["palmar-aponeurosis"] },
};

const peak = (m: MuscleActivation) => Math.max(...m.curve.map(([, v]) => v), ...(m.right ?? []).map(([, v]) => v));

/**
 * How much a muscle works its joints in this exercise: its peak against the exercise's strongest muscle (an estimated
 * squat's levels run lower than a hand-drawn page's, and its glutes had fallen under a fixed cut), weighed by its role
 * (a stabiliser holds, it does not move the joint: a bench press's leg drive had listed the knee). A joint is shown
 * when one of its muscles scores WORKED.
 */
const ROLE_WEIGHT = { "prime-mover": 1, synergist: 0.8, stabiliser: 0.5 } as const;
const WORKED = 0.4; // at 0.5 the estimated squat lost its hip: its gluteus maximus peaks at 0.42 against a saturated vastus lateralis

const list = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

function connective(e: Exercise): Pick<Exercise, "ligaments" | "tendons"> {
  // The joints this movement works, each with the muscles that work it, strongest first.
  const top = Math.max(...e.muscles.map(peak), 1e-6);
  const score = (m: MuscleActivation) => (peak(m) / top) * ROLE_WEIGHT[m.role];
  const byJoint = new Map<Joint, MuscleActivation[]>();
  for (const m of e.muscles) {
    if (score(m) < WORKED) continue;
    for (const j of MUSCLE_JOINTS[m.id] ?? []) {
      if (!byJoint.has(j)) byJoint.set(j, []);
      byJoint.get(j)!.push(m);
    }
  }
  const lines = new Map<string, string>(); // part id -> the joint line its note gets
  for (const [j, ms] of byJoint) {
    const names = [...ms].sort((a, b) => score(b) - score(a)).slice(0, 3).map((m) => m.name.toLowerCase().replace(/^triceps, /, "triceps ").replace(/, /g, " "));
    const line = `Here the ${JOINT_PARTS[j].name} is moved or held by the ${list(names)}.`;
    for (const id of JOINT_PARTS[j].ligaments) if (!lines.has(`lig-${id}`)) lines.set(`lig-${id}`, line);
    for (const id of JOINT_PARTS[j].tendons) if (!lines.has(`tendon-${id}`)) lines.set(`tendon-${id}`, line);
  }
  const pick = <T extends { id: string; note: string }>(all: readonly T[]) => all.filter((p) => lines.has(p.id)).map((p) => ({ ...p, note: `${p.note} ${lines.get(p.id)}` }));
  const ligaments = pick(LIGAMENTS);
  const tendons = pick(TENDONS);
  return { ligaments: ligaments.length ? ligaments : undefined, tendons: tendons.length ? tendons : undefined };
}

const scaled = (c: readonly CurvePoint[] | undefined, k: number): CurvePoint[] | undefined => c?.map(([x, v]) => [x, v * k] as CurvePoint);

/** Where it helps lift the thigh rather than steady the hip: the hip-flexion moves without a gluteus medius. */
const TFL_FLEXION = new Set(["cycling", "flutter-kicks", "hanging-leg-raise", "straight-leg-raise", "straight-leg-hold", "v-up", "bicycle-crunch", "l-sit", "boat-pose", "hollow-hold", "sprint"]);

function withTensorFasciaeLatae(e: Exercise): Exercise {
  if (e.muscles.some((m) => m.id === "tensor-fasciae-latae")) return e;
  const gm = e.muscles.find((m) => m.id === "gluteus-medius");
  const rf = e.muscles.find((m) => m.id === "rectus-femoris");
  let tfl: MuscleActivation | null = null;
  if (gm) {
    tfl = {
      id: "tensor-fasciae-latae",
      name: "Tensor fasciae latae",
      group: "Gluteals",
      role: gm.role === "prime-mover" ? "synergist" : gm.role,
      note: "Abducts and steadies the hip with the gluteus medius, and tightens the iliotibial band down the outside of the thigh.",
      curve: scaled(gm.curve, 0.7)!,
      right: scaled(gm.right, 0.7),
    };
  } else if (rf && TFL_FLEXION.has(e.slug)) {
    tfl = {
      id: "tensor-fasciae-latae",
      name: "Tensor fasciae latae",
      group: "Gluteals",
      role: "synergist",
      note: "Helps the hip flexors lift the thigh, turning it slightly in, and tightens the iliotibial band.",
      curve: scaled(rf.curve, 0.5)!,
      right: scaled(rf.right, 0.5),
    };
  }
  return tfl ? { ...e, muscles: [...e.muscles, tfl] } : e;
}

/** An exercise as its page shows it: the tensor fasciae latae where it works, and the ligaments and tendons. */
export function enrichExercise(e: Exercise): Exercise {
  if (e.static) return e;
  const withTfl = withTensorFasciaeLatae(e);
  return { ...withTfl, ...connective(withTfl) };
}
