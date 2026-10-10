import { SERVICES } from '@/data/catalog'
import type { ImageKey } from './images'

export interface Promotion {
  id: string
  kind: 'package' | 'seasonal'
  badge: string
  title: string
  blurb: string
  perks: string[]
  serviceId: string
  /** ราคาโปรโมชัน (บาท) — ราคาปกติอ้างอิงจากบริการใน catalog */
  promoPrice: number
  image: ImageKey
}

/** ตัวอย่างโปรโมชันสำหรับสาธิต แก้ไขได้ที่ไฟล์นี้ไฟล์เดียว */
export const PROMOTIONS: Promotion[] = [
  {
    id: 'promo-couple',
    kind: 'package',
    badge: 'แพ็กเกจคู่',
    title: 'พักผ่อนด้วยกันสองคน',
    blurb: 'Head Spa บนเตียงคู่ในห้องเดียวกัน เหมาะกับคู่รัก เพื่อน หรือครอบครัว',
    perks: ['เตียงคู่ลาเวนเดอร์ 2 ท่าน', 'ใช้เวลา 90 นาที', 'ชาสมุนไพรหลังบริการ'],
    serviceId: 'sv-couple90',
    promoPrice: 1290,
    image: 'candles',
  },
  {
    id: 'promo-relax',
    kind: 'package',
    badge: 'แพ็กเกจแนะนำ',
    title: 'คลายเครียดหลังเลิกงาน',
    blurb: 'สระผม 60 นาที ต่อด้วยนวดคอ บ่า ไหล่ ในรอบเดียว',
    perks: ['สระผม + นวดคอ บ่า ไหล่', 'รวม 90 นาที'],
    serviceId: 'sv-relax90',
    promoPrice: 590,
    image: 'neck',
  },
  {
    id: 'promo-season',
    kind: 'seasonal',
    badge: 'ข้อเสนอประจำฤดู',
    title: 'Cool Season Head Spa',
    blurb: 'ต้อนรับอากาศเย็น ด้วย Zen Head Spa 60 นาทีในราคาพิเศษ',
    perks: ['Zen Head Spa 60 นาที', 'น้ำมันสกัดเย็นกลิ่นอ่อน'],
    serviceId: 'sv-zen60',
    promoPrice: 490,
    image: 'oil',
  },
]

export const regularPrice = (p: Promotion): number => SERVICES.find((s) => s.id === p.serviceId)?.price ?? p.promoPrice
export const getPromotion = (id: string | null | undefined) => PROMOTIONS.find((p) => p.id === id)
