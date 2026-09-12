import { describe, it, expect } from 'vitest'
import {
  hasTenantRole,
  isTenantOwner,
  isTenantManagerOrOwner,
  isPlatformAdmin,
  assertAuthorized,
  ROLES,
} from '@/application/authorization/roles'
import type { AuthUser } from '@/domains/auth/types'

describe('Authorization & Role Model', () => {
  const mockOwnerUser: AuthUser = {
    id: 'user-owner-1',
    email: 'owner@fadeandedge.co.za',
    profile: {
      id: 'user-owner-1',
      fullName: 'Themba Ndlovu',
      email: 'owner@fadeandedge.co.za',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    memberships: [
      {
        id: 'mem-1',
        tenantId: 'tenant-a',
        userId: 'user-owner-1',
        role: 'OWNER',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ],
    isPlatformAdmin: false,
  }

  const mockManagerUser: AuthUser = {
    id: 'user-mgr-1',
    email: 'manager@fadeandedge.co.za',
    profile: {
      id: 'user-mgr-1',
      fullName: 'Devon Williams',
      email: 'manager@fadeandedge.co.za',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    memberships: [
      {
        id: 'mem-2',
        tenantId: 'tenant-a',
        userId: 'user-mgr-1',
        role: 'MANAGER',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ],
    isPlatformAdmin: false,
  }

  const mockPlatformAdminUser: AuthUser = {
    id: 'user-admin-1',
    email: 'superadmin@bookyourbarber.co',
    profile: {
      id: 'user-admin-1',
      fullName: 'Platform Admin',
      email: 'superadmin@bookyourbarber.co',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    memberships: [],
    isPlatformAdmin: true,
  }

  it('correctly identifies OWNER permissions', () => {
    expect(isTenantOwner(mockOwnerUser, 'tenant-a')).toBe(true)
    expect(isTenantOwner(mockOwnerUser, 'tenant-b')).toBe(false)
    expect(isTenantOwner(mockManagerUser, 'tenant-a')).toBe(false)
    expect(isTenantOwner(null, 'tenant-a')).toBe(false)
  })

  it('correctly identifies MANAGER permissions', () => {
    expect(isTenantManagerOrOwner(mockManagerUser, 'tenant-a')).toBe(true)
    expect(isTenantManagerOrOwner(mockOwnerUser, 'tenant-a')).toBe(true)
    expect(isTenantManagerOrOwner(mockManagerUser, 'tenant-b')).toBe(false)
  })

  it('verifies PLATFORM_ADMIN role independently from tenant memberships', () => {
    expect(isPlatformAdmin(mockPlatformAdminUser)).toBe(true)
    expect(isPlatformAdmin(mockOwnerUser)).toBe(false)
    expect(isPlatformAdmin(mockManagerUser)).toBe(false)
    expect(isPlatformAdmin(null)).toBe(false)
  })

  it('assertAuthorized throws AuthorizationError when condition is not met', () => {
    expect(() => assertAuthorized(true, 'Allowed')).not.toThrow()
    expect(() => assertAuthorized(false, 'Denied')).toThrowError('Denied')
  })

  it('blocks cross-tenant role checks', () => {
    // Owner of Tenant A cannot claim roles in Tenant B
    expect(hasTenantRole(mockOwnerUser, 'tenant-b', ['OWNER', 'MANAGER'])).toBe(false)
  })
})

