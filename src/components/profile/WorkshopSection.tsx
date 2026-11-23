import React, { useState, useEffect } from 'react'
import type { Lead, Workshop, WorkshopRegistration, AttendanceStatus } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
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
  const [isLoading, setIsLoading] = useState(false)

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
          Workshop Attendance & Registrations
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsRegisterModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Register for Workshop
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {registrations.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            Candidate is not registered for any workshop yet.
          </div>
        ) : (
          <div className="space-y-2">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    {reg.workshop?.title || 'Workshop'}
                  </h4>
                  <div className="flex items-center gap-3 text-slate-500 mt-1">
                    <span>Date: {formatDateSafe(reg.workshop?.workshop_date)}</span>
                    <span>•</span>
                    <span>Link/Venue: {reg.workshop?.location_or_link || 'Online'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Attendance:</span>
                    {getStatusBadge('attendance', reg.attendance_status)}
                  </div>

                  {/* Attendance Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200">
                    <button
                      onClick={() => handleUpdateAttendance(reg.id, 'Attended')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        reg.attendance_status === 'Attended'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Mark Attended"
                    >
                      Attended
                    </button>
                    <button
                      onClick={() => handleUpdateAttendance(reg.id, 'Absent')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        reg.attendance_status === 'Absent'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Mark Absent"
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => handleUpdateAttendance(reg.id, 'Pending')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        reg.attendance_status === 'Pending'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
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
        description="Select an upcoming workshop session to enrol this candidate."
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
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
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
              placeholder="e.g. Requested evening slot link"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

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
    </Card>
  )
}
