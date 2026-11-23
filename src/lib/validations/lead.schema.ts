import { z } from 'zod'

export const leadSchema = z.object({
  first_name: z.string().min(1, 'First name is required').trim(),
  last_name: z.string().optional(),
  phone: z.string().min(7, 'Phone number must be at least 7 digits').trim(),
  alternate_phone: z.string().optional(),
  active_calling_no: z.string().optional(),
  age: z.number().int().min(10).max(100).optional().nullable(),
  city: z.string().optional(),
  qualification: z.enum([
    'Undergraduate Student',
    'High School / 12th Pass',
    'Graduate / Postgraduate',
    'Working Professional',
    'Other'
  ]),
  occupation: z.string().optional(),
  lead_source: z.string().min(1, 'Lead source is required'),
  notes: z.string().optional(),
  interest_status: z.enum([
    'New',
    'Interested',
    'High Intent',
    'Follow Up',
    'Not Interested',
    'Converted',
    'Junk'
  ]),
  call_status: z.enum([
    'Not Called',
    'Connected',
    'No Answer',
    'Busy',
    'Invalid Number'
  ]),
  whatsapp_status: z.enum([
    'Not Sent',
    'Sent',
    'Replied'
  ]),
  closing_status: z.enum([
    'Not Scheduled',
    'Scheduled',
    'Completed',
    'Follow-up Required'
  ]).optional(),
  closing_notes: z.string().optional(),
  next_follow_up_date: z.string().nullable().optional(),
})

export type LeadFormData = z.infer<typeof leadSchema>
