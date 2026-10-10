import { AlertTriangle, Info } from 'lucide-react'
import { fmtDateLong } from '@/lib/date'
import { fmtTHB } from '@/lib/format'
import type { BookingState } from '../bookingState'
import { describeSelection } from '../selection'

interface Props {
  state: BookingState
  error: string | null
  onEdit: (step: 'service' | 'time' | 'details') => void
}

export function ReviewStep({ state, error, onEdit }: Props) {
  const { service, promo, price, end } = describeSelection(state)
  const { details, date, start } = state

  const rows: { label: string; value: string; edit: 'service' | 'time' | 'details' }[] = [
    { label: 'บริการ', value: service ? `${service.name}` : '-', edit: 'service' },
    { label: 'วันที่', value: date ? fmtDateLong(date) : '-', edit: 'time' },
    { label: 'เวลา', value: start && end ? `${start}–${end} น.` : '-', edit: 'time' },
    { label: 'ชื่อ', value: details.name.trim(), edit: 'details' },
    { label: 'โทรศัพท์', value: details.phone, edit: 'details' },
  ]
  if (details.lineId.trim()) rows.push({ label: 'LINE ID', value: details.lineId.trim(), edit: 'details' })
  if (details.note.trim()) rows.push({ label: 'หมายเหตุ', value: details.note.trim(), edit: 'details' })

  return (
    <div>
      <h3 className="font-serifth text-xl text-bark-900">ตรวจสอบรายละเอียดการจอง</h3>
      <p className="mt-1 text-sm text-bark-500">หากข้อมูลถูกต้อง กดยืนยันเพื่อจองคิวเดโม</p>

      {error && (
        <div role="alert" className="mt-4 flex gap-2.5 rounded-xl border border-clay-100 bg-clay-50 p-3.5 text-sm text-clay-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{error} — กดย้อนกลับเพื่อเปลี่ยนเวลา หรือแก้ไขข้อมูล</p>
        </div>
      )}

      <dl className="mt-5 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3 px-4 py-3 text-sm">
            <dt className="w-20 shrink-0 text-bark-500">{r.label}</dt>
            <dd className="min-w-0 flex-1 break-words font-medium text-bark-900">{r.value}</dd>
            <button type="button" onClick={() => onEdit(r.edit)} className="shrink-0 text-xs text-olive-700 underline underline-offset-2 hover:text-olive-900">
              แก้ไข
            </button>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 bg-cream/60 px-4 py-3.5 text-sm">
          <dt className="text-bark-500">ราคา{promo ? ` (โปรโมชัน: ${promo.title})` : ''}</dt>
          <dd className="font-serifth text-xl text-olive-800">{fmtTHB(price)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2.5 rounded-xl border border-amber2-100 bg-amber2-50 p-3.5 text-sm text-amber2-700">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>การยืนยันนี้เป็นธุรกรรมเดโม ไม่ได้ส่งถึงร้านจริง ไม่มีการชำระเงิน และไม่มีการเก็บข้อมูลถาวร</p>
      </div>
    </div>
  )
}
