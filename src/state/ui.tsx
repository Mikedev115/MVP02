import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DateRange } from '@/types'
import { DEMO_TODAY, addDays, endOfMonth, startOfMonth } from '@/lib/date'

export type RangePreset = 'today' | '7d' | '30d' | '90d' | 'month' | 'lastMonth' | 'all' | 'custom'

export const PRESET_LABEL: Record<RangePreset, string> = {
  today: 'วันนี้',
  '7d': '7 วันล่าสุด',
  '30d': '30 วันล่าสุด',
  '90d': '90 วันล่าสุด',
  month: 'เดือนนี้',
  lastMonth: 'เดือนที่แล้ว',
  all: 'ตั้งแต่เริ่มระบบ',
  custom: 'กำหนดเอง',
}

export const DATA_START = '2026-06-01'

export function presetRange(p: RangePreset): DateRange {
  switch (p) {
    case 'today': return { from: DEMO_TODAY, to: DEMO_TODAY }
    case '7d': return { from: addDays(DEMO_TODAY, -6), to: DEMO_TODAY }
    case '30d': return { from: addDays(DEMO_TODAY, -29), to: DEMO_TODAY }
    case '90d': return { from: addDays(DEMO_TODAY, -89), to: DEMO_TODAY }
    case 'month': return { from: startOfMonth(DEMO_TODAY), to: DEMO_TODAY }
    case 'lastMonth': {
      const prev = addDays(startOfMonth(DEMO_TODAY), -1)
      return { from: startOfMonth(prev), to: endOfMonth(prev) }
    }
    case 'all': return { from: DATA_START, to: DEMO_TODAY }
    default: return { from: addDays(DEMO_TODAY, -29), to: DEMO_TODAY }
  }
}

export interface Toast { id: number; tone: 'success' | 'error' | 'info'; text: string }

interface UiValue {
  preset: RangePreset
  range: DateRange
  setPreset: (p: RangePreset) => void
  setCustomRange: (r: DateRange) => void
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  /** การจองที่สร้างจากไกด์เดโม ใช้ติดตามขั้นตอน */
  guideApptId: string | null
  setGuideApptId: (id: string | null) => void
  guideOpen: boolean
  setGuideOpen: (v: boolean) => void
}

const Ctx = createContext<UiValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<RangePreset>('30d')
  const [range, setRange] = useState<DateRange>(presetRange('30d'))
  const [toasts, setToasts] = useState<Toast[]>([])
  const [guideApptId, setGuideApptId] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-3), { id, tone, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3500)
  }, [])

  const value = useMemo<UiValue>(
    () => ({
      preset,
      range,
      setPreset: (p) => {
        setPresetState(p)
        if (p !== 'custom') setRange(presetRange(p))
      },
      setCustomRange: (r) => {
        setPresetState('custom')
        setRange(r)
      },
      toasts,
      toast,
      dismissToast,
      guideApptId,
      setGuideApptId,
      guideOpen,
      setGuideOpen,
    }),
    [preset, range, toasts, toast, dismissToast, guideApptId, guideOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUi(): UiValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useUi must be used inside UiProvider')
  return v
}
