import { createBrowserClient } from '@supabase/ssr'

// Singleton — prevents multiple WebSocket connections accumulating on hot reload
let _client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}

export const supabase = getSupabaseBrowserClient()
