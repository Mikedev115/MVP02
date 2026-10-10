import { CATEGORY_LABEL, ROOMS, SERVICES, SOURCE_LABEL, STAFF } from '@/data/catalog'
import type { AcquisitionSource, AgeGroup, AppData, Appointment, AppointmentStatus, Customer, CustomerSegment, DateRange, ISODate, ServiceCategory } from '@/types'
import { DEMO_TODAY, SHOP_CLOSE, SHOP_OPEN, addDays, dayOfWeek, diffDays, eachDay, fmtDayMonth, fmtMonthShort, inRange, monthKey, previousRange, rangeLength, startOfWeek, toMin } from './date'
import { getService, isBlocking } from './conflicts'
import { groupBy, sum } from './format'

/* ============================================================
 * ตัวเลขทั้งหมดในระบบคำนวณจาก AppData ชุดเดียวกัน
 * ไม่มีตัวเลขสรุปที่ถูกกำหนดค่าไว้ล่วงหน้า
 * ============================================================ */

export const apptsInRange = (appts: Appointment[], range: DateRange) => appts.filter((a) => inRange(a.date, range))

export function statusCounts(appts: Appointment[]): Record<AppointmentStatus, number> {
  const out: Record<AppointmentStatus, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 }
  for (const a of appts) out[a.status]++
  return out
}

export const completed = (appts: Appointment[]) => appts.filter((a) => a.status === 'completed')
export const revenueOf = (appts: Appointment[]) => sum(completed(appts).map((a) => a.price))
/** รายได้ที่คาดว่าจะได้จากคิวที่ยังไม่เสร็จสิ้น */
export const pipelineRevenue = (appts: Appointment[]) => sum(appts.filter((a) => a.status === 'pending' || a.status === 'confirmed').map((a) => a.price))

/* ---------- ลูกค้า ---------- */

export interface CustomerStats {
  customer: Customer
  visits: number
  totalSpent: number
  firstVisit?: ISODate
  lastVisit?: ISODate
  /** จำนวนวันเฉลี่ยระหว่างการมาใช้บริการ */
  avgGapDays?: number
  favoriteServiceIds: string[]
  upcoming: Appointment[]
  cancelled: number
  noShow: number
  history: Appointment[]
  segment: CustomerSegment
  firstApptDate?: ISODate
}

export function buildCustomerStats(data: AppData, today: ISODate = DEMO_TODAY): Map<string, CustomerStats> {
  const byCustomer = groupBy(data.appointments, (a) => a.customerId)
  const map = new Map<string, CustomerStats>()
  for (const c of data.customers) {
    const mine = (byCustomer[c.id] ?? []).slice().sort((a, b) => (a.date + a.start < b.date + b.start ? 1 : -1))
    const done = mine.filter((a) => a.status === 'completed')
    const dates = done.map((a) => a.date).sort()
    const upcoming = mine.filter((a) => (a.status === 'pending' || a.status === 'confirmed') && a.date >= today).reverse()
    let avgGap: number | undefined
    if (dates.length >= 2) avgGap = diffDays(dates[dates.length - 1], dates[0]) / (dates.length - 1)
    const counts: Record<string, number> = {}
    for (const a of done) counts[a.serviceId] = (counts[a.serviceId] ?? 0) + 1
    const fav = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
    const lastVisit = dates[dates.length - 1]
    let segment: CustomerSegment
    const idle = lastVisit ? diffDays(today, lastVisit) : diffDays(today, c.createdAt)
    if (!upcoming.length && idle > 60) segment = 'inactive'
    else segment = done.length >= 2 ? 'returning' : 'new'
    const nonCancelled = mine.filter((a) => a.status !== 'cancelled').map((a) => a.date).sort()
    map.set(c.id, {
      customer: c,
      visits: done.length,
      totalSpent: sum(done.map((a) => a.price)),
      firstVisit: dates[0],
      lastVisit,
      avgGapDays: avgGap,
      favoriteServiceIds: fav,
      upcoming,
      cancelled: mine.filter((a) => a.status === 'cancelled').length,
      noShow: mine.filter((a) => a.status === 'no_show').length,
      history: mine,
      segment,
      firstApptDate: nonCancelled[0],
    })
  }
  return map
}

