import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Store } from 'lucide-react'
import { translate, useLang, type Key } from '@/i18n'
import { cn } from '@/lib/format'
import { useViewNavigate } from '@/lib/viewTransition'

export type AppView = 'site' | 'admin'

const ITEMS = [
  { view: 'site' as const, to: '/shop', label: 'view.site', hint: 'view.siteHint', icon: Store },
  { view: 'admin' as const, to: '/', label: 'view.admin', hint: 'view.adminHint', icon: LayoutDashboard },
] as const

/**
 * ปุ่มสลับระหว่างหน้าบ้าน (เว็บไซต์สำหรับลูกค้า) และหลังบ้าน (ระบบจัดการร้าน)
 * สองช่องกว้างเท่ากัน มีแถบสีเลื่อนตามช่องที่เลือก และสลับหน้าด้วย View Transition (ถ้าเบราว์เซอร์รองรับ)
 */
export function ViewSwitch({ current, floating = false, className }: { current: AppView; floating?: boolean; className?: string }) {
  const go = useViewNavigate()
  const { lang } = useLang()
  // หลังบ้านยังเป็นภาษาไทยทั้งหมด ปุ่มสลับจึงตามภาษาของหน้าลูกค้าเฉพาะตอนอยู่หน้าบ้าน
  const t = (key: Key) => translate(current === 'site' ? lang : 'th', key)

  const onClick = (e: MouseEvent<HTMLAnchorElement>, view: AppView, to: string) => {
    // เปิดแท็บใหม่/คลิกกลางตามปกติของลิงก์
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (view !== current) go(to)
  }

  return (
    <nav
      aria-label={t('view.aria')}
      style={{ viewTransitionName: 'view-switch' }}
      className={cn(
        'inline-grid grid-cols-2 rounded-full border p-1 text-sm',
        floating
          ? 'fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 border-bark-200 bg-white/95 shadow-pop backdrop-blur'
          : 'relative border-line bg-white',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-full bg-sage-600 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          current === 'admin' && 'translate-x-full',
        )}
      />
      {ITEMS.map(({ view, to, label, hint, icon: Icon }) => (
        <Link
          key={view}
          to={to}
          onClick={(e) => onClick(e, view, to)}
          aria-current={view === current ? 'page' : undefined}
          title={`${t(label)} (${t(hint)})`}
          className={cn(
            'relative z-10 inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 font-medium transition-colors duration-300 sm:h-8 sm:px-3.5',
            view === current ? 'text-white' : 'text-ink-soft hover:text-ink',
          )}
        >
          <Icon size={15} aria-hidden="true" />
          {t(label)}
        </Link>
      ))}
    </nav>
  )
}
