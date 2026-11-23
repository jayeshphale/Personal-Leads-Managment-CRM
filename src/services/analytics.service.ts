import { supabase } from '@/lib/supabase'
import type { DashboardMetrics, DateFilter } from '@/types/crm.types'
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO, format } from 'date-fns'

function getDateRange(filter: DateFilter): { start: string; end: string } {
  const now = new Date()
  let startDate: Date
  let endDate: Date = endOfDay(now)

  switch (filter.type) {
    case 'today':
      startDate = startOfDay(now)
      break
    case '7days':
      startDate = startOfDay(subDays(now, 6))
      break
    case '30days':
      startDate = startOfDay(subDays(now, 29))
      break
    case 'this_month':
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
      break
    case 'custom':
      startDate = filter.startDate ? startOfDay(parseISO(filter.startDate)) : startOfDay(subDays(now, 29))
      endDate = filter.endDate ? endOfDay(parseISO(filter.endDate)) : endOfDay(now)
      break
    default:
      startDate = startOfDay(subDays(now, 29))
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  }
}

export async function getDashboardMetrics(dateFilter: DateFilter): Promise<DashboardMetrics> {
  const { start, end } = getDateRange(dateFilter)

  // 1. Leads counts in date range
  const leadsQuery = supabase
    .from('leads')
    .select('id, interest_status, call_status, whatsapp_status, closing_status, created_at')
    .gte('created_at', start)
    .lte('created_at', end)

  // 2. Workshop registrations in date range
  const workshopRegQuery = supabase
    .from('workshop_registrations')
    .select('id, attendance_status, registered_at')
    .gte('registered_at', start)
    .lte('registered_at', end)

  // 3. Course enrollments in date range
  const enrollmentsQuery = supabase
    .from('course_enrollments')
    .select('id, amount, payment_status, enrollment_date')
    .gte('enrollment_date', start)
    .lte('enrollment_date', end)

  const [leadsRes, workshopRes, enrollmentsRes] = await Promise.all([
    leadsQuery,
    workshopRegQuery,
    enrollmentsQuery,
  ])

  const leads = leadsRes.data || []
  const workshopRegs = workshopRes.data || []
  const enrollments = enrollmentsRes.data || []

  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.interest_status === 'New').length
  const interestedLeads = leads.filter((l) => ['Interested', 'High Intent'].includes(l.interest_status)).length
  const callsConnected = leads.filter((l) => l.call_status === 'Connected').length
  const whatsappReplied = leads.filter((l) => l.whatsapp_status === 'Replied').length
  const closingCallsCompleted = leads.filter((l) => l.closing_status === 'Completed').length

  const workshopEnrolled = workshopRegs.length
  const workshopAttended = workshopRegs.filter((r) => r.attendance_status === 'Attended').length

  const totalEnrollments = enrollments.length
  const totalRevenue = enrollments
    .filter((e) => ['Paid', 'Partial'].includes(e.payment_status))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)

  return {
    totalLeads,
    newLeads,
    interestedLeads,
    callsConnected,
    whatsappReplied,
    workshopEnrolled,
    workshopAttended,
    closingCallsCompleted,
    totalEnrollments,
    totalRevenue,
  }
}

export async function getFunnelData(dateFilter: DateFilter) {
  const { start, end } = getDateRange(dateFilter)

  const [leadsRes, workshopRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, call_status, whatsapp_status, created_at')
      .gte('created_at', start)
      .lte('created_at', end),
    supabase
      .from('workshop_registrations')
      .select('id, attendance_status')
      .gte('registered_at', start)
      .lte('registered_at', end),
    supabase
      .from('course_enrollments')
      .select('id')
      .gte('enrollment_date', start)
      .lte('enrollment_date', end),
  ])

  const leads = leadsRes.data || []
  const total = leads.length
  const connected = leads.filter((l) => l.call_status === 'Connected').length
  const replied = leads.filter((l) => l.whatsapp_status === 'Replied').length
  const attended = (workshopRes.data || []).filter((w) => w.attendance_status === 'Attended').length
  const enrolled = (enrollmentsRes.data || []).length

  return [
    { name: 'Total Leads', count: total, percentage: 100 },
    { name: 'Connected Calls', count: connected, percentage: total ? Math.round((connected / total) * 100) : 0 },
    { name: 'WhatsApp Replied', count: replied, percentage: total ? Math.round((replied / total) * 100) : 0 },
    { name: 'Workshop Attended', count: attended, percentage: total ? Math.round((attended / total) * 100) : 0 },
    { name: 'Enrolled in Course', count: enrolled, percentage: total ? Math.round((enrolled / total) * 100) : 0 },
  ]
}

export async function getDailyCallingActivity(days: number = 7) {
  const startDate = startOfDay(subDays(new Date(), days - 1)).toISOString()

  // Pull activities of type call
  const { data, error } = await supabase
    .from('lead_activities')
    .select('activity_type, new_value, created_at')
    .gte('created_at', startDate)
    .in('activity_type', ['Call Attempted', 'Call Connected'])

  if (error) {
    console.error('Error fetching calling activity:', error)
    return []
  }

  // Generate bucket for each day
  const result: { date: string; displayDate: string; connected: number; attempted: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const dateKey = format(d, 'yyyy-MM-dd')
    const displayDate = format(d, 'dd MMM')

    const dayActivities = (data || []).filter((a) => a.created_at.startsWith(dateKey))
    const connected = dayActivities.filter((a) => a.activity_type === 'Call Connected' || a.new_value === 'Connected').length
    const attempted = dayActivities.length

    result.push({
      date: dateKey,
      displayDate,
      connected,
      attempted,
    })
  }

  return result
}

export async function getPackageEnrollmentStats() {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('package_name, amount, payment_status')

  if (error) {
    console.error('Error fetching enrollment stats:', error)
    return []
  }

  const packages: ('Standard' | 'Prime' | 'Infinity' | 'Legacy')[] = [
    'Standard',
    'Prime',
    'Infinity',
    'Legacy',
  ]

  return packages.map((pkg) => {
    const matching = (data || []).filter((e) => e.package_name === pkg)
    const count = matching.length
    const revenue = matching
      .filter((e) => ['Paid', 'Partial'].includes(e.payment_status))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)

    return {
      package: pkg,
      count,
      revenue,
      paidCount: matching.filter((e) => e.payment_status === 'Paid').length,
      pendingCount: matching.filter((e) => e.payment_status === 'Pending').length,
    }
  })
}

export async function getWorkshopConversionStats() {
  const { data: workshops, error } = await supabase
    .from('workshops')
    .select(`
      id,
      title,
      workshop_date,
      workshop_registrations (
        id,
        attendance_status
      )
    `)
    .order('workshop_date', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching workshop conversion stats:', error)
    return []
  }

  return (workshops || []).map((w: any) => {
    const regs = w.workshop_registrations || []
    const total = regs.length
    const attended = regs.filter((r: any) => r.attendance_status === 'Attended').length
    const conversionRate = total > 0 ? Math.round((attended / total) * 100) : 0

    return {
      id: w.id,
      title: w.title,
      date: format(parseISO(w.workshop_date), 'dd MMM'),
      registered: total,
      attended,
      rate: conversionRate,
    }
  })
}
