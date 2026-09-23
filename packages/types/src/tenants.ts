/**
 * Tenant and Salon Profile Domain Contracts
 */

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING'
export type TenantRole = 'OWNER' | 'MANAGER'

export interface CanonicalTenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  created_at: string
  updated_at: string
}

export interface CanonicalSalonProfile {
  id: string
  tenant_id: string
  salon_name: string
  slug: string
  tagline?: string
  description?: string
  phone: string
  email: string
  address_street?: string
  address_city?: string
  address_province?: string
  address_postal_code?: string
  address_country: string
  currency: string
  booking_deposit_type: 'none' | 'fixed' | 'percentage'
  booking_deposit_amount: number
  cancellation_window_hours: number
  cancellation_fee_cents: number
  created_at: string
  updated_at: string
}

export interface CanonicalTenantMembership {
  id: string
  tenant_id: string
  user_id: string
  role: TenantRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlatformAdminRecord {
  id: string
  user_id: string
  notes?: string
  is_active: boolean
  created_at: string
}

export type StaffAssignmentStrategy = 'FIRST_AVAILABLE' | 'LEAST_BUSY' | 'ROUND_ROBIN'

export interface SalonBookingSettings {
  tenant_id: string
  online_booking_enabled: boolean
  slot_interval_minutes: number
  min_notice_minutes: number
  max_advance_days: number
  assignment_strategy: StaffAssignmentStrategy
}
