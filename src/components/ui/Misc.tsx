import type { ReactNode } from 'react'
import { CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { useUi } from '@/state/ui'
import { cn } from '@/lib/format'

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage-50 text-sage-500">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ProgressBar({ ratio, tone = 'sage', label }: { ratio: number; tone?: 'sage' | 'amber' | 'clay'; label?: string }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100
  const color = tone === 'sage' ? 'bg-sage-500' : tone === 'amber' ? 'bg-amber2-500' : 'bg-clay-500'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-sand-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function utilTone(ratio: number): 'sage' | 'amber' | 'clay' {
  return ratio >= 0.8 ? 'clay' : ratio >= 0.55 ? 'amber' : 'sage'
}

export function Avatar({ name, color = '#6B8A64', size = 36 }: { name: string; color?: string; size?: number }) {
  const initial = Array.from(name.replace(/^(นาย|นางสาว|นาง)/, ''))[0] ?? '?'
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  )
}

export function Toaster() {
  const { toasts, dismissToast } = useUi()
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex animate-rise items-start gap-2.5 rounded-xl border bg-white p-3 text-sm shadow-pop',
            t.tone === 'success' && 'border-sage-200',
            t.tone === 'error' && 'border-clay-100',
            t.tone === 'info' && 'border-sky2-100',
          )}
        >
          {t.tone === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-sage-600" /> : t.tone === 'error' ? <XCircle size={18} className="mt-0.5 shrink-0 text-clay-500" /> : <Info size={18} className="mt-0.5 shrink-0 text-sky2-600" />}
          <span className="flex-1 text-ink-soft">{t.text}</span>
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="ปิดการแจ้งเตือน" className="rounded p-0.5 text-ink-faint hover:bg-sand-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th scope="col" className={cn('whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted', className)}>{children}</th>
}
