import { useMemo, useState } from 'react'
import { ClipboardCopy, Megaphone } from 'lucide-react'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { buildVacancyPost, vacancyForDay, type PostPlatform } from '@/lib/availability'
import { DEMO_TODAY, addDays, fmtDate } from '@/lib/date'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Form'

type Day = 'today' | 'tomorrow'

export function VacancyCard() {
  const { data } = useStore()
  const { toast } = useUi()
  const [day, setDay] = useState<Day>('today')
  const [platform, setPlatform] = useState<PostPlatform>('facebook')
  const date = day === 'today' ? DEMO_TODAY : addDays(DEMO_TODAY, 1)
  const dayLabel = day === 'today' ? 'วันนี้' : 'พรุ่งนี้'

  const slots = useMemo(() => vacancyForDay(data.appointments, date), [data.appointments, date])
  const total = slots.reduce((n, s) => n + s.seats, 0)
  const text = buildVacancyPost(slots, platform, dayLabel)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast('คัดลอกข้อความโพสต์คิวว่างแล้ว')
    } catch {
      toast('คัดลอกไม่สำเร็จ ลองเลือกข้อความแล้วคัดลอกเอง', 'error')
    }
  }

  return (
    <Card>
      <CardHeader
        title="เตียงว่างและโพสต์คิวว่าง"
        hint={`คำนวณจากคิวจริงในระบบ (บริการสระผม 60 นาที) · ${fmtDate(date)}`}
        action={<Segmented<Day> size="sm" label="เลือกวัน" value={day} onChange={setDay} options={[{ value: 'today', label: 'วันนี้' }, { value: 'tomorrow', label: 'พรุ่งนี้' }]} />}
      />
      <CardBody className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-sm text-ink-muted">รับลูกค้าเพิ่มได้</p>
          <p className="text-3xl font-semibold tabular-nums">{total} <span className="text-base font-normal text-ink-muted">คิว</span></p>
          {slots.length === 0 ? (
            <p className="mt-3 rounded-lg bg-sand-50 p-3 text-sm text-ink-muted">ช่วงที่เหลือของ{dayLabel}เต็มแล้ว หรือช่างไม่ว่างตรงกับเตียงที่ว่าง</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {slots.map((s) => (
                <li key={s.start} className="rounded-lg border border-line bg-sage-50 px-3 py-2 text-sm" title={`ช่างว่าง ${s.staff} คน · เตียงว่าง ${s.beds} เตียง`}>
                  <span className="font-semibold tabular-nums">{s.start} น.</span>
                  <span className="ml-2 text-sage-800">ว่าง {s.seats} เตียง</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-muted">จำนวนว่าง = จำนวนน้อยกว่าระหว่าง "ช่างที่ว่างและอยู่ในกะ" กับ "เตียงที่ว่าง" ตัวเลขจะเปลี่ยนทันทีเมื่อมีการจองหรือยกเลิก</p>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium"><Megaphone size={15} className="text-sage-500" /> ข้อความโพสต์</p>
            <Segmented<PostPlatform> size="sm" label="แพลตฟอร์ม" value={platform} onChange={setPlatform} options={[{ value: 'facebook', label: 'Facebook' }, { value: 'line', label: 'LINE OA' }, { value: 'tiktok', label: 'TikTok' }]} />
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-line bg-sand-50 p-3 font-sans text-sm leading-relaxed text-ink-soft">{text}</pre>
          <Button className="mt-2 w-full sm:w-auto" onClick={copy}><ClipboardCopy size={16} /> คัดลอกข้อความ</Button>
          <p className="mt-2 text-xs text-ink-muted">เป็นข้อความตัวอย่างจากเทมเพลต ไม่ได้ส่งออกไปที่ใด ๆ</p>
        </div>
      </CardBody>
    </Card>
  )
}
