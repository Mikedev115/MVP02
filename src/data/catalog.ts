import type { AcquisitionSource, AgeGroup, AppointmentStatus, MarketingExpense, Room, Service, ServiceCategory, Staff } from '@/types'

export const SERVICES: Service[] = [
  { id: 'sv-wash45', name: 'สระผมสไตล์เวียดนาม 45 นาที', category: 'wash', durationMin: 45, price: 350, description: 'สระผมผ่อนคลาย นวดหนังศีรษะเบา ๆ', roomType: 'bed' },
  { id: 'sv-wash60', name: 'สระผมสไตล์เวียดนาม 60 นาที', category: 'wash', durationMin: 60, price: 450, description: 'สระผมนวดศีรษะ คอ และบ่า', roomType: 'bed' },
  { id: 'sv-asmr90', name: 'สระผม + นวดศีรษะ ASMR 90 นาที', category: 'wash', durationMin: 90, price: 650, description: 'บรรยากาศเงียบ เสียงผ่อนคลาย หลับสบาย', roomType: 'bed' },
  { id: 'sv-zen60', name: 'Zen Head Spa 60 นาที', category: 'headspa', durationMin: 60, price: 590, description: 'นวดกดจุดศีรษะและใบหน้า ด้วยน้ำมันสกัดเย็น', roomType: 'bed' },
  { id: 'sv-zen90', name: 'Zen Head Spa 90 นาที', category: 'headspa', durationMin: 90, price: 790, description: 'หัวสปาเต็มรูปแบบ ผ่อนคลายลึก', roomType: 'bed' },
  { id: 'sv-herbal60', name: 'สระสมุนไพร + นวดหนังศีรษะ 60 นาที', category: 'headspa', durationMin: 60, price: 520, description: 'แชมพูสมุนไพรและนวดหนังศีรษะ', roomType: 'bed' },
  { id: 'sv-detox60', name: 'ทรีตเมนต์หนังศีรษะ (Scalp Detox) 60 นาที', category: 'treatment', durationMin: 60, price: 690, description: 'ขัดผลัดเซลล์ผิวและบำรุงหนังศีรษะ', roomType: 'bed' },
  { id: 'sv-repair75', name: 'ทรีตเมนต์บำรุงเส้นผมเข้มข้น 75 นาที', category: 'treatment', durationMin: 75, price: 850, description: 'บำรุงผมเสีย ร่วมกับการสระและนวด', roomType: 'bed' },
  { id: 'sv-neck30', name: 'นวดคอ บ่า ไหล่ (เสริม) 30 นาที', category: 'neck', durationMin: 30, price: 250, description: 'บริการเสริมสำหรับลูกค้าที่ปวดเมื่อย', roomType: 'bed' },
  { id: 'sv-neck60', name: 'นวดคอ บ่า ไหล่ 60 นาที', category: 'neck', durationMin: 60, price: 420, description: 'คลายออฟฟิศซินโดรมเบื้องต้น', roomType: 'bed' },
  { id: 'sv-relax90', name: 'แพ็กเกจคลายเครียด (สระผม + คอ บ่า ไหล่) 90 นาที', category: 'package', durationMin: 90, price: 680, description: 'สระผม 60 นาที ต่อด้วยนวดคอ บ่า ไหล่', roomType: 'bed' },
  { id: 'sv-ritual120', name: 'Premium Sleep Ritual 120 นาที', category: 'package', durationMin: 120, price: 1290, description: 'เตียงส่วนตัว ครบทุกขั้นตอน หลับลึกตลอดบริการ', roomType: 'vip' },
  { id: 'sv-couple90', name: 'แพ็กเกจคู่ Head Spa 90 นาที', category: 'package', durationMin: 90, price: 1500, description: 'Head Spa สำหรับ 2 ท่าน ในเตียงคู่', roomType: 'twin' },
]

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  wash: 'สระผมผ่อนคลาย',
  headspa: 'Head Spa / นวดศีรษะ',
  treatment: 'ทรีตเมนต์',
  neck: 'นวดคอ บ่า ไหล่',
  package: 'แพ็กเกจ',
}

