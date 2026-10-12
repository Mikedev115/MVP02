import type { Key } from '@/i18n'
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
/** ค่าเป็นคีย์ของพจนานุกรม (err.*) ให้หน้าจอแปลตามภาษาที่เลือก */
export type DetailErrors = Partial<Record<DetailField, Key>>

export const EMPTY_DETAILS: BookingDetails = { name: '', phone: '', lineId: '', source: 'other', note: '', agree: false }

/** ข้อมูลตัวอย่างสำหรับกรอกอัตโนมัติ — เป็นข้อมูลสมมติทั้งหมด */
export const sampleDetails = (name: string): BookingDetails => ({
  name,
  phone: '081-234-5678',
  lineId: '',
  source: 'other',
  note: '',
  agree: true,
})

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
  if (!name) errors.name = 'err.name.required'
  else if (name.length < 2) errors.name = 'err.name.short'
  else if (name.length > 60) errors.name = 'err.name.long'
  else if (/^[\d\s\-().]+$/.test(name)) errors.name = 'err.name.digits'

  if (!digitsOnly(d.phone)) errors.phone = 'err.phone.required'
  else if (!isThaiMobile(d.phone)) errors.phone = 'err.phone.invalid'

  const line = d.lineId.trim()
  if (line && !LINE_ID.test(line)) errors.lineId = 'err.line.invalid'

  if (d.note.length > 200) errors.note = 'err.note.long'
  if (!d.agree) errors.agree = 'err.agree.required'
  return errors
}

export const hasErrors = (e: DetailErrors) => Object.keys(e).length > 0
