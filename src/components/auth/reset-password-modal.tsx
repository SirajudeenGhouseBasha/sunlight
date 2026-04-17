'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { resetPasswordAction } from '@/src/actions/auth/reset-password'
import { validateEmail } from '@/src/lib/auth/validation'

/* ─── Animation variants ─────────────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.25, ease } 
  },
}

const stagger = {
  hidden: {},
  visible: { 
    transition: { 
      staggerChildren: 0.06,
      delayChildren: 0.1 
    } 
  },
}

/* ─── Submit button ──────────────────────────────────────────────────────── */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="
        w-full h-12 text-sm font-medium
        bg-foreground hover:bg-foreground/90
        text-background
        rounded-lg
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        active:scale-[0.98]
        border-0
        shadow-sm
      "
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending link...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Send reset link
        </span>
      )}
    </Button>
  )
}

interface ResetPasswordModalProps {
  onClose: () => void
}

export function ResetPasswordModal({ onClose }: ResetPasswordModalProps) {
  const [state, action] = useActionState(resetPasswordAction, null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget)
    const email = data.get('email') as string
    const errors: Record<string, string> = {}

    const emailResult = validateEmail(email)
    if (!emailResult.ok) errors.email = emailResult.message

    if (Object.keys(errors).length > 0) {
      e.preventDefault()
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
  }

  return (
    <AnimatePresence mode="wait">
      {state?.success ? (
        /* Success State */
        <motion.div
          key="success"
          className="text-center space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground">
              Check your email
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {state.message}
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={onClose} className="w-full">
              Back to sign in
            </Button>
            <Button asChild variant="ghost" className="w-full gap-2">
              <Link href="/auth/signup">
                <ArrowLeft className="w-4 h-4" />
                Create new account
              </Link>
            </Button>
          </div>
        </motion.div>
      ) : (
        /* Form State */
        <motion.div
          key="form"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            
            <h1 className="text-2xl font-semibold text-foreground mb-3">
              Reset your password
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </motion.div>

          {/* Form */}
          <form action={action} onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Email */}
            <motion.div variants={fadeUp} className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                autoComplete="email"
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                aria-invalid={!!fieldErrors.email}
                className={`
                  h-12 bg-card border-border text-card-foreground placeholder:text-muted-foreground
                  focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring
                  rounded-lg transition-all duration-150
                  ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                `}
              />
              <AnimatePresence>
                {fieldErrors.email && (
                  <motion.p
                    id="email-error"
                    role="alert"
                    className="text-sm text-red-500"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {fieldErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Server error */}
            <AnimatePresence>
              {state?.message && !state.success && (
                <motion.div
                  role="alert"
                  className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {state.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div variants={fadeUp}>
              <SubmitButton />
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div variants={fadeUp} className="mt-8 text-center space-y-4">
            <Button onClick={onClose} variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 w-4" />
              Back to sign in
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Remember your password?{' '}
              <button 
                onClick={onClose}
                className="text-foreground hover:underline transition-colors underline-offset-4"
              >
                Sign in instead
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}