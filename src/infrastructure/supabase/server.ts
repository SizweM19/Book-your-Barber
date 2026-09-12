import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/config/env'

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Automatically synchronizes authentication session cookies with Next.js headers.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const url = env.supabaseUrl || 'https://placeholder.supabase.co'
  const key = env.supabaseAnonKey || 'placeholder-anon-key'

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Can occur if called within a React Server Component.
          // Ignored because session refresh is handled by middleware.
        }
      },
    },
  })
}

/**
 * Creates a privileged Supabase client using the Service Role Key for server-side
 * background jobs, database maintenance, and testing.
 * MUST NEVER BE EXPOSED TO THE CLIENT BROWSER.
 */
export function createAdminSupabaseClient() {
  const url = env.supabaseUrl
  const serviceKey = env.supabaseServiceRoleKey
  if (!url || !serviceKey) {
    throw new Error('Supabase URL and Service Role Key are required for admin client.')
  }
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() { return [] },
      setAll() {},
    },
  })
}
