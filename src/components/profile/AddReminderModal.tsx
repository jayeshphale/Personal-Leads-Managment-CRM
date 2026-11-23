import React, { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ReminderPriority } from '@/types/crm.types'
import { createReminder } from '@/services/reminders.service'
import { useToast } from '@/components/ui/toast'

interface AddReminderModalProps {
  isOpen: boolean
  onClose: () => void
  leadId?: string | null
  candidateName?: string
  onSuccess: () => void
}

const priorities: ReminderPriority[] = ['Low', 'Medium', 'High', 'Urgent']

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  leadId,
  candidateName,
  onSuccess,
}) => {
  const { success, error } = useToast()
  const [title, setTitle] = useState(candidateName ? `Follow up with ${candidateName}` : '')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueTime, setDueTime] = useState('11:00')
  const [priority, setPriority] = useState<ReminderPriority>('Medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueDate) return

    try {
      setIsSubmitting(true)
      await createReminder({
        lead_id: leadId || null,
        title,
        description,
        due_date: dueDate,
        due_time: `${dueTime}:00`,
        priority,
      })

      success('Reminder Set', 'Follow-up reminder has been scheduled.')
      onSuccess()
      onClose()
    } catch (err: any) {
      error('Failed to create reminder', err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Follow-up Reminder"
      description="Create a reminder to ensure no candidate slips through the cracks."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reminder Title <span className="text-rose-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Discuss course financing with Rahul"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Time
            </label>
            <Input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Priority Level
          </label>
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description / Context Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Additional context or agenda for this follow-up..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Schedule Reminder
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
