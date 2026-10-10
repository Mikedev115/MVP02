import { SOURCE_LABEL, STAFF } from '@/data/catalog'
import type { AcquisitionSource, AppData, DateRange } from '@/types'
import { backToBackCount, apptsInRange, categoryRevenue, hourStats, roomUtilization, serviceStats, staffUtilization, weekdayStats, type CustomerStats } from './metrics'
import { bookingsLink, customersLink } from './links'
import { DEMO_TODAY, addDays, dayOfWeek, eachDay, fmtDate, fmtDayMonth, inRange, startOfWeek } from './date'
import { fmtPercent, fmtTHB, sum } from './format'

export type InsightCategory = 'revenue' | 'demand' | 'customers' | 'marketing' | 'operations'

export interface Insight {
  id: string
  category: InsightCategory
  priority: 'high' | 'medium' | 'low'
  title: string
  finding: string
  evidence: { label: string; value: string }[]
  action: string
  link?: { to: string; label: string }
}

export const INSIGHT_CATEGORY_LABEL: Record<InsightCategory, string> = {
  revenue: 'รายได้',
  demand: 'ช่วงเวลาที่มีคนจอง',
  customers: 'กลุ่มลูกค้า',
  marketing: 'ช่องทางการตลาด',
  operations: 'การดำเนินงาน',
}

