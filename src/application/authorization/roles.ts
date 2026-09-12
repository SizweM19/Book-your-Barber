import type { AuthUser, TenantRole, PlatformRole, UserRole } from '@/domains/auth/types'

export const ROLES = {
  OWNER: 'OWNER' as TenantRole,
  MANAGER: 'MANAGER' as TenantRole,
  PLATFORM_ADMIN: 'PLATFORM_ADMIN' as PlatformRole,
} as const

export const TENANT_ROLES: TenantRole[] = ['OWNER', 'MANAGER']

export const PLATFORM_ROLES: PlatformRole[] = ['PLATFORM_ADMIN']

/**
 * Checks if a user possesses any of the required tenant roles for a given tenant.
 */
export function hasTenantRole(
  user: AuthUser | null,
  tenantId: string,
  allowedRoles: TenantRole[] = TENANT_ROLES
): boolean {
  if (!user || !tenantId) return false
  return user.memberships.some(
    m => m.tenantId === tenantId && allowedRoles.includes(m.role)
  )
}

/**
 * Checks if a user is the OWNER of a specific tenant.
 */
export function isTenantOwner(user: AuthUser | null, tenantId: string): boolean {
  return hasTenantRole(user, tenantId, ['OWNER'])
}

/**
 * Checks if a user is a MANAGER or OWNER of a specific tenant.
 */
export function isTenantManagerOrOwner(user: AuthUser | null, tenantId: string): boolean {
  return hasTenantRole(user, tenantId, ['OWNER', 'MANAGER'])
}

/**
 * Checks if a user is a verified Platform Administrator.
 * Note: Must be backed by server-side database verification in production.
 */
export function isPlatformAdmin(user: AuthUser | null): boolean {
  if (!user) return false
  return user.isPlatformAdmin === true
}

/**
 * Asserts authorization condition or throws AuthorizationError.
 */
export function assertAuthorized(condition: boolean, message = 'Unauthorized action'): asserts condition {
  if (!condition) {
    const error = new Error(message)
    error.name = 'AuthorizationError'
    throw error
  }
}

