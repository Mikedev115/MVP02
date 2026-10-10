import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ROOMS, SERVICES, STAFF, STATUS_LABEL, STATUS_ORDER } from '@/data/catalog'
import type { Appointment, AppointmentStatus } from '@/types'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { DEMO_NOW, DEMO_TODAY, SHOP_CLOSE, SHOP_OPEN, addDays, dayOfWeek, eachDay, fmtDate, fmtDateLong, fmtDayMonth, startOfWeek, toMin } from '@/lib/date'
import { cn } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/Card'
import { Input, Segmented, Select, SearchInput } from '@/components/ui/Form'
import { STATUS_STYLE } from '@/components/ui/Badge'
import { AgendaList } from './AgendaList'
import { AppointmentDrawer } from './AppointmentDrawer'
import { AppointmentForm, type FormInit } from './AppointmentForm'
import { DemoGuide } from './DemoGuide'
import { ListView } from './ListView'
import { TimeGrid, type GridColumn } from './TimeGrid'
import { filterAppointments, type ApptFilter } from './helpers'

type View = 'day' | 'week' | 'list'
type ListRange = 'week' | 'today' | 'next7' | 'past30' | 'all' | 'custom'

const LIST_RANGES: { value: ListRange; label: string }[] = [
  { value: 'week', label: 'สัปดาห์นี้' },
  { value: 'today', label: 'วันนี้' },
  { value: 'next7', label: '7 วันข้างหน้า' },
  { value: 'past30', label: '30 วันที่ผ่านมา' },
  { value: 'all', label: 'ทั้งหมด' },
]

function listRangeDates(r: ListRange): { from?: string; to?: string } {
  const ws = startOfWeek(DEMO_TODAY)
  switch (r) {
    case 'week': return { from: ws, to: addDays(ws, 6) }
    case 'today': return { from: DEMO_TODAY, to: DEMO_TODAY }
    case 'next7': return { from: DEMO_TODAY, to: addDays(DEMO_TODAY, 7) }
    case 'past30': return { from: addDays(DEMO_TODAY, -30), to: DEMO_TODAY }
    default: return {}
  }
}

