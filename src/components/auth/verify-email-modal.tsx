'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

/* ─── Animation variants ─────────────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease } 
  },
}

const stagger = {
  hidden: {},
  visible: { 
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2 
    } 
  },
}

interface VerifyEmailModalProps {
  onClose: () => void
}

export function VerifyEmailModal({ onClose }: VerifyEmailModalProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Icon */}
      <motion.div variants={fadeUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Check your inbox
        </h1>
        
        <p className="text-muted-foreground leading-relaxed">
          We've sent you a confirmation email. Click the link inside to activate your account and start using Sunlight.
        </p>
      </motion.div>

      {/* Instructions */}
      <motion.div variants={fadeUp} className="space-y-4 mb-8">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            What to do next:
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. Check your email inbox</li>
            <li>2. Look for an email from Sunlight</li>
            <li>3. Click the verification link</li>
            <li>4. You'll be redirected to sign in</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Didn't receive the email? Check your spam folder or request a new one.
          </p>
          
          <Button variant="outline" className="gap-2 mb-3">
            <RefreshCw className="w-4 h-4" />
            Resend verification email
          </Button>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={fadeUp} className="space-y-3">
        <Button onClick={onClose} variant="default" className="w-full">
          Continue to sign in
        </Button>
        
        <Button asChild variant="ghost" className="w-full gap-2">
          <Link href="/auth/signup">
            <ArrowLeft className="w-4 h-4" />
            Back to sign up
          </Link>
        </Button>
      </motion.div>

      {/* Help text */}
      <motion.div variants={fadeUp} className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          Having trouble? Contact our support team for assistance.
        </p>
      </motion.div>
    </motion.div>
  )
}