export const SEGMENT_LABEL: Record<CustomerSegment, string> = { new: 'ลูกค้าใหม่', returning: 'ลูกค้าประจำ', inactive: 'ไม่ได้กลับมานาน' }
export const SEGMENT_HINT: Record<CustomerSegment, string> = {
  new: 'มาใช้บริการไม่เกิน 1 ครั้ง และยังไม่หายไปเกิน 60 วัน',
  returning: 'ใช้บริการสำเร็จตั้งแต่ 2 ครั้งขึ้นไป และยังติดต่อกันอยู่',
  inactive: 'ไม่มีนัดล่วงหน้า และไม่ได้มาเกิน 60 วัน',
}

/** ลูกค้าใหม่ในช่วงเวลา = ลูกค้าที่ลงทะเบียนในช่วงนั้น (วันที่ใช้บริการครั้งแรกหรือวันที่เพิ่มข้อมูล) */
export function customersCreatedIn(data: AppData, range: DateRange) {
  return data.customers.filter((c) => inRange(c.createdAt, range))
}

export interface NewReturning {
  newCustomers: number
  returningCustomers: number
  activeCustomers: number
}

/** ลูกค้าที่มีการจอง (ไม่ยกเลิก) ในช่วงเวลา แยกใหม่/ประจำ */
export function newVsReturning(data: AppData, range: DateRange): NewReturning {
  const active = new Set(apptsInRange(data.appointments, range).filter((a) => a.status !== 'cancelled').map((a) => a.customerId))
  const created = new Map(data.customers.map((c) => [c.id, c.createdAt]))
  let n = 0
  let r = 0
  active.forEach((id) => {
    const cd = created.get(id)
    if (cd && cd >= range.from) n++
    else r++
  })
  return { newCustomers: n, returningCustomers: r, activeCustomers: active.size }
}

/* ---------- ตัวชี้วัดหลักของภาพรวม ---------- */

export interface Kpis {
  revenue: number
  bookings: number
  completed: number
  cancelled: number
  noShow: number
  pending: number
  confirmed: number
  avgRevenuePerBooking: number
  cancellationRate: number
  noShowRate: number
  pipeline: number
  newCustomers: number
  returningCustomers: number
  activeCustomers: number
}

export function computeKpis(data: AppData, range: DateRange): Kpis {
  const appts = apptsInRange(data.appointments, range)
  const c = statusCounts(appts)
  const rev = revenueOf(appts)
  const nr = newVsReturning(data, range)
  return {
    revenue: rev,
    bookings: appts.length,
    completed: c.completed,
    cancelled: c.cancelled,
    noShow: c.no_show,
    pending: c.pending,
    confirmed: c.confirmed,
    avgRevenuePerBooking: c.completed ? rev / c.completed : 0,
    cancellationRate: appts.length ? c.cancelled / appts.length : 0,
    noShowRate: appts.length ? c.no_show / appts.length : 0,
    pipeline: pipelineRevenue(appts),
    ...nr,
  }
}

export function kpisWithPrevious(data: AppData, range: DateRange) {
  return { current: computeKpis(data, range), previous: computeKpis(data, previousRange(range)) }
}

/* ---------- อนุกรมเวลา ---------- */

export type Granularity = 'day' | 'week' | 'month'

export interface TrendPoint {
  key: string
  label: string
  revenue: number
  bookings: number
  completed: number
  cancelled: number
  newCustomers: number
  returningCustomers: number
}

function bucketKey(d: ISODate, g: Granularity): string {
  if (g === 'day') return d
  if (g === 'week') return startOfWeek(d)
  return monthKey(d)
}

export function defaultGranularity(range: DateRange): Granularity {
  const len = rangeLength(range)
  return len <= 31 ? 'day' : len <= 120 ? 'week' : 'month'
}

