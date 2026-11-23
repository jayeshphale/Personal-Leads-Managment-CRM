import React from 'react'
import type { Lead } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatPhoneNumber } from '@/lib/utils'
import { User, Phone, MapPin, GraduationCap, Briefcase, Tag, Calendar } from 'lucide-react'
import { getStatusBadge } from '@/components/ui/badge'

interface PersonalInfoSectionProps {
  lead: Lead
  onEdit: () => void
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ lead, onEdit }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Personal & Demographic Information
        </CardTitle>
        <button
          onClick={onEdit}
          className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
        >
          Edit Profile
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Full Name</p>
            <p className="font-semibold text-slate-900 mt-0.5">
              {lead.first_name} {lead.last_name || ''}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Age</p>
            <p className="font-semibold text-slate-900 mt-0.5">{lead.age ? `${lead.age} yrs` : 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">City</p>
            <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {lead.city || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Lead Source</p>
            <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              {lead.lead_source}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-slate-100">
          <div>
            <p className="text-slate-400 font-medium">Primary Phone</p>
            <p className="font-mono font-semibold text-slate-900 mt-0.5">
              {formatPhoneNumber(lead.phone)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Active Calling Line</p>
            <p className="font-mono font-semibold text-blue-700 mt-0.5">
              {lead.active_calling_no ? formatPhoneNumber(lead.active_calling_no) : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Alternate Phone</p>
            <p className="font-mono text-slate-700 mt-0.5">
              {lead.alternate_phone ? formatPhoneNumber(lead.alternate_phone) : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Interest Status</p>
            <div className="mt-0.5">{getStatusBadge('interest', lead.interest_status)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100">
          <div>
            <p className="text-slate-400 font-medium">Qualification</p>
            <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              {lead.qualification}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Occupation</p>
            <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              {lead.occupation || 'Not specified'}
            </p>
          </div>
        </div>

        {lead.notes && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">General Notes</p>
            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
              {lead.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
