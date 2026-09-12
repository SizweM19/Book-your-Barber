'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { authService } from './AuthService'
import { createBrowserSupabaseClient } from '@/infrastructure/supabase/client'
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  TenantContext,
  TenantRole,
} from '@/domains/auth/types'

interface AuthContextType {
  user: AuthUser | null
  tenantContext: TenantContext | null
  currentRole: TenantRole | null
  isPlatformAdmin: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<{ error: Error | null }>
  register: (credentials: RegisterCredentials) => Promise<{ error: Error | null }>
  logout: () => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
  switchTenant: (tenantId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isPending, startTransition] = useTransition()
  const supabase = createBrowserSupabaseClient()

  async function loadUser() {
    setIsLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)

      if (currentUser && currentUser.memberships.length > 0) {
        const context = await authService.getCurrentTenantContext()
        setTenantContext(context)
      } else {
        setTenantContext(null)
      }
    } catch {
      setUser(null)
      setTenantContext(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, _session: any) => {
      startTransition(() => {
        loadUser()
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function login(credentials: LoginCredentials) {
    const { user: loggedInUser, error } = await authService.login(credentials)
    if (loggedInUser) {
      setUser(loggedInUser)
      const context = await authService.getCurrentTenantContext()
      setTenantContext(context)
    }
    return { error }
  }

  async function register(credentials: RegisterCredentials) {
    const { user: registeredUser, error } = await authService.register(credentials)
    if (registeredUser) {
      setUser(registeredUser)
      const context = await authService.getCurrentTenantContext()
      setTenantContext(context)
    }
    return { error }
  }

  async function logout() {
    const { error } = await authService.logout()
    setUser(null)
    setTenantContext(null)
    return { error }
  }

  async function switchTenant(tenantId: string) {
    const context = await authService.getCurrentTenantContext(tenantId)
    if (context) {
      setTenantContext(context)
    }
  }

  const currentRole = tenantContext?.membership.role || null
  const isPlatformAdmin = user?.isPlatformAdmin ?? false

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantContext,
        currentRole,
        isPlatformAdmin,
        isLoading: isLoading || isPending,
        login,
        register,
        logout,
        refreshUser: loadUser,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

