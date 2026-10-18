import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button, Input, Card } from '../components/ui'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

import { useAuthStore } from '../store'

type AuthMode = 'login' | 'signup' | 'forgot'

export function AuthPage() {
  const [searchParams] = useSearchParams()
  const initialMode = (searchParams.get('mode') as AuthMode) || 'login'
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const navigate = useNavigate()
  const { user, setSession, setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && user.id !== 'demo-user') {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please check your credentials in .env or Settings.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your full name'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
          },
        })
        if (signUpError) throw signUpError

        if (data.session) {
          setSession(data.session)
          setUser(data.user)
          toast.success('Account created and signed in!')
          navigate('/')
        } else if (data.user) {
          setSuccess('Account created! If email confirmation is enabled on your Supabase project, check your email to confirm, then sign in.')
          toast.success('Account created successfully!')
        }
      } else if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
        if (data.session) {
          setSession(data.session)
          setUser(data.user)
        }
        toast.success('Welcome back to LifeOS AI!')
        navigate('/')
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth`,
        })
        if (resetError) throw resetError
        setSuccess('Password reset email sent! Check your inbox.')
        toast.success('Reset email sent!')
      }
    } catch (err: any) {
      const message = err?.message || 'An error occurred during authentication'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const fillOwnerCredentials = () => {
    setName('Ramesh Yadav')
    setEmail('ramesh.yadav@gmail.com')
    setPassword('LifeOS@Owner2027')
    toast.info('Filled Owner credentials!')
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-950 to-black" />
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(134,78,255,0.5) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent-600/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-electric-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 max-w-lg">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent-600 to-electric-600 flex items-center justify-center mb-8">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display text-surface-50 mb-4 leading-tight">
            Your Personal
            <span className="gradient-text block">Growth OS</span>
          </h1>
          <p className="text-surface-400 text-sm leading-relaxed mb-8">
            Track learning, master DSA, practice English & German, build projects, 
            and move steadily toward your career goals at Google, Microsoft & Amazon.
          </p>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              '🧠 AI-powered learning memory & spaced repetition',
              '📊 Real progress tracking, not fake statistics',
              '💬 English practice with AI conversation partner',
              '🇩🇪 German A1-B2 with smart flashcards',
              '🎮 XP, streaks & challenges with friends',
              '🔒 Private & secure — your data stays yours',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-surface-400">
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:max-w-md xl:max-w-lg">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-600 to-electric-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-surface-50">LifeOS AI</span>
          </div>

          <h2 className="text-xl font-bold font-display text-surface-50 mb-1">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h2>
          <p className="text-sm text-surface-500 mb-4">
            {mode === 'login'
              ? 'Sign in to your personal growth OS'
              : mode === 'signup'
              ? 'Start your journey to career success'
              : "We'll send you a reset link"}
          </p>

          {/* Owner Preset Helper Card */}
          <div className="mb-5 p-3 rounded-xl bg-accent-600/10 border border-accent-500/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-accent-300">Owner Access (Ramesh Yadav)</p>
              <p className="text-3xs text-surface-400 font-mono">ramesh.yadav@gmail.com</p>
            </div>
            <button
              type="button"
              onClick={fillOwnerCredentials}
              className="text-2xs font-semibold px-2.5 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white transition-all shadow-sm"
            >
              Autofill Login
            </button>
          </div>

          {/* Supabase not configured warning */}
          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-400">Setup Required</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Configure your Supabase credentials in <code className="font-mono">.env</code> to enable authentication.{' '}
                  <Link to="/setup" className="underline">View setup guide →</Link>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                required
                autoComplete="name"
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
            />

            {mode !== 'forgot' && (
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-surface-500 hover:text-surface-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              loading={loading}
            >
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-surface-500">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-accent-400 hover:text-accent-300">Sign up free</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-accent-400 hover:text-accent-300">Sign in</button>
              </>
            )}
          </div>

          {mode === 'forgot' && (
            <div className="mt-4 text-center">
              <button onClick={() => setMode('login')} className="text-xs text-surface-500 hover:text-surface-300">
                ← Back to sign in
              </button>
            </div>
          )}

          {/* Guest / Direct access */}
          <div className="mt-6 pt-5 border-t border-surface-800/80 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-surface-400 hover:text-surface-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Explore as Guest / Offline Preview</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
