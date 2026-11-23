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

const OWNER_EMAIL = 'jayeshphale4@gmail.com'
const OWNER_PASS = 'Jayesh37@'

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
    // If owner or demo session was saved in localStorage
    const savedOwnerEmail = localStorage.getItem('leadflow_owner_email')
    if (savedOwnerEmail || isDemoMode) {
      const activeEmail = savedOwnerEmail || 'jayeshphale4@gmail.com'
      setUser({
        id: 'owner-uuid-1',
        email: activeEmail,
        app_metadata: {},
        user_metadata: { full_name: 'Jayesh Phale' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User)
      setProfile({
        ...initialMockProfile,
        email: activeEmail,
        full_name: 'Jayesh Phale',
      })
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
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPass = pass.trim()

    // 1. Direct authorization for configured owner credentials
    if (trimmedEmail === OWNER_EMAIL && trimmedPass === OWNER_PASS) {
      localStorage.setItem('leadflow_owner_email', OWNER_EMAIL)
      setUser({
        id: 'owner-uuid-1',
        email: OWNER_EMAIL,
        app_metadata: {},
        user_metadata: { full_name: 'Jayesh Phale' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User)
      setProfile({
        ...initialMockProfile,
        email: OWNER_EMAIL,
        full_name: 'Jayesh Phale',
      })

      // Try background login with Supabase to sync real session if confirmed
      if (isSupabaseConfigured) {
        supabase.auth.signInWithPassword({ email: trimmedEmail, password: trimmedPass }).catch(() => {})
      }
      return { error: null }
    }

    // 2. Standard Supabase Auth check
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Invalid credentials. Please use your owner email and password, or click Explore CRM Interface Now.'
        ),
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPass,
    })

    if (!error && data.user) {
      localStorage.setItem('leadflow_owner_email', data.user.email || trimmedEmail)
    }

    return { error: error ? new Error(error.message) : null }
  }

  const signInDemo = () => {
    localStorage.setItem('leadflow_crm_demo', 'true')
    localStorage.setItem('leadflow_owner_email', OWNER_EMAIL)
    setIsDemoMode(true)
    setUser({
      id: 'owner-uuid-1',
      email: OWNER_EMAIL,
      app_metadata: {},
      user_metadata: { full_name: 'Jayesh Phale' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User)
    setProfile({
      ...initialMockProfile,
      email: OWNER_EMAIL,
      full_name: 'Jayesh Phale',
    })
  }

  const signOut = async () => {
    localStorage.removeItem('leadflow_crm_demo')
    localStorage.removeItem('leadflow_owner_email')
    setIsDemoMode(false)
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {})
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
