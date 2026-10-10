import { useEffect, useRef, useState } from 'react'
import { CalendarRange, Check, ChevronDown } from 'lucide-react'
import { PRESET_LABEL, useUi, type RangePreset } from '@/state/ui'
import { DEMO_TODAY, fmtRange } from '@/lib/date'
import { cn } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Form'

const PRESETS: RangePreset[] = ['today', '7d', '30d', '90d', 'month', 'lastMonth', 'all']

export function DateRangePicker() {
  const { preset, range, setPreset, setCustomRange } = useUi()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFrom(range.from)
    setTo(range.to)
  }, [range])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const invalid = !from || !to || from > to
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm transition-colors hover:bg-sand-50 sm:inline-flex sm:w-auto"
      >
        <CalendarRange size={16} className="text-sage-500" />
        <span className="font-medium text-ink">{PRESET_LABEL[preset]}</span>
        <span className="text-ink-muted">{fmtRange(range)}</span>
        <ChevronDown size={14} className="ml-auto text-ink-faint sm:ml-0" />
      </button>
      {open && (
        <div role="dialog" aria-label="เลือกช่วงวันที่" className="absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] animate-rise rounded-xl border border-line bg-white p-3 shadow-pop">
          <ul className="grid grid-cols-2 gap-1">
            {PRESETS.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => {
                    setPreset(p)
                    setOpen(false)
                  }}
                  className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-sand-50', preset === p && 'bg-sage-50 font-medium text-sage-800')}
                >
                  {PRESET_LABEL[p]}
                  {preset === p && <Check size={14} />}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <p className="text-xs font-medium text-ink-muted">กำหนดช่วงเอง</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="ตั้งแต่">{(id) => <Input id={id} type="date" value={from} max={DEMO_TODAY} onChange={(e) => setFrom(e.target.value)} />}</Field>
              <Field label="ถึง">{(id) => <Input id={id} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
            </div>
            {invalid && <p className="text-xs text-clay-600" role="alert">วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด</p>}
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              disabled={invalid}
              onClick={() => {
                setCustomRange({ from, to })
                setOpen(false)
              }}
            >
              ใช้ช่วงวันที่นี้
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
