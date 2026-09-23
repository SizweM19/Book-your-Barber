// ─── DOMAIN TYPES ─────────────────────────────────────────────────────────────
// All explicit domain enums and interfaces for the salon ops experience.
// Never use raw strings in place of these types in UI or service code.

export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "inProgress"
  | "completed"
  | "cancelled"
  | "noShow"

export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "refundProcessing"
  | "refunded"
  | "paymentFailed"

export type BookingSource = "online" | "qr" | "manual"

export type PaymentMethod = "cash" | "card" | "yoco" | "payshap" | "other"

export type RefundStatus = "none" | "processing" | "completed" | "failed"

export type NotificationStatus = "sent" | "failed" | "pending" | "notRequired"

export type NotificationChannel = "whatsapp" | "sms" | "email" | "none"

export type CancellationBy = "customer" | "salon"

export type SyncStatus = "online" | "offline" | "syncing" | "synced" | "syncFailed" | "conflict"

// ─── AGGREGATE INTERFACES ─────────────────────────────────────────────────────

export interface NotificationEvent {
  type: "confirmation" | "reminder" | "reschedule" | "cancellation" | "payment" | "refund"
  status: NotificationStatus
  channel: NotificationChannel
  sentAt?: string
  failReason?: string
}

export interface PaymentRecord {
  id: string
  amount: number
  method: PaymentMethod
  recordedAt: string
  status: "successful" | "failed"
}

export interface CancellationRecord {
  cancelledBy: CancellationBy
  cancelledAt: string
  feePercent: number
  feeAmount: number
  refundAmount: number
  refundStatus: RefundStatus
}

export interface OpsAppointment {
  ref: string
  customer: string
  customerId: string
  phone: string
  email: string
  service: string
  serviceId: string
  staff: string
  staffId: string
  date: string
  time: string
  duration: number
  charged: number
  paid: number
  paymentMethod: PaymentMethod | "payAtShop"
  status: AppointmentStatus
  paymentStatus: PaymentStatus
  source: BookingSource
  reminderChannel: NotificationChannel
  notifications: NotificationEvent[]
  payments: PaymentRecord[]
  cancellation?: CancellationRecord
}

export interface OpsCustomer {
  id: string
  name: string
  phone: string
  email: string
  gender?: "male" | "female" | "other" | "unspecified"
  address?: string
  notes: string
  since: string
  visits: number
  lastVisit: string
  totalSpend: number
  outstandingBalance: number
  segment: "new" | "returning" | "regular" | "vip" | "atRisk" | "inactive"
}

export interface OpsStaff {
  id: string
  name: string
  role: string
  photo: string
  active: boolean
  todayRevenue: number
  monthRevenue: number
  monthAppointments: number
  completionRate: number
  noShowCount: number
}

export interface OpsService {
  id: string
  name: string
  category: string
  duration: number
  price: number
  active: boolean
  description?: string
}

export type Service = OpsService

export interface RefundRecord {
  id: string
  refundRef: string
  apptRef: string
  customer: string
  customerId: string
  originalAmount: number
  cancelledBy: CancellationBy
  feePercent: number
  feeAmount: number
  refundAmount: number
  status: "requested" | "processing" | "completed" | "failed"
  requestedAt: string
  completedAt?: string
}

export interface ExpenseRecord {
  id: string
  category: "Rent" | "Electricity" | "Products" | "Salaries" | "Marketing" | "Transport" | "Other"
  description: string
  amount: number
  date: string
}

// ─── VIEW ROUTING ─────────────────────────────────────────────────────────────

export type OpsView =
  | "dashboard"
  | "calendarDay"
  | "calendarWeek"
  | "appointmentList"
  | "appointmentDetail"
  | "createAppt"
  | "recordPayment"
  | "completeAppt"
  | "cancelAppt"
  | "noShow"
  | "reschedule"
  | "customerList"
  | "customerProfile"
  | "staffList"
  | "staffProfile"
  | "serviceList"
  | "loading"
  | "error"
  | "settings"
  | "settingsServices"
  | "settingsAddService"
  | "settingsEditService"
  | "settingsAddStaff"
  | "settingsAvailability"
  | "settingsBooking"
  | "settingsPayments"
  | "settingsCancellation"
  | "financials"
  | "paymentList"
  | "paymentDetail"
  | "outstandingPayments"
  | "refundList"
  | "refundDetail"
  | "revenueDetail"
  | "expenseList"
  | "addExpense"
  | "editExpense"
  | "financialReports"
