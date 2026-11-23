import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'blue'
    | 'green'
    | 'yellow'
    | 'red'
    | 'purple'
    | 'orange'
    | 'slate'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function getStatusBadge(type: 'call' | 'whatsapp' | 'interest' | 'attendance' | 'payment' | 'priority' | 'funnel', value: string) {
  switch (type) {
    case 'funnel':
      if (value === 'Course Enrolled') return <Badge variant="green">🎓 Course Enrolled</Badge>
      if (value === 'Workshop Attended') return <Badge variant="purple">🎟️ Workshop Attended</Badge>
      if (value === 'Seat Reserved') return <Badge variant="green">✅ Seat Reserved</Badge>
      if (value === 'Payment Pending (₹99)') return <Badge variant="yellow">💳 ₹99 Pending</Badge>
      if (value === '15m Follow-up') return <Badge variant="orange">⏱️ 15m Follow-up</Badge>
      if (value === 'Video Sent') return <Badge variant="blue">🎥 Video Sent</Badge>
      if (value === 'Call Done') return <Badge variant="blue">📞 Call Done</Badge>
      return <Badge variant="slate">🆕 New Lead</Badge>

    case 'call':
      if (value === 'Connected') return <Badge variant="green">{value}</Badge>
      if (value === 'No Answer') return <Badge variant="yellow">{value}</Badge>
      if (value === 'Busy') return <Badge variant="orange">{value}</Badge>
      if (value === 'Invalid Number') return <Badge variant="red">{value}</Badge>
      return <Badge variant="slate">{value}</Badge>

    case 'whatsapp':
      if (value === 'Replied') return <Badge variant="green">{value}</Badge>
      if (value === 'Sent') return <Badge variant="blue">{value}</Badge>
      return <Badge variant="slate">{value}</Badge>

    case 'interest':
      if (value === 'Converted') return <Badge variant="green">Converted</Badge>
      if (value === 'High Intent') return <Badge variant="purple">High Intent</Badge>
      if (value === 'Interested') return <Badge variant="blue">Interested</Badge>
      if (value === 'Follow Up') return <Badge variant="yellow">Follow Up</Badge>
      if (value === 'Not Interested') return <Badge variant="red">Not Interested</Badge>
      if (value === 'Junk') return <Badge variant="slate">Junk</Badge>
      return <Badge variant="default">{value}</Badge>

    case 'attendance':
      if (value === 'Attended') return <Badge variant="green">Attended</Badge>
      if (value === 'Absent') return <Badge variant="red">Absent</Badge>
      return <Badge variant="yellow">Pending</Badge>

    case 'payment':
      if (value === 'Paid') return <Badge variant="green">Paid</Badge>
      if (value === 'Partial') return <Badge variant="yellow">Partial</Badge>
      if (value === 'Refunded') return <Badge variant="red">Refunded</Badge>
      return <Badge variant="slate">Pending</Badge>

    case 'priority':
      if (value === 'Urgent') return <Badge variant="red">Urgent</Badge>
      if (value === 'High') return <Badge variant="orange">High</Badge>
      if (value === 'Medium') return <Badge variant="blue">Medium</Badge>
      return <Badge variant="slate">Low</Badge>

    default:
      return <Badge>{value}</Badge>
  }
}
