import type { AcquisitionSource } from '@/types'

export interface BookingDetails {
  name: string
  phone: string
  lineId: string
  source: AcquisitionSource
  note: string
  agree: boolean
}

export type DetailField = 'name' | 'phone' | 'lineId' | 'note' | 'agree'
export type DetailErrors = Partial<Record<DetailField, string>>

export const EMPTY_DETAILS: BookingDetails = { name: '', phone: '', lineId: '', source: 'other', note: '', agree: false }

/** ข้อมูลตัวอย่างสำหรับกรอกอัตโนมัติ — เป็นข้อมูลสมมติทั้งหมด */
export const SAMPLE_DETAILS: BookingDetails = {
  name: 'สมศรี ตัวอย่าง',
  phone: '081-234-5678',
  lineId: '',
  source: 'other',
  note: '',
  agree: true,
}

export const digitsOnly = (v: string) => v.replace(/\D/g, '')

/** จัดรูปแบบเบอร์มือถือไทย 10 หลักเป็น 0XX-XXX-XXXX ระหว่างพิมพ์ */
export function formatPhone(v: string): string {
  const d = digitsOnly(v).slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}

export const isThaiMobile = (v: string) => /^0[689]\d{8}$/.test(digitsOnly(v))

const LINE_ID = /^@?[A-Za-z0-9._-]{4,20}$/

export function validateDetails(d: BookingDetails): DetailErrors {
  const errors: DetailErrors = {}
  const name = d.name.trim()
  if (!name) errors.name = 'กรุณากรอกชื่อที่ใช้เรียก'
  else if (name.length < 2) errors.name = 'ชื่อสั้นเกินไป กรุณากรอกอย่างน้อย 2 ตัวอักษร'
  else if (name.length > 60) errors.name = 'ชื่อยาวเกินไป (ไม่เกิน 60 ตัวอักษร)'
  else if (/^[\d\s\-().]+$/.test(name)) errors.name = 'กรุณากรอกชื่อเป็นตัวอักษร'

  if (!digitsOnly(d.phone)) errors.phone = 'กรุณากรอกเบอร์โทรศัพท์'
  else if (!isThaiMobile(d.phone)) errors.phone = 'กรอกเบอร์มือถือ 10 หลักที่ขึ้นต้นด้วย 06, 08 หรือ 09 เช่น 081-234-5678'

  const line = d.lineId.trim()
  if (line && !LINE_ID.test(line)) errors.lineId = 'LINE ID ใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข . _ - ความยาว 4–20 ตัว'

  if (d.note.length > 200) errors.note = 'หมายเหตุยาวเกินไป (ไม่เกิน 200 ตัวอักษร)'
  if (!d.agree) errors.agree = 'กรุณากดรับทราบว่าเป็นการจองเพื่อสาธิต'
  return errors
}

export const hasErrors = (e: DetailErrors) => Object.keys(e).length > 0
