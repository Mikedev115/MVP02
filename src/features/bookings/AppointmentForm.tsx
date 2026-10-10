import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, UserPlus, Wand2 } from 'lucide-react'
import { CATEGORY_LABEL, SERVICES } from '@/data/catalog'
import type { Appointment, AppointmentStatus, ServiceCategory } from '@/types'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { autoAssign, availableStarts, endTimeFor, findConflicts, getService, roomOptions, staffOptions } from '@/lib/conflicts'
import { DEMO_NOW, DEMO_TODAY, SHOP_CLOSE, fmtDateLong, timeSlots, toMin } from '@/lib/date'
import { fmtTHB } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Overlay'
import { CustomerFormModal } from '@/features/customers/CustomerFormModal'

export type FormMode = 'create' | 'edit' | 'reschedule'

export interface FormInit {
  mode: FormMode
  appointment?: Appointment
  prefill?: Partial<Pick<Appointment, 'customerId' | 'serviceId' | 'staffId' | 'roomId' | 'date' | 'start' | 'status'>>
}

interface Props {
  init: FormInit | null
  onClose: () => void
  onSaved?: (a: Appointment) => void
}

const AUTO = 'auto'

export function AppointmentForm({ init, onClose, onSaved }: Props) {
  if (!init) return null
  return <FormInner key={init.appointment?.id ?? 'new'} init={init} onClose={onClose} onSaved={onSaved} />
}

