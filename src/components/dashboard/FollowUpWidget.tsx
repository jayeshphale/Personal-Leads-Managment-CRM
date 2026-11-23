import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BellRing, Check, Clock, AlertCircle, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Reminder } from '@/types/crm.types'
import { formatDateSafe } from '@/lib/utils'
import { getStatusBadge } from '@/components/ui/badge'

interface FollowUpWidgetProps {
  todayReminders: Reminder[]
  overdueReminders: Reminder[]
  onComplete: (id: string) => void
  isLoading?: boolean
}

export const FollowUpWidget: React.FC<FollowUpWidgetProps> = ({
  todayReminders,
  overdueReminders,
  onComplete,
  isLoading,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BellRing className="w-4 h-4 text-amber-500" />
          Follow-up Reminders & Schedule
        </CardTitle>
        <Link to="/reminders" className="text-xs text-blue-600 hover:underline font-medium">
          View All Reminders
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Section */}
        {overdueReminders.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              Overdue ({overdueReminders.length})
            </div>
            <div className="divide-y divide-rose-100 bg-rose-50/40 rounded-lg border border-rose-200/80 p-2">
              {overdueReminders.slice(0, 4).map((r) => (
                <div key={r.id} className="py-2 px-1.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-rose-950 truncate">{r.title}</p>
                    <p className="text-[11px] text-rose-700">
                      Due: {formatDateSafe(r.due_date)} at {r.due_time?.slice(0, 5)}
                      {r.lead && ` • ${r.lead.first_name} (${r.lead.phone})`}
                    </p>
                  </div>
                  <button
                    onClick={() => onComplete(r.id)}
                    className="p-1 rounded bg-rose-200/60 hover:bg-rose-300 text-rose-800 transition-colors shrink-0"
                    title="Mark Completed"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Today's Follow-ups ({todayReminders.length})
          </div>

          {isLoading ? (
            <div className="py-4 text-center text-xs text-slate-400">Loading today's schedule...</div>
          ) : todayReminders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              No follow-ups scheduled for today. Great job!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-lg border border-slate-200/80 p-2">
              {todayReminders.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2 px-1.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{r.title}</span>
                      {getStatusBadge('priority', r.priority)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      At {r.due_time?.slice(0, 5)}
                      {r.lead && ` • ${r.lead.first_name} ${r.lead.last_name || ''}`}
                    </p>
                  </div>
                  <button
                    onClick={() => onComplete(r.id)}
                    className="p-1 rounded bg-slate-200/80 hover:bg-emerald-600 hover:text-white text-slate-700 transition-colors shrink-0"
                    title="Mark Completed"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
