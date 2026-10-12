import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { useLang } from '@/i18n'
import { cn } from '@/lib/format'
import { REVIEWS } from '../content/reviews'
import { container, displayTitle, eyebrow, sectionY } from '../tokens'
import { Reveal } from '../ui/Reveal'

export function Reviews() {
  const { t, l } = useLang()
  const [index, setIndex] = useState(0)
  const touchX = useRef<number | null>(null)
  const count = REVIEWS.length
  const go = (i: number) => setIndex((i + count) % count)
  const review = REVIEWS[index]

  return (
    <section id="reviews" className={`${sectionY} scroll-mt-16 bg-ivory`}>
      <div className={container}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className={eyebrow}>{t('reviews.eyebrow')}</p>
          <h2 className={`${displayTitle} mt-4`}>{t('reviews.title')}</h2>
          <p className="mx-auto mt-4 inline-block rounded-full border border-amber2-100 bg-amber2-50 px-4 py-1.5 text-xs text-amber2-700">
            {t('reviews.disclaimer')}
          </p>
        </Reveal>

        <Reveal
          className="mx-auto mt-14 max-w-3xl text-center"
          delay={80}
        >
          <div
            role="group"
            aria-roledescription="carousel"
            aria-label={t('reviews.carouselAria')}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') go(index - 1)
              if (e.key === 'ArrowRight') go(index + 1)
            }}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
              touchX.current = null
            }}
            className="rounded-3xl outline-offset-8"
          >
            <Quote className="mx-auto text-olive-300" size={40} strokeWidth={1.25} aria-hidden="true" />
            <figure key={review.id} className="animate-rise" aria-live="polite" aria-atomic="true">
              <blockquote className="mt-6 min-h-[11rem] font-serifth text-xl leading-[1.75] text-bark-800 sm:min-h-[8rem] sm:text-2xl">“{l(review.text)}”</blockquote>
              <figcaption className="mt-7 flex flex-col items-center gap-1">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-olive-100 font-serifth text-olive-800" aria-hidden="true">
                  {l(review.initial)}
                </span>
                <span className="text-sm font-medium text-bark-900">{l(review.name)}</span>
                <span className="text-xs text-bark-500">{l(review.context)}</span>
              </figcaption>
            </figure>
          </div>

          <div className="mt-9 flex items-center justify-center gap-5">
            <button type="button" onClick={() => go(index - 1)} aria-label={t('reviews.prev')} className="rounded-full border border-stone-300 p-3 text-bark-700 transition-colors hover:border-olive-500 hover:bg-white">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label={t('reviews.pickAria')}>
              {REVIEWS.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={t('reviews.tabAria', { i: i + 1, n: count })}
                  onClick={() => go(i)}
                  className={cn('h-2 rounded-full transition-all duration-500', i === index ? 'w-7 bg-olive-600' : 'w-2 bg-stone-300 hover:bg-olive-300')}
                />
              ))}
            </div>
            <button type="button" onClick={() => go(index + 1)} aria-label={t('reviews.next')} className="rounded-full border border-stone-300 p-3 text-bark-700 transition-colors hover:border-olive-500 hover:bg-white">
              <ChevronRight size={18} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
