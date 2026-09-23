import type { SalonEntity } from "@/application/repositories/interfaces"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Step =
  | "salon" | "service" | "staff" | "date" | "time"
  | "info" | "reminder" | "summary"
  | "paymentMethod" | "payment"
  | "paymentSuccessProcessing" | "paymentDuplicate"
  | "paymentFailed" | "confirmed" | "notificationFailure"
  | "unavailable" | "slotHoldExpired"
  | "fullyBooked" | "staffUnavailable" | "serviceUnavailable" | "salonUnavailable"
  | "bookingLookup" | "bookingDetails"
  | "rescheduleSuccess" | "rescheduleFailure"
  | "cancellationReview" | "cancellationConfirmed"
  | "salonCancelled"
  | "refundProcessing" | "refundCompleted" | "refundFailed"
  | "sessionExpired" | "rateLimited"
  | "loading" | "error"

export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
}

export interface StaffMember {
  id: string
  name: string
  role: string
  photo: string
  nextAvailable: string
}

export interface StaffSlot {
  time: string
  available: boolean
}

export type ReminderMethod = "whatsapp" | "sms" | "email" | "none"

export type PaymentMethod = "card" | "cash"

export interface ValidationErrors {
  [key: string]: string | undefined
}

export interface BookingData {
  appointmentId?: string
  service?: Service
  staff?: StaffMember | null
  date?: string
  time?: string
  name?: string
  phone?: string
  email?: string
  reminder?: ReminderMethod
  paymentMethod?: PaymentMethod
  reference?: string
  notificationFailed?: boolean
  cancellationResult?: {
    feePercent: number
    feeAmount: number
    refundAmount: number
    reference: string
    serviceName?: string
    chargedAmount?: number
    paidAmount?: number
    cancelledBy?: string
    refundStatus?: string
  }
  lookupRecord?: {
    reference: string
    salon: string
    address: string
    service: string
    staff: string
    date: string
    time: string
    duration: string
    paymentStatus: string
    bookingStatus: string
    appointmentId: string
    totalPaid: number
    price: number
    contact?: string
  }
}
