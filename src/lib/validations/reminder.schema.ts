import { z } from 'zod'

export const reminderSchema = z.object({
  lead_id: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().default(''),
  due_date: z.string().min(1, 'Due date is required'),
  due_time: z.string().min(1, 'Due time is required').default('10:00:00'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  status: z.enum(['Pending', 'Completed', 'Cancelled']).default('Pending'),
})

export type ReminderFormData = z.infer<typeof reminderSchema>
