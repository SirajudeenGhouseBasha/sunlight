'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import {
  validatePasswordLength,
  validatePasswordsMatch,
} from '@/src/lib/auth/validation'
import type { AuthActionState } from './signup'

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const passwordLengthResult = validatePasswordLength(password)
  if (!passwordLengthResult.ok) return { message: passwordLengthResult.message }

  const passwordsMatchResult = validatePasswordsMatch(password, confirmPassword)
  if (!passwordsMatchResult.ok) return { message: passwordsMatchResult.message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { message: error.message }

  redirect('/dashboard')
}
