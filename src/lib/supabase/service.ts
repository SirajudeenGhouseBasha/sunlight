/**
 * Supabase service-role client
 *
 * Bypasses Row Level Security — use ONLY in server-side API routes
 * for operations that need to work without an authenticated user
 * (e.g. guest orders). Never expose this client to the browser.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY

export function createServiceClient() {
  if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SECRET_KEY')

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
