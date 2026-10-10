import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronUp, PlayCircle, Sparkles } from 'lucide-react'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { availableStarts, getService } from '@/lib/conflicts'
import { DEMO_NOW, DEMO_TODAY, toMin } from '@/lib/date'
import { fmtTHB } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/format'
import type { FormInit } from './AppointmentForm'

interface Props {
  onStartCreate: (init: FormInit) => void
  onOpenAppointment: (id: string) => void
}

/** ไกด์ขั้นตอนเดโม: สร้างการจอง → ยืนยัน → ให้บริการเสร็จ → ดูผลลัพธ์ที่ภาพรวมและโปรไฟล์ลูกค้า */
export function DemoGuide({ onStartCreate, onOpenAppointment }: Props) {
  const { data, customerStats, setAppointmentStatus } = useStore()
  const { guideApptId, guideOpen, setGuideOpen, toast } = useUi()
  const appt = data.appointments.find((a) => a.id === guideApptId)

  const prefill = useMemo(() => {
    const returning = [...customerStats.values()].find((s) => s.segment === 'returning' && s.upcoming.length === 0 && s.visits >= 3)
    const serviceId = 'sv-asmr90'
    const customerId = returning?.customer.id ?? data.customers[0]?.id ?? ''
    const free = availableStarts(data.appointments, { customerId, serviceId, date: DEMO_TODAY }).filter((t) => toMin(t) > toMin(DEMO_NOW) + 30)
    return { customerId, serviceId, date: DEMO_TODAY, start: free[0] ?? '', status: 'pending' as const }
  }, [data.appointments, data.customers, customerStats])

  if (!guideOpen) {
    return (
      <button type="button" onClick={() => setGuideOpen(true)} className="mb-4 inline-flex items-center gap-2 rounded-lg border border-sage-200 bg-sage-50 px-3 py-2 text-sm font-medium text-sage-800 hover:bg-sage-100">
        <Sparkles size={16} /> เปิดไกด์เดโมการจอง
      </button>
    )
  }

  const cust = appt ? customerStats.get(appt.customerId) : undefined
  const status = appt?.status
  const step1 = Boolean(appt)
  const step2 = status === 'confirmed' || status === 'completed'
  const step3 = status === 'completed'
  const cancelledNote = status === 'cancelled' || status === 'no_show'

  const act = (to: 'confirmed' | 'completed') => {
    if (!appt) return
    const res = setAppointmentStatus(appt.id, to)
    toast(res.ok ? (to === 'confirmed' ? 'ยืนยันการจองแล้ว' : `ให้บริการเสร็จสิ้น รายได้ ${fmtTHB(appt.price)} ถูกบันทึกแล้ว`) : res.error, res.ok ? 'success' : 'error')
  }

  const steps = [
    {
      done: step1,
      title: '1. สร้างการจอง',
      body: step1 ? `สร้างการจอง ${appt!.id} แล้ว ปฏิทินและยอดการจองวันนี้อัปเดตทันที` : 'ระบบเลือกลูกค้า บริการ และเวลาว่างวันนี้ให้เป็นตัวอย่าง คุณปรับได้ก่อนกดบันทึก',
      action: !step1 && (
        <Button variant="primary" size="sm" disabled={!prefill.start} onClick={() => onStartCreate({ mode: 'create', prefill })}>
          <PlayCircle size={15} /> เริ่มสร้างการจอง
        </Button>
      ),
    },
    {
      done: step2,
      title: '2. ยืนยันการจอง',
      body: step2 ? 'สถานะเป็น "ยืนยันแล้ว" รายการนี้ไม่อยู่ในงานรอยืนยันของหน้างานประจำวันอีกต่อไป' : 'ลูกค้าตอบรับนัดหมายแล้ว ให้เปลี่ยนสถานะเป็นยืนยัน',
      action: step1 && !step2 && !step3 && !cancelledNote && (
        <Button variant="primary" size="sm" onClick={() => act('confirmed')}>
          ยืนยันการจอง
        </Button>
      ),
    },
    {
      done: step3,
      title: '3. ให้บริการเสร็จสิ้น',
      body: step3 ? 'รายได้ของการจองนี้ถูกนับในภาพรวมและยอดใช้จ่ายสะสมของลูกค้าแล้ว' : 'เมื่อบริการเสร็จ ให้ปิดงานเพื่อบันทึกรายได้และประวัติลูกค้า',
      action: step2 && !step3 && (
        <Button variant="primary" size="sm" onClick={() => act('completed')}>
          ให้บริการเสร็จสิ้น
        </Button>
      ),
    },
    {
      done: step3,
      title: '4. ดูผลที่เกิดขึ้น',
      body: step3 && cust ? `${cust.customer.nickname} มีประวัติใช้บริการ ${cust.visits} ครั้ง ยอดสะสม ${fmtTHB(cust.totalSpent)}` : 'หลังเสร็จสิ้น ลองดูตัวเลขที่เปลี่ยนไปในหน้าภาพรวมและโปรไฟล์ลูกค้า',
      action: step3 && cust && (
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="inline-flex h-8 items-center rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-sand-50">ดูภาพรวม</Link>
          <Link to={`/customers/${cust.customer.id}`} className="inline-flex h-8 items-center rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-sand-50">ดูโปรไฟล์ลูกค้า</Link>
        </div>
      ),
    },
  ]

  return (
    <section className="mb-4 rounded-xl2 border border-sage-200 bg-sage-50/60 p-4" aria-label="ไกด์เดโมการจอง">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-sage-900"><Sparkles size={17} /> ลองเดโม: จองตั้งแต่ต้นจนจบ</h2>
          <p className="mt-0.5 text-sm text-sage-800/80">ทำตามขั้นตอนเพื่อดูว่าหนึ่งการจองส่งผลต่อทั้งระบบอย่างไร</p>
        </div>
        <button type="button" onClick={() => setGuideOpen(false)} aria-label="ซ่อนไกด์" className="rounded-lg p-1.5 text-sage-700 hover:bg-sage-100">
          <ChevronUp size={18} />
        </button>
      </div>
      {cancelledNote && (
        <p className="mt-3 rounded-lg bg-white p-3 text-sm text-ink-soft">
          การจองในไกด์ถูกยกเลิกหรือไม่มาตามนัด{' '}
          <button className="font-medium text-sage-700 underline" onClick={() => appt && onOpenAppointment(appt.id)}>เปิดการจอง</button> เพื่อเปิดใหม่ หรือสร้างการจองใหม่ผ่านปุ่ม "สร้างการจอง"
        </p>
      )}
      <ol className="mt-3 grid gap-2 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={i} className={cn('rounded-xl border bg-white p-3', s.done ? 'border-sage-300' : 'border-line')}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-white', s.done ? 'bg-sage-600' : 'bg-sand-300')}>
                {s.done && <Check size={12} />}
              </span>
              {s.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{s.body}</p>
            {s.action && <div className="mt-2.5">{s.action}</div>}
          </li>
        ))}
      </ol>
      {appt && (
        <p className="mt-3 text-xs text-sage-800">
          การจองในไกด์: {appt.id} · {getService(appt.serviceId)?.name} · {appt.start} น.{' '}
          <button className="font-medium underline" onClick={() => onOpenAppointment(appt.id)}>เปิดรายละเอียด</button>
        </p>
      )}
    </section>
  )
}
