import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChevronsLeft, ChevronsRight, ClipboardCheck, Leaf, LayoutDashboard, Lightbulb, Menu, Megaphone, RotateCcw, Users, X } from 'lucide-react'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { buildAlerts } from '@/lib/metrics'
import { DEMO_NOW, DEMO_TODAY, fmtDateLong } from '@/lib/date'
import { cn } from '@/lib/format'
import { needsFallbackFade } from '@/lib/viewTransition'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Overlay'
import { Toaster } from '@/components/ui/Misc'
import { DateRangePicker } from './DateRangePicker'
import { ViewSwitch } from './ViewSwitch'

const NAV = [
  { to: '/', label: 'ภาพรวม', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'การจอง', icon: CalendarDays },
  { to: '/customers', label: 'ลูกค้า', icon: Users },
  { to: '/marketing', label: 'การตลาดและลูกค้า', icon: Megaphone },
  { to: '/operations', label: 'งานประจำวัน', icon: ClipboardCheck },
  { to: '/insights', label: 'ข้อมูลเชิงลึก', icon: Lightbulb },
]

const TITLES: Record<string, string> = {
  '/': 'ภาพรวมธุรกิจ',
  '/bookings': 'จัดการการจอง',
  '/customers': 'ลูกค้าสัมพันธ์',
  '/marketing': 'การตลาดและวิเคราะห์ลูกค้า',
  '/operations': 'งานประจำวัน',
  '/insights': 'ข้อมูลเชิงลึก',
}

const RANGE_PAGES = ['/', '/marketing', '/insights']

