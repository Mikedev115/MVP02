import { SHOP_CLOSE, SHOP_OPEN } from '@/lib/date'
import type { ImageKey } from './images'

export interface NavItem {
  id: string
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'หน้าแรก' },
  { id: 'services', label: 'บริการของเรา' },
  { id: 'about', label: 'เกี่ยวกับเรา' },
  { id: 'reviews', label: 'รีวิว' },
  { id: 'contact', label: 'ติดต่อเรา' },
]

export const PRINCIPLES = [
  { title: 'ผ่อนคลายและสบาย', text: 'เตียงเอนหลัง น้ำอุ่นพอดี แสงนุ่ม และเสียงเบา ๆ ออกแบบให้คุณวางทุกอย่างลงได้ตั้งแต่นาทีแรก' },
  { title: 'บริการอย่างมืออาชีพ', text: 'ช่างอธิบายขั้นตอนก่อนเริ่ม ถามแรงกดและความชอบ แล้วปรับให้เหมาะกับคุณตลอดการนวด' },
  { title: 'เป็นส่วนตัวและสะอาด', text: 'ผ้าและอุปกรณ์สะอาดทุกครั้ง มีเตียงส่วนตัวและเตียงคู่ให้เลือกตามความสบายใจ' },
  { title: 'ปรับตามคุณ', text: 'หนังศีรษะมัน ผมแห้ง หรือแค่เหนื่อยล้า บอกเราได้ แล้วเลือกบริการที่ตรงกับวันนี้ของคุณ' },
]

export const WHY_US = [
  { title: 'ใส่ใจทุกรายละเอียด', text: 'ช่างทักทาย ถามความต้องการ และเคารพความเงียบของคุณ ถ้าอยากพักเงียบ ๆ ก็แค่บอก' },
  { title: 'จองง่ายในไม่กี่ขั้นตอน', text: 'เลือกบริการ เลือกวัน เลือกเวลาว่าง แล้วกรอกข้อมูลสั้น ๆ ไม่ต้องรอแชตตอบกลับ' },
  { title: 'บรรยากาศที่ทำให้หลับได้', text: 'โทนสีอบอุ่น กลิ่นอ่อน ๆ และแสงสลัว ตั้งใจให้ที่นี่เป็นที่พักใจหลังวันยาว ๆ' },
  { title: 'ราคาชัดเจน เลือกเวลาเองได้', text: 'เห็นราคาและระยะเวลาก่อนจองเสมอ เลือกได้ว่าจะสั้นเพื่อแวะพัก หรือยาวเพื่อพักจริงจัง' },
]

export interface GalleryItem {
  image: ImageKey
  caption: string
  /** class ของช่องใน grid — จัดเป็นองค์ประกอบไม่สมมาตร */
  span: string
}

export const GALLERY: GalleryItem[] = [
  { image: 'bath', caption: 'มุมพักผ่อนโทนหินธรรมชาติ', span: 'col-span-2 row-span-2' },
  { image: 'oil', caption: 'น้ำมันหอมสกัดเย็นสำหรับนวดศีรษะ', span: 'col-span-1 row-span-1' },
  { image: 'towel', caption: 'ผ้าขนหนูนุ่มและเทียนหอม', span: 'col-span-1 row-span-2' },
  { image: 'headMassage', caption: 'การนวดศีรษะผ่อนคลาย', span: 'col-span-1 row-span-1' },
  { image: 'stones', caption: 'บรรยากาศเงียบสงบ', span: 'col-span-2 row-span-1' },
  { image: 'restBw', caption: 'ช่วงเวลาพักของคุณ', span: 'col-span-1 row-span-2' },
  { image: 'candles', caption: 'กลิ่นหอมอ่อน ๆ ที่ทำให้ใจนิ่ง', span: 'col-span-1 row-span-1' },
  { image: 'hairWash', caption: 'เตียงสระผมเอนหลัง', span: 'col-span-2 row-span-1' },
]

/** ข้อมูลติดต่อทั้งหมดเป็นตัวอย่าง ไม่ใช่ข้อมูลธุรกิจจริง */
export const CONTACT = {
  address: '[ที่อยู่ร้าน — ตัวอย่าง] ใส่ที่อยู่จริงเมื่อเปิดใช้งาน',
  hours: `ทุกวัน ${SHOP_OPEN}–${SHOP_CLOSE} น.`,
  phone: '0X-XXXX-XXXX (ตัวอย่าง)',
  line: '@nudee-demo (ตัวอย่าง)',
  facebook: 'Nu Dee Spa (หน้าตัวอย่าง)',
  maps: 'Google Maps (ลิงก์ตัวอย่าง)',
}
