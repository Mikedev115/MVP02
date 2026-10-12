import { SERVICES } from '@/data/catalog'
import type { L } from '@/i18n/types'
import type { Service } from '@/types'
import type { ImageKey } from './images'

export interface TreatmentOption {
  serviceId: string
  /** ข้อความสั้นแทน "xx นาที" เช่นเมื่อแต่ละตัวเลือกเป็นแพ็กเกจคนละแบบ */
  label?: L
}

export interface Treatment {
  id: string
  name: L
  tagline: string
  description: L
  image: ImageKey
  /** class object-position เพื่อเลือกส่วนสำคัญของรูปเมื่อถูกครอป */
  imagePosition?: string
  options: TreatmentOption[]
}

/** กลุ่มบริการที่แสดงในหน้าเว็บ — ราคาและเวลามาจาก SERVICES ชุดเดียวกับระบบหลังบ้าน */
export const TREATMENTS: Treatment[] = [
  {
    id: 'vietnam-wash',
    name: { th: 'สระผมสไตล์เวียดนาม', en: 'Vietnamese-Style Hair Wash' },
    tagline: 'Signature',
    description: {
      th: 'สระผมบนเตียงเอนหลัง พร้อมนวดหนังศีรษะ คอ และบ่าเบา ๆ ให้ผ่อนคลายจนเผลอหลับ',
      en: 'A hair wash on a reclining bed with a gentle massage of the scalp, neck and shoulders, so relaxing you may drift off.',
    },
    image: 'hairWash',
    imagePosition: 'object-[78%_72%]',
    options: [{ serviceId: 'sv-wash45' }, { serviceId: 'sv-wash60' }, { serviceId: 'sv-asmr90', label: { th: '90 นาที · ASMR', en: '90 min · ASMR' } }],
  },
  {
    id: 'zen-head-spa',
    name: { th: 'Zen Head Spa', en: 'Zen Head Spa' },
    tagline: 'Head Spa',
    description: {
      th: 'นวดกดจุดศีรษะและใบหน้าด้วยน้ำมันสกัดเย็น คลายความตึงเครียดสะสมอย่างลึก',
      en: 'Acupressure for the head and face with cold-pressed oil, releasing built-up tension deeply.',
    },
    image: 'headMassage',
    options: [{ serviceId: 'sv-zen60' }, { serviceId: 'sv-zen90' }],
  },
  {
    id: 'herbal',
    name: { th: 'สระสมุนไพร + นวดหนังศีรษะ', en: 'Herbal Wash + Scalp Massage' },
    tagline: 'Herbal',
    description: {
      th: 'แชมพูสมุนไพรกลิ่นอ่อน ผสานการนวดหนังศีรษะ ให้ความรู้สึกสะอาดสดชื่น',
      en: 'A mildly scented herbal shampoo combined with a scalp massage, leaving you clean and refreshed.',
    },
    image: 'towel',
    options: [{ serviceId: 'sv-herbal60' }],
  },
  {
    id: 'scalp-care',
    name: { th: 'ทรีตเมนต์หนังศีรษะและเส้นผม', en: 'Scalp & Hair Treatments' },
    tagline: 'Treatment',
    description: {
      th: 'ขัดผลัดเซลล์ผิวหนังศีรษะ หรือบำรุงผมเข้มข้น เลือกตามสภาพผมและหนังศีรษะของคุณ',
      en: 'A scalp exfoliation or an intensive hair repair, chosen to suit the condition of your hair and scalp.',
    },
    image: 'scalpMask',
    options: [
      { serviceId: 'sv-detox60', label: { th: 'Scalp Detox 60 นาที', en: 'Scalp Detox 60 min' } },
      { serviceId: 'sv-repair75', label: { th: 'บำรุงผม 75 นาที', en: 'Hair repair 75 min' } },
    ],
  },
  {
    id: 'neck-shoulder',
    name: { th: 'นวดคอ บ่า ไหล่', en: 'Neck & Shoulder Massage' },
    tagline: 'Relief',
    description: {
      th: 'คลายความเมื่อยล้าจากการนั่งทำงานนาน ๆ เลือกเสริมหลังสระผมหรือจองแยกก็ได้',
      en: 'Relieve the aches of long hours at a desk. Add it after a hair wash or book it on its own.',
    },
    image: 'neck',
    options: [{ serviceId: 'sv-neck30' }, { serviceId: 'sv-neck60' }],
  },
  {
    id: 'packages',
    name: { th: 'แพ็กเกจผ่อนคลายเต็มรูปแบบ', en: 'Full Relaxation Packages' },
    tagline: 'Packages',
    description: {
      th: 'จัดลำดับขั้นตอนให้ครบ ตั้งแต่สระผมถึงนวด หรือเลือกเตียงส่วนตัว และเตียงคู่สำหรับสองท่าน',
      en: 'A complete sequence from hair wash to massage, with a private bed or a twin bed for two.',
    },
    image: 'stonesBack',
    options: [
      { serviceId: 'sv-relax90', label: { th: 'คลายเครียด 90 นาที', en: 'Stress relief 90 min' } },
      { serviceId: 'sv-ritual120', label: { th: 'Sleep Ritual 120 นาที', en: 'Sleep Ritual 120 min' } },
      { serviceId: 'sv-couple90', label: { th: 'แพ็กเกจคู่ 90 นาที', en: 'Couple package 90 min' } },
    ],
  },
]

