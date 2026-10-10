import type { Appointment, AppointmentStatus, Customer } from '@/types'
import { getService, getStaff, getRoom } from '@/lib/conflicts'

export interface ApptFilter {
  q: string
  status: AppointmentStatus | 'all'
  staffId: string
  serviceId: string
  from?: string
  to?: string
}

export const EMPTY_FILTER: ApptFilter = { q: '', status: 'all', staffId: 'all', serviceId: 'all' }

export function filterAppointments(appts: Appointment[], customers: Map<string, Customer>, f: ApptFilter): Appointment[] {
  const q = f.q.trim().toLowerCase()
  return appts.filter((a) => {
    if (f.status !== 'all' && a.status !== f.status) return false
    if (f.staffId !== 'all' && a.staffId !== f.staffId) return false
    if (f.serviceId !== 'all' && a.serviceId !== f.serviceId) return false
    if (f.from && a.date < f.from) return false
    if (f.to && a.date > f.to) return false
    if (q) {
      const c = customers.get(a.customerId)
      const hay = [c?.name, c?.nickname, c?.phone, a.id, getService(a.serviceId)?.name, getStaff(a.staffId)?.nickname, getRoom(a.roomId)?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export const byTime = (a: Appointment, b: Appointment) => (a.date + a.start < b.date + b.start ? -1 : a.date + a.start > b.date + b.start ? 1 : 0)

export function customerLabel(c: Customer | undefined): string {
  return c ? `${c.name} (${c.nickname})` : 'ไม่พบลูกค้า'
}
