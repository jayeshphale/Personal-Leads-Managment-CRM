import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Reminder, ReminderPriority } from '@/types/crm.types'
import { format } from 'date-fns'
import { logActivity } from './activities.service'
import { initialMockReminders } from '@/lib/mockData'

function getLocalReminders(): Reminder[] {
  const stored = localStorage.getItem('mock_reminders')
  if (!stored) {
    localStorage.setItem('mock_reminders', JSON.stringify(initialMockReminders))
    return initialMockReminders
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialMockReminders
  }
}

function saveLocalReminders(rems: Reminder[]) {
  localStorage.setItem('mock_reminders', JSON.stringify(rems))
}

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

  if (!isSupabaseConfigured) {
    let list = getLocalReminders()
    if (filter === 'completed') {
      list = list.filter((r) => r.status === 'Completed')
    } else if (filter === 'today') {
      list = list.filter((r) => r.status === 'Pending' && r.due_date === todayStr)
    } else if (filter === 'overdue') {
      list = list.filter((r) => r.status === 'Pending' && r.due_date < todayStr)
    } else if (filter === 'upcoming') {
      list = list.filter((r) => r.status === 'Pending' && r.due_date > todayStr)
    }
    return list
  }

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
  if (!isSupabaseConfigured) {
    const rems = getLocalReminders()
    const newRem: Reminder = {
      id: `rem-${Date.now()}`,
      owner_id: 'owner-uuid-1',
      lead_id: params.lead_id || null,
      title: params.title,
      description: params.description || '',
      due_date: params.due_date,
      due_time: params.due_time || '10:00:00',
      priority: params.priority || 'Medium',
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    saveLocalReminders([newRem, ...rems])
    if (params.lead_id) {
      await logActivity({
        lead_id: params.lead_id,
        activity_type: 'Reminder Scheduled',
        new_value: `${newRem.title} (Due: ${newRem.due_date} ${newRem.due_time})`,
      })
    }
    return newRem
  }

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
  if (!isSupabaseConfigured) {
    const rems = getLocalReminders()
    const idx = rems.findIndex((r) => r.id === id)
    if (idx !== -1) {
      rems[idx].status = 'Completed'
      rems[idx].completed_at = new Date().toISOString()
      saveLocalReminders(rems)
      if (rems[idx].lead_id) {
        await logActivity({
          lead_id: rems[idx].lead_id!,
          activity_type: 'Reminder Completed',
          new_value: rems[idx].title,
        })
      }
      return rems[idx]
    }
    throw new Error('Reminder not found')
  }

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
  if (!isSupabaseConfigured) {
    const rems = getLocalReminders()
    const idx = rems.findIndex((r) => r.id === id)
    if (idx !== -1) {
      rems[idx].due_date = newDueDate
      rems[idx].due_time = newDueTime || '10:00:00'
      rems[idx].status = 'Pending'
      saveLocalReminders(rems)
      return rems[idx]
    }
    throw new Error('Reminder not found')
  }

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
  if (!isSupabaseConfigured) {
    const rems = getLocalReminders()
    const idx = rems.findIndex((r) => r.id === id)
    if (idx !== -1) {
      rems[idx] = { ...rems[idx], ...updates }
      saveLocalReminders(rems)
      return rems[idx]
    }
    throw new Error('Reminder not found')
  }

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
  if (!isSupabaseConfigured) {
    const rems = getLocalReminders().filter((r) => r.id !== id)
    saveLocalReminders(rems)
    return true
  }

  const { error } = await supabase.from('reminders').delete().eq('id', id)
  if (error) throw error
  return true
}
