import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  // If no code, redirect to login
  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Validate the `next` param to prevent open-redirect attacks
  // Reject absolute URLs (http://, https://, //)
  let redirectTo = '/dashboard'
  if (next) {
    if (
      next.startsWith('http://') ||
      next.startsWith('https://') ||
      next.startsWith('//')
    ) {
      // Absolute URL — replace with safe default
      redirectTo = '/dashboard'
    } else {
      // Valid relative path
      redirectTo = next
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL('/auth/login?error=' + encodeURIComponent(error.message), request.url)
    )
  }

  return NextResponse.redirect(new URL(redirectTo, request.url))
}