export function AppShell() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const { resetDemo, data } = useStore()
  const { toast, setGuideApptId } = useUi()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  const title = pathname.startsWith('/customers/') ? 'โปรไฟล์ลูกค้า' : TITLES[pathname] ?? 'ไม่พบหน้า'
  const pendingToday = data.appointments.filter((a) => a.date === DEMO_TODAY && a.status === 'pending').length
  const openTasks = data.tasks.filter((t) => t.date <= DEMO_TODAY && t.status !== 'done').length
  const badge: Record<string, number> = { '/bookings': pendingToday, '/operations': openTasks }

  const nav = (compact: boolean, onNavigate?: () => void) => (
    <nav aria-label="เมนูหลัก" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={compact ? label : undefined}
          className={({ isActive }) =>
            cn(
              'group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              isActive ? 'bg-sage-100 text-sage-900' : 'text-ink-soft hover:bg-sand-100',
              compact && 'justify-center px-0',
            )
          }
        >
          <span className="relative">
            <Icon size={19} />
            {compact && badge[to] ? <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-clay-500" /> : null}
          </span>
          {!compact && <span className="flex-1 truncate">{label}</span>}
          {!compact && badge[to] ? <span className="rounded-full bg-clay-50 px-2 py-0.5 text-xs font-semibold text-clay-600">{badge[to]}</span> : null}
        </NavLink>
      ))}
    </nav>
  )

  const brand = (compact: boolean) => (
    <div className={cn('flex items-center gap-2.5', compact && 'justify-center')}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-600 text-white shadow-sm">
        <Leaf size={19} />
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="font-semibold text-ink">นุ่มดี Hair Sleep Spa</p>
          <p className="text-xs text-ink-muted">Nu Dee · ระบบเดโม</p>
        </div>
      )}
    </div>
  )

  return (
    <div className={cn('flex h-screen overflow-hidden', needsFallbackFade() && 'animate-fade-in')}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* Sidebar เดสก์ท็อป */}
      <aside className={cn('hidden shrink-0 flex-col border-r border-line bg-sand-50/70 px-3 py-4 transition-[width] duration-200 lg:flex', collapsed ? 'w-[76px]' : 'w-64')}>
        <div className="mb-6 px-1">{brand(collapsed)}</div>
        {nav(collapsed)}
        <div className="mt-auto space-y-2 pt-4">
          {!collapsed && (
            <div className="rounded-xl border border-amber2-100 bg-amber2-50 p-3 text-xs leading-relaxed text-amber2-700">
              ข้อมูลทั้งหมดเป็นข้อมูลสมมติเพื่อการสาธิต การเปลี่ยนแปลงจะหายเมื่อรีเฟรชหน้า
            </div>
          )}
          <Button variant="ghost" className={cn('w-full', collapsed ? 'px-0' : 'justify-start')} onClick={() => setResetOpen(true)} title="รีเซ็ตข้อมูลเดโม" aria-label="รีเซ็ตข้อมูลเดโม">
            <RotateCcw size={16} />
            {!collapsed && 'รีเซ็ตข้อมูลเดโม'}
          </Button>
          <Button variant="ghost" className={cn('w-full', collapsed ? 'px-0' : 'justify-start')} onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}>
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            {!collapsed && 'ย่อเมนู'}
          </Button>
        </div>
      </aside>

      {/* เมนูมือถือ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-in flex-col bg-canvas px-3 py-4 shadow-pop">
            <div className="mb-5 flex items-center justify-between px-1">
              {brand(false)}
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู" className="rounded-lg p-2 hover:bg-sand-100">
                <X size={18} />
              </button>
            </div>
            {nav(false, () => setMobileOpen(false))}
            <div className="mt-auto pt-4">
              <Button variant="secondary" className="w-full" onClick={() => { setMobileOpen(false); setResetOpen(true) }}>
                <RotateCcw size={16} /> รีเซ็ตข้อมูลเดโม
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 bg-amber2-50 px-4 py-1.5 text-center text-xs text-amber2-700">
          <span className="font-semibold">โหมดสาธิต</span>
          <span className="hidden sm:inline">ข้อมูลสมมติทั้งหมด · การเปลี่ยนแปลงไม่ถูกบันทึกถาวร และจะรีเซ็ตเมื่อรีเฟรชหน้า</span>
          <span className="sm:hidden">ข้อมูลสมมติ · ไม่บันทึกถาวร</span>
          <button type="button" onClick={() => setResetOpen(true)} className="font-semibold underline underline-offset-2 hover:text-amber2-600">
            รีเซ็ตข้อมูล
          </button>
        </div>

        <header className="flex flex-wrap items-center gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-2 hover:bg-sand-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-ink" aria-hidden="true">{title}</p>
            <p className="hidden truncate text-xs text-ink-muted sm:block">
              {fmtDateLong(DEMO_TODAY)} · เวลาเดโม {DEMO_NOW} น.
            </p>
          </div>
          {RANGE_PAGES.includes(pathname) ? (
            <div className="order-[99] w-full sm:order-none sm:w-auto">
              <DateRangePicker />
            </div>
          ) : (
            <span className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft sm:inline-flex">
              <CalendarDays size={15} className="text-sage-500" /> วันนี้ · {fmtDateLong(DEMO_TODAY).replace('วัน', '')}
            </span>
          )}
          <ViewSwitch current="admin" className="order-[98] w-full sm:order-none sm:w-auto" />
          <Notifications />
        </header>

        <main id="main" ref={mainRef} className="scroll-thin flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8" tabIndex={-1}>
          <div className="mx-auto max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="รีเซ็ตข้อมูลเดโม"
        message="ข้อมูลทั้งหมดจะกลับเป็นข้อมูลตั้งต้น การจอง ลูกค้า และงานที่คุณเพิ่มหรือแก้ไขจะหายไป"
        confirmLabel="รีเซ็ตข้อมูล"
        onConfirm={() => {
          resetDemo()
          setGuideApptId(null)
          toast('รีเซ็ตข้อมูลเดโมเรียบร้อยแล้ว', 'info')
        }}
      />
      <Toaster />
    </div>
  )
}

function Notifications() {
  const { data } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const alerts = useMemo(() => buildAlerts(data), [data])
  const urgent = alerts.filter((a) => a.level === 'high').length

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`การแจ้งเตือน ${alerts.length} รายการ`}
        className="relative rounded-lg border border-line bg-white p-2.5 text-ink-soft transition-colors hover:bg-sand-50"
      >
        <Bell size={18} />
        {alerts.length > 0 && (
          <span className={cn('absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold text-white', urgent ? 'bg-clay-500' : 'bg-sage-600')}>
            {alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-rise rounded-xl border border-line bg-white shadow-pop">
          <p className="border-b border-line px-4 py-3 text-sm font-semibold">การแจ้งเตือนวันนี้</p>
          {alerts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">ไม่มีเรื่องที่ต้องดำเนินการ</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      navigate(a.href)
                    }}
                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-sand-50"
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.level === 'high' ? 'bg-clay-500' : a.level === 'medium' ? 'bg-amber2-500' : 'bg-sky2-500')} />
                    <span>
                      <span className="block text-sm font-medium text-ink">{a.title}</span>
                      <span className="block text-xs text-ink-muted">{a.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
