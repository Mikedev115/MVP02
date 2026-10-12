import { Leaf, MessageCircle, Share2 } from 'lucide-react'
import { useLang } from '@/i18n'
import { SHOP_CLOSE, SHOP_OPEN } from '@/lib/date'
import { useUi } from '@/state/ui'
import { NAV_ITEMS } from '../content/site'
import { BRAND, container } from '../tokens'
import { scrollToSection } from '../ui/scroll'

export function Footer() {
  const { toast } = useUi()
  const { t, l } = useLang()
  const placeholder = (what: string) => toast(t('footer.placeholderToast', { what }), 'info')

  return (
    <footer className="bg-bark-900 pb-24 pt-16 text-bark-200 sm:pb-16">
      <div className={`${container} grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]`}>
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-700 text-ivory">
              <Leaf size={17} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="font-display text-2xl text-white">{BRAND.latin}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bark-300">{t('footer.about', { tagline: BRAND.tagline })}</p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => placeholder('Facebook')} aria-label={t('footer.sample', { what: 'Facebook' })} className="rounded-full border border-bark-600 p-2.5 transition-colors hover:border-bark-300 hover:text-white">
              <Share2 size={17} />
            </button>
            <button type="button" onClick={() => placeholder('LINE')} aria-label={t('footer.sample', { what: 'LINE' })} className="rounded-full border border-bark-600 p-2.5 transition-colors hover:border-bark-300 hover:text-white">
              <MessageCircle size={17} />
            </button>
          </div>
        </div>

        <nav aria-label={t('footer.navAria')}>
          <p className="text-xs uppercase tracking-[0.2em] text-bark-400">{t('footer.menu')}</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_ITEMS.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(n.id) }} className="transition-colors hover:text-white">
                  {l(n.label)}
                </a>
              </li>
            ))}
            <li>
              <a href="#promotions" onClick={(e) => { e.preventDefault(); scrollToSection('promotions') }} className="transition-colors hover:text-white">
                {t('nav.promotions')}
              </a>
            </li>
            <li>
              <a href="#gallery" onClick={(e) => { e.preventDefault(); scrollToSection('gallery') }} className="transition-colors hover:text-white">
                {t('nav.gallery')}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-bark-400">{t('footer.info')}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-bark-300">
            <li>{t('contact.addressValue')}</li>
            <li>{t('common.hoursDaily', { open: SHOP_OPEN, close: SHOP_CLOSE })}</li>
            <li>{t('contact.phoneValue')}</li>
          </ul>
        </div>
      </div>

      <div className={`${container} mt-14 border-t border-bark-700 pt-6 text-xs leading-relaxed text-bark-400`}>
        <p>
          {t('footer.disclaimer')}
        </p>
        <p className="mt-2">{t('footer.credit', { brand: BRAND.latin })}</p>
      </div>
    </footer>
  )
}
