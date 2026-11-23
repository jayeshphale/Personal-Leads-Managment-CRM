import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { LeadActivity } from '@/types/crm.types'
import { initialMockActivities } from '@/lib/mockData'

function getLocalActivities(): LeadActivity[] {
  const stored = localStorage.getItem('mock_activities')
  if (!stored) {
    localStorage.setItem('mock_activities', JSON.stringify(initialMockActivities))
    return initialMockActivities
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialMockActivities
  }
}

function saveLocalActivities(acts: LeadActivity[]) {
  localStorage.setItem('mock_activities', JSON.stringify(acts))
}

export interface LogActivityParams {
  lead_id: string
  activity_type: string
  old_value?: string | null
  new_value?: string | null
  notes?: string | null
}

export async function logActivity(params: LogActivityParams) {
  try {
    if (!isSupabaseConfigured) {
      const acts = getLocalActivities()
      const newAct: LeadActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        owner_id: 'owner-uuid-1',
        lead_id: params.lead_id,
        activity_type: params.activity_type,
        old_value: params.old_value || null,
        new_value: params.new_value || null,
        notes: params.notes || null,
        created_at: new Date().toISOString(),
      }
      saveLocalActivities([newAct, ...acts])
      return newAct
    }

    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null

    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        owner_id: user.id,
        lead_id: params.lead_id,
        activity_type: params.activity_type,
        old_value: params.old_value || null,
        new_value: params.new_value || null,
        notes: params.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.warn('Activity logging error:', error.message)
      return null
    }
    return data as LeadActivity
  } catch (err) {
    console.warn('Failed to record activity log:', err)
    return null
  }
}

export async function getActivitiesByLeadId(leadId: string) {
  if (!isSupabaseConfigured) {
    return getLocalActivities().filter((a) => a.lead_id === leadId)
  }

  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching lead activities:', error)
    return []
  }
  return (data as LeadActivity[]) || []
}

export async function getRecentActivities(limit: number = 10) {
  if (!isSupabaseConfigured) {
    const acts = getLocalActivities().slice(0, limit)
    const storedLeads = localStorage.getItem('mock_leads')
    const leads = storedLeads ? JSON.parse(storedLeads) : []
    return acts.map((a) => {
      const lead = leads.find((l: any) => l.id === a.lead_id)
      return {
        ...a,
        lead: lead ? { id: lead.id, first_name: lead.first_name, last_name: lead.last_name, phone: lead.phone } : undefined,
      }
    })
  }

  const { data, error } = await supabase
    .from('lead_activities')
    .select('*, lead:leads(id, first_name, last_name, phone)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent activities:', error)
    return []
  }
  return data || []
}
