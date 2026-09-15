import type { CurvePoint, Exercise } from "./types";

// The everyday barbell lifts, designed (tools/myo/designed_clip.py) because no
// free capture exists: each is one rep, top to bottom to top (or bottom to
// top to bottom for the presses), the bar drawn between the hands. The load
// is not modelled. Activation is qualitative.

const t = (...pts: [number, number][]): CurvePoint[] => pts;
const DISCLAIMER =
  "Activation is shown qualitatively by role — prime mover, synergist, stabiliser. The movement is designed, not captured; the bar is drawn between the hands and its weight is not modelled. Nothing here is estimated or measured. Educational illustration, not training or medical advice.";
const lift = (slug: string, name: string, durationMs: number, camera: Exercise["camera"], phases: Exercise["phases"], muscles: Exercise["muscles"], extra: Partial<Exercise> = {}): Exercise => ({
  slug,
  category: "Weights",
  name,
  durationMs,
  anchor: "free",
  props: "barbell",
  native: { clip: `/models/clips/${slug}.glb` },
  camera,
  disclaimer: DISCLAIMER,
  phases,
  muscles,
  ...extra,
});
// A rep from the top: eccentric on the way down (t 0-0.5), hardest driving out of the bottom.
const HINGE = t([0, 0.35], [0.25, 0.55], [0.5, 0.9], [0.6, 1], [0.8, 0.7], [1, 0.35]);
const BRACE = t([0, 0.5], [0.5, 0.85], [0.7, 0.8], [1, 0.5]);
const LONG_AT_BOTTOM = t([0, 0.05], [0.3, 0.5], [0.5, 0.9], [0.7, 0.5], [1, 0.05]);
const GRIP = t([0, 0.6], [0.5, 0.9], [1, 0.6]);

export const deadlift = lift("deadlift", "Deadlift", 3200, { position: [3.2, 1.4, 2.0], target: [0, 0.8, -0.1] }, [
  { name: "lower", t0: 0, t1: 0.5 },
  { name: "pull", t0: 0.5, t1: 1 },
], [
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips", role: "prime-mover", note: "Extends the hips to stand the bar up; loaded on stretch at the bottom.", curve: HINGE, stretch: LONG_AT_BOTTOM },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hips", role: "prime-mover", note: "Hip extension with the glutes.", curve: HINGE, stretch: t([0, 0.05], [0.3, 0.4], [0.5, 0.7], [0.7, 0.4], [1, 0.05]) },
  { id: "semitendinosus", name: "Semitendinosus", group: "Hips", role: "prime-mover", note: "Hip extension with biceps femoris.", curve: HINGE, stretch: t([0, 0.05], [0.3, 0.4], [0.5, 0.7], [0.7, 0.4], [1, 0.05]) },
  { id: "semimembranosus", name: "Semimembranosus", group: "Hips", role: "synergist", note: "Hip extension with the other hamstrings.", curve: HINGE, stretch: t([0, 0.05], [0.3, 0.4], [0.5, 0.7], [0.7, 0.4], [1, 0.05]) },
  { id: "adductor-magnus", name: "Adductor magnus", group: "Hips", role: "synergist", note: "Its hamstring-like part extends the hip from the bottom.", curve: HINGE },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Knees", role: "prime-mover", note: "Straightens the knees off the floor.", curve: t([0, 0.3], [0.5, 0.95], [0.65, 0.8], [0.8, 0.5], [1, 0.3]) },
  { id: "vastus-medialis", name: "Vastus medialis", group: "Knees", role: "prime-mover", note: "Knee extension with the other vasti.", curve: t([0, 0.3], [0.5, 0.95], [0.65, 0.8], [0.8, 0.5], [1, 0.3]) },
  { id: "vastus-intermedius", name: "Vastus intermedius", group: "Knees", role: "synergist", note: "Deep knee extensor.", curve: t([0, 0.3], [0.5, 0.9], [0.65, 0.75], [0.8, 0.5], [1, 0.3]) },
  { id: "erector-spinae", name: "Erector spinae", group: "Back", role: "prime-mover", note: "Holds the spine rigid against the bar's lever the whole way.", curve: t([0, 0.5], [0.3, 0.85], [0.5, 1], [0.7, 0.9], [1, 0.5]) },
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "synergist", note: "Keeps the bar pulled in against the legs.", curve: BRACE },
  { id: "upper-trapezius", name: "Upper trapezius", group: "Back", role: "stabiliser", note: "Carries the bar's weight through the shoulder girdle.", curve: BRACE },
  { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "stabiliser", note: "Holds the shoulder blades from rounding.", curve: BRACE },
  { id: "rhomboids", name: "Rhomboids", group: "Back", role: "stabiliser", note: "Shoulder blade control with the middle trapezius.", curve: BRACE },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Grip", role: "stabiliser", note: "Grip the bar; the limiting muscle for many.", curve: GRIP },
  { id: "forearm-extensors", name: "Forearm extensors", group: "Grip", role: "stabiliser", note: "Hold the wrists straight against the grip.", curve: t([0, 0.4], [0.5, 0.6], [1, 0.4]) },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk with the back muscles.", curve: BRACE },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk.", curve: BRACE },
  { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", role: "stabiliser", note: "Deep brace.", curve: BRACE },
  { id: "soleus", name: "Soleus", group: "Lower leg", role: "stabiliser", note: "Keeps the weight over the mid-foot.", curve: t([0, 0.3], [0.5, 0.5], [1, 0.3]) },
]);

