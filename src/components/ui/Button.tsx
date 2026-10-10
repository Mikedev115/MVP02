import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
type Size = 'sm' | 'md'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-sage-600 text-white hover:bg-sage-700 active:bg-sage-800 shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-sand-50 hover:border-sand-300',
  soft: 'bg-sage-50 text-sage-800 hover:bg-sage-100',
  ghost: 'text-ink-soft hover:bg-sand-100',
  danger: 'bg-white text-clay-600 border border-clay-100 hover:bg-clay-50',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm',
        VARIANT[variant],
        className,
      )}
      {...rest}
    />
  )
})
