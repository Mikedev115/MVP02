import type { Appointment, HHmm, ISODate } from '@/types'
import { roomOptions, staffOptions, endTimeFor } from './conflicts'
import { DEMO_NOW, DEMO_TODAY, SHOP_CLOSE, SHOP_OPEN, fromMin, toMin } from './date'

export interface VacancySlot {
  start: HHmm
  /** จำนวนช่างที่ว่างและอยู่ในกะ */
  staff: number
  /** จำนวนเตียงที่ว่าง */
  beds: number
  /** จำนวนลูกค้าที่รับได้จริง = min(ช่าง, เตียง) */
  seats: number
}

/** ความจุที่เหลือ ณ เวลาเริ่มที่กำหนด สำหรับบริการสระผมมาตรฐาน */
export function capacityAt(appts: Appointment[], date: ISODate, start: HHmm, serviceId = 'sv-wash60'): VacancySlot {
  const end = endTimeFor(serviceId, start)
  const draft = { customerId: '', serviceId, date, start, end, status: 'confirmed' as const }
  const staff = staffOptions(appts, draft).filter((o) => o.free).length
  const beds = roomOptions(appts, draft).filter((o) => o.free).length
  return { start, staff, beds, seats: Math.min(staff, beds) }
}

/** ช่วงเวลาที่ยังมีที่ว่างในวันนั้น (ทุก ๆ 1 ชั่วโมง) — วันนี้เริ่มนับหลังเวลาปัจจุบัน */
export function vacancyForDay(appts: Appointment[], date: ISODate, serviceId = 'sv-wash60'): VacancySlot[] {
  const dayAppts = appts.filter((a) => a.date === date)
  const earliest = date === DEMO_TODAY ? Math.ceil((toMin(DEMO_NOW) + 1) / 30) * 30 : toMin(SHOP_OPEN)
  const slots: VacancySlot[] = []
  for (let m = Math.max(earliest, toMin(SHOP_OPEN)); m < toMin(SHOP_CLOSE); m += 60) {
    const start = fromMin(m)
    if (toMin(endTimeFor(serviceId, start)) > toMin(SHOP_CLOSE)) break
    const slot = capacityAt(dayAppts, date, start, serviceId)
    if (slot.seats > 0) slots.push(slot)
  }
  return slots
}

export type PostPlatform = 'facebook' | 'line' | 'tiktok'

export function buildVacancyPost(slots: VacancySlot[], platform: PostPlatform, dayLabel: string): string {
  const lines = slots.map((s) => `• ${s.start} น. ว่าง ${s.seats} เตียง`)
  if (!slots.length) {
    return `🌿 นุ่มดี Hair Sleep Spa\n${dayLabel}คิวเต็มแล้วค่ะ ขอบคุณทุกท่านที่ให้ความสนใจ 🙏\nติดตามคิวว่างวันถัดไปได้ในโพสต์หน้านะคะ`
  }
  if (platform === 'line') {
    return `🌿 นุ่มดี Hair Sleep Spa\n${dayLabel}ยังมีคิวว่าง\n${lines.join('\n')}\nพิมพ์เวลาที่สะดวกในแชทได้เลยค่ะ 💬`
  }
  if (platform === 'tiktok') {
    const total = slots.reduce((n, s) => n + s.seats, 0)
    return `${dayLabel}ว่าง ${total} คิว! สระผมสไตล์เวียดนาม ผ่อนคลายจนหลับ 😴💆\n${lines.join('\n')}\n#สระผม #headspa #asmr #ผ่อนคลาย #hairsleep`
  }
  return `🌿 นุ่มดี Hair Sleep Spa\n${dayLabel}ยังมีคิวว่าง ✨\n${lines.join('\n')}\nสระผมสไตล์เวียดนาม ผ่อนคลายจนหลับ 💤\nทักข้อความจองคิวได้เลยค่ะ`
}
