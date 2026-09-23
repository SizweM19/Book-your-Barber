import type { AuthUser, TenantRole } from '@/domains/auth/types'

export function isPlatformAdmin(user: AuthUser | null): boolean {
  if (!user) return false
  return Boolean(user.isPlatformAdmin)
}

export function isTenantOwner(user: AuthUser | null, tenantId?: string): boolean {
  if (!user) return false
  if (user.isPlatformAdmin) return true
  if (!tenantId) {
    return user.memberships.some(m => m.role === 'OWNER')
  }
  return user.memberships.some(m => m.tenantId === tenantId && m.role === 'OWNER')
}

export function isTenantManager(user: AuthUser | null, tenantId?: string): boolean {
  if (!user) return false
  if (user.isPlatformAdmin) return true
  if (!tenantId) {
    return user.memberships.some(m => m.role === 'OWNER' || m.role === 'MANAGER')
  }
  return user.memberships.some(
    m => m.tenantId === tenantId && (m.role === 'OWNER' || m.role === 'MANAGER')
  )
}

export function hasRole(user: AuthUser | null, tenantId: string, allowedRoles: TenantRole[]): boolean {
  if (!user) return false
  if (user.isPlatformAdmin) return true
  return user.memberships.some(m => m.tenantId === tenantId && allowedRoles.includes(m.role))
}
