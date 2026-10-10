import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

interface ViewTransitionHandle {
  ready: Promise<void>
  finished: Promise<void>
  updateCallbackDone: Promise<void>
}
type ViewTransitionDoc = Document & { startViewTransition?: (update: () => void) => ViewTransitionHandle }

/** เบราว์เซอร์รองรับ View Transition และผู้ใช้ไม่ได้ขอลดการเคลื่อนไหว */
export function canViewTransition(): boolean {
  if (typeof document === 'undefined') return false
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return !reduce && typeof (document as ViewTransitionDoc).startViewTransition === 'function'
}

/** ไม่รองรับ View Transition: ให้หน้าใหม่ fade-in เองแทน */
export const needsFallbackFade = (): boolean => typeof document !== 'undefined' && typeof (document as ViewTransitionDoc).startViewTransition !== 'function'

/** navigate ที่ครอสเฟดระหว่างหน้า (ใช้เมื่อสลับหน้าบ้าน/หลังบ้าน) */
export function useViewNavigate() {
  const navigate = useNavigate()
  return (to: string) => {
    if (!canViewTransition()) {
      navigate(to)
      return
    }
    const t = (document as ViewTransitionDoc).startViewTransition!(() => flushSync(() => navigate(to)))
    // กดสลับรัว ๆ แล้ว transition เก่าถูกข้าม — ไม่ใช่ข้อผิดพลาด จึงกลืน rejection ไว้
    for (const p of [t.ready, t.finished, t.updateCallbackDone]) p.catch(() => {})
  }
}
