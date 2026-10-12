import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { useOverlay } from '@/components/ui/Overlay'
import { useLang, type Key } from '@/i18n'
import { useStore } from '@/state/store'
import { fmtDateLong, fmtTimeRange } from '@/lib/date'
import { cn, fmtTHB } from '@/lib/format'
import { serviceText } from '../content/treatments'
import { BRAND } from '../tokens'
import { STEPS, type BookingAction, type BookingState } from './bookingState'
import { confirmBooking, type ConfirmError } from './confirmBooking'
import { describeSelection } from './selection'
import { hasErrors, sampleDetails, validateDetails, type DetailField } from './validation'
import { DetailsStep } from './steps/DetailsStep'
import { ReviewStep } from './steps/ReviewStep'
import { ServiceStep } from './steps/ServiceStep'
import { SuccessStep } from './steps/SuccessStep'
import { TimeStep } from './steps/TimeStep'

interface Props {
  open: boolean
  state: BookingState
  dispatch: Dispatch<BookingAction>
  onClose: () => void
  onOpenAdmin: (href: string) => void
}

export function BookingDialog({ open, state, dispatch, onClose, onOpenAdmin }: Props) {
  const ref = useOverlay(open, onClose)
  const store = useStore()
  const { t, l, lang } = useLang()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [touched, setTouched] = useState<Set<DetailField>>(new Set())
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState<ConfirmError | null>(null)

  const { step } = state
  const sel = describeSelection(state)
  const errors = useMemo(() => validateDetails(state.details), [state.details])
  const shown = useMemo(
    () => (attempted ? new Set<DetailField>(['name', 'phone', 'lineId', 'note', 'agree']) : touched),
    [attempted, touched],
  )

  // เลื่อนเนื้อหากลับด้านบนทุกครั้งที่เปลี่ยนขั้นตอน
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  // เริ่มต้นใหม่ทุกครั้งที่เปิดหน้าต่าง
  useEffect(() => {
    if (open) {
      setTouched(new Set())
      setAttempted(false)
      setError(null)
    }
  }, [open])

  if (!open) return null

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const go = (next: BookingState['step']) => {
    setError(null)
    dispatch({ type: 'goto', step: next })
  }

  const canNext =
    step === 'service' ? !!state.serviceId : step === 'time' ? !!state.date && !!state.start : true

  const next = () => {
    if (step === 'service') go('time')
    else if (step === 'time') go('details')
    else if (step === 'details') {
      if (hasErrors(errors)) {
        setAttempted(true)
        // พาไปยังช่องแรกที่ยังไม่ถูกต้อง (รอให้ข้อความผิดพลาดแสดงก่อน)
        setTimeout(() => bodyRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
        return
      }
      go('review')
    } else if (step === 'review') {
      const result = confirmBooking(store, state)
      if (result.ok) dispatch({ type: 'confirmed', confirmation: result.value })
      else setError(result.error)
    }
  }

  const back = () => {
    if (stepIndex > 0) go(STEPS[stepIndex - 1].id)
  }

  const nextLabel = step === 'review' ? t('booking.confirm') : step === 'details' ? t('booking.toReview') : t('booking.next')
  const errorText = error ? (error.code === 'store' ? error.message : t(`booking.err.${error.code}` as Key)) : null
  const done = step === 'done' && state.confirmation

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-bark-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t('booking.dialog')}
        className="relative flex h-full w-full animate-rise flex-col overflow-hidden bg-ivory shadow-pop sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-3xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-3.5 sm:px-7">
          <div className="min-w-0">
            <p className="font-display text-lg leading-none text-bark-900">{BRAND.latin}</p>
            <p className="mt-1 text-xs text-bark-500">{t('booking.sub')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('booking.close')} className="rounded-full p-2 text-bark-600 transition-colors hover:bg-stone-100">
            <X size={20} />
          </button>
        </header>

        {!done && <Stepper index={stepIndex} onJump={(i) => i < stepIndex && go(STEPS[i].id)} />}

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div ref={bodyRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {step === 'service' && (
              <ServiceStep
                state={state}
                onTreatment={(id) => dispatch({ type: 'treatment', treatmentId: id })}
                onService={(id) => dispatch({ type: 'service', serviceId: id })}
              />
            )}
            {step === 'time' && <TimeStep state={state} onDate={(date) => dispatch({ type: 'date', date })} onTime={(start) => dispatch({ type: 'time', start })} />}
            {step === 'details' && (
              <DetailsStep
                details={state.details}
                errors={errors}
                shown={shown}
                onChange={(patch) => dispatch({ type: 'details', patch })}
                onTouch={(f) => setTouched((t) => new Set(t).add(f))}
                onFillSample={() => {
                  dispatch({ type: 'details', patch: sampleDetails(t('details.sampleName')) })
                  setAttempted(false)
                }}
              />
            )}
            {step === 'review' && <ReviewStep state={state} error={errorText} onEdit={go} />}
            {done && (
              <SuccessStep
                confirmation={state.confirmation!}
                onAnother={() => dispatch({ type: 'another' })}
                onClose={onClose}
                onOpenAdmin={onOpenAdmin}
              />
            )}
          </div>

          {!done && (
            <aside aria-label={t('booking.summary')} className="hidden w-64 shrink-0 border-l border-stone-200 bg-cream/50 p-6 md:block">
              <p className="text-xs uppercase tracking-[0.2em] text-bark-400">{t('booking.summary')}</p>
              <Summary state={state} />
            </aside>
          )}
        </div>

        {!done && (
          <footer className="border-t border-stone-200 bg-white/70 px-5 py-3 sm:px-7">
            <p className="mb-2 truncate text-xs text-bark-500 md:hidden" aria-hidden="true">
              {sel.service ? `${l(serviceText(sel.service).name)} · ${fmtTHB(sel.price)}` : t('booking.noService')}
              {state.date && state.start ? ` · ${fmtTimeRange(state.start, sel.end ?? state.start, lang)}` : ''}
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={stepIndex <= 0}
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm text-bark-700 transition-colors hover:bg-stone-100 disabled:invisible"
              >
                <ArrowLeft size={16} aria-hidden="true" /> {t('booking.back')}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!canNext}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-olive-700 px-6 text-sm font-medium text-white transition-colors hover:bg-olive-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {nextLabel}
                {step === 'review' ? <Check size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

function Stepper({ index, onJump }: { index: number; onJump: (i: number) => void }) {
  const { t } = useLang()
  return (
    <div className="border-b border-stone-200 px-5 py-3 sm:px-7">
      <p className="mb-2 text-xs text-bark-500 sm:hidden">
        {t('booking.stepOf', { i: index + 1, n: STEPS.length, label: t(STEPS[index].label) })}
      </p>
      <ol className="flex items-center gap-2" aria-label={t('booking.stepsAria')}>
        {STEPS.map((s, i) => {
          const complete = i < index
          const current = i === index
          return (
            <li key={s.id} className={cn('flex items-center gap-2', i < STEPS.length - 1 && 'flex-1')} aria-current={current ? 'step' : undefined}>
              <button
                type="button"
                disabled={!complete}
                onClick={() => onJump(i)}
                aria-label={t(complete ? 'booking.stepAriaEdit' : 'booking.stepAria', { i: i + 1, label: t(s.label) })}
                className="flex items-center gap-2 disabled:cursor-default"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                    complete ? 'border-olive-600 bg-olive-600 text-white' : current ? 'border-olive-600 text-olive-700' : 'border-stone-300 text-bark-400',
                  )}
                >
                  {complete ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                <span className={cn('hidden text-sm sm:inline', current ? 'font-medium text-bark-900' : 'text-bark-500')}>{t(s.label)}</span>
              </button>
              {i < STEPS.length - 1 && <span aria-hidden="true" className={cn('h-px flex-1 transition-colors', complete ? 'bg-olive-500' : 'bg-stone-200')} />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Summary({ state }: { state: BookingState }) {
  const { t, l, lang } = useLang()
  const { service, treatment, promo, price, end } = describeSelection(state)
  const empty = <span className="text-bark-300">—</span>
  return (
    <dl className="mt-4 space-y-3.5 text-sm">
      <div>
        <dt className="text-xs text-bark-400">{t('booking.service')}</dt>
        <dd className="font-medium text-bark-900">{treatment ? l(treatment.name) : empty}</dd>
        {service && <dd className="text-bark-600">{t('common.minutes', { n: service.durationMin })}</dd>}
      </div>
      <div>
        <dt className="text-xs text-bark-400">{t('booking.date')}</dt>
        <dd className="font-medium text-bark-900">{state.date ? fmtDateLong(state.date, lang) : empty}</dd>
      </div>
      <div>
        <dt className="text-xs text-bark-400">{t('booking.time')}</dt>
        <dd className="font-medium text-bark-900">{state.start && end ? fmtTimeRange(state.start, end, lang) : empty}</dd>
      </div>
      <div className="border-t border-stone-200 pt-3.5">
        <dt className="text-xs text-bark-400">{promo ? t('booking.priceWithPromo', { promo: l(promo.title) }) : t('booking.price')}</dt>
        <dd className="font-serifth text-2xl text-olive-800">{service ? fmtTHB(price) : empty}</dd>
      </div>
    </dl>
  )
}
