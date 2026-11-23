import React, { useState, useEffect } from 'react'
import {
  getDashboardMetrics,
  getFunnelData,
  getPackageEnrollmentStats,
  getDailyCallingActivity,
} from '@/services/analytics.service'
import { getAllLeadsForExport } from '@/services/leads.service'
import type { DashboardMetrics, DateFilter } from '@/types/crm.types'
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, Users, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { DateFilterBar } from '@/components/dashboard/DateFilterBar'
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel'
import { CallingActivityChart } from '@/components/dashboard/CallingActivityChart'
import { PackageEnrollmentChart } from '@/components/dashboard/PackageEnrollmentChart'
import { useToast } from '@/components/ui/toast'
import Papa from 'papaparse'

export const Reports: React.FC = () => {
  const { success, error } = useToast()
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: '30days' })
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [funnel, setFunnel] = useState<any[]>([])
  const [packageStats, setPackageStats] = useState<any[]>([])
  const [callingData, setCallingData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadReportData = async () => {
    try {
      setIsLoading(true)
      const [m, fn, pkgs, cData] = await Promise.all([
        getDashboardMetrics(dateFilter),
        getFunnelData(dateFilter),
        getPackageEnrollmentStats(),
        getDailyCallingActivity(14),
      ])
      setMetrics(m)
      setFunnel(fn)
      setPackageStats(pkgs)
      setCallingData(cData)
    } catch (err: any) {
      error('Failed to load reports', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [dateFilter])

  const handleExportFullCsv = async () => {
    try {
      const leads = await getAllLeadsForExport()
      const exportRows = leads.map((l) => ({
        'First Name': l.first_name,
        'Last Name': l.last_name,
        'Primary Phone': l.phone,
        'Active Calling No': l.active_calling_no || '',
        'Alternate Phone': l.alternate_phone || '',
        City: l.city,
        Qualification: l.qualification,
        Occupation: l.occupation || '',
        'Lead Source': l.lead_source,
        'Call Status': l.call_status,
        'WhatsApp Status': l.whatsapp_status,
        'Interest Status': l.interest_status,
        'Closing Status': l.closing_status,
        'Created At': l.created_at,
      }))

      const csv = Papa.unparse(exportRows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `leads_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      success('Export Ready', 'Exported full leads CSV report.')
    } catch (err: any) {
      error('Export failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Reports & Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real Supabase analytics calculated from actual database records and transactions.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportFullCsv}>
          <Download className="w-4 h-4 mr-1.5" />
          Export All Records CSV
        </Button>
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

      {/* Key Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads Acquired</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics?.totalLeads ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{metrics?.newLeads ?? 0} new in period</p>
        </Card>
        <Card className="p-4 bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calls Connected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{metrics?.callsConnected ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metrics?.totalLeads ? Math.round(((metrics.callsConnected || 0) / metrics.totalLeads) * 100) : 0}% connection rate
          </p>
        </Card>
        <Card className="p-4 bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Enrollments</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{metrics?.totalEnrollments ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metrics?.totalLeads ? Math.round(((metrics.totalEnrollments || 0) / metrics.totalLeads) * 100) : 0}% total conversion
          </p>
        </Card>
        <Card className="p-4 bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Collected</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            {formatCurrency(metrics?.totalRevenue ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Paid & Partial collections</p>
        </Card>
      </div>

      {/* Conversion Funnel & Calling Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel steps={funnel} isLoading={isLoading} />
        <CallingActivityChart data={callingData} isLoading={isLoading} />
      </div>

      {/* Package-wise Breakdown */}
      <PackageEnrollmentChart stats={packageStats} isLoading={isLoading} />
    </div>
  )
}
