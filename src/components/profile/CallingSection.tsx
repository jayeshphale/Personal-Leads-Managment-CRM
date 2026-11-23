import React, { useState } from 'react'
import type { Lead, CallStatus } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, PhoneCall, Calendar, Plus, Clock } from 'lucide-react'
import { getStatusBadge } from '@/components/ui/badge'
import { createTelLink, formatDateSafe } from '@/lib/utils'
import { updateLead } from '@/services/leads.service'
import { logActivity } from '@/services/activities.service'
import { createReminder } from '@/services/reminders.service'
import { useToast } from '@/components/ui/toast'

interface CallingSectionProps {
  lead: Lead
  onLeadUpdated: () => void
}

const callStatuses: CallStatus[] = [
  'Not Called',
  'Connected',
  'No Answer',
  'Busy',
  'Invalid Number',
]

export const CallingSection: React.FC<CallingSectionProps> = ({ lead, onLeadUpdated }) => {
  const { success, error } = useToast()
  const [selectedStatus, setSelectedStatus] = useState<CallStatus>(lead.call_status)
  const [callNotes, setCallNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState('11:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeNumber = lead.active_calling_no || lead.phone

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)

      // 1. Update lead call status and next follow-up
      await updateLead(
        lead.id,
        {
          call_status: selectedStatus,
          next_follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : lead.next_follow_up_date,
        },
        lead
      )

      // 2. Log activity
      await logActivity({
        lead_id: lead.id,
        activity_type: selectedStatus === 'Connected' ? 'Call Connected' : 'Call Attempted',
        old_value: lead.call_status,
        new_value: selectedStatus,
        notes: callNotes || undefined,
      })

      // 3. If follow-up date scheduled, create reminder
      if (followUpDate) {
        await createReminder({
          lead_id: lead.id,
          title: `Follow-up Call with ${lead.first_name} ${lead.last_name || ''}`.trim(),
          description: callNotes || `Previous outcome: ${selectedStatus}`,
          due_date: followUpDate,
          due_time: `${followUpTime}:00`,
          priority: 'High',
        })
      }

      success('Call Logged', `Call outcome updated to ${selectedStatus}.`)
      setCallNotes('')
      setFollowUpDate('')
      onLeadUpdated()
    } catch (err: any) {
      error('Failed to log call', err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-600" />
          Calling Tracking & Telephony
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Current Status:</span>
          {getStatusBadge('call', lead.call_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Dial Action */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-950">Active Calling Number</p>
              <p className="font-mono text-sm font-bold text-emerald-900">{activeNumber}</p>
            </div>
          </div>
          <a
            href={createTelLink(activeNumber)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Launch Phone Call
          </a>
        </div>

        {/* Log Call Form */}
        <form onSubmit={handleLogCall} className="space-y-3 pt-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Record Call Outcome:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {callStatuses.map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Call Notes & Discussion Summary
            </label>
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={2}
              placeholder="Candidate background, course interest, objections, next steps..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          {/* Schedule Next Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Schedule Next Follow-up Call (Optional)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs h-8 px-2 bg-white border border-slate-300 rounded-md focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Time
              </label>
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full text-xs h-8 px-2 bg-white border border-slate-300 rounded-md focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Call Record & Activity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
