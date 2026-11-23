import React from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  MessageSquare,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  ArrowUpDown
} from 'lucide-react'
import type { Lead } from '@/types/crm.types'
import { getStatusBadge } from '@/components/ui/badge'
import { formatPhoneNumber, createWhatsAppLink, createTelLink, formatDateSafe } from '@/lib/utils'

interface LeadTableProps {
  leads: Lead[]
  isLoading: boolean
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
  onSort: (column: 'created_at' | 'first_name' | 'next_follow_up_date') => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}) => {
  const isAllSelected = leads.length > 0 && selectedIds.length === leads.length

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading candidate records...</p>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No candidates found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No records match your active filters or search terms. Try clearing filters or adding a new lead.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider select-none">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => onSort('first_name')}
              >
                <div className="flex items-center gap-1.5">
                  Candidate Name
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">Mobile Number</th>
              <th className="py-3 px-3.5">City</th>
              <th className="py-3 px-3.5">Qualification</th>
              <th className="py-3 px-3.5">Lead Source</th>
              <th className="py-3 px-3.5">Call Status</th>
              <th className="py-3 px-3.5">WhatsApp</th>
              <th className="py-3 px-3.5">Interest</th>
              <th
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => onSort('next_follow_up_date')}
              >
                <div className="flex items-center gap-1.5">
                  Follow-up
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const isSelected = selectedIds.includes(lead.id)
              const fullName = `${lead.first_name} ${lead.last_name || ''}`.trim()
              const primaryPhone = lead.active_calling_no || lead.phone

              return (
                <tr
                  key={lead.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(lead.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Candidate Name */}
                  <td className="py-3 px-3.5 font-medium text-slate-900">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="hover:text-blue-600 hover:underline flex items-center gap-1.5 group"
                    >
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600">
                        {fullName}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {lead.occupation && (
                      <p className="text-[11px] text-slate-400 font-normal truncate max-w-[150px]">
                        {lead.occupation}
                      </p>
                    )}
                  </td>

                  {/* Mobile & Action Quick Links */}
                  <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{formatPhoneNumber(lead.phone)}</span>
                      <div className="flex items-center gap-1">
                        <a
                          href={createTelLink(primaryPhone)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title={`Call ${primaryPhone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={createWhatsAppLink(lead.phone, `Hi ${lead.first_name}, connecting regarding your course inquiry!`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Open WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    {lead.active_calling_no && (
                      <span className="text-[10px] text-blue-600 font-normal">
                        Call Line: {lead.active_calling_no}
                      </span>
                    )}
                  </td>

                  {/* City */}
                  <td className="py-3 px-3.5 text-slate-600">{lead.city || '-'}</td>

                  {/* Qualification */}
                  <td className="py-3 px-3.5 text-slate-600 truncate max-w-[130px]">
                    {lead.qualification}
                  </td>

                  {/* Lead Source */}
                  <td className="py-3 px-3.5 text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {lead.lead_source}
                    </span>
                  </td>

                  {/* Call Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {getStatusBadge('call', lead.call_status)}
                  </td>

                  {/* WhatsApp Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {getStatusBadge('whatsapp', lead.whatsapp_status)}
                  </td>

                  {/* Interest Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {getStatusBadge('interest', lead.interest_status)}
                  </td>

                  {/* Next Follow-up */}
                  <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                    {lead.next_follow_up_date ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDateSafe(lead.next_follow_up_date)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Full Profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => onEdit(lead)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Lead"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(lead)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
