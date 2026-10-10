import type { StoreValue, Result } from '@/state/store'
import { autoAssign } from '@/lib/conflicts'
import { digitsOnly } from './validation'
import type { BookingConfirmation, BookingState } from './bookingState'
import { describeSelection } from './selection'

/**
 * สร้างการจองสถานะ "รอยืนยัน" ใน store เดียวกับระบบหลังบ้าน
 * ตรวจคิวซ้อนซ้ำอีกครั้งก่อนบันทึก และสร้างลูกค้าใหม่เฉพาะเมื่อการจองผ่านแล้วเท่านั้น
 */
export function confirmBooking(
  store: Pick<StoreValue, 'data' | 'addCustomer' | 'createAppointment'>,
  state: BookingState,
): Result<BookingConfirmation> {
  const { service, promo, price, end } = describeSelection(state)
  const { date, start, details } = state
  if (!service || !date || !start || !end) return { ok: false, error: 'ข้อมูลการจองยังไม่ครบ กรุณาตรวจสอบอีกครั้ง' }

  const phone = digitsOnly(details.phone)
  const existing = store.data.customers.find((c) => digitsOnly(c.phone) === phone)
  const customerId = existing?.id ?? '__new__'

  const draft = { customerId, serviceId: service.id, date, start, end, status: 'pending' as const }
  const assigned = autoAssign(store.data.appointments, draft)
  if (!assigned) return { ok: false, error: 'ขออภัย ช่วงเวลานี้เพิ่งเต็ม กรุณาเลือกเวลาอื่น' }

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
  if (!customer) return { ok: false, error: 'ไม่สามารถบันทึกข้อมูลลูกค้าได้ กรุณาลองใหม่' }

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
  if (!result.ok) return { ok: false, error: result.error }

  return {
    ok: true,
    value: {
      appointmentId: result.value.id,
      serviceName: service.name,
      date,
      start,
      end,
      price,
      customerName: customer.name,
      phone: details.phone,
      promoTitle: promo?.title,
    },
  }
}
