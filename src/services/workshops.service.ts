import { supabase } from '@/lib/supabase'
import type { Workshop, WorkshopRegistration, AttendanceStatus } from '@/types/crm.types'
import { logActivity } from './activities.service'

export async function getWorkshops() {
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
  const { error } = await supabase.from('workshops').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function getWorkshopRegistrations(workshopId: string) {
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
