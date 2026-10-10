import { Leaf, MessageCircle, Share2 } from 'lucide-react'
import { useUi } from '@/state/ui'
import { CONTACT, NAV_ITEMS } from '../content/site'
import { BRAND, container } from '../tokens'
import { scrollToSection } from '../ui/scroll'

export function Footer() {
  const { toast } = useUi()
  const placeholder = (what: string) => toast(`${what} เป็นข้อมูลตัวอย่าง ร้านจริงจะใส่ลิงก์ที่ถูกต้องที่นี่`, 'info')

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
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bark-300">นุ่มดี {BRAND.tagline} — พื้นที่พักผ่อนที่ตั้งใจให้คุณได้หลับตา ปล่อยวาง และกลับไปพร้อมความสบายใจ</p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => placeholder('Facebook')} aria-label="Facebook (ตัวอย่าง)" className="rounded-full border border-bark-600 p-2.5 transition-colors hover:border-bark-300 hover:text-white">
              <Share2 size={17} />
            </button>
            <button type="button" onClick={() => placeholder('LINE')} aria-label="LINE (ตัวอย่าง)" className="rounded-full border border-bark-600 p-2.5 transition-colors hover:border-bark-300 hover:text-white">
              <MessageCircle size={17} />
            </button>
          </div>
        </div>

        <nav aria-label="เมนูท้ายเว็บ">
          <p className="text-xs uppercase tracking-[0.2em] text-bark-400">เมนู</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_ITEMS.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(n.id) }} className="transition-colors hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#promotions" onClick={(e) => { e.preventDefault(); scrollToSection('promotions') }} className="transition-colors hover:text-white">
                โปรโมชัน
              </a>
            </li>
            <li>
              <a href="#gallery" onClick={(e) => { e.preventDefault(); scrollToSection('gallery') }} className="transition-colors hover:text-white">
                แกลเลอรี
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-bark-400">ข้อมูลร้าน (ตัวอย่าง)</p>
          <ul className="mt-4 space-y-2.5 text-sm text-bark-300">
            <li>{CONTACT.address}</li>
            <li>{CONTACT.hours}</li>
            <li>{CONTACT.phone}</li>
          </ul>
        </div>
      </div>

      <div className={`${container} mt-14 border-t border-bark-700 pt-6 text-xs leading-relaxed text-bark-400`}>
        <p>
          เว็บไซต์นี้เป็นเดโม (MVP ฝั่ง frontend) สำหรับสาธิตให้เจ้าของร้านเห็นประสบการณ์ของลูกค้า ข้อมูล ราคา รีวิว และการจองทั้งหมดเป็นข้อมูลสมมติ ไม่มีการส่งข้อมูลไปที่ร้านจริงหรือบริการภายนอก
        </p>
        <p className="mt-2">ภาพประกอบจาก Unsplash · © {BRAND.latin} (เดโม)</p>
      </div>
    </footer>
  )
}
