import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PhoneCall } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

interface CallingActivityData {
  displayDate: string
  connected: number
  attempted: number
}

interface CallingActivityChartProps {
  data: CallingActivityData[]
  isLoading?: boolean
}

export const CallingActivityChart: React.FC<CallingActivityChartProps> = ({ data, isLoading }) => {
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-600" />
          Daily Calling Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            Loading calling metrics...
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            No calling activity logged in this period
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="attempted" name="Calls Attempted" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="connected" name="Connected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
