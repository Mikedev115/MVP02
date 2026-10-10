import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AppData, DateRange } from '@/types'
import { defaultGranularity, trendSeries, type Granularity } from '@/lib/metrics'
import { fmtNumber, fmtTHB, fmtTHBCompact } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Form'
import { CHART, ChartLegend, ChartTooltip, axisProps } from '@/components/ui/charts'

type Metric = 'revenue' | 'bookings'

export function TrendCard({ data, range }: { data: AppData; range: DateRange }) {
  const [metric, setMetric] = useState<Metric>('revenue')
  const [gran, setGran] = useState<Granularity>(defaultGranularity(range))
  useEffect(() => setGran(defaultGranularity(range)), [range])

  const series = useMemo(() => trendSeries(data, range, gran).map((p) => ({ ...p, other: Math.max(0, p.bookings - p.completed - p.cancelled) })), [data, range, gran])
  const title = (label: string | number | undefined) => (gran === 'week' ? `สัปดาห์เริ่ม ${label}` : String(label))

  return (
    <Card>
      <CardHeader
        title="แนวโน้มรายได้และการจอง"
        hint={metric === 'revenue' ? 'รายได้จากบริการที่เสร็จสิ้นแล้วเท่านั้น' : 'จำนวนการจองทั้งหมดตามวันนัด แยกตามผลลัพธ์'}
        action={
          <div className="flex flex-wrap gap-2">
            <Segmented<Metric> size="sm" label="เลือกตัวชี้วัด" value={metric} onChange={setMetric} options={[{ value: 'revenue', label: 'รายได้' }, { value: 'bookings', label: 'การจอง' }]} />
            <Segmented<Granularity> size="sm" label="เลือกช่วงเวลา" value={gran} onChange={setGran} options={[{ value: 'day', label: 'รายวัน' }, { value: 'week', label: 'รายสัปดาห์' }, { value: 'month', label: 'รายเดือน' }]} />
          </div>
        }
      />
      <div className="h-72 px-3 pb-4 pt-4">
        {series.length === 0 ? null : (
          <ResponsiveContainer width="100%" height="100%">
            {metric === 'revenue' ? (
              <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.sage} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={CHART.sage} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...axisProps} width={56} tickFormatter={(v) => fmtTHBCompact(v)} />
                <Tooltip content={<ChartTooltip title={title} format={(v) => fmtTHB(v)} extra={(p) => <p className="mt-1 text-ink-muted">เสร็จสิ้น {fmtNumber((p[0]?.payload?.completed as number) ?? 0)} ครั้ง</p>} />} />
                <Area type="monotone" dataKey="revenue" name="รายได้" stroke={CHART.sage} strokeWidth={2.5} fill="url(#rev)" activeDot={{ r: 5 }} />
              </AreaChart>
            ) : (
              <BarChart data={series} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...axisProps} width={40} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip title={title} format={(v) => `${fmtNumber(v)} คิว`} />} />
                <Bar dataKey="completed" name="เสร็จสิ้น" stackId="a" fill={CHART.sage} />
                <Bar dataKey="other" name="รอ/ยืนยัน/ไม่มา" stackId="a" fill={CHART.sand} />
                <Bar dataKey="cancelled" name="ยกเลิก" stackId="a" fill={CHART.clay} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      {metric === 'bookings' && <div className="px-5 pb-4"><ChartLegend items={[{ label: 'เสร็จสิ้น', color: CHART.sage }, { label: 'รอ/ยืนยัน/ไม่มา', color: CHART.sand }, { label: 'ยกเลิก', color: CHART.clay }]} /></div>}
    </Card>
  )
}
