import React from 'react'
import type { LeadActivity } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  History,
  PhoneCall,
  MessageSquare,
  Calendar,
  GraduationCap,
  BellRing,
  Edit,
  UserPlus,
  Clock
} from 'lucide-react'
import { formatDateTimeSafe } from '@/lib/utils'

interface ActivityTimelineSectionProps {
  activities: LeadActivity[]
  isLoading?: boolean
}

export const ActivityTimelineSection: React.FC<ActivityTimelineSectionProps> = ({
  activities,
  isLoading,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Lead Created':
        return <UserPlus className="w-3.5 h-3.5 text-blue-600" />
      case 'Call Connected':
      case 'Call Attempted':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
      case 'WhatsApp Message Sent':
      case 'WhatsApp Reply Received':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
      case 'Workshop Registered':
      case 'Workshop Attended':
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />
      case 'Course Enrolled':
      case 'Payment Status Updated':
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
      case 'Reminder Scheduled':
      case 'Reminder Completed':
        return <BellRing className="w-3.5 h-3.5 text-amber-600" />
      default:
        return <Edit className="w-3.5 h-3.5 text-slate-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="w-4 h-4 text-slate-700" />
          Chronological Activity Timeline ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading timeline...</div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            No logged activities recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-600 flex items-center justify-center transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-600" />
                </div>

                <div className="bg-slate-50 hover:bg-slate-100/70 p-3 rounded-lg border border-slate-200/80 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(act.activity_type)}
                      <span className="text-xs font-bold text-slate-800">
                        {act.activity_type}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatDateTimeSafe(act.created_at)}
                    </span>
                  </div>

                  {(act.old_value || act.new_value) && (
                    <div className="mt-1.5 text-xs text-slate-600">
                      {act.old_value && (
                        <span className="line-through text-slate-400 mr-1.5">
                          {act.old_value}
                        </span>
                      )}
                      {act.new_value && (
                        <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {act.new_value}
                        </span>
                      )}
                    </div>
                  )}

                  {act.notes && (
                    <p className="mt-1 text-xs text-slate-500 italic bg-white/70 p-1.5 rounded border border-slate-100">
                      "{act.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
