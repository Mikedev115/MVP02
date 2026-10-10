import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { AppData, Appointment, AppointmentStatus, Customer, OpTask, TaskStatus } from '@/types'
import { buildSeedData } from '@/data/seed'
import { findConflicts, getService } from '@/lib/conflicts'
import { buildCustomerStats, type CustomerStats } from '@/lib/metrics'
import { DEMO_NOW, DEMO_TODAY } from '@/lib/date'

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string }

export type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'price'> & { price?: number }
export type CustomerInput = Omit<Customer, 'id' | 'createdAt'>
export type TaskInput = Omit<OpTask, 'id' | 'completedAt' | 'status'>

type Action =
  | { type: 'reset' }
  | { type: 'appt/add'; appt: Appointment }
  | { type: 'appt/update'; id: string; patch: Partial<Appointment> }
  | { type: 'customer/add'; customer: Customer }
  | { type: 'customer/update'; id: string; patch: Partial<Customer> }
  | { type: 'task/add'; task: OpTask }
  | { type: 'task/status'; id: string; status: TaskStatus }

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'reset':
      return buildSeedData()
    case 'appt/add':
      return { ...state, appointments: [...state.appointments, action.appt] }
    case 'appt/update':
      return { ...state, appointments: state.appointments.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)) }
    case 'customer/add':
      return { ...state, customers: [...state.customers, action.customer] }
    case 'customer/update':
      return { ...state, customers: state.customers.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) }
    case 'task/add':
      return { ...state, tasks: [...state.tasks, action.task] }
    case 'task/status':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, status: action.status, completedAt: action.status === 'done' ? `${DEMO_TODAY}T${DEMO_NOW}` : undefined } : t,
        ),
      }
  }
}

interface StoreValue {
  data: AppData
  customerStats: Map<string, CustomerStats>
  createAppointment: (input: AppointmentInput) => Result<Appointment>
  updateAppointment: (id: string, patch: Partial<Omit<Appointment, 'id'>>) => Result
  setAppointmentStatus: (id: string, status: AppointmentStatus, reason?: string) => Result
  addCustomer: (input: CustomerInput) => Result<Customer>
  updateCustomer: (id: string, patch: Partial<CustomerInput>) => Result
  addTask: (input: TaskInput) => Result<OpTask>
  setTaskStatus: (id: string, status: TaskStatus) => void
  resetDemo: () => void
}

const Ctx = createContext<StoreValue | null>(null)

const nextId = (prefix: string, existing: string[], pad: number) => {
  const max = existing.reduce((m, id) => Math.max(m, Number(id.split('-')[1]) || 0), 0)
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, buildSeedData)
  const customerStats = useMemo(() => buildCustomerStats(data), [data])

  const createAppointment = useCallback<StoreValue['createAppointment']>(
    (input) => {
      const issues = findConflicts(data.appointments, input)
      if (issues.length) return { ok: false, error: issues[0].message }
      const svc = getService(input.serviceId)
      const appt: Appointment = {
        ...input,
        id: nextId('ap', data.appointments.map((a) => a.id), 4),
        price: input.price ?? svc?.price ?? 0,
        createdAt: DEMO_TODAY,
      }
      dispatch({ type: 'appt/add', appt })
      return { ok: true, value: appt }
    },
    [data.appointments],
  )

  const updateAppointment = useCallback<StoreValue['updateAppointment']>(
    (id, patch) => {
      const cur = data.appointments.find((a) => a.id === id)
      if (!cur) return { ok: false, error: 'ไม่พบการจอง' }
      const next = { ...cur, ...patch }
      const issues = findConflicts(data.appointments, next)
      if (issues.length) return { ok: false, error: issues[0].message }
      dispatch({ type: 'appt/update', id, patch })
      return { ok: true, value: undefined }
    },
    [data.appointments],
  )

  const setAppointmentStatus = useCallback<StoreValue['setAppointmentStatus']>(
    (id, status, reason) => {
      const cur = data.appointments.find((a) => a.id === id)
      if (!cur) return { ok: false, error: 'ไม่พบการจอง' }
      if (status === 'completed' && cur.date > DEMO_TODAY) return { ok: false, error: 'ยังไม่ถึงวันนัด จึงยังทำเครื่องหมายว่าเสร็จสิ้นไม่ได้' }
      const next = { ...cur, status }
      const issues = findConflicts(data.appointments, next)
      if (issues.length) return { ok: false, error: `เปิดการจองคืนไม่ได้: ${issues[0].message}` }
      dispatch({ type: 'appt/update', id, patch: { status, cancelReason: status === 'cancelled' ? reason || 'ไม่ระบุเหตุผล' : undefined } })
      return { ok: true, value: undefined }
    },
    [data.appointments],
  )

  const addCustomer = useCallback<StoreValue['addCustomer']>(
    (input) => {
      const customer: Customer = { ...input, id: nextId('cu', data.customers.map((c) => c.id), 3), createdAt: DEMO_TODAY }
      dispatch({ type: 'customer/add', customer })
      return { ok: true, value: customer }
    },
    [data.customers],
  )

  const updateCustomer = useCallback<StoreValue['updateCustomer']>((id, patch) => {
    dispatch({ type: 'customer/update', id, patch })
    return { ok: true, value: undefined }
  }, [])

  const addTask = useCallback<StoreValue['addTask']>(
    (input) => {
      const task: OpTask = { ...input, id: `tk-new-${data.tasks.length + 1}`, status: 'todo' }
      dispatch({ type: 'task/add', task })
      return { ok: true, value: task }
    },
    [data.tasks],
  )

  const value = useMemo<StoreValue>(
    () => ({
      data,
      customerStats,
      createAppointment,
      updateAppointment,
      setAppointmentStatus,
      addCustomer,
      updateCustomer,
      addTask,
      setTaskStatus: (id, status) => dispatch({ type: 'task/status', id, status }),
      resetDemo: () => dispatch({ type: 'reset' }),
    }),
    [data, customerStats, createAppointment, updateAppointment, setAppointmentStatus, addCustomer, updateCustomer, addTask],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}
