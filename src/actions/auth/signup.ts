'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import {
  validateEmail,
  validatePasswordLength,
  validatePasswordsMatch,
} from '@/src/lib/auth/validation'

export type AuthActionState = { message: string; success?: boolean } | null

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const emailResult = validateEmail(email)
  if (!emailResult.ok) return { message: emailResult.message }

  const passwordLengthResult = validatePasswordLength(password)
  if (!passwordLengthResult.ok) return { message: passwordLengthResult.message }

  const passwordsMatchResult = validatePasswordsMatch(password, confirmPassword)
  if (!passwordsMatchResult.ok) return { message: passwordsMatchResult.message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) return { message: error.message }

  redirect('/auth/verify-email')
}
