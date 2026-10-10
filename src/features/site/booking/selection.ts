import type { Service } from '@/types'
import { endTimeFor, getService } from '@/lib/conflicts'
import { getPromotion, type Promotion } from '../content/promotions'
import { getTreatment, type Treatment } from '../content/treatments'
import type { BookingState } from './bookingState'

export interface Selection {
  treatment?: Treatment
  service?: Service
  promo?: Promotion
  /** ราคาที่จะบันทึก: ราคาโปรโมชันถ้าเลือกมาจากโปรโมชัน ไม่เช่นนั้นราคาปกติ */
  price: number
  end?: string
}

export function describeSelection(s: Pick<BookingState, 'treatmentId' | 'serviceId' | 'promoId' | 'start'>): Selection {
  const treatment = getTreatment(s.treatmentId)
  const service = s.serviceId ? getService(s.serviceId) : undefined
  const promo = getPromotion(s.promoId)
  const activePromo = promo && promo.serviceId === service?.id ? promo : undefined
  return {
    treatment,
    service,
    promo: activePromo,
    price: activePromo?.promoPrice ?? service?.price ?? 0,
    end: service && s.start ? endTimeFor(service.id, s.start) : undefined,
  }
}
