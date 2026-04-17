'use server'

import { createClient } from '@/src/lib/supabase/server'
import { validateEmail } from '@/src/lib/auth/validation'
import type { AuthActionState } from './signup'

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email') as string

  const emailResult = validateEmail(email)
  if (!emailResult.ok) return { message: emailResult.message }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  })

  if (error) return { message: error.message }

  return { message: 'Check your inbox for a password reset link.', success: true }
}