function FormInner({ init, onClose, onSaved }: Props & { init: FormInit }) {
  const { data, createAppointment, updateAppointment } = useStore()
  const { toast } = useUi()
  const { mode, appointment: existing, prefill } = init

  const [customerId, setCustomerId] = useState(existing?.customerId ?? prefill?.customerId ?? '')
  const [customerQuery, setCustomerQuery] = useState('')
  const [serviceId, setServiceId] = useState(existing?.serviceId ?? prefill?.serviceId ?? '')
  const [date, setDate] = useState(existing?.date ?? prefill?.date ?? DEMO_TODAY)
  const [start, setStart] = useState(existing?.start ?? prefill?.start ?? '')
  const [staffId, setStaffId] = useState(existing?.staffId ?? prefill?.staffId ?? AUTO)
  const [roomId, setRoomId] = useState(existing?.roomId ?? prefill?.roomId ?? AUTO)
  const [status, setStatus] = useState<AppointmentStatus>(existing?.status === 'confirmed' ? 'confirmed' : existing ? 'pending' : prefill?.status === 'pending' ? 'pending' : 'confirmed')
  const [note, setNote] = useState(existing?.note ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)

  const readOnlyCore = mode === 'reschedule'
  const svc = getService(serviceId)
  const end = serviceId && start ? endTimeFor(serviceId, start) : ''

  // ทุกครั้งที่เปลี่ยนบริการ/วัน ให้ตรวจเวลาเริ่มว่ายังใช้ได้หรือไม่
  const starts = useMemo(() => {
    if (!serviceId || !date) return new Set<string>()
    return new Set(availableStarts(data.appointments, { id: existing?.id, customerId: customerId || '__none__', serviceId, date }))
  }, [data.appointments, existing?.id, customerId, serviceId, date])

  const slotOptions = useMemo(
    () => timeSlots().filter((t) => toMin(endTimeFor(serviceId || 'sv-wash60', t)) <= toMin(SHOP_CLOSE)),
    [serviceId],
  )
  const isPastSlot = (t: string) => date === DEMO_TODAY && toMin(t) < toMin(DEMO_NOW) && !(existing && existing.date === date && existing.start === t)

  const sortedCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    return data.customers
      .filter((c) => !q || `${c.name} ${c.nickname} ${c.phone}`.toLowerCase().includes(q) || c.id === customerId)
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [data.customers, customerQuery, customerId])

  // เมื่อบริการเปลี่ยน พนักงาน/เตียงที่ไม่เหมาะสมจะถูกรีเซ็ตเป็นอัตโนมัติ
  useEffect(() => {
    if (!svc) return
    const s = staffOptions(data.appointments, { id: existing?.id, customerId, serviceId, date, start: start || '10:00', end: end || '11:00', status: 'confirmed' })
    if (staffId !== AUTO && !s.some((o) => o.staff.id === staffId)) setStaffId(AUTO)
    const r = roomOptions(data.appointments, { id: existing?.id, customerId, serviceId, date, start: start || '10:00', end: end || '11:00', status: 'confirmed' })
    if (roomId !== AUTO && !r.some((o) => o.room.id === roomId)) setRoomId(AUTO)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  const draftBase = { id: existing?.id, customerId, serviceId, date, start, end, status: status === 'pending' || status === 'confirmed' ? status : 'confirmed' as AppointmentStatus }
  const canResolve = Boolean(customerId && serviceId && date && start)

  const resolved = useMemo(() => {
    if (!canResolve) return null
    const auto = autoAssign(data.appointments, draftBase, staffId !== AUTO ? staffId : undefined)
    const sId = staffId !== AUTO ? staffId : auto?.staffId ?? ''
    const rId = roomId !== AUTO ? roomId : auto?.roomId ?? ''
    return { staffId: sId, roomId: rId }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canResolve, data.appointments, customerId, serviceId, date, start, staffId, roomId, status])

  const issues = useMemo(() => {
    if (!canResolve || !resolved) return []
    if (!resolved.staffId) return [{ kind: 'staff' as const, message: 'ไม่มีพนักงานว่างในช่วงเวลานี้' }]
    if (!resolved.roomId) return [{ kind: 'room' as const, message: 'ไม่มีเตียงว่างในช่วงเวลานี้' }]
    return findConflicts(data.appointments, { ...draftBase, staffId: resolved.staffId, roomId: resolved.roomId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canResolve, resolved, data.appointments])

  const staffChoices = svc ? staffOptions(data.appointments, { id: existing?.id, customerId, serviceId, date, start: start || '10:00', end: end || '11:00', status: 'confirmed' }) : []
  const roomChoices = svc ? roomOptions(data.appointments, { id: existing?.id, customerId, serviceId, date, start: start || '10:00', end: end || '11:00', status: 'confirmed' }) : []

  const suggestions = useMemo(() => {
    if (!issues.length || !serviceId || !date) return []
    const free = [...starts].filter((t) => !isPastSlot(t))
    free.sort((a, b) => Math.abs(toMin(a) - toMin(start || '12:00')) - Math.abs(toMin(b) - toMin(start || '12:00')))
    return free.slice(0, 4).sort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues.length, starts, start])

  const errors = {
    customer: !customerId ? 'กรุณาเลือกลูกค้า' : '',
    service: !serviceId ? 'กรุณาเลือกบริการ' : '',
    date: !date ? 'กรุณาเลือกวันที่' : date < DEMO_TODAY && !existing ? 'ไม่สามารถจองย้อนหลังได้' : date < DEMO_TODAY && mode === 'reschedule' ? 'ไม่สามารถเลื่อนไปวันที่ผ่านมาแล้ว' : '',
    start: !start ? 'กรุณาเลือกเวลาเริ่ม' : isPastSlot(start) && mode !== 'edit' ? 'เวลานี้ผ่านไปแล้ว' : '',
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const submit = () => {
    setSubmitted(true)
    if (hasErrors || !resolved || issues.length) return
    const payload = {
      customerId,
      serviceId,
      date,
      start,
      end: endTimeFor(serviceId, start),
      staffId: resolved.staffId,
      roomId: resolved.roomId,
      status: existing && existing.status !== 'pending' && existing.status !== 'confirmed' ? existing.status : status,
      note: note.trim() || undefined,
    }
    if (existing) {
      const res = updateAppointment(existing.id, payload)
      if (!res.ok) return toast(res.error, 'error')
      toast(mode === 'reschedule' ? 'เลื่อนนัดเรียบร้อยแล้ว' : 'บันทึกการแก้ไขแล้ว')
      onSaved?.({ ...existing, ...payload })
    } else {
      const res = createAppointment(payload)
      if (!res.ok) return toast(res.error, 'error')
      toast(`สร้างการจอง ${res.value.id} เรียบร้อยแล้ว`)
      onSaved?.(res.value)
    }
    onClose()
  }

  const showErr = (k: keyof typeof errors) => (submitted ? errors[k] : '')
  const grouped = (Object.keys(CATEGORY_LABEL) as ServiceCategory[]).map((cat) => ({ cat, items: SERVICES.filter((s) => s.category === cat) }))
  const title = mode === 'create' ? 'สร้างการจองใหม่' : mode === 'reschedule' ? 'เลื่อนนัด' : `แก้ไขการจอง ${existing?.id}`

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={title}
        description={mode === 'reschedule' ? 'เปลี่ยนวัน เวลา พนักงาน หรือเตียง ระบบจะตรวจสอบคิวซ้อนให้อัตโนมัติ' : 'ระบบจะตรวจสอบพนักงานและเตียงว่างให้ทันทีที่คุณเลือกเวลา'}
        size="lg"
        footer={
          <>
            <Button onClick={onClose}>ยกเลิก</Button>
            <Button variant="primary" onClick={submit} disabled={submitted && (hasErrors || issues.length > 0)}>
              {mode === 'create' ? 'สร้างการจอง' : mode === 'reschedule' ? 'ยืนยันการเลื่อนนัด' : 'บันทึกการแก้ไข'}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          noValidate
        >
          <div className="sm:col-span-2">
            <Field label="ลูกค้า" required error={showErr('customer')}>
              {(id, d) => (
                <div className="space-y-2">
                  {!readOnlyCore && (
                    <Input type="search" placeholder="พิมพ์ชื่อ ชื่อเล่น หรือเบอร์โทรเพื่อค้นหา" aria-label="ค้นหาลูกค้า" value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} />
                  )}
                  <div className="flex gap-2">
                    <Select id={id} aria-describedby={d} invalid={Boolean(showErr('customer'))} value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={readOnlyCore}>
                      <option value="">— เลือกลูกค้า ({sortedCustomers.length} ราย) —</option>
                      {[...sortedCustomers.filter((c) => c.id === customerId), ...sortedCustomers.filter((c) => c.id !== customerId).slice(0, 80)].map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.nickname}) · {c.phone}
                        </option>
                      ))}
                    </Select>
                    {!readOnlyCore && (
                      <Button onClick={() => setAddCustomerOpen(true)} className="shrink-0" aria-label="เพิ่มลูกค้าใหม่">
                        <UserPlus size={16} /> <span className="hidden sm:inline">ลูกค้าใหม่</span>
                      </Button>
                    )}
                  </div>
                  {sortedCustomers.length > 80 && <p className="text-xs text-ink-muted">แสดง 80 รายแรก พิมพ์ค้นหาเพื่อจำกัดรายชื่อ</p>}
                </div>
              )}
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="บริการ" required error={showErr('service')}>
              {(id, d) => (
                <Select id={id} aria-describedby={d} invalid={Boolean(showErr('service'))} value={serviceId} onChange={(e) => { setServiceId(e.target.value); setStart('') }} disabled={readOnlyCore}>
                  <option value="">— เลือกบริการ —</option>
                  {grouped.map((g) => (
                    <optgroup key={g.cat} label={CATEGORY_LABEL[g.cat]}>
                      {g.items.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {fmtTHB(s.price)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field label="วันที่" required error={showErr('date')} hint={date ? fmtDateLong(date) : undefined}>
            {(id, d) => (
              <Input id={id} aria-describedby={d} type="date" invalid={Boolean(showErr('date'))} value={date} min={existing ? undefined : DEMO_TODAY} onChange={(e) => { setDate(e.target.value); setStart('') }} />
            )}
          </Field>

          <Field label="เวลาเริ่ม" required error={showErr('start')} hint={end ? `สิ้นสุดประมาณ ${end} น. (${svc?.durationMin} นาที)` : serviceId ? undefined : 'เลือกบริการก่อนเพื่อดูเวลาที่ว่าง'}>
            {(id, d) => (
              <Select id={id} aria-describedby={d} invalid={Boolean(showErr('start'))} value={start} onChange={(e) => setStart(e.target.value)} disabled={!serviceId}>
                <option value="">— เลือกเวลา —</option>
                {slotOptions.map((t) => {
                  const free = starts.has(t) && !isPastSlot(t)
                  return (
                    <option key={t} value={t} disabled={!free && t !== existing?.start}>
                      {t} น.{free ? '' : isPastSlot(t) ? ' (ผ่านไปแล้ว)' : ' (เต็ม)'}
                    </option>
                  )
                })}
              </Select>
            )}
          </Field>

          <Field label="พนักงาน" hint="เลือก 'อัตโนมัติ' เพื่อให้ระบบจัดพนักงานที่ว่าง">
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={staffId} onChange={(e) => setStaffId(e.target.value)} disabled={!serviceId}>
                <option value={AUTO}>อัตโนมัติ (เลือกคนที่ว่าง)</option>
                {staffChoices.map((o) => (
                  <option key={o.staff.id} value={o.staff.id}>
                    {o.staff.nickname} · {o.staff.role}
                    {start && !o.free ? ' (ไม่ว่าง)' : ''}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="เตียง" hint="เตียงจะถูกกรองตามประเภทบริการ">
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!serviceId}>
                <option value={AUTO}>อัตโนมัติ (เลือกเตียงที่ว่าง)</option>
                {roomChoices.map((o) => (
                  <option key={o.room.id} value={o.room.id}>
                    {o.room.name}
                    {start && !o.free ? ' (ไม่ว่าง)' : ''}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {mode !== 'reschedule' && (!existing || existing.status === 'pending' || existing.status === 'confirmed') && (
            <Field label="สถานะ">
              {(id) => (
                <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
                  <option value="pending">รอยืนยัน</option>
                  <option value="confirmed">ยืนยันแล้ว</option>
                </Select>
              )}
            </Field>
          )}

          <div className={mode !== 'reschedule' ? '' : 'sm:col-span-2'}>
            <Field label="บันทึกเพิ่มเติม" hint="เช่น แพ้กลิ่นบางชนิด ไม่ควรใส่ข้อมูลสุขภาพที่ละเอียดอ่อน">
              {(id, d) => <Textarea id={id} aria-describedby={d} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />}
            </Field>
          </div>

          <div className="sm:col-span-2" aria-live="polite">
            {canResolve && issues.length === 0 && resolved && (
              <div className="flex items-start gap-2 rounded-lg border border-sage-200 bg-sage-50 p-3 text-sm text-sage-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">ช่วงเวลานี้ว่าง ไม่มีคิวซ้อน</p>
                  <p className="text-xs">
                    {data.customers.find((c) => c.id === customerId)?.nickname} · {STAFF_NAME(resolved.staffId)} · {ROOM_NAME(resolved.roomId)} · {start}–{end} น.
                  </p>
                </div>
              </div>
            )}
            {issues.length > 0 && (
              <div role="alert" className="rounded-lg border border-clay-100 bg-clay-50 p-3 text-sm text-clay-700">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle size={16} /> พบคิวซ้อนหรือข้อจำกัด จึงยังบันทึกไม่ได้
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-6 text-xs">
                  {issues.map((i, k) => (
                    <li key={k}>{i.message}</li>
                  ))}
                </ul>
                {suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs"><Wand2 size={13} /> เวลาที่ว่างใกล้เคียง:</span>
                    {suggestions.map((t) => (
                      <button key={t} type="button" onClick={() => setStart(t)} className="rounded-full border border-clay-100 bg-white px-2.5 py-1 text-xs font-medium hover:bg-clay-50">
                        {t} น.
                      </button>
                    ))}
                    {staffId !== AUTO && (
                      <button type="button" onClick={() => setStaffId(AUTO)} className="rounded-full border border-clay-100 bg-white px-2.5 py-1 text-xs font-medium hover:bg-clay-50">
                        เลือกพนักงานให้อัตโนมัติ
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>
      <CustomerFormModal
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSaved={(c) => {
          setCustomerId(c.id)
          setCustomerQuery('')
        }}
      />
    </>
  )
}

import { ROOMS, STAFF } from '@/data/catalog'
const STAFF_NAME = (id: string) => STAFF.find((s) => s.id === id)?.nickname ?? '-'
const ROOM_NAME = (id: string) => ROOMS.find((r) => r.id === id)?.name ?? '-'
