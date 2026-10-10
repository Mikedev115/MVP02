import type { AcquisitionSource, AgeGroup, AppData, Appointment, AppointmentStatus, Customer, OpTask } from '@/types'
import { STAFF } from './catalog'
import { autoAssign, endTimeFor, getService } from '@/lib/conflicts'
import { DEMO_NOW, DEMO_TODAY, addDays, dayOfWeek, diffDays, toMin } from '@/lib/date'

/* ---------- ตัวสุ่มแบบกำหนดค่าเริ่มต้นได้ ให้ข้อมูลเหมือนเดิมทุกครั้งที่โหลด ---------- */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DATA_START = '2026-06-01'
const DATA_END = '2026-10-31'
const VIRAL_START = '2026-09-14'

const FIRST_NAMES = ['กมล', 'กานดา', 'กิตติ', 'จิราพร', 'จุฑามาศ', 'ชนิดา', 'ชลธี', 'ณัฐพล', 'ณัฐธิดา', 'ดวงใจ', 'ทิพย์วรรณ', 'ธีรภัทร', 'นภัสสร', 'นิรันดร์', 'บุษบา', 'ปณิดา', 'ปวีณา', 'พชร', 'พรทิพย์', 'พิมพ์ลดา', 'ภูริช', 'มนัสวี', 'เมธา', 'ยุพิน', 'รุ่งนภา', 'วรกานต์', 'วิภาวี', 'ศรัณย์', 'ศศิธร', 'สมพร', 'สิริกร', 'สุกัญญา', 'สุรชัย', 'อรทัย', 'อภิชาติ', 'อัจฉรา', 'อาทิตย์', 'เอกชัย', 'ไอริน', 'ธัญญ์สิริ']
const LAST_NAMES = ['แก้วประเสริฐ', 'จันทร์เพ็ญ', 'เจริญสุข', 'ชัยมงคล', 'ดวงดี', 'ทองสุข', 'นาคทอง', 'บุญมี', 'ประเสริฐศรี', 'พงษ์สวัสดิ์', 'พูนทรัพย์', 'แพงดี', 'มณีรัตน์', 'รุ่งเรือง', 'วงศ์สุวรรณ', 'ศรีทอง', 'สมบูรณ์', 'สุขเจริญ', 'หอมจันทร์', 'อินทร์แก้ว', 'เกษมสุข', 'คำแสน', 'งามเลิศ', 'จิตรดี', 'ใจเย็น', 'ธรรมรักษ์', 'นิลวรรณ', 'ปัญญาดี', 'พรหมสุข', 'มีทรัพย์']
const NICKNAMES = ['ฟ้า', 'ใบเตย', 'เบล', 'มุก', 'ออม', 'แพร', 'ต้น', 'ปอ', 'บีม', 'นัท', 'แอน', 'จูน', 'ไอซ์', 'กิ๊ฟ', 'เฟิร์น', 'อาร์ม', 'บอส', 'น้ำ', 'พลอย', 'หนูนา', 'เจ', 'ปุ้ย', 'แจ๋ว', 'โอ๋', 'เนย', 'ฝน', 'ตั้ม', 'แบงค์', 'เต้', 'มิ้นท์']

const SOURCE_WEIGHTS: [AcquisitionSource, number][] = [
  ['tiktok', 28], ['facebook', 21], ['google_maps', 14], ['referral', 13], ['walk_in', 10], ['line_oa', 9], ['other', 5],
]
const AGE_WEIGHTS: [AgeGroup, number][] = [['18-24', 10], ['25-34', 32], ['35-44', 30], ['45-54', 18], ['55+', 10]]
const SERVICE_WEIGHTS: Record<string, number> = {
  'sv-wash45': 12, 'sv-wash60': 20, 'sv-asmr90': 14, 'sv-zen60': 12, 'sv-zen90': 8, 'sv-herbal60': 8,
  'sv-detox60': 6, 'sv-repair75': 4, 'sv-neck30': 3, 'sv-neck60': 5, 'sv-relax90': 6, 'sv-ritual120': 2, 'sv-couple90': 3,
}
const DOW_WEIGHT = [1.6, 0.75, 0.75, 0.85, 1.0, 1.4, 1.9]
const HOUR_WEIGHT: Record<number, number> = { 10: 0.5, 11: 0.7, 12: 0.8, 13: 1, 14: 1, 15: 1.1, 16: 1.3, 17: 1.8, 18: 2, 19: 1.7, 20: 1.1, 21: 0.3 }
const CANCEL_REASONS = ['ลูกค้าติดธุระกะทันหัน', 'ลูกค้าเปลี่ยนแผน', 'ลูกค้าไม่สบาย', 'ขอเลื่อนไปวันอื่น', 'เดินทางไม่สะดวก']

