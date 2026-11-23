import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { History, Clock, ArrowRight } from 'lucide-react'
import { formatDateTimeSafe } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface RecentActivityFeedProps {
  activities: any[]
  isLoading?: boolean
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities, isLoading }) => {
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="w-4 h-4 text-slate-700" />
          Recent Lead Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No recent activities found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => {
              const leadName = act.lead
                ? `${act.lead.first_name} ${act.lead.last_name || ''}`.trim()
                : 'Candidate'

              return (
                <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900">{leadName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-blue-600 font-medium">{act.activity_type}</span>
                    </div>
                    {act.new_value && (
                      <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                        Result: <span className="font-semibold">{act.new_value}</span>
                      </p>
                    )}
                    {act.notes && (
                      <p className="text-[11px] text-slate-500 italic truncate mt-0.5">
                        "{act.notes}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDateTimeSafe(act.created_at)}
                    </span>
                    {act.lead_id && (
                      <Link
                        to={`/leads/${act.lead_id}`}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 justify-end mt-1"
                      >
                        Profile <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
