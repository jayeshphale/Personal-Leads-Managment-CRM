import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile } from '@/types/crm.types'
import { getCurrentProfile } from '@/services/settings.service'
import { initialMockProfile } from '@/lib/mockData'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isConfigured: boolean
  isDemoMode: boolean
  signIn: (email: string, pass: string) => Promise<{ error: Error | null }>
  signInDemo: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('leadflow_crm_demo') === 'true'
  })

  const fetchProfile = async () => {
    try {
      const p = await getCurrentProfile()
      setProfile(p)
    } catch (e) {
      console.warn('Could not fetch user profile:', e)
    }
  }

  useEffect(() => {
    // If demo mode was previously set
    if (isDemoMode) {
      setUser({
        id: 'owner-uuid-1',
        email: 'owner@leadflowcrm.com',
        app_metadata: {},
        user_metadata: { full_name: 'Jayesh Phale' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User)
      setProfile(initialMockProfile)
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile()
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile()
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isDemoMode])

  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase credentials are not configured in .env. Click "Explore Demo Preview Mode" below to test the UI, or add your Supabase keys.'
        ),
      }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signInDemo = () => {
    localStorage.setItem('leadflow_crm_demo', 'true')
    setIsDemoMode(true)
    setUser({
      id: 'owner-uuid-1',
      email: 'owner@leadflowcrm.com',
      app_metadata: {},
      user_metadata: { full_name: 'Jayesh Phale' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User)
    setProfile(initialMockProfile)
  }

  const signOut = async () => {
    localStorage.removeItem('leadflow_crm_demo')
    setIsDemoMode(false)
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        isDemoMode,
        signIn,
        signInDemo,
        signOut,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
