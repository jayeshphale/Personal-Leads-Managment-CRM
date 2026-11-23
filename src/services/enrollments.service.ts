import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { CourseEnrollment, Package, PackageName, PaymentStatus } from '@/types/crm.types'
import { logActivity } from './activities.service'
import { initialMockPackages, initialMockEnrollments } from '@/lib/mockData'

function getLocalEnrollments(): CourseEnrollment[] {
  const stored = localStorage.getItem('mock_enrollments')
  if (!stored) {
    localStorage.setItem('mock_enrollments', JSON.stringify(initialMockEnrollments))
    return initialMockEnrollments
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialMockEnrollments
  }
}

function saveLocalEnrollments(enrs: CourseEnrollment[]) {
  localStorage.setItem('mock_enrollments', JSON.stringify(enrs))
}

export async function getPackages() {
  const localPackages = () => {
    const stored = localStorage.getItem('mock_packages')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {}
    }
    localStorage.setItem('mock_packages', JSON.stringify(initialMockPackages))
    return initialMockPackages
  }

  if (!isSupabaseConfigured) {
    return localPackages()
  }

  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error || !data || data.length === 0) {
      return localPackages()
    }
    return (data as Package[]) || []
  } catch {
    return localPackages()
  }
}

export async function updatePackage(id: string, updates: Partial<Package>) {
  const localUpdate = async () => {
    const pkgs = await getPackages()
    const idx = pkgs.findIndex((p: any) => p.id === id)
    if (idx !== -1) {
      pkgs[idx] = { ...pkgs[idx], ...updates }
      localStorage.setItem('mock_packages', JSON.stringify(pkgs))
      return pkgs[idx]
    }
    throw new Error('Package not found')
  }

  if (!isSupabaseConfigured) {
    return localUpdate()
  }

  try {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return localUpdate()
    return data as Package
  } catch {
    return localUpdate()
  }
}

export async function getEnrollments() {
  if (!isSupabaseConfigured) {
    return getLocalEnrollments()
  }

  try {
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

    if (error || !data || data.length === 0) {
      return getLocalEnrollments()
    }

    return (data as CourseEnrollment[]) || []
  } catch {
    return getLocalEnrollments()
  }
}

export async function getLeadEnrollments(leadId: string) {
  const localFallback = () => getLocalEnrollments().filter((e) => e.lead_id === leadId)

  if (!isSupabaseConfigured) {
    return localFallback()
  }

  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('lead_id', leadId)
      .order('enrollment_date', { ascending: false })

    if (error || !data) return localFallback()
    return (data as CourseEnrollment[]) || []
  } catch {
    return localFallback()
  }
}

export async function createEnrollment(params: {
  lead_id: string
  package_name: PackageName
  package_id?: string | null
  enrollment_date: string
  amount: number
  payment_status: PaymentStatus
  notes?: string
  receipt_images?: string[]
}) {
  const localCreate = async () => {
    const enrs = getLocalEnrollments()
    const storedLeads = localStorage.getItem('mock_leads')
    const leads = storedLeads ? JSON.parse(storedLeads) : []
    const lead = leads.find((l: any) => l.id === params.lead_id)

    const newEnr: CourseEnrollment = {
      id: `enr-${Date.now()}`,
      owner_id: 'owner-uuid-1',
      lead_id: params.lead_id,
      package_name: params.package_name,
      package_id: params.package_id || null,
      enrollment_date: params.enrollment_date,
      amount: params.amount,
      payment_status: params.payment_status,
      notes: params.notes || '',
      receipt_images: params.receipt_images || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lead,
    }
    saveLocalEnrollments([newEnr, ...enrs])

    await logActivity({
      lead_id: params.lead_id,
      activity_type: 'Course Enrolled',
      new_value: `${params.package_name} (₹${params.amount} - ${params.payment_status})`,
      notes: params.notes,
      images: params.receipt_images || [],
    })
    return newEnr
  }

  if (!isSupabaseConfigured) {
    return localCreate()
  }

  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return localCreate()

    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        ...params,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error || !data) return localCreate()

    const created = data as CourseEnrollment

    await supabase
      .from('leads')
      .update({ interest_status: 'Converted' })
      .eq('id', params.lead_id)

    await logActivity({
      lead_id: params.lead_id,
      activity_type: 'Course Enrolled',
      new_value: `${params.package_name} (₹${params.amount} - ${params.payment_status})`,
      notes: params.notes,
      images: params.receipt_images || [],
    })

    return created
  } catch {
    return localCreate()
  }
}

export async function updateEnrollment(id: string, updates: Partial<CourseEnrollment>, leadId: string) {
  const localUpdate = async () => {
    const enrs = getLocalEnrollments()
    const idx = enrs.findIndex((e) => e.id === id)
    if (idx !== -1) {
      enrs[idx] = { ...enrs[idx], ...updates }
      saveLocalEnrollments(enrs)
      if (updates.payment_status) {
        await logActivity({
          lead_id: leadId,
          activity_type: 'Payment Status Updated',
          new_value: `${enrs[idx].package_name}: ${updates.payment_status}`,
        })
      }
      return enrs[idx]
    }
    throw new Error('Enrollment not found')
  }

  if (!isSupabaseConfigured) {
    return localUpdate()
  }

  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return localUpdate()

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
  } catch {
    return localUpdate()
  }
}

export async function deleteEnrollment(id: string) {
  const localDelete = () => {
    const enrs = getLocalEnrollments().filter((e) => e.id !== id)
    saveLocalEnrollments(enrs)
    return true
  }

  if (!isSupabaseConfigured) {
    return localDelete()
  }

  try {
    const { error } = await supabase.from('course_enrollments').delete().eq('id', id)
    if (error) return localDelete()
    return true
  } catch {
    return localDelete()
  }
}
