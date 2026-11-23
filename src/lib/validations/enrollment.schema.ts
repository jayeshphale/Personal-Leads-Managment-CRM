import { z } from 'zod'

export const workshopSchema = z.object({
  title: z.string().min(1, 'Workshop title is required').trim(),
  description: z.string().default(''),
  workshop_date: z.string().min(1, 'Workshop date is required'),
  location_or_link: z.string().default('Online (Zoom / Meet)'),
  status: z.enum(['Scheduled', 'Ongoing', 'Completed', 'Cancelled']).default('Scheduled'),
})

export type WorkshopFormData = z.infer<typeof workshopSchema>

export const enrollmentSchema = z.object({
  lead_id: z.string().min(1, 'Candidate is required'),
  package_name: z.enum(['Standard', 'Prime', 'Infinity', 'Legacy']),
  package_id: z.string().nullable().optional(),
  enrollment_date: z.string().min(1, 'Enrollment date is required'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  payment_status: z.enum(['Pending', 'Partial', 'Paid', 'Refunded']).default('Pending'),
  notes: z.string().default(''),
})

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>
