import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'

/**
 * Auth Callback Route Handler.
 * Handles PKCE exchange for email verification, magic links, and OAuth callbacks.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    const redirectUrl = new URL('/auth/login', origin)
    redirectUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const destination = next.startsWith('/') ? next : `/${next}`
      return NextResponse.redirect(new URL(destination, origin))
    }

    const redirectUrl = new URL('/auth/login', origin)
    redirectUrl.searchParams.set('error', 'Session exchange failed. The link may have expired.')
    return NextResponse.redirect(redirectUrl)
  }

  // No code provided, fallback to login
  return NextResponse.redirect(new URL('/auth/login', origin))
}

