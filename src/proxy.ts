import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard']

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/update-password',
  '/auth/callback',
]

export async function proxy(request: NextRequest): Promise<Response> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Guest accessing a protected route → redirect to login
  if (!user && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Authenticated user accessing an auth route → redirect to dashboard
  if (user && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Only run on page routes — skip all Next.js internals, static files,
     * and API routes that don't need auth checks. This prevents a new
     * Supabase client + network call on every asset request.
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|__nextjs_font|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf|eot|ico)$).*)',
  ],
}
