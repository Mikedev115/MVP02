import type { AppointmentStatus, CustomerSegment, DateRange } from '@/types'

interface BookingLinkOpts {
  status?: AppointmentStatus
  service?: string
  staff?: string
  range?: DateRange
  q?: string
  view?: 'day' | 'week' | 'list'
  date?: string
}

/** ลิงก์ไปหน้าการจองพร้อมตัวกรองที่แปลงเป็น URL */
export function bookingsLink(o: BookingLinkOpts = {}): string {
  const p = new URLSearchParams()
  p.set('view', o.view ?? 'list')
  if (o.status) p.set('status', o.status)
  if (o.service) p.set('service', o.service)
  if (o.staff) p.set('staff', o.staff)
  if (o.q) p.set('q', o.q)
  if (o.date) p.set('date', o.date)
  if (o.range) {
    p.set('from', o.range.from)
    p.set('to', o.range.to)
  }
  return `/bookings?${p.toString()}`
}

export function customersLink(o: { segment?: CustomerSegment; source?: string; age?: string } = {}): string {
  const p = new URLSearchParams()
  if (o.segment) p.set('segment', o.segment)
  if (o.source) p.set('source', o.source)
  if (o.age) p.set('age', o.age)
  const s = p.toString()
  return s ? `/customers?${s}` : '/customers'
}
