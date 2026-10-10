import { describe, expect, it } from 'vitest'
import { buildSeedData } from '@/data/seed'
import { SERVICES } from '@/data/catalog'
import { autoAssign, availableStarts, endTimeFor, findConflicts, isBlocking } from './conflicts'
import { DEMO_TODAY, addDays } from './date'
import { buildAlerts, buildCustomerStats, computeKpis, newVsReturning, retentionCohorts, serviceStats, staffUtilization, statusCounts, trendSeries } from './metrics'
import { buildInsights } from './insights'
import { reducer } from '@/state/store'
import type { AppData, Appointment } from '@/types'

const data = buildSeedData()
const range = { from: '2026-06-01', to: DEMO_TODAY }

describe('seed data', () => {
  it('is deterministic', () => {
    expect(buildSeedData().appointments.length).toBe(data.appointments.length)
    expect(buildSeedData().appointments[10]).toEqual(data.appointments[10])
  })

  it('has enough records for charts', () => {
    expect(data.customers.length).toBeGreaterThan(150)
    expect(data.appointments.length).toBeGreaterThan(500)
  })

  it('contains no conflicting active appointments', () => {
    const active = data.appointments.filter((a) => isBlocking(a.status))
    for (const a of active) {
      const issues = findConflicts(active, { ...a })
      expect(issues, `${a.id}: ${issues.map((i) => i.message).join(',')}`).toHaveLength(0)
    }
  })

  it('references only existing customers', () => {
    const ids = new Set(data.customers.map((c) => c.id))
    expect(data.appointments.every((a) => ids.has(a.customerId))).toBe(true)
  })

  it('has statuses consistent with the demo clock', () => {
    const past = data.appointments.filter((a) => a.date < DEMO_TODAY)
    expect(past.every((a) => ['completed', 'cancelled', 'no_show'].includes(a.status))).toBe(true)
    const future = data.appointments.filter((a) => a.date > DEMO_TODAY)
    expect(future.every((a) => ['pending', 'confirmed', 'cancelled'].includes(a.status))).toBe(true)
    const todayPending = data.appointments.filter((a) => a.date === DEMO_TODAY && a.status === 'pending')
    expect(todayPending.length).toBeGreaterThanOrEqual(3)
  })
})

describe('conflict detection', () => {
  const base = data.appointments.find((a) => a.date === addDays(DEMO_TODAY, 2) && a.status === 'confirmed')!

  it('detects staff and room overlap', () => {
    const other = data.customers.find((c) => c.id !== base.customerId)!
    const issues = findConflicts(data.appointments, {
      customerId: other.id, serviceId: base.serviceId, staffId: base.staffId, roomId: base.roomId, date: base.date, start: base.start, end: base.end, status: 'pending',
    })
    expect(issues.some((i) => i.kind === 'staff')).toBe(true)
    expect(issues.some((i) => i.kind === 'room')).toBe(true)
  })

  it('allows back-to-back appointments', () => {
    const other = data.customers.find((c) => c.id !== base.customerId)!
    const issues = findConflicts([base], {
      customerId: other.id, serviceId: base.serviceId, staffId: base.staffId, roomId: base.roomId, date: base.date, start: base.end, end: endTimeFor(base.serviceId, base.end), status: 'pending',
    }).filter((i) => i.kind === 'staff' || i.kind === 'room')
    expect(issues).toHaveLength(0)
  })

  it('does not conflict with itself while editing, and ignores cancelled appointments', () => {
    expect(findConflicts(data.appointments, { ...base }).filter((i) => i.kind === 'staff' || i.kind === 'room')).toHaveLength(0)
    const cancelled: Appointment[] = data.appointments.map((a) => (a.id === base.id ? { ...a, status: 'cancelled' as const } : a))
    const other = data.customers.find((c) => c.id !== base.customerId)!
    const issues = findConflicts(cancelled, { customerId: other.id, serviceId: base.serviceId, staffId: base.staffId, roomId: base.roomId, date: base.date, start: base.start, end: base.end, status: 'pending' })
    expect(issues.filter((i) => i.kind === 'staff' || i.kind === 'room')).toHaveLength(0)
  })

  it('rejects times outside shop hours and staff shifts', () => {
    const issues = findConflicts([], { customerId: 'x', serviceId: 'sv-wash60', staffId: 'st-2', roomId: 'rm-1', date: DEMO_TODAY, start: '21:30', end: '22:30', status: 'pending' })
    expect(issues.some((i) => i.kind === 'closed')).toBe(true)
    expect(issues.some((i) => i.kind === 'staff_off')).toBe(true)
  })

  it('autoAssign never produces a conflict, and availableStarts only lists feasible times', () => {
    const date = addDays(DEMO_TODAY, 3)
    const starts = availableStarts(data.appointments, { customerId: 'cu-001', serviceId: 'sv-asmr90', date })
    expect(starts.length).toBeGreaterThan(0)
    for (const start of starts) {
      const end = endTimeFor('sv-asmr90', start)
      const draft = { customerId: 'cu-001', serviceId: 'sv-asmr90', date, start, end, status: 'confirmed' as const }
      const a = autoAssign(data.appointments, draft)
      expect(a).not.toBeNull()
      expect(findConflicts(data.appointments, { ...draft, ...a! })).toHaveLength(0)
    }
  })
})