/** ชื่อและคำอธิบายบริการฉบับภาษาอังกฤษ (ข้อมูลใน catalog เป็นภาษาไทยสำหรับหลังบ้าน) */
const SERVICE_TEXT: Record<string, { name: string; description: string }> = {
  'sv-wash45': { name: 'Vietnamese-Style Hair Wash 45 min', description: 'A relaxing hair wash with a light scalp massage' },
  'sv-wash60': { name: 'Vietnamese-Style Hair Wash 60 min', description: 'Hair wash with a head, neck and shoulder massage' },
  'sv-asmr90': { name: 'Hair Wash + ASMR Head Massage 90 min', description: 'A quiet setting with soothing sounds for a deep sleep' },
  'sv-zen60': { name: 'Zen Head Spa 60 min', description: 'Acupressure for the head and face with cold-pressed oil' },
  'sv-zen90': { name: 'Zen Head Spa 90 min', description: 'A full head spa for deep relaxation' },
  'sv-herbal60': { name: 'Herbal Wash + Scalp Massage 60 min', description: 'Herbal shampoo with a scalp massage' },
  'sv-detox60': { name: 'Scalp Treatment (Scalp Detox) 60 min', description: 'Exfoliates and nourishes the scalp' },
  'sv-repair75': { name: 'Intensive Hair Repair Treatment 75 min', description: 'Repairs damaged hair, with a wash and massage' },
  'sv-neck30': { name: 'Neck & Shoulder Massage (add-on) 30 min', description: 'An add-on for guests with aches and tension' },
  'sv-neck60': { name: 'Neck & Shoulder Massage 60 min', description: 'Basic relief for desk-related aches' },
  'sv-relax90': { name: 'Stress Relief Package (Hair Wash + Neck & Shoulders) 90 min', description: '60-minute hair wash followed by a neck and shoulder massage' },
  'sv-ritual120': { name: 'Premium Sleep Ritual 120 min', description: 'A private bed with every step included, for deep sleep throughout' },
  'sv-couple90': { name: 'Couple Head Spa Package 90 min', description: 'Head spa for two on a twin bed' },
}

/** ชื่อ/คำอธิบายบริการตามภาษา — ภาษาไทยใช้ค่าจาก catalog ตรง ๆ */
export function serviceText(service: Service): { name: L; description: L } {
  const en = SERVICE_TEXT[service.id]
  return {
    name: { th: service.name, en: en?.name ?? service.name },
    description: { th: service.description, en: en?.description ?? service.description },
  }
}

export interface ResolvedOption {
  service: Service
  label: L
}

export function resolveOptions(t: Treatment): ResolvedOption[] {
  return t.options.flatMap((o) => {
    const service = SERVICES.find((s) => s.id === o.serviceId)
    if (!service) return []
    return [{ service, label: o.label ?? { th: `${service.durationMin} นาที`, en: `${service.durationMin} min` } }]
  })
}

export const getTreatment = (id: string | null | undefined) => TREATMENTS.find((t) => t.id === id)

export const treatmentForService = (serviceId: string | null | undefined) =>
  TREATMENTS.find((t) => t.options.some((o) => o.serviceId === serviceId))

export function lowestPrice(t: Treatment): number {
  return Math.min(...resolveOptions(t).map((o) => o.service.price))
}
