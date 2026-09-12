import { createBrowserSupabaseClient } from '@/infrastructure/supabase/client'
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  Tenant,
  TenantContext,
  TenantMembership,
  TenantRole,
  UserProfile,
} from '@/domains/auth/types'

export class AuthService {
  private supabase = createBrowserSupabaseClient()

  /**
   * Log in user using email and password.
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        // In development mode when Supabase is disconnected, support local test credentials
        if (process.env.NODE_ENV !== 'production') {
          const devAccounts: Record<string, { role: 'owner' | 'manager' | 'admin'; name: string }> = {
            'owner@fadeandedge.co.za': { role: 'owner', name: 'Fade & Edge Owner' },
            'manager@fadeandedge.co.za': { role: 'manager', name: 'Fade & Edge Manager' },
            'admin@bookyourbarber.co.za': { role: 'admin', name: 'Platform Admin' },
          }

          const devAcc = devAccounts[credentials.email.toLowerCase().trim()]
          if (devAcc && credentials.password === 'password123') {
            if (typeof document !== 'undefined') {
              document.cookie = `byb_dev_session=${devAcc.role}; path=/; max-age=86400; SameSite=Lax`
            }
            const mockAuthUser: AuthUser = {
              id: '00000000-0000-0000-0000-000000000001',
              email: credentials.email,
              profile: {
                id: '00000000-0000-0000-0000-000000000001',
                fullName: devAcc.name,
                email: credentials.email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              memberships: [
                {
                  id: '00000000-0000-0000-0000-000000000002',
                  tenantId: '11111111-1111-1111-1111-111111111111',
                  userId: '00000000-0000-0000-0000-000000000001',
                  role: devAcc.role === 'admin' ? 'OWNER' : (devAcc.role.toUpperCase() as TenantRole),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
              isPlatformAdmin: devAcc.role === 'admin',
            }
            return { user: mockAuthUser, error: null }
          }
        }
        return { user: null, error: new Error(error.message) }
      }

      if (!data.user) {
        return { user: null, error: new Error('User not found after login.') }
      }

      const authUser = await this.getCurrentUser()
      return { user: authUser, error: null }
    } catch (err: any) {
      // In development mode fallback on network failure as well
      if (process.env.NODE_ENV !== 'production') {
        const devAccounts: Record<string, { role: 'owner' | 'manager' | 'admin'; name: string }> = {
          'owner@fadeandedge.co.za': { role: 'owner', name: 'Fade & Edge Owner' },
          'manager@fadeandedge.co.za': { role: 'manager', name: 'Fade & Edge Manager' },
          'admin@bookyourbarber.co.za': { role: 'admin', name: 'Platform Admin' },
        }
        const devAcc = devAccounts[credentials.email?.toLowerCase()?.trim()]
        if (devAcc && credentials.password === 'password123') {
          if (typeof document !== 'undefined') {
            document.cookie = `byb_dev_session=${devAcc.role}; path=/; max-age=86400; SameSite=Lax`
          }
          const mockAuthUser: AuthUser = {
            id: '00000000-0000-0000-0000-000000000001',
            email: credentials.email,
            profile: {
              id: '00000000-0000-0000-0000-000000000001',
              fullName: devAcc.name,
              email: credentials.email,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            memberships: [
              {
                id: '00000000-0000-0000-0000-000000000002',
                tenantId: '11111111-1111-1111-1111-111111111111',
                userId: '00000000-0000-0000-0000-000000000001',
                role: devAcc.role === 'admin' ? 'OWNER' : (devAcc.role.toUpperCase() as TenantRole),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            isPlatformAdmin: devAcc.role === 'admin',
          }
          return { user: mockAuthUser, error: null }
        }
      }
      return { user: null, error: err instanceof Error ? err : new Error(err.message || 'Login failed') }
    }
  }

  /**
   * Register a new Salon Owner, creates their profile and initial tenant.
   */
  async register(credentials: RegisterCredentials): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            salon_name: credentials.salonName,
            phone: credentials.phone || '',
          },
        },
      })

      if (error) {
        return { user: null, error: new Error(error.message) }
      }

      if (!data.user) {
        return { user: null, error: new Error('Failed to create account.') }
      }

      const authUser = await this.getCurrentUser()
      return { user: authUser, error: null }
    } catch (err: any) {
      return { user: null, error: err instanceof Error ? err : new Error(err.message || 'Registration failed') }
    }
  }

  /**
   * Log out currently authenticated user.
   */
  async logout(): Promise<{ error: Error | null }> {
    if (process.env.NODE_ENV !== 'production' && typeof document !== 'undefined') {
      document.cookie = 'byb_dev_session=; path=/; max-age=0'
    }
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) {
        return { error: new Error(error.message) }
      }
      return { error: null }
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err.message || 'Logout failed') }
    }
  }

  /**
   * Request password reset link to user's email.
   */
  async requestPasswordReset(email: string): Promise<{ error: Error | null }> {
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        return { error: new Error(error.message) }
      }
      return { error: null }
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err.message || 'Password reset request failed') }
    }
  }

  /**
   * Update password for an authenticated session (after reset link followed).
   */
  async updatePassword(password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({ password })
      if (error) {
        return { error: new Error(error.message) }
      }
      return { error: null }
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err.message || 'Failed to update password') }
    }
  }

  /**
   * Retrieves the current authenticated user along with their profile and tenant memberships.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        if (process.env.NODE_ENV !== 'production' && typeof document !== 'undefined') {
          const match = document.cookie.match(/byb_dev_session=([^;]+)/)
          if (match) {
            const role = match[1]
            if (['owner', 'manager', 'admin'].includes(role)) {
              return {
                id: '00000000-0000-0000-0000-000000000001',
                email: `${role}@fadeandedge.co.za`,
                profile: {
                  id: '00000000-0000-0000-0000-000000000001',
                  fullName: `Fade & Edge ${role.toUpperCase()}`,
                  email: `${role}@fadeandedge.co.za`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                memberships: [
                  {
                    id: '00000000-0000-0000-0000-000000000002',
                    tenantId: '11111111-1111-1111-1111-111111111111',
                    userId: '00000000-0000-0000-0000-000000000001',
                    role: role === 'admin' ? 'OWNER' : (role.toUpperCase() as TenantRole),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ],
                isPlatformAdmin: role === 'admin',
              }
            }
          }
        }
        return null
      }

      // Fetch user profile
      const { data: profileData } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const profile: UserProfile = {
        id: user.id,
        fullName: profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        createdAt: profileData?.created_at || user.created_at,
        updatedAt: profileData?.updated_at || user.updated_at || user.created_at,
      }

      // Fetch tenant memberships
      const { data: membershipData } = await this.supabase
        .from('tenant_memberships')
        .select('*')
        .eq('user_id', user.id)

      const memberships: TenantMembership[] = (membershipData || []).map((m: any) => ({
        id: m.id,
        tenantId: m.tenant_id,
        userId: m.user_id,
        role: m.role,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }))

      // Check platform admin status
      const { data: adminData } = await this.supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      return {
        id: user.id,
        email: user.email || '',
        profile,
        memberships,
        isPlatformAdmin: !!adminData,
      }
    } catch {
      return null
    }
  }

  /**
   * Resolves the active tenant context for the user.
   */
  async getCurrentTenantContext(tenantId?: string): Promise<TenantContext | null> {
    const user = await this.getCurrentUser()
    if (!user || user.memberships.length === 0) return null

    // Target either explicitly requested tenantId or default to the user's first membership
    const targetMembership = tenantId
      ? user.memberships.find(m => m.tenantId === tenantId)
      : user.memberships[0]

    if (!targetMembership) return null

    // Fetch tenant details
    const { data: tenantData } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', targetMembership.tenantId)
      .single()

    const tenant: Tenant = tenantData
      ? {
          id: tenantData.id,
          name: tenantData.name,
          businessType: tenantData.business_type,
          phone: tenantData.phone,
          email: tenantData.email,
          address: tenantData.address,
          logoUrl: tenantData.logo_url,
          timezone: tenantData.timezone || 'Africa/Johannesburg',
          status: tenantData.status || 'active',
          createdAt: tenantData.created_at,
          updatedAt: tenantData.updated_at,
        }
      : {
          id: targetMembership.tenantId,
          name: 'Fade & Edge Barbershop',
          businessType: 'Barbershop',
          phone: '082 345 6789',
          email: 'salon@fadeandedge.co.za',
          address: '15 Loader Street, De Waterkant, Cape Town, 8001',
          timezone: 'Africa/Johannesburg',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

    return {
      tenant,
      membership: targetMembership,
      user,
    }
  }
}

export const authService = new AuthService()