describe('derived metrics', () => {
  it('KPIs match raw records', () => {
    const k = computeKpis(data, range)
    const inR = data.appointments.filter((a) => a.date >= range.from && a.date <= range.to)
    const done = inR.filter((a) => a.status === 'completed')
    expect(k.bookings).toBe(inR.length)
    expect(k.completed).toBe(done.length)
    expect(k.revenue).toBe(done.reduce((s, a) => s + a.price, 0))
    expect(k.avgRevenuePerBooking).toBeCloseTo(k.revenue / done.length)
  })

  it('trend series sums equal KPIs for every granularity', () => {
    const k = computeKpis(data, range)
    for (const g of ['day', 'week', 'month'] as const) {
      const s = trendSeries(data, range, g)
      expect(s.reduce((a, p) => a + p.revenue, 0)).toBe(k.revenue)
      expect(s.reduce((a, p) => a + p.bookings, 0)).toBe(k.bookings)
    }
  })

  it('service stats revenue sums to total revenue', () => {
    const inR = data.appointments.filter((a) => a.date >= range.from && a.date <= range.to)
    expect(serviceStats(inR).reduce((s, r) => s + r.revenue, 0)).toBe(computeKpis(data, range).revenue)
  })

  it('new + returning equals active customers and utilization stays within 0..1', () => {
    const nr = newVsReturning(data, range)
    expect(nr.newCustomers + nr.returningCustomers).toBe(nr.activeCustomers)
    for (const u of staffUtilization(data.appointments, range)) {
      expect(u.ratio).toBeGreaterThanOrEqual(0)
      expect(u.ratio).toBeLessThanOrEqual(1)
    }
  })

  it('segments cover every customer exactly once', () => {
    const stats = buildCustomerStats(data)
    expect(stats.size).toBe(data.customers.length)
    const counts = { new: 0, returning: 0, inactive: 0 }
    stats.forEach((s) => counts[s.segment]++)
    expect(counts.new + counts.returning + counts.inactive).toBe(data.customers.length)
    expect(counts.returning).toBeGreaterThan(10)
    expect(counts.inactive).toBeGreaterThan(5)
    expect(counts.new).toBeGreaterThan(5)
  })

  it('retention cohorts are valid ratios', () => {
    const stats = buildCustomerStats(data)
    for (const c of retentionCohorts(data.customers, stats, range)) {
      expect(c.rate).toBeGreaterThanOrEqual(0)
      expect(c.rate).toBeLessThanOrEqual(1)
    }
  })

  it('produces insights with evidence and actions from the seed data', () => {
    const insights = buildInsights(data, buildCustomerStats(data), { from: '2026-06-01', to: DEMO_TODAY })
    expect(insights.length).toBeGreaterThanOrEqual(5)
    for (const i of insights) {
      expect(i.evidence.length).toBeGreaterThan(0)
      expect(i.action.length).toBeGreaterThan(10)
    }
  })

  it('builds alerts for pending bookings and overdue tasks', () => {
    const ids = buildAlerts(data).map((a) => a.id)
    expect(ids).toContain('pending-today')
    expect(ids).toContain('overdue-tasks')
  })
})

