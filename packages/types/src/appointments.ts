/**
 * Appointment, Staff, Service, Customer Domain Contracts
 */

export type CanonicalAppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type CanonicalPaymentStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED'
  | 'FAILED'

export interface WorkPeriod {
  start_time: string // HH:mm
  end_time: string // HH:mm
}

export interface CanonicalStaffMember {
  id: string
  tenant_id: string
  name: string
  title: string
  phone?: string
  email?: string
  avatar_url?: string
  rating: number
  review_count: number
  is_active: boolean
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface CanonicalStaffWorkingHours {
  id: string
  tenant_id: string
  staff_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string // HH:mm
  end_time: string // HH:mm
  periods?: WorkPeriod[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CanonicalStaffTimeOff {
  id: string
  tenant_id: string
  staff_id: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  reason?: string
  created_at: string
}

export interface CanonicalStaffService {
  id: string
  tenant_id: string
  staff_id: string
  service_id: string
  created_at: string
}

export interface CanonicalScheduleBreak {
  id: string
  tenant_id: string
  staff_id: string
  start_time: string // HH:mm
  end_time: string // HH:mm
  description?: string
  day_of_week?: number
}

export interface CanonicalScheduleException {
  id: string
  tenant_id: string
  staff_id: string
  exception_date: string // YYYY-MM-DD
  is_working: boolean
  start_time?: string // HH:mm
  end_time?: string // HH:mm
  reason?: string
}

export interface CanonicalServiceCategory {
  id: string
  tenant_id: string
  name: string
  display_order: number
  created_at: string
}

export interface CanonicalSalonService {
  id: string
  tenant_id: string
  category_id?: string
  name: string
  description?: string
  price_cents: number
  duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CanonicalCustomer {
  id: string
  tenant_id: string
  name: string
  phone: string
  email?: string
  notes?: string
  total_bookings: number
  created_at: string
  updated_at: string
}

export interface CanonicalAppointment {
  id: string
  tenant_id: string
  booking_reference: string
  customer_id?: string
  staff_id: string
  service_id: string
  appointment_date: string // YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string // HH:mm
  status: CanonicalAppointmentStatus
  total_price_cents: number
  deposit_amount_cents: number
  payment_status: CanonicalPaymentStatus
  payment_method: 'cash' | 'card'
  customer_name: string
  customer_phone: string
  customer_email?: string
  notes?: string
  cancelled_at?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

// ─── APPLICATION-LEVEL ENTITY MAPPINGS ───────────────────────────────────────

export type AppAppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'arrived'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'noShow'

export type AppPaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded' | 'partial' | 'refundProcessing'

export interface AppointmentEntity {
  id: string
  tenantId: string
  bookingReference: string
  customerId: string
  serviceId: string
  staffId: string
  appointmentDate: string
  startTime: string
  durationMinutes: number
  status: AppAppointmentStatus
  paymentStatus: AppPaymentStatus
  totalCharged: number
  totalPaid: number
  bookingSource?: 'online' | 'manual' | 'qr'
  reminderChannel?: 'sms' | 'whatsapp' | 'email' | 'none'
  cancelledAt?: string
  cancellationReason?: string
  cancelledBy?: 'customer' | 'salon'
  customerContact?: string
  createdAt: string
  updatedAt: string
}

export interface StaffEntity {
  id: string
  tenantId: string
  name: string
  role: string
  phone?: string
  email?: string
  photoUrl?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceEntity {
  id: string
  tenantId: string
  name: string
  category: string
  description?: string
  duration: number
  price: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerEntity {
  id: string
  tenantId: string
  name: string
  phone: string
  email?: string
  notes?: string
  segment?: 'new' | 'returning' | 'regular' | 'vip' | 'atRisk' | 'inactive' | string
  createdAt: string
  updatedAt: string
}
