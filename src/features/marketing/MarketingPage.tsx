import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AGE_GROUPS, CATEGORY_LABEL, MARKETING_EXPENSES, SOURCE_COLOR, SOURCE_LABEL, STATUS_LABEL } from '@/data/catalog'
import type { AcquisitionSource, Appointment } from '@/types'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { ageDistribution, categoryRevenue, defaultGranularity, demandHeatmap, hourStats, retentionCohorts, serviceStats, sourceStats, statusCounts, trendSeries, weekdayStats, SEGMENT_HINT, SEGMENT_LABEL, type Granularity } from '@/lib/metrics'
import { customersLink } from '@/lib/links'
import { eachDay, fmtMonthFull, fmtMonthShort, fmtRange, inRange, monthKey, dayOfWeek, TH_DAYS_SHORT } from '@/lib/date'
import { cn, fmtNumber, fmtPercent, fmtTHB, sum } from '@/lib/format'
import { Card, CardBody, CardHeader, PageIntro, StatCard } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'
import { SegmentBadge } from '@/components/ui/Badge'
import { CHART, ChartLegend, ChartTooltip, axisProps } from '@/components/ui/charts'

type CustType = 'all' | 'new' | 'returning'

const SEG_COLOR = { new: '#5B8FA0', returning: '#6B8A64', inactive: '#D6C9AC' } as const
const CAT_COLORS = ['#6B8A64', '#C9962B', '#5B8FA0', '#C06A4B', '#8A7BA8']

function Hint({ children }: { children: string }) {
  return <p className="mt-3 rounded-lg bg-sand-50 px-3 py-2 text-xs text-ink-muted">💡 {children}</p>
}

