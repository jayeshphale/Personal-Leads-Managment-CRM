import { supabase } from '@/lib/supabase'
import type { LeadActivity } from '@/types/crm.types'

export interface LogActivityParams {
  lead_id: string
  activity_type: string
  old_value?: string | null
  new_value?: string | null
  notes?: string | null
}

export async function logActivity(params: LogActivityParams) {
  try {
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
