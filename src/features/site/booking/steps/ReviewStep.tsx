import { AlertTriangle, Info } from 'lucide-react'
import { useLang } from '@/i18n'
import { fmtDateLong, fmtTimeRange } from '@/lib/date'
import { fmtTHB } from '@/lib/format'
import type { BookingState } from '../bookingState'
import { serviceText } from '../../content/treatments'
import { describeSelection } from '../selection'

interface Props {
  state: BookingState
  error: string | null
  onEdit: (step: 'service' | 'time' | 'details') => void
}

export function ReviewStep({ state, error, onEdit }: Props) {
  const { t, l, lang } = useLang()
  const { service, promo, price, end } = describeSelection(state)
  const { details, date, start } = state

  const rows: { label: string; value: string; edit: 'service' | 'time' | 'details' }[] = [
    { label: t('booking.service'), value: service ? l(serviceText(service).name) : '-', edit: 'service' },
    { label: t('booking.date'), value: date ? fmtDateLong(date, lang) : '-', edit: 'time' },
    { label: t('booking.time'), value: start && end ? fmtTimeRange(start, end, lang) : '-', edit: 'time' },
    { label: t('review.name'), value: details.name.trim(), edit: 'details' },
    { label: t('review.phone'), value: details.phone, edit: 'details' },
  ]
  if (details.lineId.trim()) rows.push({ label: 'LINE ID', value: details.lineId.trim(), edit: 'details' })
  if (details.note.trim()) rows.push({ label: t('review.note'), value: details.note.trim(), edit: 'details' })

  return (
    <div>
      <h3 className="font-serifth text-xl text-bark-900">{t('review.title')}</h3>
      <p className="mt-1 text-sm text-bark-500">{t('review.sub')}</p>

      {error && (
        <div role="alert" className="mt-4 flex gap-2.5 rounded-xl border border-clay-100 bg-clay-50 p-3.5 text-sm text-clay-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{t('review.errorSuffix', { error })}</p>
        </div>
      )}

      <dl className="mt-5 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3 px-4 py-3 text-sm">
            <dt className="w-20 shrink-0 text-bark-500">{r.label}</dt>
            <dd className="min-w-0 flex-1 break-words font-medium text-bark-900">{r.value}</dd>
            <button type="button" onClick={() => onEdit(r.edit)} className="shrink-0 text-xs text-olive-700 underline underline-offset-2 hover:text-olive-900">
              {t('review.edit')}
            </button>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 bg-cream/60 px-4 py-3.5 text-sm">
          <dt className="text-bark-500">{promo ? t('review.priceWithPromo', { promo: l(promo.title) }) : t('booking.price')}</dt>
          <dd className="font-serifth text-xl text-olive-800">{fmtTHB(price)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2.5 rounded-xl border border-amber2-100 bg-amber2-50 p-3.5 text-sm text-amber2-700">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>{t('review.demoNote')}</p>
      </div>
    </div>
  )
}
