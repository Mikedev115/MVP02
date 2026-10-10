import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import type { Appointment, Customer } from '@/types'
import { ROOMS, STAFF } from '@/data/catalog'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'
import { getService } from '@/lib/conflicts'
import { fmtDate, fmtWeekday } from '@/lib/date'
import { fmtTHB } from '@/lib/format'
import { AgendaList } from './AgendaList'
import { byTime } from './helpers'

const PAGE = 15

interface Props {
  items: Appointment[]
  customers: Map<string, Customer>
  onSelect: (a: Appointment) => void
  newestFirst: boolean
  onClearFilters: () => void
}

export function ListView({ items, customers, onSelect, newestFirst, onClearFilters }: Props) {
  const [page, setPage] = useState(0)
  const sorted = items.slice().sort(byTime)
  if (newestFirst) sorted.reverse()
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE))

  useEffect(() => setPage(0), [items.length, newestFirst])
  const safePage = Math.min(page, pages - 1)
  const rows = sorted.slice(safePage * PAGE, safePage * PAGE + PAGE)

  if (!sorted.length) {
    return (
      <div className="rounded-xl2 border border-line bg-white">
        <EmptyState icon={<SearchX size={22} />} title="ไม่พบการจองที่ตรงกับเงื่อนไข" description="ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง" action={<Button onClick={onClearFilters}>ล้างตัวกรอง</Button>} />
      </div>
    )
  }

  return (
    <div>
      <div className="hidden overflow-hidden rounded-xl2 border border-line bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-sand-50 text-left text-xs text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">วันที่ / เวลา</th>
              <th scope="col" className="px-4 py-2.5 font-medium">ลูกค้า</th>
              <th scope="col" className="px-4 py-2.5 font-medium">บริการ</th>
              <th scope="col" className="px-4 py-2.5 font-medium">พนักงาน / เตียง</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">ราคา</th>
              <th scope="col" className="px-4 py-2.5 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((a) => {
              const c = customers.get(a.customerId)
              return (
                <tr key={a.id} className="cursor-pointer transition-colors hover:bg-sand-50/70" onClick={() => onSelect(a)}>
                  <td className="px-4 py-3">
                    <button
                      className="text-left font-medium hover:text-sage-700 focus-visible:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(a)
                      }}
                      aria-label={`เปิดรายละเอียดการจอง ${a.id}`}
                    >
                      {fmtWeekday(a.date)} {fmtDate(a.date)}
                    </button>
                    <div className="text-xs text-ink-muted tabular-nums">{a.start}–{a.end} น.</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c?.name}</div>
                    <div className="text-xs text-ink-muted">{c?.nickname} · {c?.phone}</div>
                  </td>
                  <td className="px-4 py-3">{getService(a.serviceId)?.name}</td>
                  <td className="px-4 py-3">
                    <div>{STAFF.find((s) => s.id === a.staffId)?.nickname}</div>
                    <div className="text-xs text-ink-muted">{ROOMS.find((r) => r.id === a.roomId)?.name}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtTHB(a.price)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="md:hidden">
        <AgendaList items={rows} customers={customers} onSelect={onSelect} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
        <span>
          แสดง {safePage * PAGE + 1}–{Math.min(sorted.length, safePage * PAGE + PAGE)} จาก {sorted.length} รายการ
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft size={15} /></Button>
          <span aria-live="polite">หน้า {safePage + 1}/{pages}</span>
          <Button size="sm" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} aria-label="หน้าถัดไป"><ChevronRight size={15} /></Button>
        </div>
      </div>
    </div>
  )
}
