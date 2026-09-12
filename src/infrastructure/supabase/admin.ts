import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

/**
 * Creates an elevated Supabase admin client using the service role key.
 * 
 * SECURITY WARNING:
 * - This client bypasses Row Level Security (RLS).
 * - MUST NEVER be called or imported in client-side code.
 * - Used strictly for privileged system operations (platform admin, webhook handlers).
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Security Violation] Attempted to instantiate Supabase Admin Client in a browser context.'
    )
  }

  const serviceRoleKey = env.supabaseServiceRoleKey
  if (!serviceRoleKey) {
    throw new Error(
      '[Security Error] Missing SUPABASE_SERVICE_ROLE_KEY for admin client initialization.'
    )
  }

  return createClient(env.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

