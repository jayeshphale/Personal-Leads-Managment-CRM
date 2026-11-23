import React from 'react'
import { Search, RotateCcw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Qualification, InterestStatus, CallStatus } from '@/types/crm.types'

interface LeadFilterBarProps {
  search: string
  onSearchChange: (val: string) => void
  city: string
  onCityChange: (val: string) => void
  qualification: string
  onQualificationChange: (val: string) => void
  interestStatus: string
  onInterestStatusChange: (val: string) => void
  callStatus: string
  onCallStatusChange: (val: string) => void
  leadSource: string
  onLeadSourceChange: (val: string) => void
  onReset: () => void
  hasActiveFilters: boolean
}

const qualifications: Qualification[] = [
  'Undergraduate Student',
  'High School / 12th Pass',
  'Graduate / Postgraduate',
  'Working Professional',
  'Other',
]

const interestStatuses: InterestStatus[] = [
  'New',
  'Interested',
  'High Intent',
  'Follow Up',
  'Not Interested',
  'Converted',
  'Junk',
]

const callStatuses: CallStatus[] = [
  'Not Called',
  'Connected',
  'No Answer',
  'Busy',
  'Invalid Number',
]

export const LeadFilterBar: React.FC<LeadFilterBarProps> = ({
  search,
  onSearchChange,
  city,
  onCityChange,
  qualification,
  onQualificationChange,
  interestStatus,
  onInterestStatusChange,
  callStatus,
  onCallStatusChange,
  leadSource,
  onLeadSourceChange,
  onReset,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* Top Search Line */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search candidate by name, phone or alternate phone..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-slate-500 hover:text-slate-800">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Filter by city..."
            className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Qualification
          </label>
          <select
            value={qualification}
            onChange={(e) => onQualificationChange(e.target.value)}
            className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="">All Qualifications</option>
            {qualifications.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Interest Status
          </label>
          <select
            value={interestStatus}
            onChange={(e) => onInterestStatusChange(e.target.value)}
            className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="">All Interests</option>
            {interestStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Call Status
          </label>
          <select
            value={callStatus}
            onChange={(e) => onCallStatusChange(e.target.value)}
            className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="">All Call Statuses</option>
            {callStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Lead Source
          </label>
          <input
            type="text"
            value={leadSource}
            onChange={(e) => onLeadSourceChange(e.target.value)}
            placeholder="e.g. Instagram"
            className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
          />
        </div>
      </div>
    </div>
  )
}
