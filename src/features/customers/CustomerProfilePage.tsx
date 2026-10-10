import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, Pencil, Phone, MessageCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AGE_GROUPS, ROOMS, SOURCE_LABEL, STAFF } from '@/data/catalog'
import { useStore } from '@/state/store'
import { getService } from '@/lib/conflicts'
import { DEMO_TODAY, diffDays, fmtDate, fmtDateLong, fmtMonthShort, monthKey } from '@/lib/date'
import { fmtDecimal, fmtTHB, groupBy, sum } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card'
import { SegmentBadge, StatusBadge } from '@/components/ui/Badge'
import { Avatar, EmptyState } from '@/components/ui/Misc'
import { ChartTooltip, CHART, axisProps } from '@/components/ui/charts'
import { AppointmentDrawer } from '@/features/bookings/AppointmentDrawer'
import { AppointmentForm, type FormInit } from '@/features/bookings/AppointmentForm'
import { CustomerFormModal } from './CustomerFormModal'
import { SEGMENT_HINT } from '@/lib/metrics'

export function CustomerProfilePage() {
  const { id } = useParams()
  const { customerStats } = useStore()
  const stats = id ? customerStats.get(id) : undefined
  const [editOpen, setEditOpen] = useState(false)
  const [formInit, setFormInit] = useState<FormInit | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const spendByMonth = useMemo(() => {
    if (!stats) return []
    const done = stats.history.filter((a) => a.status === 'completed')
    const g = groupBy(done, (a) => monthKey(a.date))
    return Object.keys(g).sort().map((m) => ({ month: m, label: fmtMonthShort(m), spent: sum(g[m].map((a) => a.price)), visits: g[m].length }))
  }, [stats])

  if (!stats) {
    return (
      <div>
        <Link to="/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-sage-700 hover:underline"><ArrowLeft size={15} /> กลับไปรายชื่อลูกค้า</Link>
        <Card><EmptyState title="ไม่พบข้อมูลลูกค้า" description="ลูกค้ารายนี้อาจไม่มีอยู่ในข้อมูลเดโม" /></Card>
      </div>
    )
  }

  const c = stats.customer
  const avgPerVisit = stats.visits ? stats.totalSpent / stats.visits : 0
  const favs = stats.favoriteServiceIds.map((sid) => ({ svc: getService(sid), count: stats.history.filter((a) => a.status === 'completed' && a.serviceId === sid).length }))
  const maxFav = Math.max(1, ...favs.map((f) => f.count))
  const staffCount: Record<string, number> = {}
  stats.history.filter((a) => a.status === 'completed').forEach((a) => (staffCount[a.staffId] = (staffCount[a.staffId] ?? 0) + 1))
  const favStaffId = Object.entries(staffCount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const favStaff = STAFF.find((s) => s.id === favStaffId)

  return (
    <div>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-sage-700 hover:underline"><ArrowLeft size={15} /> กลับไปรายชื่อลูกค้า</Link>

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-start gap-4">
          <Avatar name={c.nickname} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{c.name}</h1>
              <SegmentBadge segment={stats.segment} />
            </div>
            <p className="text-sm text-ink-muted">ชื่อเล่น {c.nickname} · รหัส {c.id} · {SEGMENT_HINT[stats.segment]}</p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5"><Phone size={14} className="text-sage-500" /><dt className="sr-only">เบอร์โทร</dt><dd>{c.phone}</dd></div>
              {c.lineId && <div className="flex items-center gap-1.5"><MessageCircle size={14} className="text-sage-500" /><dt className="sr-only">LINE ID</dt><dd>{c.lineId}</dd></div>}
              <div><dt className="inline text-ink-muted">รู้จักร้านจาก: </dt><dd className="inline font-medium">{SOURCE_LABEL[c.source]}</dd></div>
              <div><dt className="inline text-ink-muted">ช่วงอายุ: </dt><dd className="inline font-medium">{c.ageGroup && AGE_GROUPS.includes(c.ageGroup) ? `${c.ageGroup} ปี` : 'ไม่ระบุ'}</dd></div>
              <div><dt className="inline text-ink-muted">เพิ่มเข้าระบบ: </dt><dd className="inline font-medium">{fmtDate(c.createdAt)}</dd></div>
            </dl>
            {c.note && <p className="mt-2 text-sm text-ink-soft">บันทึก: {c.note}</p>}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setEditOpen(true)}><Pencil size={15} /> แก้ไขข้อมูล</Button>
            <Button variant="primary" onClick={() => setFormInit({ mode: 'create', prefill: { customerId: c.id, date: DEMO_TODAY } })}><CalendarPlus size={15} /> จองคิวให้ลูกค้า</Button>
          </div>
        </CardBody>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="ใช้บริการสำเร็จ" value={`${stats.visits} ครั้ง`} sub={stats.cancelled || stats.noShow ? `ยกเลิก ${stats.cancelled} · ไม่มา ${stats.noShow}` : undefined} />
        <StatCard label="ยอดใช้จ่ายรวม" value={fmtTHB(stats.totalSpent)} sub={stats.visits ? `เฉลี่ย ${fmtTHB(avgPerVisit)}/ครั้ง` : undefined} />
        <StatCard label="ความถี่ในการมา" value={stats.avgGapDays ? `ทุก ${fmtDecimal(stats.avgGapDays)} วัน` : '—'} sub={stats.avgGapDays ? undefined : 'ต้องมีอย่างน้อย 2 ครั้ง'} />
        <StatCard label="มาครั้งแรก" value={stats.firstVisit ? fmtDate(stats.firstVisit) : '—'} />
        <StatCard label="มาล่าสุด" value={stats.lastVisit ? fmtDate(stats.lastVisit) : '—'} sub={stats.lastVisit ? `${diffDays(DEMO_TODAY, stats.lastVisit)} วันที่แล้ว` : undefined} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="บริการที่ชอบ" hint="นับจากการใช้บริการสำเร็จ" />
          <CardBody>
            {favs.length === 0 ? (
              <p className="text-sm text-ink-muted">ยังไม่มีข้อมูลบริการ</p>
            ) : (
              <ul className="space-y-3">
                {favs.map((f) => (
                  <li key={f.svc?.id}>
                    <div className="flex justify-between text-sm"><span>{f.svc?.name}</span><span className="text-ink-muted">{f.count} ครั้ง</span></div>
                    <div className="mt-1 h-2 rounded-full bg-sand-100"><div className="h-full rounded-full bg-sage-500" style={{ width: `${(f.count / maxFav) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
            {favStaff && <p className="mt-4 text-sm text-ink-muted">พนักงานที่ใช้บริการบ่อย: <span className="font-medium text-ink">{favStaff.nickname}</span></p>}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="ยอดใช้จ่ายรายเดือน" hint="เฉพาะรายการที่ให้บริการเสร็จสิ้น" />
          <CardBody>
            {spendByMonth.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">ยังไม่มียอดใช้จ่ายที่เสร็จสิ้น</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendByMonth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART.grid} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={(v) => `฿${v}`} width={52} />
                    <Tooltip cursor={{ fill: '#F7F3EA' }} content={<ChartTooltip format={(v) => fmtTHB(v)} />} />
                    <Bar dataKey="spent" name="ยอดใช้จ่าย" fill={CHART.sage} radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {stats.upcoming.length > 0 && (
        <Card className="mb-4">
          <CardHeader title="นัดหมายที่กำลังจะมาถึง" />
          <CardBody>
            <ul className="divide-y divide-line">
              {stats.upcoming.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => setSelectedId(a.id)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:text-sage-700">
                    <span><span className="font-medium">{fmtDateLong(a.date)}</span> · {a.start} น. · {getService(a.serviceId)?.name}</span>
                    <StatusBadge status={a.status} />
                  </button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="ประวัติการจองทั้งหมด" hint={`${stats.history.length} รายการ · คลิกแถวเพื่อดูรายละเอียดหรือจัดการ`} />
        <CardBody className="pt-3">
          {stats.history.length === 0 ? (
            <EmptyState title="ยังไม่มีประวัติการจอง" description="กดปุ่ม 'จองคิวให้ลูกค้า' เพื่อสร้างการจองแรก" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-line text-left text-xs text-ink-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-medium">วันที่</th>
                    <th scope="col" className="py-2 pr-3 font-medium">บริการ</th>
                    <th scope="col" className="py-2 pr-3 font-medium">พนักงาน / เตียง</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">ราคา</th>
                    <th scope="col" className="py-2 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stats.history.map((a) => (
                    <tr key={a.id} className="cursor-pointer hover:bg-sand-50/70" onClick={() => setSelectedId(a.id)}>
                      <td className="py-2.5 pr-3">
                        <button className="text-left font-medium hover:text-sage-700" onClick={(e) => { e.stopPropagation(); setSelectedId(a.id) }}>{fmtDate(a.date)}</button>
                        <div className="text-xs text-ink-muted">{a.start}–{a.end} น.</div>
                      </td>
                      <td className="py-2.5 pr-3">{getService(a.serviceId)?.name}</td>
                      <td className="py-2.5 pr-3">{STAFF.find((s) => s.id === a.staffId)?.nickname}<div className="text-xs text-ink-muted">{ROOMS.find((r) => r.id === a.roomId)?.name}</div></td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{fmtTHB(a.price)}</td>
                      <td className="py-2.5"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} customer={c} />
      <AppointmentDrawer appointmentId={selectedId} onClose={() => setSelectedId(null)} onEdit={(a) => setFormInit({ mode: 'edit', appointment: a })} onReschedule={(a) => setFormInit({ mode: 'reschedule', appointment: a })} />
      <AppointmentForm init={formInit} onClose={() => setFormInit(null)} />
    </div>
  )
}
