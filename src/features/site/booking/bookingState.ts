import type { Key } from '@/i18n'
import type { HHmm, ISODate } from '@/types'
import { EMPTY_DETAILS, type BookingDetails } from './validation'

export type BookingStep = 'service' | 'time' | 'details' | 'review' | 'done'

export const STEPS: { id: Exclude<BookingStep, 'done'>; label: Key }[] = [
  { id: 'service', label: 'booking.step.service' },
  { id: 'time', label: 'booking.step.time' },
  { id: 'details', label: 'booking.step.details' },
  { id: 'review', label: 'booking.step.review' },
]

export interface BookingConfirmation {
  appointmentId: string
  serviceId: string
  date: ISODate
  start: HHmm
  end: HHmm
  price: number
  customerName: string
  phone: string
  promoId?: string
}

export interface BookingState {
  step: BookingStep
  treatmentId: string | null
  serviceId: string | null
  promoId: string | null
  date: ISODate | null
  start: HHmm | null
  details: BookingDetails
  confirmation: BookingConfirmation | null
}

export type BookingAction =
  | { type: 'start'; treatmentId?: string; serviceId?: string; promoId?: string }
  | { type: 'treatment'; treatmentId: string }
  | { type: 'service'; serviceId: string }
  | { type: 'date'; date: ISODate }
  | { type: 'time'; start: HHmm }
  | { type: 'details'; patch: Partial<BookingDetails> }
  | { type: 'goto'; step: BookingStep }
  | { type: 'confirmed'; confirmation: BookingConfirmation }
  | { type: 'another' }

export const initialBooking = (details: BookingDetails = EMPTY_DETAILS): BookingState => ({
  step: 'service',
  treatmentId: null,
  serviceId: null,
  promoId: null,
  date: null,
  start: null,
  details,
  confirmation: null,
})

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'start': {
      const base = initialBooking(state.details)
      // มีบริการที่เลือกมาจากการ์ด/โปรโมชัน: ข้ามไปเลือกวันและเวลาได้เลย
      if (action.serviceId && action.treatmentId) {
        return { ...base, treatmentId: action.treatmentId, serviceId: action.serviceId, promoId: action.promoId ?? null, step: 'time' }
      }
      return { ...base, treatmentId: action.treatmentId ?? null }
    }
    case 'treatment':
      if (state.treatmentId === action.treatmentId) return state
      // เปลี่ยนบริการ: ตัวเลือกระยะเวลา โปรโมชัน และเวลาที่เลือกไว้ใช้ต่อไม่ได้
      return { ...state, treatmentId: action.treatmentId, serviceId: null, promoId: null, start: null }
    case 'service':
      return { ...state, serviceId: action.serviceId, start: null, promoId: state.serviceId === action.serviceId ? state.promoId : null }
    case 'date':
      return { ...state, date: action.date, start: null }
    case 'time':
      return { ...state, start: action.start }
    case 'details':
      return { ...state, details: { ...state.details, ...action.patch } }
    case 'goto':
      return { ...state, step: action.step }
    case 'confirmed':
      return { ...state, step: 'done', confirmation: action.confirmation }
    case 'another':
      return initialBooking(state.details)
  }
}
