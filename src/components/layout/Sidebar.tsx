import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  MessageSquare,
  Calendar,
  GraduationCap,
  BellRing,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isCollapsed: boolean
  toggleCollapsed: () => void
  pendingRemindersCount?: number
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'All Leads', icon: Users },
  { to: '/calling', label: 'Calling Tracker', icon: PhoneCall },
  { to: '/whatsapp', label: 'WhatsApp Tracker', icon: MessageSquare },
  { to: '/workshops', label: 'Workshop Tracker', icon: Calendar },
  { to: '/enrollments', label: 'Course Enrollments', icon: GraduationCap },
  { to: '/reminders', label: 'Follow-up Reminders', icon: BellRing, hasBadge: true },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  toggleCollapsed,
  pendingRemindersCount = 0,
}) => {
  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200/90 bg-white transition-all duration-300 z-30 select-none shrink-0',
        isCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-sm">LeadFlow CRM</span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Owner Portal</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleCollapsed}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-colors text-slate-500 group-hover:text-slate-900 group-[.font-semibold]:text-blue-600" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.hasBadge && pendingRemindersCount > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-800 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingRemindersCount}
                </span>
              )}
              {isCollapsed && item.hasBadge && pendingRemindersCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Footer / Status */}
      <div className="p-3 border-t border-slate-100">
        <div className={cn('flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/60', isCollapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">CRM Owner</span>
              <span className="text-[10px] text-emerald-600 font-medium">Single-User Secure</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
