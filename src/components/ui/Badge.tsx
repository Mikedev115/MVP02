import type { ReactNode } from 'react'
import { STATUS_LABEL } from '@/data/catalog'
import type { AppointmentStatus, CustomerSegment } from '@/types'
import { SEGMENT_LABEL } from '@/lib/metrics'
import { cn } from '@/lib/format'

export const STATUS_STYLE: Record<AppointmentStatus, { chip: string; dot: string; block: string }> = {
  pending: { chip: 'bg-amber2-50 text-amber2-700 ring-amber2-100', dot: 'bg-amber2-500', block: 'bg-amber2-50 border-amber2-500/50 text-amber2-700' },
  confirmed: { chip: 'bg-sky2-50 text-sky2-700 ring-sky2-100', dot: 'bg-sky2-500', block: 'bg-sky2-50 border-sky2-500/50 text-sky2-700' },
  completed: { chip: 'bg-sage-50 text-sage-700 ring-sage-200', dot: 'bg-sage-500', block: 'bg-sage-100 border-sage-400/60 text-sage-800' },
  cancelled: { chip: 'bg-sand-100 text-ink-muted ring-sand-200', dot: 'bg-ink-faint', block: 'bg-sand-100 border-sand-300 text-ink-muted line-through' },
  no_show: { chip: 'bg-clay-50 text-clay-600 ring-clay-100', dot: 'bg-clay-500', block: 'bg-clay-50 border-clay-500/50 text-clay-700' },
}

export function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', className)}>{children}</span>
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <Chip className={s.chip}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {STATUS_LABEL[status]}
    </Chip>
  )
}

const SEG_STYLE: Record<CustomerSegment, string> = {
  new: 'bg-sky2-50 text-sky2-700 ring-sky2-100',
  returning: 'bg-sage-50 text-sage-700 ring-sage-200',
  inactive: 'bg-sand-100 text-ink-muted ring-sand-200',
}

export function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  return <Chip className={SEG_STYLE[segment]}>{SEGMENT_LABEL[segment]}</Chip>
}
