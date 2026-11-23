import { supabase } from '@/lib/supabase'
import type { CourseEnrollment, Package, PackageName, PaymentStatus } from '@/types/crm.types'
import { logActivity } from './activities.service'

export async function getPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching packages:', error)
    return []
  }
  return (data as Package[]) || []
}

export async function updatePackage(id: string, updates: Partial<Package>) {
  const { data, error } = await supabase
    .from('packages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Package
}

export async function getEnrollments() {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      lead:leads (
        id,
        first_name,
        last_name,
        phone,
        city,
        qualification
      )
    `)
    .order('enrollment_date', { ascending: false })

  if (error) {
    console.error('Error fetching enrollments:', error)
    throw error
  }

  return (data as CourseEnrollment[]) || []
}

export async function getLeadEnrollments(leadId: string) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('lead_id', leadId)
    .order('enrollment_date', { ascending: false })

  if (error) throw error
  return (data as CourseEnrollment[]) || []
}

export async function createEnrollment(params: {
  lead_id: string
  package_name: PackageName
  package_id?: string | null
  enrollment_date: string
  amount: number
  payment_status: PaymentStatus
  notes?: string
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      ...params,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) throw error

  const created = data as CourseEnrollment

  // Automatically update lead interest_status to 'Converted'
  await supabase
    .from('leads')
    .update({ interest_status: 'Converted' })
    .eq('id', params.lead_id)

  await logActivity({
    lead_id: params.lead_id,
    activity_type: 'Course Enrolled',
    new_value: `${params.package_name} (₹${params.amount} - ${params.payment_status})`,
    notes: params.notes,
  })

  return created
}

export async function updateEnrollment(id: string, updates: Partial<CourseEnrollment>, leadId: string) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  const updated = data as CourseEnrollment

  if (updates.payment_status) {
    await logActivity({
      lead_id: leadId,
      activity_type: 'Payment Status Updated',
      new_value: `${updated.package_name}: ${updates.payment_status}`,
      notes: updates.notes,
    })
  }

  return updated
}

export async function deleteEnrollment(id: string) {
  const { error } = await supabase.from('course_enrollments').delete().eq('id', id)
  if (error) throw error
  return true
}
