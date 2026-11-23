import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile, LeadSource, Package } from '@/types/crm.types'
import { initialMockProfile, initialMockSources, initialMockPackages } from '@/lib/mockData'

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const stored = localStorage.getItem('mock_profile')
    if (stored) return JSON.parse(stored)
    localStorage.setItem('mock_profile', JSON.stringify(initialMockProfile))
    return initialMockProfile
  }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      })
      .select()
      .single()
    return (newProfile as Profile) || null
  }

  return data as Profile
}

export async function updateProfile(updates: Partial<Profile>) {
  if (!isSupabaseConfigured) {
    const current = await getCurrentProfile()
    const updated = { ...current, ...updates }
    localStorage.setItem('mock_profile', JSON.stringify(updated))
    return updated as Profile
  }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

export async function getLeadSources(): Promise<LeadSource[]> {
  if (!isSupabaseConfigured) {
    const stored = localStorage.getItem('mock_sources')
    if (stored) return JSON.parse(stored)
    localStorage.setItem('mock_sources', JSON.stringify(initialMockSources))
    return initialMockSources
  }

  const { data, error } = await supabase
    .from('lead_sources')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching lead sources:', error)
    return []
  }
  return (data as LeadSource[]) || []
}

export async function createLeadSource(name: string): Promise<LeadSource> {
  if (!isSupabaseConfigured) {
    const sources = await getLeadSources()
    const newSrc: LeadSource = {
      id: `src-${Date.now()}`,
      owner_id: 'owner-uuid-1',
      name: name.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    }
    localStorage.setItem('mock_sources', JSON.stringify([...sources, newSrc]))
    return newSrc
  }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('lead_sources')
    .insert({
      owner_id: user.id,
      name: name.trim(),
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data as LeadSource
}

export async function deleteLeadSource(id: string) {
  if (!isSupabaseConfigured) {
    const sources = (await getLeadSources()).filter((s) => s.id !== id)
    localStorage.setItem('mock_sources', JSON.stringify(sources))
    return true
  }

  const { error } = await supabase.from('lead_sources').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function getSettingsPackages(): Promise<Package[]> {
  if (!isSupabaseConfigured) {
    const stored = localStorage.getItem('mock_packages')
    if (stored) return JSON.parse(stored)
    localStorage.setItem('mock_packages', JSON.stringify(initialMockPackages))
    return initialMockPackages
  }

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('price', { ascending: true })

  if (error) return []
  return (data as Package[]) || []
}

export async function updatePackageSettings(id: string, price: number, description?: string) {
  if (!isSupabaseConfigured) {
    const pkgs = await getSettingsPackages()
    const idx = pkgs.findIndex((p) => p.id === id)
    if (idx !== -1) {
      pkgs[idx].price = price
      if (description !== undefined) pkgs[idx].description = description
      localStorage.setItem('mock_packages', JSON.stringify(pkgs))
      return pkgs[idx]
    }
    throw new Error('Package not found')
  }

  const { data, error } = await supabase
    .from('packages')
    .update({ price, description })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Package
}

export async function checkDatabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Supabase credentials not configured in .env yet. Running in Live Preview Mode.',
    }
  }

  try {
    const { error } = await supabase.from('leads').select('id').limit(1)
    if (error) {
      return { ok: false, message: error.message }
    }
    return { ok: true, message: 'Database connection healthy and responsive.' }
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Connection failed' }
  }
}
