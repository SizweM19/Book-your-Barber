import type { Tenant, TenantMembership, TenantRole, AuthUser } from '@/domains/auth/types'

export interface TenantContext {
  tenant: Tenant
  membership: TenantMembership
  user: AuthUser
}

export interface ResolvedTenant {
  tenantId: string
  role: TenantRole
  tenant: Tenant
  user: AuthUser
}

export interface TenantContextState {
  tenantId: string | null
  tenant: Tenant | null
  role: TenantRole | null
  isLoading: boolean
  error: Error | null
}
