import type { ReactNode } from 'react'
import { Clock, Map, MapPin, MessageCircle, Phone, Share2 } from 'lucide-react'
import { useUi } from '@/state/ui'
import { useBooking } from '../booking/BookingProvider'
import { CONTACT } from '../content/site'
import { bodyText, container, displayTitle, eyebrow, sectionY } from '../tokens'
import { Reveal } from '../ui/Reveal'

export function Contact() {
  const { toast } = useUi()
  const { openBooking } = useBooking()
  const placeholder = (what: string) => toast(`${what} เป็นข้อมูลตัวอย่าง ร้านจริงจะใส่ลิงก์หรือข้อมูลที่ถูกต้องที่นี่`, 'info')

  return (
    <section id="contact" className="scroll-mt-16 bg-ivory">
      <div className={`${container} ${sectionY} grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20`}>
        <Reveal>
          <p className={eyebrow}>ติดต่อเรา</p>
          <h2 className={`${displayTitle} mt-4`}>แวะมาพักกับเรา</h2>
          <p className={`${bodyText} mt-4 max-w-md`}>ข้อมูลด้านล่างเป็นตัวอย่าง (placeholder) สำหรับการสาธิตเท่านั้น</p>

          <ul className="mt-9 divide-y divide-stone-200 border-y border-stone-200">
            <Row icon={<MapPin size={18} />} label="ที่ตั้งร้าน" value={CONTACT.address} />
            <Row icon={<Clock size={18} />} label="เวลาทำการ" value={CONTACT.hours} />
            <Row icon={<Phone size={18} />} label="โทรศัพท์" value={CONTACT.phone} onClick={() => placeholder('เบอร์โทรศัพท์')} />
            <Row icon={<MessageCircle size={18} />} label="LINE" value={CONTACT.line} onClick={() => placeholder('LINE')} />
            <Row icon={<Share2 size={18} />} label="Facebook" value={CONTACT.facebook} onClick={() => placeholder('Facebook')} />
          </ul>
        </Reveal>

        <Reveal delay={100}>
          <button
            type="button"
            onClick={() => placeholder('Google Maps')}
            aria-label={`${CONTACT.maps} — ตัวอย่างแผนที่`}
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-stone-200 bg-cream text-left"
          >
            <MapPlaceholder />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm text-bark-800 shadow-card transition-transform duration-300 group-hover:-translate-y-0.5">
              <Map size={15} aria-hidden="true" /> {CONTACT.maps}
            </span>
          </button>
        </Reveal>
      </div>

      <FinalCta onBook={() => openBooking()} />
    </section>
  )
}

function Row({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="mt-0.5 text-olive-600" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-bark-400">{label}</span>
        <span className="block text-[15px] text-bark-900">{value}</span>
      </span>
    </>
  )
  return (
    <li>
      {onClick ? (
        <button type="button" onClick={onClick} className="flex w-full gap-4 py-4 text-left transition-colors hover:bg-cream/60">
          {inner}
        </button>
      ) : (
        <div className="flex gap-4 py-4">{inner}</div>
      )}
    </li>
  )
}

function MapPlaceholder() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="#F3EDDF" />
      <path d="M-10 210 C80 170 140 250 230 200 S360 150 420 190 V310 H-10Z" fill="#E3EAE0" />
      <path d="M-10 60 L130 110 L240 40 L420 120" stroke="#DAD3C2" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M70 -10 L120 120 L100 310" stroke="#DAD3C2" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M260 -10 L240 150 L330 310" stroke="#E6DDC8" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="200" cy="140" r="34" fill="#6B8A64" opacity="0.18" />
      <path d="M200 112c-11 0-20 9-20 20 0 15 20 36 20 36s20-21 20-36c0-11-9-20-20-20z" fill="#5A6535" />
      <circle cx="200" cy="132" r="7" fill="#FCFAF4" />
    </svg>
  )
}

function FinalCta({ onBook }: { onBook: () => void }) {
  return (
    <div className="bg-olive-900 py-20 text-center text-white sm:py-24">
      <Reveal className={container}>
        <p className="text-xs uppercase tracking-[0.3em] text-olive-300">Book your rest</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-serifth text-3xl font-normal leading-[1.5] sm:text-4xl sm:leading-[1.45] lg:text-5xl">พร้อมให้ตัวเองได้พักหรือยัง</h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-olive-100/80">เลือกบริการ เลือกเวลาว่าง แล้วจองได้ในไม่กี่ขั้นตอน (ระบบจองนี้เป็นเดโม ไม่ส่งถึงร้านจริง)</p>
        <button
          type="button"
          onClick={onBook}
          className="mt-9 inline-flex h-14 items-center rounded-full bg-ivory px-9 text-base font-medium text-bark-900 shadow-md transition-all duration-300 hover:bg-white hover:shadow-lg"
        >
          จองคิวของคุณ
        </button>
      </Reveal>
    </div>
  )
}
