import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { INSIGHT_CATEGORY_LABEL, type Insight } from '@/lib/insights'
import { Chip } from '@/components/ui/Badge'
import { cn } from '@/lib/format'

const PRIORITY: Record<Insight['priority'], { label: string; cls: string }> = {
  high: { label: 'ควรทำก่อน', cls: 'bg-clay-50 text-clay-600 ring-clay-100' },
  medium: { label: 'ควรพิจารณา', cls: 'bg-amber2-50 text-amber2-700 ring-amber2-100' },
  low: { label: 'ข้อสังเกต', cls: 'bg-sand-100 text-ink-muted ring-sand-200' },
}

export function InsightCard({ insight: i, compact }: { insight: Insight; compact?: boolean }) {
  return (
    <article className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip className="bg-sage-50 text-sage-700 ring-sage-200">{INSIGHT_CATEGORY_LABEL[i.category]}</Chip>
        <Chip className={PRIORITY[i.priority].cls}>{PRIORITY[i.priority].label}</Chip>
      </div>
      <h3 className="mt-2 flex items-start gap-2 font-semibold text-ink">
        <Lightbulb size={17} className="mt-1 shrink-0 text-amber2-500" />
        {i.title}
      </h3>
      <p className="mt-1 text-sm text-ink-soft">{i.finding}</p>
      {!compact && (
        <div className="mt-3 rounded-lg bg-sand-50 p-3">
          <p className="mb-1.5 text-xs font-medium text-ink-muted">ข้อมูลที่ใช้ประกอบ</p>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            {i.evidence.map((e, k) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line/70 py-1 last:border-0">
                <dt className="text-ink-muted">{e.label}</dt>
                <dd className="text-right font-medium tabular-nums">{e.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <p className={cn('mt-3 rounded-lg bg-sage-50 p-3 text-sm text-sage-900', compact && 'mt-2')}>
        <span className="font-semibold">ข้อเสนอแนะ: </span>
        {i.action}
      </p>
      {i.link && (
        <Link to={i.link.to} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:underline">
          {i.link.label} <ArrowRight size={14} />
        </Link>
      )}
    </article>
  )
}
