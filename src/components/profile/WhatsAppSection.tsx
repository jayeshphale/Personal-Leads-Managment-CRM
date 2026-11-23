import React, { useState } from 'react'
import type { Lead, WhatsAppStatus } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, ExternalLink, Copy, Check, Send } from 'lucide-react'
import { getStatusBadge } from '@/components/ui/badge'
import { createWhatsAppLink } from '@/lib/utils'
import { updateLead } from '@/services/leads.service'
import { logActivity } from '@/services/activities.service'
import { useToast } from '@/components/ui/toast'

interface WhatsAppSectionProps {
  lead: Lead
  onLeadUpdated: () => void
}

const templates = [
  {
    title: 'Intro & Course Inquiry',
    text: (lead: Lead) =>
      `Hi ${lead.first_name}, thank you for your interest in our advanced training program! Are you available for a brief 5-minute call today to discuss the syllabus and upcoming batch dates?`,
  },
  {
    title: 'Workshop Invitation',
    text: (lead: Lead) =>
      `Hi ${lead.first_name}, we are hosting a practical live masterclass this weekend. Would you like me to reserve your free seat?`,
  },
  {
    title: 'Follow-up / Fee Details',
    text: (lead: Lead) =>
      `Hi ${lead.first_name}, following up on our recent discussion. Here are the package details for your review. Let me know if you have any questions!`,
  },
]

export const WhatsAppSection: React.FC<WhatsAppSectionProps> = ({ lead, onLeadUpdated }) => {
  const { success, error } = useToast()
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0)
  const [customMessage, setCustomMessage] = useState(templates[0].text(lead))
  const [copied, setCopied] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleTemplateSelect = (idx: number) => {
    setSelectedTemplateIndex(idx)
    setCustomMessage(templates[idx].text(lead))
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    success('Copied', 'Phone number copied to clipboard.')
  }

  const handleMarkStatus = async (status: WhatsAppStatus) => {
    try {
      setIsUpdating(true)
      await updateLead(lead.id, { whatsapp_status: status }, lead)
      await logActivity({
        lead_id: lead.id,
        activity_type: status === 'Replied' ? 'WhatsApp Reply Received' : 'WhatsApp Message Sent',
        old_value: lead.whatsapp_status,
        new_value: status,
      })
      success('WhatsApp Status Updated', `Marked as ${status}.`)
      onLeadUpdated()
    } catch (err: any) {
      error('Failed to update status', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const waLink = createWhatsAppLink(lead.phone, customMessage)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          WhatsApp Communication Tracker
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          {getStatusBadge('whatsapp', lead.whatsapp_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Recipient Phone:</span>
            <span className="font-mono text-xs font-bold text-slate-900">{lead.phone}</span>
            <button
              onClick={handleCopyPhone}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
              title="Copy number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open WhatsApp Chat
            </a>
          </div>
        </div>

        {/* Message Templates */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Prefilled Message Templates:
          </p>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl, i) => (
              <button
                key={tpl.title}
                type="button"
                onClick={() => handleTemplateSelect(i)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  selectedTemplateIndex === i
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tpl.title}
              </button>
            ))}
          </div>

          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs leading-relaxed"
          />
        </div>

        {/* Manual Confirmation Status Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Update Confirmed Status:</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkStatus('Sent')}
              isLoading={isUpdating}
            >
              <Send className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Mark as Sent
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={() => handleMarkStatus('Replied')}
              isLoading={isUpdating}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Mark as Replied
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
