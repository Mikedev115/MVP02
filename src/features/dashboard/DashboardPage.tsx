import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Banknote, CalendarCheck, CalendarDays, Receipt, UserPlus, XCircle } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ROOMS, SOURCE_COLOR, SOURCE_LABEL, STAFF } from '@/data/catalog'
import type { AcquisitionSource } from '@/types'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { buildAlerts, customersCreatedIn, kpisWithPrevious, roomUtilization, serviceStats, staffUtilization } from '@/lib/metrics'
import { buildInsights } from '@/lib/insights'
import { bookingsLink, customersLink } from '@/lib/links'
import { DEMO_NOW, DEMO_TODAY, fmtDate, fmtRange, toMin } from '@/lib/date'
import { cn, fmtDelta, fmtNumber, fmtPercent, fmtTHB } from '@/lib/format'
import { getService } from '@/lib/conflicts'
import { Card, CardBody, CardHeader, PageIntro, StatCard } from '@/components/ui/Card'
import { Avatar, EmptyState, ProgressBar, utilTone } from '@/components/ui/Misc'
import { StatusBadge } from '@/components/ui/Badge'
import { CHART, ChartTooltip, axisProps } from '@/components/ui/charts'
import { AppointmentDrawer } from '@/features/bookings/AppointmentDrawer'
import { AppointmentForm, type FormInit } from '@/features/bookings/AppointmentForm'
import { TrendCard } from './TrendCard'
import { capacityAt, vacancyForDay } from '@/lib/availability'
import { InsightCard } from '@/features/insights/InsightCard'

