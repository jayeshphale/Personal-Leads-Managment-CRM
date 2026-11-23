import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, Lock, Mail, AlertCircle, CheckCircle2, UserPlus, LogIn, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export const Login: React.FC = () => {
  const { signIn, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    try {
      setIsLoading(true)

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || 'CRM Owner' },
          },
        })

        if (error) {
          setErrorMessage(error.message)
          return
        }

        if (data.session) {
          // Initialize owner packages and lead sources
          try {
            await supabase.rpc('initialize_owner_account')
          } catch (e) {
            console.warn('RPC initialize note:', e)
          }
          navigate(from, { replace: true })
        } else {
          setSuccessMessage(
            'Owner account created successfully! Please check your email for a confirmation link, or sign in if email confirmation is disabled.'
          )
          setMode('signin')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setErrorMessage(error.message)
        } else {
          // Initialize packages if not already present
          try {
            await supabase.rpc('initialize_owner_account')
          } catch (e) {
            console.warn('RPC initialize note:', e)
          }
          navigate(from, { replace: true })
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
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

        {/* Supabase Connected Banner */}
        {isConfigured && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Connected to Supabase PostgreSQL Database</span>
          </div>
        )}

        {/* Card */}
        <Card className="border border-slate-200/90 shadow-sm bg-white">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {mode === 'signin' ? 'Owner Sign In' : 'Create Owner Account'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  {mode === 'signin'
                    ? 'Enter your owner credentials to access your CRM.'
                    : 'Set up your single-user owner account for this database.'}
                </CardDescription>
              </div>

              {/* Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin')
                  setErrorMessage(null)
                  setSuccessMessage(null)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
              >
                {mode === 'signin' ? 'First time setup?' : 'Back to Sign In'}
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Full Name
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jayesh Phale"
                    required
                  />
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
                  placeholder="jayeshphale4@gmail.com"
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
                {mode === 'signin' ? (
                  <>
                    Sign In to CRM <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                ) : (
                  <>
                    Create Owner Account <UserPlus className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security & Access Info */}
        <div className="p-4 bg-slate-100/70 border border-slate-200/60 rounded-xl text-[11px] text-slate-500 text-center space-y-1">
          <p className="font-semibold text-slate-700">Single-User Secure Portal</p>
          <p>
            All candidate records, call notes, and financial transactions are protected by Row Level
            Security in your Supabase PostgreSQL database.
          </p>
        </div>
      </div>
    </div>
  )
}
