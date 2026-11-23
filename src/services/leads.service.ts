import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Lead, Qualification, InterestStatus, CallStatus, WhatsAppStatus } from '@/types/crm.types'
import { logActivity } from './activities.service'
import { initialMockLeads } from '@/lib/mockData'

function getLocalLeads(): Lead[] {
  const stored = localStorage.getItem('mock_leads')
  if (!stored) {
    localStorage.setItem('mock_leads', JSON.stringify(initialMockLeads))
    return initialMockLeads
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialMockLeads
  }
}

function saveLocalLeads(leads: Lead[]) {
  localStorage.setItem('mock_leads', JSON.stringify(leads))
}

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

  if (!isSupabaseConfigured) {
    let list = getLocalLeads()

    if (search) {
      const s = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.first_name.toLowerCase().includes(s) ||
          l.last_name?.toLowerCase().includes(s) ||
          l.phone.includes(s) ||
          l.active_calling_no?.includes(s)
      )
    }
    if (city) list = list.filter((l) => l.city.toLowerCase() === city.toLowerCase())
    if (qualification) list = list.filter((l) => l.qualification === qualification)
    if (interestStatus) list = list.filter((l) => l.interest_status === interestStatus)
    if (callStatus) list = list.filter((l) => l.call_status === callStatus)
    if (whatsappStatus) list = list.filter((l) => l.whatsapp_status === whatsappStatus)
    if (leadSource) list = list.filter((l) => l.lead_source.toLowerCase().includes(leadSource.toLowerCase()))

    list.sort((a: any, b: any) => {
      const valA = a[sortBy] || ''
      const valB = b[sortBy] || ''
      if (sortOrder === 'asc') return valA > valB ? 1 : -1
      return valA < valB ? 1 : -1
    })

    const totalCount = list.length
    const from = (page - 1) * pageSize
    const paginated = list.slice(from, from + pageSize)

    return {
      leads: paginated,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    }
  }

  let query = supabase.from('leads').select('*', { count: 'exact' })

  if (search) {
    const s = search.trim()
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%,alternate_phone.ilike.%${s}%`)
  }

  if (city) query = query.eq('city', city)
  if (qualification) query = query.eq('qualification', qualification)
  if (interestStatus) query = query.eq('interest_status', interestStatus)
  if (callStatus) query = query.eq('call_status', callStatus)
  if (whatsappStatus) query = query.eq('whatsapp_status', whatsappStatus)
  if (leadSource) query = query.eq('lead_source', leadSource)

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
  if (!isSupabaseConfigured) {
    const res = await getLeads({ ...params, pageSize: 1000 })
    return res.leads
  }

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
  if (!isSupabaseConfigured) {
    const leads = getLocalLeads()
    const found = leads.find((l) => l.id === id)
    if (!found) throw new Error('Lead not found')
    return found
  }

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
  if (!isSupabaseConfigured) {
    const leads = getLocalLeads()
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      owner_id: 'owner-uuid-1',
      first_name: leadData.first_name || '',
      last_name: leadData.last_name || '',
      phone: leadData.phone || '',
      alternate_phone: leadData.alternate_phone || '',
      active_calling_no: leadData.active_calling_no || '',
      age: leadData.age,
      city: leadData.city || '',
      qualification: leadData.qualification || 'Other',
      occupation: leadData.occupation || '',
      lead_source: leadData.lead_source || 'Direct',
      notes: leadData.notes || '',
      interest_status: leadData.interest_status || 'New',
      call_status: leadData.call_status || 'Not Called',
      whatsapp_status: leadData.whatsapp_status || 'Not Sent',
      closing_status: leadData.closing_status || 'Not Scheduled',
      closing_notes: leadData.closing_notes || '',
      next_follow_up_date: leadData.next_follow_up_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    saveLocalLeads([newLead, ...leads])

    await logActivity({
      lead_id: newLead.id,
      activity_type: 'Lead Created',
      new_value: `${newLead.first_name} ${newLead.last_name || ''}`.trim(),
      notes: `Source: ${newLead.lead_source}`,
    })

    return newLead
  }

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

  await logActivity({
    lead_id: created.id,
    activity_type: 'Lead Created',
    new_value: `${created.first_name} ${created.last_name || ''}`.trim(),
    notes: `Source: ${created.lead_source}`,
  })

  return created
}

export async function updateLead(id: string, updates: Partial<Lead>, previousState?: Lead) {
  if (!isSupabaseConfigured) {
    const leads = getLocalLeads()
    const idx = leads.findIndex((l) => l.id === id)
    if (idx === -1) throw new Error('Lead not found')
    const updated = { ...leads[idx], ...updates, updated_at: new Date().toISOString() }
    leads[idx] = updated
    saveLocalLeads(leads)

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
  if (!isSupabaseConfigured) {
    const leads = getLocalLeads().filter((l) => l.id !== id)
    saveLocalLeads(leads)
    return true
  }

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
  if (!isSupabaseConfigured) {
    const leads = getLocalLeads()
    const updatedLeads = leads.map((l) => (ids.includes(l.id) ? { ...l, ...updates } : l))
    saveLocalLeads(updatedLeads)
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

  const { error } = await supabase.from('leads').update(updates).in('id', ids)
  if (error) {
    console.error('Error bulk updating leads:', error)
    throw error
  }

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
  if (!isSupabaseConfigured) {
    const leads = getLocalLeads()
    const found = leads.find((l) => l.phone === phone && (!excludeId || l.id !== excludeId))
    return found || null
  }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return null

  let query = supabase.from('leads').select('*').eq('phone', phone)
  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.limit(1)
  return data && data.length > 0 ? (data[0] as Lead) : null
}
