import { supabase } from '@/lib/supabase'
import type { Reminder, ReminderPriority, ReminderStatus } from '@/types/crm.types'
import { format } from 'date-fns'
import { logActivity } from './activities.service'

export interface CreateReminderParams {
  lead_id?: string | null
  title: string
  description?: string
  due_date: string
  due_time?: string
  priority?: ReminderPriority
}

export async function getReminders(filter: 'all' | 'today' | 'overdue' | 'upcoming' | 'completed' = 'all') {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  let query = supabase
    .from('reminders')
    .select('*, lead:leads(id, first_name, last_name, phone, city)')
    .order('due_date', { ascending: true })
    .order('due_time', { ascending: true })

  if (filter === 'completed') {
    query = query.eq('status', 'Completed')
  } else if (filter === 'today') {
    query = query.eq('status', 'Pending').eq('due_date', todayStr)
  } else if (filter === 'overdue') {
    query = query.eq('status', 'Pending').lt('due_date', todayStr)
  } else if (filter === 'upcoming') {
    query = query.eq('status', 'Pending').gt('due_date', todayStr)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching reminders:', error)
    throw error
  }

  return (data as Reminder[]) || []
}

export async function createReminder(params: CreateReminderParams) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('User not authenticated')

  const payload = {
    owner_id: user.id,
    lead_id: params.lead_id || null,
    title: params.title,
    description: params.description || '',
    due_date: params.due_date,
    due_time: params.due_time || '10:00:00',
    priority: params.priority || 'Medium',
    status: 'Pending',
  }

  const { data, error } = await supabase
    .from('reminders')
    .insert(payload)
    .select('*, lead:leads(id, first_name, last_name, phone, city)')
    .single()

  if (error) {
    console.error('Error creating reminder:', error)
    throw error
  }

  const created = data as Reminder

  if (params.lead_id) {
    await logActivity({
      lead_id: params.lead_id,
      activity_type: 'Reminder Scheduled',
      new_value: `${created.title} (Due: ${created.due_date} ${created.due_time})`,
    })
  }

  return created
}

export async function completeReminder(id: string) {
  const { data, error } = await supabase
    .from('reminders')
    .update({
      status: 'Completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, lead:leads(id, first_name, last_name, phone)')
    .single()

  if (error) {
    console.error('Error completing reminder:', error)
    throw error
  }

  const completed = data as Reminder
  if (completed.lead_id) {
    await logActivity({
      lead_id: completed.lead_id,
      activity_type: 'Reminder Completed',
      new_value: completed.title,
    })
  }

  return completed
}

export async function rescheduleReminder(id: string, newDueDate: string, newDueTime?: string) {
  const { data, error } = await supabase
    .from('reminders')
    .update({
      due_date: newDueDate,
      due_time: newDueTime || '10:00:00',
      status: 'Pending',
      completed_at: null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Reminder
}

export async function updateReminder(id: string, updates: Partial<Reminder>) {
  const { data, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Reminder
}

export async function deleteReminder(id: string) {
  const { error } = await supabase.from('reminders').delete().eq('id', id)
  if (error) throw error
  return true
}
