import { createContext, useCallback, useContext, useMemo, useReducer, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookingDialog } from './BookingDialog'
import { bookingReducer, initialBooking } from './bookingState'
import { treatmentForService } from '../content/treatments'

export interface OpenBookingOptions {
  serviceId?: string
  treatmentId?: string
  promoId?: string
}

interface BookingApi {
  openBooking: (opts?: OpenBookingOptions) => void
}

const Ctx = createContext<BookingApi | null>(null)

/** เก็บสถานะการจองไว้ที่เดียว เพื่อให้ปุ่ม "จองคิว" ทุกจุดในหน้าเปิดหน้าต่างเดียวกันได้ */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [state, dispatch] = useReducer(bookingReducer, undefined, () => initialBooking())
  const navigate = useNavigate()

  const openBooking = useCallback((opts: OpenBookingOptions = {}) => {
    const treatmentId = opts.treatmentId ?? treatmentForService(opts.serviceId)?.id
    dispatch({ type: 'start', treatmentId, serviceId: opts.serviceId, promoId: opts.promoId })
    setOpen(true)
  }, [])

  const api = useMemo(() => ({ openBooking }), [openBooking])

  return (
    <Ctx.Provider value={api}>
      {children}
      <BookingDialog
        open={open}
        state={state}
        dispatch={dispatch}
        onClose={() => setOpen(false)}
        onOpenAdmin={(href) => {
          setOpen(false)
          navigate(href)
        }}
      />
    </Ctx.Provider>
  )
}

export function useBooking(): BookingApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useBooking must be used inside BookingProvider')
  return v
}
