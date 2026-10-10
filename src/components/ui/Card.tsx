import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/format'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-xl2 border border-line bg-surface shadow-card', className)}>{children}</section>
}

export function CardHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function PageIntro({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

interface StatProps {
  label: string
  value: string
  sub?: string
  delta?: { text: string; direction: 'up' | 'down' | 'flat' }
  /** ถ้าค่าลดลงถือว่าดี (เช่น อัตราการยกเลิก) */
  invertTone?: boolean
  to?: string
  icon?: ReactNode
}

export function StatCard({ label, value, sub, delta, invertTone, to, icon }: StatProps) {
  const good = delta && delta.direction !== 'flat' && (invertTone ? delta.direction === 'down' : delta.direction === 'up')
  const bad = delta && delta.direction !== 'flat' && !good
  const inner = (
    <>
      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>{label}</span>
        {icon && <span className="text-sage-500">{icon}</span>}
      </div>
      <div className="mt-2 text-[1.65rem] font-semibold leading-tight tracking-tight text-ink tabular-nums">{value}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium',
              good && 'bg-sage-50 text-sage-700',
              bad && 'bg-clay-50 text-clay-600',
              !good && !bad && 'bg-sand-100 text-ink-muted',
            )}
          >
            {delta.direction === 'up' ? <ArrowUpRight size={12} /> : delta.direction === 'down' ? <ArrowDownRight size={12} /> : <Minus size={12} />}
            {delta.text}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </>
  )
  const cls = 'block rounded-xl2 border border-line bg-surface p-4 shadow-card transition-all duration-150'
  return to ? (
    <Link
      to={to}
      className={cn(cls, 'hover:-translate-y-0.5 hover:border-sage-300 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400')}
      aria-label={`${label} ${value} — ดูรายละเอียด`}
    >
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}
