'use client'

import React, { createContext, useContext } from 'react'
import { useAuth } from '@/application/auth'
import type { TenantContextState } from './types'

const TenantContext = createContext<TenantContextState>({
  tenantId: null,
  tenant: null,
  role: null,
  isLoading: true,
  error: null,
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenantContext, currentRole, isLoading } = useAuth()

  const value: TenantContextState = {
    tenantId: tenantContext?.tenant.id ?? null,
    tenant: tenantContext?.tenant ?? null,
    role: currentRole,
    isLoading,
    error: null,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenantContext(): TenantContextState {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantProvider')
  }
  return context
}