export function trendSeries(data: AppData, range: DateRange, g: Granularity): TrendPoint[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const d of eachDay(range)) {
    const k = bucketKey(d, g)
    if (!seen.has(k)) { seen.add(k); keys.push(k) }
  }
  const pts = new Map<string, TrendPoint>(
    keys.map((k) => [k, {
      key: k,
      label: g === 'month' ? fmtMonthShort(k) : fmtDayMonth(k),
      revenue: 0, bookings: 0, completed: 0, cancelled: 0, newCustomers: 0, returningCustomers: 0,
    }]),
  )
  const created = new Map(data.customers.map((c) => [c.id, c.createdAt]))
  const seenCustomerBucket = new Set<string>()
  for (const a of apptsInRange(data.appointments, range)) {
    const p = pts.get(bucketKey(a.date, g))
    if (!p) continue
    p.bookings++
    if (a.status === 'completed') { p.completed++; p.revenue += a.price }
    if (a.status === 'cancelled') p.cancelled++
    if (a.status !== 'cancelled') {
      const sk = `${p.key}|${a.customerId}`
      if (!seenCustomerBucket.has(sk)) {
        seenCustomerBucket.add(sk)
        const cd = created.get(a.customerId) ?? '9999'
        if (cd >= (g === 'day' ? p.key : g === 'week' ? p.key : `${p.key}-01`)) p.newCustomers++
        else p.returningCustomers++
      }
    }
  }
  return keys.map((k) => pts.get(k)!)
}

/* ---------- บริการ ---------- */

export interface ServiceStat { id: string; name: string; category: ServiceCategory; count: number; revenue: number }

export function serviceStats(appts: Appointment[]): ServiceStat[] {
  const rows = SERVICES.map((s) => {
    const mine = appts.filter((a) => a.serviceId === s.id && a.status === 'completed')
    return { id: s.id, name: s.name, category: s.category, count: mine.length, revenue: sum(mine.map((a) => a.price)) }
  })
  return rows.filter((r) => r.count > 0).sort((a, b) => b.count - a.count)
}

export function categoryRevenue(appts: Appointment[]) {
  const out: Record<ServiceCategory, { count: number; revenue: number }> = {
    wash: { count: 0, revenue: 0 }, headspa: { count: 0, revenue: 0 }, treatment: { count: 0, revenue: 0 }, neck: { count: 0, revenue: 0 }, package: { count: 0, revenue: 0 },
  }
  for (const a of completed(appts)) {
    const cat = getService(a.serviceId)?.category
    if (!cat) continue
    out[cat].count++
    out[cat].revenue += a.price
  }
  return (Object.keys(out) as ServiceCategory[]).map((k) => ({ key: k, label: CATEGORY_LABEL[k], ...out[k] })).filter((r) => r.count > 0).sort((a, b) => b.revenue - a.revenue)
}

/* ---------- ช่องทางและกลุ่มลูกค้า ---------- */

export interface SourceStat {
  source: AcquisitionSource
  label: string
  customers: number
  /** ลูกค้าจากช่องทางนี้ที่ใช้บริการสำเร็จตั้งแต่ 2 ครั้ง */
  repeat: number
  repeatRate: number
  revenue: number
}

export function sourceStats(customers: Customer[], stats: Map<string, CustomerStats>): SourceStat[] {
  const out = new Map<AcquisitionSource, SourceStat>()
  for (const c of customers) {
    const st = stats.get(c.id)
    const row = out.get(c.source) ?? { source: c.source, label: SOURCE_LABEL[c.source], customers: 0, repeat: 0, repeatRate: 0, revenue: 0 }
    row.customers++
    if (st && st.visits >= 2) row.repeat++
    row.revenue += st?.totalSpent ?? 0
    out.set(c.source, row)
  }
  return [...out.values()].map((r) => ({ ...r, repeatRate: r.customers ? r.repeat / r.customers : 0 })).sort((a, b) => b.customers - a.customers)
}

