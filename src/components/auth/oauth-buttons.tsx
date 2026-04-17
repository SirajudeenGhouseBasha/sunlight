'use client'

import { useState } from 'react'
import { Globe, GitBranch } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { supabase } from '@/src/lib/supabase/client'

interface OAuthButtonsProps {
  redirectTo?: string
}

export function OAuthButtons({ redirectTo: _redirectTo }: OAuthButtonsProps) {
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })
    if (error) {
      setError(error.message)
    }
  }

  const handleGithubSignIn = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })
    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogleSignIn}
        type="button"
      >
        <Globe className="mr-2" />
        Continue with Google
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGithubSignIn}
        type="button"
      >
        <GitBranch className="mr-2" />
        Continue with GitHub
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
