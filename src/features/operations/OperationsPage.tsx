import { useMemo, useState } from 'react'
import { AlertTriangle, Check, ClipboardCopy, Clock, DoorOpen, Plus, UserCheck, UserX } from 'lucide-react'
import { ROOMS, STAFF } from '@/data/catalog'
import type { Appointment, OpTask, TaskGroup, TaskStatus } from '@/types'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { buildAlerts } from '@/lib/metrics'
import { getService } from '@/lib/conflicts'
import { DEMO_NOW, DEMO_TODAY, dayOfWeek, fmtDate, fmtDateLong, toMin } from '@/lib/date'
import { cn, fmtTHB, sum } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageIntro, StatCard } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Overlay'
import { Avatar, EmptyState, ProgressBar } from '@/components/ui/Misc'
import { Chip, StatusBadge } from '@/components/ui/Badge'
import { AppointmentDrawer } from '@/features/bookings/AppointmentDrawer'
import { AppointmentForm, type FormInit } from '@/features/bookings/AppointmentForm'
import { VacancyCard } from './VacancyCard'

const GROUP_LABEL: Record<TaskGroup, string> = { opening: 'เช็กลิสต์เปิดร้าน', general: 'งานระหว่างวัน', closing: 'เช็กลิสต์ปิดร้าน' }
const STATUS_TASK: Record<TaskStatus, string> = { todo: 'ยังไม่เริ่ม', in_progress: 'กำลังทำ', done: 'เสร็จแล้ว' }
const nowMin = toMin(DEMO_NOW)

const isOverdue = (t: OpTask) => t.status !== 'done' && (t.date < DEMO_TODAY || (t.date === DEMO_TODAY && toMin(t.dueTime) < nowMin))

