/**
 * Canonical Database Entities
 * Matching the 24 tables defined in supabase/migrations/20260909000001_initial_schema.sql
 */

export interface CanonicalTenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING';
  created_at: string;
  updated_at: string;
}

export interface CanonicalSalonProfile {
  id: string;
  tenant_id: string;
  salon_name: string;
  slug: string;
  tagline?: string;
  description?: string;
  phone: string;
  email: string;
  address_street?: string;
  address_city?: string;
  address_province?: string;
  address_postal_code?: string;
  address_country: string;
  currency: string;
  booking_deposit_type: 'none' | 'fixed' | 'percentage';
  booking_deposit_amount: number;
  cancellation_window_hours: number;
  cancellation_fee_cents: number;
  created_at: string;
  updated_at: string;
}

export interface CanonicalTenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'OWNER' | 'MANAGER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanonicalStaffMember {
  id: string;
  tenant_id: string;
  name: string;
  title: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkPeriod {
  start_time: string; // HH:mm
  end_time: string; // HH:mm
}

export interface CanonicalStaffWorkingHours {
  id: string;
  tenant_id: string;
  staff_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  periods?: WorkPeriod[]; // Multi-period / split shifts support
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanonicalStaffTimeOff {
  id: string;
  tenant_id: string;
  staff_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason?: string;
  created_at: string;
}

export interface CanonicalStaffService {
  id: string;
  tenant_id: string;
  staff_id: string;
  service_id: string;
  created_at: string;
}

export interface CanonicalScheduleBreak {
  id: string;
  tenant_id: string;
  staff_id: string;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  description?: string;
  day_of_week?: number; // optional: recurring day (0-6)
}

export interface CanonicalScheduleException {
  id: string;
  tenant_id: string;
  staff_id: string;
  exception_date: string; // YYYY-MM-DD
  is_working: boolean;
  start_time?: string; // HH:mm
  end_time?: string; // HH:mm
  reason?: string;
}

export type StaffAssignmentStrategy = 'FIRST_AVAILABLE' | 'LEAST_BUSY' | 'ROUND_ROBIN';

export interface SalonBookingSettings {
  tenant_id: string;
  online_booking_enabled: boolean;
  slot_interval_minutes: number;
  min_notice_minutes: number;
  max_advance_days: number;
  assignment_strategy: StaffAssignmentStrategy;
}

export interface CanonicalServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface CanonicalSalonService {
  id: string;
  tenant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price_cents: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanonicalCustomer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface CanonicalAppointment {
  id: string;
  tenant_id: string;
  booking_reference: string;
  customer_id?: string;
  staff_id: string;
  service_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  total_price_cents: number;
  deposit_amount_cents: number;
  payment_status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | 'FAILED';
  payment_method: 'cash' | 'card';
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CanonicalPaymentTransaction {
  id: string;
  tenant_id: string;
  appointment_id?: string;
  amount_cents: number;
  currency: string;
  gateway: string;
  gateway_transaction_id?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CanonicalRefundRecord {
  id: string;
  tenant_id: string;
  payment_id: string;
  amount_cents: number;
  reason: string;
  gateway_refund_id?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  created_at: string;
}

