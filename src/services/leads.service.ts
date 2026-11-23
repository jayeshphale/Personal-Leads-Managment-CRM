import { supabase } from '@/lib/supabase'
import type { Lead, Qualification, InterestStatus, CallStatus, WhatsAppStatus } from '@/types/crm.types'
import { logActivity } from './activities.service'

export interface GetLeadsParams {
  search?: string
  city?: string
  qualification?: string
  interestStatus?: string
  callStatus?: string
  whatsappStatus?: string
  leadSource?: string
  sortBy?: 'created_at' | 'first_name' | 'next_follow_up_date'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function getLeads(params: GetLeadsParams = {}) {
  const {
    search,
    city,
    qualification,
    interestStatus,
    callStatus,
    whatsappStatus,
    leadSource,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    pageSize = 15,
  } = params

  let query = supabase.from('leads').select('*', { count: 'exact' })

  if (search) {
    const s = search.trim()
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%,alternate_phone.ilike.%${s}%`)
  }

  if (city) {
    query = query.eq('city', city)
  }
  if (qualification) {
    query = query.eq('qualification', qualification)
  }
  if (interestStatus) {
    query = query.eq('interest_status', interestStatus)
  }
  if (callStatus) {
    query = query.eq('call_status', callStatus)
  }
  if (whatsappStatus) {
    query = query.eq('whatsapp_status', whatsappStatus)
  }
  if (leadSource) {
    query = query.eq('lead_source', leadSource)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching leads:', error)
    throw error
  }

  return {
    leads: (data as Lead[]) || [],
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

export async function getAllLeadsForExport(params: Omit<GetLeadsParams, 'page' | 'pageSize'> = {}) {
  let query = supabase.from('leads').select('*')

  if (params.search) {
    const s = params.search.trim()
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%`)
  }
  if (params.city) query = query.eq('city', params.city)
  if (params.qualification) query = query.eq('qualification', params.qualification)
  if (params.interestStatus) query = query.eq('interest_status', params.interestStatus)
  if (params.callStatus) query = query.eq('call_status', params.callStatus)
  if (params.whatsappStatus) query = query.eq('whatsapp_status', params.whatsappStatus)
  if (params.leadSource) query = query.eq('lead_source', params.leadSource)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data as Lead[]) || []
}

export async function getLeadById(id: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching lead details:', error)
    throw error
  }
  return data as Lead
}

export async function createLead(leadData: Partial<Lead>) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('User not authenticated')

  const payload = {
    ...leadData,
    owner_id: user.id,
  }

  const { data, error } = await supabase
    .from('leads')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    throw error
  }

  const created = data as Lead

  // Log activity
  await logActivity({
    lead_id: created.id,
    activity_type: 'Lead Created',
    new_value: `${created.first_name} ${created.last_name || ''}`.trim(),
    notes: `Source: ${created.lead_source}`,
  })

  return created
}

export async function updateLead(id: string, updates: Partial<Lead>, previousState?: Lead) {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating lead:', error)
    throw error
  }

  const updated = data as Lead

  // Log specific status transitions if previousState provided
  if (previousState) {
    if (updates.call_status && updates.call_status !== previousState.call_status) {
      await logActivity({
        lead_id: id,
        activity_type: updates.call_status === 'Connected' ? 'Call Connected' : 'Call Attempted',
        old_value: previousState.call_status,
        new_value: updates.call_status,
        notes: updates.notes,
      })
    }
    if (updates.whatsapp_status && updates.whatsapp_status !== previousState.whatsapp_status) {
      await logActivity({
        lead_id: id,
        activity_type: updates.whatsapp_status === 'Replied' ? 'WhatsApp Reply Received' : 'WhatsApp Message Sent',
        old_value: previousState.whatsapp_status,
        new_value: updates.whatsapp_status,
      })
    }
    if (updates.interest_status && updates.interest_status !== previousState.interest_status) {
      await logActivity({
        lead_id: id,
        activity_type: 'Interest Status Changed',
        old_value: previousState.interest_status,
        new_value: updates.interest_status,
      })
    }
  }

  return updated
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) {
    console.error('Error deleting lead:', error)
    throw error
  }
  return true
}

export async function bulkUpdateStatus(
  ids: string[],
  updates: {
    call_status?: CallStatus
    whatsapp_status?: WhatsAppStatus
    interest_status?: InterestStatus
    qualification?: Qualification
  }
) {
  const { error } = await supabase.from('leads').update(updates).in('id', ids)
  if (error) {
    console.error('Error bulk updating leads:', error)
    throw error
  }

  // Log bulk activity for each
  for (const id of ids) {
    const changes = Object.entries(updates)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    await logActivity({
      lead_id: id,
      activity_type: 'Bulk Update',
      new_value: changes,
    })
  }

  return true
}

export async function checkDuplicatePhone(phone: string, excludeId?: string): Promise<Lead | null> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return null

  let query = supabase.from('leads').select('*').eq('phone', phone)
  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.limit(1)
  return data && data.length > 0 ? (data[0] as Lead) : null
}
