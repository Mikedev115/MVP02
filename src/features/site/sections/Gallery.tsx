import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { useOverlay } from '@/components/ui/Overlay'
import { useLang } from '@/i18n'
import { cn } from '@/lib/format'
import { GALLERY } from '../content/site'
import { imageUrl } from '../content/images'
import { container, displayTitle, eyebrow, sectionY } from '../tokens'
import { Reveal } from '../ui/Reveal'
import { SpaImage } from '../ui/SpaImage'

export function Gallery() {
  const { t, l } = useLang()
  const [active, setActive] = useState<number | null>(null)
  return (
    <section id="gallery" className={`${sectionY} scroll-mt-16 bg-white`}>
      <div className={container}>
        <Reveal className="max-w-2xl">
          <p className={eyebrow}>{t('gallery.eyebrow')}</p>
          <h2 className={`${displayTitle} mt-4`}>{t('gallery.title')}</h2>
          <p className="mt-3 text-sm text-bark-500">{t('gallery.hint')}</p>
        </Reveal>

        <div className="mt-12 grid auto-rows-[9rem] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[11rem] sm:gap-4 md:grid-cols-4 lg:auto-rows-[13rem]">
          {GALLERY.map((g, i) => (
            <Reveal key={g.image} delay={(i % 4) * 70} className={cn('min-h-0', g.span)}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t('gallery.open', { caption: l(g.caption) })}
                className="group relative block h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl"
              >
                <SpaImage image={g.image} alt={l(g.caption)} width={800} className="h-full w-full" imgClassName="group-hover:scale-105" />
                <span aria-hidden="true" className="absolute inset-0 bg-bark-900/0 transition-colors duration-500 group-hover:bg-bark-900/25" />
                <Expand aria-hidden="true" size={18} className="absolute right-3 top-3 text-white opacity-0 drop-shadow transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      <Lightbox index={active} onChange={setActive} />
    </section>
  )
}

function Lightbox({ index, onChange }: { index: number | null; onChange: (i: number | null) => void }) {
  const { t, l } = useLang()
  const open = index !== null
  const close = useCallback(() => onChange(null), [onChange])
  const ref = useOverlay(open, close)
  if (index === null) return null

  const total = GALLERY.length
  const step = (d: number) => onChange((index + d + total) % total)
  const item = GALLERY[index]

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={t('gallery.dialog')}
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-bark-900/95"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') step(-1)
        if (e.key === 'ArrowRight') step(1)
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white/80">
        <span className="text-sm">
          {index + 1} / {total}
        </span>
        <button type="button" onClick={close} aria-label={t('gallery.close')} className="rounded-full p-2 hover:bg-white/10">
          <X size={22} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16" onClick={close}>
        <img
          key={item.image}
          src={imageUrl(item.image, 1800)}
          alt={l(item.caption)}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full animate-fade-in rounded-2xl object-contain shadow-pop"
        />
        <button type="button" onClick={(e) => { e.stopPropagation(); step(-1) }} aria-label={t('gallery.prev')} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-5">
          <ChevronLeft size={22} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); step(1) }} aria-label={t('gallery.next')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-5">
          <ChevronRight size={22} />
        </button>
      </div>
      <p className="px-5 py-5 text-center text-sm text-white/80">{l(item.caption)}</p>
    </div>,
    document.body,
  )
}
