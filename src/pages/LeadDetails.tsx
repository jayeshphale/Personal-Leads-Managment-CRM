import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getLeadById, deleteLead } from '@/services/leads.service'
import { getActivitiesByLeadId } from '@/services/activities.service'
import type { Lead, LeadActivity } from '@/types/crm.types'
import {
  ChevronLeft,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection'
import { CallingSection } from '@/components/profile/CallingSection'
import { WhatsAppSection } from '@/components/profile/WhatsAppSection'
import { WorkshopSection } from '@/components/profile/WorkshopSection'
import { ClosingCallSection } from '@/components/profile/ClosingCallSection'
import { EnrollmentSection } from '@/components/profile/EnrollmentSection'
import { ActivityTimelineSection } from '@/components/profile/ActivityTimelineSection'
import { AddReminderModal } from '@/components/profile/AddReminderModal'
import { LeadModal } from '@/components/leads/LeadModal'
import { DeleteConfirmModal } from '@/components/leads/DeleteConfirmModal'
import { useToast } from '@/components/ui/toast'
import { getStatusBadge } from '@/components/ui/badge'

export const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)

  const loadLeadData = async (silent: boolean = false) => {
    if (!id) return
    try {
      if (!silent) setIsInitialLoading(true)
      const [l, acts] = await Promise.all([getLeadById(id), getActivitiesByLeadId(id)])
      setLead(l)
      setActivities(acts)
    } catch (err: any) {
      error('Failed to load candidate', err.message)
    } finally {
      if (!silent) setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    loadLeadData(false)
  }, [id])

  const handleDelete = async () => {
    if (!lead) return
    try {
      await deleteLead(lead.id)
      success('Candidate Deleted', `${lead.first_name} has been removed.`)
      navigate('/leads')
    } catch (err: any) {
      error('Delete failed', err.message)
    }
  }

  // Full-page spinner only on initial load so status updates don't flicker/refresh the screen
  if (isInitialLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading candidate profile...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center max-w-md mx-auto my-12">
        <h3 className="text-base font-bold text-slate-800">Candidate Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested lead profile could not be found or was removed.
        </p>
        <Link to="/leads">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to All Leads
          </Button>
        </Link>
      </div>
    )
  }

  const fullName = `${lead.first_name} ${lead.last_name || ''}`.trim()

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/leads"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Back to Leads"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{fullName}</h1>
              {getStatusBadge('interest', lead.interest_status)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate ID: <span className="font-mono">{lead.id.slice(0, 8)}</span> • Source:{' '}
              <span className="font-medium text-slate-700">{lead.lead_source}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReminderModalOpen(true)}
            className="text-xs"
          >
            <Calendar className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Add Reminder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs"
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Edit Profile
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Column (Action Sections A-F) & Right Column (Timeline G) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Two-Thirds: Core Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Personal Information */}
          <PersonalInfoSection
            lead={lead}
            onEdit={() => setIsEditModalOpen(true)}
            onLeadUpdated={() => loadLeadData(true)}
          />

          {/* Section B: Calling Tracking */}
          <CallingSection lead={lead} onLeadUpdated={() => loadLeadData(true)} />

          {/* Section C: WhatsApp Communication */}
          <WhatsAppSection lead={lead} onLeadUpdated={() => loadLeadData(true)} />

          {/* Section D: Workshop Attendance Tracking */}
          <WorkshopSection lead={lead} onLeadUpdated={() => loadLeadData(true)} />

          {/* Section E: Closing Call Tracking */}
          <ClosingCallSection lead={lead} onLeadUpdated={() => loadLeadData(true)} />

          {/* Section F: Course Enrollment & Billing */}
          <EnrollmentSection lead={lead} onLeadUpdated={() => loadLeadData(true)} />
        </div>

        {/* Right One-Third: Chronological Activity Timeline */}
        <div className="space-y-6">
          <ActivityTimelineSection activities={activities} />
        </div>
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        leadToEdit={lead}
        onSuccess={() => {
          setIsEditModalOpen(false)
          loadLeadData(true)
        }}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`Delete ${fullName}?`}
        onConfirm={handleDelete}
      />

      <AddReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        leadId={lead.id}
        candidateName={fullName}
        onSuccess={() => {
          setIsReminderModalOpen(false)
          loadLeadData(true)
        }}
      />
    </div>
  )
}
