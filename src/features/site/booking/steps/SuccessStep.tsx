import { CalendarPlus, Check, Info, LayoutDashboard } from 'lucide-react'
import { bookingsLink } from '@/lib/links'
import { fmtDateLong } from '@/lib/date'
import { fmtTHB } from '@/lib/format'
import type { BookingConfirmation } from '../bookingState'

interface Props {
  confirmation: BookingConfirmation
  onAnother: () => void
  onClose: () => void
  onOpenAdmin: (href: string) => void
}

export function SuccessStep({ confirmation: c, onAnother, onClose, onOpenAdmin }: Props) {
  return (
    <div className="mx-auto max-w-lg py-2 text-center">
      <span className="mx-auto flex h-16 w-16 animate-rise items-center justify-center rounded-full bg-olive-100 text-olive-700">
        <Check size={30} strokeWidth={2} aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-serifth text-2xl text-bark-900">จองคิวเดโมเรียบร้อยแล้ว</h3>
      <p className="mt-1 text-sm text-bark-500">ขอบคุณ คุณ{c.customerName.split(/\s+/)[0]} นี่คือตัวอย่างหน้าจอยืนยันการจอง</p>

      <dl className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white text-left text-sm">
        {[
          ['รหัสการจอง (เดโม)', c.appointmentId.toUpperCase()],
          ['บริการ', c.serviceName],
          ['วันที่', fmtDateLong(c.date)],
          ['เวลา', `${c.start}–${c.end} น.`],
          ['โทรศัพท์', c.phone],
          ['สถานะ', 'รอร้านยืนยัน (จำลอง)'],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3 px-4 py-2.5">
            <dt className="w-32 shrink-0 text-bark-500">{k}</dt>
            <dd className="min-w-0 flex-1 break-words font-medium text-bark-900">{v}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between bg-cream/60 px-4 py-3">
          <dt className="text-bark-500">ราคา{c.promoTitle ? ` · ${c.promoTitle}` : ''}</dt>
          <dd className="font-serifth text-xl text-olive-800">{fmtTHB(c.price)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2.5 rounded-xl border border-amber2-100 bg-amber2-50 p-3.5 text-left text-sm text-amber2-700">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>การจองนี้เป็นเดโม ไม่ได้ถูกส่งถึงร้านจริง และไม่มีการชำระเงิน รายการจะแสดงในหลังบ้านของเดโมนี้ชั่วคราว และหายเมื่อรีเฟรชหน้า</p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-olive-700 px-6 text-sm font-medium text-white transition-colors hover:bg-olive-800"
        >
          <CalendarPlus size={17} aria-hidden="true" /> จองบริการอื่นเพิ่ม
        </button>
        <button
          type="button"
          onClick={() => onOpenAdmin(bookingsLink({ status: 'pending', range: { from: c.date, to: c.date } }))}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 text-sm font-medium text-bark-800 transition-colors hover:border-olive-400"
        >
          <LayoutDashboard size={17} aria-hidden="true" /> ดูในหลังบ้าน
        </button>
        <button type="button" onClick={onClose} className="h-12 rounded-full px-5 text-sm text-bark-600 hover:text-bark-900">
          กลับไปหน้าเว็บ
        </button>
      </div>
    </div>
  )
}