export function MarketingPage() {
  const { data, customerStats } = useStore()
  const { range } = useUi()
  const navigate = useNavigate()
  const [channel, setChannel] = useState<AcquisitionSource | 'all'>('all')
  const [custType, setCustType] = useState<CustType>('all')
  const [gran, setGran] = useState<Granularity | 'auto'>('auto')

  const customerById = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers])

  // ลูกค้าที่ลงทะเบียนในช่วงที่เลือก (ตามช่องทาง)
  const createdCustomers = useMemo(() => data.customers.filter((c) => inRange(c.createdAt, range) && (channel === 'all' || c.source === channel)), [data.customers, range, channel])

  const appts: Appointment[] = useMemo(
    () =>
      data.appointments.filter((a) => {
        if (!inRange(a.date, range)) return false
        const c = customerById.get(a.customerId)
        if (!c) return false
        if (channel !== 'all' && c.source !== channel) return false
        const isNew = c.createdAt >= range.from
        if (custType === 'new' && !isNew) return false
        if (custType === 'returning' && isNew) return false
        return true
      }),
    [data.appointments, customerById, range, channel, custType],
  )

  const sc = statusCounts(appts)
  const total = appts.length
  const attended = sc.completed
  const decided = sc.completed + sc.no_show + sc.cancelled

  const sourceRows = useMemo(() => {
    const inRangeCust = data.customers.filter((c) => inRange(c.createdAt, range))
    return sourceStats(inRangeCust, customerStats)
  }, [data.customers, customerStats, range])
  const sourceTotal = sum(sourceRows.map((r) => r.customers))

  const ages = useMemo(() => ageDistribution(createdCustomers), [createdCustomers])
  const ageKnown = sum(ages.filter((a) => a.group !== 'unknown').map((a) => a.count))

  const granResolved = gran === 'auto' ? defaultGranularity(range) : gran
  const nvr = useMemo(() => {
    // เฉพาะช่องทางที่เลือก: สร้างข้อมูลย่อยด้วยการกรองการจอง
    const sub = { ...data, appointments: data.appointments.filter((a) => channel === 'all' || customerById.get(a.customerId)?.source === channel) }
    return trendSeries(sub, range, granResolved)
  }, [data, range, granResolved, channel, customerById])

  const weekdays = useMemo(() => {
    const days = eachDay(range)
    return weekdayStats(appts).map((w) => ({
      ...w,
      occurrences: days.filter((d) => dayOfWeek(d) === w.dow).length,
      avg: w.bookings / Math.max(1, days.filter((d) => dayOfWeek(d) === w.dow).length),
      cancelRate: w.total ? (w.cancelled + w.noShow) / w.total : 0,
    }))
  }, [appts, range])
  const hours = useMemo(() => hourStats(appts), [appts])
  const heat = useMemo(() => demandHeatmap(appts), [appts])
  const heatMax = Math.max(1, ...heat.flat())

  const services = useMemo(() => serviceStats(appts).slice(0, 7), [appts])
  const cats = useMemo(() => categoryRevenue(appts), [appts])
  const catTotal = sum(cats.map((c) => c.revenue))

  const cohorts = useMemo(() => retentionCohorts(createdCustomers, customerStats, range), [createdCustomers, customerStats, range])

  const segs = useMemo(() => {
    const list = [...customerStats.values()].filter((s) => channel === 'all' || s.customer.source === channel)
    return (['new', 'returning', 'inactive'] as const).map((k) => {
      const mine = list.filter((s) => s.segment === k)
      return { key: k, label: SEGMENT_LABEL[k], count: mine.length, spent: sum(mine.map((s) => s.totalSpent)), avg: mine.length ? sum(mine.map((s) => s.totalSpent)) / mine.length : 0 }
    })
  }, [customerStats, channel])

  const months = useMemo(() => {
    const out: string[] = []
    eachDay(range).forEach((d) => { const m = monthKey(d); if (!out.includes(m)) out.push(m) })
    return out
  }, [range])
  const spendRows = useMemo(() => {
    return MARKETING_EXPENSES.filter((e) => months.includes(e.month) && (channel === 'all' || e.source === channel)).map((e) => {
      const newCust = data.customers.filter((c) => c.source === e.source && monthKey(c.createdAt) === e.month).length
      return { ...e, newCust, cpa: newCust ? e.amount / newCust : null }
    })
  }, [months, channel, data.customers])

  const retentionAll = cohorts.length ? sum(cohorts.map((c) => c.returned)) / Math.max(1, sum(cohorts.map((c) => c.size))) : 0

  return (
    <div>
      <PageIntro
        title="การตลาดและวิเคราะห์ลูกค้า"
        description={`ดูว่าลูกค้ามาจากไหน กลับมาซ้ำหรือไม่ และช่วงเวลาไหนคนจองมากที่สุด ช่วง ${fmtRange(range)} (เปลี่ยนช่วงวันที่ได้ที่มุมขวาบน)`}
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-muted">ช่องทางที่ลูกค้ารู้จักร้าน</p>
            <div className="flex flex-wrap gap-1.5">
              {(['all', ...Object.keys(SOURCE_LABEL)] as (AcquisitionSource | 'all')[]).map((s) => (
                <button key={s} type="button" aria-pressed={channel === s} onClick={() => setChannel(s)} className={cn('rounded-full border px-3 py-1 text-sm transition-colors', channel === s ? 'border-sage-500 bg-sage-600 text-white' : 'border-line bg-white hover:bg-sand-50')}>
                  {s === 'all' ? 'ทุกช่องทาง' : SOURCE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-muted">ประเภทลูกค้าในการจอง</p>
            <Segmented<CustType> label="ประเภทลูกค้า" value={custType} onChange={setCustType} options={[{ value: 'all', label: 'ทั้งหมด' }, { value: 'new', label: 'ลูกค้าใหม่' }, { value: 'returning', label: 'ลูกค้าเดิม' }]} />
          </div>
          {(channel !== 'all' || custType !== 'all') && <Button size="sm" variant="ghost" onClick={() => { setChannel('all'); setCustType('all') }}>ล้างตัวกรอง</Button>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="ลูกค้าใหม่" value={fmtNumber(createdCustomers.length)} sub={channel === 'all' ? 'ทุกช่องทาง' : SOURCE_LABEL[channel]} />
        <StatCard label="การจองที่วิเคราะห์" value={fmtNumber(total)} sub={custType === 'all' ? 'ลูกค้าทุกประเภท' : custType === 'new' ? 'เฉพาะลูกค้าใหม่' : 'เฉพาะลูกค้าเดิม'} />
        <StatCard label="ใช้บริการสำเร็จ" value={fmtPercent(total ? attended / total : 0)} sub={`${attended} จาก ${total} คิว`} />
        <StatCard label="ยกเลิก / ไม่มา" value={fmtPercent(total ? (sc.cancelled + sc.no_show) / total : 0)} sub={`${sc.cancelled} ยกเลิก · ${sc.no_show} ไม่มา`} invertTone />
        <StatCard label="กลับมาซ้ำ (เฉพาะกลุ่มลูกค้าใหม่)" value={fmtPercent(retentionAll)} sub="มาแล้ว ≥ 2 ครั้ง" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="ลูกค้าใหม่มาจากช่องทางไหน" hint="คลิกแท่งเพื่อกรองทั้งหน้าตามช่องทางนั้น" />
          <div className="h-72 px-2 pb-2 pt-3">
            {sourceTotal === 0 ? (
              <EmptyState title="ไม่มีลูกค้าใหม่ในช่วงนี้" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceRows} layout="vertical" margin={{ left: 8, right: 36, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={92} {...axisProps} tick={{ fill: CHART.ink, fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip format={(v) => `${v} ราย (${fmtPercent(v / sourceTotal)})`} extra={(p) => <p className="mt-1 text-ink-muted">กลับมาซ้ำ {fmtPercent((p[0]?.payload?.repeatRate as number) ?? 0)}</p>} />} />
                  <Bar dataKey="customers" name="ลูกค้าใหม่" radius={[0, 6, 6, 0]} barSize={22} cursor="pointer" onClick={(d: { source?: AcquisitionSource }) => d?.source && setChannel(d.source === channel ? 'all' : d.source)}>
                    {sourceRows.map((r) => <Cell key={r.source} fill={SOURCE_COLOR[r.source]} opacity={channel === 'all' || channel === r.source ? 1 : 0.3} />)}
                    <LabelList dataKey="customers" position="right" fill={CHART.axis} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-5 pb-5"><Hint>ช่องทางที่พาลูกค้ามามากไม่ได้แปลว่าลูกค้ากลับมาซ้ำเสมอไป ดูอัตรากลับมาซ้ำของแต่ละช่องทางได้ในหน้า "ข้อมูลเชิงลึก"</Hint></div>
        </Card>

        <Card>
          <CardHeader title="ช่วงอายุของลูกค้า" hint="เฉพาะลูกค้าใหม่ในช่วงนี้ ข้อมูลที่ลูกค้าให้โดยสมัครใจ" />
          <div className="h-72 px-2 pb-2 pt-3">
            {createdCustomers.length === 0 ? (
              <EmptyState title="ไม่มีข้อมูล" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ages} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip format={(v) => `${v} ราย (${fmtPercent(v / createdCustomers.length)})`} />} />
                  <Bar dataKey="count" name="ลูกค้า" radius={[6, 6, 0, 0]} maxBarSize={48} cursor="pointer" onClick={(d: { group?: string }) => d?.group && navigate(customersLink({ age: d.group }))}>
                    {ages.map((a) => <Cell key={a.group} fill={a.group === 'unknown' ? CHART.sand : CHART.sage} />)}
                    <LabelList dataKey="count" position="top" fill={CHART.axis} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-5 pb-5"><Hint>{`ลูกค้า ${ageKnown} จาก ${createdCustomers.length} ราย ระบุช่วงอายุ (${AGE_GROUPS.length} ช่วง) ส่วนที่เหลือเลือกไม่ระบุ`}</Hint></div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="ลูกค้าใหม่ vs ลูกค้าเดิม ตามช่วงเวลา"
            hint="จำนวนลูกค้าที่มีการจอง (ไม่นับที่ยกเลิก)"
            action={<Segmented<Granularity | 'auto'> size="sm" label="ช่วงเวลา" value={gran} onChange={setGran} options={[{ value: 'auto', label: 'อัตโนมัติ' }, { value: 'day', label: 'วัน' }, { value: 'week', label: 'สัปดาห์' }, { value: 'month', label: 'เดือน' }]} />}
          />
          <div className="h-64 px-3 pb-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nvr} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...axisProps} allowDecimals={false} width={36} />
                <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip format={(v) => `${v} ราย`} />} />
                <Bar dataKey="returningCustomers" name="ลูกค้าเดิม" stackId="a" fill={CHART.sage} />
                <Bar dataKey="newCustomers" name="ลูกค้าใหม่" stackId="a" fill={CHART.sky} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-5"><ChartLegend items={[{ label: 'ลูกค้าเดิม', color: CHART.sage }, { label: 'ลูกค้าใหม่', color: CHART.sky }]} /></div>
        </Card>

        <Card>
          <CardHeader title="จากการจองสู่การใช้บริการ" hint="เกิดอะไรขึ้นกับการจองทั้งหมด" />
          <CardBody>
            {total === 0 ? <EmptyState title="ไม่มีการจอง" /> : (
              <>
                <ul className="space-y-3">
                  {[
                    { label: 'การจองทั้งหมด', n: total, color: CHART.sand },
                    { label: 'ไม่ถูกยกเลิก', n: total - sc.cancelled, color: CHART.sky },
                    { label: 'ให้บริการเสร็จสิ้น', n: sc.completed, color: CHART.sage },
                  ].map((s) => (
                    <li key={s.label}>
                      <div className="flex justify-between text-sm"><span>{s.label}</span><span className="tabular-nums text-ink-muted">{s.n} · {fmtPercent(s.n / total)}</span></div>
                      <div className="mt-1 h-3 rounded-full bg-sand-100"><div className="h-full rounded-full transition-all" style={{ width: `${(s.n / total) * 100}%`, background: s.color }} /></div>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {(Object.keys(sc) as (keyof typeof sc)[]).map((k) => (
                    <div key={k} className="flex justify-between rounded-lg bg-sand-50 px-3 py-1.5"><dt className="text-ink-muted">{STATUS_LABEL[k]}</dt><dd className="font-medium tabular-nums">{sc[k]}</dd></div>
                  ))}
                </dl>
                {decided > 0 && <Hint>{`จากคิวที่สรุปผลแล้ว ${decided} คิว มี ${fmtPercent(sc.completed / decided)} ที่มาใช้บริการจริง`}</Hint>}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="วันที่คนจองมากที่สุด" hint="จำนวนคิวเฉลี่ยต่อวัน และอัตรายกเลิก/ไม่มา" />
          <div className="h-64 px-2 pb-2 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdays} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} tickFormatter={(v: string) => v.replace('วัน', '').slice(0, 5)} />
                <YAxis {...axisProps} />
                <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip title={(l) => `วัน${l}`} format={(v) => `${v.toFixed(1)} คิว/วัน`} extra={(p) => <p className="mt-1 text-ink-muted">ยกเลิก/ไม่มา {fmtPercent((p[0]?.payload?.cancelRate as number) ?? 0)}</p>} />} />
                <Bar dataKey="avg" name="คิวเฉลี่ย" fill={CHART.sage} radius={[6, 6, 0, 0]} maxBarSize={40}>
                  <LabelList dataKey="avg" position="top" fill={CHART.axis} fontSize={11} formatter={(v: number) => v.toFixed(1)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="ชั่วโมงที่คนจองมากที่สุด" hint="จำนวนคิวตามเวลาเริ่มบริการ" />
          <div className="h-64 px-2 pb-2 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} tickFormatter={(v: string) => v.slice(0, 2)} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip title={(l) => `เริ่มเวลา ${l} น.`} format={(v) => `${v} คิว`} />} />
                <Bar dataKey="bookings" name="คิว" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {hours.map((h) => <Cell key={h.hour} fill={h.bookings === Math.max(...hours.map((x) => x.bookings)) ? CHART.clay : CHART.sage} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="แผนที่ความหนาแน่นของการจอง" hint="สีเข้ม = คิวเยอะ · ช่วยวางแผนพนักงานและโปรโมชันช่วงเวลาเงียบ" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-1 text-center text-xs" aria-label="ความหนาแน่นของการจองตามวันและชั่วโมง">
              <thead>
                <tr>
                  <th className="w-12" />
                  {Array.from({ length: 12 }, (_, i) => <th key={i} scope="col" className="font-medium text-ink-muted">{10 + i}:00</th>)}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <tr key={d}>
                    <th scope="row" className="pr-1 text-right font-medium text-ink-soft">{TH_DAYS_SHORT[d]}</th>
                    {heat[d].map((n, i) => (
                      <td key={i} title={`วัน${TH_DAYS_SHORT[d]} ${10 + i}:00 น. — ${n} คิว`} className="h-9 rounded-md tabular-nums" style={{ background: n ? `rgba(86,112,79,${0.12 + (n / heatMax) * 0.78})` : '#F7F3EA', color: n / heatMax > 0.55 ? '#fff' : '#4A4A45' }}>
                        {n || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="บริการยอดนิยม" hint="จำนวนครั้งที่ให้บริการเสร็จสิ้น" />
          <div className="h-72 px-2 pb-4 pt-3">
            {services.length === 0 ? <EmptyState title="ไม่มีข้อมูล" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={services.map((s) => ({ ...s, short: s.name.replace(/ \d+ นาที/, '').replace('แผนโบราณ', '').trim() }))} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="short" width={128} {...axisProps} tick={{ fill: CHART.ink, fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip title={(_, p) => String(p[0]?.payload?.name)} format={(v) => `${v} ครั้ง`} extra={(p) => <p className="mt-1 text-ink-muted">รายได้ {fmtTHB((p[0]?.payload?.revenue as number) ?? 0)}</p>} />} />
                  <Bar dataKey="count" name="จำนวนครั้ง" fill={CHART.sage} radius={[0, 6, 6, 0]} barSize={20}><LabelList dataKey="count" position="right" fill={CHART.axis} fontSize={12} /></Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="รายได้แยกตามหมวดบริการ" hint={`รวม ${fmtTHB(catTotal)}`} />
          <CardBody>
            {cats.length === 0 ? <EmptyState title="ไม่มีข้อมูล" /> : (
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cats} dataKey="revenue" nameKey="label" innerRadius={46} outerRadius={80} paddingAngle={2} stroke="none">
                        {cats.map((c, i) => <Cell key={c.key} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip format={(v) => `${fmtTHB(v)} (${fmtPercent(v / catTotal)})`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-[10rem] flex-1 space-y-2 text-sm">
                  {cats.map((c, i) => (
                    <li key={c.key} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />{CATEGORY_LABEL[c.key]}</span>
                      <span className="tabular-nums text-ink-muted">{fmtTHB(c.revenue)} · {fmtPercent(c.revenue / catTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="การกลับมาใช้บริการซ้ำ (Retention)" hint="ลูกค้าใหม่ของแต่ละเดือนที่ใช้บริการสำเร็จตั้งแต่ 2 ครั้งขึ้นไป" />
          <div className="h-64 px-2 pb-2 pt-3">
            {cohorts.every((c) => c.size === 0) ? <EmptyState title="ไม่มีข้อมูล" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohorts.map((c) => ({ ...c, label: fmtMonthShort(c.month) }))} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 1]} width={44} />
                  <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip title={(_, p) => `ลูกค้าใหม่ ${fmtMonthFull(String(p[0]?.payload?.month))}`} format={(v) => fmtPercent(v)} extra={(p) => <p className="mt-1 text-ink-muted">{String(p[0]?.payload?.returned)} จาก {String(p[0]?.payload?.size)} ราย กลับมาซ้ำ</p>} />} />
                  <Bar dataKey="rate" name="กลับมาซ้ำ" fill={CHART.sage} radius={[6, 6, 0, 0]} maxBarSize={48}>
                    <LabelList dataKey="rate" position="top" fill={CHART.axis} fontSize={12} formatter={(v: number) => `${Math.round(v * 100)}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-5 pb-5"><Hint>เดือนล่าสุดอาจต่ำกว่าจริง เพราะลูกค้ายังมีเวลากลับมาใช้บริการอีก</Hint></div>
        </Card>

        <Card>
          <CardHeader title="กลุ่มลูกค้า ณ วันนี้" hint="แบ่งตามพฤติกรรมการใช้บริการล่าสุด" />
          <CardBody>
            <div className="flex h-4 overflow-hidden rounded-full bg-sand-100">
              {segs.map((s) => <div key={s.key} style={{ width: `${(s.count / Math.max(1, sum(segs.map((x) => x.count)))) * 100}%`, background: SEG_COLOR[s.key] }} title={`${s.label} ${s.count}`} />)}
            </div>
            <ul className="mt-4 space-y-3">
              {segs.map((s) => (
                <li key={s.key} className="flex items-center gap-3">
                  <span className="h-8 w-1.5 rounded-full" style={{ background: SEG_COLOR[s.key] }} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium"><SegmentBadge segment={s.key} /> <span className="tabular-nums">{s.count} ราย</span></p>
                    <p className="text-xs text-ink-muted">{SEGMENT_HINT[s.key]}</p>
                  </div>
                  <div className="text-right text-xs text-ink-muted">เฉลี่ย<br /><span className="text-sm font-medium text-ink">{fmtTHB(s.avg)}</span></div>
                  <Button size="sm" onClick={() => navigate(customersLink({ segment: s.key, ...(channel !== 'all' ? { source: channel } : {}) }))}>ดูรายชื่อ</Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="ค่าโฆษณาตัวอย่าง (เดโม) และจำนวนลูกค้าใหม่" hint="มีค่าโฆษณาตัวอย่างเฉพาะ Facebook และ TikTok ช่องทางอื่นไม่มีข้อมูลค่าใช้จ่าย จึงไม่คำนวณต้นทุนต่อลูกค้า" />
        <CardBody>
          {spendRows.length === 0 ? (
            <p className="text-sm text-ink-muted">ช่องทางหรือช่วงเวลาที่เลือกไม่มีข้อมูลค่าโฆษณา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-line text-left text-xs text-ink-muted">
                  <tr><th scope="col" className="py-2 font-medium">เดือน</th><th scope="col" className="py-2 font-medium">ช่องทาง</th><th scope="col" className="py-2 font-medium">รายละเอียด</th><th scope="col" className="py-2 text-right font-medium">ค่าโฆษณา</th><th scope="col" className="py-2 text-right font-medium">ลูกค้าใหม่</th><th scope="col" className="py-2 text-right font-medium">ต้นทุน/ลูกค้าใหม่</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {spendRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2">{fmtMonthFull(r.month)}</td>
                      <td className="py-2">{SOURCE_LABEL[r.source]}</td>
                      <td className="py-2 text-ink-muted">{r.note}</td>
                      <td className="py-2 text-right tabular-nums">{fmtTHB(r.amount)}</td>
                      <td className="py-2 text-right tabular-nums">{r.newCust}</td>
                      <td className="py-2 text-right tabular-nums">{r.cpa ? fmtTHB(r.cpa) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Hint>เป็นตัวเลขสมมติเพื่อสาธิตเท่านั้น ลูกค้าใหม่ในตารางนับทั้งเดือน ไม่ผูกกับช่วงวันที่ที่เลือก และไม่ใช่ตัวเลขผลตอบแทนการโฆษณา (ROI)</Hint>
        </CardBody>
      </Card>
    </div>
  )
}
