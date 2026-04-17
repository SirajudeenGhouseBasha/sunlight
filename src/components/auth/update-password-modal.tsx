'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { updatePasswordAction } from '@/src/actions/auth/update-password'
import { validatePasswordLength, validatePasswordsMatch } from '@/src/lib/auth/validation'

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
          Updating password...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Update password
        </span>
      )}
    </Button>
  )
}

interface UpdatePasswordModalProps {
  onClose: () => void
}

export function UpdatePasswordModal({ onClose }: UpdatePasswordModalProps) {
  const [state, action] = useActionState(updatePasswordAction, null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget)
    const password = data.get('password') as string
    const confirmPassword = data.get('confirmPassword') as string
    const errors: Record<string, string> = {}

    const lengthResult = validatePasswordLength(password)
    if (!lengthResult.ok) errors.password = lengthResult.message

    const matchResult = validatePasswordsMatch(password, confirmPassword)
    if (!matchResult.ok) errors.confirmPassword = matchResult.message

    if (Object.keys(errors).length > 0) {
      e.preventDefault()
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Set new password
        </h1>
        
        <p className="text-muted-foreground leading-relaxed">
          Choose a strong password to secure your account.
        </p>
      </motion.div>

      {/* Password Requirements */}
      <motion.div
        variants={fadeUp}
        className="bg-muted/50 rounded-lg p-4 mb-6"
      >
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          Password requirements:
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• At least 8 characters long</li>
          <li>• Mix of letters, numbers, and symbols</li>
          <li>• Not easily guessable</li>
        </ul>
      </motion.div>

      {/* Form */}
      <form action={action} onSubmit={handleSubmit} noValidate className="space-y-5">
        
        {/* New Password */}
        <motion.div variants={fadeUp} className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              aria-invalid={!!fieldErrors.password}
              className={`
                h-12 pr-12 bg-card border-border text-card-foreground placeholder:text-muted-foreground
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring
                rounded-lg transition-all duration-150
                ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <AnimatePresence>
            {fieldErrors.password && (
              <motion.p
                id="password-error"
                role="alert"
                className="text-sm text-red-500"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {fieldErrors.password}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Confirm Password */}
        <motion.div variants={fadeUp} className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm new password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat new password"
              required
              autoComplete="new-password"
              aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
              aria-invalid={!!fieldErrors.confirmPassword}
              className={`
                h-12 pr-12 bg-card border-border text-card-foreground placeholder:text-muted-foreground
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring
                rounded-lg transition-all duration-150
                ${fieldErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
              `}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <AnimatePresence>
            {fieldErrors.confirmPassword && (
              <motion.p
                id="confirm-error"
                role="alert"
                className="text-sm text-red-500"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {fieldErrors.confirmPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Server error */}
        <AnimatePresence>
          {state?.message && (
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
        <motion.div variants={fadeUp} className="pt-2">
          <SubmitButton />
        </motion.div>
      </form>

      {/* Security note */}
      <motion.div variants={fadeUp} className="mt-8 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          After updating your password, you'll be signed out of all devices for security.
        </p>
      </motion.div>
    </motion.div>
  )
}