/**
 * Every named tendon group the figure carries (tools/blender/build_figure.py
 * TENDON_GROUPS), exported as "tendon-<id>" or "tendon-<id>_L/_R". These are
 * the tendons, aponeuroses, retinacula and tendon sheaths the atlas models
 * apart from their muscles. Most tendons are part of their muscle's mesh in
 * this atlas (the quadriceps and patellar tendons, the biceps', the
 * hamstrings') and are coloured with that muscle on every page.
 */
export type TendonInfo = { id: string; name: string; group: string; note: string };

const td = (id: string, name: string, group: string, note: string): TendonInfo => ({ id: `tendon-${id}`, name, group, note });

export const TENDONS: readonly TendonInfo[] = [
  // Trunk
  td("thoracolumbar-fascia", "Thoracolumbar fascia", "Trunk", "The layered sheet of the lower back that the latissimus dorsi, the glutes and the deep abdominals pull on; it ties the trunk's front and back muscles together round the lumbar spine."),
  td("linea-alba", "Linea alba", "Trunk", "The tendinous seam down the middle of the abdomen, from the breastbone to the pubis, where the aponeuroses of the abdominal muscles from both sides meet."),
  td("inguinal-ligament", "Inguinal ligament", "Trunk", "The lower edge of the external oblique's aponeurosis, from the front of the hip bone to the pubis; the hip flexors and the femoral vessels pass beneath it."),
  td("digastric-tendon", "Intermediate tendon of the digastric", "Trunk", "The tendon joining the digastric's two bellies under the jaw, slung from the hyoid bone."),
  // Arm and hand
  td("biceps-tendon-sheath", "Intertubercular tendon sheath", "Arm and hand", "The sheath of the biceps' long-head tendon as it runs up the groove at the front of the humerus into the shoulder joint."),
  td("wrist-retinacula", "Wrist retinacula", "Arm and hand", "The bands across the front and back of the wrist that hold the forearm muscles' tendons down as the wrist bends; the flexor retinaculum roofs the carpal tunnel."),
  td("hand-tendon-sheaths", "Tendon sheaths of the wrist and hand", "Arm and hand", "The lubricating sheaths round the tendons as they cross the wrist and run along the fingers: they show the paths of the forearm muscles' long tendons."),
  td("palmar-aponeurosis", "Palmar aponeurosis", "Arm and hand", "The tough triangular sheet in the palm, over the finger flexors' tendons, that firms the grip."),
  // Leg and foot
  td("it-band", "Iliotibial band", "Leg and foot", "The iliotibial tract: a thick band down the outside of the thigh from the hip to below the knee, pulled on by the tensor fasciae latae and the gluteus maximus; it steadies the hip and knee in standing and running."),
  td("patellar-retinacula", "Patellar retinacula", "Leg and foot", "Bands either side of the kneecap from the vasti to the tibia, which hold the patella on track."),
  td("achilles", "Achilles tendon", "Leg and foot", "The calcaneal tendon: the common tendon of the gastrocnemius and soleus into the heel bone, the thickest and strongest tendon of the body; it lifts the heel in a calf raise, a jump or a sprint."),
  td("ankle-retinacula", "Ankle retinacula", "Leg and foot", "The extensor, flexor and fibular retinacula: bands round the ankle that hold the tendons of the shin and calf muscles close as they turn into the foot."),
  td("foot-tendon-sheaths", "Tendon sheaths of the ankle and foot", "Leg and foot", "The sheaths round the tibialis, toe-flexor, toe-extensor and fibularis tendons where they pass the ankle: they show those muscles' tendons running into the foot."),
  td("toe-extensor-tendons", "Tendons of the long toe extensor", "Leg and foot", "The four tendons of extensor digitorum longus across the top of the foot to the toes."),
  td("plantar-fascia", "Plantar fascia", "Leg and foot", "The plantar aponeurosis: a strong band along the sole from the heel to the toes, which ties the arch like a bowstring and tightens as the toes bend back."),
];