/** ข้อเสนอแนะเชิงกฎ (deterministic) ที่คำนวณจากข้อมูลชุดเดียวกับทั้งระบบ ไม่ใช้ AI */
export function buildInsights(data: AppData, stats: Map<string, CustomerStats>, range: DateRange): Insight[] {
  const out: Insight[] = []
  const appts = apptsInRange(data.appointments, range)
  if (appts.length < 10) return out

  /* 1) บริการที่สร้างรายได้สูงสุด */
  const svc = serviceStats(appts)
  const cats = categoryRevenue(appts)
  const totalRev = sum(svc.map((s) => s.revenue))
  if (svc.length >= 2 && totalRev > 0) {
    const topRev = svc.slice().sort((a, b) => b.revenue - a.revenue)
    const t = topRev[0]
    const share = t.revenue / totalRev
    out.push({
      id: 'top-revenue-service',
      category: 'revenue',
      priority: 'medium',
      title: `"${t.name}" สร้างรายได้สูงสุด`,
      finding: `บริการนี้ทำรายได้ ${fmtTHB(t.revenue)} หรือ ${fmtPercent(share)} ของรายได้ในช่วงที่เลือก จาก ${t.count} ครั้ง`,
      evidence: [...topRev.slice(0, 3).map((s) => ({ label: s.name, value: `${fmtTHB(s.revenue)} (${s.count} ครั้ง)` })), ...(cats[0] ? [{ label: `หมวดสูงสุด: ${cats[0].label}`, value: fmtTHB(cats[0].revenue) }] : [])],
      action: 'จัดตำแหน่งบริการนี้เป็นตัวหลักในโปรโมชัน และเสนอบริการเสริมหรืออัปเกรดเวลา (เช่น 60 → 90 นาที) ตอนยืนยันนัด',
      link: { to: bookingsLink({ service: t.id, status: 'completed', range }), label: 'ดูการจองของบริการนี้' },
    })
    // ขายดีแต่ราคาต่อครั้งต่ำ
    const byCount = svc[0]
    if (byCount.id !== t.id) {
      out.push({
        id: 'volume-vs-revenue',
        category: 'revenue',
        priority: 'low',
        title: `"${byCount.name}" ขายได้จำนวนครั้งมากสุด แต่ไม่ใช่บริการที่ทำรายได้สูงสุด`,
        finding: `ขายได้ ${byCount.count} ครั้ง รายได้ ${fmtTHB(byCount.revenue)} ขณะที่ "${t.name}" ทำรายได้ ${fmtTHB(t.revenue)}`,
        evidence: [{ label: 'ราคา/ครั้ง (ขายดีสุด)', value: fmtTHB(byCount.revenue / byCount.count) }, { label: 'ราคา/ครั้ง (รายได้สูงสุด)', value: fmtTHB(t.revenue / t.count) }],
        action: 'ลองเสนอแพ็กเกจรวมหรือเวลาให้บริการที่นานขึ้นให้ลูกค้ากลุ่มนี้ เพื่อเพิ่มรายได้ต่อครั้งโดยไม่ต้องหาลูกค้าเพิ่ม',
      })
    }
  }

  /* 2) ช่วงเวลาที่ความต้องการสูง/ต่ำ */
  const days = eachDay(range)
  const wk = weekdayStats(appts).map((w) => ({ ...w, occurrences: days.filter((d) => dayOfWeek(d) === w.dow).length }))
  const withAvg = wk.filter((w) => w.occurrences > 0).map((w) => ({ ...w, avg: w.bookings / w.occurrences }))
  const hrs = hourStats(appts)
  if (withAvg.length >= 3) {
    const busiest = withAvg.slice().sort((a, b) => b.avg - a.avg)[0]
    const quietest = withAvg.slice().sort((a, b) => a.avg - b.avg)[0]
    const topHours = hrs.slice().sort((a, b) => b.bookings - a.bookings).slice(0, 3).map((h) => h.hour).sort((a, b) => a - b)
    const quietHours = hrs.filter((h) => h.hour <= 15).sort((a, b) => a.bookings - b.bookings)[0]
    out.push({
      id: 'peak-demand',
      category: 'demand',
      priority: 'high',
      title: `ช่วงที่คนจองมากสุดคือวัน${busiest.label} และช่วง ${String(topHours[0]).padStart(2, '0')}:00–${String(topHours[topHours.length - 1] + 1).padStart(2, '0')}:00 น.`,
      finding: `วัน${busiest.label}มีเฉลี่ย ${busiest.avg.toFixed(1)} คิว/วัน ขณะที่วัน${quietest.label}มีเพียง ${quietest.avg.toFixed(1)} คิว/วัน (${quietHours ? `ช่วงบ่ายต้นที่เงียบสุดคือ ${quietHours.label} น.` : ''})`,
      evidence: [
        ...withAvg.slice().sort((a, b) => b.avg - a.avg).slice(0, 3).map((w) => ({ label: `วัน${w.label}`, value: `${w.avg.toFixed(1)} คิว/วัน` })),
        { label: 'ชั่วโมงยอดนิยม', value: topHours.map((h) => `${h}:00`).join(', ') },
      ],
      action: `จัดพนักงานให้ครบในช่วงยอดนิยม และทำโปรโมชันช่วงเงียบ (เช่น วัน${quietest.label}ก่อน 15:00 ลด 10–15%) เพื่อกระจายคิวและใช้เตียงให้เต็มขึ้น`,
      link: { to: '/marketing', label: 'ดูแผนที่ความหนาแน่น' },
    })
  }

  /* 3) กลุ่มลูกค้าที่กลับมาบ่อย */
  const served = [...stats.values()].filter((s) => s.visits >= 1 && s.customer.createdAt <= range.to)
  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'] as const
  const ageRows = ageGroups
    .map((g) => {
      const list = served.filter((s) => s.customer.ageGroup === g)
      const repeat = list.filter((s) => s.visits >= 2).length
      return { g, n: list.length, repeat, rate: list.length ? repeat / list.length : 0 }
    })
    .filter((r) => r.n >= 8)
    .sort((a, b) => b.rate - a.rate)
  if (ageRows.length >= 2) {
    const best = ageRows[0]
    const worst = ageRows[ageRows.length - 1]
    out.push({
      id: 'age-repeat',
      category: 'customers',
      priority: 'medium',
      title: `ลูกค้าอายุ ${best.g} ปี กลับมาใช้บริการซ้ำมากที่สุด`,
      finding: `${fmtPercent(best.rate)} ของลูกค้ากลุ่มนี้ใช้บริการตั้งแต่ 2 ครั้ง เทียบกับ ${fmtPercent(worst.rate)} ในกลุ่มอายุ ${worst.g} ปี`,
      evidence: ageRows.map((r) => ({ label: `อายุ ${r.g} ปี (${r.n} ราย)`, value: fmtPercent(r.rate) })),
      action: `ออกบัตรสะสมหรือโปรโมชันครั้งที่ 2 สำหรับกลุ่ม ${worst.g} ปี และสื่อสารด้วยช่องทางที่กลุ่ม ${best.g} ปีใช้บ่อย`,
      link: { to: customersLink({ age: best.g }), label: 'ดูลูกค้ากลุ่มนี้' },
    })
  }

  /* 4) ช่องทางที่พาลูกค้ากลับมาซ้ำ */
  const sources = Object.keys(SOURCE_LABEL) as AcquisitionSource[]
  const srcRows = sources
    .map((s) => {
      const list = served.filter((x) => x.customer.source === s)
      const repeat = list.filter((x) => x.visits >= 2).length
      return { s, n: list.length, repeat, rate: list.length ? repeat / list.length : 0 }
    })
    .filter((r) => r.n >= 8)
    .sort((a, b) => b.rate - a.rate)
  if (srcRows.length >= 2) {
    const best = srcRows[0]
    const worst = srcRows[srcRows.length - 1]
    out.push({
      id: 'source-repeat',
      category: 'marketing',
      priority: 'high',
      title: `ลูกค้าจาก ${SOURCE_LABEL[best.s]} กลับมาซ้ำสูงสุด (${fmtPercent(best.rate)})`,
      finding: `ลูกค้าจาก ${SOURCE_LABEL[worst.s]} กลับมาซ้ำเพียง ${fmtPercent(worst.rate)} แม้จะมีลูกค้า ${worst.n} ราย`,
      evidence: srcRows.map((r) => ({ label: `${SOURCE_LABEL[r.s]} (${r.n} ราย)`, value: `${r.repeat} ราย กลับมาซ้ำ ${fmtPercent(r.rate)}` })),
      action: `เพิ่มความสำคัญกับ ${SOURCE_LABEL[best.s]} และทดลองข้อเสนอ "จองครั้งต่อไปภายใน 30 วัน" ให้ลูกค้าใหม่จาก ${SOURCE_LABEL[worst.s]}`,
      link: { to: customersLink({ source: best.s }), label: `ดูลูกค้าจาก ${SOURCE_LABEL[best.s]}` },
    })
  }

  /* 4.1) ช่องทางที่พาลูกค้ามามากแต่กลับมาซ้ำต่ำกว่าค่าเฉลี่ย */
  if (srcRows.length >= 3) {
    const overall = srcRows.reduce((n, r) => n + r.repeat, 0) / Math.max(1, srcRows.reduce((n, r) => n + r.n, 0))
    const biggest = srcRows.slice().sort((a, b) => b.n - a.n)[0]
    if (biggest.rate < overall * 0.85) {
      out.push({
        id: 'volume-vs-repeat',
        category: 'marketing',
        priority: 'high',
        title: `${SOURCE_LABEL[biggest.s]} พาลูกค้ามามากสุด แต่กลับมาซ้ำต่ำกว่าค่าเฉลี่ย`,
        finding: `${biggest.n} ราย (มากสุด) แต่กลับมาซ้ำ ${fmtPercent(biggest.rate)} ขณะที่ค่าเฉลี่ยทุกช่องทาง ${fmtPercent(overall)} — ลูกค้าเข้ามาเพราะกระแส แต่ยังไม่ถูกดึงให้กลับมา`,
        evidence: srcRows.map((r) => ({ label: `${SOURCE_LABEL[r.s]} (${r.n} ราย)`, value: fmtPercent(r.rate) })),
        action: `ให้พนักงานเสนอ "จองครั้งต่อไป" หรือแจกคูปองใช้ภายใน 30 วันกับลูกค้าที่มาจาก ${SOURCE_LABEL[biggest.s]} ตั้งแต่ครั้งแรก`,
        link: { to: customersLink({ source: biggest.s, segment: 'new' }), label: `ดูลูกค้าใหม่จาก ${SOURCE_LABEL[biggest.s]}` },
      })
    }
  }

  /* 4.2) สัปดาห์ที่ลูกค้าใหม่จากช่องทางใดช่องทางหนึ่งพุ่งสูงผิดปกติ */
  {
    const weeks = new Map<string, Map<AcquisitionSource, number>>()
    for (const c of data.customers) {
      if (!inRange(c.createdAt, range)) continue
      const w = startOfWeek(c.createdAt)
      const m = weeks.get(w) ?? new Map<AcquisitionSource, number>()
      m.set(c.source, (m.get(c.source) ?? 0) + 1)
      weeks.set(w, m)
    }
    const weekKeys = [...weeks.keys()].sort()
    if (weekKeys.length >= 4) {
      let best: { s: AcquisitionSource; w: string; n: number; median: number } | null = null
      for (const s of sources) {
        const series = weekKeys.map((w) => weeks.get(w)?.get(s) ?? 0)
        series.forEach((n, i) => {
          const rest = series.filter((_, j) => j !== i).sort((a, b) => a - b)
          const median = rest[Math.floor(rest.length / 2)] ?? 0
          if (n >= 8 && n >= Math.max(2, median) * 2 && (!best || n / Math.max(1, median) > best.n / Math.max(1, best.median))) best = { s, w: weekKeys[i], n, median }
        })
      }
      if (best) {
        const b: { s: AcquisitionSource; w: string; n: number; median: number } = best
        out.push({
          id: 'channel-spike',
          category: 'marketing',
          priority: 'high',
          title: `ลูกค้าใหม่จาก ${SOURCE_LABEL[b.s]} พุ่งสูงในสัปดาห์ที่เริ่ม ${fmtDayMonth(b.w)}`,
          finding: `สัปดาห์นั้นมีลูกค้าใหม่จาก ${SOURCE_LABEL[b.s]} ${b.n} ราย สูงกว่าค่ากลางของสัปดาห์อื่น (${b.median} ราย) ประมาณ ${(b.n / Math.max(1, b.median)).toFixed(1)} เท่า`,
          evidence: weekKeys.map((w) => ({ label: `สัปดาห์เริ่ม ${fmtDayMonth(w)}`, value: `${weeks.get(w)?.get(b.s) ?? 0} ราย` })),
          action: `ย้อนดูว่าสัปดาห์นั้นลงคอนเทนต์หรือโปรโมชันอะไรบน ${SOURCE_LABEL[b.s]} แล้วทำซ้ำในรูปแบบเดียวกัน พร้อมเตรียมช่างและเตียงรองรับช่วงที่คนจองพุ่ง`,
          link: { to: '/marketing', label: 'ดูกราฟลูกค้าใหม่ในหน้าการตลาด' },
        })
      }
    }
  }

  /* 5) รูปแบบที่ทำให้เกิดปัญหา: ยกเลิก/ไม่มาตามนัด */
  const bad = appts.filter((a) => a.status === 'cancelled' || a.status === 'no_show')
  const overallBad = bad.length / appts.length
  const customerSource = new Map(data.customers.map((c) => [c.id, c.source]))
  const srcBad = sources
    .map((s) => {
      const list = appts.filter((a) => customerSource.get(a.customerId) === s)
      const ns = list.filter((a) => a.status === 'no_show').length
      return { s, n: list.length, ns, rate: list.length ? ns / list.length : 0 }
    })
    .filter((r) => r.n >= 25)
    .sort((a, b) => b.rate - a.rate)
  const dayBad = wk.filter((w) => w.total >= 25).map((w) => ({ ...w, rate: (w.cancelled + w.noShow) / w.total })).sort((a, b) => b.rate - a.rate)
  if (srcBad.length && srcBad[0].rate > 0.05) {
    const w = srcBad[0]
    out.push({
      id: 'noshow-source',
      category: 'operations',
      priority: 'high',
      title: `ลูกค้าจาก ${SOURCE_LABEL[w.s]} มีอัตราไม่มาตามนัดสูงสุด`,
      finding: `${w.ns} จาก ${w.n} การจอง (${fmtPercent(w.rate)}) ไม่มาตามนัด สูงกว่าช่องทางอื่น ทำให้ช่วงเวลานั้นว่างโดยไม่ได้รายได้`,
      evidence: srcBad.slice(0, 4).map((r) => ({ label: SOURCE_LABEL[r.s], value: `${fmtPercent(r.rate)} (${r.ns}/${r.n})` })),
      action: 'ส่งข้อความยืนยันล่วงหน้า 1 วัน และโทรยืนยันซ้ำในวันนัดสำหรับการจองใหม่จากช่องทางนี้',
      link: { to: bookingsLink({ status: 'no_show', range }), label: 'ดูรายการที่ไม่มา' },
    })
  }
  if (dayBad.length >= 2 && dayBad[0].rate > overallBad * 1.2) {
    const w = dayBad[0]
    out.push({
      id: 'cancel-weekday',
      category: 'operations',
      priority: 'medium',
      title: `วัน${w.label}มีการยกเลิก/ไม่มาตามนัดสูงกว่าวันอื่น`,
      finding: `${fmtPercent(w.rate)} ของการจองวัน${w.label}ถูกยกเลิกหรือไม่มา เทียบกับภาพรวม ${fmtPercent(overallBad)}`,
      evidence: dayBad.slice(0, 3).map((r) => ({ label: `วัน${r.label}`, value: `${fmtPercent(r.rate)} (${r.cancelled + r.noShow}/${r.total})` })),
      action: `เปิดให้จองเกินเล็กน้อยไม่ได้ในระบบนี้ จึงควรมีรายชื่อสำรองสำหรับวัน${w.label} และยืนยันคิวล่วงหน้าทุกครั้ง`,
    })
  }

  /* 6) ภาระงานของพนักงานและเตียง */
  const su = staffUtilization(data.appointments, range).filter((u) => u.capacityMin > 0).sort((a, b) => b.ratio - a.ratio)
  if (su.length >= 2) {
    const hi = su[0]
    const lo = su[su.length - 1]
    if (hi.ratio - lo.ratio >= 0.2) {
      out.push({
        id: 'staff-balance',
        category: 'operations',
        priority: hi.ratio >= 0.7 ? 'high' : 'medium',
        title: `ภาระงานของพนักงานไม่สมดุล: ${hi.name} ${fmtPercent(hi.ratio)} แต่ ${lo.name} ${fmtPercent(lo.ratio)}`,
        finding: `${hi.name} มีคิวคิดเป็น ${fmtPercent(hi.ratio)} ของเวลากะ ในขณะที่ ${lo.name} ใช้เวลาตามกะเพียง ${fmtPercent(lo.ratio)}`,
        evidence: su.map((u) => ({ label: u.name, value: `${fmtPercent(u.ratio)} · ${u.bookings} คิว` })),
        action: `เมื่อลูกค้าไม่ระบุพนักงาน ให้จัดให้ ${lo.name} ก่อน และพิจารณาปรับกะ เพื่อลดความเสี่ยงที่ ${hi.name} เหนื่อยล้าและคิวล้น`,
        link: { to: bookingsLink({ staff: lo.id, range }), label: `ดูคิวของ ${lo.name}` },
      })
    }
  }
  const b2b = backToBackCount(data.appointments, range, 6)
  if (b2b.length >= 5) {
    const by: Record<string, number> = {}
    b2b.forEach((r) => (by[r.staffId] = (by[r.staffId] ?? 0) + 1))
    const [sid, n] = Object.entries(by).sort((a, b) => b[1] - a[1])[0]
    const nm = STAFF.find((s) => s.id === sid)?.nickname
    out.push({
      id: 'back-to-back',
      category: 'operations',
      priority: 'medium',
      title: `มีวันที่พนักงานรับคิวติดกัน 6 คิวขึ้นไปโดยไม่มีช่วงพัก ${b2b.length} วัน`,
      finding: `${nm} พบบ่อยที่สุด ${n} วัน คิวติดกันเสี่ยงต่อคุณภาพการบริการและเวลาเตรียมเตียง`,
      evidence: b2b.slice(-4).map((r) => ({ label: `${fmtDate(r.date)} · ${STAFF.find((s) => s.id === r.staffId)?.nickname}`, value: `${r.count} คิวติดกัน` })),
      action: 'เว้นช่องว่าง 15 นาทีระหว่างคิวในระบบจอง หรือสลับพนักงานในช่วงที่มีคิวหนาแน่น',
    })
  }
  const ru = roomUtilization(data.appointments, range).sort((a, b) => b.ratio - a.ratio)
  if (ru.length >= 2 && ru[0].ratio > 0.35) {
    const lowest = ru[ru.length - 1]
    out.push({
      id: 'room-usage',
      category: 'operations',
      priority: 'low',
      title: `${ru[0].name} ใช้งานมากสุด ส่วน ${lowest.name} ใช้งานน้อยสุด`,
      finding: `อัตราการใช้เตียง ${fmtPercent(ru[0].ratio)} เทียบกับ ${fmtPercent(lowest.ratio)} (นับจากเวลาเปิดร้านทั้งหมด)`,
      evidence: ru.map((r) => ({ label: r.name, value: fmtPercent(r.ratio) })),
      action: `${lowest.name} ยังมีเวลาว่างมาก ลองโปรโมตแพ็กเกจที่ใช้เตียงประเภทนี้ในช่วงเวลาที่เงียบ`,
    })
  }

  /* 7) ลูกค้าที่ห่างหาย */
  const inactiveValuable = [...stats.values()].filter((s) => s.segment === 'inactive' && s.visits >= 2).sort((a, b) => b.totalSpent - a.totalSpent)
  if (inactiveValuable.length) {
    const top = inactiveValuable.slice(0, 3)
    out.push({
      id: 'winback',
      category: 'customers',
      priority: 'high',
      title: `มีลูกค้าเดิม ${inactiveValuable.length} รายที่เคยมาซ้ำ แต่ไม่ได้กลับมานานกว่า 60 วัน`,
      finding: `กลุ่มนี้เคยใช้จ่ายรวม ${fmtTHB(sum(inactiveValuable.map((s) => s.totalSpent)))} การทักกลับมักได้ผลดีกว่าหาลูกค้าใหม่`,
      evidence: top.map((s) => ({ label: `${s.customer.name} (${s.customer.nickname})`, value: `${fmtTHB(s.totalSpent)} · มาล่าสุด ${s.lastVisit ? fmtDate(s.lastVisit) : '-'}` })),
      action: 'ส่งข้อความทักทายพร้อมสิทธิ์พิเศษที่ใช้ได้ภายใน 14 วัน เริ่มจากรายที่ยอดใช้จ่ายสูงสุด',
      link: { to: customersLink({ segment: 'inactive' }), label: 'ดูรายชื่อลูกค้าที่ห่างหาย' },
    })
  }

  /* 8) คิวที่รอการยืนยัน */
  const soon = addDays(DEMO_TODAY, 2)
  const pend = data.appointments.filter((a) => a.status === 'pending' && a.date >= DEMO_TODAY && a.date <= soon)
  if (pend.length >= 3) {
    out.push({
      id: 'pending-soon',
      category: 'operations',
      priority: 'high',
      title: `มี ${pend.length} คิวใน 2 วันข้างหน้าที่ยังไม่ยืนยัน`,
      finding: `มูลค่ารวม ${fmtTHB(sum(pend.map((a) => a.price)))} หากลูกค้าไม่มาจะเสียรายได้และเวลาว่างของพนักงาน`,
      evidence: [0, 1, 2].map((i) => addDays(DEMO_TODAY, i)).map((d) => ({ label: fmtDate(d), value: `${pend.filter((a) => a.date === d).length} คิว` })),
      action: 'ทยอยโทรหรือส่งข้อความยืนยัน เริ่มจากคิวของวันนี้ก่อน',
      link: { to: '/operations', label: 'ไปที่งานประจำวัน' },
    })
  }

  const order = { high: 0, medium: 1, low: 2 }
  return out.sort((a, b) => order[a.priority] - order[b.priority])
}

