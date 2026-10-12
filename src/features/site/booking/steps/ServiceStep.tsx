import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { useLang } from '@/i18n'
import { cn, fmtTHB } from '@/lib/format'
import { TREATMENTS, lowestPrice, resolveOptions, serviceText } from '../../content/treatments'
import { SpaImage } from '../../ui/SpaImage'
import type { BookingState } from '../bookingState'

interface Props {
  state: BookingState
  onTreatment: (id: string) => void
  onService: (id: string) => void
}

export function ServiceStep({ state, onTreatment, onService }: Props) {
  const { t, l } = useLang()
  const selected = TREATMENTS.find((tr) => tr.id === state.treatmentId)
  const options = selected ? resolveOptions(selected) : []
  const durationsRef = useRef<HTMLDivElement>(null)

  // เลือกบริการแล้วเลื่อนให้เห็นตัวเลือกระยะเวลาทันที (บนมือถือรายการอยู่ใต้จอ)
  useEffect(() => {
    if (!state.treatmentId || state.serviceId) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    durationsRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [state.treatmentId, state.serviceId])

  return (
    <div>
      <h3 className="font-serifth text-xl text-bark-900">{t('pick.title')}</h3>
      <p className="mt-1 text-sm text-bark-500">{t('pick.sub')}</p>

      <div role="radiogroup" aria-label={t('pick.groupAria')} className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {TREATMENTS.map((tr) => {
          const active = tr.id === state.treatmentId
          return (
            <button
              key={tr.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onTreatment(tr.id)}
              className={cn(
                'group flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all duration-300',
                active ? 'border-olive-500 bg-olive-50 shadow-sm' : 'border-stone-200 bg-white hover:border-olive-300',
              )}
            >
              <SpaImage image={tr.image} alt="" width={200} className="h-14 w-14 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-bark-900">{l(tr.name)}</span>
                <span className="block text-xs text-bark-500">{t('pick.from', { price: fmtTHB(lowestPrice(tr)) })}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors', active ? 'border-olive-600 bg-olive-600 text-white' : 'border-stone-300')}
              >
                {active && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>

      {selected && (
        <div ref={durationsRef} className="mt-7 animate-rise">
          <h4 className="text-sm font-medium text-bark-800">{t('pick.duration', { name: l(selected.name) })}</h4>
          <div role="radiogroup" aria-label={t('pick.durationAria')} className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {options.map(({ service, label }) => {
              const text = serviceText(service)
              const active = service.id === state.serviceId
              return (
                <button
                  key={service.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onService(service.id)}
                  className={cn(
                    'rounded-2xl border p-3.5 text-left transition-all duration-300',
                    active ? 'border-olive-500 bg-olive-50 shadow-sm' : 'border-stone-200 bg-white hover:border-olive-300',
                  )}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-bark-900">{l(label)}</span>
                    <span className="font-serifth text-lg text-olive-700">{fmtTHB(service.price)}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-bark-500">{l(text.description)}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-bark-400">{t('pick.priceNote')}</p>
        </div>
      )}
    </div>
  )
}
