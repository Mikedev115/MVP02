import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/format'

const base =
  'w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200 disabled:bg-sand-50 disabled:text-ink-muted'

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: (id: string, describedBy?: string) => ReactNode
}) {
  const id = useId()
  const descId = error || hint ? `${id}-d` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="text-clay-500"> *</span>}
      </label>
      {children(id, descId)}
      {(error || hint) && (
        <p id={descId} role={error ? 'alert' : undefined} className={cn('mt-1 text-xs', error ? 'text-clay-600' : 'text-ink-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...p },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(base, 'h-10', invalid && 'border-clay-500 focus:border-clay-500 focus:ring-clay-100', className)}
      {...p}
    />
  )
})

export function Select({ className, invalid, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select aria-invalid={invalid || undefined} className={cn(base, 'h-10 pr-8', invalid && 'border-clay-500', className)} {...p}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'py-2', className)} {...p} />
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(base, 'h-10 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button type="button" aria-label="ล้างคำค้นหา" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:bg-sand-100">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-line bg-sand-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400',
            size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm',
            value === o.value ? 'bg-white text-sage-800 shadow-sm' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
