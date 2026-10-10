import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn, fmtTHB } from '@/lib/format'
import { useBooking } from '../booking/BookingProvider'
import { TREATMENTS, resolveOptions, type Treatment } from '../content/treatments'
import { bodyText, container, displayTitle, eyebrow, sectionY } from '../tokens'
import { Reveal } from '../ui/Reveal'
import { SpaImage } from '../ui/SpaImage'

/** ความกว้างของแต่ละการ์ดบนจอใหญ่ — สลับกว้าง/แคบเพื่อไม่ให้เป็นตารางซ้ำ ๆ */
const SPANS = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-6', 'lg:col-span-6']

export function Treatments() {
  return (
    <section id="services" className={`${sectionY} scroll-mt-16 bg-cream/60`}>
      <div className={container}>
        <Reveal className="max-w-2xl">
          <p className={eyebrow}>บริการของเรา</p>
          <h2 className={`${displayTitle} mt-4`}>เลือกการพักที่ตรงกับวันนี้ของคุณ</h2>
          <p className={`${bodyText} mt-4`}>ทุกบริการเห็นราคาและระยะเวลาชัดเจน เลือกระยะเวลาที่ต้องการ แล้วจองคิวต่อได้ทันที (ราคาเป็นตัวอย่างเพื่อการสาธิต)</p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-8">
          {TREATMENTS.map((t, i) => (
            <Reveal key={t.id} delay={(i % 2) * 90} className={SPANS[i]}>
              <TreatmentCard treatment={t} wide={i === 0 || i === 3} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function TreatmentCard({ treatment: t, wide }: { treatment: Treatment; wide: boolean }) {
  const { openBooking } = useBooking()
  const options = resolveOptions(t)
  const [selectedId, setSelectedId] = useState(options[0].service.id)
  const selected = options.find((o) => o.service.id === selectedId) ?? options[0]

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-card transition-shadow duration-500 hover:shadow-pop">
      <div className="relative overflow-hidden">
        <SpaImage image={t.image} alt={t.name} width={900} className={cn('w-full', wide ? 'h-64 sm:h-80' : 'h-64 sm:h-72')} imgClassName={cn('group-hover:scale-105', t.imagePosition)} />
        <span className="absolute left-4 top-4 rounded-full bg-ivory/90 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bark-700 backdrop-blur">{t.tagline}</span>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-serifth text-xl text-bark-900 sm:text-2xl">{t.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-bark-600">{t.description}</p>

        <div role="radiogroup" aria-label={`ระยะเวลา ${t.name}`} className="mt-5 flex flex-wrap gap-2">
          {options.map(({ service, label }) => (
            <button
              key={service.id}
              type="button"
              role="radio"
              aria-checked={service.id === selected.service.id}
              onClick={() => setSelectedId(service.id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition-all duration-300',
                service.id === selected.service.id ? 'border-olive-600 bg-olive-600 text-white' : 'border-stone-300 text-bark-700 hover:border-olive-400',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            <p className="text-xs text-bark-400">{selected.service.durationMin} นาที</p>
            <p className="font-serifth text-3xl text-olive-800">{fmtTHB(selected.service.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => openBooking({ treatmentId: t.id, serviceId: selected.service.id })}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-olive-700 pl-5 pr-4 text-sm font-medium text-white transition-all duration-300 hover:bg-olive-800 group-hover:gap-2.5"
          >
            จองบริการนี้ <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}
