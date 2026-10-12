import type { L } from '@/i18n/types'
import type { ImageKey } from './images'

export interface NavItem {
  id: string
  label: L
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: { th: 'หน้าแรก', en: 'Home' } },
  { id: 'services', label: { th: 'บริการของเรา', en: 'Services' } },
  { id: 'about', label: { th: 'เกี่ยวกับเรา', en: 'About' } },
  { id: 'reviews', label: { th: 'รีวิว', en: 'Reviews' } },
  { id: 'contact', label: { th: 'ติดต่อเรา', en: 'Contact' } },
]

interface TitledText {
  title: L
  text: L
}

export const PRINCIPLES: TitledText[] = [
  {
    title: { th: 'ผ่อนคลายและสบาย', en: 'Calm and comfortable' },
    text: {
      th: 'เตียงเอนหลัง น้ำอุ่นพอดี แสงนุ่ม และเสียงเบา ๆ ออกแบบให้คุณวางทุกอย่างลงได้ตั้งแต่นาทีแรก',
      en: 'A reclining bed, perfectly warm water, soft light and gentle sound, designed so you can put everything down from the very first minute.',
    },
  },
  {
    title: { th: 'บริการอย่างมืออาชีพ', en: 'Professional care' },
    text: {
      th: 'ช่างอธิบายขั้นตอนก่อนเริ่ม ถามแรงกดและความชอบ แล้วปรับให้เหมาะกับคุณตลอดการนวด',
      en: 'Your therapist explains each step first, asks about pressure and preferences, and adjusts throughout the massage.',
    },
  },
  {
    title: { th: 'เป็นส่วนตัวและสะอาด', en: 'Private and clean' },
    text: {
      th: 'ผ้าและอุปกรณ์สะอาดทุกครั้ง มีเตียงส่วนตัวและเตียงคู่ให้เลือกตามความสบายใจ',
      en: 'Fresh linens and clean equipment every time, with private beds and twin beds to suit your comfort.',
    },
  },
  {
    title: { th: 'ปรับตามคุณ', en: 'Tailored to you' },
    text: {
      th: 'หนังศีรษะมัน ผมแห้ง หรือแค่เหนื่อยล้า บอกเราได้ แล้วเลือกบริการที่ตรงกับวันนี้ของคุณ',
      en: 'Oily scalp, dry hair, or just plain tired? Tell us, and choose the service that fits your day.',
    },
  },
]

export const WHY_US: TitledText[] = [
  {
    title: { th: 'ใส่ใจทุกรายละเอียด', en: 'Attention to every detail' },
    text: {
      th: 'ช่างทักทาย ถามความต้องการ และเคารพความเงียบของคุณ ถ้าอยากพักเงียบ ๆ ก็แค่บอก',
      en: 'Your therapist greets you, asks what you need, and respects your quiet. If you would like to rest in silence, just say so.',
    },
  },
  {
    title: { th: 'จองง่ายในไม่กี่ขั้นตอน', en: 'Book in a few easy steps' },
    text: {
      th: 'เลือกบริการ เลือกวัน เลือกเวลาว่าง แล้วกรอกข้อมูลสั้น ๆ ไม่ต้องรอแชตตอบกลับ',
      en: 'Choose a service, a day and a free time, then fill in a few details. No waiting for a chat reply.',
    },
  },
  {
    title: { th: 'บรรยากาศที่ทำให้หลับได้', en: 'An atmosphere made for sleep' },
    text: {
      th: 'โทนสีอบอุ่น กลิ่นอ่อน ๆ และแสงสลัว ตั้งใจให้ที่นี่เป็นที่พักใจหลังวันยาว ๆ',
      en: 'Warm tones, soft scents and dim light, meant to be a place for your mind to rest after a long day.',
    },
  },
  {
    title: { th: 'ราคาชัดเจน เลือกเวลาเองได้', en: 'Clear prices, your choice of length' },
    text: {
      th: 'เห็นราคาและระยะเวลาก่อนจองเสมอ เลือกได้ว่าจะสั้นเพื่อแวะพัก หรือยาวเพื่อพักจริงจัง',
      en: 'You always see the price and duration before booking. Pick a short stop to unwind, or a long one to truly rest.',
    },
  },
]

export interface GalleryItem {
  image: ImageKey
  caption: L
  /** class ของช่องใน grid — จัดเป็นองค์ประกอบไม่สมมาตร */
  span: string
}

export const GALLERY: GalleryItem[] = [
  { image: 'bath', caption: { th: 'มุมพักผ่อนโทนหินธรรมชาติ', en: 'A relaxing corner in natural stone tones' }, span: 'col-span-2 row-span-2' },
  { image: 'oil', caption: { th: 'น้ำมันหอมสกัดเย็นสำหรับนวดศีรษะ', en: 'Cold-pressed aromatic oil for scalp massage' }, span: 'col-span-1 row-span-1' },
  { image: 'towel', caption: { th: 'ผ้าขนหนูนุ่มและเทียนหอม', en: 'Soft towels and scented candles' }, span: 'col-span-1 row-span-2' },
  { image: 'headMassage', caption: { th: 'การนวดศีรษะผ่อนคลาย', en: 'A relaxing head massage' }, span: 'col-span-1 row-span-1' },
  { image: 'stones', caption: { th: 'บรรยากาศเงียบสงบ', en: 'A quiet, peaceful setting' }, span: 'col-span-2 row-span-1' },
  { image: 'restBw', caption: { th: 'ช่วงเวลาพักของคุณ', en: 'Your moment of rest' }, span: 'col-span-1 row-span-2' },
  { image: 'candles', caption: { th: 'กลิ่นหอมอ่อน ๆ ที่ทำให้ใจนิ่ง', en: 'A gentle scent that calms the mind' }, span: 'col-span-1 row-span-1' },
  { image: 'hairWash', caption: { th: 'เตียงสระผมเอนหลัง', en: 'Reclining hair-wash bed' }, span: 'col-span-2 row-span-1' },
]
