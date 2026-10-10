export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export type ServiceCategory = 'wash' | 'headspa' | 'treatment' | 'neck' | 'package'

export type AcquisitionSource =
  | 'facebook'
  | 'tiktok'
  | 'google_maps'
  | 'referral'
  | 'walk_in'
  | 'line_oa'
  | 'other'

export type AgeGroup = '18-24' | '25-34' | '35-44' | '45-54' | '55+'

export type CustomerSegment = 'new' | 'returning' | 'inactive'

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskGroup = 'opening' | 'closing' | 'general'

/** วันที่รูปแบบ YYYY-MM-DD, เวลารูปแบบ HH:mm (เวลาท้องถิ่นของร้าน) */
export type ISODate = string
export type HHmm = string

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  durationMin: number
  price: number
  description: string
  /** ต้องใช้เตียงประเภทนี้ */
  roomType: RoomType
}

export interface Staff {
  id: string
  name: string
  nickname: string
  role: string
  /** 0 = อาทิตย์ ... 6 = เสาร์ */
  workDays: number[]
  shiftStart: HHmm
  shiftEnd: HHmm
  skills: ServiceCategory[]
  color: string
}

export type RoomType = 'bed' | 'vip' | 'twin'

export interface Room {
  id: string
  name: string
  type: RoomType
  capacityNote: string
}

export interface Customer {
  id: string
  name: string
  nickname: string
  phone: string
  lineId?: string
  ageGroup?: AgeGroup
  source: AcquisitionSource
  /** วันที่เพิ่มข้อมูลเข้าระบบ */
  createdAt: ISODate
  note?: string
}

export interface Appointment {
  id: string
  customerId: string
  serviceId: string
  staffId: string
  roomId: string
  date: ISODate
  start: HHmm
  end: HHmm
  status: AppointmentStatus
  /** ราคา ณ เวลาจอง (บาท) */
  price: number
  note?: string
  cancelReason?: string
  createdAt: ISODate
}

export interface OpTask {
  id: string
  title: string
  group: TaskGroup
  date: ISODate
  dueTime: HHmm
  status: TaskStatus
  assigneeId?: string
  note?: string
  completedAt?: string
}

export interface MarketingExpense {
  id: string
  month: string // YYYY-MM
  source: AcquisitionSource
  amount: number
  note: string
}

export interface DateRange {
  from: ISODate
  to: ISODate
}

export interface AppData {
  customers: Customer[]
  appointments: Appointment[]
  tasks: OpTask[]
}

export interface ConflictIssue {
  kind: 'staff' | 'room' | 'customer' | 'staff_off' | 'closed' | 'skill' | 'room_type'
  message: string
  appointmentId?: string
}
