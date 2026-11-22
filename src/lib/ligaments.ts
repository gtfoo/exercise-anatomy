/**
 * Every named ligament group the figure carries (tools/blender/build_figure.py
 * LIGAMENT_GROUPS): the atlas's joints, ligaments, capsules, labra, menisci and
 * intervertebral discs, exported as one mesh per group, "lig-<id>" or
 * "lig-<id>_L/_R" for the paired ones, so the atlas page can list and select
 * them. The ligaments people look for (the cruciates, the collaterals, each
 * meniscus) are their own entries; the many small ligaments of the wrist and
 * foot are grouped as the bones there are. Several of the atlas's smaller
 * ligaments are simple shapes, so they read as where a ligament is rather than
 * its exact form.
 */
export type LigamentInfo = { id: string; name: string; group: string; note: string };

const l = (id: string, name: string, group: string, note: string): LigamentInfo => ({ id: `lig-${id}`, name, group, note });

export const LIGAMENTS: readonly LigamentInfo[] = [
  // Spine and thorax
  l("discs-cervical", "Cervical intervertebral discs", "Spine and thorax", "The six discs of the neck, C2 to T1: a tough fibrous ring round a soft core, cushioning each vertebra on the next and letting the neck bend and turn."),
  l("discs-thoracic", "Thoracic intervertebral discs", "Spine and thorax", "The twelve discs of the upper back, thinner than the lumbar ones; the ribs and their joints make this the stiffest part of the spine."),
  l("discs-lumbar", "Lumbar intervertebral discs", "Spine and thorax", "The five thickest discs, L1 to S1, which carry most of the trunk's load; a lifted load or a deep fold compresses them most."),
  l("anterior-longitudinal", "Anterior longitudinal ligament", "Spine and thorax", "A broad band down the front of the vertebral bodies from the skull to the sacrum; it limits bending backwards."),
  l("posterior-longitudinal", "Posterior longitudinal ligament", "Spine and thorax", "Runs down the back of the vertebral bodies, inside the spinal canal; it limits bending forwards and backs the discs."),
  l("ligamenta-flava", "Ligamenta flava", "Spine and thorax", "Yellow, elastic ligaments joining the arches of neighbouring vertebrae; they stretch as the spine bends forward and recoil as it straightens."),
  l("spinous-ligaments", "Supraspinous and interspinous ligaments", "Spine and thorax", "Join the spinous processes, along their tips and between them; they tighten as the spine bends forward."),
  l("nuchal-ligament", "Nuchal ligament", "Spine and thorax", "The supraspinous ligament's continuation up the back of the neck to the skull, a midline sheet the neck muscles attach to."),
  l("rib-joints", "Ligaments of the rib joints", "Spine and thorax", "The radiate, intra-articular and costotransverse ligaments that tie each rib's head and neck to its vertebrae while letting the ribs swing with each breath."),
  l("intercostal-membranes", "Intercostal membranes", "Spine and thorax", "Thin sheets between the ribs where the intercostal muscles give way to membrane, at the front (internal) and the back (external)."),
  // Jaw
  l("jaw", "Jaw joint (temporomandibular)", "Jaw", "The capsule, articular disc and ligaments of the joint in front of the ear where the lower jaw hinges and slides; the stylohyoid ligament runs down from the skull to the hyoid."),
  // Shoulder
  l("sternoclavicular", "Sternoclavicular joint", "Shoulder", "The capsule, disc and ligaments joining the collarbone to the breastbone: the shoulder girdle's only joint with the trunk."),
  l("acromioclavicular", "Acromioclavicular joint", "Shoulder", "The capsule, disc and ligament where the collarbone meets the acromion at the top of the shoulder; the joint a shoulder separation tears."),
  l("coracoclavicular", "Coracoclavicular ligaments", "Shoulder", "The conoid and trapezoid ligaments, which hang the shoulder blade from the collarbone and keep the acromioclavicular joint together."),
  l("scapular-ligaments", "Coraco-acromial and transverse scapular ligaments", "Shoulder", "The coraco-acromial ligament roofs the shoulder joint over the rotator cuff; the transverse scapular ligaments bridge notches of the shoulder blade."),
  l("shoulder-capsule", "Shoulder capsule and glenohumeral ligaments", "Shoulder", "The loose capsule of the ball-and-socket joint, thickened into the superior, middle and inferior glenohumeral ligaments and the coracohumeral ligament; loose enough for the arm's great range, so the rotator cuff muscles do much of the holding."),
  l("glenoid-labrum", "Glenoid labrum", "Shoulder", "A rim of fibrocartilage round the shallow socket of the shoulder blade, deepening it for the head of the humerus."),
  // Elbow and forearm
  l("elbow-capsule", "Elbow capsule", "Elbow and forearm", "The capsule enclosing the hinge between the humerus and the ulna and the pivot of the radius."),
  l("elbow-ulnar-collateral", "Ulnar collateral ligament (elbow)", "Elbow and forearm", "On the inner side of the elbow, from the humerus to the ulna; it resists the elbow being forced outward, as in a throw."),
  l("elbow-radial-collateral", "Radial collateral and annular ligaments", "Elbow and forearm", "On the outer side of the elbow: the radial collateral ligament, and the annular ligament that rings the head of the radius as it turns."),
  l("forearm-membrane", "Interosseous membrane of the forearm", "Elbow and forearm", "A sheet between the radius and the ulna that passes load from one to the other and gives the deep forearm muscles room to attach."),
  l("distal-radio-ulnar", "Distal radio-ulnar joint", "Elbow and forearm", "The articular disc and radio-ulnar ligaments at the wrist end of the forearm, which hold the radius to the ulna as it turns."),
  // Wrist and hand
  l("wrist", "Wrist capsule and ligaments", "Wrist and hand", "The capsule of the wrist joint and the ligaments from the radius and ulna to the carpal bones, front and back, with the collateral ligaments on either side."),
  l("carpal", "Carpal ligaments", "Wrist and hand", "The many small ligaments binding the eight carpal bones to each other, including the scapholunate ligament that is the one most often torn."),
  l("metacarpal", "Carpometacarpal and metacarpal ligaments", "Wrist and hand", "Join the carpals to the metacarpals and the metacarpals to each other, with the deep transverse metacarpal ligament across the knuckles."),
  l("finger-joints", "Finger joint capsules and ligaments", "Wrist and hand", "The capsules of the knuckle and finger joints with their collateral ligaments on either side and palmar plates below."),
  // Pelvis and hip
  l("sacro-iliac", "Sacro-iliac and iliolumbar ligaments", "Pelvis and hip", "Very strong ligaments that lock the sacrum between the hip bones, front, back and between, with the iliolumbar ligament from the last lumbar vertebra to the pelvis."),
  l("sacrotuberous", "Sacrotuberous and sacrospinous ligaments", "Pelvis and hip", "Run from the sacrum to the sitting bone and to the ischial spine, holding the sacrum from tipping forward under the trunk's weight."),
  l("pubic-symphysis", "Pubic symphysis", "Pelvis and hip", "The disc and ligaments joining the two pubic bones at the front of the pelvis."),
  l("sacrococcygeal", "Sacrococcygeal joint", "Pelvis and hip", "The joint and ligaments between the sacrum and the tailbone."),
  l("obturator-membrane", "Obturator membrane", "Pelvis and hip", "A sheet closing most of the large hole in each hip bone; the obturator muscles attach to either side of it."),
  l("iliofemoral", "Iliofemoral ligament", "Pelvis and hip", "The Y-shaped ligament at the front of the hip, the strongest in the body; it stops the hip extending too far and lets a person stand with little muscle effort."),
  l("hip-capsule", "Hip capsule, pubofemoral and ischiofemoral ligaments", "Pelvis and hip", "The thick hip capsule with its ring-shaped zona orbicularis round the femur's neck and the frenula running along it, reinforced below by the pubofemoral and behind by the ischiofemoral ligament."),
  l("acetabular-labrum", "Acetabular labrum", "Pelvis and hip", "A rim of fibrocartilage round the hip socket that deepens it and seals the joint; the transverse ligament bridges the gap at its lower edge."),
  l("ligament-head-femur", "Ligament of the head of the femur", "Pelvis and hip", "A small ligament inside the hip joint from the socket to the femur's head, carrying a blood vessel to it."),
  // Knee and leg
  l("acl", "Anterior cruciate ligament (ACL)", "Knee and leg", "Inside the knee, from the tibia forward of centre up and back to the femur; it stops the tibia sliding forward and twisting, and is the knee ligament most often torn."),
  l("pcl", "Posterior cruciate ligament (PCL)", "Knee and leg", "Inside the knee, crossing the ACL, from the back of the tibia up and forward to the femur; it stops the tibia sliding backward."),
  l("mcl", "Medial collateral ligament (MCL)", "Knee and leg", "The tibial collateral ligament, superficial and deep parts, on the inner side of the knee; it resists the knee being pushed inward."),
  l("lcl", "Lateral collateral ligament (LCL)", "Knee and leg", "The fibular collateral ligament, a cord on the outer side of the knee from the femur to the head of the fibula; it resists the knee being pushed outward."),
  l("medial-meniscus", "Medial meniscus", "Knee and leg", "A C-shaped wedge of cartilage on the inner half of the tibia, tied to it by its meniscotibial ligaments, that spreads the femur's load and steadies the knee; it is attached to the MCL, and torn more often than the lateral one."),
  l("lateral-meniscus", "Lateral meniscus", "Knee and leg", "A near-circular wedge of cartilage on the outer half of the tibia, more mobile than the medial one."),
  l("knee-capsule", "Knee capsule and posterior ligaments", "Knee and leg", "The knee's capsule, the oblique and arcuate popliteal ligaments and the popliteofibular ligament at its back, the transverse ligament joining the menisci, and the fat pad behind the patellar tendon."),
  l("proximal-tibiofibular", "Proximal tibiofibular joint", "Knee and leg", "The capsule and ligaments joining the head of the fibula to the tibia below the knee."),
  l("leg-membrane", "Interosseous membrane of the leg", "Knee and leg", "A sheet between the tibia and the fibula that separates the front and back muscles of the shin."),
  l("distal-tibiofibular", "Distal tibiofibular ligaments", "Knee and leg", "The syndesmosis above the ankle, front, back and transverse ligaments that hold the tibia and fibula together as a socket for the talus; a high ankle sprain tears them."),
  // Ankle and foot
  l("lateral-ankle", "Lateral ankle ligaments", "Ankle and foot", "The anterior and posterior talofibular and the calcaneofibular ligaments on the outside of the ankle; a rolled ankle sprains the anterior talofibular first."),
  l("deltoid-ligament", "Deltoid ligament", "Ankle and foot", "A fan of ligaments on the inner side of the ankle from the tibia to the talus, calcaneus and navicular; strong, and rarely sprained alone."),
  l("subtalar", "Subtalar ligaments", "Ankle and foot", "The talocalcaneal ligaments, including the strong interosseous one, that join the talus to the heel bone under the ankle."),
  l("plantar-ligaments", "Plantar ligaments of the foot", "Ankle and foot", "The long plantar and the plantar calcaneonavicular (spring) ligaments and the smaller ones of the sole that hold up the arches."),
  l("midfoot-ligaments", "Midfoot ligaments", "Ankle and foot", "The dorsal and interosseous ligaments of the tarsal bones and the tarsometatarsal joints, across the top and through the middle of the foot."),
  l("toe-joints", "Toe joint capsules and ligaments", "Ankle and foot", "The capsules of the toe joints with their collateral ligaments and plantar plates, and the deep transverse metatarsal ligament across the ball of the foot."),
];
