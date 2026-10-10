import { Info, Wand2 } from 'lucide-react'
import { SOURCE_LABEL } from '@/data/catalog'
import type { AcquisitionSource } from '@/types'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { cn } from '@/lib/format'
import { formatPhone, type BookingDetails, type DetailErrors, type DetailField } from '../validation'

interface Props {
  details: BookingDetails
  errors: DetailErrors
  /** ฟิลด์ที่แสดงข้อผิดพลาดแล้ว (ผู้ใช้แตะแล้ว หรือกดไปต่อ) */
  shown: Set<DetailField>
  onChange: (patch: Partial<BookingDetails>) => void
  onTouch: (f: DetailField) => void
  onFillSample: () => void
}

const SOURCES = (Object.keys(SOURCE_LABEL) as AcquisitionSource[]).filter((s) => s !== 'walk_in')
const input = '!text-base sm:!text-sm'

export function DetailsStep({ details, errors, shown, onChange, onTouch, onFillSample }: Props) {
  const err = (f: DetailField) => (shown.has(f) ? errors[f] : undefined)

  return (
    <div>
      <h3 className="font-serifth text-xl text-bark-900">ข้อมูลสำหรับติดต่อ</h3>

      <div className="mt-3 flex gap-2.5 rounded-xl border border-amber2-100 bg-amber2-50 p-3 text-sm text-amber2-700">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          ฟอร์มนี้เป็นการจำลอง ไม่ส่งข้อมูลไปที่ใด กรุณาไม่ใช้ข้อมูลจริงของคุณ
          <button type="button" onClick={onFillSample} className="ml-1.5 inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-amber2-600">
            <Wand2 size={13} aria-hidden="true" /> ใช้ข้อมูลตัวอย่าง
          </button>
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อที่ใช้เรียก" required error={err('name')}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              autoComplete="off"
              className={input}
              value={details.name}
              invalid={!!err('name')}
              placeholder="เช่น สมศรี ตัวอย่าง"
              onChange={(e) => onChange({ name: e.target.value })}
              onBlur={() => onTouch('name')}
            />
          )}
        </Field>
        <Field label="เบอร์โทรศัพท์" required error={err('phone')} hint="เบอร์มือถือ 10 หลัก">
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              inputMode="tel"
              autoComplete="off"
              className={input}
              value={details.phone}
              invalid={!!err('phone')}
              placeholder="08X-XXX-XXXX"
              onChange={(e) => onChange({ phone: formatPhone(e.target.value) })}
              onBlur={() => onTouch('phone')}
            />
          )}
        </Field>
        <Field label="LINE ID (ไม่บังคับ)" error={err('lineId')}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              autoComplete="off"
              className={input}
              value={details.lineId}
              invalid={!!err('lineId')}
              placeholder="เช่น @sample-id"
              onChange={(e) => onChange({ lineId: e.target.value })}
              onBlur={() => onTouch('lineId')}
            />
          )}
        </Field>
        <Field label="รู้จักร้านจากช่องทางไหน (ไม่บังคับ)">
          {(id) => (
            <Select id={id} className={input} value={details.source} onChange={(e) => onChange({ source: e.target.value as AcquisitionSource })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s === 'other' ? 'ไม่ระบุ / อื่น ๆ' : SOURCE_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="sm:col-span-2">
          <Field label="ความต้องการเพิ่มเติม (ไม่บังคับ)" error={err('note')} hint={`${details.note.length}/200`}>
            {(id, d) => (
              <Textarea
                id={id}
                aria-describedby={d}
                rows={2}
                className={cn(input, 'min-h-[4.5rem]')}
                value={details.note}
                placeholder="เช่น ชอบแรงกดเบา แพ้กลิ่นบางชนิด"
                onChange={(e) => onChange({ note: e.target.value })}
                onBlur={() => onTouch('note')}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3.5 text-sm', err('agree') ? 'border-clay-500' : 'border-stone-200')}>
          <input
            type="checkbox"
            checked={details.agree}
            aria-invalid={!!err('agree')}
            className="mt-0.5 h-5 w-5 shrink-0 accent-olive-600"
            onChange={(e) => {
              onChange({ agree: e.target.checked })
              onTouch('agree')
            }}
          />
          <span className="text-bark-700">ฉันเข้าใจว่านี่คือการจองเพื่อสาธิต ข้อมูลไม่ถูกส่งไปยังร้านจริงและจะหายเมื่อรีเฟรชหน้า</span>
        </label>
        {err('agree') && (
          <p role="alert" className="mt-1.5 text-xs text-clay-600">
            {err('agree')}
          </p>
        )}
      </div>
    </div>
  )
}
