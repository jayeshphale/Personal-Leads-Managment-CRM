import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Workshop, WorkshopRegistration, AttendanceStatus } from '@/types/crm.types'
import { logActivity } from './activities.service'
import { initialMockWorkshops } from '@/lib/mockData'

function getLocalWorkshops(): Workshop[] {
  const stored = localStorage.getItem('mock_workshops')
  if (!stored) {
    localStorage.setItem('mock_workshops', JSON.stringify(initialMockWorkshops))
    return initialMockWorkshops
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialMockWorkshops
  }
}

function saveLocalWorkshops(ws: Workshop[]) {
  localStorage.setItem('mock_workshops', JSON.stringify(ws))
}

export async function getWorkshops() {
  if (!isSupabaseConfigured) {
    return getLocalWorkshops()
  }

  const { data, error } = await supabase
    .from('workshops')
    .select(`
      *,
      workshop_registrations (
        id,
        attendance_status
      )
    `)
    .order('workshop_date', { ascending: false })

  if (error) {
    console.error('Error fetching workshops:', error)
    throw error
  }

  return (data || []).map((w: any) => {
    const regs = w.workshop_registrations || []
    return {
      ...w,
      registrations_count: regs.length,
      attended_count: regs.filter((r: any) => r.attendance_status === 'Attended').length,
    } as Workshop
  })
}

export async function getWorkshopById(id: string) {
  if (!isSupabaseConfigured) {
    const found = getLocalWorkshops().find((w) => w.id === id)
    if (!found) throw new Error('Workshop not found')
    return found
  }

  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Workshop
}

