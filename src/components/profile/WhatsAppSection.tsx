import React, { useState } from 'react'
import type { Lead, FunnelStage, WhatsAppStatus } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Send,
  Clock,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Download,
  AlertCircle,
  Video,
  UserCheck,
} from 'lucide-react'
import { getStatusBadge } from '@/components/ui/badge'
import { createWhatsAppLink, createTelLink, formatPhoneNumber } from '@/lib/utils'
import { updateLead } from '@/services/leads.service'
import { logActivity } from '@/services/activities.service'
import { createReminder } from '@/services/reminders.service'
import { registerCandidateForWorkshop, getWorkshops } from '@/services/workshops.service'
import { useToast } from '@/components/ui/toast'
import { ScreenshotAttachment } from '@/components/common/ScreenshotAttachment'
import { ObjectionHandlingModal } from '@/components/common/ObjectionHandlingModal'
import {
  SALES_FUNNEL_STEPS,
  PAYMENT_DETAILS,
  FUNNEL_TEMPLATES,
  OBJECTION_HANDLING_LIST,
} from '@/constants/salesFunnelData'
import { addMinutes, format } from 'date-fns'

interface WhatsAppSectionProps {
  lead: Lead
  onLeadUpdated: () => void
}

type ActiveTab = 'funnel' | 'objections' | 'qr' | 'custom'

