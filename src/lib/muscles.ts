/**
 * Every named muscle the figure carries (tools/blender/build_figure.py
 * TARGETS), with a display name, the group it is listed under and one line
 * on what it does. The atlas page lists all of them; exercise pages list a
 * subset with roles and curves.
 */
export type MuscleInfo = { id: string; name: string; group: string; note: string };

export const MUSCLES: readonly MuscleInfo[] = [
  // Quadriceps
  { id: "rectus-femoris", name: "Rectus femoris", group: "Quadriceps", note: "Two-joint muscle down the front of the thigh: extends the knee and flexes the hip." },
  { id: "vastus-lateralis", name: "Vastus lateralis", group: "Quadriceps", note: "Outer quadriceps; the largest knee extensor." },
  { id: "vastus-medialis", name: "Vastus medialis", group: "Quadriceps", note: "Inner quadriceps; extends the knee and steers the kneecap." },
  { id: "vastus-intermedius", name: "Vastus intermedius", group: "Quadriceps", note: "Deep knee extensor under rectus femoris." },
  // Gluteals
  { id: "gluteus-maximus", name: "Gluteus maximus", group: "Gluteals", note: "The largest hip extensor: standing up, climbing, driving forward." },
  { id: "gluteus-medius", name: "Gluteus medius", group: "Gluteals", note: "Abducts the hip and levels the pelvis when standing on one leg." },
  { id: "gluteus-minimus", name: "Gluteus minimus", group: "Gluteals", note: "Deep to gluteus medius; abducts and steadies the hip." },
  // Hamstrings
  { id: "biceps-femoris", name: "Biceps femoris", group: "Hamstrings", note: "Outer hamstring: extends the hip and flexes the knee." },
  { id: "semitendinosus", name: "Semitendinosus", group: "Hamstrings", note: "Inner hamstring: extends the hip and flexes the knee." },
  { id: "semimembranosus", name: "Semimembranosus", group: "Hamstrings", note: "Deep inner hamstring; hip extension and knee flexion." },
  // Adductors
  { id: "adductor-magnus", name: "Adductor magnus", group: "Adductors", note: "The largest adductor; its back part also extends the hip." },
  { id: "adductor-longus", name: "Adductor longus", group: "Adductors", note: "Pulls the thigh inward and helps flex the hip." },
  { id: "adductor-brevis", name: "Adductor brevis", group: "Adductors", note: "Short adductor deep to adductor longus." },
  { id: "pectineus", name: "Pectineus", group: "Adductors", note: "Top of the inner thigh: adducts and helps flex the hip." },
  { id: "gracilis", name: "Gracilis", group: "Adductors", note: "Long strap down the inner thigh: adducts the hip and helps bend the knee." },
  // Lower leg
  { id: "gastrocnemius-medial", name: "Gastrocnemius, medial head", group: "Lower leg", note: "Inner calf: points the foot and helps bend the knee." },
  { id: "gastrocnemius-lateral", name: "Gastrocnemius, lateral head", group: "Lower leg", note: "Outer calf: points the foot and helps bend the knee." },
  { id: "soleus", name: "Soleus", group: "Lower leg", note: "Deep calf muscle under gastrocnemius; the main ankle plantarflexor when the knee is bent." },
  { id: "tibialis-anterior", name: "Tibialis anterior", group: "Lower leg", note: "Front of the shin: lifts the foot and toes." },
  { id: "fibularis", name: "Fibularis longus and brevis", group: "Lower leg", note: "Outside of the lower leg: turn the sole outward and steady the ankle." },
  // Trunk
  { id: "rectus-abdominis", name: "Rectus abdominis", group: "Trunk", note: "The six-pack: flexes the trunk and braces the abdomen." },
  { id: "external-obliques", name: "External obliques", group: "Trunk", note: "Side abdominals: rotate and side-bend the trunk, brace the core." },
  { id: "internal-obliques", name: "Internal obliques", group: "Trunk", note: "Under the external obliques, fibres the other way: rotate and brace with them." },
  { id: "transversus-abdominis", name: "Transversus abdominis", group: "Trunk", note: "Deepest abdominal; a corset that stiffens the trunk." },
  { id: "erector-spinae", name: "Erector spinae", group: "Trunk", note: "Long muscles either side of the spine that hold it upright and extend it." },
  // Back and shoulder blade
  { id: "latissimus-dorsi", name: "Latissimus dorsi", group: "Back", note: "Broad back muscle: pulls the arm down and back, as in a pull-up." },
  { id: "teres-major", name: "Teres major", group: "Back", note: "Small helper of the lat from the shoulder blade to the upper arm." },
  { id: "upper-trapezius", name: "Upper trapezius", group: "Back", note: "Shrugs and rotates the shoulder blade upward." },
  { id: "middle-trapezius", name: "Middle trapezius", group: "Back", note: "Pulls the shoulder blades together." },
  { id: "lower-trapezius", name: "Lower trapezius", group: "Back", note: "Pulls the shoulder blade down and helps rotate it upward." },
  { id: "rhomboids", name: "Rhomboids", group: "Back", note: "Between the shoulder blades: retract and steady them." },
  // Shoulder
  { id: "anterior-deltoid", name: "Anterior deltoid", group: "Shoulder", note: "Front of the shoulder: raises the arm forward." },
  { id: "middle-deltoid", name: "Middle deltoid", group: "Shoulder", note: "Cap of the shoulder: raises the arm out to the side." },
  { id: "posterior-deltoid", name: "Posterior deltoid", group: "Shoulder", note: "Back of the shoulder: draws the arm backward." },
  { id: "supraspinatus", name: "Supraspinatus", group: "Shoulder", note: "Rotator cuff: starts the arm's lift to the side and seats the joint." },
  { id: "infraspinatus", name: "Infraspinatus", group: "Shoulder", note: "Rotator cuff: rotates the arm outward and steadies the joint." },
  { id: "teres-minor", name: "Teres minor", group: "Shoulder", note: "Rotator cuff: outward rotation with infraspinatus." },
  { id: "subscapularis", name: "Subscapularis", group: "Shoulder", note: "The fourth rotator cuff muscle, on the front of the shoulder blade: rotates the arm inward and holds the joint." },
  { id: "serratus-anterior", name: "Serratus anterior", group: "Shoulder", note: "Finger-like slips on the side of the ribs: pull the shoulder blade forward and pin it to the ribcage." },
  { id: "pectoralis-major", name: "Pectoralis major", group: "Chest", note: "The chest: brings the arm forward and across the body." },
  { id: "pectoralis-minor", name: "Pectoralis minor", group: "Chest", note: "Under pectoralis major: pulls the shoulder blade forward and down." },
  // Arm
  { id: "biceps-brachii", name: "Biceps brachii", group: "Arm", note: "Front of the upper arm: bends the elbow and turns the palm up." },
  { id: "brachialis", name: "Brachialis", group: "Arm", note: "Under the biceps; the strongest elbow flexor." },
  { id: "brachioradialis", name: "Brachioradialis", group: "Arm", note: "From the upper arm to the wrist; bends the elbow in a neutral grip." },
  { id: "triceps-long-head", name: "Triceps, long head", group: "Arm", note: "Back of the upper arm: straightens the elbow, and crosses the shoulder to pull the arm back." },
  { id: "triceps-lateral-head", name: "Triceps, lateral head", group: "Arm", note: "Outer head of the triceps: straightens the elbow." },
  { id: "triceps-medial-head", name: "Triceps, medial head", group: "Arm", note: "Deep head of the triceps: straightens the elbow, working in every extension." },
  { id: "coracobrachialis", name: "Coracobrachialis", group: "Arm", note: "Small muscle inside the upper arm: helps lift the arm forward and draw it in." },
  { id: "forearm-flexors", name: "Forearm flexors", group: "Arm", note: "Front of the forearm: close the hand and flex the wrist." },
  { id: "forearm-extensors", name: "Forearm extensors", group: "Arm", note: "Back of the forearm: open the hand and extend the wrist, and hold it steady against the flexors in a grip." },
];