export function BookingsPage() {
  const { data } = useStore()
  const { setGuideApptId } = useUi()
  const [params, setParams] = useSearchParams()

  const view = (['day', 'week', 'list'].includes(params.get('view') ?? '') ? params.get('view') : 'day') as View
  const date = params.get('date') ?? DEMO_TODAY
  const customFrom = params.get('from')
  const customTo = params.get('to')
  const listRangeParam = params.get('range') as ListRange | null
  const listRange: ListRange = customFrom || customTo ? 'custom' : listRangeParam && LIST_RANGES.some((r) => r.value === listRangeParam) ? listRangeParam : 'week'
  const filter: ApptFilter = {
    q: params.get('q') ?? '',
    status: (STATUS_ORDER.includes(params.get('status') as AppointmentStatus) ? params.get('status') : 'all') as ApptFilter['status'],
    staffId: params.get('staff') ?? 'all',
    serviceId: params.get('service') ?? 'all',
  }
  const gridBy = (params.get('by') === 'room' ? 'room' : 'staff') as 'staff' | 'room'
  const newestFirst = params.get('sort') !== 'asc'
  const showCancelled = params.get('cancelled') === '1'

  const [formInit, setFormInit] = useState<FormInit | null>(null)
  const [fromGuide, setFromGuide] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === 'all') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const customers = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers])

  // ช่วงวันที่ของมุมมองปัจจุบัน
  const scope = useMemo(() => {
    if (view === 'day') return { from: date, to: date }
    if (view === 'week') {
      const ws = startOfWeek(date)
      return { from: ws, to: addDays(ws, 6) }
    }
    return listRange === 'custom' ? { from: customFrom ?? undefined, to: customTo ?? undefined } : listRangeDates(listRange)
  }, [view, date, listRange, customFrom, customTo])

  const scoped = useMemo(
    () => filterAppointments(data.appointments, customers, { ...filter, status: 'all', from: scope.from, to: scope.to }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.appointments, customers, filter.q, filter.staffId, filter.serviceId, scope.from, scope.to],
  )
  const statusCount = useMemo(() => {
    const c: Record<string, number> = { all: scoped.length }
    for (const a of scoped) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [scoped])
  const filtered = useMemo(() => (filter.status === 'all' ? scoped : scoped.filter((a) => a.status === filter.status)), [scoped, filter.status])

  const filterActive = Boolean(filter.q || filter.status !== 'all' || filter.staffId !== 'all' || filter.serviceId !== 'all')
  const clearFilters = () => set({ q: null, status: null, staff: null, service: null, from: null, to: null, range: null })

  const gridItems = filtered.filter((a) => showCancelled || filter.status === 'cancelled' || a.status !== 'cancelled')

  const openCreate = (prefill?: FormInit['prefill']) => {
    setFromGuide(false)
    setFormInit({ mode: 'create', prefill })
  }

  const slotClick = (col: GridColumn, time: string) => {
    if (col.date < DEMO_TODAY || (col.date === DEMO_TODAY && toMin(time) < toMin(DEMO_NOW))) {
      return openCreate({ date: DEMO_TODAY, start: '' })
    }
    openCreate({ date: col.date, start: time, ...(gridBy === 'staff' && view === 'day' ? { staffId: col.key } : {}), ...(gridBy === 'room' && view === 'day' ? { roomId: col.key } : {}) })
  }

  /* ---------- คอลัมน์ของตารางเวลา ---------- */
  const dayColumns: GridColumn[] = useMemo(() => {
    const items = gridItems.filter((a) => a.date === date)
    if (gridBy === 'room') {
      return ROOMS.map((r) => ({ key: r.id, label: r.name, sub: `${items.filter((a) => a.roomId === r.id && a.status !== 'cancelled').length} คิว`, items: items.filter((a) => a.roomId === r.id), date }))
    }
    return STAFF.map((s) => {
      const works = s.workDays.includes(dayOfWeek(date))
      const off: [number, number][] = works ? [[toMin(SHOP_OPEN), toMin(s.shiftStart)], [toMin(s.shiftEnd), toMin(SHOP_CLOSE)]] : [[toMin(SHOP_OPEN), toMin(SHOP_CLOSE)]]
      return {
        key: s.id,
        label: s.nickname,
        sub: works ? `กะ ${s.shiftStart}–${s.shiftEnd}` : 'หยุดงาน',
        accent: s.color,
        offRanges: off,
        items: items.filter((a) => a.staffId === s.id),
        date,
      }
    })
  }, [gridItems, date, gridBy])

  const weekColumns: GridColumn[] = useMemo(() => {
    const ws = startOfWeek(date)
    return eachDay({ from: ws, to: addDays(ws, 6) }).map((d) => {
      const items = gridItems.filter((a) => a.date === d)
      const active = items.filter((a) => a.status !== 'cancelled').length
      return {
        key: d,
        label: `${['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][(dayOfWeek(d) + 6) % 7]} ${fmtDayMonth(d)}`,
        sub: `${active} คิว`,
        highlight: d === DEMO_TODAY,
        items,
        date: d,
      }
    })
  }, [gridItems, date])

  const shift = (dir: -1 | 1) => set({ date: addDays(date, dir * (view === 'week' ? 7 : 1)) === DEMO_TODAY ? null : addDays(date, dir * (view === 'week' ? 7 : 1)) })

  const heading =
    view === 'day' ? fmtDateLong(date) : view === 'week' ? `${fmtDate(startOfWeek(date))} – ${fmtDate(addDays(startOfWeek(date), 6))}` : scope.from || scope.to ? `${scope.from ? fmtDate(scope.from) : 'เริ่มต้น'} – ${scope.to ? fmtDate(scope.to) : 'ล่าสุด'}` : 'ทุกการจอง'

  return (
    <div>
      <PageIntro
        title="จัดการการจอง"
        description="ดูคิวแบบรายวัน รายสัปดาห์ หรือรายการ สร้าง แก้ไข เลื่อนนัด และปิดงานได้ที่นี่ ระบบจะป้องกันคิวซ้อนของพนักงานและเตียงให้อัตโนมัติ"
        actions={
          <Button variant="primary" onClick={() => openCreate()}>
            <Plus size={16} /> สร้างการจอง
          </Button>
        }
      />

      <DemoGuide
        onStartCreate={(init) => {
          setFromGuide(true)
          setFormInit(init)
        }}
        onOpenAppointment={setSelectedId}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented<View> label="รูปแบบการแสดงผล" value={view} onChange={(v) => set({ view: v === 'day' ? null : v })} options={[{ value: 'day', label: 'รายวัน' }, { value: 'week', label: 'รายสัปดาห์' }, { value: 'list', label: 'รายการ' }]} />
        {view !== 'list' && (
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={() => shift(-1)} aria-label={view === 'week' ? 'สัปดาห์ก่อนหน้า' : 'วันก่อนหน้า'}><ChevronLeft size={15} /></Button>
            <Button size="sm" onClick={() => set({ date: null })} disabled={date === DEMO_TODAY && view === 'day'}>วันนี้</Button>
            <Button size="sm" onClick={() => shift(1)} aria-label={view === 'week' ? 'สัปดาห์ถัดไป' : 'วันถัดไป'}><ChevronRight size={15} /></Button>
            <Input type="date" aria-label="เลือกวันที่" className="ml-1 h-8 w-auto text-sm" value={date} onChange={(e) => e.target.value && set({ date: e.target.value === DEMO_TODAY ? null : e.target.value })} />
          </div>
        )}
        <p className="ml-auto flex items-center gap-1.5 text-sm font-medium text-ink-soft"><CalendarDays size={15} className="text-sage-500" />{heading}</p>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <SearchInput label="ค้นหาการจอง" value={filter.q} onChange={(v) => set({ q: v })} placeholder="ค้นหาชื่อลูกค้า เบอร์โทร รหัสการจอง หรือบริการ" />
        <Select aria-label="กรองตามพนักงาน" value={filter.staffId} onChange={(e) => set({ staff: e.target.value })}>
          <option value="all">พนักงานทั้งหมด</option>
          {STAFF.map((s) => <option key={s.id} value={s.id}>{s.nickname}</option>)}
        </Select>
        <Select aria-label="กรองตามบริการ" value={filter.serviceId} onChange={(e) => set({ service: e.target.value })}>
          <option value="all">ทุกบริการ</option>
          {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => set({ status: null })} aria-pressed={filter.status === 'all'} className={cn('rounded-full border px-3 py-1 text-sm transition-colors', filter.status === 'all' ? 'border-sage-500 bg-sage-600 text-white' : 'border-line bg-white hover:bg-sand-50')}>
          ทั้งหมด <span className="tabular-nums opacity-80">{statusCount.all ?? 0}</span>
        </button>
        {STATUS_ORDER.map((s) => (
          <button key={s} type="button" aria-pressed={filter.status === s} onClick={() => set({ status: filter.status === s ? null : s })} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors', filter.status === s ? 'border-sage-500 bg-sage-50 font-medium text-sage-900' : 'border-line bg-white hover:bg-sand-50')}>
            <span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[s].dot)} />
            {STATUS_LABEL[s]} <span className="tabular-nums text-ink-muted">{statusCount[s] ?? 0}</span>
          </button>
        ))}
        {filterActive && <Button size="sm" variant="ghost" onClick={clearFilters}>ล้างตัวกรอง</Button>}
        {view === 'day' && <Segmented<'staff' | 'room'> size="sm" label="แยกตาม" value={gridBy} onChange={(v) => set({ by: v === 'staff' ? null : v })} options={[{ value: 'staff', label: 'ตามพนักงาน' }, { value: 'room', label: 'ตามเตียง' }]} />}
        {view !== 'list' && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" checked={showCancelled} onChange={(e) => set({ cancelled: e.target.checked ? '1' : null })} className="h-4 w-4 accent-sage-600" /> แสดงรายการที่ยกเลิก
          </label>
        )}
      </div>

      {view === 'list' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Segmented<ListRange> label="ช่วงเวลา" value={listRange === 'custom' ? ('' as ListRange) : listRange} onChange={(v) => set({ range: v === 'week' ? null : v, from: null, to: null })} options={LIST_RANGES} />
          {listRange === 'custom' && <span className="rounded-full bg-sage-50 px-3 py-1 text-xs text-sage-800">ช่วงที่กำหนด: {heading}</span>}
          <Button size="sm" variant="ghost" onClick={() => set({ sort: newestFirst ? 'asc' : null })}>
            เรียง: {newestFirst ? 'ใหม่สุดก่อน' : 'เก่าสุดก่อน'}
          </Button>
        </div>
      )}

      {view === 'day' && (
        <>
          <div className="hidden md:block">
            <TimeGrid columns={dayColumns} customers={customers} onSelect={(a) => setSelectedId(a.id)} onSlotClick={slotClick} selectedId={selectedId} minColWidth={gridBy === 'room' ? 130 : 150} />
          </div>
          <div className="md:hidden">
            <AgendaList items={gridItems.filter((a) => a.date === date)} customers={customers} onSelect={(a) => setSelectedId(a.id)} />
          </div>
          <p className="mt-2 hidden text-xs text-ink-muted md:block">คลิกช่องว่างในตารางเพื่อสร้างการจอง · คลิกที่การจองเพื่อดูรายละเอียด · แถบลายเฉียงคือช่วงที่พนักงานไม่อยู่ในกะ</p>
        </>
      )}
      {view === 'week' && (
        <>
          <div className="hidden md:block">
            <TimeGrid columns={weekColumns} customers={customers} onSelect={(a) => setSelectedId(a.id)} onSlotClick={slotClick} selectedId={selectedId} minColWidth={130} />
          </div>
          <div className="md:hidden">
            <AgendaList items={gridItems} customers={customers} onSelect={(a) => setSelectedId(a.id)} />
          </div>
        </>
      )}
      {view === 'list' && <ListView items={filtered} customers={customers} onSelect={(a) => setSelectedId(a.id)} newestFirst={newestFirst} onClearFilters={clearFilters} />}

      <AppointmentDrawer
        appointmentId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(a) => setFormInit({ mode: 'edit', appointment: a })}
        onReschedule={(a) => setFormInit({ mode: 'reschedule', appointment: a })}
      />
      <AppointmentForm
        init={formInit}
        onClose={() => setFormInit(null)}
        onSaved={(a: Appointment) => {
          if (fromGuide) {
            setGuideApptId(a.id)
            setFromGuide(false)
          }
          if (formInit?.mode === 'create') setSelectedId(a.id)
        }}
      />
    </div>
  )
}
