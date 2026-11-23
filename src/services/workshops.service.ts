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

function getLocalWorkshopRegistrations(): WorkshopRegistration[] {
  const stored = localStorage.getItem('mock_workshop_registrations')
  if (!stored) {
    const ws = getLocalWorkshops()
    const storedLeads = localStorage.getItem('mock_leads')
    const leads = storedLeads ? JSON.parse(storedLeads) : []
    const sampleRegs: WorkshopRegistration[] = []

    ws.forEach((w) => {
      leads.forEach((l: any, idx: number) => {
        if (idx < 5) {
          sampleRegs.push({
            id: `reg-${w.id}-${l.id}`,
            owner_id: 'owner-uuid-1',
            workshop_id: w.id,
            lead_id: l.id,
            attendance_status: idx % 2 === 0 ? 'Attended' : 'Pending',
            attendance_date: idx % 2 === 0 ? new Date().toISOString() : null,
            notes: 'RSVP confirmed',
            registered_at: new Date().toISOString(),
            workshop: w,
            lead: l,
          })
        }
      })
    })

    localStorage.setItem('mock_workshop_registrations', JSON.stringify(sampleRegs))
    return sampleRegs
  }
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function saveLocalWorkshopRegistrations(regs: WorkshopRegistration[]) {
  localStorage.setItem('mock_workshop_registrations', JSON.stringify(regs))
}

export async function getWorkshops() {
  if (!isSupabaseConfigured) {
    return getLocalWorkshops()
  }

  try {
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

    if (error || !data || data.length === 0) {
      return getLocalWorkshops()
    }

    return (data || []).map((w: any) => {
      const regs = w.workshop_registrations || []
      return {
        ...w,
        registrations_count: regs.length,
        attended_count: regs.filter((r: any) => r.attendance_status === 'Attended').length,
      } as Workshop
    })
  } catch {
    return getLocalWorkshops()
  }
}

export async function getWorkshopById(id: string) {
  const localFallback = () => {
    const found = getLocalWorkshops().find((w) => w.id === id)
    if (!found) throw new Error('Workshop not found')
    return found
  }

  if (!isSupabaseConfigured) {
    return localFallback()
  }

  try {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return localFallback()
    return data as Workshop
  } catch {
    return localFallback()
  }
}

export async function createWorkshop(workshopData: {
  title: string
  description?: string
  workshop_date: string
  location_or_link?: string
  status?: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'
}) {
  const localCreate = () => {
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

  if (!isSupabaseConfigured) {
    return localCreate()
  }

  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return localCreate()

    const { data, error } = await supabase
      .from('workshops')
      .insert({
        ...workshopData,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error || !data) return localCreate()
    return data as Workshop
  } catch {
    return localCreate()
  }
}

export async function updateWorkshop(id: string, updates: Partial<Workshop>) {
  const localUpdate = () => {
    const ws = getLocalWorkshops()
    const idx = ws.findIndex((w) => w.id === id)
    if (idx !== -1) {
      ws[idx] = { ...ws[idx], ...updates, updated_at: new Date().toISOString() }
      saveLocalWorkshops(ws)
      return ws[idx]
    }
    throw new Error('Workshop not found')
  }

  if (!isSupabaseConfigured) {
    return localUpdate()
  }

  try {
    const { data, error } = await supabase
      .from('workshops')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return localUpdate()
    return data as Workshop
  } catch {
    return localUpdate()
  }
}

export async function deleteWorkshop(id: string) {
  const localDelete = () => {
    const ws = getLocalWorkshops().filter((w) => w.id !== id)
    saveLocalWorkshops(ws)
    return true
  }

  if (!isSupabaseConfigured) {
    return localDelete()
  }

  try {
    const { error } = await supabase.from('workshops').delete().eq('id', id)
    if (error) return localDelete()
    return true
  } catch {
    return localDelete()
  }
}

export async function getWorkshopRegistrations(workshopId: string) {
  const localGet = () => {
    const allRegs = getLocalWorkshopRegistrations()
    const filtered = allRegs.filter((r) => r.workshop_id === workshopId)
    if (filtered.length > 0) return filtered

    const storedLeads = localStorage.getItem('mock_leads')
    const leads = storedLeads ? JSON.parse(storedLeads) : []
    const ws = getLocalWorkshops()
    const w = ws.find((item) => item.id === workshopId) || ws[0]

    const sampleRegs: WorkshopRegistration[] = leads.slice(0, 3).map((l: any, idx: number) => ({
      id: `reg-${workshopId}-${l.id}`,
      owner_id: 'owner-uuid-1',
      workshop_id: workshopId,
      lead_id: l.id,
      attendance_status: idx === 0 ? 'Attended' : 'Pending',
      attendance_date: idx === 0 ? new Date().toISOString() : null,
      notes: 'RSVP confirmed',
      registered_at: new Date().toISOString(),
      workshop: w,
      lead: l,
    }))
    saveLocalWorkshopRegistrations([...allRegs, ...sampleRegs])
    return sampleRegs
  }

  if (!isSupabaseConfigured) {
    return localGet()
  }

  try {
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

    if (error || !data || data.length === 0) return localGet()
    return (data as WorkshopRegistration[]) || []
  } catch {
    return localGet()
  }
}

export async function registerCandidateForWorkshop(
  workshopId: string,
  leadId: string,
  notes?: string
) {
  const localRegister = async () => {
    const allRegs = getLocalWorkshopRegistrations()
    const ws = getLocalWorkshops()
    const w = ws.find((item) => item.id === workshopId) || ws[0]
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
      workshop: w,
      lead,
    }
    saveLocalWorkshopRegistrations([newReg, ...allRegs])

    await logActivity({
      lead_id: leadId,
      activity_type: 'Workshop Registered',
      new_value: w ? w.title : 'Workshop Session',
      notes,
    })
    return newReg
  }

  if (!isSupabaseConfigured) {
    return localRegister()
  }

  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return localRegister()

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

    if (error || !data) return localRegister()

    const reg = data as any
    await logActivity({
      lead_id: leadId,
      activity_type: 'Workshop Registered',
      new_value: reg.workshop?.title || 'Workshop',
      notes,
    })

    localRegister()

    return reg as WorkshopRegistration
  } catch {
    return localRegister()
  }
}