export const STAFF: Staff[] = [
  { id: 'st-1', name: 'สมใจ ใจดี', nickname: 'ใจ', role: 'หัวหน้าช่างสระผม', workDays: [0, 1, 2, 3, 4, 5, 6], shiftStart: '10:00', shiftEnd: '22:00', skills: ['wash', 'headspa', 'treatment', 'neck', 'package'], color: '#6B8A64' },
  { id: 'st-2', name: 'มาลี สุขสันต์', nickname: 'มะลิ', role: 'ช่างสระผม', workDays: [1, 2, 3, 4, 5, 6], shiftStart: '10:00', shiftEnd: '19:00', skills: ['wash', 'headspa', 'neck', 'package'], color: '#C9962B' },
  { id: 'st-3', name: 'ปรีชา แสงทอง', nickname: 'ชา', role: 'ช่างสระผม / นวดศีรษะ', workDays: [0, 2, 3, 4, 5, 6], shiftStart: '13:00', shiftEnd: '22:00', skills: ['wash', 'headspa', 'neck', 'package'], color: '#5B8FA0' },
  { id: 'st-4', name: 'วันดี มีสุข', nickname: 'ดี', role: 'นักบำบัดหนังศีรษะ', workDays: [0, 1, 3, 4, 5, 6], shiftStart: '11:00', shiftEnd: '21:00', skills: ['headspa', 'treatment', 'package'], color: '#C06A4B' },
  { id: 'st-5', name: 'ธนากร ศรีสวัสดิ์', nickname: 'กร', role: 'ช่างสระผม', workDays: [0, 1, 2, 5, 6], shiftStart: '10:00', shiftEnd: '20:00', skills: ['wash', 'neck'], color: '#8A7BA8' },
  { id: 'st-6', name: 'รัตนา พรหมมา', nickname: 'นา', role: 'นักบำบัดหนังศีรษะ', workDays: [1, 2, 3, 4, 5, 6], shiftStart: '12:00', shiftEnd: '22:00', skills: ['wash', 'headspa', 'treatment', 'package'], color: '#B98A5E' },
]

export const ROOMS: Room[] = [
  { id: 'rm-1', name: 'เตียงสระผม 1', type: 'bed', capacityNote: '1 ท่าน' },
  { id: 'rm-2', name: 'เตียงสระผม 2', type: 'bed', capacityNote: '1 ท่าน' },
  { id: 'rm-3', name: 'เตียงสระผม 3', type: 'bed', capacityNote: '1 ท่าน' },
  { id: 'rm-4', name: 'เตียงสระผม 4', type: 'bed', capacityNote: '1 ท่าน' },
  { id: 'rm-5', name: 'เตียง VIP ส่วนตัว', type: 'vip', capacityNote: '1 ท่าน (ห้องส่วนตัว)' },
  { id: 'rm-6', name: 'เตียงคู่ ลาเวนเดอร์', type: 'twin', capacityNote: '2 ท่าน' },
]

/** เตียงที่ใช้แทนกันได้ — เตียง VIP รับงานสระผมทั่วไปได้ แต่เตียงทั่วไปรับงาน VIP ไม่ได้ */
export const ROOM_FALLBACK: Record<Room['type'], Room['type'][]> = {
  bed: ['bed', 'vip'],
  vip: ['vip'],
  twin: ['twin'],
}

export const SOURCE_LABEL: Record<AcquisitionSource, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
  google_maps: 'Google Maps',
  referral: 'เพื่อนแนะนำ',
  walk_in: 'Walk-in',
  line_oa: 'LINE OA',
  other: 'อื่น ๆ',
}

export const SOURCE_COLOR: Record<AcquisitionSource, string> = {
  facebook: '#5B8FA0',
  tiktok: '#2B2B28',
  google_maps: '#C06A4B',
  referral: '#6B8A64',
  walk_in: '#C9962B',
  line_oa: '#85A07E',
  other: '#A3A399',
}

export const AGE_GROUPS: AgeGroup[] = ['18-24', '25-34', '35-44', '45-54', '55+']

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
  no_show: 'ไม่มาตามนัด',
}

export const STATUS_ORDER: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']

/** ค่าโฆษณาตัวอย่างสำหรับเดโม (เฉพาะช่องทางที่มีการจ่ายเงินโฆษณา) */
export const MARKETING_EXPENSES: MarketingExpense[] = [
  { id: 'ex-1', month: '2026-06', source: 'facebook', amount: 4500, note: 'บูสต์โพสต์โปรโมชันเปิดเดือน' },
  { id: 'ex-2', month: '2026-07', source: 'facebook', amount: 5000, note: 'โฆษณาแพ็กเกจคลายเครียด' },
  { id: 'ex-3', month: '2026-08', source: 'facebook', amount: 5500, note: 'โฆษณาโปรโมชันวันแม่' },
  { id: 'ex-4', month: '2026-09', source: 'facebook', amount: 5000, note: 'โฆษณา Zen Head Spa' },
  { id: 'ex-5', month: '2026-10', source: 'facebook', amount: 5000, note: 'โฆษณาแพ็กเกจคู่รัก' },
  { id: 'ex-6', month: '2026-07', source: 'tiktok', amount: 3000, note: 'จ้างครีเอเตอร์รีวิว 1 คลิป' },
  { id: 'ex-7', month: '2026-08', source: 'tiktok', amount: 3000, note: 'โฆษณาคลิปสั้น' },
  { id: 'ex-8', month: '2026-09', source: 'tiktok', amount: 4000, note: 'โฆษณาคลิปสั้น 2 ชิ้น' },
  { id: 'ex-9', month: '2026-10', source: 'tiktok', amount: 3500, note: 'โฆษณาคลิปสั้น' },
]
