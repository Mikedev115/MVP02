import { useMemo, useState } from 'react'
import { Info, SearchX } from 'lucide-react'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { INSIGHT_CATEGORY_LABEL, buildInsights, type InsightCategory } from '@/lib/insights'
import { fmtRange } from '@/lib/date'
import { cn } from '@/lib/format'
import { Card, CardBody, PageIntro } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Misc'
import { InsightCard } from './InsightCard'

const RULES = [
  'บริการและหมวดที่ทำรายได้สูงสุด เทียบกับบริการที่ขายจำนวนครั้งมากสุด',
  'วันและชั่วโมงที่มีคิวเฉลี่ยสูง/ต่ำ (หารด้วยจำนวนวันนั้น ๆ ในช่วงที่เลือก)',
  'อัตรากลับมาซ้ำของแต่ละช่วงอายุและช่องทาง (เฉพาะกลุ่มที่มีลูกค้าอย่างน้อย 8 ราย) และช่องทางที่พาลูกค้ามามากแต่ไม่กลับมาซ้ำ',
  'สัปดาห์ที่ลูกค้าใหม่จากช่องทางใดช่องทางหนึ่งพุ่งสูงกว่าปกติอย่างน้อย 2 เท่า (เช่น หลังคลิป TikTok ไวรัล)',
  'อัตราไม่มาตามนัดตามช่องทาง และอัตรายกเลิก/ไม่มาตามวัน (เฉพาะกลุ่มที่มีอย่างน้อย 25 การจอง)',
  'ความสมดุลของภาระงานพนักงาน คิวติดกัน 6 คิวขึ้นไป และการใช้เตียง',
  'ลูกค้าที่เคยมาซ้ำแต่ไม่ได้กลับมาเกิน 60 วัน และคิวที่ยังไม่ยืนยันใน 2 วันข้างหน้า',
]

export function InsightsPage() {
  const { data, customerStats } = useStore()
  const { range } = useUi()
  const [cat, setCat] = useState<InsightCategory | 'all'>('all')

  const insights = useMemo(() => buildInsights(data, customerStats, range), [data, customerStats, range])
  const shown = cat === 'all' ? insights : insights.filter((i) => i.category === cat)
  const cats = Object.keys(INSIGHT_CATEGORY_LABEL) as InsightCategory[]

  return (
    <div>
      <PageIntro
        title="ข้อมูลเชิงลึก"
        description={`ข้อเสนอแนะจากข้อมูลของร้านช่วง ${fmtRange(range)} พร้อมตัวเลขประกอบและสิ่งที่ควรทำต่อ เปลี่ยนช่วงวันที่ที่มุมขวาบนเพื่อดูผลต่างกัน`}
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky2-100 bg-sky2-50 p-4 text-sm text-sky2-700">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>ข้อเสนอแนะทั้งหมดคำนวณจากกฎและตัวเลขจริงในข้อมูลเดโมชุดเดียวกับทั้งระบบ <strong>ไม่ใช่การวิเคราะห์ด้วย AI</strong> และเปลี่ยนไปตามการจอง การยกเลิก และงานที่คุณจัดการในระบบ</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={cat === 'all'} onClick={() => setCat('all')} className={cn('rounded-full border px-3 py-1 text-sm transition-colors', cat === 'all' ? 'border-sage-500 bg-sage-600 text-white' : 'border-line bg-white hover:bg-sand-50')}>
          ทั้งหมด {insights.length}
        </button>
        {cats.map((c) => {
          const n = insights.filter((i) => i.category === c).length
          return (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} disabled={n === 0} className={cn('rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-40', cat === c ? 'border-sage-500 bg-sage-600 text-white' : 'border-line bg-white hover:bg-sand-50')}>
              {INSIGHT_CATEGORY_LABEL[c]} {n}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {shown.length === 0 ? (
            <Card>
              <EmptyState icon={<SearchX size={22} />} title="ยังไม่มีข้อเสนอแนะในช่วงนี้" description="ข้อมูลอาจน้อยเกินไป ลองเลือกช่วงวันที่ที่กว้างขึ้น เช่น 90 วันล่าสุด หรือตั้งแต่เริ่มระบบ" />
            </Card>
          ) : (
            shown.map((i) => <InsightCard key={i.id} insight={i} />)
          )}
        </div>
        <Card className="self-start">
          <CardBody>
            <h2 className="font-semibold">ระบบดูอะไรบ้าง</h2>
            <p className="mt-1 text-sm text-ink-muted">กฎที่ใช้ตรวจข้อมูล (ข้อเสนอจะปรากฏเมื่อข้อมูลเข้าเกณฑ์)</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-soft">
              {RULES.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
