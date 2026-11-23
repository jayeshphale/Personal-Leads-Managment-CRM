import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { DashboardMetrics, DateFilter } from '@/types/crm.types'
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO, format } from 'date-fns'
import { initialMockWorkshops } from '@/lib/mockData'

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

function calculateLocalMetrics(): DashboardMetrics {
  const storedLeads = localStorage.getItem('mock_leads')
  const leads = storedLeads ? JSON.parse(storedLeads) : []
  const storedEnrs = localStorage.getItem('mock_enrollments')
  const enrollments = storedEnrs ? JSON.parse(storedEnrs) : []
  const storedRegs = localStorage.getItem('mock_workshop_registrations')
  const workshopRegs = storedRegs ? JSON.parse(storedRegs) : []

  const totalLeads = leads.length
  const newLeads = leads.filter((l: any) => l.interest_status === 'New').length
  const interestedLeads = leads.filter((l: any) => ['Interested', 'High Intent'].includes(l.interest_status)).length
  const callsConnected = leads.filter((l: any) => l.call_status === 'Connected').length
  const whatsappReplied = leads.filter((l: any) => l.whatsapp_status === 'Replied').length
  const closingCallsCompleted = leads.filter((l: any) => l.closing_status === 'Completed').length
  const totalEnrollments = enrollments.length
  const totalRevenue = enrollments
    .filter((e: any) => ['Paid', 'Partial'].includes(e.payment_status))
    .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  // Real workshop metrics computed from candidate registrations
  const workshopEnrolled = workshopRegs.length
  const workshopAttended = workshopRegs.filter((r: any) => r.attendance_status === 'Attended').length

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

export async function getDashboardMetrics(dateFilter: DateFilter): Promise<DashboardMetrics> {
  if (!isSupabaseConfigured) {
    return calculateLocalMetrics()
  }

  try {
    const { start, end } = getDateRange(dateFilter)

    const [leadsRes, workshopRes, enrollmentsRes] = await Promise.all([
      supabase
        .from('leads')
        .select('id, interest_status, call_status, whatsapp_status, closing_status, created_at')
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('workshop_registrations')
        .select('id, attendance_status, registered_at')
        .gte('registered_at', start)
        .lte('registered_at', end),
      supabase
        .from('course_enrollments')
        .select('id, amount, payment_status, enrollment_date')
        .gte('enrollment_date', start)
        .lte('enrollment_date', end),
    ])

    if (leadsRes.error || !leadsRes.data || leadsRes.data.length === 0) {
      return calculateLocalMetrics()
    }

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
  } catch {
    return calculateLocalMetrics()
  }
}

export async function getFunnelData(dateFilter: DateFilter) {
  const m = await getDashboardMetrics(dateFilter)
  const total = m.totalLeads || 1

  return [
    { name: 'Total Leads', count: m.totalLeads, percentage: 100 },
    { name: 'Connected Calls', count: m.callsConnected, percentage: Math.round((m.callsConnected / total) * 100) },
    { name: 'WhatsApp Replied', count: m.whatsappReplied, percentage: Math.round((m.whatsappReplied / total) * 100) },
    { name: 'Workshop Attended', count: m.workshopAttended, percentage: Math.round((m.workshopAttended / total) * 100) },
    { name: 'Enrolled in Course', count: m.totalEnrollments, percentage: Math.round((m.totalEnrollments / total) * 100) },
  ]
}

export async function getDailyCallingActivity(days: number = 7) {
  const storedActs = localStorage.getItem('mock_activities')
  const activities = storedActs ? JSON.parse(storedActs) : []
  const storedLeads = localStorage.getItem('mock_leads')
  const leads = storedLeads ? JSON.parse(storedLeads) : []

  const result: { date: string; displayDate: string; connected: number; attempted: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const dateKey = format(d, 'yyyy-MM-dd')
    const displayDate = format(d, 'dd MMM')

    // Count real logged calls for this day from activity logs
    const dayActs = activities.filter((a: any) => a.created_at?.startsWith(dateKey))
    let connected = dayActs.filter((a: any) => a.activity_type === 'Call Connected').length
    let attempted = dayActs.filter((a: any) => a.activity_type === 'Call Attempted').length

    // For current day, ensure active call status counts from leads are included
    if (i === 0) {
      const connLeads = leads.filter((l: any) => l.call_status === 'Connected').length
      const attLeads = leads.filter((l: any) => ['No Answer', 'Busy'].includes(l.call_status)).length
      connected = Math.max(connected, connLeads)
      attempted = Math.max(attempted, attLeads)
    }

    result.push({
      date: dateKey,
      displayDate,
      connected,
      attempted,
    })
  }
  return result
}

function calculateLocalPackageStats() {
  const storedEnrs = localStorage.getItem('mock_enrollments')
  const enrs = storedEnrs ? JSON.parse(storedEnrs) : []
  const pkgs: ('Standard' | 'Prime' | 'Infinity' | 'Legacy')[] = ['Standard', 'Prime', 'Infinity', 'Legacy']

  return pkgs.map((pkg) => {
    const matching = enrs.filter((e: any) => e.package_name === pkg)
    return {
      package: pkg,
      count: matching.length,
      revenue: matching.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0),
      paidCount: matching.filter((e: any) => e.payment_status === 'Paid').length,
      pendingCount: matching.filter((e: any) => e.payment_status === 'Pending').length,
    }
  })
}

