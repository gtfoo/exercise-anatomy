/**
 * The nerves that supply the figure's named muscles, for the atlas's Nerves tab (owner, 2026-11-22: add nerves).
 *
 * The figure has no nerve to draw: Z-Anatomy models none of the peripheral nerves, only files each muscle under the
 * nerve that supplies it (its "Spinal nerves" collections). So a nerve here is shown through its muscles: picking one
 * lights every named muscle it supplies, in the working red, and those it supplies only in part in a paler red. The
 * card line on each muscle (src/lib/innervation.ts) says the same thing from the muscle's side; the two lists are
 * kept in step (every muscle is supplied in full by exactly one nerve here).
 *
 * Spinal roots and courses are the usual textbook pattern; they vary a little between people.
 */
export type NerveInfo = {
  id: string;
  name: string;
  group: string;
  note: string;
  /** Muscles (src/lib/muscles.ts ids) this nerve supplies wholly, or as their main supply. */
  muscles: readonly string[];
  /** Muscles it supplies only in part: one head, one part, or a minor share. */
  partly?: readonly string[];
};

const nv = (id: string, name: string, group: string, note: string, muscles: string[], partly?: string[]): NerveInfo => ({ id: `nerve-${id}`, name, group, note, muscles, partly });

export const NERVES: readonly NerveInfo[] = [
  // Neck
  nv("accessory", "Accessory nerve (XI)", "Neck", "The eleventh cranial nerve, though its fibres start in the upper spinal cord: it climbs into the skull and leaves again to cross the side of the neck to the trapezius and the sternocleidomastoid.", ["upper-trapezius", "middle-trapezius", "lower-trapezius"]),
  // Shoulder and arm
  nv("dorsal-scapular", "Dorsal scapular nerve", "Shoulder and arm", "From the C5 root of the brachial plexus, down the inner edge of the shoulder blade to the rhomboids and the levator scapulae.", ["rhomboids"]),
  nv("long-thoracic", "Long thoracic nerve", "Shoulder and arm", "From the C5 to C7 roots, down the side of the chest wall on the serratus anterior; if it is injured the shoulder blade lifts off the ribs (a winged scapula).", ["serratus-anterior"]),
  nv("suprascapular", "Suprascapular nerve", "Shoulder and arm", "From the upper trunk of the brachial plexus (C5, C6), through the notch on top of the shoulder blade to the supraspinatus and round its spine to the infraspinatus.", ["supraspinatus", "infraspinatus"]),
  nv("pectoral", "Pectoral nerves", "Shoulder and arm", "The lateral (C5 to C7) and medial (C8, T1) pectoral nerves, from the cords of the brachial plexus into the chest muscles from behind.", ["pectoralis-major", "pectoralis-minor"]),
  nv("subscapular", "Subscapular nerves", "Shoulder and arm", "The upper and lower subscapular nerves (C5, C6), from the posterior cord of the brachial plexus onto the front of the shoulder blade.", ["subscapularis", "teres-major"]),
  nv("thoracodorsal", "Thoracodorsal nerve", "Shoulder and arm", "From the posterior cord of the brachial plexus (C6 to C8), down the back wall of the armpit into the latissimus dorsi.", ["latissimus-dorsi"]),
  nv("axillary", "Axillary nerve", "Shoulder and arm", "From the posterior cord of the brachial plexus (C5, C6), it wraps round the neck of the humerus behind the shoulder to the deltoid and teres minor; a dislocated shoulder can stretch it.", ["anterior-deltoid", "middle-deltoid", "posterior-deltoid", "teres-minor"]),
  nv("musculocutaneous", "Musculocutaneous nerve", "Shoulder and arm", "From the lateral cord of the brachial plexus (C5 to C7), it pierces the coracobrachialis and runs between the biceps and the brachialis, then carries on as a skin nerve of the forearm.", ["biceps-brachii", "brachialis", "coracobrachialis"]),
  nv("radial", "Radial nerve", "Shoulder and arm", "The largest branch of the brachial plexus (C5 to T1): it spirals round the back of the humerus to every muscle that straightens the elbow, wrist and fingers. Injured in that groove, the wrist drops.", ["triceps-long-head", "triceps-lateral-head", "triceps-medial-head", "brachioradialis", "forearm-extensors"], ["brachialis"]),
  nv("median", "Median nerve", "Shoulder and arm", "From the lateral and medial cords (C5 to T1), down the middle of the arm and forearm to most of the wrist and finger flexors, then through the carpal tunnel to the thumb's muscles; pressure there is carpal tunnel syndrome.", ["forearm-flexors"]),
  nv("ulnar", "Ulnar nerve", "Shoulder and arm", "From the medial cord (C8, T1), behind the inner bump of the elbow (the funny bone) to the flexor carpi ulnaris and half of the deep finger flexor, then on to most of the small muscles of the hand.", [], ["forearm-flexors"]),
  // Trunk
  nv("thoracoabdominal", "Thoracoabdominal and subcostal nerves", "Trunk", "The lower intercostal nerves (T7 to T11) and the subcostal nerve (T12): they run round the body wall between the internal oblique and the transversus to all four abdominal muscles, in bands from the ribs down.", ["rectus-abdominis", "external-obliques", "internal-obliques", "transversus-abdominis"]),
  nv("iliohypogastric", "Iliohypogastric and ilioinguinal nerves", "Trunk", "From L1, at the top of the lumbar plexus: they supply the lowest fibres of the internal oblique and the transversus above the groin.", [], ["internal-obliques", "transversus-abdominis"]),
  nv("posterior-rami", "Posterior rami of the spinal nerves", "Trunk", "The back branch of every spinal nerve, as it leaves the spine: each supplies the deep back muscles and the skin at its own level, so the erector spinae is supplied segment by segment.", ["erector-spinae"]),
  // Hip and leg
  nv("superior-gluteal", "Superior gluteal nerve", "Hip and leg", "From the sacral plexus (L4 to S1), out of the pelvis above the piriformis to the gluteus medius and minimus and the tensor fasciae latae; if it fails, the pelvis drops on the other side with each step.", ["gluteus-medius", "gluteus-minimus", "tensor-fasciae-latae"]),
  nv("inferior-gluteal", "Inferior gluteal nerve", "Hip and leg", "From the sacral plexus (L5 to S2), out of the pelvis below the piriformis into the gluteus maximus alone.", ["gluteus-maximus"]),
  nv("femoral", "Femoral nerve", "Hip and leg", "The largest branch of the lumbar plexus (L2 to L4): under the inguinal ligament into the front of the thigh, to the quadriceps, the sartorius and the pectineus.", ["rectus-femoris", "vastus-lateralis", "vastus-medialis", "vastus-intermedius", "pectineus"]),
  nv("obturator", "Obturator nerve", "Hip and leg", "From the lumbar plexus (L2 to L4), through the hole in the hip bone (the obturator foramen) to the adductors on the inside of the thigh.", ["adductor-longus", "adductor-brevis", "adductor-magnus", "gracilis"], ["pectineus"]),
  nv("sciatic", "Sciatic nerve", "Hip and leg", "The thickest nerve of the body (L4 to S3): out under the gluteus maximus, down the back of the thigh to the hamstrings, then it splits above the knee into the tibial and common fibular nerves. Sciatica is pain along its course.", ["biceps-femoris", "semitendinosus", "semimembranosus"], ["adductor-magnus"]),
  nv("tibial", "Tibial nerve", "Hip and leg", "The sciatic nerve's larger half (L4 to S3): through the back of the knee to the calf muscles, then behind the inner ankle into the sole.", ["gastrocnemius-medial", "gastrocnemius-lateral", "soleus"]),
  nv("deep-fibular", "Deep fibular nerve", "Hip and leg", "A branch of the common fibular nerve, which winds round the neck of the fibula just below the knee: it runs down the front of the shin to the muscles that lift the foot and toes. Hurt where it winds, the foot drops.", ["tibialis-anterior"]),
  nv("superficial-fibular", "Superficial fibular nerve", "Hip and leg", "The common fibular nerve's other branch, down the outside of the shin to the fibularis muscles and then the skin on top of the foot.", ["fibularis"]),
];

/** The nerve that supplies a muscle in full: what clicking a muscle on the Nerves tab selects. */
export const nerveOf = (nerves: readonly NerveInfo[] | undefined, muscleId: string): string | null => nerves?.find((n) => n.muscles.includes(muscleId))?.id ?? null;
