import type { CurvePoint, Exercise } from "./types";
import type { MotionClip3D } from "@/lib/kinematics/types";
import { withEstimatedActivation, type EstimatedActivation } from "./estimated";
import motion from "@/lib/motion/bodyweight-squat.json";
import motion3d from "@/lib/motion/bodyweight-squat-3d.json";
import estimated from "@/lib/activation/bodyweight-squat.json";

// Curves are qualitative: shape and relative ordering by role, not measured
// EMG. No muscle here carries a `source`, so the UI shows bands, never numbers.
//
// Within a group, muscles that do the same job in this movement share a curve
// on purpose. A difference between two curves is a claim, and it is only made
// where there is a mechanical reason for it (rectus femoris and gastrocnemius
// are both two-joint muscles that a bent hip or knee slackens; soleus is not).

const KNEE_EXTENSOR: CurvePoint[] = [[0, 0.15], [0.25, 0.45], [0.45, 0.9], [0.55, 1], [0.7, 0.8], [0.85, 0.4], [1, 0.15]];
const HIP_EXTENSOR: CurvePoint[] = [[0, 0.15], [0.25, 0.35], [0.45, 0.8], [0.55, 1], [0.7, 0.75], [0.85, 0.35], [1, 0.15]];
const HAMSTRING: CurvePoint[] = [[0, 0.1], [0.3, 0.3], [0.5, 0.4], [0.7, 0.4], [0.9, 0.2], [1, 0.1]];
const HIP_STABILISER: CurvePoint[] = [[0, 0.15], [0.3, 0.35], [0.5, 0.45], [0.7, 0.45], [0.9, 0.25], [1, 0.15]];
const MINOR_ADDUCTOR: CurvePoint[] = [[0, 0.1], [0.3, 0.2], [0.5, 0.3], [0.7, 0.3], [1, 0.1]];
const TWO_JOINT_CALF: CurvePoint[] = [[0, 0.1], [0.3, 0.2], [0.5, 0.25], [0.7, 0.25], [1, 0.1]];
const BRACE: CurvePoint[] = [[0, 0.1], [0.5, 0.3], [1, 0.1]];