export async function createWorkshop(workshopData: {
  title: string
  description?: string
  workshop_date: string
  location_or_link?: string
  status?: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'
}) {
  if (!isSupabaseConfigured) {
    const ws = getLocalWorkshops()
    const newW: Workshop = {
      id: `ws-${Date.now()}`,
      owner_id: 'owner-uuid-1',
      title: workshopData.title,
      description: workshopData.description || '',
      workshop_date: workshopData.workshop_date,
      location_or_link: workshopData.location_or_link || 'Online',
      status: workshopData.status || 'Scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      registrations_count: 0,
      attended_count: 0,
    }
    saveLocalWorkshops([newW, ...ws])
    return newW
  }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('workshops')
    .insert({
      ...workshopData,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as Workshop
}

export async function updateWorkshop(id: string, updates: Partial<Workshop>) {
  if (!isSupabaseConfigured) {
    const ws = getLocalWorkshops()
    const idx = ws.findIndex((w) => w.id === id)
    if (idx !== -1) {
      ws[idx] = { ...ws[idx], ...updates, updated_at: new Date().toISOString() }
      saveLocalWorkshops(ws)
      return ws[idx]
    }
    throw new Error('Workshop not found')
  }

  const { data, error } = await supabase
    .from('workshops')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Workshop
}

export async function deleteWorkshop(id: string) {
  if (!isSupabaseConfigured) {
    const ws = getLocalWorkshops().filter((w) => w.id !== id)
    saveLocalWorkshops(ws)
    return true
  }

  const { error } = await supabase.from('workshops').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function getWorkshopRegistrations(workshopId: string) {
  if (!isSupabaseConfigured) {
    const stored = localStorage.getItem(`mock_regs_${workshopId}`)
    if (stored) return JSON.parse(stored)

    const storedLeads = localStorage.getItem('mock_leads')
    const leads = storedLeads ? JSON.parse(storedLeads) : []
    const sampleRegs: WorkshopRegistration[] = leads.slice(0, 3).map((l: any, idx: number) => ({
      id: `reg-${workshopId}-${l.id}`,
      owner_id: 'owner-uuid-1',
      workshop_id: workshopId,
      lead_id: l.id,
      attendance_status: idx === 0 ? 'Attended' : 'Pending',
      attendance_date: idx === 0 ? new Date().toISOString() : null,
      notes: 'RSVP confirmed',
      registered_at: new Date().toISOString(),
      lead: l,
    }))
    localStorage.setItem(`mock_regs_${workshopId}`, JSON.stringify(sampleRegs))
    return sampleRegs
  }

  const { data, error } = await supabase
    .from('workshop_registrations')
    .select(`
      *,
      lead:leads (
        id,
        first_name,
        last_name,
        phone,
        city,
        qualification,
        call_status
      )
    `)
    .eq('workshop_id', workshopId)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return (data as WorkshopRegistration[]) || []
}

export async function registerCandidateForWorkshop(
  workshopId: string,
  leadId: string,
  notes?: string
) {
  if (!isSupabaseConfigured) {
    const regs = await getWorkshopRegistrations(workshopId)
    const storedLeads = localStorage.getItem('mock_leads')
    const leads = storedLeads ? JSON.parse(storedLeads) : []
    const lead = leads.find((l: any) => l.id === leadId)

    const newReg: WorkshopRegistration = {
      id: `reg-${Date.now()}`,
      owner_id: 'owner-uuid-1',
      workshop_id: workshopId,
      lead_id: leadId,
      attendance_status: 'Pending',
      attendance_date: null,
      notes: notes || '',
      registered_at: new Date().toISOString(),
      lead,
    }
    localStorage.setItem(`mock_regs_${workshopId}`, JSON.stringify([newReg, ...regs]))

    await logActivity({
      lead_id: leadId,
      activity_type: 'Workshop Registered',
      new_value: 'Workshop Session',
      notes,
    })
    return newReg
  }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('workshop_registrations')
    .insert({
      owner_id: user.id,
      workshop_id: workshopId,
      lead_id: leadId,
      notes: notes || '',
      attendance_status: 'Pending',
    })
    .select(`*, workshop:workshops(title)`)
    .single()

  if (error) throw error

  const reg = data as any
  await logActivity({
    lead_id: leadId,
    activity_type: 'Workshop Registered',
    new_value: reg.workshop?.title || 'Workshop',
    notes,
  })

  return reg as WorkshopRegistration
}

export async function updateAttendanceStatus(
  registrationId: string,
  leadId: string,
  status: AttendanceStatus,
  notes?: string
) {
  if (!isSupabaseConfigured) {
    await logActivity({
      lead_id: leadId,
      activity_type: status === 'Attended' ? 'Workshop Attended' : 'Workshop Attendance Updated',
      new_value: status,
      notes,
    })
    return {} as any
  }

  const updates: any = {
    attendance_status: status,
    attendance_date: status === 'Attended' ? new Date().toISOString() : null,
  }
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('workshop_registrations')
    .update(updates)
    .eq('id', registrationId)
    .select(`*, workshop:workshops(title)`)
    .single()

  if (error) throw error

  const reg = data as any
  await logActivity({
    lead_id: leadId,
    activity_type: status === 'Attended' ? 'Workshop Attended' : 'Workshop Attendance Updated',
    new_value: status,
    notes: `${reg.workshop?.title || ''} - ${notes || ''}`.trim(),
  })

  return reg as WorkshopRegistration
}

export async function getLeadWorkshopRegistrations(leadId: string) {
  if (!isSupabaseConfigured) {
    const ws = getLocalWorkshops()
    return ws.slice(0, 1).map((w) => ({
      id: `reg-${w.id}-${leadId}`,
      owner_id: 'owner-uuid-1',
      workshop_id: w.id,
      lead_id: leadId,
      attendance_status: 'Attended' as AttendanceStatus,
      attendance_date: new Date().toISOString(),
      registered_at: new Date().toISOString(),
      workshop: w,
    }))
  }

  const { data, error } = await supabase
    .from('workshop_registrations')
    .select(`
      *,
      workshop:workshops (
        id,
        title,
        workshop_date,
        location_or_link,
        status
      )
    `)
    .eq('lead_id', leadId)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return (data as WorkshopRegistration[]) || []
}
