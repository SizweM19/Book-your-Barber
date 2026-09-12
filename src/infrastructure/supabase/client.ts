import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/config/env'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Helper to check whether live Supabase credentials are configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = env.supabaseUrl
  const key = env.supabaseAnonKey
  return Boolean(url && key && url !== 'https://placeholder.supabase.co' && !url.includes('placeholder'))
}

/**
 * Returns the active client credentials with safe placeholders for development/testing.
 */
export function getClientSupabaseConfig() {
  const isConfigured = isSupabaseConfigured()
  return {
    url: isConfigured ? env.supabaseUrl : 'https://placeholder.supabase.co',
    key: isConfigured ? env.supabaseAnonKey : 'placeholder-anon-key',
    isConfigured,
  }
}

/**
 * Creates or returns the singleton Supabase client for client-side browser contexts.
 * Uses public anon key only.
 */
export function createClient() {
  const { url, key } = getClientSupabaseConfig()

  if (typeof window === 'undefined') {
    return createBrowserClient(url, key)
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key)
  }

  return browserClient
}

export const createBrowserSupabaseClient = createClient