describe('state transitions (shared data flows)', () => {
  const free = (() => {
    const date = addDays(DEMO_TODAY, 1)
    const start = availableStarts(data.appointments, { customerId: 'cu-001', serviceId: 'sv-wash60', date })[0]
    const draft = { customerId: 'cu-001', serviceId: 'sv-wash60', date, start, end: endTimeFor('sv-wash60', start), status: 'confirmed' as const }
    return { ...draft, ...autoAssign(data.appointments, draft)! }
  })()
  const newAppt: Appointment = { ...free, id: 'ap-9999', price: SERVICES[0].price, createdAt: DEMO_TODAY }

  it('creating, completing and cancelling update derived statistics', () => {
    const range = { from: '2026-06-01', to: '2026-10-31' }
    const before = computeKpis(data, range)
    const created: AppData = reducer(data, { type: 'appt/add', appt: newAppt })
    expect(computeKpis(created, range).bookings).toBe(before.bookings + 1)
    expect(computeKpis(created, range).revenue).toBe(before.revenue)

    const doneState = reducer(created, { type: 'appt/update', id: 'ap-9999', patch: { status: 'completed' } })
    expect(computeKpis(doneState, range).revenue).toBe(before.revenue + newAppt.price)
    expect(buildCustomerStats(doneState).get('cu-001')!.visits).toBe(buildCustomerStats(data).get('cu-001')!.visits + 1)

    const cancelledState = reducer(created, { type: 'appt/update', id: 'ap-9999', patch: { status: 'cancelled' } })
    expect(statusCounts(cancelledState.appointments).cancelled).toBe(statusCounts(data.appointments).cancelled + 1)
    expect(computeKpis(cancelledState, range).revenue).toBe(before.revenue)
  })

  it('editing a customer and completing a task are reflected in state; reset restores the seed', () => {
    const edited = reducer(data, { type: 'customer/update', id: 'cu-001', patch: { nickname: 'ทดสอบ' } })
    expect(buildCustomerStats(edited).get('cu-001')!.customer.nickname).toBe('ทดสอบ')
    const task = data.tasks.find((t) => t.status === 'todo')!
    const t2 = reducer(data, { type: 'task/status', id: task.id, status: 'done' })
    expect(t2.tasks.find((t) => t.id === task.id)!.status).toBe('done')
    expect(reducer(edited, { type: 'reset' }).customers[0].nickname).toBe(data.customers[0].nickname)
  })
})

describe('vacancy', () => {
  it('free seats never exceed free staff or free beds, and drop after a booking fills them', async () => {
    const { vacancyForDay, capacityAt, buildVacancyPost } = await import('./availability')
    const date = addDays(DEMO_TODAY, 1)
    const slots = vacancyForDay(data.appointments, date)
    for (const s of slots) {
      expect(s.seats).toBe(Math.min(s.staff, s.beds))
      expect(s.seats).toBeGreaterThan(0)
    }
    const probe = capacityAt(data.appointments, date, '15:00')
    const taken = autoAssign(data.appointments, { customerId: 'cu-001', serviceId: 'sv-wash60', date, start: '15:00', end: '16:00', status: 'confirmed' })
    if (taken) {
      const added: Appointment = { id: 'ap-8888', customerId: 'cu-001', serviceId: 'sv-wash60', date, start: '15:00', end: '16:00', status: 'confirmed', price: 450, createdAt: DEMO_TODAY, ...taken }
      expect(capacityAt([...data.appointments, added], date, '15:00').seats).toBeLessThanOrEqual(probe.seats)
    }
    expect(buildVacancyPost(slots, 'facebook', 'พรุ่งนี้')).toContain('Hair Sleep Spa')
  })
})
