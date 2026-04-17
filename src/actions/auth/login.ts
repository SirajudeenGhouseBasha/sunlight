'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { validateEmail, validateNonEmpty } from '@/src/lib/auth/validation'
import type { AuthActionState } from './signup'

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const emailResult = validateEmail(email)
  if (!emailResult.ok) return { message: emailResult.message }

  const passwordResult = validateNonEmpty(password, 'Password')
  if (!passwordResult.ok) return { message: passwordResult.message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { message: error.message }

  redirect('/dashboard')
}
