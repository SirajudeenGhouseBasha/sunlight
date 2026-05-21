import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function createClient() {
  console.log('[Supabase] Creating client...', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
    urlPrefix: SUPABASE_URL?.substring(0, 20)
  })
  
  if (!SUPABASE_URL) {
    console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL')
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!SUPABASE_ANON_KEY) {
    console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const cookieStore = await cookies()
  console.log('[Supabase] Cookie store obtained, creating server client')
  
  const client = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
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
            // setAll called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  )
  
  console.log('[Supabase] Client created successfully')
  return client
}
