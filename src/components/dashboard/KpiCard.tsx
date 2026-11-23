import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  iconBgColor?: string
  iconColor?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
}) => {
  return (
    <Card className="p-4 hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBgColor, iconColor)}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {subtext && <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </Card>
  )
}
