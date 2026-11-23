import React, { useState, useEffect } from 'react'
import { getLeads, updateLead } from '@/services/leads.service'
import { logActivity } from '@/services/activities.service'
import { createReminder } from '@/services/reminders.service'
import type { Lead, CallStatus } from '@/types/crm.types'
import { Phone, PhoneCall, MessageSquare, Calendar, Search, Filter, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getStatusBadge } from '@/components/ui/badge'
import { createTelLink, createWhatsAppLink, formatPhoneNumber, formatDateSafe } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'

const callStatuses: CallStatus[] = [
  'Not Called',
  'Connected',
  'No Answer',
  'Busy',
  'Invalid Number',
]

export const CallingTracker: React.FC = () => {
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState<CallStatus | 'all'>('Not Called')
  const [filterMode, setFilterMode] = useState<'all' | 'today_followups'>('all')
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Follow-up modal state
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null)
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0])
  const [followUpTime, setFollowUpTime] = useState('11:00')
  const [followUpNote, setFollowUpNote] = useState('')

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const res = await getLeads({
        callStatus: activeTab === 'all' ? undefined : activeTab,
        search,
        pageSize: 100,
      })
      let list = res.leads

      if (filterMode === 'today_followups') {
        const todayStr = new Date().toISOString().split('T')[0]
        list = list.filter((l) => l.next_follow_up_date?.startsWith(todayStr))
      }

      setLeads(list)
    } catch (err: any) {
      error('Failed to load leads', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [activeTab, filterMode, search])

  const handleUpdateStatus = async (lead: Lead, newStatus: CallStatus) => {
    try {
      await updateLead(lead.id, { call_status: newStatus }, lead)
      await logActivity({
        lead_id: lead.id,
        activity_type: newStatus === 'Connected' ? 'Call Connected' : 'Call Attempted',
        old_value: lead.call_status,
        new_value: newStatus,
      })
      success('Status Updated', `${lead.first_name}'s status changed to ${newStatus}.`)
      fetchLeads()
    } catch (err: any) {
      error('Update failed', err.message)
    }
  }

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLeadForFollowUp) return
    try {
      await createReminder({
        lead_id: selectedLeadForFollowUp.id,
        title: `Call back ${selectedLeadForFollowUp.first_name} ${selectedLeadForFollowUp.last_name || ''}`.trim(),
        description: followUpNote,
        due_date: followUpDate,
        due_time: `${followUpTime}:00`,
        priority: 'High',
      })

      await updateLead(selectedLeadForFollowUp.id, {
        next_follow_up_date: new Date(followUpDate).toISOString(),
      })

      success('Follow-up Scheduled', 'Reminder saved to calendar.')
      setSelectedLeadForFollowUp(null)
      fetchLeads()
    } catch (err: any) {
      error('Failed to schedule', err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
            Calling Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily phone calls, connect with candidates, log outcomes, and schedule follow-ups.
          </p>
        </div>

        {/* Filter mode pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Candidates
          </button>
          <button
            onClick={() => setFilterMode('today_followups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === 'today_followups'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ⏰ Today's Call-backs
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Leads
          </button>
          {callStatuses.map((st) => (
            <button
              key={st}
              onClick={() => setActiveTab(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name or phone..."
            className="w-full text-xs h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Leads Calling List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          Loading calling queue...
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          No candidates found in this calling queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const callingNum = lead.active_calling_no || lead.phone

            return (
              <Card key={lead.id} className="hover:border-slate-300 transition-all">
                <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <Link
                      to={`/leads/${lead.id}`}
                      className="font-bold text-slate-900 text-sm hover:text-blue-600 hover:underline"
                    >
                      {lead.first_name} {lead.last_name || ''}
                    </Link>
                    <p className="text-[11px] text-slate-400">{lead.city || 'No city'} • {lead.qualification}</p>
                  </div>
                  <div>{getStatusBadge('call', lead.call_status)}</div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Phone Details */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {lead.active_calling_no ? 'Active Calling Line' : 'Mobile Number'}
                      </p>
                      <p className="font-mono text-xs font-bold text-slate-900">{formatPhoneNumber(callingNum)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={createTelLink(callingNum)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1 text-xs font-semibold px-2.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                      <a
                        href={createWhatsAppLink(lead.phone, `Hi ${lead.first_name}, connecting regarding your course query!`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                        title="WhatsApp candidate"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Quick Outcome Selector */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Set Call Outcome:
                    </p>
                    <div className="grid grid-cols-3 gap-1 text-[11px]">
                      <button
                        onClick={() => handleUpdateStatus(lead, 'Connected')}
                        className="py-1 px-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 font-semibold"
                      >
                        Connected
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(lead, 'No Answer')}
                        className="py-1 px-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200 font-semibold"
                      >
                        No Answer
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(lead, 'Busy')}
                        className="py-1 px-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded border border-orange-200 font-semibold"
                      >
                        Busy
                      </button>
                    </div>
                  </div>

                  {/* Actions & Next Follow-up */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setSelectedLeadForFollowUp(lead)}
                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-medium cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Add Follow-up
                    </button>
                    {lead.next_follow_up_date && (
                      <span className="text-[11px] text-slate-400">
                        Follow-up: {formatDateSafe(lead.next_follow_up_date)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Follow-up schedule dialog */}
      {selectedLeadForFollowUp && (
        <Dialog
          isOpen={Boolean(selectedLeadForFollowUp)}
          onClose={() => setSelectedLeadForFollowUp(null)}
          title={`Schedule Follow-up with ${selectedLeadForFollowUp.first_name}`}
          description="Create a calendar reminder for this candidate."
          maxWidth="md"
        >
          <form onSubmit={handleScheduleFollowUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                <Input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Notes</label>
              <textarea
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                rows={2}
                placeholder="Candidate requested evening call to review syllabus"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setSelectedLeadForFollowUp(null)}>
                Cancel
              </Button>
              <Button type="submit">Schedule Call-back</Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
