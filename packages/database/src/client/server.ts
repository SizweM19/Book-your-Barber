import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'

export interface CookieMethods {
  getAll: () => { name: string; value: string }[] | Promise<{ name: string; value: string }[]>
  setAll?: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => void
}

export function createServerClientWithCookies(
  cookieMethods: CookieMethods,
  customUrl?: string,
  customKey?: string
) {
  const url = customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = customKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createSupabaseServerClient(url, key, {
    cookies: {
      getAll: cookieMethods.getAll,
      setAll: cookieMethods.setAll || (() => {}),
    },
  })
}

export function createAdminClient(customUrl?: string, customServiceKey?: string) {
  const url = customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = customServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase URL and Service Role Key are required for admin client.')
  }

  return createSupabaseServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

export const createAdminSupabaseClient = createAdminClient
