import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckSquare, PhoneForwarded, MessageSquare, Flame, Check } from 'lucide-react'
import type { CallStatus, WhatsAppStatus, InterestStatus } from '@/types/crm.types'
import { bulkUpdateStatus } from '@/services/leads.service'
import { useToast } from '@/components/ui/toast'

interface BulkActionToolbarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
  onRefresh: () => void
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  selectedIds,
  onClearSelection,
  onRefresh,
}) => {
  const { success, error } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  if (selectedCount === 0) return null

  const handleUpdateCallStatus = async (call_status: CallStatus) => {
    try {
      setIsUpdating(true)
      await bulkUpdateStatus(selectedIds, { call_status })
      success('Bulk Updated', `Updated calling status to ${call_status} for ${selectedCount} leads.`)
      onRefresh()
    } catch (err: any) {
      error('Update failed', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateWhatsApp = async (whatsapp_status: WhatsAppStatus) => {
    try {
      setIsUpdating(true)
      await bulkUpdateStatus(selectedIds, { whatsapp_status })
      success('Bulk Updated', `Updated WhatsApp status to ${whatsapp_status} for ${selectedCount} leads.`)
      onRefresh()
    } catch (err: any) {
      error('Update failed', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateInterest = async (interest_status: InterestStatus) => {
    try {
      setIsUpdating(true)
      await bulkUpdateStatus(selectedIds, { interest_status })
      success('Bulk Updated', `Updated interest to ${interest_status} for ${selectedCount} leads.`)
      onRefresh()
    } catch (err: any) {
      error('Update failed', err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-2xs animate-in fade-in duration-150">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-semibold text-blue-900">
          {selectedCount} candidate{selectedCount > 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-xs text-blue-700 hover:text-blue-900 underline ml-2 cursor-pointer"
        >
          Deselect all
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
          Bulk Set:
        </span>

        {/* Quick Bulk Calling Status */}
        <select
          onChange={(e) => {
            if (e.target.value) handleUpdateCallStatus(e.target.value as CallStatus)
          }}
          defaultValue=""
          disabled={isUpdating}
          className="h-8 text-xs bg-white border border-blue-300 rounded-md px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
        >
          <option value="" disabled>
            📞 Call Status
          </option>
          <option value="Not Called">Not Called</option>
          <option value="Connected">Connected</option>
          <option value="No Answer">No Answer</option>
          <option value="Busy">Busy</option>
          <option value="Invalid Number">Invalid Number</option>
        </select>

        {/* Quick Bulk WhatsApp */}
        <select
          onChange={(e) => {
            if (e.target.value) handleUpdateWhatsApp(e.target.value as WhatsAppStatus)
          }}
          defaultValue=""
          disabled={isUpdating}
          className="h-8 text-xs bg-white border border-blue-300 rounded-md px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
        >
          <option value="" disabled>
            💬 WhatsApp Status
          </option>
          <option value="Not Sent">Not Sent</option>
          <option value="Sent">Sent</option>
          <option value="Replied">Replied</option>
        </select>

        {/* Quick Bulk Interest */}
        <select
          onChange={(e) => {
            if (e.target.value) handleUpdateInterest(e.target.value as InterestStatus)
          }}
          defaultValue=""
          disabled={isUpdating}
          className="h-8 text-xs bg-white border border-blue-300 rounded-md px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
        >
          <option value="" disabled>
            🎯 Interest Status
          </option>
          <option value="Interested">Interested</option>
          <option value="High Intent">High Intent</option>
          <option value="Follow Up">Follow Up</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Converted">Converted</option>
        </select>
      </div>
    </div>
  )
}
