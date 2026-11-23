import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Filter, ArrowDown } from 'lucide-react'

interface FunnelStep {
  name: string
  count: number
  percentage: number
}

interface ConversionFunnelProps {
  steps: FunnelStep[]
  isLoading?: boolean
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ steps, isLoading }) => {
  const colors = [
    'bg-blue-600',
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-purple-600',
    'bg-amber-600',
  ]

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          Lead Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Calculating funnel...</div>
        ) : steps.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No leads in selected period</div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const bg = colors[index % colors.length]
              return (
                <div key={step.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{step.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{step.count}</span>
                      <span className="text-[11px] text-slate-400">({step.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bg} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(step.percentage, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
