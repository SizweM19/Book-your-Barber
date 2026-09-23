import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && url !== 'https://placeholder.supabase.co' && !url.includes('placeholder'))
}

export function getClientSupabaseConfig() {
  const isConfigured = isSupabaseConfigured()
  return {
    url: isConfigured ? (process.env.NEXT_PUBLIC_SUPABASE_URL as string) : 'https://placeholder.supabase.co',
    key: isConfigured ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) : 'placeholder-anon-key',
    isConfigured,
  }
}

export function createBrowserClient(customUrl?: string, customKey?: string) {
  const config = getClientSupabaseConfig()
  const url = customUrl || config.url
  const key = customKey || config.key

  if (typeof window === 'undefined') {
    return createSupabaseBrowserClient(url, key)
  }

  if (!browserClient) {
    browserClient = createSupabaseBrowserClient(url, key)
  }

  return browserClient
}

export const createClient = createBrowserClient
export const createBrowserSupabaseClient = createBrowserClient
