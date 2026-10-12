import { useEffect } from 'react'
import { Toaster } from '@/components/ui/Misc'
import { useDocumentLang, useLang } from '@/i18n'
import { cn } from '@/lib/format'
import { needsFallbackFade } from '@/lib/viewTransition'
import { ViewSwitch } from '@/components/layout/ViewSwitch'
import { BookingProvider } from './booking/BookingProvider'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Footer } from './sections/Footer'
import { Gallery } from './sections/Gallery'
import { Hero } from './sections/Hero'
import { Promotions } from './sections/Promotions'
import { Reviews } from './sections/Reviews'
import { SiteHeader } from './sections/SiteHeader'
import { Treatments } from './sections/Treatments'
import { WhyUs } from './sections/WhyUs'

/** เว็บไซต์สำหรับลูกค้า (หน้าบ้าน) — ใช้ข้อมูลและ store เดียวกับระบบหลังบ้าน */
export function SitePage() {
  const { lang, t } = useLang()
  useDocumentLang(lang)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const title = t('site.title')
  useEffect(() => {
    const prev = document.title
    document.title = title
    return () => {
      document.title = prev
    }
  }, [title])

  return (
    <BookingProvider>
      <div className={cn('bg-ivory font-sans text-bark-900', needsFallbackFade() && 'animate-fade-in')}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop">
          {t('site.skip')}
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          <Hero />
          <About />
          <Treatments />
          <WhyUs />
          <Reviews />
          <Promotions />
          <Gallery />
          <Contact />
        </main>
        <Footer />
        <ViewSwitch current="site" floating />
        <Toaster raised />
      </div>
    </BookingProvider>
  )
}
