import type { DateRange, HHmm, ISODate } from '@/types'

/** วันเดโม — ข้อมูลทั้งหมดอ้างอิงวันนี้และเวลานี้เพื่อให้ตัวเลขสอดคล้องกัน */
export const DEMO_TODAY: ISODate = '2026-10-10'
export const DEMO_NOW: HHmm = '14:30'

export const SHOP_OPEN: HHmm = '10:00'
export const SHOP_CLOSE: HHmm = '22:00'

const pad = (n: number) => String(n).padStart(2, '0')

export function parseDate(d: ISODate): Date {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

export function toISO(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(d: ISODate, n: number): ISODate {
  const date = parseDate(d)
  date.setDate(date.getDate() + n)
  return toISO(date)
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseDate(a).getTime() - parseDate(b).getTime()) / 86400000)
}

export function dayOfWeek(d: ISODate): number {
  return parseDate(d).getDay()
}

/** วันจันทร์ของสัปดาห์นั้น */
export function startOfWeek(d: ISODate): ISODate {
  const dow = dayOfWeek(d)
  return addDays(d, dow === 0 ? -6 : 1 - dow)
}

export function startOfMonth(d: ISODate): ISODate {
  return `${d.slice(0, 7)}-01`
}

export function endOfMonth(d: ISODate): ISODate {
  const date = parseDate(d)
  return toISO(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function monthKey(d: ISODate): string {
  return d.slice(0, 7)
}

export function eachDay(range: DateRange): ISODate[] {
  const out: ISODate[] = []
  let cur = range.from
  while (cur <= range.to) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

export function inRange(d: ISODate, range: DateRange): boolean {
  return d >= range.from && d <= range.to
}

export function rangeLength(range: DateRange): number {
  return diffDays(range.to, range.from) + 1
}

/** ช่วงก่อนหน้าที่ยาวเท่ากัน ใช้เปรียบเทียบแนวโน้ม */
export function previousRange(range: DateRange): DateRange {
  const len = rangeLength(range)
  return { from: addDays(range.from, -len), to: addDays(range.from, -1) }
}

/* ---------- เวลา ---------- */

export function toMin(t: HHmm): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function fromMin(min: number): HHmm {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export function addMinutes(t: HHmm, min: number): HHmm {
  return fromMin(toMin(t) + min)
}

export function overlaps(aStart: HHmm, aEnd: HHmm, bStart: HHmm, bEnd: HHmm): boolean {
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd)
}

export function timeSlots(from: HHmm = SHOP_OPEN, to: HHmm = SHOP_CLOSE, step = 30): HHmm[] {
  const out: HHmm[] = []
  for (let m = toMin(from); m < toMin(to); m += step) out.push(fromMin(m))
  return out
}

/* ---------- การแสดงผลภาษาไทย (พ.ศ.) ---------- */

const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const TH_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
export const TH_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
export const TH_DAYS_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์']

/** 10 ต.ค. 2569 */
export function fmtDate(d: ISODate): string {
  const date = parseDate(d)
  return `${date.getDate()} ${TH_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear() + 543}`
}

/** 10 ต.ค. */
export function fmtDayMonth(d: ISODate): string {
  const date = parseDate(d)
  return `${date.getDate()} ${TH_MONTHS_SHORT[date.getMonth()]}`
}

/** วันเสาร์ที่ 10 ตุลาคม 2569 */
export function fmtDateLong(d: ISODate): string {
  const date = parseDate(d)
  return `${TH_DAYS_FULL[date.getDay()]}ที่ ${date.getDate()} ${TH_MONTHS_FULL[date.getMonth()]} ${date.getFullYear() + 543}`
}

export function fmtWeekday(d: ISODate): string {
  return TH_DAYS_SHORT[dayOfWeek(d)]
}

/** ต.ค. 69 */
export function fmtMonthShort(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${TH_MONTHS_SHORT[m - 1]} ${String(y + 543).slice(2)}`
}

export function fmtMonthFull(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${TH_MONTHS_FULL[m - 1]} ${y + 543}`
}

export function fmtRange(r: DateRange): string {
  return r.from === r.to ? fmtDate(r.from) : `${fmtDate(r.from)} – ${fmtDate(r.to)}`
}

export function fmtTimeRange(start: HHmm, end: HHmm): string {
  return `${start}–${end} น.`
}
