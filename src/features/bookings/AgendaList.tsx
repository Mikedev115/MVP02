import type { Appointment, Customer } from '@/types'
import { STAFF } from '@/data/catalog'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Misc'
import { getService } from '@/lib/conflicts'
import { fmtDateLong } from '@/lib/date'
import { fmtTHB, groupBy } from '@/lib/format'
import { byTime } from './helpers'
import { CalendarX } from 'lucide-react'

/** รายการแบบเรียงตามเวลา ใช้บนมือถือแทนตารางเวลา */
export function AgendaList({ items, customers, onSelect }: { items: Appointment[]; customers: Map<string, Customer>; onSelect: (a: Appointment) => void }) {
  if (!items.length) return <EmptyState icon={<CalendarX size={22} />} title="ไม่มีการจองในช่วงนี้" description="ลองเปลี่ยนวันที่ ตัวกรอง หรือสร้างการจองใหม่" />
  const groups = groupBy(items.slice().sort(byTime), (a) => a.date)
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([date, list]) => (
        <section key={date}>
          <h3 className="mb-1.5 text-sm font-semibold text-ink-soft">{fmtDateLong(date)}</h3>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {list.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => onSelect(a)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-sand-50">
                  <div className="w-14 shrink-0 text-sm font-semibold tabular-nums">
                    {a.start}
                    <div className="text-xs font-normal text-ink-muted">{a.end}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{customers.get(a.customerId)?.name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {getService(a.serviceId)?.name} · {STAFF.find((s) => s.id === a.staffId)?.nickname} · {fmtTHB(a.price)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
