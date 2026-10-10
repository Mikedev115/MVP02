import { useMemo } from 'react'
import type { Appointment, Customer } from '@/types'
import { STATUS_STYLE } from '@/components/ui/Badge'
import { getService } from '@/lib/conflicts'
import { DEMO_NOW, DEMO_TODAY, SHOP_CLOSE, SHOP_OPEN, fromMin, toMin } from '@/lib/date'
import { cn } from '@/lib/format'

const ROW = 32 // px ต่อ 30 นาที
const START = toMin(SHOP_OPEN)
const END = toMin(SHOP_CLOSE)
const HEIGHT = ((END - START) / 30) * ROW

export interface GridColumn {
  key: string
  label: string
  sub?: string
  accent?: string
  highlight?: boolean
  /** ช่วงเวลา (นาที) ที่ไม่พร้อมให้บริการ เช่น นอกกะ */
  offRanges?: [number, number][]
  items: Appointment[]
  date: string
}

interface Props {
  columns: GridColumn[]
  customers: Map<string, Customer>
  onSelect: (a: Appointment) => void
  onSlotClick: (col: GridColumn, time: string) => void
  minColWidth?: number
  selectedId?: string | null
}

function lanes(items: Appointment[]) {
  const sorted = items.slice().sort((a, b) => toMin(a.start) - toMin(b.start))
  const laneEnds: number[] = []
  const out = new Map<string, { lane: number; total: number }>()
  const groups: Appointment[][] = []
  let current: Appointment[] = []
  let groupEnd = -1
  for (const a of sorted) {
    if (current.length && toMin(a.start) >= groupEnd) {
      groups.push(current)
      current = []
      laneEnds.length = 0
      groupEnd = -1
    }
    let lane = laneEnds.findIndex((e) => e <= toMin(a.start))
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = toMin(a.end)
    out.set(a.id, { lane, total: 1 })
    current.push(a)
    groupEnd = Math.max(groupEnd, toMin(a.end))
  }
  if (current.length) groups.push(current)
  for (const g of groups) {
    const total = Math.max(...g.map((a) => out.get(a.id)!.lane)) + 1
    g.forEach((a) => (out.get(a.id)!.total = total))
  }
  return out
}

export function TimeGrid({ columns, customers, onSelect, onSlotClick, minColWidth = 140, selectedId }: Props) {
  const hours = useMemo(() => {
    const out: number[] = []
    for (let m = START; m < END; m += 60) out.push(m)
    return out
  }, [])
  const slots = (END - START) / 30
  const nowTop = ((toMin(DEMO_NOW) - START) / 30) * ROW

  return (
    <div className="scroll-thin overflow-x-auto rounded-xl2 border border-line bg-white shadow-card">
      <div style={{ minWidth: 56 + columns.length * minColWidth }}>
        <div className="sticky top-0 z-10 flex border-b border-line bg-white">
          <div className="w-14 shrink-0" />
          {columns.map((c) => (
            <div key={c.key} className={cn('flex-1 border-l border-line px-2 py-2 text-center', c.highlight && 'bg-sage-50')} style={{ minWidth: minColWidth }}>
              <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ink">
                {c.accent && <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.accent }} />}
                {c.label}
              </p>
              {c.sub && <p className="text-xs text-ink-muted">{c.sub}</p>}
            </div>
          ))}
        </div>
        <div className="flex" style={{ height: HEIGHT }}>
          <div className="relative w-14 shrink-0">
            {hours.map((m) => (
              <div key={m} className="absolute right-2 -translate-y-2 text-xs text-ink-muted tabular-nums" style={{ top: ((m - START) / 30) * ROW }}>
                {fromMin(m)}
              </div>
            ))}
          </div>
          {columns.map((c) => {
            const laneMap = lanes(c.items)
            return (
              <div key={c.key} className={cn('relative flex-1 border-l border-line', c.highlight && 'bg-sage-50/40')} style={{ minWidth: minColWidth }}>
                {Array.from({ length: slots }).map((_, i) => {
                  const m = START + i * 30
                  const off = c.offRanges?.some(([a, b]) => m >= a && m < b)
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${c.label} เวลา ${fromMin(m)} สร้างการจอง`}
                      onClick={() => onSlotClick(c, fromMin(m))}
                      className={cn(
                        'absolute left-0 right-0 block border-t text-left transition-colors hover:bg-sage-100/60 focus-visible:z-10',
                        i % 2 === 0 ? 'border-line' : 'border-dashed border-line/70',
                        off && 'bg-[repeating-linear-gradient(135deg,#F3EFE4,#F3EFE4_6px,#FAF8F3_6px,#FAF8F3_12px)]',
                      )}
                      style={{ top: i * ROW, height: ROW }}
                    />
                  )
                })}
                {c.date === DEMO_TODAY && (
                  <div className="pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-clay-500" style={{ top: nowTop }}>
                    <span className="absolute -top-2.5 left-0 rounded-r bg-clay-500 px-1 text-[10px] font-medium text-white">{DEMO_NOW}</span>
                  </div>
                )}
                {c.items.map((a) => {
                  const l = laneMap.get(a.id)!
                  const top = ((toMin(a.start) - START) / 30) * ROW
                  const h = Math.max(((toMin(a.end) - toMin(a.start)) / 30) * ROW - 2, 22)
                  const cust = customers.get(a.customerId)
                  const style = STATUS_STYLE[a.status]
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onSelect(a)}
                      aria-label={`${cust?.nickname ?? ''} ${a.start}-${a.end} ${getService(a.serviceId)?.name ?? ''}`}
                      className={cn(
                        'absolute z-[5] overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs leading-tight shadow-sm transition-shadow hover:z-10 hover:shadow-pop',
                        style.block,
                        selectedId === a.id && 'ring-2 ring-sage-500',
                      )}
                      style={{ top: top + 1, height: h, left: `calc(${(l.lane / l.total) * 100}% + 2px)`, width: `calc(${100 / l.total}% - 4px)` }}
                    >
                      <span className="block truncate font-semibold">{cust?.nickname}</span>
                      {h > 34 && <span className="block truncate opacity-80">{a.start} · {getService(a.serviceId)?.name.split(' ')[0]}</span>}
                      {h > 60 && <span className="block truncate opacity-70">{getService(a.serviceId)?.name}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
