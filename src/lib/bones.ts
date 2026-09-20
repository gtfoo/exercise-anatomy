/**
 * Every named bone group the figure carries (tools/blender/build_figure.py
 * BONE_GROUPS): the skeleton is exported as one mesh per group, "bone-<id>"
 * or "bone-<id>_L/_R" for the paired ones, so the atlas page can list and
 * select them. The 277 skeletal meshes of the atlas are grouped the way an
 * anatomy chart labels them: one entry per long bone, the small bones of the
 * wrist and foot together, the vertebrae by region.
 */
export type BoneInfo = { id: string; name: string; group: string; note: string };

const b = (id: string, name: string, group: string, note: string): BoneInfo => ({ id: `bone-${id}`, name, group, note });

export const BONES: readonly BoneInfo[] = [
  // Skull and neck
  b("skull", "Skull", "Skull and neck", "The cranium and the bones of the face: frontal, parietal, temporal and occipital bones, sphenoid and ethmoid, the cheekbones, upper jaw and nasal bones, with the tiny bones of the ear inside."),
  b("mandible", "Mandible", "Skull and neck", "The lower jaw, the only freely moving bone of the skull; it hinges on the temporal bone just in front of the ear."),
  b("teeth", "Teeth", "Skull and neck", "The full adult set: incisors, canines, premolars and molars, rooted in the maxilla and the mandible."),
  b("hyoid", "Hyoid bone", "Skull and neck", "A small U-shaped bone in the front of the neck, anchored only by muscles and ligaments; the tongue and the larynx hang from it."),
  b("laryngeal-cartilages", "Laryngeal cartilages", "Skull and neck", "The thyroid, cricoid and arytenoid cartilages of the voice box, below the hyoid; cartilage, not bone, but part of the skeletal atlas."),
  // Spine
  b("cervical-vertebrae", "Cervical vertebrae", "Spine", "The seven neck vertebrae, C1 to C7. The atlas (C1) carries the skull and nods; the axis (C2) lets the head turn."),
  b("thoracic-vertebrae", "Thoracic vertebrae", "Spine", "The twelve vertebrae of the upper back, T1 to T12, one rib pair joined to each."),
  b("lumbar-vertebrae", "Lumbar vertebrae", "Spine", "The five large vertebrae of the lower back, L1 to L5, which carry most of the trunk's load and bend in a hinge or a sit-up."),
  b("sacrum", "Sacrum", "Spine", "Five vertebrae fused into a wedge that locks the spine into the pelvis at the sacroiliac joints."),
  b("coccyx", "Coccyx", "Spine", "The tailbone: the last few vertebrae, fused, below the sacrum."),
  // Thorax
  b("sternum", "Sternum", "Thorax", "The breastbone: manubrium, body and xiphoid process, where the costal cartilages and the collarbones meet."),
  b("ribs", "Ribs", "Thorax", "Twelve pairs, each joined to a thoracic vertebra behind. The upper seven reach the sternum through their own cartilage, the next three share one, the last two float."),
  b("costal-cartilages", "Costal cartilages", "Thorax", "The cartilage bars that join the ribs to the sternum and let the chest expand with each breath."),
  // Shoulder and arm
  b("clavicle", "Clavicle", "Shoulder and arm", "The collarbone: a strut from the sternum to the shoulder blade that holds the shoulder out from the chest."),
  b("scapula", "Scapula", "Shoulder and arm", "The shoulder blade: a flat triangle over the back of the ribs that carries the shoulder socket and glides as the arm rises."),
  b("humerus", "Humerus", "Shoulder and arm", "The upper arm bone, from the shoulder socket to the elbow."),
  b("radius", "Radius", "Shoulder and arm", "The forearm bone on the thumb side; it rolls over the ulna to turn the palm up and down."),
  b("ulna", "Ulna", "Shoulder and arm", "The forearm bone on the little-finger side; its hook, the olecranon, is the point of the elbow."),
  // Hand
  b("carpals", "Carpal bones", "Hand", "The eight small bones of the wrist in two rows: scaphoid, lunate, triquetrum and pisiform, then trapezium, trapezoid, capitate and hamate."),
  b("metacarpals", "Metacarpals", "Hand", "The five long bones of the palm, one to each finger."),
  b("finger-phalanges", "Finger phalanges", "Hand", "The finger bones: three in each finger, two in the thumb."),
  // Pelvis and leg
  b("hip-bone", "Hip bone", "Pelvis and leg", "Ilium, ischium and pubis fused into one bone; the two hip bones and the sacrum make the pelvis, and the hip socket sits where the three meet."),
  b("femur", "Femur", "Pelvis and leg", "The thigh bone, the longest in the body, from the hip socket to the knee."),
  b("patella", "Patella", "Pelvis and leg", "The kneecap: a bone inside the quadriceps tendon that glides on the front of the femur and gives the quadriceps leverage."),
  b("tibia", "Tibia", "Pelvis and leg", "The shin bone: it carries the weight from the knee to the ankle."),
  b("fibula", "Fibula", "Pelvis and leg", "The thin bone beside the tibia; it carries little weight but forms the outer ankle and anchors the calf and fibular muscles."),
  // Foot
  b("talus", "Talus", "Foot", "The ankle bone, sitting on the calcaneus and gripped between the tibia and fibula; the foot flexes and points on it."),
  b("calcaneus", "Calcaneus", "Foot", "The heel bone, the largest of the foot; the Achilles tendon pulls on it to point the foot."),
  b("midfoot-bones", "Midfoot bones", "Foot", "The navicular, the cuboid and the three cuneiforms, which make the arch of the foot."),
  b("metatarsals", "Metatarsals", "Foot", "The five long bones of the forefoot, with the two sesamoids under the big toe's joint."),
  b("toe-phalanges", "Toe phalanges", "Foot", "The toe bones: three in each toe, two in the big toe."),
];
