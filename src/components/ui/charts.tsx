import type { ReactNode } from 'react'

export const CHART = {
  sage: '#6B8A64',
  sageLight: '#C8D5C2',
  sand: '#D6C9AC',
  clay: '#C06A4B',
  amber: '#C9962B',
  sky: '#5B8FA0',
  ink: '#2B2B28',
  grid: '#EEE9DC',
  axis: '#76766E',
}

export const axisProps = { tick: { fill: CHART.axis, fontSize: 12 }, tickLine: false, axisLine: { stroke: CHART.grid } } as const

interface PayloadItem {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

/** กล่องข้อความแสดงรายละเอียดเมื่อเลื่อนเมาส์บนกราฟ (ภาษาไทย) */
export function ChartTooltip({
  active,
  payload,
  label,
  format,
  title,
  extra,
}: {
  active?: boolean
  payload?: PayloadItem[]
  label?: string | number
  format?: (v: number, name: string) => string
  title?: (label: string | number | undefined, payload: PayloadItem[]) => string
  extra?: (payload: PayloadItem[]) => ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-ink">{title ? title(label, payload) : label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-ink">{format ? format(Number(p.value), String(p.name)) : p.value}</span>
        </p>
      ))}
      {extra?.(payload)}
    </div>
  )
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
