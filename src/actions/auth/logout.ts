'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'

export async function logoutAction(): Promise<never> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
  }

  redirect('/auth/login')
}
