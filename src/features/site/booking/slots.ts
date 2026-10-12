import type { Appointment, HHmm, ISODate } from '@/types'
import { availableStarts } from '@/lib/conflicts'
import { DEMO_NOW, DEMO_TODAY, addDays, toMin } from '@/lib/date'

/** จองล่วงหน้าได้กี่วัน (นับรวมวันนี้) */
export const BOOKING_WINDOW_DAYS = 14
/** วันนี้ต้องจองล่วงหน้าอย่างน้อยกี่นาทีจากเวลาปัจจุบันของเดโม */
export const LEAD_MINUTES = 30

export function bookableDates(): ISODate[] {
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(DEMO_TODAY, i))
}

/** เวลาเริ่มที่ว่างจริงสำหรับบริการและวันที่กำหนด (ตัดเวลาที่ผ่านมาแล้วของวันนี้ออก) */
export function slotsFor(appointments: Appointment[], serviceId: string, date: ISODate, customerId = '__none__'): HHmm[] {
  // การชนกันเกิดเฉพาะวันเดียวกัน จึงกรองก่อนเพื่อลดการคำนวณ
  const sameDay = appointments.filter((a) => a.date === date)
  const starts = availableStarts(sameDay, { customerId, serviceId, date })
  if (date !== DEMO_TODAY) return starts
  const earliest = toMin(DEMO_NOW) + LEAD_MINUTES
  return starts.filter((t) => toMin(t) >= earliest)
}

export type SlotPeriod = 'morning' | 'afternoon' | 'evening'

export interface SlotGroup {
  period: SlotPeriod
  slots: HHmm[]
}

export function groupSlots(slots: HHmm[]): SlotGroup[] {
  const groups: SlotGroup[] = [
    { period: 'morning', slots: slots.filter((t) => toMin(t) < 12 * 60) },
    { period: 'afternoon', slots: slots.filter((t) => toMin(t) >= 12 * 60 && toMin(t) < 17 * 60) },
    { period: 'evening', slots: slots.filter((t) => toMin(t) >= 17 * 60) },
  ]
  return groups.filter((g) => g.slots.length > 0)
}
