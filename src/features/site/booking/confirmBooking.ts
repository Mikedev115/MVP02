import type { StoreValue } from '@/state/store'
import { autoAssign } from '@/lib/conflicts'
import { digitsOnly } from './validation'
import type { BookingConfirmation, BookingState } from './bookingState'
import { describeSelection } from './selection'

/** ข้อผิดพลาดแบบมีรหัส เพื่อให้หน้าจอแปลข้อความตามภาษา (store = ข้อความจากระบบหลังบ้าน แสดงตามที่ได้) */
export type ConfirmError = { code: 'incomplete' | 'full' | 'customer' } | { code: 'store'; message: string }
export type ConfirmResult = { ok: true; value: BookingConfirmation } | { ok: false; error: ConfirmError }

/**
 * สร้างการจองสถานะ "รอยืนยัน" ใน store เดียวกับระบบหลังบ้าน
 * ตรวจคิวซ้อนซ้ำอีกครั้งก่อนบันทึก และสร้างลูกค้าใหม่เฉพาะเมื่อการจองผ่านแล้วเท่านั้น
 */
export function confirmBooking(
  store: Pick<StoreValue, 'data' | 'addCustomer' | 'createAppointment'>,
  state: BookingState,
): ConfirmResult {
  const { service, promo, price, end } = describeSelection(state)
  const { date, start, details } = state
  if (!service || !date || !start || !end) return { ok: false, error: { code: 'incomplete' } }

  const phone = digitsOnly(details.phone)
  const existing = store.data.customers.find((c) => digitsOnly(c.phone) === phone)
  const customerId = existing?.id ?? '__new__'

  const draft = { customerId, serviceId: service.id, date, start, end, status: 'pending' as const }
  const assigned = autoAssign(store.data.appointments, draft)
  if (!assigned) return { ok: false, error: { code: 'full' } }

  const name = details.name.trim()
  const customer =
    existing ??
    (() => {
      const created = store.addCustomer({
        name,
        nickname: name.split(/\s+/)[0],
        phone: details.phone,
        lineId: details.lineId.trim() || undefined,
        source: details.source,
        note: 'สร้างจากหน้าจองของเว็บไซต์ลูกค้า (เดโม)',
      })
      return created.ok ? created.value : undefined
    })()
  if (!customer) return { ok: false, error: { code: 'customer' } }

  const note = ['จองผ่านเว็บไซต์ลูกค้า (เดโม)', promo && `โปรโมชัน: ${promo.title}`, details.note.trim()].filter(Boolean).join(' · ')
  const result = store.createAppointment({
    customerId: customer.id,
    serviceId: service.id,
    staffId: assigned.staffId,
    roomId: assigned.roomId,
    date,
    start,
    end,
    status: 'pending',
    price,
    note,
  })
  if (!result.ok) return { ok: false, error: { code: 'store', message: result.error } }

  return {
    ok: true,
    value: {
      appointmentId: result.value.id,
      serviceId: service.id,
      date,
      start,
      end,
      price,
      customerName: customer.name,
      phone: details.phone,
      promoId: promo?.id,
    },
  }
}
