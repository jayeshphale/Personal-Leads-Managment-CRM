import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema, type LeadFormData } from '@/lib/validations/lead.schema'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLead, updateLead } from '@/services/leads.service'
import type { Lead, Qualification, InterestStatus, CallStatus, WhatsAppStatus, ClosingStatus } from '@/types/crm.types'

interface LeadModalProps {
  isOpen: boolean
  onClose: () => void
  leadToEdit?: Lead | null
  onSuccess: () => void
}

const qualifications: Qualification[] = [
  'Undergraduate Student',
  'High School / 12th Pass',
  'Graduate / Postgraduate',
  'Working Professional',
  'Other',
]

const interestStatuses: InterestStatus[] = [
  'New',
  'Interested',
  'High Intent',
  'Follow Up',
  'Not Interested',
  'Converted',
  'Junk',
]

const callStatuses: CallStatus[] = [
  'Not Called',
  'Connected',
  'No Answer',
  'Busy',
  'Invalid Number',
]

const whatsappStatuses: WhatsAppStatus[] = [
  'Not Sent',
  'Sent',
  'Replied',
]

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  leadToEdit,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      alternate_phone: '',
      active_calling_no: '',
      city: '',
      qualification: 'Other',
      occupation: '',
      lead_source: 'Direct',
      notes: '',
      interest_status: 'New',
      call_status: 'Not Called',
      whatsapp_status: 'Not Sent',
      closing_status: 'Not Scheduled',
    },
  })

  useEffect(() => {
    if (leadToEdit) {
      reset({
        first_name: leadToEdit.first_name,
        last_name: leadToEdit.last_name || '',
        phone: leadToEdit.phone,
        alternate_phone: leadToEdit.alternate_phone || '',
        active_calling_no: leadToEdit.active_calling_no || '',
        age: leadToEdit.age ?? null,
        city: leadToEdit.city || '',
        qualification: leadToEdit.qualification || 'Other',
        occupation: leadToEdit.occupation || '',
        lead_source: leadToEdit.lead_source || 'Direct',
        notes: leadToEdit.notes || '',
        interest_status: leadToEdit.interest_status || 'New',
        call_status: leadToEdit.call_status || 'Not Called',
        whatsapp_status: leadToEdit.whatsapp_status || 'Not Sent',
        closing_status: leadToEdit.closing_status || 'Not Scheduled',
        closing_notes: leadToEdit.closing_notes || '',
        next_follow_up_date: leadToEdit.next_follow_up_date || undefined,
      })
    } else {
      reset({
        first_name: '',
        last_name: '',
        phone: '',
        alternate_phone: '',
        active_calling_no: '',
        city: '',
        qualification: 'Other',
        occupation: '',
        lead_source: 'Direct',
        notes: '',
        interest_status: 'New',
        call_status: 'Not Called',
        whatsapp_status: 'Not Sent',
        closing_status: 'Not Scheduled',
      })
    }
  }, [leadToEdit, reset])

  const onSubmit = async (data: LeadFormData) => {
    try {
      if (leadToEdit) {
        await updateLead(leadToEdit.id, data as Partial<Lead>, leadToEdit)
      } else {
        await createLead(data as Partial<Lead>)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Error saving lead:', err)
      alert(err.message || 'Failed to save lead')
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={leadToEdit ? 'Edit Candidate Details' : 'Add New Candidate'}
      description="Enter candidate details. All changes are securely persisted in your Supabase database."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <Input {...register('first_name')} placeholder="e.g. Rahul" error={errors.first_name?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
            <Input {...register('last_name')} placeholder="e.g. Sharma" />
          </div>
        </div>

        {/* Contact Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Phone <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('phone')}
              placeholder="10-digit mobile"
              error={errors.phone?.message}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Calling No
            </label>
            <Input
              {...register('active_calling_no')}
              placeholder="Alternative calling line"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alternate Phone
            </label>
            <Input {...register('alternate_phone')} placeholder="WhatsApp / other" />
          </div>
        </div>

        {/* Demographics & Education */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <Input {...register('city')} placeholder="e.g. Mumbai, Pune" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
            <Input
              type="number"
              {...register('age', { valueAsNumber: true })}
              placeholder="e.g. 23"
              error={errors.age?.message}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
            <Input {...register('lead_source')} placeholder="e.g. Instagram, Referral" />
          </div>
        </div>

        {/* Qualification & Occupation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
            <select
              {...register('qualification')}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              {qualifications.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
            <Input {...register('occupation')} placeholder="e.g. Final Year Student, Software Dev" />
          </div>
        </div>

        {/* Statuses */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Interest Status</label>
            <select
              {...register('interest_status')}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              {interestStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Calling Status</label>
            <select
              {...register('call_status')}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              {callStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Status</label>
            <select
              {...register('whatsapp_status')}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              {whatsappStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Key discussion points, preferences, background notes..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {leadToEdit ? 'Save Changes' : 'Create Candidate'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
