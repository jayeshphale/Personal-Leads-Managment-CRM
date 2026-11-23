import React, { useState, useEffect } from 'react'
import { getLeads, updateLead } from '@/services/leads.service'
import { logActivity } from '@/services/activities.service'
import type { Lead, WhatsAppStatus } from '@/types/crm.types'
import { MessageSquare, ExternalLink, Copy, Check, Search, Send, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getStatusBadge } from '@/components/ui/badge'
import { createWhatsAppLink, formatPhoneNumber } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Link } from 'react-router-dom'

const waStatuses: WhatsAppStatus[] = ['Not Sent', 'Sent', 'Replied']

export const WhatsAppTracker: React.FC = () => {
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState<WhatsAppStatus | 'all'>('Not Sent')
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const res = await getLeads({
        whatsappStatus: activeTab === 'all' ? undefined : activeTab,
        search,
        pageSize: 100,
      })
      setLeads(res.leads)
    } catch (err: any) {
      error('Failed to load leads', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [activeTab, search])

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    success('Copied', 'Phone number copied to clipboard.')
  }

  const handleUpdateStatus = async (lead: Lead, newStatus: WhatsAppStatus) => {
    try {
      await updateLead(lead.id, { whatsapp_status: newStatus }, lead)
      await logActivity({
        lead_id: lead.id,
        activity_type: newStatus === 'Replied' ? 'WhatsApp Reply Received' : 'WhatsApp Message Sent',
        old_value: lead.whatsapp_status,
        new_value: newStatus,
      })
      success('Status Confirmed', `Marked ${lead.first_name} as ${newStatus}.`)
      fetchLeads()
    } catch (err: any) {
      error('Failed to update status', err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          WhatsApp Tracker
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Send click-to-chat WhatsApp messages and manually confirm status updates with full audit logs.
        </p>
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
            All Candidates
          </button>
          {waStatuses.map((st) => (
            <button
              key={st}
              onClick={() => setActiveTab(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === st
                  ? 'bg-emerald-600 text-white shadow-xs'
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

      {/* WhatsApp List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          Loading WhatsApp messages...
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          No candidates in this WhatsApp category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const waLink = createWhatsAppLink(
              lead.phone,
              `Hi ${lead.first_name}, connecting regarding your course interest!`
            )

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
                    <p className="text-[11px] text-slate-400">{lead.city || 'No city'} • {lead.lead_source}</p>
                  </div>
                  <div>{getStatusBadge('whatsapp', lead.whatsapp_status)}</div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Phone & Copy */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {formatPhoneNumber(lead.phone)}
                    </span>
                    <button
                      onClick={() => handleCopyPhone(lead.phone)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded flex items-center gap-1 text-[11px]"
                      title="Copy phone"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>

                  {/* Open WhatsApp Button */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open WhatsApp Chat
                  </a>

                  {/* Manual Confirmation Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Confirm:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(lead, 'Sent')}
                        className="text-[11px] h-7 px-2"
                      >
                        <Send className="w-3 h-3 mr-1 text-blue-600" />
                        Sent
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateStatus(lead, 'Replied')}
                        className="text-[11px] h-7 px-2"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Replied
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
