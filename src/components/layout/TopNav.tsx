import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Plus,
  LogOut,
  User,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { getReminders } from '@/services/reminders.service'
import type { Reminder } from '@/types/crm.types'
import { formatDateSafe } from '@/lib/utils'

interface TopNavProps {
  onOpenAddLeadModal: () => void
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenAddLeadModal }) => {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [dueReminders, setDueReminders] = useState<Reminder[]>([])

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load today + overdue reminders for notification bell
    Promise.all([getReminders('today'), getReminders('overdue')])
      .then(([today, overdue]) => {
        setDueReminders([...overdue, ...today])
      })
      .catch((err) => console.warn('Could not load reminder notifications:', err))
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="h-16 border-b border-slate-200/90 bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Global search by candidate name or phone... (Press Enter)"
          className="w-full pl-9 pr-12 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-2xs"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200/70 text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium">
          Enter
        </kbd>
      </form>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        {/* Quick Add Lead Button */}
        <Button size="sm" onClick={onOpenAddLeadModal} className="hidden sm:inline-flex">
          <Plus className="w-4 h-4 mr-1" />
          Add Lead
        </Button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notifications & Due Follow-ups"
          >
            <Bell className="w-5 h-5" />
            {dueReminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Due Follow-ups ({dueReminders.length})
                </h4>
                <button
                  onClick={() => {
                    setShowNotifications(false)
                    navigate('/reminders')
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {dueReminders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No overdue or today reminders!
                  </div>
                ) : (
                  dueReminders.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/reminders')
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">{r.title}</p>
                        <p className="text-[11px] text-slate-500">
                          Due: {formatDateSafe(r.due_date)} at {r.due_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
              {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {profile?.full_name || user?.email?.split('@')[0] || 'Owner'}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {profile?.full_name || 'CRM Owner'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  navigate('/settings')
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Account Settings
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={async () => {
                  setShowProfileMenu(false)
                  await signOut()
                  navigate('/login')
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
