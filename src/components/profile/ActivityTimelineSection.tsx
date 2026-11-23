import React, { useState } from 'react'
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
  Clock,
  Image as ImageIcon,
  ZoomIn,
  Download,
  X
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
  const [activePreview, setActivePreview] = useState<string | null>(null)

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
                    <p className="mt-1 text-xs text-slate-500 italic bg-white/70 p-1.5 rounded border border-slate-100 whitespace-pre-wrap">
                      "{act.notes}"
                    </p>
                  )}

                  {/* Attached Activity Screenshots */}
                  {act.images && act.images.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {act.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePreview(img)}
                          className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-500 shadow-2xs group bg-white"
                          title="Click to view attached screenshot"
                        >
                          <img src={img} alt="Activity attachment" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Lightbox Preview Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white border-b border-slate-700 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Activity Screenshot
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview}
                  download="activity_screenshot.jpg"
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh] bg-slate-950">
              <img
                src={activePreview}
                alt="Enlarged screenshot"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
