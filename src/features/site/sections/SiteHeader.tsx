import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Leaf, Menu, X } from 'lucide-react'
import { useOverlay } from '@/components/ui/Overlay'
import { cn } from '@/lib/format'
import { NAV_ITEMS } from '../content/site'
import { useBooking } from '../booking/BookingProvider'
import { BRAND, container } from '../tokens'
import { scrollToSection } from '../ui/scroll'

export function SiteHeader() {
  const { openBooking } = useBooking()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('home')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ไฮไลต์เมนูตาม section ที่อยู่กลางจอ
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    NAV_ITEMS.forEach((n) => {
      const el = document.getElementById(n.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  const go = (id: string) => {
    setMenuOpen(false)
    // รอให้เมนูมือถือปิด (ปลดล็อกการเลื่อนหน้า) ก่อนเลื่อน
    setTimeout(() => scrollToSection(id), 0)
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-all duration-500',
          scrolled ? 'border-b border-stone-200/80 bg-ivory/90 py-2.5 shadow-sm backdrop-blur-md' : 'bg-transparent py-4',
        )}
      >
        <div className={cn(container, 'flex items-center justify-between gap-4')}>
          <a href="#home" onClick={(e) => { e.preventDefault(); go('home') }} className="flex items-center gap-2.5" aria-label={`${BRAND.latin} กลับขึ้นด้านบน`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-700 text-ivory">
              <Leaf size={17} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-xl font-medium text-bark-900">{BRAND.latin}</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.25em] text-bark-500">{BRAND.tagline}</span>
            </span>
          </a>

          <nav aria-label="เมนูเว็บไซต์" className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => { e.preventDefault(); go(n.id) }}
                aria-current={active === n.id ? 'true' : undefined}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors duration-300',
                  active === n.id ? 'bg-olive-100/80 text-olive-900' : 'text-bark-600 hover:text-bark-900',
                )}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openBooking()}
              className="inline-flex h-10 items-center rounded-full bg-olive-700 px-5 text-sm font-medium text-white shadow-sm transition-colors duration-300 hover:bg-olive-800"
            >
              จองคิวเลย
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="เปิดเมนู"
              aria-expanded={menuOpen}
              className="rounded-full p-2.5 text-bark-800 transition-colors hover:bg-stone-100 lg:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} active={active} onGo={go} onBook={() => { setMenuOpen(false); openBooking() }} />
    </>
  )
}

function MobileMenu({ open, onClose, active, onGo, onBook }: { open: boolean; onClose: () => void; active: string; onGo: (id: string) => void; onBook: () => void }) {
  const ref = useOverlay(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-bark-900/40" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="เมนู" className="absolute inset-y-0 right-0 flex w-80 max-w-[88vw] animate-slide-in flex-col bg-ivory px-6 py-5 shadow-pop">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl text-bark-900">{BRAND.latin}</span>
          <button type="button" onClick={onClose} aria-label="ปิดเมนู" className="rounded-full p-2 hover:bg-stone-100">
            <X size={20} />
          </button>
        </div>
        <nav aria-label="เมนูเว็บไซต์" className="mt-8 flex flex-col">
          {NAV_ITEMS.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={(e) => { e.preventDefault(); onGo(n.id) }}
              aria-current={active === n.id ? 'true' : undefined}
              className={cn('border-b border-stone-200 py-4 font-serifth text-xl transition-colors', active === n.id ? 'text-olive-700' : 'text-bark-800')}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <button type="button" onClick={onBook} className="mt-auto h-12 rounded-full bg-olive-700 text-sm font-medium text-white hover:bg-olive-800">
          จองคิวเลย
        </button>
        <p className="mt-3 text-center text-xs text-bark-400">เว็บไซต์เดโม · ข้อมูลทั้งหมดเป็นตัวอย่าง</p>
      </div>
    </div>,
    document.body,
  )
}
