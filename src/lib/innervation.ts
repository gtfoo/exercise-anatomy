/**
 * The nerve supply of every named muscle, shown on its card on every page (owner, 2026-11-22: add nerves).
 *
 * Z-Anatomy carries no geometry for the peripheral nerves: its "Spinal nerves" collections (Brachial plexus/Median
 * nerve, Sacral plexus/Sciatic nerve/Tibial nerve, ...) hold the muscles each nerve supplies, not the nerves, and the
 * plexuses are empty labels. Those groupings are where most lines here come from. The muscles the atlas files under
 * no nerve (the glutes, the tensor fasciae latae, latissimus dorsi, subscapularis, teres major, pectoralis minor,
 * the abdominals and erector spinae) take the supply standard anatomy texts give. Where the atlas files a muscle
 * under one nerve and the texts give two, the line names both: the atlas puts the whole biceps femoris under the
 * common fibular nerve and the whole adductor magnus under the obturator, and brachioradialis is radial alone.
 *
 * Nerve supply varies a little between people; these are the usual patterns.
 */
export const INNERVATION: Readonly<Record<string, string>> = {
  // Shoulder
  "anterior-deltoid": "the axillary nerve",
  "middle-deltoid": "the axillary nerve",
  "posterior-deltoid": "the axillary nerve",
  supraspinatus: "the suprascapular nerve",
  infraspinatus: "the suprascapular nerve",
  "teres-minor": "the axillary nerve",
  subscapularis: "the upper and lower subscapular nerves",
  "serratus-anterior": "the long thoracic nerve",
  // Chest
  "pectoralis-major": "the lateral and medial pectoral nerves",
  "pectoralis-minor": "the medial pectoral nerve",
  // Back
  "latissimus-dorsi": "the thoracodorsal nerve",
  "teres-major": "the lower subscapular nerve",
  "upper-trapezius": "the accessory nerve (cranial nerve XI)",
  "middle-trapezius": "the accessory nerve (cranial nerve XI)",
  "lower-trapezius": "the accessory nerve (cranial nerve XI)",
  rhomboids: "the dorsal scapular nerve",
  // Arm
  "biceps-brachii": "the musculocutaneous nerve",
  brachialis: "the musculocutaneous nerve, with a small share from the radial nerve",
  brachioradialis: "the radial nerve",
  "triceps-long-head": "the radial nerve",
  "triceps-lateral-head": "the radial nerve",
  "triceps-medial-head": "the radial nerve",
  coracobrachialis: "the musculocutaneous nerve",
  "forearm-flexors": "the median nerve, and the ulnar nerve for flexor carpi ulnaris and half of the deep finger flexor",
  "forearm-extensors": "the radial nerve and its deep branch, the posterior interosseous nerve",
  // Core
  "rectus-abdominis": "the lower intercostal (thoracoabdominal) and subcostal nerves, T7 to T12",
  "external-obliques": "the lower intercostal (thoracoabdominal) and subcostal nerves, T7 to T12",
  "internal-obliques": "the lower intercostal and subcostal nerves and the iliohypogastric and ilioinguinal nerves, T7 to L1",
  "transversus-abdominis": "the lower intercostal and subcostal nerves and the iliohypogastric and ilioinguinal nerves, T7 to L1",
  "erector-spinae": "the posterior rami of the spinal nerves, segment by segment",
  // Gluteals
  "gluteus-maximus": "the inferior gluteal nerve",
  "gluteus-medius": "the superior gluteal nerve",
  "gluteus-minimus": "the superior gluteal nerve",
  "tensor-fasciae-latae": "the superior gluteal nerve",
  // Adductors
  "adductor-magnus": "the obturator nerve, and the tibial part of the sciatic nerve for its hamstring part",
  "adductor-longus": "the obturator nerve",
  "adductor-brevis": "the obturator nerve",
  pectineus: "the femoral nerve, sometimes with a branch of the obturator nerve",
  gracilis: "the obturator nerve",
  // Quadriceps
  "rectus-femoris": "the femoral nerve",
  "vastus-lateralis": "the femoral nerve",
  "vastus-medialis": "the femoral nerve",
  "vastus-intermedius": "the femoral nerve",
  // Hamstrings
  "biceps-femoris": "the sciatic nerve: its tibial part for the long head, its common fibular part for the short head",
  semitendinosus: "the tibial part of the sciatic nerve",
  semimembranosus: "the tibial part of the sciatic nerve",
  // Lower leg
  "gastrocnemius-medial": "the tibial nerve",
  "gastrocnemius-lateral": "the tibial nerve",
  soleus: "the tibial nerve",
  "tibialis-anterior": "the deep fibular nerve",
  fibularis: "the superficial fibular nerve",
};

/** The card's line, e.g. "Innervated by the femoral nerve." */
export const innervatedBy = (muscleId: string): string | null => (INNERVATION[muscleId] ? `Innervated by ${INNERVATION[muscleId]}.` : null);
