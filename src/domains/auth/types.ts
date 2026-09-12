/**
 * Core Authentication & Multi-Tenant Domain Models.
 * 
 * Invariants:
 * - Customers are guest users (no customer auth in this version).
 * - Authenticated users must have a corresponding profile in `profiles`.
 * - Tenant roles (OWNER, MANAGER) are strictly bound to a tenant via `tenant_memberships`.
 * - Platform admins operate at platform scope via `platform_admins`.
 * - Staff are records only, not authenticated user accounts.
 */

export type TenantRole = 'OWNER' | 'MANAGER'

export type PlatformRole = 'PLATFORM_ADMIN'

export type UserRole = TenantRole | PlatformRole

export type TenantStatus = 'active' | 'suspended' | 'pending'

export interface UserProfile {
  id: string // Maps to Supabase auth.users id
  fullName: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  name: string
  businessType: string
  phone: string
  email: string
  address: string
  logoUrl?: string
  timezone: string
  status: TenantStatus
  createdAt: string
  updatedAt: string
}

export interface TenantMembership {
  id: string
  tenantId: string
  userId: string
  role: TenantRole
  createdAt: string
  updatedAt: string
}

export interface PlatformAdmin {
  id: string
  userId: string
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string
  profile: UserProfile
  memberships: TenantMembership[]
  isPlatformAdmin: boolean
}

export interface TenantContext {
  tenant: Tenant
  membership: TenantMembership
  user: AuthUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  fullName: string
  email: string
  password: string
  salonName: string
  phone?: string
}

export interface ResetPasswordCredentials {
  password: string
}