export function ageDistribution(customers: Customer[]): { group: AgeGroup | 'unknown'; label: string; count: number }[] {
  const order: (AgeGroup | 'unknown')[] = ['18-24', '25-34', '35-44', '45-54', '55+', 'unknown']
  return order.map((g) => ({ group: g, label: g === 'unknown' ? 'ไม่ระบุ' : `${g} ปี`, count: customers.filter((c) => (c.ageGroup ?? 'unknown') === g).length }))
}

/* ---------- ช่วงเวลายอดนิยม ---------- */

/** นับคิวที่ถือครองเวลา (ไม่รวมยกเลิก/ไม่มา) แยกตามวันในสัปดาห์และชั่วโมง */
export function demandHeatmap(appts: Appointment[]) {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(12).fill(0))
  for (const a of appts) {
    if (!isBlocking(a.status)) continue
    const h = Math.floor(toMin(a.start) / 60)
    if (h < 10 || h > 21) continue
    grid[dayOfWeek(a.date)][h - 10]++
  }
  return grid
}

export function weekdayStats(appts: Appointment[]) {
  const labels = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const mine = appts.filter((a) => dayOfWeek(a.date) === d)
    const dates = new Set(mine.map((a) => a.date))
    return {
      dow: d,
      label: labels[d],
      bookings: mine.filter((a) => isBlocking(a.status)).length,
      cancelled: mine.filter((a) => a.status === 'cancelled').length,
      noShow: mine.filter((a) => a.status === 'no_show').length,
      total: mine.length,
      days: dates.size,
    }
  })
}

export function hourStats(appts: Appointment[]) {
  return Array.from({ length: 12 }, (_, i) => {
    const h = 10 + i
    const mine = appts.filter((a) => Math.floor(toMin(a.start) / 60) === h)
    return { hour: h, label: `${String(h).padStart(2, '0')}:00`, bookings: mine.filter((a) => isBlocking(a.status)).length, cancelled: mine.filter((a) => a.status === 'cancelled').length, total: mine.length }
  })
}

/* ---------- ความหนาแน่นของพนักงานและเตียง ---------- */

export interface UtilRow { id: string; name: string; bookedMin: number; capacityMin: number; ratio: number; bookings: number }

const SHOP_MIN = toMin(SHOP_CLOSE) - toMin(SHOP_OPEN)

export function staffUtilization(appts: Appointment[], range: DateRange): UtilRow[] {
  const days = eachDay(range)
  return STAFF.map((s) => {
    const cap = sum(days.filter((d) => s.workDays.includes(dayOfWeek(d))).map(() => toMin(s.shiftEnd) - toMin(s.shiftStart)))
    const mine = appts.filter((a) => a.staffId === s.id && isBlocking(a.status) && inRange(a.date, range))
    const booked = sum(mine.map((a) => toMin(a.end) - toMin(a.start)))
    return { id: s.id, name: s.nickname, bookedMin: booked, capacityMin: cap, ratio: cap ? booked / cap : 0, bookings: mine.length }
  })
}

export function roomUtilization(appts: Appointment[], range: DateRange): UtilRow[] {
  const cap = SHOP_MIN * rangeLength(range)
  return ROOMS.map((r) => {
    const mine = appts.filter((a) => a.roomId === r.id && isBlocking(a.status) && inRange(a.date, range))
    const booked = sum(mine.map((a) => toMin(a.end) - toMin(a.start)))
    return { id: r.id, name: r.name, bookedMin: booked, capacityMin: cap, ratio: cap ? booked / cap : 0, bookings: mine.length }
  })
}

/* ---------- การเก็บลูกค้า (retention) ---------- */

export interface CohortRow { month: string; size: number; returned: number; rate: number }

/** สัดส่วนลูกค้าที่เริ่มใช้บริการในแต่ละเดือน และกลับมาใช้บริการสำเร็จตั้งแต่ 2 ครั้ง */
export function retentionCohorts(customers: Customer[], stats: Map<string, CustomerStats>, range: DateRange): CohortRow[] {
  const months: string[] = []
  for (const d of eachDay(range)) {
    const m = monthKey(d)
    if (!months.includes(m)) months.push(m)
  }
  return months.map((m) => {
    const cohort = customers.filter((c) => monthKey(c.createdAt) === m && inRange(c.createdAt, range))
    const returned = cohort.filter((c) => (stats.get(c.id)?.visits ?? 0) >= 2).length
    return { month: m, size: cohort.length, returned, rate: cohort.length ? returned / cohort.length : 0 }
  })
}

