import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, SearchX } from 'lucide-react'
import { AGE_GROUPS, SOURCE_LABEL } from '@/data/catalog'
import type { AcquisitionSource, AgeGroup, CustomerSegment } from '@/types'
import { useStore } from '@/state/store'
import { SEGMENT_HINT, SEGMENT_LABEL, type CustomerStats } from '@/lib/metrics'
import { DEMO_TODAY, diffDays, fmtDate } from '@/lib/date'
import { cn, fmtTHB } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/Card'
import { SearchInput, Select } from '@/components/ui/Form'
import { SegmentBadge } from '@/components/ui/Badge'
import { Avatar, EmptyState } from '@/components/ui/Misc'
import { CustomerFormModal } from './CustomerFormModal'

type Sort = 'recent' | 'spent' | 'visits' | 'name'
const SORTS: Record<Sort, string> = { recent: 'มาล่าสุด', spent: 'ยอดใช้จ่ายสูงสุด', visits: 'จำนวนครั้งมากสุด', name: 'ชื่อ ก-ฮ' }
const PAGE = 15

export function CustomersPage() {
  const { customerStats, data } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const [page, setPage] = useState(0)

  const q = params.get('q') ?? ''
  const segment = (params.get('segment') ?? 'all') as CustomerSegment | 'all'
  const source = (params.get('source') ?? 'all') as AcquisitionSource | 'all'
  const age = (params.get('age') ?? 'all') as AgeGroup | 'all' | 'unknown'
  const sort = (params.get('sort') ?? 'recent') as Sort

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === 'all') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
    setPage(0)
  }

  const all = useMemo(() => [...customerStats.values()], [customerStats])
  const base = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/-/g, '')
    return all.filter((s) => {
      const c = s.customer
      if (source !== 'all' && c.source !== source) return false
      if (age !== 'all' && (c.ageGroup ?? 'unknown') !== age) return false
      if (needle && !`${c.name} ${c.nickname} ${c.phone.replace(/-/g, '')} ${c.lineId ?? ''}`.toLowerCase().includes(needle)) return false
      return true
    })
  }, [all, q, source, age])

  const counts = useMemo(() => {
    const c = { all: base.length, new: 0, returning: 0, inactive: 0 }
    for (const s of base) c[s.segment]++
    return c
  }, [base])

  const rows = useMemo(() => {
    const list = segment === 'all' ? base.slice() : base.filter((s) => s.segment === segment)
    const cmp: Record<Sort, (a: CustomerStats, b: CustomerStats) => number> = {
      recent: (a, b) => (b.lastVisit ?? '').localeCompare(a.lastVisit ?? ''),
      spent: (a, b) => b.totalSpent - a.totalSpent,
      visits: (a, b) => b.visits - a.visits,
      name: (a, b) => a.customer.name.localeCompare(b.customer.name, 'th'),
    }
    return list.sort(cmp[sort])
  }, [base, segment, sort])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const safePage = Math.min(page, pages - 1)
  useEffect(() => setPage(0), [rows.length])
  const view = rows.slice(safePage * PAGE, safePage * PAGE + PAGE)
  const filterActive = q || segment !== 'all' || source !== 'all' || age !== 'all'

  return (
    <div>
      <PageIntro
        title="ลูกค้าสัมพันธ์ (CRM)"
        description="รวมข้อมูลลูกค้า ประวัติการใช้บริการ และกลุ่มลูกค้าไว้ที่เดียว เพื่อดูแลลูกค้าประจำและติดตามลูกค้าที่ห่างหายไป"
        actions={<Button variant="primary" onClick={() => setAddOpen(true)}><Plus size={16} /> เพิ่มลูกค้า</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {(['new', 'returning', 'inactive'] as CustomerSegment[]).map((s) => {
          const total = all.filter((x) => x.segment === s).length
          return (
            <button key={s} type="button" onClick={() => set({ segment: segment === s ? null : s })} aria-pressed={segment === s} className={cn('rounded-xl2 border bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop', segment === s ? 'border-sage-500 ring-1 ring-sage-500' : 'border-line')}>
              <div className="flex items-center justify-between">
                <SegmentBadge segment={s} />
                <span className="text-2xl font-semibold tabular-nums">{total}</span>
              </div>
              <p className="mt-2 text-xs text-ink-muted">{SEGMENT_HINT[s]}</p>
            </button>
          )
        })}
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <SearchInput label="ค้นหาลูกค้า" value={q} onChange={(v) => set({ q: v })} placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรือ LINE ID" />
        <Select aria-label="กรองตามช่องทางที่รู้จักร้าน" value={source} onChange={(e) => set({ source: e.target.value })}>
          <option value="all">ทุกช่องทาง</option>
          {(Object.keys(SOURCE_LABEL) as AcquisitionSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
        </Select>
        <Select aria-label="กรองตามช่วงอายุ" value={age} onChange={(e) => set({ age: e.target.value })}>
          <option value="all">ทุกช่วงอายุ</option>
          {AGE_GROUPS.map((g) => <option key={g} value={g}>{g} ปี</option>)}
          <option value="unknown">ไม่ระบุอายุ</option>
        </Select>
        <Select aria-label="เรียงลำดับ" value={sort} onChange={(e) => set({ sort: e.target.value === 'recent' ? null : e.target.value })}>
          {(Object.keys(SORTS) as Sort[]).map((s) => <option key={s} value={s}>เรียง: {SORTS[s]}</option>)}
        </Select>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        {(['all', 'new', 'returning', 'inactive'] as const).map((s) => (
          <button key={s} type="button" aria-pressed={segment === s} onClick={() => set({ segment: s })} className={cn('rounded-full border px-3 py-1 transition-colors', segment === s ? 'border-sage-500 bg-sage-600 text-white' : 'border-line bg-white hover:bg-sand-50')}>
            {s === 'all' ? 'ทั้งหมด' : SEGMENT_LABEL[s]} <span className="tabular-nums opacity-80">{counts[s]}</span>
          </button>
        ))}
        {filterActive && <Button size="sm" variant="ghost" onClick={() => setParams({}, { replace: true })}>ล้างตัวกรอง</Button>}
        <span className="ml-auto text-ink-muted">ทั้งหมด {data.customers.length} ราย (ข้อมูลสมมติ)</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl2 border border-line bg-white">
          <EmptyState icon={<SearchX size={22} />} title="ไม่พบลูกค้าที่ตรงกับเงื่อนไข" description="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูลูกค้าทั้งหมด" action={<Button onClick={() => setParams({}, { replace: true })}>ล้างตัวกรอง</Button>} />
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl2 border border-line bg-white shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-sand-50 text-left text-xs text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">ลูกค้า</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">กลุ่ม</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">รู้จักร้านจาก</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">มาแล้ว</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">ยอดใช้จ่าย</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">มาล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {view.map((s) => (
                  <tr key={s.customer.id} className="cursor-pointer hover:bg-sand-50/70" onClick={() => navigate(`/customers/${s.customer.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.customer.nickname} size={34} />
                        <div>
                          <Link to={`/customers/${s.customer.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:text-sage-700 hover:underline">{s.customer.name}</Link>
                          <div className="text-xs text-ink-muted">{s.customer.nickname} · {s.customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><SegmentBadge segment={s.segment} /></td>
                    <td className="px-4 py-3">{SOURCE_LABEL[s.customer.source]}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.visits} ครั้ง</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtTHB(s.totalSpent)}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {s.lastVisit ? <>{fmtDate(s.lastVisit)}<div className="text-xs text-ink-muted">{diffDays(DEMO_TODAY, s.lastVisit)} วันที่แล้ว</div></> : <span className="text-ink-faint">ยังไม่เคยมา</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 md:hidden">
            {view.map((s) => (
              <li key={s.customer.id}>
                <Link to={`/customers/${s.customer.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
                  <Avatar name={s.customer.nickname} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.customer.name}</p>
                    <p className="truncate text-xs text-ink-muted">{s.customer.nickname} · {s.visits} ครั้ง · {fmtTHB(s.totalSpent)}</p>
                  </div>
                  <SegmentBadge segment={s.segment} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
            <span>แสดง {safePage * PAGE + 1}–{Math.min(rows.length, safePage * PAGE + PAGE)} จาก {rows.length} ราย</span>
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft size={15} /></Button>
              <span aria-live="polite">หน้า {safePage + 1}/{pages}</span>
              <Button size="sm" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} aria-label="หน้าถัดไป"><ChevronRight size={15} /></Button>
            </div>
          </div>
        </>
      )}

      <CustomerFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={(c) => navigate(`/customers/${c.id}`)} />
    </div>
  )
}
