import { ROOMS, ROOM_FALLBACK, SERVICES, STAFF } from '@/data/catalog'
import type { Appointment, AppointmentStatus, ConflictIssue, HHmm, ISODate, Room, Service, Staff } from '@/types'
import { SHOP_CLOSE, SHOP_OPEN, addMinutes, dayOfWeek, overlaps, timeSlots, toMin } from './date'

/** สถานะที่ "ถือครอง" ช่วงเวลา พนักงาน และเตียง */
export const BLOCKING: AppointmentStatus[] = ['pending', 'confirmed', 'completed']
export const isBlocking = (s: AppointmentStatus) => BLOCKING.includes(s)

export const getService = (id: string): Service | undefined => SERVICES.find((s) => s.id === id)
export const getStaff = (id: string): Staff | undefined => STAFF.find((s) => s.id === id)
export const getRoom = (id: string): Room | undefined => ROOMS.find((r) => r.id === id)

export interface SlotDraft {
  /** รหัสการจองที่กำลังแก้ไข (ไม่นับเป็นตัวชนกับตัวเอง) */
  id?: string
  customerId: string
  serviceId: string
  staffId: string
  roomId: string
  date: ISODate
  start: HHmm
  end: HHmm
  status: AppointmentStatus
}

export function endTimeFor(serviceId: string, start: HHmm): HHmm {
  const svc = getService(serviceId)
  return addMinutes(start, svc?.durationMin ?? 60)
}

export function staffWorks(staff: Staff, date: ISODate, start: HHmm, end: HHmm): boolean {
  return staff.workDays.includes(dayOfWeek(date)) && toMin(start) >= toMin(staff.shiftStart) && toMin(end) <= toMin(staff.shiftEnd)
}

export function roomSuits(service: Service, room: Room): boolean {
  return ROOM_FALLBACK[service.roomType].includes(room.type)
}

export type TimeDraft = Omit<SlotDraft, 'staffId' | 'roomId'>

function clash(a: Appointment, d: Pick<SlotDraft, 'id' | 'date' | 'start' | 'end'>): boolean {
  return a.id !== d.id && isBlocking(a.status) && a.date === d.date && overlaps(a.start, a.end, d.start, d.end)
}

/** ตรวจสอบการชนกันของเวลา พนักงาน เตียง และลูกค้า */
export function findConflicts(appointments: Appointment[], d: SlotDraft): ConflictIssue[] {
  if (!isBlocking(d.status)) return []
  const issues: ConflictIssue[] = []
  const svc = getService(d.serviceId)
  const staff = getStaff(d.staffId)
  const room = getRoom(d.roomId)

  if (toMin(d.start) < toMin(SHOP_OPEN) || toMin(d.end) > toMin(SHOP_CLOSE)) {
    issues.push({ kind: 'closed', message: `เวลาอยู่นอกเวลาทำการของร้าน (${SHOP_OPEN}–${SHOP_CLOSE} น.)` })
  }
  if (staff) {
    if (!staffWorks(staff, d.date, d.start, d.end)) {
      issues.push({ kind: 'staff_off', message: `${staff.nickname} ไม่ได้อยู่ในกะทำงานช่วงเวลานี้ (กะ ${staff.shiftStart}–${staff.shiftEnd} น.)` })
    }
    if (svc && !staff.skills.includes(svc.category)) {
      issues.push({ kind: 'skill', message: `${staff.nickname} ไม่ได้ให้บริการประเภทนี้` })
    }
  }
  if (svc && room && !roomSuits(svc, room)) {
    issues.push({ kind: 'room_type', message: `${room.name} ไม่เหมาะกับบริการนี้` })
  }
  for (const a of appointments) {
    if (!clash(a, d)) continue
    if (a.staffId === d.staffId) {
      issues.push({ kind: 'staff', appointmentId: a.id, message: `${staff?.nickname ?? 'พนักงาน'} มีคิวซ้อน ${a.start}–${a.end} น.` })
    }
    if (a.roomId === d.roomId) {
      issues.push({ kind: 'room', appointmentId: a.id, message: `${room?.name ?? 'เตียง'} ถูกใช้งานอยู่ ${a.start}–${a.end} น.` })
    }
    if (a.customerId === d.customerId) {
      issues.push({ kind: 'customer', appointmentId: a.id, message: `ลูกค้ามีนัดอื่นในช่วงเวลา ${a.start}–${a.end} น.` })
    }
  }
  return issues
}

export function staffOptions(appointments: Appointment[], d: TimeDraft): { staff: Staff; free: boolean }[] {
  const svc = getService(d.serviceId)
  return STAFF.filter((s) => !svc || s.skills.includes(svc.category)).map((s) => ({
    staff: s,
    free: staffWorks(s, d.date, d.start, d.end) && !appointments.some((a) => clash(a, d) && a.staffId === s.id),
  }))
}

export function roomOptions(appointments: Appointment[], d: TimeDraft): { room: Room; free: boolean }[] {
  const svc = getService(d.serviceId)
  return ROOMS.filter((r) => !svc || roomSuits(svc, r)).map((r) => ({
    room: r,
    free: !appointments.some((a) => clash(a, d) && a.roomId === r.id),
  }))
}

/** เวลาที่ยังมีพนักงานและเตียงว่างพร้อมให้บริการตามบริการที่เลือก */
export function availableStarts(appointments: Appointment[], base: Pick<SlotDraft, 'id' | 'customerId' | 'serviceId' | 'date'>): HHmm[] {
  return timeSlots().filter((start) => {
    const end = endTimeFor(base.serviceId, start)
    if (toMin(end) > toMin(SHOP_CLOSE)) return false
    const draft = { ...base, start, end, status: 'confirmed' as const }
    const s = staffOptions(appointments, draft).some((o) => o.free)
    const r = roomOptions(appointments, draft).some((o) => o.free)
    const c = !appointments.some((a) => clash(a, draft) && a.customerId === base.customerId)
    return s && r && c
  })
}

/** เลือกพนักงานและเตียงที่ว่างให้อัตโนมัติ (ใช้ตอนสร้างข้อมูลตัวอย่างและปุ่ม "เลือกให้อัตโนมัติ") */
export function autoAssign(
  appointments: Appointment[],
  d: TimeDraft,
  preferStaffId?: string,
  /** ตัวสุ่ม (ใช้ตอนสร้างข้อมูลตัวอย่าง) — ถ้าไม่ส่งมาจะเลือกคนแรกที่ว่าง */
  rnd?: () => number,
): { staffId: string; roomId: string } | null {
  const staffs = staffOptions(appointments, { ...d }).filter((o) => o.free)
  if (!staffs.length) return null
  if (rnd) staffs.sort(() => rnd() - 0.5)
  staffs.sort((a, b) => (a.staff.id === preferStaffId ? -1 : b.staff.id === preferStaffId ? 1 : 0))
  const svc = getService(d.serviceId)
  const rooms = roomOptions(appointments, { ...d }).filter((o) => o.free)
  if (rnd) rooms.sort(() => rnd() - 0.5)
  rooms.sort((a, b) => Number(svc && b.room.type === svc.roomType) - Number(svc && a.room.type === svc.roomType))
  if (!rooms.length) return null
  return { staffId: staffs[0].staff.id, roomId: rooms[0].room.id }
}
