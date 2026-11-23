import React, { useState } from 'react'
import type { DateFilter } from '@/types/crm.types'
import { Calendar, ChevronDown } from 'lucide-react'

interface DateFilterBarProps {
  filter: DateFilter
  onChange: (filter: DateFilter) => void
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({ filter, onChange }) => {
  const [showCustom, setShowCustom] = useState(filter.type === 'custom')
  const [customStart, setCustomStart] = useState(filter.startDate || '')
  const [customEnd, setCustomEnd] = useState(filter.endDate || '')

  const options: { id: DateFilter['type']; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'custom', label: 'Custom Range' },
  ]

  const handleSelect = (type: DateFilter['type']) => {
    if (type === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      onChange({ type })
    }
  }

  const applyCustom = () => {
    if (customStart && customEnd) {
      onChange({
        type: 'custom',
        startDate: customStart,
        endDate: customEnd,
      })
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <Calendar className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filter.type === opt.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="text-xs h-8 px-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="text-xs h-8 px-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
          />
          <button
            onClick={applyCustom}
            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
