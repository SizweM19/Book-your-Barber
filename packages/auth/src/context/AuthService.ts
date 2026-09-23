import { createBrowserSupabaseClient, isSupabaseConfigured } from '@byb/database'
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  Tenant,
  TenantContext,
  TenantMembership,
  TenantRole,
  UserProfile,
} from '@byb/types'

export class AuthService {
  private supabase = createBrowserSupabaseClient()

  /**
   * Log in user using email and password.
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: Error | null }> {
    // Non-production development accounts support
    // When live Supabase is configured, authenticate directly with Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error) {
          return { user: null, error: new Error(error.message) }
        }

        if (!data.user) {
          return { user: null, error: new Error('User not found after login.') }
        }

        // Clear any lingering dev session cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'byb_dev_session=; path=/; max-age=0'
        }

        const authUser = await this.getCurrentUser()
        return { user: authUser, error: null }
      } catch (err: any) {
        return { user: null, error: err instanceof Error ? err : new Error(err.message || 'Login failed') }
      }
    }

    // Offline non-production development accounts support (fallback when Supabase is not configured)
    if (process.env.NODE_ENV !== 'production') {
      const devAccounts: Record<string, { role: TenantRole; isPlatformAdmin: boolean; name: string }> = {
        'owner@fadeandedge.co.za': { role: 'OWNER', isPlatformAdmin: false, name: 'Themba Ndlovu (Dev Owner)' },
        'manager@fadeandedge.co.za': { role: 'MANAGER', isPlatformAdmin: false, name: 'Devon Williams (Dev Manager)' },
        'admin@bookyourbarber.co.za': { role: 'OWNER', isPlatformAdmin: true, name: 'Platform Admin (Dev)' },
      }

      const devAcc = devAccounts[credentials.email?.toLowerCase()]
      if (devAcc) {
        if (credentials.password !== 'password123') {
          return { user: null, error: new Error('Invalid email or password.') }
        }

        const devUser: AuthUser = {
          id: `dev-${credentials.email.split('@')[0]}`,
          email: credentials.email,
          profile: {
            id: `dev-${credentials.email.split('@')[0]}`,
            fullName: devAcc.name,
            email: credentials.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          memberships: [
            {
              id: `mem-${credentials.email.split('@')[0]}`,
              tenantId: '11111111-1111-1111-1111-111111111111',
              userId: `dev-${credentials.email.split('@')[0]}`,
              role: devAcc.role,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          isPlatformAdmin: devAcc.isPlatformAdmin,
        }

        if (typeof document !== 'undefined') {
          const cookieVal = credentials.email.includes('admin') ? 'admin' : (credentials.email.includes('manager') ? 'manager' : 'owner')
          document.cookie = `byb_dev_session=${cookieVal}; path=/; max-age=86400`
        }

        return { user: devUser, error: null }
      }
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return { user: null, error: new Error(error.message) }
      }

      if (!data.user) {
        return { user: null, error: new Error('User not found after login.') }
      }

      const authUser = await this.getCurrentUser()
      return { user: authUser, error: null }
    } catch (err: any) {
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
        return null
      }

      // Fetch user profile
      const { data: profileData } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

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
      .maybeSingle()

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
