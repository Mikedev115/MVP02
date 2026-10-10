import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CalendarClock, Check, CheckCheck, ExternalLink, Pencil, RotateCcw, UserX } from 'lucide-react'
import { ROOMS, SOURCE_LABEL, STAFF } from '@/data/catalog'
import type { Appointment } from '@/types'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { getService } from '@/lib/conflicts'
import { DEMO_TODAY, fmtDate, fmtDateLong } from '@/lib/date'
import { fmtTHB } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Drawer, Modal } from '@/components/ui/Overlay'
import { Select } from '@/components/ui/Form'
import { SegmentBadge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Misc'

const CANCEL_REASONS = ['ลูกค้าติดธุระกะทันหัน', 'ลูกค้าเปลี่ยนแผน', 'ลูกค้าไม่สบาย', 'ขอเลื่อนไปวันอื่น', 'ร้านไม่สามารถให้บริการได้']

interface Props {
  appointmentId: string | null
  onClose: () => void
  onEdit: (a: Appointment) => void
  onReschedule: (a: Appointment) => void
}

export function AppointmentDrawer({ appointmentId, onClose, onEdit, onReschedule }: Props) {
  const { data, customerStats, setAppointmentStatus } = useStore()
  const { toast } = useUi()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState(CANCEL_REASONS[0])

  const appt = data.appointments.find((a) => a.id === appointmentId)
  const stats = appt ? customerStats.get(appt.customerId) : undefined
  const customer = stats?.customer
  const svc = appt ? getService(appt.serviceId) : undefined
  const staff = STAFF.find((s) => s.id === appt?.staffId)
  const room = ROOMS.find((r) => r.id === appt?.roomId)
  const future = appt ? appt.date > DEMO_TODAY : false

  const change = (status: Appointment['status'], msg: string, why?: string) => {
    if (!appt) return
    const res = setAppointmentStatus(appt.id, status, why)
    toast(res.ok ? msg : res.error, res.ok ? 'success' : 'error')
  }

  const history = useMemo(() => (stats ? stats.history.filter((h) => h.id !== appt?.id).slice(0, 4) : []), [stats, appt?.id])

  if (!appt || !customer) return <Drawer open={false} onClose={onClose} title="" children={null} />

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={`การจอง ${appt.id}`}
        description={`${fmtDateLong(appt.date)} · ${appt.start}–${appt.end} น.`}
        footer={
          <>
            {appt.status === 'pending' && (
              <>
                <Button variant="danger" onClick={() => setCancelOpen(true)}><Ban size={16} /> ยกเลิก</Button>
                <Button onClick={() => onReschedule(appt)}><CalendarClock size={16} /> เลื่อนนัด</Button>
                <Button onClick={() => onEdit(appt)}><Pencil size={16} /> แก้ไข</Button>
                <Button variant="primary" onClick={() => change('confirmed', 'ยืนยันการจองแล้ว')}><Check size={16} /> ยืนยันการจอง</Button>
              </>
            )}
            {appt.status === 'confirmed' && (
              <>
                <Button variant="danger" onClick={() => setCancelOpen(true)}><Ban size={16} /> ยกเลิก</Button>
                <Button onClick={() => change('no_show', 'บันทึกว่าลูกค้าไม่มาตามนัด')}><UserX size={16} /> ไม่มาตามนัด</Button>
                <Button onClick={() => onReschedule(appt)}><CalendarClock size={16} /> เลื่อนนัด</Button>
                <Button onClick={() => onEdit(appt)}><Pencil size={16} /> แก้ไข</Button>
                <Button
                  variant="primary"
                  disabled={future}
                  title={future ? 'ยังไม่ถึงวันนัด' : undefined}
                  onClick={() => change('completed', `บันทึกว่าให้บริการเสร็จสิ้น รายได้ ${fmtTHB(appt.price)}`)}
                >
                  <CheckCheck size={16} /> ให้บริการเสร็จสิ้น
                </Button>
              </>
            )}
            {(appt.status === 'cancelled' || appt.status === 'no_show') && (
              <Button variant="primary" onClick={() => change('pending', 'เปิดการจองอีกครั้ง สถานะ: รอยืนยัน')}><RotateCcw size={16} /> เปิดการจองอีกครั้ง</Button>
            )}
            {appt.status === 'completed' && <p className="mr-auto text-sm text-ink-muted">การจองนี้เสร็จสิ้นแล้ว นับเป็นรายได้และประวัติการใช้บริการของลูกค้า</p>}
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={appt.status} />
            <span className="text-lg font-semibold tabular-nums">{fmtTHB(appt.price)}</span>
          </div>

          {appt.status === 'confirmed' && future && (
            <p className="rounded-lg bg-sky2-50 p-3 text-xs text-sky2-700">ยังไม่ถึงวันนัด จึงยังกด "ให้บริการเสร็จสิ้น" ไม่ได้ (ถ้าต้องการลองขั้นตอนนี้ ให้สร้างการจองสำหรับวันนี้)</p>
          )}
          {appt.status === 'cancelled' && appt.cancelReason && <p className="rounded-lg bg-sand-100 p-3 text-sm text-ink-soft">เหตุผลที่ยกเลิก: {appt.cancelReason}</p>}

          <section className="rounded-xl border border-line p-4">
            <div className="flex items-center gap-3">
              <Avatar name={customer.nickname} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{customer.name}</p>
                <p className="text-sm text-ink-muted">{customer.nickname} · {customer.phone}</p>
              </div>
              <SegmentBadge segment={stats!.segment} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-sand-50 p-2"><dt className="text-ink-muted">มาแล้ว</dt><dd className="mt-0.5 text-base font-semibold">{stats!.visits} ครั้ง</dd></div>
              <div className="rounded-lg bg-sand-50 p-2"><dt className="text-ink-muted">ยอดใช้จ่าย</dt><dd className="mt-0.5 text-base font-semibold">{fmtTHB(stats!.totalSpent)}</dd></div>
              <div className="rounded-lg bg-sand-50 p-2"><dt className="text-ink-muted">รู้จักจาก</dt><dd className="mt-0.5 text-sm font-semibold">{SOURCE_LABEL[customer.source]}</dd></div>
            </dl>
            <Link to={`/customers/${customer.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:underline">
              ดูโปรไฟล์ลูกค้า <ExternalLink size={13} />
            </Link>
          </section>

          <dl className="grid grid-cols-[7rem_1fr] gap-y-2.5 text-sm">
            <dt className="text-ink-muted">บริการ</dt><dd className="font-medium">{svc?.name}</dd>
            <dt className="text-ink-muted">ระยะเวลา</dt><dd>{svc?.durationMin} นาที</dd>
            <dt className="text-ink-muted">พนักงาน</dt><dd>{staff?.name} ({staff?.nickname})</dd>
            <dt className="text-ink-muted">เตียง</dt><dd>{room?.name}</dd>
            <dt className="text-ink-muted">สร้างเมื่อ</dt><dd>{fmtDate(appt.createdAt)}</dd>
            {appt.note && (<><dt className="text-ink-muted">บันทึก</dt><dd>{appt.note}</dd></>)}
          </dl>

          <section>
            <h3 className="mb-2 text-sm font-semibold">ประวัติล่าสุดของลูกค้า</h3>
            {history.length === 0 ? (
              <p className="text-sm text-ink-muted">ยังไม่มีประวัติรายการอื่น</p>
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="min-w-0 truncate">{fmtDate(h.date)} · {getService(h.serviceId)?.name}</span>
                    <StatusBadge status={h.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Drawer>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="ยกเลิกการจอง"
        description="ช่วงเวลา พนักงาน และเตียงจะถูกปล่อยว่างทันที"
        size="sm"
        footer={
          <>
            <Button onClick={() => setCancelOpen(false)}>ไม่ยกเลิก</Button>
            <Button
              variant="danger"
              onClick={() => {
                change('cancelled', 'ยกเลิกการจองแล้ว', reason)
                setCancelOpen(false)
              }}
            >
              ยืนยันยกเลิก
            </Button>
          </>
        }
      >
        <label className="mb-1 block text-sm font-medium text-ink-soft" htmlFor="cancel-reason">เหตุผลในการยกเลิก</label>
        <Select id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus>
          {CANCEL_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </Modal>
    </>
  )
}
