import { Clock } from 'lucide-react'
import { useLang } from '@/i18n'
import { SHOP_CLOSE, SHOP_OPEN } from '@/lib/date'
import { useBooking } from '../booking/BookingProvider'
import { BRAND, container, eyebrow } from '../tokens'
import { SpaImage } from '../ui/SpaImage'
import { scrollToSection } from '../ui/scroll'

export function Hero() {
  const { openBooking } = useBooking()
  const { t } = useLang()
  return (
    <section id="home" className="relative overflow-hidden bg-ivory pt-28 sm:pt-32 lg:pt-0">
      {/* รูปทรงอินทรีย์ด้านหลัง */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-sage-100/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-sand-200/60 blur-3xl" />

      <div className={`${container} relative grid items-center gap-12 lg:min-h-[100svh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28`}>
        <div className="animate-rise">
          <p className={eyebrow}>
            {BRAND.latin} · {BRAND.tagline}
          </p>
          <h1 className="mt-5 font-serifth text-[2.25rem] font-normal leading-[1.5] text-bark-900 sm:text-5xl sm:leading-[1.45] lg:text-[3.25rem]">
            {t('hero.title1')}
            <br />
            <span className="text-olive-700">{t('hero.title2a')}<span className="whitespace-nowrap">{t('hero.title2b')}</span></span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-bark-600 sm:text-lg">
            {t('hero.lead')}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => openBooking()}
              className="inline-flex h-14 items-center justify-center rounded-full bg-olive-700 px-8 text-base font-medium text-white shadow-md transition-all duration-300 hover:bg-olive-800 hover:shadow-lg"
            >
              {t('common.bookYours')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('services')}
              className="inline-flex h-14 items-center justify-center rounded-full border border-bark-300 px-8 text-base font-medium text-bark-800 transition-colors duration-300 hover:border-olive-500 hover:bg-white"
            >
              {t('hero.explore')}
            </button>
          </div>
          <p className="mt-7 inline-flex items-center gap-2 text-sm text-bark-500">
            <Clock size={15} aria-hidden="true" /> {t('hero.hours', { open: SHOP_OPEN, close: SHOP_CLOSE })}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-rise lg:max-w-none" style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}>
          <SpaImage
            image="headMassage"
            alt={t('hero.alt1')}
            width={1100}
            priority
            className="aspect-[4/5] w-full rounded-t-[999px] rounded-b-[2rem] shadow-card sm:aspect-[5/6]"
          />
          <SpaImage
            image="candles"
            alt={t('hero.alt2')}
            width={500}
            priority
            className="absolute -bottom-6 -left-4 h-32 w-32 rounded-full border-[6px] border-ivory shadow-card sm:-left-10 sm:h-44 sm:w-44"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToSection('about')}
        aria-label={t('hero.scrollAria')}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-bark-400 transition-colors hover:text-bark-700 lg:flex"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-bark-200">
          <span className="absolute inset-0 animate-scroll-cue bg-bark-600" />
        </span>
      </button>
    </section>
  )
}
