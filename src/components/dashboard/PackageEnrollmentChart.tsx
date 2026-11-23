import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PackageStat {
  package: 'Standard' | 'Prime' | 'Infinity' | 'Legacy'
  count: number
  revenue: number
  paidCount: number
  pendingCount: number
}

interface PackageEnrollmentChartProps {
  stats: PackageStat[]
  isLoading?: boolean
}

export const PackageEnrollmentChart: React.FC<PackageEnrollmentChartProps> = ({ stats, isLoading }) => {
  const badgeStyles = {
    Standard: 'border-blue-200 bg-blue-50 text-blue-700',
    Prime: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Infinity: 'border-purple-200 bg-purple-50 text-purple-700',
    Legacy: 'border-amber-200 bg-amber-50 text-amber-700',
  }

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          Package-wise Enrollment Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading package stats...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div
                key={s.package}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border mb-2 ${
                      badgeStyles[s.package]
                    }`}
                  >
                    {s.package}
                  </span>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{s.count}</p>
                  <p className="text-[11px] text-slate-500">Total Enrolled</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] space-y-0.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Revenue:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(s.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Paid: {s.paidCount}</span>
                    <span>Pending: {s.pendingCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
