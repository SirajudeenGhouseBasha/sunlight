'use client'

import { useActionState, useState, useEffect, Suspense } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Eye, EyeOff, Sun, UserPlus } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { AuthModal } from '@/src/components/auth/auth-modal'
import { VerifyEmailModal } from '@/src/components/auth/verify-email-modal'
import { signUpAction } from '@/src/actions/auth/signup'
import {
  validateEmail,
  validatePasswordLength,
  validatePasswordsMatch,
} from '@/src/lib/auth/validation'

/* ─── Animation variants - Using minimalist design system ─────────────────── */
const ease = [0.16, 1, 0.3, 1] as const

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.35, ease, delay: 0.1 }
  },
}

const slideInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease, delay: 0.15 }
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.25, ease } 
  },
}



/* ─── Submit button - Minimalist design ────────────────────────────────────── */
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
          Creating account...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Create account
        </span>
      )}
    </Button>
  )
}

/* ─── OAuth Button Component - Clean and minimal ───────────────────────────── */
function CustomOAuthButton({ 
  icon: Icon, 
  children 
}: { 
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode 
}) {
  return (
    <button
      type="button"
      className="
        w-full h-12 
        bg-card hover:bg-muted/50
        text-card-foreground 
        rounded-lg
        border border-border
        transition-all duration-150
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        active:scale-[0.98]
        flex items-center justify-center gap-3
        font-medium text-sm
        shadow-sm
      "
    >
      <Icon className="w-5 h-5" />
      {children}
    </button>
  )
}

/* ─── Main component - Minimalist signup page ──────────────────────────────── */
function SignUpPageContent() {
  const [state, action] = useActionState(signUpAction, null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  
  // Handle URL-based modal opening
  useEffect(() => {
    const modal = searchParams.get('modal')
    if (modal === 'verify-email') {
      setActiveModal(modal)
    }
  }, [searchParams])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget)
    const errors: Record<string, string> = {}

    const emailResult = validateEmail(data.get('email') as string)
    if (!emailResult.ok) errors.email = emailResult.message

    const passwordResult = validatePasswordLength(data.get('password') as string)
    if (!passwordResult.ok) errors.password = passwordResult.message

    const matchResult = validatePasswordsMatch(
      data.get('password') as string, 
      data.get('confirmPassword') as string
    )
    if (!matchResult.ok) errors.confirmPassword = matchResult.message

    if (Object.keys(errors).length > 0) {
      e.preventDefault()
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
  }

  return (
    <>
      <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* ══════════════════════════════════════════════════════════════════
          Left Side - Clean minimal branding (Mobile: 30% height, Desktop: 50% width)
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        className="h-[30vh] lg:h-screen lg:w-1/2 relative overflow-hidden bg-foreground"
        variants={slideInUp}
        initial="hidden"
        animate="visible"
      >
        {/* Simple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground/90" />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-background"
          >
            {/* Logo */}
            <div className="w-16 h-16 bg-background/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-background/30">
              <Sun className="w-8 h-8 text-background" />
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-semibold mb-3">
              Start your journey
            </h2>
            <p className="text-background/80 text-lg max-w-md leading-relaxed">
              Join thousands of users who trust Sunlight
            </p>
          </motion.div>
        </div>

        {/* Mobile logo (top-left) */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-background/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-background/30">
            <Sun className="w-4 h-4 text-background" />
          </div>
          <span className="text-background font-semibold text-lg">Sunlight</span>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          Signup Form Section - Mobile: 70% height, Desktop: 50% width
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        className="flex-1 lg:w-1/2 bg-background flex items-center justify-center p-6 lg:p-12"
        variants={slideInRight}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="w-full max-w-sm"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-8">
            <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-3">
              Create account
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Sign up to get started with Sunlight
            </p>
          </motion.div>

          {/* Google OAuth Button */}
          <motion.div variants={fadeUp} className="mb-6">
            <CustomOAuthButton icon={Sun}>
              Continue with Google
            </CustomOAuthButton>
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* Email Form */}
          <form action={action} onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <motion.div variants={fadeUp} className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
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

            {/* Password */}
            <motion.div variants={fadeUp} className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
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
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
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
                    id="confirm-password-error"
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

          {/* Sign in link */}
          <motion.div variants={fadeUp} className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-foreground font-medium hover:underline transition-colors underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Terms */}
          <motion.div variants={fadeUp} className="mt-6 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link 
                href="#" 
                className="text-foreground hover:underline transition-colors underline-offset-4"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link 
                href="#" 
                className="text-foreground hover:underline transition-colors underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
      </div>

      {/* Verify Email Modal */}
      <AuthModal 
        isOpen={activeModal === 'verify-email'} 
        onClose={() => setActiveModal(null)}
      >
        <VerifyEmailModal onClose={() => setActiveModal(null)} />
      </AuthModal>
    </>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPageContent />
    </Suspense>
  )
}