/* ---------- คำเตือนเชิงปฏิบัติการ ---------- */

export interface Alert {
  id: string
  level: 'high' | 'medium' | 'info'
  title: string
  detail: string
  href: string
}

export function buildAlerts(data: AppData, today: ISODate = DEMO_TODAY, nowMin = toMin('14:30')): Alert[] {
  const alerts: Alert[] = []
  const todayAppts = data.appointments.filter((a) => a.date === today)
  const pendingToday = todayAppts.filter((a) => a.status === 'pending')
  if (pendingToday.length) alerts.push({ id: 'pending-today', level: 'high', title: `มี ${pendingToday.length} คิววันนี้ที่ยังไม่ยืนยัน`, detail: 'ควรโทรหรือส่งข้อความยืนยันกับลูกค้าก่อนถึงเวลานัด', href: '/operations' })
  const tomorrow = addDays(today, 1)
  const pendingTomorrow = data.appointments.filter((a) => a.date === tomorrow && a.status === 'pending')
  if (pendingTomorrow.length) alerts.push({ id: 'pending-tomorrow', level: 'medium', title: `มี ${pendingTomorrow.length} คิวพรุ่งนี้ที่ยังรอยืนยัน`, detail: 'ยืนยันล่วงหน้าเพื่อลดการไม่มาตามนัด', href: `/bookings?view=list&status=pending&from=${tomorrow}&to=${tomorrow}` })
  const overdue = data.tasks.filter((t) => t.status !== 'done' && (t.date < today || (t.date === today && toMin(t.dueTime) < nowMin)))
  if (overdue.length) alerts.push({ id: 'overdue-tasks', level: 'high', title: `มี ${overdue.length} งานที่เลยกำหนดแล้ว`, detail: overdue.slice(0, 2).map((t) => t.title).join(' • '), href: '/operations' })
  const range = { from: addDays(today, -13), to: addDays(today, 7) }
  const util = staffUtilization(data.appointments, range).filter((u) => u.ratio >= 0.7)
  if (util.length) alerts.push({ id: 'util-high', level: 'medium', title: `พนักงานคิวแน่น: ${util.map((u) => u.name).join(', ')}`, detail: 'ใช้เวลาตามกะมากกว่า 70% — พิจารณากระจายคิวหรือเพิ่มกะ', href: '/' })
  const lastCancelledToday = todayAppts.filter((a) => a.status === 'cancelled').length
  if (lastCancelledToday >= 1) alerts.push({ id: 'cancel-today', level: 'info', title: `วันนี้มีการยกเลิก ${lastCancelledToday} คิว`, detail: 'ช่วงเวลาที่ว่างสามารถเสนอให้ลูกค้า walk-in ได้', href: `/bookings?view=list&status=cancelled&from=${today}&to=${today}` })
  return alerts
}

/** รายการจองที่มีคิวติดกันแน่นสำหรับพนักงาน (ไม่มีเวลาพัก) */
export function backToBackCount(appts: Appointment[], range: DateRange, minRun = 4) {
  const rows: { staffId: string; date: ISODate; count: number }[] = []
  const key = groupBy(appts.filter((a) => isBlocking(a.status) && inRange(a.date, range)), (a) => `${a.staffId}|${a.date}`)
  for (const [k, list] of Object.entries(key) as [string, Appointment[]][]) {
    const sorted = list.slice().sort((a, b) => toMin(a.start) - toMin(b.start))
    let run = 1
    let best = 1
    for (let i = 1; i < sorted.length; i++) {
      if (toMin(sorted[i].start) - toMin(sorted[i - 1].end) <= 0) run++
      else run = 1
      best = Math.max(best, run)
    }
    if (best >= minRun) rows.push({ staffId: k.split('|')[0], date: k.split('|')[1], count: best })
  }
  return rows
}
