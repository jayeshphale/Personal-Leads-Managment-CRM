import React, { useState } from 'react'
import type { Lead, ClosingStatus } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Calendar, HelpCircle } from 'lucide-react'
import { updateLead } from '@/services/leads.service'
import { logActivity } from '@/services/activities.service'
import { useToast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'

interface ClosingCallSectionProps {
  lead: Lead
  onLeadUpdated: () => void
}

const closingStatuses: ClosingStatus[] = [
  'Not Scheduled',
  'Scheduled',
  'Completed',
  'Follow-up Required',
]

export const ClosingCallSection: React.FC<ClosingCallSectionProps> = ({ lead, onLeadUpdated }) => {
  const { success, error } = useToast()
  const [closingStatus, setClosingStatus] = useState<ClosingStatus>(lead.closing_status)
  const [closingNotes, setClosingNotes] = useState(lead.closing_notes || '')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsUpdating(true)
      await updateLead(
        lead.id,
        {
          closing_status: closingStatus,
          closing_notes: closingNotes,
        },
        lead
      )

      await logActivity({
        lead_id: lead.id,
        activity_type:
          closingStatus === 'Completed' ? 'Closing Call Completed' : 'Closing Call Status Updated',
        old_value: lead.closing_status,
        new_value: closingStatus,
        notes: closingNotes,
      })

      success('Closing Call Updated', `Status saved as ${closingStatus}.`)
      onLeadUpdated()
    } catch (err: any) {
      error('Failed to update closing call', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const getClosingBadge = (status: ClosingStatus) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="green">Completed</Badge>
      case 'Scheduled':
        return <Badge variant="blue">Scheduled</Badge>
      case 'Follow-up Required':
        return <Badge variant="yellow">Follow-up Required</Badge>
      default:
        return <Badge variant="slate">Not Scheduled</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          Closing Call & Admissions Decision
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          {getClosingBadge(lead.closing_status)}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Closing Call Milestone:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {closingStatuses.map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setClosingStatus(status)}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                    closingStatus === status
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Closing Discussion Notes & Objections Handled
            </label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              rows={2}
              placeholder="Package presented, discount offered, payment readiness, decision timeline..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" isLoading={isUpdating}>
              Save Closing Milestone
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