export function OperationsPage() {
  const { data, customerStats, setAppointmentStatus, setTaskStatus } = useStore()
  const { toast } = useUi()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formInit, setFormInit] = useState<FormInit | null>(null)
  const [taskOpen, setTaskOpen] = useState(false)

  const today = useMemo(() => data.appointments.filter((a) => a.date === DEMO_TODAY), [data.appointments])
  const pending = today.filter((a) => a.status === 'pending').sort((a, b) => toMin(a.start) - toMin(b.start))
  const arrivals = today.filter((a) => (a.status === 'confirmed' || a.status === 'pending') && toMin(a.start) > nowMin).sort((a, b) => toMin(a.start) - toMin(b.start))
  const inService = today.filter((a) => a.status === 'confirmed' && toMin(a.start) <= nowMin && toMin(a.end) > nowMin)
  const todayTasks = data.tasks.filter((t) => t.date === DEMO_TODAY)
  const carried = data.tasks.filter((t) => t.date < DEMO_TODAY && t.status !== 'done')
  const overdue = data.tasks.filter(isOverdue)
  const done = todayTasks.filter((t) => t.status === 'done').length
  const alerts = useMemo(() => buildAlerts(data), [data])
  const nameOf = (id: string) => customerStats.get(id)?.customer.nickname ?? '-'

  const confirmAppt = (a: Appointment) => {
    const r = setAppointmentStatus(a.id, 'confirmed')
    toast(r.ok ? `ยืนยันคิวของ ${nameOf(a.customerId)} แล้ว` : r.error, r.ok ? 'success' : 'error')
  }
  const finishAppt = (a: Appointment) => {
    const r = setAppointmentStatus(a.id, 'completed')
    toast(r.ok ? `บันทึกว่า ${nameOf(a.customerId)} ใช้บริการเสร็จสิ้น (${fmtTHB(a.price)})` : r.error, r.ok ? 'success' : 'error')
  }

  /* ---- ภาพรวมพนักงานและเตียง ณ เวลาเดโม ---- */
  const staffNow = STAFF.map((s) => {
    const works = s.workDays.includes(dayOfWeek(DEMO_TODAY)) && toMin(s.shiftStart) <= nowMin && nowMin < toMin(s.shiftEnd)
    const mine = today.filter((a) => a.staffId === s.id && a.status !== 'cancelled' && a.status !== 'no_show').sort((a, b) => toMin(a.start) - toMin(b.start))
    const cur = mine.find((a) => toMin(a.start) <= nowMin && toMin(a.end) > nowMin)
    const next = mine.find((a) => toMin(a.start) > nowMin)
    const offToday = !s.workDays.includes(dayOfWeek(DEMO_TODAY))
    return { s, works, offToday, cur, next, count: mine.length }
  })
  const roomsNow = ROOMS.map((r) => {
    const mine = today.filter((a) => a.roomId === r.id && a.status !== 'cancelled' && a.status !== 'no_show').sort((a, b) => toMin(a.start) - toMin(b.start))
    return { r, cur: mine.find((a) => toMin(a.start) <= nowMin && toMin(a.end) > nowMin), next: mine.find((a) => toMin(a.start) > nowMin), count: mine.length }
  })

  /* ---- สรุปสิ้นวัน ---- */
  const cnt = (st: Appointment['status']) => today.filter((a) => a.status === st).length
  const revenueToday = sum(today.filter((a) => a.status === 'completed').map((a) => a.price))
  const remainingRev = sum(today.filter((a) => a.status === 'confirmed' || a.status === 'pending').map((a) => a.price))
  const closing = todayTasks.filter((t) => t.group === 'closing')
  const summaryText = [
    `สรุปประจำวัน ${fmtDateLong(DEMO_TODAY)} (ข้อมูลเดโม)`,
    `- คิวทั้งหมด ${today.length}: เสร็จสิ้น ${cnt('completed')} · ยืนยันแล้ว ${cnt('confirmed')} · รอยืนยัน ${cnt('pending')} · ยกเลิก ${cnt('cancelled')} · ไม่มา ${cnt('no_show')}`,
    `- รายได้ที่รับแล้ว ${fmtTHB(revenueToday)} · คาดว่าจะได้อีก ${fmtTHB(remainingRev)}`,
    `- งานวันนี้เสร็จ ${done}/${todayTasks.length} · เลยกำหนด ${overdue.length}`,
    `- เช็กลิสต์ปิดร้านเสร็จ ${closing.filter((t) => t.status === 'done').length}/${closing.length}`,
  ].join('\n')

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      toast('คัดลอกสรุปประจำวันแล้ว')
    } catch {
      toast('คัดลอกไม่สำเร็จ ลองเลือกข้อความด้านล่างแล้วคัดลอกเอง', 'error')
    }
  }

  const renderTask = (t: OpTask) => {
    const od = isOverdue(t)
    const asg = STAFF.find((s) => s.id === t.assigneeId)
    return (
      <li key={t.id} className={cn('flex flex-wrap items-center gap-3 py-2.5', t.status === 'done' && 'opacity-70')}>
        <button
          type="button"
          role="checkbox"
          aria-checked={t.status === 'done'}
          aria-label={`${t.title} ${t.status === 'done' ? 'เสร็จแล้ว คลิกเพื่อยกเลิก' : 'คลิกเพื่อทำเครื่องหมายว่าเสร็จ'}`}
          onClick={() => {
            setTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')
            if (t.status !== 'done') toast(`เสร็จสิ้น: ${t.title}`)
          }}
          className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors', t.status === 'done' ? 'border-sage-600 bg-sage-600 text-white' : 'border-sand-300 bg-white hover:border-sage-500')}
        >
          {t.status === 'done' && <Check size={15} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium', t.status === 'done' && 'line-through')}>{t.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
            <span className={cn('inline-flex items-center gap-1', od && 'font-medium text-clay-600')}><Clock size={12} />{t.date !== DEMO_TODAY ? `${fmtDate(t.date)} ` : ''}{t.dueTime} น.{od && ' · เลยกำหนด'}</span>
            {asg && <span>· {asg.nickname}</span>}
            {t.note && <span>· {t.note}</span>}
          </p>
        </div>
        <Select aria-label={`สถานะของ ${t.title}`} value={t.status} onChange={(e) => setTaskStatus(t.id, e.target.value as TaskStatus)} className="h-8 w-auto py-0 text-xs">
          {(Object.keys(STATUS_TASK) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_TASK[s]}</option>)}
        </Select>
      </li>
    )
  }

  return (
    <div>
      <PageIntro
        title="งานประจำวัน"
        description={`ศูนย์ปฏิบัติการของร้านวัน${fmtDateLong(DEMO_TODAY).slice(3)} เวลาเดโม ${DEMO_NOW} น. ยืนยันคิว ปิดงาน และติดตามเช็กลิสต์เปิด-ปิดร้านได้ที่นี่`}
        actions={<Button variant="primary" onClick={() => setTaskOpen(true)}><Plus size={16} /> เพิ่มงาน</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="งานวันนี้เสร็จแล้ว" value={`${done}/${todayTasks.length}`} sub={`เหลือ ${todayTasks.length - done} งาน`} icon={<Check size={18} />} />
        <StatCard label="คิวรอยืนยัน" value={`${pending.length}`} sub="วันนี้" icon={<UserCheck size={18} />} />
        <StatCard label="กำลังให้บริการ" value={`${inService.length}`} sub={`ลูกค้ากำลังจะมา ${arrivals.length}`} icon={<DoorOpen size={18} />} />
        <StatCard label="งานเลยกำหนด" value={`${overdue.length}`} sub={overdue.length ? 'ควรเร่งดำเนินการ' : 'ไม่มีงานค้าง'} invertTone icon={<AlertTriangle size={18} />} />
      </div>

      <div className="mt-4"><VacancyCard /></div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="คิวที่รอการยืนยัน" hint="โทรหรือส่งข้อความหาลูกค้า แล้วกดยืนยัน" />
            <CardBody className="pt-3">
              {pending.length === 0 ? (
                <EmptyState icon={<Check size={22} />} title="ไม่มีคิวรอยืนยันของวันนี้" description="ยอดเยี่ยม! ทุกคิววันนี้ได้รับการยืนยันแล้ว" />
              ) : (
                <ul className="divide-y divide-line">
                  {pending.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="w-14 text-sm font-semibold tabular-nums">{a.start}</div>
                      <button type="button" onClick={() => setSelectedId(a.id)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium hover:text-sage-700">{customerStats.get(a.customerId)?.customer.name}</span>
                        <span className="block truncate text-xs text-ink-muted">{customerStats.get(a.customerId)?.customer.phone} · {getService(a.serviceId)?.name}</span>
                      </button>
                      <Button size="sm" onClick={() => setSelectedId(a.id)}>รายละเอียด</Button>
                      <Button size="sm" variant="primary" onClick={() => confirmAppt(a)}>ยืนยัน</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="ลูกค้าที่กำลังให้บริการและกำลังจะมา" hint="เรียงตามเวลาถึงคิว" />
            <CardBody className="pt-3">
              {inService.length + arrivals.length === 0 ? (
                <EmptyState title="ไม่มีคิวที่เหลือในวันนี้" description="สามารถรับลูกค้า walk-in ได้ โดยสร้างการจองใหม่" action={<Button onClick={() => setFormInit({ mode: 'create', prefill: { date: DEMO_TODAY } })}>สร้างการจอง</Button>} />
              ) : (
                <ul className="divide-y divide-line">
                  {inService.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Chip className="bg-sage-50 text-sage-700 ring-sage-200">กำลังให้บริการ</Chip>
                      <button type="button" onClick={() => setSelectedId(a.id)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium hover:text-sage-700">{nameOf(a.customerId)} · {getService(a.serviceId)?.name}</span>
                        <span className="block text-xs text-ink-muted">{STAFF.find((s) => s.id === a.staffId)?.nickname} · {ROOMS.find((r) => r.id === a.roomId)?.name} · เสร็จประมาณ {a.end} น.</span>
                      </button>
                      <Button size="sm" variant="primary" onClick={() => finishAppt(a)}>เสร็จสิ้น</Button>
                    </li>
                  ))}
                  {arrivals.map((a) => {
                    const mins = toMin(a.start) - nowMin
                    return (
                      <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                        <div className="w-24 shrink-0">
                          <p className="text-sm font-semibold tabular-nums">{a.start} น.</p>
                          <p className={cn('text-xs', mins <= 60 ? 'font-medium text-amber2-700' : 'text-ink-muted')}>อีก {mins >= 60 ? `${Math.floor(mins / 60)} ชม. ${mins % 60} นาที` : `${mins} นาที`}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedId(a.id)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-medium hover:text-sage-700">{nameOf(a.customerId)} · {getService(a.serviceId)?.name}</span>
                          <span className="block text-xs text-ink-muted">{STAFF.find((s) => s.id === a.staffId)?.nickname} · {ROOMS.find((r) => r.id === a.roomId)?.name}</span>
                        </button>
                        <StatusBadge status={a.status} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="งานและเช็กลิสต์ของวันนี้" hint={`เสร็จแล้ว ${done} จาก ${todayTasks.length} งาน`} />
            <div className="px-5 pt-3"><ProgressBar ratio={todayTasks.length ? done / todayTasks.length : 0} label="ความคืบหน้างานวันนี้" /></div>
            <CardBody>
              {carried.length > 0 && (
                <section className="mb-4 rounded-xl border border-clay-100 bg-clay-50/50 px-4 py-2">
                  <h3 className="flex items-center gap-1.5 pt-2 text-sm font-semibold text-clay-700"><AlertTriangle size={15} /> งานค้างจากวันก่อน ({carried.length})</h3>
                  <ul className="divide-y divide-clay-100">{carried.map(renderTask)}</ul>
                </section>
              )}
              {(['opening', 'general', 'closing'] as TaskGroup[]).map((g) => {
                const list = todayTasks.filter((t) => t.group === g).sort((a, b) => a.dueTime.localeCompare(b.dueTime))
                if (!list.length) return null
                return (
                  <section key={g} className="mb-2">
                    <h3 className="flex items-center justify-between text-sm font-semibold text-ink-soft">
                      {GROUP_LABEL[g]}
                      <span className="text-xs font-normal text-ink-muted">{list.filter((t) => t.status === 'done').length}/{list.length}</span>
                    </h3>
                    <ul className="divide-y divide-line">{list.map(renderTask)}</ul>
                  </section>
                )
              })}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="พนักงาน ณ ตอนนี้" hint={`เวลาเดโม ${DEMO_NOW} น.`} />
            <CardBody className="pt-3">
              <ul className="divide-y divide-line">
                {staffNow.map(({ s, works, offToday, cur, next, count }) => (
                  <li key={s.id} className="flex items-start gap-3 py-2.5">
                    <Avatar name={s.nickname} color={s.color} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">{s.nickname}
                        {cur ? <Chip className="bg-sage-50 text-sage-700 ring-sage-200">กำลังให้บริการ</Chip> : works ? <Chip className="bg-sky2-50 text-sky2-700 ring-sky2-100">ว่าง</Chip> : <Chip className="bg-sand-100 text-ink-muted ring-sand-200">{offToday ? 'หยุดวันนี้' : 'นอกกะ'}</Chip>}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {cur ? `${nameOf(cur.customerId)} ถึง ${cur.end} น.` : next ? `คิวถัดไป ${next.start} น. (${nameOf(next.customerId)})` : count ? 'ไม่มีคิวถัดไป' : 'ไม่มีคิววันนี้'} · กะ {s.shiftStart}–{s.shiftEnd}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="เตียง ณ ตอนนี้" />
            <CardBody className="pt-3">
              <ul className="divide-y divide-line">
                {roomsNow.map(({ r, cur, next }) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{r.name}</p>
                      <p className="truncate text-xs text-ink-muted">{cur ? `ใช้งานถึง ${cur.end} น. (${nameOf(cur.customerId)})` : next ? `คิวถัดไป ${next.start} น.` : 'ว่างตลอดวัน'}</p>
                    </div>
                    {cur ? <Chip className="bg-clay-50 text-clay-600 ring-clay-100">ไม่ว่าง</Chip> : <Chip className="bg-sage-50 text-sage-700 ring-sage-200">ว่าง</Chip>}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="แจ้งเตือน" />
            <CardBody className="pt-3">
              {alerts.length === 0 ? <p className="text-sm text-ink-muted">ไม่มีการแจ้งเตือน</p> : (
                <ul className="space-y-2">
                  {alerts.map((a) => (
                    <li key={a.id} className="flex gap-2.5 text-sm">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.level === 'high' ? 'bg-clay-500' : a.level === 'medium' ? 'bg-amber2-500' : 'bg-sky2-500')} />
                      <span><span className="font-medium">{a.title}</span><span className="block text-xs text-ink-muted">{a.detail}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="สรุปประจำวัน" hint="อัปเดตตามสถานะคิวและงานแบบเรียลไทม์" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-sage-50 p-3"><dt className="text-xs text-sage-700">รายได้ที่รับแล้ว</dt><dd className="text-lg font-semibold tabular-nums">{fmtTHB(revenueToday)}</dd></div>
                <div className="rounded-lg bg-sand-50 p-3"><dt className="text-xs text-ink-muted">คาดว่าจะได้อีก</dt><dd className="text-lg font-semibold tabular-nums">{fmtTHB(remainingRev)}</dd></div>
                <div className="rounded-lg bg-sand-50 p-3"><dt className="text-xs text-ink-muted">เสร็จสิ้น / ทั้งหมด</dt><dd className="text-lg font-semibold tabular-nums">{cnt('completed')}/{today.length}</dd></div>
                <div className="rounded-lg bg-sand-50 p-3"><dt className="text-xs text-ink-muted">ยกเลิก / ไม่มา</dt><dd className="text-lg font-semibold tabular-nums">{cnt('cancelled')} / {cnt('no_show')}</dd></div>
              </dl>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-sand-50 p-3 font-sans text-xs leading-relaxed text-ink-soft">{summaryText}</pre>
              <Button className="mt-3 w-full" onClick={copySummary}><ClipboardCopy size={16} /> คัดลอกสรุป</Button>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted"><UserX size={13} /> ปิดร้านได้เมื่อเช็กลิสต์ปิดร้านครบ ({closing.filter((t) => t.status === 'done').length}/{closing.length})</p>
            </CardBody>
          </Card>
        </div>
      </div>

      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} />
      <AppointmentDrawer appointmentId={selectedId} onClose={() => setSelectedId(null)} onEdit={(a) => setFormInit({ mode: 'edit', appointment: a })} onReschedule={(a) => setFormInit({ mode: 'reschedule', appointment: a })} />
      <AppointmentForm init={formInit} onClose={() => setFormInit(null)} />
    </div>
  )
}

function TaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addTask } = useStore()
  const { toast } = useUi()
  const [title, setTitle] = useState('')
  const [group, setGroup] = useState<TaskGroup>('general')
  const [dueTime, setDueTime] = useState('17:00')
  const [assignee, setAssignee] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const error = title.trim().length < 3 ? 'กรุณาระบุชื่องานอย่างน้อย 3 ตัวอักษร' : ''
  const timeError = !dueTime ? 'กรุณาระบุเวลา' : ''

  const save = () => {
    setSubmitted(true)
    if (error || timeError) return
    addTask({ title: title.trim(), group, date: DEMO_TODAY, dueTime, assigneeId: assignee || undefined })
    toast('เพิ่มงานเรียบร้อยแล้ว')
    setTitle('')
    setSubmitted(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="เพิ่มงานวันนี้" size="sm" footer={<><Button onClick={onClose}>ยกเลิก</Button><Button variant="primary" onClick={save}>เพิ่มงาน</Button></>}>
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="ชื่องาน" required error={submitted ? error : ''}>{(id, d) => <Input id={id} aria-describedby={d} data-autofocus invalid={Boolean(submitted && error)} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น เตรียมน้ำสมุนไพรต้อนรับ" />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ประเภท">{(id) => <Select id={id} value={group} onChange={(e) => setGroup(e.target.value as TaskGroup)}>{(Object.keys(GROUP_LABEL) as TaskGroup[]).map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}</Select>}</Field>
          <Field label="กำหนดเสร็จ" required error={submitted ? timeError : ''}>{(id, d) => <Input id={id} aria-describedby={d} type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />}</Field>
        </div>
        <Field label="ผู้รับผิดชอบ">{(id) => <Select id={id} value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">ยังไม่มอบหมาย</option>{STAFF.map((s) => <option key={s.id} value={s.id}>{s.nickname}</option>)}</Select>}</Field>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