// The hand-shaped baseline. Lower-limb muscles are then overridden by the
// OpenSim estimate (tools/opensim, run in CI); trunk muscles stay as written.
const baseline: Exercise = {
  slug: "bodyweight-squat",
  name: "Bodyweight squat",
  durationMs: 3200, // the OpenSim run analyses the rep at this tempo; keep the two in step
  // One captured rep (tools/mocap). `motion` (four sagittal angles) feeds the
  // activation estimate; `motion3d` (per-bone rotations from the same clip)
  // drives the figure. Remove both to fall back to the designed joint-angle function.
  motion,
  motion3d: motion3d as unknown as MotionClip3D, // JSON arrays are number[] to TypeScript; the extractor guarantees the shapes
  disclaimer:
    "Lower-limb activation is estimated by musculoskeletal simulation of the captured movement; trunk muscles are shown qualitatively by role. Nothing here is measured EMG. Educational illustration, not training or medical advice.",
  phases: [
    { name: "descent", t0: 0, t1: 0.42 },
    { name: "bottom", t0: 0.42, t1: 0.58 },
    { name: "ascent", t0: 0.58, t1: 1 },
  ],
  muscles: [
    // Quadriceps
    {
      id: "rectus-femoris",
      name: "Rectus femoris",
      group: "Quadriceps",
      role: "synergist",
      note: "Extends the knee but also flexes the hip, so a bent hip keeps it slack through the squat and it works less than the three vasti.",
      curve: [[0, 0.1], [0.25, 0.25], [0.45, 0.45], [0.55, 0.5], [0.7, 0.45], [0.85, 0.25], [1, 0.1]],
    },
    {
      id: "vastus-lateralis",
      name: "Vastus lateralis",
      group: "Quadriceps",
      role: "prime-mover",
      note: "Outer thigh. Extends the knee; work rises with knee flexion and peaks through the bottom and early ascent.",
      curve: KNEE_EXTENSOR,
    },
    {
      id: "vastus-medialis",
      name: "Vastus medialis",
      group: "Quadriceps",
      role: "prime-mover",
      note: "Inner thigh, low on the femur. Extends the knee; its oblique fibres also steer the kneecap as the knee straightens.",
      curve: KNEE_EXTENSOR,
    },
    {
      id: "vastus-intermedius",
      name: "Vastus intermedius",
      group: "Quadriceps",
      role: "prime-mover",
      note: "Deep, directly under rectus femoris. Extends the knee with the other vasti.",
      curve: KNEE_EXTENSOR,
    },

    // Gluteals
    {
      id: "gluteus-maximus",
      name: "Gluteus maximus",
      group: "Gluteals",
      role: "prime-mover",
      note: "Extends the hip. Loaded most at the bottom and driving out of it; the deeper the squat, the larger its share.",
      curve: HIP_EXTENSOR,
    },
    {
      id: "gluteus-medius",
      name: "Gluteus medius",
      group: "Gluteals",
      role: "stabiliser",
      note: "Upper, outer hip. Keeps the pelvis level and the knees tracking over the feet rather than caving in.",
      curve: HIP_STABILISER,
    },
    {
      id: "gluteus-minimus",
      name: "Gluteus minimus",
      group: "Gluteals",
      role: "stabiliser",
      note: "Deep under gluteus medius, same job: hip abduction and pelvic control.",
      curve: HIP_STABILISER,
    },

    // Hamstrings
    {
      id: "biceps-femoris",
      name: "Biceps femoris",
      group: "Hamstrings",
      role: "synergist",
      note: "Outer hamstring. Crosses hip and knee, so its length changes little through a squat — modest, steady work rather than a peak.",
      curve: HAMSTRING,
    },
    {
      id: "semitendinosus",
      name: "Semitendinosus",
      group: "Hamstrings",
      role: "synergist",
      note: "Inner hamstring, superficial. Same two-joint compromise as biceps femoris.",
      curve: HAMSTRING,
    },
    {
      id: "semimembranosus",
      name: "Semimembranosus",
      group: "Hamstrings",
      role: "synergist",
      note: "Inner hamstring, under semitendinosus.",
      curve: HAMSTRING,
    },

    // Adductors
    {
      id: "adductor-magnus",
      name: "Adductor magnus",
      group: "Adductors",
      role: "synergist",
      note: "The largest adductor, and a hip extensor from a flexed position — assists increasingly at depth.",
      curve: [[0, 0.1], [0.3, 0.3], [0.5, 0.7], [0.65, 0.6], [0.85, 0.25], [1, 0.1]],
    },
    {
      id: "adductor-longus",
      name: "Adductor longus",
      group: "Adductors",
      role: "stabiliser",
      note: "Front of the inner thigh. Controls the knee line and hip position; a minor contributor.",
      curve: MINOR_ADDUCTOR,
    },
    {
      id: "adductor-brevis",
      name: "Adductor brevis",
      group: "Adductors",
      role: "stabiliser",
      note: "Short and deep, behind adductor longus. Same minor stabilising role.",
      curve: MINOR_ADDUCTOR,
    },

    // Lower leg
    {
      id: "soleus",
      name: "Soleus",
      group: "Lower leg",
      role: "stabiliser",
      note: "Single-joint plantarflexor under the gastrocnemius. Does most of the ankle work when the knee is bent.",
      curve: [[0, 0.1], [0.3, 0.3], [0.5, 0.4], [0.7, 0.4], [1, 0.1]],
    },
    {
      id: "gastrocnemius-medial",
      name: "Gastrocnemius, medial head",
      group: "Lower leg",
      role: "stabiliser",
      note: "Crosses the knee as well as the ankle, so a bent knee slackens it and leaves the soleus to do the work.",
      curve: TWO_JOINT_CALF,
    },
    {
      id: "gastrocnemius-lateral",
      name: "Gastrocnemius, lateral head",
      group: "Lower leg",
      role: "stabiliser",
      note: "Same as the medial head: slackened by knee flexion.",
      curve: TWO_JOINT_CALF,
    },
    {
      id: "tibialis-anterior",
      name: "Tibialis anterior",
      group: "Lower leg",
      role: "stabiliser",
      note: "Front of the shin. Controls the forward travel of the shin over the foot on the way down.",
      curve: [[0, 0.1], [0.2, 0.3], [0.45, 0.35], [0.7, 0.25], [1, 0.1]],
    },

    // Trunk
    {
      id: "erector-spinae",
      name: "Erector spinae",
      group: "Trunk",
      role: "stabiliser",
      note: "Iliocostalis, longissimus and spinalis together. Hold the spine neutral against the forward lean; work rises with trunk inclination.",
      curve: [[0, 0.15], [0.3, 0.45], [0.5, 0.6], [0.7, 0.55], [0.9, 0.3], [1, 0.15]],
    },
    {
      id: "rectus-abdominis",
      name: "Rectus abdominis",
      group: "Trunk",
      role: "stabiliser",
      note: "Braces the front of the trunk. Low, steady, isometric.",
      curve: BRACE,
    },
    {
      id: "external-obliques",
      name: "External obliques",
      group: "Trunk",
      role: "stabiliser",
      note: "Sides of the trunk. Brace with the rest of the abdominal wall.",
      curve: BRACE,
    },
    {
      id: "transversus-abdominis",
      name: "Transversus abdominis",
      group: "Trunk",
      role: "stabiliser",
      note: "Deepest abdominal layer, wrapping the waist. Raises intra-abdominal pressure to stiffen the trunk.",
      curve: [[0, 0.15], [0.5, 0.3], [1, 0.15]],
    },
  ],
};

// The JSON's curves are number[][] to TypeScript; the pipeline guarantees [t, level] pairs.
export const squat: Exercise = withEstimatedActivation(baseline, estimated as unknown as EstimatedActivation);
