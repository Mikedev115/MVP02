import { Check } from 'lucide-react'
import { cn, fmtTHB } from '@/lib/format'
import { useBooking } from '../booking/BookingProvider'
import { PROMOTIONS, regularPrice, type Promotion } from '../content/promotions'
import { container, displayTitle, eyebrow, sectionY } from '../tokens'
import { Reveal } from '../ui/Reveal'
import { SpaImage } from '../ui/SpaImage'

export function Promotions() {
  const [featured, ...rest] = PROMOTIONS
  return (
    <section id="promotions" className={`${sectionY} scroll-mt-16 bg-cream/60`}>
      <div className={container}>
        <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className={eyebrow}>โปรโมชัน</p>
            <h2 className={`${displayTitle} mt-4`}>แพ็กเกจและข้อเสนอพิเศษ</h2>
          </div>
          <p className="max-w-xs rounded-2xl border border-amber2-100 bg-amber2-50 px-4 py-2.5 text-xs leading-relaxed text-amber2-700">
            ตัวอย่างโปรโมชันเพื่อการสาธิต ราคาและเงื่อนไขปรับได้ในข้อมูลของระบบ
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
          <Reveal>
            <PromoFeatured promo={featured} />
          </Reveal>
          <div className="grid gap-6">
            {rest.map((p, i) => (
              <Reveal key={p.id} delay={(i + 1) * 90}>
                <PromoRow promo={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Price({ promo, dark }: { promo: Promotion; dark?: boolean }) {
  const regular = regularPrice(promo)
  return (
    <div className="flex items-baseline gap-3">
      <span className={cn('font-serifth text-4xl', dark ? 'text-white' : 'text-olive-800')}>{fmtTHB(promo.promoPrice)}</span>
      {regular > promo.promoPrice && <span className={cn('text-sm line-through', dark ? 'text-bark-300' : 'text-bark-400')}>{fmtTHB(regular)}</span>}
    </div>
  )
}

function PromoFeatured({ promo }: { promo: Promotion }) {
  const { openBooking } = useBooking()
  return (
    <article className="group relative flex h-full min-h-[28rem] flex-col justify-end overflow-hidden rounded-[2rem] bg-bark-800 text-white">
      <SpaImage image={promo.image} alt="" width={1100} className="absolute inset-0 h-full w-full" imgClassName="opacity-70 group-hover:scale-105" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bark-900 via-bark-900/60 to-transparent" />
      <div className="relative p-7 sm:p-10">
        <span className="rounded-full bg-ivory/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-bark-800">{promo.badge}</span>
        <h3 className="mt-4 font-serifth text-2xl sm:text-3xl">{promo.title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{promo.blurb}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-white/85">
          {promo.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <Check size={14} className="text-olive-200" aria-hidden="true" /> {perk}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <Price promo={promo} dark />
          <button
            type="button"
            onClick={() => openBooking({ serviceId: promo.serviceId, promoId: promo.id })}
            className="h-12 rounded-full bg-ivory px-7 text-sm font-medium text-bark-900 transition-colors hover:bg-white"
          >
            จองข้อเสนอนี้
          </button>
        </div>
      </div>
    </article>
  )
}

function PromoRow({ promo }: { promo: Promotion }) {
  const { openBooking } = useBooking()
  return (
    <article className="group flex h-full gap-5 rounded-[1.75rem] bg-white p-4 shadow-card transition-shadow duration-500 hover:shadow-pop sm:p-5">
      <SpaImage image={promo.image} alt="" width={500} className="hidden h-auto w-32 shrink-0 rounded-2xl sm:block" imgClassName="group-hover:scale-105" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="w-fit rounded-full bg-sage-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-sage-800">{promo.badge}</span>
        <h3 className="mt-3 font-serifth text-lg text-bark-900 sm:text-xl">{promo.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-bark-600">{promo.blurb}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <Price promo={promo} />
          <button
            type="button"
            onClick={() => openBooking({ serviceId: promo.serviceId, promoId: promo.id })}
            className="h-10 rounded-full border border-olive-600 px-5 text-sm font-medium text-olive-800 transition-colors hover:bg-olive-600 hover:text-white"
          >
            จองข้อเสนอนี้
          </button>
        </div>
      </div>
    </article>
  )
}
