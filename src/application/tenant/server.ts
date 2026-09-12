import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'
import type { ResolvedTenant } from './types'
import type { Tenant, TenantRole, AuthUser } from '@/domains/auth/types'

/**
 * Resolves the authenticated tenant context on the server side.
 * 
 * Invariants:
 * - Derives tenant context strictly from authenticated user membership.
 * - Client-supplied tenant IDs are validated against actual memberships.
 * - In non-production, supports dev session accounts explicitly.
 * - In production, missing or unverified memberships immediately return null.
 */
export async function resolveServerTenantContext(
  requestedTenantId?: string
): Promise<ResolvedTenant | null> {
  const isDev = process.env.NODE_ENV !== 'production'
  let devCookie: string | undefined

  try {
    const cookieStore = await cookies()
    devCookie = cookieStore.get('byb_dev_session')?.value
  } catch {
    // Outside Next.js request context (e.g. tests or build time)
    if (isDev) {
      devCookie = 'owner'
    }
  }

  // 1. Check development session fallback if not in production
  if (isDev) {
    if (devCookie && ['owner', 'manager', 'admin'].includes(devCookie)) {
      const role: TenantRole = devCookie === 'admin' ? 'OWNER' : (devCookie.toUpperCase() as TenantRole)
      const mockTenantId = '11111111-1111-1111-1111-111111111111'
      
      const mockTenant: Tenant = {
        id: mockTenantId,
        name: 'Fade & Edge Barbershop',
        businessType: 'Barbershop',
        phone: '082 345 6789',
        email: 'salon@fadeandedge.co.za',
        address: '15 Loader Street, De Waterkant, Cape Town, 8001',
        timezone: 'Africa/Johannesburg',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-09-08T00:00:00Z',
      }

      const mockUser: AuthUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: `${devCookie}@fadeandedge.co.za`,
        profile: {
          id: '00000000-0000-0000-0000-000000000001',
          fullName: `Fade & Edge ${role}`,
          email: `${devCookie}@fadeandedge.co.za`,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-09-08T00:00:00Z',
        },
        memberships: [
          {
            id: '00000000-0000-0000-0000-000000000002',
            tenantId: mockTenantId,
            userId: '00000000-0000-0000-0000-000000000001',
            role,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2026-09-08T00:00:00Z',
          },
        ],
        isPlatformAdmin: devCookie === 'admin',
      }

      return {
        tenantId: mockTenantId,
        role,
        tenant: mockTenant,
        user: mockUser,
      }
    }
  }

  // 2. Production / Live Supabase path
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

    if (userError || !authUser) {
      return null
    }

    // Query tenant memberships for this user
    let membershipQuery = supabase
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('user_id', authUser.id)

    if (requestedTenantId) {
      membershipQuery = membershipQuery.eq('tenant_id', requestedTenantId)
    }

    const { data: memberships, error: membershipError } = await membershipQuery
    if (membershipError || !memberships || memberships.length === 0) {
      return null
    }

    const primaryMembership = memberships[0]
    const tenantRow = primaryMembership.tenants

    if (!tenantRow || tenantRow.status !== 'active') {
      return null
    }

    const tenant: Tenant = {
      id: tenantRow.id,
      name: tenantRow.name,
      businessType: tenantRow.business_type,
      phone: tenantRow.phone,
      email: tenantRow.email,
      address: tenantRow.address,
      logoUrl: tenantRow.logo_url,
      timezone: tenantRow.timezone,
      status: tenantRow.status,
      createdAt: tenantRow.created_at,
      updatedAt: tenantRow.updated_at,
    }

    const role = primaryMembership.role as TenantRole

    const user: AuthUser = {
      id: authUser.id,
      email: authUser.email || '',
      profile: {
        id: authUser.id,
        fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        createdAt: authUser.created_at,
        updatedAt: authUser.updated_at || authUser.created_at,
      },
      memberships: memberships.map((m: any) => ({
        id: m.id,
        tenantId: m.tenant_id,
        userId: m.user_id,
        role: m.role as TenantRole,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
      isPlatformAdmin: false,
    }

    return {
      tenantId: tenant.id,
      role,
      tenant,
      user,
    }
  } catch {
    return null
  }
}
