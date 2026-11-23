import React, { useState, useEffect } from 'react'
import {
  getDashboardMetrics,
  getFunnelData,
  getDailyCallingActivity,
  getPackageEnrollmentStats,
  getWorkshopConversionStats,
} from '@/services/analytics.service'
import { getRecentActivities } from '@/services/activities.service'
import { getReminders, completeReminder } from '@/services/reminders.service'
import type { DashboardMetrics, DateFilter, Reminder } from '@/types/crm.types'
import {
  Users,
  UserPlus,
  Flame,
  PhoneCall,
  MessageSquare,
  Calendar,
  GraduationCap,
  CheckCircle2,
  IndianRupee,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { DateFilterBar } from '@/components/dashboard/DateFilterBar'
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel'
import { CallingActivityChart } from '@/components/dashboard/CallingActivityChart'
import { WorkshopConversionChart } from '@/components/dashboard/WorkshopConversionChart'
import { PackageEnrollmentChart } from '@/components/dashboard/PackageEnrollmentChart'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { FollowUpWidget } from '@/components/dashboard/FollowUpWidget'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { LeadModal } from '@/components/leads/LeadModal'

export const Dashboard: React.FC = () => {
  const { success, error } = useToast()
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: '30days' })
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [funnel, setFunnel] = useState<any[]>([])
  const [callingData, setCallingData] = useState<any[]>([])
  const [packageStats, setPackageStats] = useState<any[]>([])
  const [workshopStats, setWorkshopStats] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([])
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false)

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [
        m,
        fn,
        calls,
        pkgs,
        wStats,
        activities,
        todayRems,
        overdueRems,
      ] = await Promise.all([
        getDashboardMetrics(dateFilter),
        getFunnelData(dateFilter),
        getDailyCallingActivity(7),
        getPackageEnrollmentStats(),
        getWorkshopConversionStats(),
        getRecentActivities(8),
        getReminders('today'),
        getReminders('overdue'),
      ])

      setMetrics(m)
      setFunnel(fn)
      setCallingData(calls)
      setPackageStats(pkgs)
      setWorkshopStats(wStats)
      setRecentActivities(activities)
      setTodayReminders(todayRems)
      setOverdueReminders(overdueRems)
    } catch (err: any) {
      console.warn('Dashboard fetch issue:', err)
      error('Dashboard refresh failed', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [dateFilter])

  const handleCompleteReminder = async (id: string) => {
    try {
      await completeReminder(id)
      success('Reminder Completed', 'Follow-up marked as completed.')
      loadDashboardData()
    } catch (err: any) {
      error('Failed to complete reminder', err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time candidate pipeline, conversion funnel, calling metrics, and enrollment collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            isLoading={isLoading}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddLeadModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

      {/* 9 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiCard
          title="Total Leads"
          value={metrics?.totalLeads ?? 0}
          subtext="Total acquired in period"
          icon={<Users className="w-4 h-4" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="New Leads"
          value={metrics?.newLeads ?? 0}
          subtext="Pending initial call"
          icon={<UserPlus className="w-4 h-4" />}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
        <KpiCard
          title="Interested Leads"
          value={metrics?.interestedLeads ?? 0}
          subtext="High intent candidates"
          icon={<Flame className="w-4 h-4" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <KpiCard
          title="Calls Connected"
          value={metrics?.callsConnected ?? 0}
          subtext="Connected discussions"
          icon={<PhoneCall className="w-4 h-4" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          title="WhatsApp Replied"
          value={metrics?.whatsappReplied ?? 0}
          subtext="Active chat engagement"
          icon={<MessageSquare className="w-4 h-4" />}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-600"
        />
        <KpiCard
          title="Workshop Enrolled"
          value={metrics?.workshopEnrolled ?? 0}
          subtext="Registered for masterclass"
          icon={<Calendar className="w-4 h-4" />}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <KpiCard
          title="Workshop Attended"
          value={metrics?.workshopAttended ?? 0}
          subtext="Verified live attendees"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBgColor="bg-violet-50"
          iconColor="text-violet-600"
        />
        <KpiCard
          title="Closing Calls"
          value={metrics?.closingCallsCompleted ?? 0}
          subtext="Admissions discussions"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KpiCard
          title="Course Enrollments"
          value={metrics?.totalEnrollments ?? 0}
          subtext="Candidates enrolled"
          icon={<GraduationCap className="w-4 h-4" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue ?? 0)}
          subtext="Collected in period"
          icon={<IndianRupee className="w-4 h-4" />}
          iconBgColor="bg-emerald-100/70"
          iconColor="text-emerald-800"
        />
      </div>

      {/* Funnel & Calling Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel steps={funnel} isLoading={isLoading} />
        <CallingActivityChart data={callingData} isLoading={isLoading} />
      </div>

      {/* Workshop Conversion & Package Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkshopConversionChart data={workshopStats} isLoading={isLoading} />
        <PackageEnrollmentChart stats={packageStats} isLoading={isLoading} />
      </div>

      {/* Follow-ups & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowUpWidget
          todayReminders={todayReminders}
          overdueReminders={overdueReminders}
          onComplete={handleCompleteReminder}
          isLoading={isLoading}
        />
        <RecentActivityFeed activities={recentActivities} isLoading={isLoading} />
      </div>

      {/* Add Lead Modal */}
      {isAddLeadModalOpen && (
        <LeadModal
          isOpen={isAddLeadModalOpen}
          onClose={() => setIsAddLeadModalOpen(false)}
          onSuccess={() => {
            setIsAddLeadModalOpen(false)
            success('Lead Created', 'New candidate added.')
            loadDashboardData()
          }}
        />
      )}
    </div>
  )
}
