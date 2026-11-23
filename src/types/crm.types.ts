export type Qualification =
  | 'Undergraduate Student'
  | 'High School / 12th Pass'
  | 'Graduate / Postgraduate'
  | 'Working Professional'
  | 'Other'

export type InterestStatus =
  | 'New'
  | 'Interested'
  | 'High Intent'
  | 'Follow Up'
  | 'Not Interested'
  | 'Converted'
  | 'Junk'

export type CallStatus =
  | 'Not Called'
  | 'Connected'
  | 'No Answer'
  | 'Busy'
  | 'Invalid Number'

export type WhatsAppStatus =
  | 'Not Sent'
  | 'Sent'
  | 'Replied'

export type ClosingStatus =
  | 'Not Scheduled'
  | 'Scheduled'
  | 'Completed'
  | 'Follow-up Required'

export type PackageName =
  | 'Standard'
  | 'Prime'
  | 'Infinity'
  | 'Legacy'

export type PaymentStatus =
  | 'Pending'
  | 'Partial'
  | 'Paid'
  | 'Refunded'

export type AttendanceStatus =
  | 'Pending'
  | 'Attended'
  | 'Absent'

export type ReminderPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Urgent'

export type ReminderStatus =
  | 'Pending'
  | 'Completed'
  | 'Cancelled'

export type FunnelStage =
  | 'New Lead'
  | 'Call Done'
  | 'Video Sent'
  | '15m Follow-up'
  | 'Payment Pending (₹99)'
  | 'Seat Reserved'
  | 'Workshop Attended'
  | 'Course Enrolled'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Package {
  id: string
  owner_id: string
  name: PackageName
  description: string | null
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LeadSource {
  id: string
  owner_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
  owner_id: string
  first_name: string
  last_name: string
  phone: string
  alternate_phone?: string
  active_calling_no?: string
  age?: number | null
  city: string
  qualification: Qualification
  occupation?: string
  lead_source: string
  notes?: string
  notes_images?: string[]
  interest_status: InterestStatus
  call_status: CallStatus
  whatsapp_status: WhatsAppStatus
  closing_status: ClosingStatus
  closing_notes?: string
  closing_notes_images?: string[]
  funnel_stage?: FunnelStage
  is_number_saved?: boolean
  video_sent_at?: string
  payment_99_screenshot?: string
  next_follow_up_date?: string | null
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  owner_id: string
  lead_id: string
  activity_type: string
  old_value?: string | null
  new_value?: string | null
  notes?: string | null
  images?: string[]
  created_at: string
}

export interface Reminder {
  id: string
  owner_id: string
  lead_id?: string | null
  title: string
  description?: string
  due_date: string // YYYY-MM-DD
  due_time: string // HH:mm:ss
  priority: ReminderPriority
  status: ReminderStatus
  completed_at?: string | null
  created_at: string
  updated_at: string
  lead?: {
    id: string
    first_name: string
    last_name: string
    phone: string
    city: string
  }
}

export interface Workshop {
  id: string
  owner_id: string
  title: string
  description?: string
  workshop_date: string
  location_or_link: string
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'
  created_at: string
  updated_at: string
  registrations_count?: number
  attended_count?: number
}

export interface WorkshopRegistration {
  id: string
  owner_id: string
  workshop_id: string
  lead_id: string
  attendance_status: AttendanceStatus
  attendance_date?: string | null
  notes?: string
  receipt_images?: string[]
  registered_at: string
  workshop?: Workshop
  lead?: Lead
}

export interface CourseEnrollment {
  id: string
  owner_id: string
  lead_id: string
  package_id?: string | null
  package_name: PackageName
  enrollment_date: string
  amount: number
  payment_status: PaymentStatus
  notes?: string
  receipt_images?: string[]
  created_at: string
  updated_at: string
  lead?: Lead
}

export interface DashboardMetrics {
  totalLeads: number
  newLeads: number
  interestedLeads: number
  callsConnected: number
  whatsappReplied: number
  workshopEnrolled: number
  workshopAttended: number
  closingCallsCompleted: number
  totalEnrollments: number
  totalRevenue: number
}

export interface DateFilter {
  type: 'today' | '7days' | '30days' | 'this_month' | 'custom'
  startDate?: string
  endDate?: string
}
