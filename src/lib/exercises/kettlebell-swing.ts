import type { CurvePoint, Exercise } from "./types";

// One kettlebell swing from a Mixamo clip, converted bone for bone: t = 0 is
// the bottom of the hinge with the bell behind the knees, t = 0.5 the top
// with the arms level, t = 1 the bottom again. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
// The hip drive: everything on the back of the body fires from the bottom to about a third of the way up.
const DRIVE = t([0, 0.55], [0.12, 1], [0.3, 0.7], [0.5, 0.3], [0.75, 0.5], [0.9, 0.8], [1, 0.55]);
const HINGE = t([0, 0.6], [0.15, 0.9], [0.4, 0.5], [0.5, 0.35], [0.8, 0.7], [1, 0.6]);
const BRACE = t([0, 0.5], [0.15, 0.7], [0.5, 0.7], [1, 0.5]);
const GRIP = t([0, 0.6], [0.5, 0.8], [1, 0.6]);
const ARMS = t([0, 0.3], [0.15, 0.6], [0.5, 0.5], [0.8, 0.6], [1, 0.3]);

export const kettlebellSwing: Exercise = {
  slug: "kettlebell-swing",
  category: "Legs and hips",
  name: "Kettlebell swing",
  durationMs: 2000, // the captured cycle at its real tempo
  anchor: "free",
  props: "kettlebell",
  credit: "Mixamo (Adobe)",
  native: { clip: "/models/clips/kettlebell-swing.glb" },
  camera: { position: [2.9, 1.4, 2.0], target: [0, 0.9, 0.1] },
  disclaimer:
    "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is a motion-capture clip; the bell's weight is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.",
  phases: [
    { name: "drive", t0: 0, t1: 0.35 },
    { name: "float", t0: 0.35, t1: 0.6 },
    { name: "hinge", t0: 0.6, t1: 1 },
  ],
  muscles: [
    { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hip hinge", role: "prime-mover", note: "Snaps the hips forward: the drive that sends the bell up.", curve: DRIVE },
    { id: "biceps-femoris", name: "Biceps femoris", group: "Hip hinge", role: "prime-mover", note: "Extends the hip with the glutes and loads like a spring in the hinge.", curve: DRIVE },
    { id: "semitendinosus", name: "Semitendinosus", group: "Hip hinge", role: "prime-mover", note: "Hip extension with biceps femoris.", curve: DRIVE },
    { id: "semimembranosus", name: "Semimembranosus", group: "Hip hinge", role: "prime-mover", note: "Hip extension with the other hamstrings.", curve: DRIVE },
    { id: "adductor-magnus", name: "Adductor magnus", group: "Hip hinge", role: "synergist", note: "Its hamstring-like part adds to the hip drive.", curve: HINGE },
    { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "synergist", note: "Holds the back flat through the hinge and drives the trunk up.", curve: HINGE },
    { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces at the top so the ribs do not flare.", curve: BRACE },
    { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk with rectus abdominis.", curve: BRACE },
    { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace through the whole swing.", curve: BRACE },
    { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Upper body", role: "synergist", note: "Keeps the bell close and guides it back into the hinge.", curve: ARMS },
    { id: "anterior-deltoid", name: "Anterior deltoid", group: "Upper body", role: "stabiliser", note: "The arms are a pendulum; the shoulders only steady them.", curve: ARMS },
    { id: "forearm-flexors", name: "Forearm flexors", group: "Upper body", role: "stabiliser", note: "Grip the handle.", curve: GRIP },
    { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "synergist", note: "Straightens the slightly bent knees on the drive.", curve: DRIVE },
    { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Legs", role: "stabiliser", note: "Keeps the feet rooted as the weight shifts.", curve: BRACE },
    { id: "gastrocnemius-lateral", name: "Gastrocnemius (lateral)", group: "Legs", role: "stabiliser", note: "Keeps the feet rooted as the weight shifts.", curve: BRACE },
  ],
};