export const WhatsAppSection: React.FC<WhatsAppSectionProps> = ({ lead, onLeadUpdated }) => {
  const { success, error, info } = useToast()

  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('funnel')

  // Selected funnel step in UI preview
  const currentLeadStage: FunnelStage = lead.funnel_stage || 'New Lead'
  const [selectedFunnelStep, setSelectedFunnelStep] = useState<FunnelStage>(currentLeadStage)

  // Custom message state
  const [customMessage, setCustomMessage] = useState<string>(FUNNEL_TEMPLATES.introVideo(lead))

  // Branching response state for Step 3 (Did lead watch video?)
  const [candidateWatchedVideo, setCandidateWatchedVideo] = useState<'yes' | 'no' | null>(null)

  // Modals & temporary states
  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [objectionSearch, setObjectionSearch] = useState('')

  // Payment screenshot proof
  const [paymentScreenshots, setPaymentScreenshots] = useState<string[]>(
    lead.payment_99_screenshot ? [lead.payment_99_screenshot] : []
  )

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    success('Copied', `${label} copied to clipboard!`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Update lead's funnel stage
  const handleSetFunnelStage = async (newStage: FunnelStage, notes?: string) => {
    try {
      setIsUpdating(true)
      const updates: Partial<Lead> = { funnel_stage: newStage }

      if (newStage === 'Video Sent') {
        updates.whatsapp_status = 'Sent'
        updates.video_sent_at = new Date().toISOString()
      } else if (newStage === '15m Follow-up') {
        updates.whatsapp_status = 'Replied'
      } else if (newStage === 'Payment Pending (₹99)') {
        updates.interest_status = 'High Intent'
      } else if (newStage === 'Seat Reserved') {
        updates.interest_status = 'High Intent'
        if (paymentScreenshots.length > 0) {
          updates.payment_99_screenshot = paymentScreenshots[0]
        }
      }

      await updateLead(lead.id, updates, lead)
      await logActivity({
        lead_id: lead.id,
        activity_type: `Funnel: ${newStage}`,
        old_value: lead.funnel_stage || 'New Lead',
        new_value: newStage,
        notes: notes || undefined,
      })

      setSelectedFunnelStep(newStage)
      success('Funnel Updated', `Lead advanced to: ${newStage}`)
      onLeadUpdated()
    } catch (err: any) {
      error('Failed to update funnel', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Toggle "Number Saved"
  const handleToggleNumberSaved = async () => {
    try {
      setIsUpdating(true)
      const newState = !lead.is_number_saved
      await updateLead(lead.id, { is_number_saved: newState }, lead)
      await logActivity({
        lead_id: lead.id,
        activity_type: newState ? 'Contact Saved on Phone' : 'Contact Unsaved',
        notes: `Candidate: ${lead.first_name}`,
      })
      success(
        newState ? 'Number Marked as Saved' : 'Marked as Not Saved',
        `${lead.first_name}'s phone number contact status updated.`
      )
      onLeadUpdated()
    } catch (err: any) {
      error('Error', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Schedule 15-Minute Follow-up Reminder
  const handleSchedule15mReminder = async () => {
    try {
      setIsUpdating(true)
      const now = new Date()
      const followUpTime = addMinutes(now, 15)
      const due_date = format(followUpTime, 'yyyy-MM-dd')
      const due_time = format(followUpTime, 'HH:mm:ss')

      await createReminder({
        lead_id: lead.id,
        title: `15-Min Video Follow-up: ${lead.first_name}`,
        description: `Check if ${lead.first_name} finished watching the 10-min introduction video and ask for ₹99 registration.`,
        due_date,
        due_time,
        priority: 'Urgent',
      })

      success(
        '15-Min Reminder Scheduled!',
        `Reminder set for ${format(followUpTime, 'hh:mm a')} today.`
      )
    } catch (err: any) {
      error('Failed to set reminder', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Confirm Seat and Auto-register Workshop
  const handleConfirmSeatReservation = async () => {
    try {
      setIsUpdating(true)
      // 1. Get workshops to auto-register
      const wsList = await getWorkshops()
      const activeWs = wsList.find((w) => w.status === 'Scheduled') || wsList[0]

      if (activeWs) {
        await registerCandidateForWorkshop(
          lead.id,
          activeWs.id,
          `Auto-registered via ₹99 Seat Reservation (Jayesh UPI: ${PAYMENT_DETAILS.upiId})`
        )
      }

      await handleSetFunnelStage('Seat Reserved', 'Candidate confirmed seat and received Zoom link.')
      success(
        'Seat Reserved & Workshop Registered!',
        `Seat confirmed for ${lead.first_name}. Zoom link ready to send!`
      )
    } catch (err: any) {
      error('Failed to reserve seat', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const activePhone = lead.phone

  return (
    <Card className="border-emerald-200/90 shadow-xs">
      <CardHeader className="py-4 px-5 bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/40 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                Course Sales Funnel & WhatsApp Engine
              </CardTitle>
              {getStatusBadge('funnel', lead.funnel_stage || 'New Lead')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Source: <strong className="text-slate-700">{lead.lead_source}</strong> • Speaker:{' '}
              {PAYMENT_DETAILS.speakerName} • Fee: ₹{PAYMENT_DETAILS.amount}
            </p>
          </div>
        </div>

        {/* Top Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsObjectionModalOpen(true)}
            className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" />
            ऑब्जेक्शन हँडलिंग (Cheatsheet)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsQrModalOpen(true)}
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <QrCode className="w-3.5 h-3.5 mr-1 text-blue-600" />
            ₹99 QR Code
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Recipient Bar */}
        <div className="flex flex-wrap items-center justify-between p-3 bg-slate-50 border border-slate-200/90 rounded-xl gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <span className="text-slate-500 font-medium">WhatsApp Number: </span>
              <span className="font-mono font-bold text-slate-900 ml-1">
                {formatPhoneNumber(activePhone)}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(activePhone, 'Phone number', 'phone')}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
              title="Copy Phone"
            >
              {copiedKey === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Number Saved Checkbox Toggle */}
            <button
              type="button"
              onClick={handleToggleNumberSaved}
              disabled={isUpdating}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                lead.is_number_saved
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lead.is_number_saved ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Number Saved on WhatsApp</span>
                </>
              ) : (
                <>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save Number on Phone</span>
                </>
              )}
            </button>

            <a
              href={createTelLink(activePhone)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Phone className="w-3 h-3 text-blue-600" />
              Call
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('funnel')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'funnel'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            1. Sales Funnel Flow (व्हिडिओ ➔ ₹99 ➔ सीट)
          </button>
          <button
            onClick={() => setActiveTab('objections')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'objections'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            2. मराठी Objection Handling ({OBJECTION_HANDLING_LIST.length})
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            3. Paytm UPI QR Code (₹99)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            4. Custom Message
          </button>
        </div>

        {/* TAB 1: SALES FUNNEL FLOW */}
        {activeTab === 'funnel' && (
          <div className="space-y-5">
            {/* Funnel Visual Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[
                { stage: 'New Lead' as FunnelStage, num: 1, label: '1. Call & Save' },
                { stage: 'Video Sent' as FunnelStage, num: 2, label: '2. 10m Video' },
                { stage: '15m Follow-up' as FunnelStage, num: 3, label: '3. 15m Check-in' },
                { stage: 'Payment Pending (₹99)' as FunnelStage, num: 4, label: '4. ₹99 QR & UPI' },
                { stage: 'Seat Reserved' as FunnelStage, num: 5, label: '5. Seat Reserved' },
              ].map((step) => {
                const isCurrent = (lead.funnel_stage || 'New Lead') === step.stage
                const isSelected = selectedFunnelStep === step.stage

                return (
                  <button
                    key={step.stage}
                    type="button"
                    onClick={() => setSelectedFunnelStep(step.stage)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : isCurrent
                        ? 'border-blue-400 bg-blue-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Step {step.num}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                      {step.label}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* STEP 1: CALL & SAVE NUMBER */}
            {selectedFunnelStep === 'New Lead' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      Step 1: Initial Call & Save Contact Number
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Lead from <strong>{lead.lead_source}</strong>. Connect with candidate, introduce opportunity, and save their number.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleNumberSaved}
                    className="text-xs"
                  >
                    {lead.is_number_saved ? '✓ Number Saved' : 'Mark Number Saved'}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <a
                    href={createTelLink(activePhone)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Active Line (+91 {activePhone})
                  </a>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSetFunnelStage('Video Sent', 'Initial call completed. Moving to 10m video step.')}
                    isLoading={isUpdating}
                    className="text-xs"
                  >
                    Proceed to Step 2: Send 10-Min Video
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: INTRO 10-MIN VIDEO SEND */}
            {selectedFunnelStep === 'Video Sent' && (
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      Step 2: 10-Min Introduction Video & Free Community
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Send YouTube video link and free WhatsApp channel link.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSchedule15mReminder}
                    disabled={isUpdating}
                    className="text-xs bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Set 15-Min Follow-up Timer
                  </Button>
                </div>

                {/* Message Preview */}
                <div className="p-3 bg-white rounded-lg border border-blue-100 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line shadow-2xs select-text">
                  {FUNNEL_TEMPLATES.introVideo(lead)}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <a
                      href={createWhatsAppLink(activePhone, FUNNEL_TEMPLATES.introVideo(lead))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Send Video on WhatsApp
                    </a>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(FUNNEL_TEMPLATES.introVideo(lead), 'Video message', 'tpl_video')
                      }
                      className="text-xs"
                    >
                      {copiedKey === 'tpl_video' ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy Message
                        </>
                      )}
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSetFunnelStage('15m Follow-up', '10m video sent on WhatsApp. Waiting 15m.')}
                    isLoading={isUpdating}
                    className="text-xs"
                  >
                    Mark Video Sent & Go to 15m Follow-up
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: 15-MIN CONFIRMATION FOLLOW-UP */}
            {selectedFunnelStep === '15m Follow-up' && (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Step 3: 15-Minute Follow-up Check-in
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ask candidate if they watched the entire presentation video.
                  </p>
                </div>

                {/* 15m Message Preview */}
                <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line shadow-2xs select-text">
                  {FUNNEL_TEMPLATES.followUp15Min(lead)}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={createWhatsAppLink(activePhone, FUNNEL_TEMPLATES.followUp15Min(lead))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Send 15m Check-in on WhatsApp
                  </a>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(FUNNEL_TEMPLATES.followUp15Min(lead), '15m Follow-up', 'tpl_15m')
                    }
                    className="text-xs"
                  >
                    {copiedKey === 'tpl_15m' ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Message
                      </>
                    )}
                  </Button>
                </div>

                {/* Branching Buttons: Did Lead Watch Video? */}
                <div className="pt-3 border-t border-amber-200/80 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800">
                    Candidate Response / उमेदवाराचे उत्तर काय आले?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* OPTION YES: Video Watched */}
                    <div
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        candidateWatchedVideo === 'yes'
                          ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                      onClick={() => setCandidateWatchedVideo('yes')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          🎉 YES: पूर्ण व्हिडिओ पाहिला
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          Pay ₹99
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Candidate confirmed watching video. Send ₹99 QR code and payment request!
                      </p>
                    </div>

                    {/* OPTION NO: Video Not Watched */}
                    <div
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        candidateWatchedVideo === 'no'
                          ? 'border-rose-400 bg-rose-50/70 ring-1 ring-rose-400'
                          : 'border-slate-200 bg-white hover:border-rose-300'
                      }`}
                      onClick={() => setCandidateWatchedVideo('no')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                          ⏳ NO: अजून व्हिडिओ नाही पाहिला
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                          Urgency
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Send urgency reminder (limited vacancies) to watch right away.
                      </p>
                    </div>
                  </div>

                  {/* If NO chosen -> Show Urgency Template */}
                  {candidateWatchedVideo === 'no' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 mt-2">
                      <p className="text-xs font-bold text-rose-900">Urgency Marathi Message:</p>
                      <div className="p-2.5 bg-white rounded border border-rose-200 text-xs text-slate-800 select-text">
                        {FUNNEL_TEMPLATES.videoWatchedNo(lead)}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={createWhatsAppLink(activePhone, FUNNEL_TEMPLATES.videoWatchedNo(lead))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Urgency Message on WhatsApp
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              FUNNEL_TEMPLATES.videoWatchedNo(lead),
                              'Urgency message',
                              'urgency'
                            )
                          }
                          className="text-xs"
                        >
                          {copiedKey === 'urgency' ? '✓ Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* If YES chosen -> Button to proceed to Step 4 */}
                  {candidateWatchedVideo === 'yes' && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleSetFunnelStage(
                            'Payment Pending (₹99)',
                            'Candidate confirmed watching video. Requested ₹99 fee with QR code.'
                          )
                        }
                        isLoading={isUpdating}
                        className="text-xs w-full sm:w-auto"
                      >
                        Proceed to Step 4: Send ₹99 QR Code & Payment Request
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: ₹99 QR CODE & PAYMENT REQUEST */}
            {selectedFunnelStep === 'Payment Pending (₹99)' && (
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-purple-600" />
                      Step 4: ₹99 QR Code & Registration Payment
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Send Paytm UPI QR code, ask for ₹99 payment and screenshot.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsQrModalOpen(true)}
                    className="text-xs border-purple-300 text-purple-700"
                  >
                    View QR Code
                  </Button>
                </div>

                {/* Message preview */}
                <div className="p-3 bg-white rounded-lg border border-purple-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line shadow-2xs select-text">
                  {FUNNEL_TEMPLATES.videoWatchedYes(lead)}
                </div>

                {/* QR Mini Preview Card */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-purple-200">
                  <img
                    src={PAYMENT_DETAILS.qrCodeUrl}
                    alt="Jayesh Phale Paytm UPI QR"
                    className="w-24 h-24 object-contain rounded-lg border border-slate-200 shadow-2xs"
                  />
                  <div className="text-xs space-y-1 w-full">
                    <p className="font-bold text-slate-900 text-sm">
                      {PAYMENT_DETAILS.payeeName}
                    </p>
                    <p className="text-slate-500">
                      Paytm UPI ID:{' '}
                      <strong className="font-mono text-purple-700">
                        {PAYMENT_DETAILS.upiId}
                      </strong>
                    </p>
                    <p className="text-emerald-700 font-bold">
                      Registration Fee: ₹{PAYMENT_DETAILS.amount}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(PAYMENT_DETAILS.upiId, 'UPI ID', 'upi_id')
                        }
                        className="text-[11px] h-7 px-2"
                      >
                        {copiedKey === 'upi_id' ? '✓ Copied' : 'Copy UPI ID'}
                      </Button>
                      <a
                        href={PAYMENT_DETAILS.qrCodeUrl}
                        download="Jayesh_UPI_QR_99.png"
                        className="inline-flex items-center gap-1 text-[11px] h-7 px-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        Download QR
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp & Copy Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={createWhatsAppLink(activePhone, FUNNEL_TEMPLATES.videoWatchedYes(lead))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Send ₹99 Payment Request on WhatsApp
                  </a>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        FUNNEL_TEMPLATES.videoWatchedYes(lead),
                        'Payment Request',
                        'tpl_pay'
                      )
                    }
                    className="text-xs"
                  >
                    {copiedKey === 'tpl_pay' ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Message
                      </>
                    )}
                  </Button>
                </div>

                {/* Payment Screenshot & Confirmation */}
                <div className="pt-3 border-t border-purple-200 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      📸 ₹99 Payment Screenshot Proof (Screenshot / Paste Ctrl+V):
                    </label>
                    <ScreenshotAttachment
                      images={paymentScreenshots}
                      onChange={setPaymentScreenshots}
                      label="Attach candidate payment screenshot"
                      maxImages={3}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={handleConfirmSeatReservation}
                      isLoading={isUpdating}
                      className="text-xs w-full sm:w-auto"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Payment Done! Confirm Seat & Generate Zoom Link
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: SEAT RESERVED (ZOOM LINK) */}
            {selectedFunnelStep === 'Seat Reserved' && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Step 5: Seat Reserved & Live Session Joining Details
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Session with <strong>{PAYMENT_DETAILS.speakerName}</strong> at{' '}
                      <strong>{PAYMENT_DETAILS.sessionTime}</strong>.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✅ Seat Reserved
                  </span>
                </div>

                {/* Message preview */}
                <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line shadow-2xs select-text">
                  {FUNNEL_TEMPLATES.seatReserved(lead)}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={createWhatsAppLink(activePhone, FUNNEL_TEMPLATES.seatReserved(lead))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Send Seat Reservation on WhatsApp
                  </a>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        FUNNEL_TEMPLATES.seatReserved(lead),
                        'Seat reservation message',
                        'tpl_seat'
                      )
                    }
                    className="text-xs"
                  >
                    {copiedKey === 'tpl_seat' ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Message
                      </>
                    )}
                  </Button>

                  <a
                    href={PAYMENT_DETAILS.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Zoom Link
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MARATHI OBJECTION HANDLING */}
        {activeTab === 'objections' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                value={objectionSearch}
                onChange={(e) => setObjectionSearch(e.target.value)}
                placeholder="Search Marathi objections (उदा. पैसे, वेळ, फ्रॉड, पालक, काम)..."
                className="w-full text-xs h-8 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsObjectionModalOpen(true)}
                className="text-xs whitespace-nowrap"
              >
                Expand Full Screen
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {OBJECTION_HANDLING_LIST.filter((item) => {
                const s = objectionSearch.toLowerCase().trim()
                return (
                  !s ||
                  item.objection.toLowerCase().includes(s) ||
                  item.responseMr.toLowerCase().includes(s) ||
                  item.keyPoint.toLowerCase().includes(s)
                )
              }).map((item) => {
                const waLink = createWhatsAppLink(activePhone, item.responseMr)

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-emerald-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {item.keyPoint}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">
                          ❓ &ldquo;{item.objection}&rdquo;
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(item.responseMr, 'Script', item.id)}
                          className="text-[11px] h-7 px-2"
                        >
                          {copiedKey === item.id ? '✓ Copied' : 'Copy'}
                        </Button>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </a>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line select-text border border-slate-200/60">
                      {item.responseMr}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PAYTM UPI QR CODE DETAILS */}
        {activeTab === 'qr' && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-xs">
              <img
                src={PAYMENT_DETAILS.qrCodeUrl}
                alt="Paytm UPI QR Code"
                className="w-56 h-auto mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{PAYMENT_DETAILS.payeeName}</h3>
              <p className="text-xs font-mono font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block">
                {PAYMENT_DETAILS.upiId}
              </p>
              <p className="text-sm font-bold text-emerald-700 pt-1">
                Workshop Registration Charge: ₹{PAYMENT_DETAILS.amount}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(PAYMENT_DETAILS.upiId, 'UPI ID', 'qr_upi_tab')}
              >
                {copiedKey === 'qr_upi_tab' ? '✓ Copied!' : 'Copy UPI ID'}
              </Button>

              <a
                href={PAYMENT_DETAILS.qrCodeUrl}
                download="Jayesh_Paytm_UPI_QR_99.png"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download QR Image
              </a>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOM MESSAGE */}
        {activeTab === 'custom' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Compose Custom WhatsApp Message:
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder="Type your WhatsApp message..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {customMessage.length} characters
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(customMessage, 'Custom message', 'custom_msg')}
                  className="text-xs"
                >
                  {copiedKey === 'custom_msg' ? '✓ Copied' : 'Copy'}
                </Button>
                <a
                  href={createWhatsAppLink(activePhone, customMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Launch WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Objection Handling Modal */}
      <ObjectionHandlingModal
        isOpen={isObjectionModalOpen}
        onClose={() => setIsObjectionModalOpen(false)}
        leadPhone={activePhone}
        leadName={lead.first_name}
        onSelectScript={(script) => {
          setCustomMessage(script)
          setActiveTab('custom')
          setIsObjectionModalOpen(false)
        }}
      />

      {/* QR Code Full Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsQrModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">₹99 Paytm UPI Payment QR</h3>
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
              className="w-64 h-auto mx-auto rounded-xl border border-slate-200 shadow-md"
            />

            <div className="space-y-1">
              <p className="font-bold text-slate-900">{PAYMENT_DETAILS.payeeName}</p>
              <p className="font-mono text-xs text-purple-700 font-semibold bg-purple-50 py-1 px-3 rounded-full inline-block border border-purple-200">
                {PAYMENT_DETAILS.upiId}
              </p>
              <p className="text-emerald-700 font-bold text-sm">Fee: ₹{PAYMENT_DETAILS.amount}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(PAYMENT_DETAILS.upiId, 'UPI ID', 'modal_upi')}
              >
                {copiedKey === 'modal_upi' ? '✓ Copied' : 'Copy UPI ID'}
              </Button>
              <a
                href={PAYMENT_DETAILS.qrCodeUrl}
                download="Jayesh_Paytm_UPI_QR_99.png"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download QR
              </a>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
