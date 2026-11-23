import { supabase } from '@/lib/supabase'
import type { Profile, LeadSource, Package } from '@/types/crm.types'

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    // If profile row doesn't exist yet, create it on the fly
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
  const { error } = await supabase.from('lead_sources').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function getSettingsPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('price', { ascending: true })

  if (error) return []
  return (data as Package[]) || []
}

export async function updatePackageSettings(id: string, price: number, description?: string) {
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
