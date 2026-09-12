import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Refresh Supabase session cookies
  const { supabaseResponse, user, supabase } = await updateSession(request)

  const isDev = process.env.NODE_ENV !== 'production'
  const devSessionCookie = isDev ? request.cookies.get('byb_dev_session')?.value : null
  const isDevAuthed = isDev && Boolean(devSessionCookie && ['owner', 'manager', 'admin'].includes(devSessionCookie))

  // 2. Protect /app routes (Salon Operations)
  if (pathname.startsWith('/app')) {
    if (!user && !isDevAuthed) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 3. Protect /admin routes (Platform Administration)
  if (pathname.startsWith('/admin')) {
    if (!user && !isDevAuthed) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (user) {
      // Verify platform admin server-side
      const { data: adminRecord } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!adminRecord) {
        // Unauthorized: redirect to regular salon dashboard
        return NextResponse.redirect(new URL('/app', request.url))
      }
    } else if (isDevAuthed && devSessionCookie !== 'admin') {
      return NextResponse.redirect(new URL('/app', request.url))
    }
  }

  // 4. Redirect logged-in users away from auth pages if already authenticated
  if ((user || isDevAuthed) && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/app'
    return NextResponse.redirect(new URL(returnUrl, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/app/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
}