export async function updateAttendanceStatus(
  registrationId: string,
  leadId: string,
  status: AttendanceStatus,
  notes?: string
) {
  const localUpdate = async () => {
    const allRegs = getLocalWorkshopRegistrations()
    let found = false
    const updated = allRegs.map((r) => {
      if (r.id === registrationId || (r.lead_id === leadId && r.workshop_id === registrationId)) {
        found = true
        return {
          ...r,
          attendance_status: status,
          attendance_date: status === 'Attended' ? new Date().toISOString() : null,
          notes: notes !== undefined ? notes : r.notes,
        }
      }
      return r
    })

    if (!found) {
      const ws = getLocalWorkshops()
      const w = ws.find((item) => item.id === registrationId) || ws[0]
      updated.unshift({
        id: registrationId,
        owner_id: 'owner-uuid-1',
        workshop_id: w ? w.id : registrationId,
        lead_id: leadId,
        attendance_status: status,
        attendance_date: status === 'Attended' ? new Date().toISOString() : null,
        notes: notes || '',
        registered_at: new Date().toISOString(),
        workshop: w,
      })
    }

    saveLocalWorkshopRegistrations(updated)

    await logActivity({
      lead_id: leadId,
      activity_type: status === 'Attended' ? 'Workshop Attended' : 'Workshop Attendance Updated',
      new_value: status,
      notes,
    })

    return { id: registrationId, attendance_status: status }
  }

  if (!isSupabaseConfigured) {
    return localUpdate()
  }

  try {
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

    if (error || !data) {
      return localUpdate()
    }

    const reg = data as any
    await logActivity({
      lead_id: leadId,
      activity_type: status === 'Attended' ? 'Workshop Attended' : 'Workshop Attendance Updated',
      new_value: status,
      notes: `${reg.workshop?.title || ''} - ${notes || ''}`.trim(),
    })

    localUpdate()

    return reg as WorkshopRegistration
  } catch {
    return localUpdate()
  }
}

export async function getLeadWorkshopRegistrations(leadId: string) {
  const localGet = () => {
    const allRegs = getLocalWorkshopRegistrations()
    const matching = allRegs.filter((r) => r.lead_id === leadId)
    if (matching.length > 0) return matching

    const ws = getLocalWorkshops()
    if (ws.length > 0) {
      const defaultReg: WorkshopRegistration = {
        id: `reg-${ws[0].id}-${leadId}`,
        owner_id: 'owner-uuid-1',
        workshop_id: ws[0].id,
        lead_id: leadId,
        attendance_status: 'Attended',
        attendance_date: new Date().toISOString(),
        registered_at: new Date().toISOString(),
        workshop: ws[0],
      }
      saveLocalWorkshopRegistrations([defaultReg, ...allRegs])
      return [defaultReg]
    }
    return []
  }

  if (!isSupabaseConfigured) {
    return localGet()
  }

  try {
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

    if (error || !data || data.length === 0) return localGet()
    return (data as WorkshopRegistration[]) || []
  } catch {
    return localGet()
  }
}
