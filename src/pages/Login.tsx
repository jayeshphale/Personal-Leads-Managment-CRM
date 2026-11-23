import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldCheck, Lock, Mail, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export const Login: React.FC = () => {
  const { signIn, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    try {
      setIsLoading(true)
      const { error } = await signIn(email, password)
      if (error) {
        setErrorMessage(error.message)
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">LeadFlow CRM</h1>
          <p className="text-xs text-slate-500">
            Personal Lead & Candidate Management — Authorized Owner Portal
          </p>
        </div>

        {/* Configuration Notice if Supabase environment variables are missing */}
        {!isConfigured && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Supabase Connection Setup Required</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              To connect your real database, configure <strong>VITE_SUPABASE_URL</strong> and{' '}
              <strong>VITE_SUPABASE_ANON_KEY</strong> in your <code>.env</code> file, then run the
              migration in <code>supabase/migrations/</code>.
            </p>
          </div>
        )}

        {/* Login Card */}
        <Card className="border border-slate-200/90 shadow-sm bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Owner Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Only authorized single-user owner credentials can access this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourdomain.com"
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secure Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Sign In to CRM <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security & Access Info */}
        <div className="p-4 bg-slate-100/70 border border-slate-200/60 rounded-xl text-[11px] text-slate-500 text-center space-y-1">
          <p className="font-semibold text-slate-700">Single-User Single-Tenant Architecture</p>
          <p>
            Public registrations are disabled. All database tables are protected by Row Level
            Security (RLS).
          </p>
        </div>
      </div>
    </div>
  )
}
