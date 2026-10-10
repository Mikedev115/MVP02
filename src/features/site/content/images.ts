/** รูปจาก Unsplash (ใช้ได้ฟรีตาม Unsplash License) — ถ้าโหลดไม่ได้ SpaImage จะแสดงพื้นหลังสำรองแทน */
const BASE = 'https://images.unsplash.com/photo-'

export const IMAGE_IDS = {
  bath: '1507652313519-d4e9174996dd',
  oil: '1515377905703-c4788e51af15',
  neck: '1519823551278-64ac92734fb1',
  towel: '1540555700478-4be289fbecef',
  scalpMask: '1570172619644-dfd03ed5d881',
  restBw: '1591343395082-e120087004b4',
  hairWash: '1595476108010-b4d1f102b1b1',
  headMassage: '1596178060671-7a80dc8059ea',
  stones: '1600334089648-b0d9d3028eb2',
  stonesBack: '1600334129128-685c5582fd35',
  candles: '1620733723572-11c53f73a416',
} as const

export type ImageKey = keyof typeof IMAGE_IDS

export function imageUrl(key: ImageKey, width = 1200): string {
  return `${BASE}${IMAGE_IDS[key]}?auto=format&fit=crop&w=${width}&q=70`
}
