import React, { useState, useEffect } from 'react'
import { getLeads, updateLead } from '@/services/leads.service'
import { logActivity } from '@/services/activities.service'
import type { Lead, FunnelStage, WhatsAppStatus } from '@/types/crm.types'
import {
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Search,
  Send,
  Clock,
  QrCode,
  ShieldCheck,
  Sparkles,
  Video,
  Download,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { getStatusBadge } from '@/components/ui/badge'
import { createWhatsAppLink, formatPhoneNumber } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Link } from 'react-router-dom'
import { ObjectionHandlingModal } from '@/components/common/ObjectionHandlingModal'
import {
  FUNNEL_TEMPLATES,
  PAYMENT_DETAILS,
} from '@/constants/salesFunnelData'

type FilterOption = 'all' | FunnelStage | 'Replied'

const filterTabs: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All Candidates' },
  { id: 'New Lead', label: '1. New / Call' },
  { id: 'Video Sent', label: '2. 10m Video' },
  { id: '15m Follow-up', label: '3. 15m Follow-up' },
  { id: 'Payment Pending (₹99)', label: '4. ₹99 QR Pending' },
  { id: 'Seat Reserved', label: '5. Seat Reserved' },
  { id: 'Replied', label: 'Replied' },
]

export const WhatsAppTracker: React.FC = () => {
  const { success, error } = useToast()
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [selectedLeadForObjection, setSelectedLeadForObjection] = useState<Lead | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const res = await getLeads({
        search,
        pageSize: 100,
      })

      let filtered = res.leads

      if (activeFilter === 'Replied') {
        filtered = filtered.filter((l) => l.whatsapp_status === 'Replied')
      } else if (activeFilter !== 'all') {
        filtered = filtered.filter((l) => (l.funnel_stage || 'New Lead') === activeFilter)
      }

      setLeads(filtered)
    } catch (err: any) {
      error('Failed to load leads', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [activeFilter, search])

  const handleCopy = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    success('Copied', `${label} copied to clipboard.`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleAdvanceFunnel = async (lead: Lead, nextStage: FunnelStage) => {
    try {
      const updates: Partial<Lead> = { funnel_stage: nextStage }
      if (nextStage === 'Video Sent') {
        updates.whatsapp_status = 'Sent'
        updates.video_sent_at = new Date().toISOString()
      } else if (nextStage === '15m Follow-up') {
        updates.whatsapp_status = 'Replied'
      } else if (nextStage === 'Seat Reserved') {
        updates.interest_status = 'High Intent'
      }

      await updateLead(lead.id, updates, lead)
      await logActivity({
        lead_id: lead.id,
        activity_type: `Funnel: ${nextStage}`,
        old_value: lead.funnel_stage || 'New Lead',
        new_value: nextStage,
      })
      success('Funnel Updated', `Advanced ${lead.first_name} to ${nextStage}.`)
      fetchLeads()
    } catch (err: any) {
      error('Failed to update funnel', err.message)
    }
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
      {/* Header with Quick Modals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Course Sales Funnel & WhatsApp Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            1-Click WhatsApp flow: 10m Video ➔ 15m Check-in ➔ ₹99 Paytm QR ➔ Seat Reserved (Zoom Link).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedLeadForObjection(leads[0] || null)}
            className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" />
            🛡️ मराठी Objection Handling
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsQrModalOpen(true)}
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <QrCode className="w-3.5 h-3.5 mr-1 text-blue-600" />
            💳 ₹99 Paytm QR
          </Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, city..."
            className="w-full text-xs h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* WhatsApp Candidates Cards */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          Loading candidates in funnel...
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          No candidates found in this stage.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const currentStage: FunnelStage = lead.funnel_stage || 'New Lead'

            // Dynamic links for each funnel step
            const videoLink = createWhatsAppLink(lead.phone, FUNNEL_TEMPLATES.introVideo(lead))
            const followupLink = createWhatsAppLink(
              lead.phone,
              FUNNEL_TEMPLATES.followUp15Min(lead)
            )
            const pay99Link = createWhatsAppLink(
              lead.phone,
              FUNNEL_TEMPLATES.videoWatchedYes(lead)
            )
            const seatLink = createWhatsAppLink(lead.phone, FUNNEL_TEMPLATES.seatReserved(lead))

            return (
              <Card key={lead.id} className="hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-bold text-slate-900 text-sm hover:text-emerald-700 hover:underline flex items-center gap-1.5"
                      >
                        {lead.first_name} {lead.last_name || ''}
                      </Link>
                      <p className="text-[11px] text-slate-400">
                        {lead.city || 'No city'} • Source:{' '}
                        <span className="font-semibold text-slate-600">{lead.lead_source}</span>
                      </p>
                    </div>
                    <div>{getStatusBadge('funnel', currentStage)}</div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    {/* Phone & Number Saved Indicator */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {formatPhoneNumber(lead.phone)}
                        </span>
                        {lead.is_number_saved && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            Saved
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(lead.phone, 'Phone number', `phone_${lead.id}`)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded flex items-center gap-1 text-[11px]"
                        title="Copy phone"
                      >
                        {copiedKey === `phone_${lead.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy
                      </button>
                    </div>

                    {/* Funnel Quick Action Trigger */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ⚡ Quick WhatsApp Funnel Actions:
                      </span>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {/* 1. Send Video */}
                        <a
                          href={videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleAdvanceFunnel(lead, 'Video Sent')}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors"
                        >
                          <Video className="w-3 h-3" />
                          10m Video
                        </a>

                        {/* 2. 15m Check-in */}
                        <a
                          href={followupLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleAdvanceFunnel(lead, '15m Follow-up')}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          15m Check-in
                        </a>

                        {/* 3. ₹99 QR Request */}
                        <a
                          href={pay99Link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleAdvanceFunnel(lead, 'Payment Pending (₹99)')}
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors"
                        >
                          <QrCode className="w-3 h-3" />
                          ₹99 QR Code
                        </a>

                        {/* 4. Seat Reserved (Zoom) */}
                        <a
                          href={seatLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleAdvanceFunnel(lead, 'Seat Reserved')}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          Seat Reserved
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer: Objection & Status */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForObjection(lead)}
                    className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Objection Script
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(lead, 'Sent')}
                      className="text-[10px] h-6 px-1.5"
                    >
                      Sent
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleUpdateStatus(lead, 'Replied')}
                      className="text-[10px] h-6 px-1.5"
                    >
                      Replied
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Objection Handling Modal */}
      <ObjectionHandlingModal
        isOpen={Boolean(selectedLeadForObjection)}
        onClose={() => setSelectedLeadForObjection(null)}
        leadPhone={selectedLeadForObjection?.phone}
        leadName={selectedLeadForObjection?.first_name}
      />

      {/* Full QR Preview Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsQrModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Paytm UPI QR (₹99)</h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <img
              src={PAYMENT_DETAILS.qrCodeUrl}
              alt="Paytm QR Code"
              className="w-56 h-auto mx-auto rounded-xl border border-slate-200 shadow-md"
            />

            <div className="space-y-1">
              <p className="font-bold text-slate-900">{PAYMENT_DETAILS.payeeName}</p>
              <p className="font-mono text-xs text-purple-700 font-semibold bg-purple-50 py-1 px-3 rounded-full inline-block border border-purple-200">
                {PAYMENT_DETAILS.upiId}
              </p>
              <p className="text-emerald-700 font-bold text-sm">₹{PAYMENT_DETAILS.amount} मात्र</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(PAYMENT_DETAILS.upiId, 'UPI ID', 'modal_qr')}
              >
                {copiedKey === 'modal_qr' ? '✓ Copied' : 'Copy UPI'}
              </Button>
              <a
                href={PAYMENT_DETAILS.qrCodeUrl}
                download="Jayesh_Paytm_UPI_QR_99.png"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