export const romanianDeadlift = lift("romanian-deadlift", "Romanian deadlift", 3600, { position: [3.2, 1.4, 2.0], target: [0, 0.8, 0] }, [
  { name: "hinge", t0: 0, t1: 0.5 },
  { name: "stand", t0: 0.5, t1: 1 },
], [
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "prime-mover", note: "The hinge is theirs: loaded on stretch at the bottom and pulling the hips through on the way up.", curve: HINGE, stretch: t([0, 0.05], [0.3, 0.6], [0.5, 0.95], [0.7, 0.6], [1, 0.05]) },
  { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "prime-mover", note: "Hip extension on stretch with biceps femoris.", curve: HINGE, stretch: t([0, 0.05], [0.3, 0.6], [0.5, 0.95], [0.7, 0.6], [1, 0.05]) },
  { id: "semimembranosus", name: "Semimembranosus", group: "Hamstrings", role: "prime-mover", note: "Hip extension on stretch.", curve: HINGE, stretch: t([0, 0.05], [0.3, 0.6], [0.5, 0.95], [0.7, 0.6], [1, 0.05]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hamstrings", role: "prime-mover", note: "Drives the hips forward to stand.", curve: HINGE, stretch: t([0, 0.05], [0.3, 0.4], [0.5, 0.7], [0.7, 0.4], [1, 0.05]) },
  { id: "adductor-magnus", name: "Adductor magnus", group: "Hamstrings", role: "synergist", note: "Hip extension from the hinge.", curve: HINGE },
  { id: "erector-spinae", name: "Erector spinae", group: "Back", role: "prime-mover", note: "Holds the back flat as the trunk hinges to near level: the largest lever in the gym.", curve: t([0, 0.4], [0.3, 0.85], [0.5, 1], [0.7, 0.9], [1, 0.4]) },
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "synergist", note: "Keeps the bar close to the legs as it slides down the shins.", curve: BRACE },
  { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "stabiliser", note: "Holds the shoulder blades back.", curve: BRACE },
  { id: "rhomboids", name: "Rhomboids", group: "Back", role: "stabiliser", note: "Shoulder blade control.", curve: BRACE },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Knees", role: "stabiliser", note: "Holds the soft knee angle still.", curve: t([0, 0.3], [0.5, 0.45], [1, 0.3]) },
  { id: "gastrocnemius-medial", name: "Gastrocnemius (medial)", group: "Lower leg", role: "stabiliser", note: "Lengthened a little as the hips go back over the heels.", curve: t([0, 0.25], [0.5, 0.35], [1, 0.25]), stretch: t([0, 0.05], [0.5, 0.35], [1, 0.05]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Grip", role: "stabiliser", note: "Grip the bar.", curve: GRIP },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk with the back.", curve: BRACE },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk.", curve: BRACE },
]);

// A press from the bottom: hardest driving off the chest or the shoulders (t 0-0.5), eccentric on the way back.
const PRESS = t([0, 0.8], [0.15, 1], [0.35, 0.7], [0.5, 0.4], [0.7, 0.55], [0.9, 0.75], [1, 0.8]);
const OPEN = t([0, 0.85], [0.25, 0.4], [0.5, 0.05], [0.75, 0.4], [1, 0.85]);

export const benchPress = lift("bench-press", "Bench press", 3000, { position: [2.8, 1.4, 2.2], target: [0, 0.75, 0] }, [
  { name: "press", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "prime-mover", note: "Presses the bar up and in from the chest; open and loaded at the bottom.", curve: PRESS, stretch: OPEN },
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Presses with the chest.", curve: PRESS, stretch: t([0, 0.7], [0.25, 0.3], [0.5, 0.05], [0.75, 0.3], [1, 0.7]) },
  { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Straightens the elbows, most at the lockout.", curve: t([0, 0.6], [0.2, 0.8], [0.45, 1], [0.5, 0.5], [0.75, 0.6], [1, 0.6]) },
  { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Elbow extension with the long head.", curve: t([0, 0.6], [0.2, 0.8], [0.45, 1], [0.5, 0.5], [0.75, 0.6], [1, 0.6]) },
  { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extension.", curve: t([0, 0.6], [0.2, 0.8], [0.45, 1], [0.5, 0.5], [0.75, 0.6], [1, 0.6]) },
  { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Steadies the shoulder blades against the bench.", curve: t([0, 0.4], [0.5, 0.55], [1, 0.4]) },
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "stabiliser", note: "Steadies the bar path from below.", curve: t([0, 0.5], [0.5, 0.35], [1, 0.5]) },
  { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "stabiliser", note: "Holds the shoulder blades pinched on the bench.", curve: t([0, 0.55], [1, 0.55]) },
  { id: "rhomboids", name: "Rhomboids", group: "Back", role: "stabiliser", note: "Shoulder blade control with the middle trapezius.", curve: t([0, 0.5], [1, 0.5]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar and hold the wrists.", curve: GRIP },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "stabiliser", note: "The leg drive: pressed into the floor through the feet.", curve: t([0, 0.5], [0.2, 0.7], [0.5, 0.4], [1, 0.5]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Legs", role: "stabiliser", note: "Leg drive with the glutes.", curve: t([0, 0.4], [0.2, 0.6], [0.5, 0.3], [1, 0.4]) },
], { scenery: { kind: "bench", top: 0.45, length: 1.3, z: -0.05 } });

export const overheadPress = lift("overhead-press", "Overhead press", 3000, { position: [3.0, 1.6, 2.0], target: [0, 1.2, 0] }, [
  { name: "press", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", role: "prime-mover", note: "Drives the bar up from the shoulders.", curve: PRESS },
  { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", role: "prime-mover", note: "Presses with the anterior fibres, more as the arms pass level.", curve: t([0, 0.6], [0.2, 0.9], [0.4, 0.8], [0.5, 0.4], [0.75, 0.55], [1, 0.6]) },
  { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", role: "prime-mover", note: "Locks the elbows overhead.", curve: t([0, 0.5], [0.3, 0.9], [0.48, 1], [0.55, 0.5], [1, 0.5]) },
  { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", role: "prime-mover", note: "Elbow extension with the long head.", curve: t([0, 0.5], [0.3, 0.9], [0.48, 1], [0.55, 0.5], [1, 0.5]) },
  { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", role: "prime-mover", note: "Deep elbow extension.", curve: t([0, 0.5], [0.3, 0.9], [0.48, 1], [0.55, 0.5], [1, 0.5]) },
  { id: "upper-trapezius", name: "Upper trapezius", group: "Shoulder", role: "synergist", note: "Shrugs and rotates the shoulder blades up as the bar passes the head.", curve: t([0, 0.3], [0.35, 0.8], [0.5, 0.9], [0.65, 0.7], [1, 0.3]) },
  { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", role: "synergist", note: "Upward rotation of the shoulder blades with the trapezius.", curve: t([0, 0.3], [0.35, 0.8], [0.5, 0.9], [0.65, 0.7], [1, 0.3]) },
  { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", role: "synergist", note: "Its upper fibres help the first part of the press.", curve: t([0, 0.6], [0.15, 0.7], [0.4, 0.3], [1, 0.6]) },
  { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", role: "stabiliser", note: "Seats the shoulder as the arm rises.", curve: t([0, 0.4], [0.3, 0.7], [0.5, 0.5], [1, 0.4]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar and hold the wrists.", curve: GRIP },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk so the back does not arch under the bar.", curve: BRACE },
  { id: "external-obliques", name: "External obliques", group: "Trunk", role: "stabiliser", note: "Brace the trunk.", curve: BRACE },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the spine upright under the load.", curve: BRACE },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Legs", role: "stabiliser", note: "Squeezed to keep the pelvis level under the bar.", curve: t([0, 0.4], [1, 0.4]) },
]);

// A row from hanging arms: hardest pulling to the chest (t 0-0.5), lowered under control.
const ROW = t([0, 0.3], [0.2, 0.7], [0.4, 1], [0.5, 0.9], [0.7, 0.6], [1, 0.3]);

export const barbellRow = lift("barbell-row", "Barbell row", 3000, { position: [3.2, 1.4, 2.0], target: [0, 0.8, 0.1] }, [
  { name: "pull", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", role: "prime-mover", note: "Pulls the elbows back and the bar to the body.", curve: ROW },
  { id: "teres-major", name: "Teres major", group: "Back", role: "synergist", note: "Pulls with the lat.", curve: ROW },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Back", role: "prime-mover", note: "Drives the elbows back.", curve: ROW },
  { id: "middle-trapezius", name: "Middle trapezius", group: "Back", role: "prime-mover", note: "Squeezes the shoulder blades together at the top.", curve: t([0, 0.3], [0.3, 0.7], [0.5, 1], [0.7, 0.6], [1, 0.3]) },
  { id: "rhomboids", name: "Rhomboids", group: "Back", role: "prime-mover", note: "Retraction with the middle trapezius.", curve: t([0, 0.3], [0.3, 0.7], [0.5, 1], [0.7, 0.6], [1, 0.3]) },
  { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", role: "synergist", note: "Bends the elbows on the pull.", curve: ROW },
  { id: "brachialis", name: "Brachialis", group: "Arm", role: "synergist", note: "Elbow flexion under the biceps.", curve: ROW },
  { id: "brachioradialis", name: "Brachioradialis", group: "Arm", role: "synergist", note: "Elbow flexion with the overhand grip.", curve: ROW },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", role: "stabiliser", note: "Grip the bar.", curve: GRIP },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "prime-mover", note: "Holds the hinged trunk still against the bar's lever the whole set.", curve: t([0, 0.8], [0.5, 0.95], [1, 0.8]) },
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Hips", role: "stabiliser", note: "Holds the hinge.", curve: t([0, 0.55], [1, 0.55]) },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hips", role: "stabiliser", note: "Holds the hinge with the glutes; on stretch.", curve: t([0, 0.5], [1, 0.5]), stretch: t([0, 0.6], [1, 0.6]) },
  { id: "semitendinosus", name: "Semitendinosus", group: "Hips", role: "stabiliser", note: "Holds the hinge; on stretch.", curve: t([0, 0.45], [1, 0.45]), stretch: t([0, 0.6], [1, 0.6]) },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Braces the trunk.", curve: t([0, 0.5], [1, 0.5]) },
]);

export const hipThrust = lift("hip-thrust", "Hip thrust", 2600, { position: [3.0, 1.3, 2.2], target: [0, 0.5, 0] }, [
  { name: "drive", t0: 0, t1: 0.5 },
  { name: "lower", t0: 0.5, t1: 1 },
], [
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", role: "prime-mover", note: "Drives the hips up to level and squeezes at the top: the lift is theirs.", curve: t([0, 0.4], [0.3, 0.85], [0.5, 1], [0.7, 0.7], [1, 0.4]) },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", role: "synergist", note: "Keeps the knees from falling in.", curve: t([0, 0.3], [0.5, 0.6], [1, 0.3]) },
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", role: "synergist", note: "Hip extension with the glutes.", curve: t([0, 0.3], [0.5, 0.7], [1, 0.3]) },
  { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", role: "synergist", note: "Hip extension.", curve: t([0, 0.3], [0.5, 0.65], [1, 0.3]) },
  { id: "adductor-magnus", name: "Adductor magnus", group: "Hamstrings", role: "synergist", note: "Hip extension from the bottom.", curve: t([0, 0.3], [0.5, 0.6], [1, 0.3]) },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", role: "synergist", note: "Holds the knees at a right angle over the feet.", curve: t([0, 0.3], [0.5, 0.5], [1, 0.3]) },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", role: "stabiliser", note: "Holds the trunk straight from the bench.", curve: t([0, 0.4], [0.5, 0.5], [1, 0.4]) },
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", role: "stabiliser", note: "Tucks the ribs so the lift comes from the hips, not the lower back.", curve: t([0, 0.4], [0.5, 0.6], [1, 0.4]) },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Arms", role: "stabiliser", note: "Steady the bar on the hips.", curve: t([0, 0.4], [1, 0.4]) },
  { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", role: "stabiliser", note: "Lengthened at the top as the hips reach full extension.", curve: t([0, 0.2], [1, 0.2]), stretch: t([0, 0.05], [0.5, 0.5], [1, 0.05]) },
], { scenery: { kind: "bench", top: 0.45, length: 1.0, z: -0.62 } });
