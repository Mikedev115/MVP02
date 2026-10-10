import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/format'

interface Props {
  children: ReactNode
  /** หน่วงเวลา (ms) เพื่อให้องค์ประกอบทยอยปรากฏ */
  delay?: number
  as?: ElementType
  className?: string
}

/** เปิดเผยเนื้อหาเมื่อเลื่อนมาถึง — ถ้าไม่มี IntersectionObserver จะแสดงทันที */
export function Reveal({ children, delay = 0, as: Tag = 'div', className }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [visible])

  return (
    <Tag ref={ref} className={cn('reveal', visible && 'is-visible', className)} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}