function pickWeighted<T>(rnd: () => number, items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of items) {
    r -= w
    if (r <= 0) return v
  }
  return items[items.length - 1][0]
}

type Loyalty = 'one' | 'occasional' | 'regular'

interface WantedVisit {
  customerIdx: number
  target: string
}

export function buildSeedData(): AppData {
  const rnd = mulberry32(20261010)
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))

  /* ---- 1) ลูกค้าสมมติ + พฤติกรรมการกลับมาใช้บริการ ---- */
  interface Draft {
    name: string; nickname: string; phone: string; source: AcquisitionSource; ageGroup?: AgeGroup
    loyalty: Loyalty; favServices: string[]; favStaff?: string; join: string; lineId?: string
  }
  const drafts: Draft[] = []
  const usedNames = new Set<string>()
  const span = diffDays(addDays(DEMO_TODAY, -2), DATA_START)
  const TOTAL = 720

  for (let i = 0; i < TOTAL; i++) {
    let name = ''
    do name = `${FIRST_NAMES[int(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[int(0, LAST_NAMES.length - 1)]}`
    while (usedNames.has(name))
    usedNames.add(name)
    const source = pickWeighted(rnd, SOURCE_WEIGHTS)
    const loyal = source === 'referral' || source === 'google_maps' ? 1.35 : source === 'tiktok' ? 0.7 : 1
    const r = rnd()
    const loyalty: Loyalty = r < 0.3 / loyal ? 'one' : r < 0.3 / loyal + 0.3 ? 'occasional' : 'regular'
    // ลูกค้าเพิ่มขึ้นเรื่อย ๆ เมื่อร้านโตขึ้น (เอียงไปทางวันหลัง ๆ)
    let join = addDays(DATA_START, Math.floor(Math.pow(rnd(), 0.7) * span))
    // คลิป TikTok สมมติที่ไวรัลช่วง 14–20 ก.ย. ทำให้ลูกค้าใหม่จาก TikTok พุ่งขึ้นช่วงนั้น
    if (source === 'tiktok' && rnd() < 0.4) join = addDays(VIRAL_START, int(0, 6))
    const fav1 = pickWeighted(rnd, Object.entries(SERVICE_WEIGHTS))
    const fav2 = rnd() < 0.4 ? pickWeighted(rnd, Object.entries(SERVICE_WEIGHTS)) : fav1
    drafts.push({
      name,
      nickname: NICKNAMES[int(0, NICKNAMES.length - 1)],
      phone: `0${rnd() < 0.5 ? 8 : 9}${int(0, 9)}-000-${String(int(0, 9999)).padStart(4, '0')}`,
      source,
      ageGroup: rnd() < 0.72 ? pickWeighted(rnd, AGE_WEIGHTS) : undefined,
      loyalty,
      favServices: [fav1, fav2],
      favStaff: rnd() < 0.5 ? STAFF[int(0, STAFF.length - 1)].id : undefined,
      join,
      lineId: rnd() < 0.35 ? `demo_${int(1000, 9999)}` : undefined,
    })
  }

  /* ---- 2) ความต้องการจองของแต่ละคน ---- */
  const wanted: WantedVisit[] = []
  const lastBookable = addDays(DEMO_TODAY, 21)
  drafts.forEach((d, idx) => {
    let target = d.join
    wanted.push({ customerIdx: idx, target })
    if (d.loyalty === 'one') return
    for (let n = 0; n < 14; n++) {
      const gap = d.loyalty === 'regular' ? int(10, 24) : int(24, 45)
      target = addDays(target, gap)
      if (target > DATA_END) break
      if (d.loyalty === 'regular' && rnd() < 0.06) break // เลิกมาใช้บริการ
      if (d.loyalty === 'occasional' && rnd() < 0.15) break
      // การจองล่วงหน้ามีเฉพาะอนาคตใกล้ ๆ
      if (target > DEMO_TODAY && (target > lastBookable || rnd() < 0.45)) continue
      wanted.push({ customerIdx: idx, target })
    }
  })
  wanted.sort((a, b) => (a.target < b.target ? -1 : a.target > b.target ? 1 : 0))

  /* ---- 3) จัดคิวโดยใช้ตัวตรวจสอบการชนเดียวกับระบบจริง ---- */
  const customerIds = drafts.map((_, i) => `cu-${String(i + 1).padStart(3, '0')}`)
  const placed: Appointment[] = []
  const byDate = new Map<string, Appointment[]>()
  let seq = 0

  for (const w of wanted) {
    const d = drafts[w.customerIdx]
    const cid = customerIds[w.customerIdx]
    let done = false
    for (let attempt = 0; attempt < 17 && !done; attempt++) {
      // เลือกวันใกล้เคียงวันเป้าหมาย โดยถ่วงน้ำหนักตามความนิยมของวัน
      const offsets = [0, 1, -1, 2, -2, 3, -3]
      const cand = attempt < 10
        ? addDays(w.target, pickWeighted(rnd, offsets.map((o) => [o, DOW_WEIGHT[dayOfWeek(addDays(w.target, o))] ** 1.5] as [number, number])))
        : addDays(w.target, offsets[attempt - 10])
      if (cand < DATA_START || cand > DATA_END) continue
      if (cand > DEMO_TODAY && w.target <= DEMO_TODAY) continue
      if (cand < DEMO_TODAY && w.target >= DEMO_TODAY) continue
      if (cand === DEMO_TODAY && w.target < DEMO_TODAY) continue
      if (cand < d.join) continue
      const serviceId = rnd() < 0.68 ? d.favServices[int(0, 1)] : pickWeighted(rnd, Object.entries(SERVICE_WEIGHTS))
      const hour = pickWeighted(rnd, Object.entries(HOUR_WEIGHT).map(([h, wt]) => [Number(h), wt * (dayOfWeek(cand) === 6 && Number(h) >= 13 && Number(h) <= 17 ? 1.4 : 1) * (cand === DEMO_TODAY && Number(h) <= 13 ? 3 : 1)] as [number, number]))
      const start = `${String(hour).padStart(2, '0')}:${rnd() < 0.5 ? '00' : '30'}`
      const end = endTimeFor(serviceId, start)
      const base = { customerId: cid, serviceId, date: cand, start, end, status: 'confirmed' as AppointmentStatus }
      const dayList = byDate.get(cand) ?? []
      const assigned = autoAssign(dayList, base, rnd() < 0.55 ? d.favStaff : undefined, rnd)
      if (!assigned) continue
      // ลูกค้าไม่ควรนัดซ้อนตัวเอง
      if (dayList.some((a) => a.customerId === cid && toMin(a.start) < toMin(end) && toMin(start) < toMin(a.end))) continue
      seq++
      const svc = getService(serviceId)!
      const appt: Appointment = {
        id: `ap-${String(seq).padStart(4, '0')}`,
        customerId: cid,
        serviceId,
        staffId: assigned.staffId,
        roomId: assigned.roomId,
        date: cand,
        start,
        end,
        status: 'confirmed',
        price: svc.price,
        createdAt: d.source === 'walk_in' ? cand : addDays(cand, -int(0, 6)),
      }
      placed.push(appt)
      dayList.push(appt)
      byDate.set(cand, dayList)
      done = true
    }
  }

  /* ---- 4) กำหนดสถานะตามวันที่ ---- */
  const nowMin = toMin(DEMO_NOW)
  for (const a of placed) {
    const r = rnd()
    const src = drafts[customerIds.indexOf(a.customerId)].source
    const noShowRate = src === 'tiktok' ? 0.13 : src === 'facebook' ? 0.085 : src === 'referral' ? 0.015 : 0.04
    let status: AppointmentStatus
    if (a.date < DEMO_TODAY || (a.date === DEMO_TODAY && toMin(a.end) <= nowMin)) {
      status = r < 0.075 ? 'cancelled' : r < 0.075 + noShowRate ? 'no_show' : 'completed'
    } else if (a.date === DEMO_TODAY) {
      status = toMin(a.start) <= nowMin ? 'confirmed' : r < 0.3 ? 'pending' : r < 0.36 ? 'cancelled' : 'confirmed'
    } else if (a.date === addDays(DEMO_TODAY, 1)) {
      status = r < 0.4 ? 'pending' : r < 0.45 ? 'cancelled' : 'confirmed'
    } else {
      status = r < 0.3 ? 'pending' : r < 0.34 ? 'cancelled' : 'confirmed'
    }
    a.status = status
    if (status === 'cancelled') a.cancelReason = CANCEL_REASONS[int(0, CANCEL_REASONS.length - 1)]
    if (a.createdAt > a.date) a.createdAt = a.date
  }

  // ทำให้เดโมวันนี้มีงานให้ทำเสมอ: คิวรอยืนยันอย่างน้อย 3 คิว และมี 1 คิวที่ลูกค้ายกเลิก
  const laterToday = placed.filter((a) => a.date === DEMO_TODAY && toMin(a.start) > nowMin && a.status !== 'cancelled').sort((a, b) => toMin(b.start) - toMin(a.start))
  laterToday.slice(0, 3).forEach((a) => (a.status = 'pending'))
  const cancelTarget = placed.find((a) => a.date === DEMO_TODAY && a.status === 'completed')
  if (cancelTarget) {
    cancelTarget.status = 'cancelled'
    cancelTarget.cancelReason = CANCEL_REASONS[0]
  }

  placed.sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1))
  placed.forEach((a, i) => (a.id = `ap-${String(i + 1).padStart(4, '0')}`))

  /* ---- 5) ลูกค้า: วันที่ลงทะเบียน = วันที่จองครั้งแรก ---- */
  const customers: Customer[] = drafts.map((d, i) => {
    const mine = placed.filter((a) => a.customerId === customerIds[i])
    const first = (mine.find((a) => a.status !== 'cancelled') ?? mine[0])?.date ?? d.join
    return {
      id: customerIds[i],
      name: d.name,
      nickname: d.nickname,
      phone: d.phone,
      lineId: d.lineId,
      ageGroup: d.ageGroup,
      source: d.source,
      createdAt: first,
      note: d.loyalty === 'regular' && i % 7 === 0 ? 'ชอบเตียงมุมเงียบ' : undefined,
    }
  })

  return { customers, appointments: placed, tasks: buildTasks() }
}

