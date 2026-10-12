import { SERVICES } from '@/data/catalog'
import type { L } from '@/i18n/types'
import type { ImageKey } from './images'

export interface Promotion {
  id: string
  kind: 'package' | 'seasonal'
  badge: L
  title: L
  blurb: L
  perks: L[]
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
    badge: { th: 'แพ็กเกจคู่', en: 'Couple package' },
    title: { th: 'พักผ่อนด้วยกันสองคน', en: 'Rest together, just the two of you' },
    blurb: {
      th: 'Head Spa บนเตียงคู่ในห้องเดียวกัน เหมาะกับคู่รัก เพื่อน หรือครอบครัว',
      en: 'Head spa on twin beds in the same room, ideal for couples, friends or family.',
    },
    perks: [
      { th: 'เตียงคู่ลาเวนเดอร์ 2 ท่าน', en: 'Lavender twin bed for 2 guests' },
      { th: 'ใช้เวลา 90 นาที', en: '90 minutes' },
      { th: 'ชาสมุนไพรหลังบริการ', en: 'Herbal tea after your session' },
    ],
    serviceId: 'sv-couple90',
    promoPrice: 1290,
    image: 'candles',
  },
  {
    id: 'promo-relax',
    kind: 'package',
    badge: { th: 'แพ็กเกจแนะนำ', en: 'Recommended package' },
    title: { th: 'คลายเครียดหลังเลิกงาน', en: 'Unwind after work' },
    blurb: {
      th: 'สระผม 60 นาที ต่อด้วยนวดคอ บ่า ไหล่ ในรอบเดียว',
      en: 'A 60-minute hair wash followed by a neck and shoulder massage, all in one visit.',
    },
    perks: [
      { th: 'สระผม + นวดคอ บ่า ไหล่', en: 'Hair wash + neck & shoulder massage' },
      { th: 'รวม 90 นาที', en: '90 minutes in total' },
    ],
    serviceId: 'sv-relax90',
    promoPrice: 590,
    image: 'neck',
  },
  {
    id: 'promo-season',
    kind: 'seasonal',
    badge: { th: 'ข้อเสนอประจำฤดู', en: 'Seasonal offer' },
    title: { th: 'Cool Season Head Spa', en: 'Cool Season Head Spa' },
    blurb: {
      th: 'ต้อนรับอากาศเย็น ด้วย Zen Head Spa 60 นาทีในราคาพิเศษ',
      en: 'Welcome the cooler weather with a 60-minute Zen Head Spa at a special price.',
    },
    perks: [
      { th: 'Zen Head Spa 60 นาที', en: '60-minute Zen Head Spa' },
      { th: 'น้ำมันสกัดเย็นกลิ่นอ่อน', en: 'Mildly scented cold-pressed oil' },
    ],
    serviceId: 'sv-zen60',
    promoPrice: 490,
    image: 'oil',
  },
]

export const regularPrice = (p: Promotion): number => SERVICES.find((s) => s.id === p.serviceId)?.price ?? p.promoPrice
export const getPromotion = (id: string | null | undefined) => PROMOTIONS.find((p) => p.id === id)
