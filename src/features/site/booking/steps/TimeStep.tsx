import { useEffect, useMemo } from 'react'
import { CalendarX } from 'lucide-react'
import { useStore } from '@/state/store'
import { DEMO_TODAY, fmtDateLong, fmtDayMonth, fmtWeekday, parseDate } from '@/lib/date'
import { cn } from '@/lib/format'
import { bookableDates, groupSlots, slotsFor } from '../slots'
import { digitsOnly, isThaiMobile } from '../validation'
import type { BookingState } from '../bookingState'

interface Props {
  state: BookingState
  onDate: (date: string) => void
  onTime: (start: string) => void
}

export function TimeStep({ state, onDate, onTime }: Props) {
  const { data } = useStore()
  const { serviceId, date, start } = state

  // ลูกค้าเดิม (เบอร์ตรงกับที่เคยกรอก) จะไม่เห็นเวลาที่ชนกับนัดของตัวเอง
  const customerId = useMemo(() => {
    const phone = state.details.phone
    if (!isThaiMobile(phone)) return undefined
    return data.customers.find((c) => digitsOnly(c.phone) === digitsOnly(phone))?.id
  }, [data.customers, state.details.phone])

  // จำนวนเวลาว่างของแต่ละวัน คำนวณจากการจองใน store ณ ตอนนี้ (รวมที่เพิ่งจองในเดโมนี้)
  const availability = useMemo(
    () => bookableDates().map((d) => ({ date: d, slots: serviceId ? slotsFor(data.appointments, serviceId, d, customerId) : [] })),
    [data.appointments, serviceId, customerId],
  )

  // เลือกวันแรกที่ยังว่างให้อัตโนมัติ เพื่อลดขั้นตอน
  useEffect(() => {
    if (!date) {
      const first = availability.find((a) => a.slots.length > 0)
      if (first) onDate(first.date)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, availability])

  const slots = availability.find((a) => a.date === date)?.slots ?? []
  const groups = groupSlots(slots)
  const anyAvailable = availability.some((a) => a.slots.length > 0)

  if (!anyAvailable) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <CalendarX className="text-bark-300" size={36} strokeWidth={1.25} />
        <p className="mt-3 font-medium text-bark-800">ยังไม่มีเวลาว่างใน 14 วันข้างหน้า</p>
        <p className="mt-1 max-w-xs text-sm text-bark-500">ลองเลือกบริการหรือระยะเวลาอื่น เวลาว่างของแต่ละบริการอาจต่างกัน</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-serifth text-xl text-bark-900">เลือกวันและเวลา</h3>
      <p className="mt-1 text-sm text-bark-500">เวลาว่างเป็นข้อมูลจำลองจากระบบเดโม จองล่วงหน้าได้ 14 วัน</p>

      <div role="radiogroup" aria-label="เลือกวันที่" className="scroll-thin -mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2">
        {availability.map(({ date: d, slots: s }) => {
          const full = s.length === 0
          const active = d === date
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${fmtDateLong(d)}${full ? ' เต็ม' : ''}`}
              disabled={full}
              onClick={() => onDate(d)}
              className={cn(
                'flex w-[4.25rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition-all duration-300',
                active ? 'border-olive-600 bg-olive-600 text-white shadow-sm' : 'border-stone-200 bg-white hover:border-olive-300',
                full && 'cursor-not-allowed opacity-45 hover:border-stone-200',
              )}
            >
              <span className={cn('text-xs', active ? 'text-olive-100' : 'text-bark-500')}>{d === DEMO_TODAY ? 'วันนี้' : fmtWeekday(d)}</span>
              <span className="font-serifth text-2xl leading-tight">{parseDate(d).getDate()}</span>
              <span className={cn('text-[11px]', active ? 'text-olive-100' : 'text-bark-400')}>{full ? 'เต็ม' : fmtDayMonth(d).split(' ')[1]}</span>
            </button>
          )
        })}
      </div>

      {date && (
        <div className="mt-6">
          <p className="text-sm font-medium text-bark-800">{fmtDateLong(date)}</p>
          {groups.length === 0 ? (
            <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-sm text-bark-600">วันนี้เวลาว่างเต็มแล้ว กรุณาเลือกวันอื่น</p>
          ) : (
            <div className="mt-3 space-y-5">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-xs uppercase tracking-wide text-bark-400">{g.label}</p>
                  <div role="radiogroup" aria-label={`เวลา${g.label}`} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {g.slots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={t === start}
                        onClick={() => onTime(t)}
                        className={cn(
                          'h-11 rounded-xl border text-sm font-medium transition-all duration-300',
                          t === start ? 'border-olive-600 bg-olive-600 text-white shadow-sm' : 'border-stone-200 bg-white text-bark-800 hover:border-olive-300',
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