function buildTasks(): OpTask[] {
  const y = addDays(DEMO_TODAY, -1)
  const t = DEMO_TODAY
  const done = (date: string, time: string) => `${date}T${time}`
  const mk = (id: string, title: string, group: OpTask['group'], date: string, dueTime: string, status: OpTask['status'], assigneeId?: string, note?: string): OpTask => ({
    id, title, group, date, dueTime, status, assigneeId, note, completedAt: status === 'done' ? done(date, dueTime) : undefined,
  })
  return [
    // เมื่อวาน (บางรายการยังค้าง → แสดงเป็นงานเลยกำหนด)
    mk('tk-y1', 'สั่งซื้อแชมพูสมุนไพรและน้ำมันนวดศีรษะเพิ่ม', 'general', y, '17:00', 'todo', 'st-1', 'แชมพูสมุนไพรเหลือน้อยกว่า 2 ขวด'),
    mk('tk-y2', 'ปิดยอดเงินสดและเก็บเข้าตู้เซฟ', 'closing', y, '22:30', 'done', 'st-6'),
    mk('tk-y3', 'ล็อกประตูและปิดไฟทุกเตียง', 'closing', y, '22:45', 'done', 'st-6'),
    // เปิดร้านวันนี้
    mk('tk-o1', 'เปิดไฟ แอร์ และเปิดเพลงผ่อนคลาย (เสียง ASMR)', 'opening', t, '09:30', 'done', 'st-5'),
    mk('tk-o2', 'ตรวจความสะอาดเตียงสระผมและอ่างล้างทุกเตียง', 'opening', t, '09:45', 'done', 'st-5'),
    mk('tk-o3', 'เตรียมผ้าขนหนูและผ้าคลุมไหล่สะอาดประจำเตียง', 'opening', t, '09:50', 'done', 'st-2'),
    mk('tk-o4', 'ตรวจระบบน้ำอุ่นและฝักบัวสระผม', 'opening', t, '10:00', 'in_progress', 'st-2', 'เตียง 3 น้ำอุ่นช้า ต้องแจ้งช่างซ่อม'),
    mk('tk-o5', 'ตรวจสอบรายการจองของวันนี้', 'opening', t, '10:00', 'done', 'st-1'),
    // งานระหว่างวัน
    mk('tk-g1', 'โทรยืนยันคิวลูกค้าช่วงเย็นที่ยังรอยืนยัน', 'general', t, '13:00', 'in_progress', 'st-1'),
    mk('tk-g2', 'เติมน้ำมันนวดศีรษะที่เตียง VIP', 'general', t, '15:00', 'todo', 'st-4'),
    mk('tk-g3', 'ซักผ้าขนหนูชุดที่ 2 และพับเก็บ', 'general', t, '16:30', 'todo', 'st-5'),
    mk('tk-g4', 'ตอบแชท Facebook และ LINE OA', 'general', t, '12:00', 'done', 'st-1'),
    mk('tk-g5', 'เตรียมน้ำสมุนไพรต้อนรับลูกค้าช่วงเย็น', 'general', t, '17:00', 'todo', 'st-6'),
    // ปิดร้าน
    mk('tk-c1', 'เก็บผ้าใช้แล้วและล้างทำความสะอาดเตียงสระผม', 'closing', t, '22:00', 'todo', 'st-6'),
    mk('tk-c2', 'ปิดยอดเงินสดและบันทึกรายรับ', 'closing', t, '22:15', 'todo', 'st-1'),
    mk('tk-c3', 'ปิดแอร์ ไฟ น้ำอุ่น และล็อกประตู', 'closing', t, '22:30', 'todo', 'st-6'),
  ]
}

export const seedSnapshot = (): AppData => buildSeedData()
