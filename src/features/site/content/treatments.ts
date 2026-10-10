import { SERVICES } from '@/data/catalog'
import type { Service } from '@/types'
import type { ImageKey } from './images'

export interface TreatmentOption {
  serviceId: string
  /** ข้อความสั้นแทน "xx นาที" เช่นเมื่อแต่ละตัวเลือกเป็นแพ็กเกจคนละแบบ */
  label?: string
}

export interface Treatment {
  id: string
  name: string
  tagline: string
  description: string
  image: ImageKey
  /** class object-position เพื่อเลือกส่วนสำคัญของรูปเมื่อถูกครอป */
  imagePosition?: string
  options: TreatmentOption[]
}

/** กลุ่มบริการที่แสดงในหน้าเว็บ — ราคาและเวลามาจาก SERVICES ชุดเดียวกับระบบหลังบ้าน */
export const TREATMENTS: Treatment[] = [
  {
    id: 'vietnam-wash',
    name: 'สระผมสไตล์เวียดนาม',
    tagline: 'Signature',
    description: 'สระผมบนเตียงเอนหลัง พร้อมนวดหนังศีรษะ คอ และบ่าเบา ๆ ให้ผ่อนคลายจนเผลอหลับ',
    image: 'hairWash',
    imagePosition: 'object-[78%_72%]',
    options: [{ serviceId: 'sv-wash45' }, { serviceId: 'sv-wash60' }, { serviceId: 'sv-asmr90', label: '90 นาที · ASMR' }],
  },
  {
    id: 'zen-head-spa',
    name: 'Zen Head Spa',
    tagline: 'Head Spa',
    description: 'นวดกดจุดศีรษะและใบหน้าด้วยน้ำมันสกัดเย็น คลายความตึงเครียดสะสมอย่างลึก',
    image: 'headMassage',
    options: [{ serviceId: 'sv-zen60' }, { serviceId: 'sv-zen90' }],
  },
  {
    id: 'herbal',
    name: 'สระสมุนไพร + นวดหนังศีรษะ',
    tagline: 'Herbal',
    description: 'แชมพูสมุนไพรกลิ่นอ่อน ผสานการนวดหนังศีรษะ ให้ความรู้สึกสะอาดสดชื่น',
    image: 'towel',
    options: [{ serviceId: 'sv-herbal60' }],
  },
  {
    id: 'scalp-care',
    name: 'ทรีตเมนต์หนังศีรษะและเส้นผม',
    tagline: 'Treatment',
    description: 'ขัดผลัดเซลล์ผิวหนังศีรษะ หรือบำรุงผมเข้มข้น เลือกตามสภาพผมและหนังศีรษะของคุณ',
    image: 'scalpMask',
    options: [{ serviceId: 'sv-detox60', label: 'Scalp Detox 60 นาที' }, { serviceId: 'sv-repair75', label: 'บำรุงผม 75 นาที' }],
  },
  {
    id: 'neck-shoulder',
    name: 'นวดคอ บ่า ไหล่',
    tagline: 'Relief',
    description: 'คลายความเมื่อยล้าจากการนั่งทำงานนาน ๆ เลือกเสริมหลังสระผมหรือจองแยกก็ได้',
    image: 'neck',
    options: [{ serviceId: 'sv-neck30' }, { serviceId: 'sv-neck60' }],
  },
  {
    id: 'packages',
    name: 'แพ็กเกจผ่อนคลายเต็มรูปแบบ',
    tagline: 'Packages',
    description: 'จัดลำดับขั้นตอนให้ครบ ตั้งแต่สระผมถึงนวด หรือเลือกเตียงส่วนตัว และเตียงคู่สำหรับสองท่าน',
    image: 'stonesBack',
    options: [
      { serviceId: 'sv-relax90', label: 'คลายเครียด 90 นาที' },
      { serviceId: 'sv-ritual120', label: 'Sleep Ritual 120 นาที' },
      { serviceId: 'sv-couple90', label: 'แพ็กเกจคู่ 90 นาที' },
    ],
  },
]

export interface ResolvedOption {
  service: Service
  label: string
}

export function resolveOptions(t: Treatment): ResolvedOption[] {
  return t.options.flatMap((o) => {
    const service = SERVICES.find((s) => s.id === o.serviceId)
    return service ? [{ service, label: o.label ?? `${service.durationMin} นาที` }] : []
  })
}

export const getTreatment = (id: string | null | undefined) => TREATMENTS.find((t) => t.id === id)

export const treatmentForService = (serviceId: string | null | undefined) =>
  TREATMENTS.find((t) => t.options.some((o) => o.serviceId === serviceId))

export function lowestPrice(t: Treatment): number {
  return Math.min(...resolveOptions(t).map((o) => o.service.price))
}