export async function getPackageEnrollmentStats() {
  if (!isSupabaseConfigured) {
    return calculateLocalPackageStats()
  }

  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('package_name, amount, payment_status')

    if (error || !data || data.length === 0) {
      return calculateLocalPackageStats()
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
  } catch {
    return calculateLocalPackageStats()
  }
}

export async function getWorkshopConversionStats() {
  const calculateLocalWorkshopStats = () => {
    const storedWorkshops = localStorage.getItem('mock_workshops')
    const workshops = storedWorkshops ? JSON.parse(storedWorkshops) : initialMockWorkshops
    const storedRegs = localStorage.getItem('mock_workshop_registrations')
    const allRegs = storedRegs ? JSON.parse(storedRegs) : []

    if (!workshops || workshops.length === 0) return []

    return workshops.map((w: any) => {
      const regs = allRegs.filter((r: any) => r.workshop_id === w.id)
      const registered = regs.length
      const attended = regs.filter((r: any) => r.attendance_status === 'Attended').length
      const rate = registered > 0 ? Math.round((attended / registered) * 100) : 0
      const displayTitle = w.title.length > 28 ? `${w.title.slice(0, 25)}...` : w.title

      return {
        id: w.id,
        title: displayTitle,
        fullTitle: w.title,
        date: w.workshop_date ? format(parseISO(w.workshop_date), 'dd MMM') : 'Scheduled',
        registered,
        attended,
        rate,
      }
    })
  }

  if (!isSupabaseConfigured) {
    return calculateLocalWorkshopStats()
  }

  try {
    const { data: workshops, error: wError } = await supabase
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

    if (wError || !workshops || workshops.length === 0) {
      return calculateLocalWorkshopStats()
    }

    return workshops.map((w: any) => {
      const regs = w.workshop_registrations || []
      const registered = regs.length
      const attended = regs.filter((r: any) => r.attendance_status === 'Attended').length
      const rate = registered > 0 ? Math.round((attended / registered) * 100) : 0
      const displayTitle = w.title.length > 28 ? `${w.title.slice(0, 25)}...` : w.title

      return {
        id: w.id,
        title: displayTitle,
        fullTitle: w.title,
        date: w.workshop_date ? format(parseISO(w.workshop_date), 'dd MMM') : 'Scheduled',
        registered,
        attended,
        rate,
      }
    })
  } catch {
    return calculateLocalWorkshopStats()
  }
}
