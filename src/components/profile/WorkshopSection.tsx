import React, { useState, useEffect } from 'react'
import type { Lead, Workshop, WorkshopRegistration, AttendanceStatus } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, CheckCircle, XCircle, Clock, Image as ImageIcon, ZoomIn, Download, X } from 'lucide-react'
import { getStatusBadge } from '@/components/ui/badge'
import { formatDateSafe } from '@/lib/utils'
import {
  getLeadWorkshopRegistrations,
  getWorkshops,
  registerCandidateForWorkshop,
  updateAttendanceStatus,
} from '@/services/workshops.service'
import { useToast } from '@/components/ui/toast'
import { Dialog } from '@/components/ui/dialog'
import { ScreenshotAttachment } from '@/components/common/ScreenshotAttachment'

interface WorkshopSectionProps {
  lead: Lead
  onLeadUpdated: () => void
}

export const WorkshopSection: React.FC<WorkshopSectionProps> = ({ lead, onLeadUpdated }) => {
  const { success, error } = useToast()
  const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([])
  const [availableWorkshops, setAvailableWorkshops] = useState<Workshop[]>([])
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('')
  const [regNotes, setRegNotes] = useState('')
  const [regImages, setRegImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activePreview, setActivePreview] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [regs, workshops] = await Promise.all([
        getLeadWorkshopRegistrations(lead.id),
        getWorkshops(),
      ])
      setRegistrations(regs)
      setAvailableWorkshops(workshops)
      if (workshops.length > 0) setSelectedWorkshopId(workshops[0].id)
    } catch (err: any) {
      console.warn('Could not load workshop details:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [lead.id])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkshopId) return
    try {
      setIsLoading(true)
      await registerCandidateForWorkshop(selectedWorkshopId, lead.id, regNotes)
      success('Workshop Registered', 'Candidate has been registered for this workshop.')
      setIsRegisterModalOpen(false)
      setRegNotes('')
      setRegImages([])
      loadData()
      onLeadUpdated()
    } catch (err: any) {
      error('Registration failed', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAttendance = async (regId: string, status: AttendanceStatus) => {
    try {
      await updateAttendanceStatus(regId, lead.id, status)
      success('Attendance Updated', `Attendance marked as ${status}.`)
      loadData()
      onLeadUpdated()
    } catch (err: any) {
      error('Failed to update attendance', err.message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          Workshop Attendance Tracking
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsRegisterModalOpen(true)}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Register for Workshop
        </Button>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">No Workshop Registrations</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
              Register this candidate into an upcoming webinar or live workshop to build high purchase intent.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">
                      {reg.workshop?.title || 'Live Workshop Masterclass'}
                    </span>
                    {getStatusBadge('attendance', reg.attendance_status)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Date:{' '}
                    {reg.workshop?.workshop_date
                      ? formatDateSafe(reg.workshop.workshop_date)
                      : 'Scheduled Session'}
                    {reg.notes && <span className="ml-2 italic text-slate-600">— "{reg.notes}"</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Mark Attendance:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateAttendance(reg.id, 'Attended')}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                        reg.attendance_status === 'Attended'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title="Mark as Attended"
                    >
                      Attended
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateAttendance(reg.id, 'Absent')}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                        reg.attendance_status === 'Absent'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                      }`}
                      title="Mark as Absent"
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateAttendance(reg.id, 'Pending')}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                        reg.attendance_status === 'Pending'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                      }`}
                      title="Reset to Pending"
                    >
                      Pending
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Register Workshop Dialog */}
      <Dialog
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register Candidate for Workshop"
        description="Select an upcoming workshop session and attach RSVP/chat screenshots."
        maxWidth="md"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Workshop Session <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              {availableWorkshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({formatDateSafe(w.workshop_date)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registration Notes
            </label>
            <textarea
              value={regNotes}
              onChange={(e) => setRegNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Requested evening slot link, WhatsApp RSVP confirmed"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <ScreenshotAttachment
            images={regImages}
            onChange={setRegImages}
            label="Registration Confirmation / Chat Screenshots"
            compact
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={!selectedWorkshopId}>
              Confirm Registration
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Lightbox Preview Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white border-b border-slate-700 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400" /> Workshop Screenshot
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview}
                  download="workshop_screenshot.jpg"
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh] bg-slate-950">
              <img
                src={activePreview}
                alt="Enlarged screenshot"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
