import React, { useState, useEffect } from 'react'
import {
  getReminders,
  completeReminder,
  rescheduleReminder,
  updateReminder,
  deleteReminder,
  createReminder,
} from '@/services/reminders.service'
import { getLeads } from '@/services/leads.service'
import type { Reminder, ReminderPriority, ReminderStatus, Lead } from '@/types/crm.types'
import {
  BellRing,
  Plus,
  Check,
  Calendar,
  Clock,
  AlertCircle,
  RotateCcw,
  Trash2,
  Bell,
  ExternalLink,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getStatusBadge } from '@/components/ui/badge'
import { formatDateSafe, isOverdue } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { Link } from 'react-router-dom'

type ViewType = 'today' | 'overdue' | 'upcoming' | 'completed' | 'all'
const priorities: ReminderPriority[] = ['Low', 'Medium', 'High', 'Urgent']

export const Reminders: React.FC = () => {
  const { success, error } = useToast()
  const { permission, requestPermission, sendNotification } = useNotificationPermission()

  const [activeView, setActiveView] = useState<ViewType>('today')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueTime, setDueTime] = useState('11:00')
  const [priority, setPriority] = useState<ReminderPriority>('Medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reschedule Modal
  const [reschedulingReminder, setReschedulingReminder] = useState<Reminder | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0])
  const [rescheduleTime, setRescheduleTime] = useState('11:00')

  const fetchReminders = async () => {
    try {
      setIsLoading(true)
      const data = await getReminders(activeView)
      setReminders(data)
    } catch (err: any) {
      error('Failed to load reminders', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [activeView])

  const openCreateModal = async () => {
    setEditingReminder(null)
    const res = await getLeads({ pageSize: 200 })
    setAllLeads(res.leads)
    setSelectedLeadId('')
    setTitle('')
    setDescription('')
    setDueDate(new Date().toISOString().split('T')[0])
    setDueTime('11:00')
    setPriority('Medium')
    setIsModalOpen(true)
  }

  const openEditModal = async (r: Reminder) => {
    setEditingReminder(r)
    const res = await getLeads({ pageSize: 200 })
    setAllLeads(res.leads)
    setSelectedLeadId(r.lead_id || '')
    setTitle(r.title)
    setDescription(r.description || '')
    setDueDate(r.due_date)
    setDueTime(r.due_time?.slice(0, 5) || '11:00')
    setPriority(r.priority)
    setIsModalOpen(true)
  }

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)

      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          title,
          description,
          due_date: dueDate,
          due_time: `${dueTime}:00`,
          priority,
          lead_id: selectedLeadId || null,
        })
        success('Reminder Updated', 'Reminder changes saved.')
      } else {
        await createReminder({
          lead_id: selectedLeadId || null,
          title,
          description,
          due_date: dueDate,
          due_time: `${dueTime}:00`,
          priority,
        })
        success('Reminder Created', 'New follow-up reminder scheduled.')

        // Trigger browser notification if allowed
        if (permission === 'granted') {
          sendNotification(`Reminder Scheduled: ${title}`, {
            body: `Due on ${dueDate} at ${dueTime}`,
          })
        }
      }

      setIsModalOpen(false)
      fetchReminders()
    } catch (err: any) {
      error('Failed to save reminder', err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id)
      success('Completed', 'Reminder marked as finished.')
      fetchReminders()
    } catch (err: any) {
      error('Failed to complete', err.message)
    }
  }

  const handleCancelReminder = async (id: string) => {
    try {
      await updateReminder(id, { status: 'Cancelled' })
      success('Cancelled', 'Reminder has been cancelled.')
      fetchReminders()
    } catch (err: any) {
      error('Failed to cancel', err.message)
    }
  }

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reschedulingReminder) return
    try {
      await rescheduleReminder(reschedulingReminder.id, rescheduleDate, `${rescheduleTime}:00`)
      success('Rescheduled', 'Reminder moved to new date/time.')
      setReschedulingReminder(null)
      fetchReminders()
    } catch (err: any) {
      error('Failed to reschedule', err.message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id)
      success('Deleted', 'Reminder deleted permanently.')
      fetchReminders()
    } catch (err: any) {
      error('Failed to delete', err.message)
    }
  }

  const views: { id: ViewType; label: string }[] = [
    { id: 'today', label: "Today's Due" },
    { id: 'overdue', label: 'Overdue' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'all', label: 'All Reminders' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" />
            Follow-up Reminders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep track of pending calls, workshop follow-ups, and enrollment decision deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permission !== 'granted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              className="text-xs text-slate-700"
            >
              <Bell className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Enable Browser Alerts
            </Button>
          )}
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Reminder
          </Button>
        </div>
      </div>

      {/* View Selector Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto no-scrollbar">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeView === v.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          Loading reminders...
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          No reminders in this view.
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((r) => {
            const overdue = isOverdue(r.due_date, r.status)

            return (
              <div
                key={r.id}
                className={`p-4 rounded-xl border transition-all bg-white flex flex-wrap items-center justify-between gap-4 ${
                  overdue
                    ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                    : r.status === 'Completed'
                    ? 'border-slate-200 opacity-60 bg-slate-50/50'
                    : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Left: Info */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-bold text-sm ${
                        r.status === 'Completed'
                          ? 'line-through text-slate-500'
                          : overdue
                          ? 'text-rose-950'
                          : 'text-slate-900'
                      }`}
                    >
                      {r.title}
                    </span>
                    {getStatusBadge('priority', r.priority)}
                    {overdue && (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                    {r.status === 'Completed' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  {r.description && (
                    <p className="text-xs text-slate-600 line-clamp-1">{r.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateSafe(r.due_date)} at {r.due_time?.slice(0, 5)}
                    </span>
                    {r.lead && (
                      <>
                        <span>•</span>
                        <Link
                          to={`/leads/${r.lead.id}`}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          {r.lead.first_name} {r.lead.last_name || ''} ({r.lead.phone})
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status === 'Pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleComplete(r.id)}
                        className="text-xs h-8 px-2.5"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReschedulingReminder(r)
                          setRescheduleDate(r.due_date)
                          setRescheduleTime(r.due_time?.slice(0, 5) || '11:00')
                        }}
                        className="text-xs h-8 px-2"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reschedule
                      </Button>
                    </>
                  )}

                  <button
                    onClick={() => openEditModal(r)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReminder ? 'Edit Reminder' : 'Create Follow-up Reminder'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveReminder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Closing call with candidate"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Candidate (Optional)
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value="">None / General Reminder</option>
              {allLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.first_name} {l.last_name || ''} ({l.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Time</label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                    priority === p
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Notes or agenda for this follow-up..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingReminder ? 'Save Changes' : 'Schedule Reminder'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Reschedule Modal */}
      {reschedulingReminder && (
        <Dialog
          isOpen={Boolean(reschedulingReminder)}
          onClose={() => setReschedulingReminder(null)}
          title="Reschedule Reminder"
          description={`Set a new due date and time for "${reschedulingReminder.title}".`}
          maxWidth="sm"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Date</label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Time</label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setReschedulingReminder(null)}>
                Cancel
              </Button>
              <Button type="submit">Confirm Reschedule</Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
