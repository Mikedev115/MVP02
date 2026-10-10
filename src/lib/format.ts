const nf = new Intl.NumberFormat('th-TH')
const pf = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 1 })

export const fmtNumber = (n: number) => nf.format(Math.round(n))
export const fmtTHB = (n: number) => `฿${nf.format(Math.round(n))}`
export const fmtTHBCompact = (n: number) =>
  Math.abs(n) >= 1000 ? `฿${pf.format(n / 1000)}k` : `฿${nf.format(Math.round(n))}`
export const fmtPercent = (ratio: number) => `${pf.format(ratio * 100)}%`
export const fmtDecimal = (n: number) => pf.format(n)

export function fmtDelta(cur: number, prev: number): { text: string; direction: 'up' | 'down' | 'flat' } {
  if (prev === 0) return cur === 0 ? { text: '–', direction: 'flat' } : { text: 'ใหม่', direction: 'up' }
  const d = (cur - prev) / prev
  if (Math.abs(d) < 0.005) return { text: '0%', direction: 'flat' }
  return { text: `${d > 0 ? '+' : ''}${pf.format(d * 100)}%`, direction: d > 0 ? 'up' : 'down' }
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}

export function groupBy<T, K extends string | number>(items: T[], key: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>
  for (const it of items) {
    const k = key(it)
    ;(out[k] ||= []).push(it)
  }
  return out
}
