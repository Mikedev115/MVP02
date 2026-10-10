import { describe, expect, it } from 'vitest'
import { buildSeedData } from '@/data/seed'
import { DEMO_NOW, DEMO_TODAY, addDays, toMin } from '@/lib/date'
import { bookingReducer, initialBooking } from './bookingState'
import { bookableDates, groupSlots, slotsFor } from './slots'
import { EMPTY_DETAILS, formatPhone, hasErrors, isThaiMobile, validateDetails } from './validation'

const valid = { ...EMPTY_DETAILS, name: 'สมศรี ตัวอย่าง', phone: '081-234-5678', agree: true }

describe('validateDetails', () => {
  it('ยอมรับข้อมูลที่ถูกต้อง', () => {
    expect(hasErrors(validateDetails(valid))).toBe(false)
  })
  it('ต้องกรอกชื่อ เบอร์ และติ๊กรับทราบ', () => {
    const e = validateDetails(EMPTY_DETAILS)
    expect(Object.keys(e).sort()).toEqual(['agree', 'name', 'phone'])
  })
  it('ตรวจรูปแบบเบอร์มือถือไทย', () => {
    expect(isThaiMobile('081-234-5678')).toBe(true)
    expect(isThaiMobile('0212345678')).toBe(false)
    expect(isThaiMobile('08123456')).toBe(false)
    expect(validateDetails({ ...valid, phone: '12345' }).phone).toBeTruthy()
  })
  it('ตรวจ LINE ID เมื่อกรอก แต่ไม่บังคับ', () => {
    expect(validateDetails({ ...valid, lineId: '' }).lineId).toBeUndefined()
    expect(validateDetails({ ...valid, lineId: '@ab' }).lineId).toBeTruthy()
    expect(validateDetails({ ...valid, lineId: '@sample-id' }).lineId).toBeUndefined()
  })
  it('จัดรูปแบบเบอร์ขณะพิมพ์', () => {
    expect(formatPhone('0812345678')).toBe('081-234-5678')
    expect(formatPhone('08a1')).toBe('081')
  })
})

describe('bookingReducer', () => {
  it('เริ่มจากบริการที่เลือกไว้แล้วจะข้ามไปขั้นเลือกเวลา', () => {
    const s = bookingReducer(initialBooking(), { type: 'start', treatmentId: 'zen-head-spa', serviceId: 'sv-zen60' })
    expect(s.step).toBe('time')
    expect(s.serviceId).toBe('sv-zen60')
  })
  it('เปลี่ยนบริการหรือวันที่แล้วล้างเวลาที่เลือกไว้', () => {
    let s = bookingReducer(initialBooking(), { type: 'start', treatmentId: 'zen-head-spa', serviceId: 'sv-zen60' })
    s = bookingReducer(s, { type: 'date', date: DEMO_TODAY })
    s = bookingReducer(s, { type: 'time', start: '18:00' })
    expect(bookingReducer(s, { type: 'service', serviceId: 'sv-zen90' }).start).toBeNull()
    expect(bookingReducer(s, { type: 'date', date: addDays(DEMO_TODAY, 1) }).start).toBeNull()
  })
  it('จองอีกครั้งแล้วเก็บข้อมูลติดต่อไว้', () => {
    let s = bookingReducer(initialBooking(), { type: 'details', patch: valid })
    s = bookingReducer(s, { type: 'another' })
    expect(s.details.name).toBe(valid.name)
    expect(s.serviceId).toBeNull()
    expect(s.step).toBe('service')
  })
})

describe('slotsFor', () => {
  const { appointments } = buildSeedData()

  it('จองล่วงหน้าได้ 14 วันนับจากวันนี้', () => {
    const dates = bookableDates()
    expect(dates).toHaveLength(14)
    expect(dates[0]).toBe(DEMO_TODAY)
  })
  it('วันนี้ไม่แสดงเวลาที่ผ่านไปแล้ว', () => {
    const slots = slotsFor(appointments, 'sv-wash60', DEMO_TODAY)
    expect(slots.every((t) => toMin(t) >= toMin(DEMO_NOW))).toBe(true)
  })
  it('เวลาที่แสดงทุกช่องจบก่อนร้านปิด และจัดกลุ่มตามช่วงวัน', () => {
    const slots = slotsFor(appointments, 'sv-ritual120', addDays(DEMO_TODAY, 3))
    expect(slots.length).toBeGreaterThan(0)
    expect(toMin(slots[slots.length - 1]) + 120).toBeLessThanOrEqual(22 * 60)
    expect(groupSlots(['10:00', '13:00', '18:30']).map((g) => g.label)).toEqual(['ช่วงเช้า', 'ช่วงบ่าย', 'ช่วงเย็น'])
  })
})