export function DashboardPage() {
  const { data, customerStats } = useStore()
  const { range } = useUi()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formInit, setFormInit] = useState<FormInit | null>(null)

  const { current: k, previous: p } = useMemo(() => kpisWithPrevious(data, range), [data, range])
  const todayAppts = useMemo(() => data.appointments.filter((a) => a.date === DEMO_TODAY), [data.appointments])
  const todayActive = todayAppts.filter((a) => a.status !== 'cancelled')
  const todayDone = todayAppts.filter((a) => a.status === 'completed').length
  const services = useMemo(() => serviceStats(data.appointments.filter((a) => a.date >= range.from && a.date <= range.to)).slice(0, 6), [data.appointments, range])
  const created = useMemo(() => customersCreatedIn(data, range), [data, range])
  const channels = useMemo(() => {
    const counts: Partial<Record<AcquisitionSource, number>> = {}
    created.forEach((c) => (counts[c.source] = (counts[c.source] ?? 0) + 1))
    return (Object.entries(counts) as [AcquisitionSource, number][]).map(([s, n]) => ({ source: s, name: SOURCE_LABEL[s], value: n })).sort((a, b) => b.value - a.value)
  }, [created])
  const staffUtil = useMemo(() => staffUtilization(data.appointments, range), [data.appointments, range])
  const roomUtil = useMemo(() => roomUtilization(data.appointments, range), [data.appointments, range])
  const upcoming = useMemo(
    () =>
      data.appointments
        .filter((a) => (a.status === 'pending' || a.status === 'confirmed') && (a.date > DEMO_TODAY || (a.date === DEMO_TODAY && toMin(a.end) > toMin(DEMO_NOW))))
        .sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1))
        .slice(0, 6),
    [data.appointments],
  )
  const insights = useMemo(() => buildInsights(data, customerStats, range).slice(0, 3), [data, customerStats, range])
  const alerts = useMemo(() => buildAlerts(data), [data])
  const freeNow = useMemo(() => capacityAt(data.appointments.filter((a) => a.date === DEMO_TODAY), DEMO_TODAY, DEMO_NOW, 'sv-wash45').seats, [data.appointments])
  const freeToday = useMemo(() => vacancyForDay(data.appointments, DEMO_TODAY).reduce((n, s) => n + s.seats, 0), [data.appointments])

  const totalNewReturning = k.newCustomers + k.returningCustomers
  const maxService = Math.max(1, ...services.map((s) => s.count))

  return (
    <div>
      <PageIntro
        title="ภาพรวมธุรกิจ"
        description={`สรุปผลการดำเนินงานของนุ่มดี Hair Sleep Spa ช่วง ${fmtRange(range)} เปรียบเทียบกับช่วงก่อนหน้าที่ยาวเท่ากัน ตัวเลขทุกตัวคำนวณจากการจองและลูกค้าชุดเดียวกัน`}
        actions={
          <>
            <Link to="/bookings" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-sand-50"><CalendarDays size={16} /> ดูปฏิทินการจอง</Link>
            <button type="button" onClick={() => setFormInit({ mode: 'create', prefill: { date: DEMO_TODAY } })} className="inline-flex h-10 items-center gap-2 rounded-lg bg-sage-600 px-4 text-sm font-medium text-white hover:bg-sage-700"><CalendarCheck size={16} /> สร้างการจอง</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="รายได้" icon={<Banknote size={18} />} value={fmtTHB(k.revenue)} delta={fmtDelta(k.revenue, p.revenue)} sub={k.pipeline ? `รอรับอีก ${fmtTHB(k.pipeline)}` : 'เทียบช่วงก่อนหน้า'} to={bookingsLink({ status: 'completed', range })} />
        <StatCard label="การจองทั้งหมด" icon={<CalendarCheck size={18} />} value={fmtNumber(k.bookings)} delta={fmtDelta(k.bookings, p.bookings)} sub={`เสร็จสิ้น ${k.completed}`} to={bookingsLink({ range })} />
        <StatCard label="นัดหมายวันนี้" icon={<CalendarDays size={18} />} value={`${todayActive.length} คิว`} sub={`เสร็จแล้ว ${todayDone} · เหลือ ${todayActive.filter((a) => a.status === 'pending' || a.status === 'confirmed').length}`} to={bookingsLink({ view: 'day' })} />
        <StatCard label="ลูกค้าใหม่ / ประจำ" icon={<UserPlus size={18} />} value={`${k.newCustomers} / ${k.returningCustomers}`} delta={fmtDelta(k.newCustomers, p.newCustomers)} sub="ใหม่เทียบก่อนหน้า" to={customersLink({ segment: 'new' })} />
        <StatCard label="รายได้เฉลี่ยต่อคิว" icon={<Receipt size={18} />} value={fmtTHB(k.avgRevenuePerBooking)} delta={fmtDelta(k.avgRevenuePerBooking, p.avgRevenuePerBooking)} sub="เฉพาะคิวที่เสร็จ" to={bookingsLink({ status: 'completed', range })} />
        <StatCard label="อัตรายกเลิก" icon={<XCircle size={18} />} value={fmtPercent(k.cancellationRate)} delta={fmtDelta(k.cancellationRate, p.cancellationRate)} invertTone sub={`ไม่มาตามนัด ${k.noShow}`} to={bookingsLink({ status: 'cancelled', range })} />
      </div>

      <Link to="/operations" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-sage-200 bg-sage-50/70 px-5 py-3 transition-colors hover:bg-sage-100">
        <p className="text-sm text-sage-900">
          <span className="font-semibold">ตอนนี้ว่าง {freeNow} เตียง</span> · ที่เหลือของวันนี้รับลูกค้าเพิ่มได้ราว {freeToday} คิว
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-sage-800">สร้างข้อความโพสต์คิวว่าง <ArrowRight size={14} /></span>
      </Link>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2"><TrendCard data={data} range={range} /></div>
        <Card>
          <CardHeader title="นัดหมายที่กำลังจะถึง" hint="คิวถัดไปที่ยังรอยืนยันหรือยืนยันแล้ว" action={<Link to={bookingsLink({ view: 'day' })} className="text-sm font-medium text-sage-700 hover:underline">ดูทั้งหมด</Link>} />
          <CardBody className="pt-3">
            {upcoming.length === 0 ? (
              <EmptyState title="ไม่มีนัดหมายที่กำลังจะถึง" description="สร้างการจองใหม่ได้จากปุ่มด้านบน" />
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((a) => {
                  const c = customerStats.get(a.customerId)?.customer
                  return (
                    <li key={a.id}>
                      <button type="button" onClick={() => setSelectedId(a.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-sand-50/60">
                        <Avatar name={c?.nickname ?? '?'} size={32} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{c?.nickname} · {getService(a.serviceId)?.name.split(' ').slice(0, 2).join(' ')}</span>
                          <span className="block text-xs text-ink-muted">{a.date === DEMO_TODAY ? 'วันนี้' : fmtDate(a.date)} {a.start} น. · {STAFF.find((s) => s.id === a.staffId)?.nickname}</span>
                        </span>
                        <StatusBadge status={a.status} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="บริการยอดนิยม" hint="คลิกแท่งเพื่อดูรายการจองของบริการนั้น" />
          <div className="h-72 px-2 pb-4 pt-3">
            {services.length === 0 ? (
              <EmptyState title="ยังไม่มีข้อมูล" description="ไม่มีบริการที่เสร็จสิ้นในช่วงนี้" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={services.map((s) => ({ ...s, short: s.name.replace(/ \d+ นาที/, '').replace('แผนโบราณ', '').trim() }))} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide domain={[0, maxService]} />
                  <YAxis type="category" dataKey="short" width={112} {...axisProps} tick={{ fill: CHART.ink, fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip title={(_, pl) => String(pl[0]?.payload?.name)} format={(v) => `${v} ครั้ง`} extra={(pl) => <p className="mt-1 text-ink-muted">รายได้ {fmtTHB((pl[0]?.payload?.revenue as number) ?? 0)}</p>} />} />
                  <Bar dataKey="count" name="จำนวนครั้ง" fill={CHART.sage} radius={[0, 6, 6, 0]} barSize={20} cursor="pointer" onClick={(d: { id?: string }) => d?.id && navigate(bookingsLink({ service: d.id, status: 'completed', range }))} label={{ position: 'right', fill: CHART.axis, fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="ลูกค้ารู้จักร้านจากไหน" hint={`ลูกค้าใหม่ ${created.length} ราย · คลิกเพื่อดูรายชื่อ`} />
          <div className="px-4 pb-4 pt-2">
            {channels.length === 0 ? (
              <EmptyState title="ยังไม่มีลูกค้าใหม่" description="ไม่มีลูกค้าใหม่ในช่วงที่เลือก" />
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={channels} dataKey="value" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={2} stroke="none" cursor="pointer" onClick={(d: { source?: string }) => d?.source && navigate(customersLink({ source: d.source }))}>
                        {channels.map((c) => <Cell key={c.source} fill={SOURCE_COLOR[c.source]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip format={(v) => `${v} ราย (${fmtPercent(v / created.length)})`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  {channels.map((c) => (
                    <li key={c.source}>
                      <Link to={customersLink({ source: c.source })} className="flex items-center justify-between rounded px-1 py-0.5 hover:bg-sand-50">
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SOURCE_COLOR[c.source] }} />{c.name}</span>
                        <span className="tabular-nums text-ink-muted">{c.value}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="ลูกค้าใหม่ vs ลูกค้าประจำ" hint="ลูกค้าที่มีการจองในช่วงที่เลือก (ไม่นับที่ยกเลิก)" />
          <CardBody>
            {totalNewReturning === 0 ? (
              <EmptyState title="ไม่มีข้อมูล" />
            ) : (
              <>
                <div className="flex h-4 overflow-hidden rounded-full bg-sand-100" role="img" aria-label={`ลูกค้าใหม่ ${k.newCustomers} ประจำ ${k.returningCustomers}`}>
                  <div className="bg-sky2-500 transition-all" style={{ width: `${(k.newCustomers / totalNewReturning) * 100}%` }} />
                  <div className="bg-sage-500 transition-all" style={{ width: `${(k.returningCustomers / totalNewReturning) * 100}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link to={customersLink({ segment: 'new' })} className="rounded-xl border border-line p-3 hover:border-sky2-500">
                    <p className="flex items-center gap-1.5 text-sm text-ink-muted"><span className="h-2.5 w-2.5 rounded-sm bg-sky2-500" />ลูกค้าใหม่</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{k.newCustomers}</p>
                    <p className="text-xs text-ink-muted">{fmtPercent(k.newCustomers / totalNewReturning)}</p>
                  </Link>
                  <Link to={customersLink({ segment: 'returning' })} className="rounded-xl border border-line p-3 hover:border-sage-500">
                    <p className="flex items-center gap-1.5 text-sm text-ink-muted"><span className="h-2.5 w-2.5 rounded-sm bg-sage-500" />ลูกค้าเดิม</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{k.returningCustomers}</p>
                    <p className="text-xs text-ink-muted">{fmtPercent(k.returningCustomers / totalNewReturning)}</p>
                  </Link>
                </div>
                <p className="mt-3 text-sm text-ink-muted">ลูกค้าเดิมคือผู้ที่ลงทะเบียนก่อนวันที่ {fmtDate(range.from)} และกลับมาใช้บริการในช่วงนี้</p>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="การใช้เวลาของพนักงาน" hint="เวลาที่มีคิว ÷ เวลาตามกะ (ไม่รวมคิวยกเลิก/ไม่มา)" />
          <CardBody>
            <ul className="space-y-3">
              {staffUtil.map((u) => (
                <li key={u.id}>
                  <Link to={bookingsLink({ staff: u.id, range })} className="group block">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="group-hover:text-sage-700">{u.name} <span className="text-xs text-ink-muted">· {u.bookings} คิว</span></span>
                      <span className={cn('font-medium tabular-nums', u.ratio >= 0.8 && 'text-clay-600')}>{fmtPercent(u.ratio)}</span>
                    </div>
                    <ProgressBar ratio={u.ratio} tone={utilTone(u.ratio)} label={`${u.name} ใช้เวลา ${fmtPercent(u.ratio)}`} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="การใช้เตียง" hint="เวลาที่มีคิว ÷ เวลาเปิดร้านทั้งหมด" />
          <CardBody>
            <ul className="space-y-3">
              {roomUtil.map((u) => (
                <li key={u.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{u.name} <span className="text-xs text-ink-muted">· {ROOMS.find((r) => r.id === u.id)?.capacityNote}</span></span>
                    <span className="font-medium tabular-nums">{fmtPercent(u.ratio)}</span>
                  </div>
                  <ProgressBar ratio={u.ratio / 0.8} tone={utilTone(u.ratio / 0.8)} label={`${u.name} ใช้งาน ${fmtPercent(u.ratio)}`} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="ข้อเสนอแนะจากข้อมูล" hint="คำนวณจากกฎและตัวเลขจริงในระบบ ไม่ใช่ AI" action={<Link to="/insights" className="inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:underline">ดูทั้งหมด <ArrowRight size={14} /></Link>} />
          <CardBody className="space-y-3">
            {insights.length === 0 ? <EmptyState title="ข้อมูลยังไม่พอ" description="เลือกช่วงวันที่ที่กว้างขึ้นเพื่อให้ระบบวิเคราะห์ได้" /> : insights.map((i) => <InsightCard key={i.id} insight={i} compact />)}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="แจ้งเตือนการดำเนินงาน" />
          <CardBody className="pt-3">
            {alerts.length === 0 ? (
              <EmptyState title="ทุกอย่างเรียบร้อย" description="ไม่มีเรื่องที่ต้องดำเนินการ" />
            ) : (
              <ul className="space-y-2">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Link to={a.href} className="flex gap-3 rounded-lg border border-line p-3 transition-colors hover:bg-sand-50">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.level === 'high' ? 'bg-clay-500' : a.level === 'medium' ? 'bg-amber2-500' : 'bg-sky2-500')} />
                      <span>
                        <span className="block text-sm font-medium">{a.title}</span>
                        <span className="block text-xs text-ink-muted">{a.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <AppointmentDrawer appointmentId={selectedId} onClose={() => setSelectedId(null)} onEdit={(a) => setFormInit({ mode: 'edit', appointment: a })} onReschedule={(a) => setFormInit({ mode: 'reschedule', appointment: a })} />
      <AppointmentForm init={formInit} onClose={() => setFormInit(null)} />
    </div>
  )
}
