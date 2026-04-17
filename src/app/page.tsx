'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sun, ArrowRight, Zap, Shield, Users, Github, Twitter } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { supabase } from '../lib/supabase/client'

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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.5, ease } 
  },
}

/* ─── Features data ──────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built for speed and performance with modern web technologies.'
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description: 'Enterprise-grade security with end-to-end encryption.'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with real-time collaboration tools.'
  },
]

export default function HomePage() {
  const [isTestingSupabase, setIsTestingSupabase] = useState(false)

  const testSupabase = async () => {
    setIsTestingSupabase(true)
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('Supabase test:', { data, error })
      alert(data.session ? 'Supabase connected! Session found.' : 'Supabase connected! No active session.')
    } catch (err) {
      console.error('Supabase error:', err)
      alert('Supabase connection failed. Check console for details.')
    } finally {
      setIsTestingSupabase(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ══════════════════════════════════════════════════════════════════
          Header Navigation
      ══════════════════════════════════════════════════════════════════ */}
      <motion.header 
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <div className="container-wide flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-background" />
            </div>
            <span className="text-xl font-semibold text-foreground">Sunlight</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <button 
              onClick={testSupabase}
              disabled={isTestingSupabase}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isTestingSupabase ? 'Testing...' : 'Test DB'}
            </button>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
          Hero Section
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32">
        <div className="container-wide">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              variants={fadeUp}
              className="text-4xl lg:text-6xl font-semibold text-foreground mb-6 text-balance"
            >
              Illuminate your workflow with{' '}
              <span className="gradient-text">Sunlight</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeUp}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance"
            >
              A clean, minimal, and powerful platform designed to help teams collaborate 
              and build amazing products together.
            </motion.p>

            <motion.div 
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/auth/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Features Section
      ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container-wide">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
              Built for modern teams
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to collaborate effectively and ship faster.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-background" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA Section
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="container-narrow">
          <motion.div
            className="text-center bg-card border border-border rounded-2xl p-12"
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of teams already using Sunlight to build better products.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/auth/signup">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="h-12 px-8" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Footer
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
                <Sun className="w-3 h-3 text-background" />
              </div>
              <span className="font-semibold text-foreground">Sunlight</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <div className="flex items-center gap-3">
                <Link 
                  href="#" 
                  className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-4 h-4" />
                </Link>
                <Link 
                  href="#" 
                  className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Sunlight. Built with minimalist design principles.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}