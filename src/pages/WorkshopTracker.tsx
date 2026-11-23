import React, { useState, useEffect } from 'react'
import {
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getWorkshopRegistrations,
  updateAttendanceStatus,
  registerCandidateForWorkshop,
} from '@/services/workshops.service'
import { getLeads } from '@/services/leads.service'
import type { Workshop, WorkshopRegistration, AttendanceStatus, Lead } from '@/types/crm.types'
import { Calendar, Plus, Users, MapPin, Edit, Trash2, Check, X, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getStatusBadge } from '@/components/ui/badge'
import { formatDateSafe, formatDateTimeSafe } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DeleteConfirmModal } from '@/components/leads/DeleteConfirmModal'
import { Link } from 'react-router-dom'

export const WorkshopTracker: React.FC = () => {
  const { success, error } = useToast()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRegs, setIsLoadingRegs] = useState(false)

  // Create / Edit Workshop Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [workshopDate, setWorkshopDate] = useState('')
  const [workshopTime, setWorkshopTime] = useState('18:00')
  const [locationOrLink, setLocationOrLink] = useState('Online (Zoom / Google Meet)')
  const [status, setStatus] = useState<'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'>('Scheduled')

  // Delete Workshop Modal
  const [deletingWorkshop, setDeletingWorkshop] = useState<Workshop | null>(null)

  // Register Candidate Modal
  const [isRegisterCandidateOpen, setIsRegisterCandidateOpen] = useState(false)
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [regNotes, setRegNotes] = useState('')

  const fetchWorkshops = async () => {
    try {
      setIsLoading(true)
      const data = await getWorkshops()
      setWorkshops(data)
      if (data.length > 0 && !selectedWorkshop) {
        setSelectedWorkshop(data[0])
      } else if (selectedWorkshop) {
        const found = data.find((w) => w.id === selectedWorkshop.id)
        if (found) setSelectedWorkshop(found)
      }
    } catch (err: any) {
      error('Failed to load workshops', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRegistrations = async (wId: string) => {
    try {
      setIsLoadingRegs(true)
      const regs = await getWorkshopRegistrations(wId)
      setRegistrations(regs)
    } catch (err: any) {
      error('Failed to load registrations', err.message)
    } finally {
      setIsLoadingRegs(false)
    }
  }

  useEffect(() => {
    fetchWorkshops()
  }, [])

  useEffect(() => {
    if (selectedWorkshop) {
      fetchRegistrations(selectedWorkshop.id)
    }
  }, [selectedWorkshop?.id])

  const openCreateModal = () => {
    setEditingWorkshop(null)
    setTitle('')
    setDescription('')
    setWorkshopDate(new Date().toISOString().split('T')[0])
    setWorkshopTime('18:00')
    setLocationOrLink('Online (Zoom / Google Meet)')
    setStatus('Scheduled')
    setIsModalOpen(true)
  }

  const openEditModal = (w: Workshop) => {
    setEditingWorkshop(w)
    setTitle(w.title)
    setDescription(w.description || '')
    const d = new Date(w.workshop_date)
    setWorkshopDate(d.toISOString().split('T')[0])
    setWorkshopTime(d.toTimeString().slice(0, 5))
    setLocationOrLink(w.location_or_link)
    setStatus(w.status)
    setIsModalOpen(true)
  }

  const handleSaveWorkshop = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const fullDateTime = new Date(`${workshopDate}T${workshopTime}:00`).toISOString()

      if (editingWorkshop) {
        await updateWorkshop(editingWorkshop.id, {
          title,
          description,
          workshop_date: fullDateTime,
          location_or_link: locationOrLink,
          status,
        })
        success('Workshop Updated', 'Workshop details saved successfully.')
      } else {
        const created = await createWorkshop({
          title,
          description,
          workshop_date: fullDateTime,
          location_or_link: locationOrLink,
          status,
        })
        setSelectedWorkshop(created)
        success('Workshop Created', 'New workshop session scheduled.')
      }

      setIsModalOpen(false)
      fetchWorkshops()
    } catch (err: any) {
      error('Save failed', err.message)
    }
  }

  const handleDeleteWorkshop = async () => {
    if (!deletingWorkshop) return
    try {
      await deleteWorkshop(deletingWorkshop.id)
      success('Workshop Deleted', 'Workshop removed.')
      setDeletingWorkshop(null)
      setSelectedWorkshop(null)
      fetchWorkshops()
    } catch (err: any) {
      error('Delete failed', err.message)
    }
  }

  const openRegisterModal = async () => {
    const res = await getLeads({ pageSize: 200 })
    setAllLeads(res.leads)
    if (res.leads.length > 0) setSelectedLeadId(res.leads[0].id)
    setIsRegisterCandidateOpen(true)
  }

  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkshop || !selectedLeadId) return

    try {
      await registerCandidateForWorkshop(selectedWorkshop.id, selectedLeadId, regNotes)
      success('Candidate Registered', 'Candidate added to workshop roster.')
      setIsRegisterCandidateOpen(false)
      setRegNotes('')
      fetchRegistrations(selectedWorkshop.id)
      fetchWorkshops()
    } catch (err: any) {
      error('Registration failed', err.message)
    }
  }

  const handleUpdateAttendance = async (reg: WorkshopRegistration, att: AttendanceStatus) => {
    try {
      await updateAttendanceStatus(reg.id, reg.lead_id, att)
      success('Attendance Updated', `Marked as ${att}.`)
      if (selectedWorkshop) fetchRegistrations(selectedWorkshop.id)
      fetchWorkshops()
    } catch (err: any) {
      error('Update failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Workshop Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize webinars & masterclasses, register candidates, and track live attendance conversion.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Workshop
        </Button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Workshop Sessions List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Workshops ({workshops.length})
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Loading workshops...
            </div>
          ) : workshops.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No workshops created yet. Click "Create Workshop" to begin.
            </div>
          ) : (
            <div className="space-y-2.5">
              {workshops.map((w) => {
                const isSelected = selectedWorkshop?.id === w.id
                const conversion = w.registrations_count
                  ? Math.round(((w.attended_count || 0) / w.registrations_count) * 100)
                  : 0

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkshop(w)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-100 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{w.title}</h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(w)
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingWorkshop(w)
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTimeSafe(w.workshop_date)}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Registered:{' '}
                        <strong className="text-slate-800">{w.registrations_count || 0}</strong>
                      </span>
                      <span className="text-slate-500">
                        Attended:{' '}
                        <strong className="text-emerald-700">{w.attended_count || 0}</strong>{' '}
                        <span className="text-[11px] text-slate-400">({conversion}%)</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Workshop Roster & Attendance */}
        <div className="lg:col-span-2 space-y-4">
          {selectedWorkshop ? (
            <Card>
              <CardHeader className="py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {selectedWorkshop.title}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateTimeSafe(selectedWorkshop.workshop_date)} • {selectedWorkshop.location_or_link}
                  </p>
                </div>
                <Button size="sm" onClick={openRegisterModal}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Register Candidate
                </Button>
              </CardHeader>
              <CardContent>
                {/* Attendance Summary Banner */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-[11px] text-slate-500">Registered</p>
                    <p className="text-lg font-bold text-slate-800">{registrations.length}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                    <p className="text-[11px] text-emerald-700">Attended</p>
                    <p className="text-lg font-bold text-emerald-800">
                      {registrations.filter((r) => r.attendance_status === 'Attended').length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                    <p className="text-[11px] text-purple-700">Conversion Rate</p>
                    <p className="text-lg font-bold text-purple-800">
                      {registrations.length > 0
                        ? `${Math.round(
                            (registrations.filter((r) => r.attendance_status === 'Attended').length /
                              registrations.length) *
                              100
                          )}%`
                        : '0%'}
                    </p>
                  </div>
                </div>

                {/* Candidate Roster Table */}
                {isLoadingRegs ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading registrations...</div>
                ) : registrations.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    No candidates registered for this session yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Candidate</th>
                          <th className="p-3">Mobile Number</th>
                          <th className="p-3">City</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Attendance Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-semibold text-slate-900">
                              <Link
                                to={`/leads/${reg.lead_id}`}
                                className="hover:text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {reg.lead?.first_name} {reg.lead?.last_name || ''}
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                            </td>
                            <td className="p-3 font-mono text-slate-700">{reg.lead?.phone}</td>
                            <td className="p-3 text-slate-600">{reg.lead?.city || '-'}</td>
                            <td className="p-3">{getStatusBadge('attendance', reg.attendance_status)}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleUpdateAttendance(reg, 'Attended')}
                                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                    reg.attendance_status === 'Attended'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                >
                                  Attended
                                </button>
                                <button
                                  onClick={() => handleUpdateAttendance(reg, 'Absent')}
                                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                    reg.attendance_status === 'Absent'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() => handleUpdateAttendance(reg, 'Pending')}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-[11px] font-medium"
                                  title="Reset to Pending"
                                >
                                  Reset
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Select a workshop session on the left to view roster.
            </div>
          )}
        </div>
      </div>

      {/* Workshop Create/Edit Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWorkshop ? 'Edit Workshop Details' : 'Create New Workshop'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveWorkshop} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workshop Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack Career Masterclass"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <Input
                type="date"
                value={workshopDate}
                onChange={(e) => setWorkshopDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
              <Input
                type="time"
                value={workshopTime}
                onChange={(e) => setWorkshopTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Video Link
            </label>
            <Input
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder="e.g. Zoom Link or Room 402"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Agenda, prerequisites, speaker notes..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingWorkshop ? 'Save Changes' : 'Create Workshop'}</Button>
          </div>
        </form>
      </Dialog>

      {/* Register Candidate Modal */}
      <Dialog
        isOpen={isRegisterCandidateOpen}
        onClose={() => setIsRegisterCandidateOpen(false)}
        title="Register Candidate"
        description={`Add a candidate to "${selectedWorkshop?.title}"`}
        maxWidth="md"
      >
        <form onSubmit={handleRegisterCandidate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Candidate <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              {allLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.first_name} {l.last_name || ''} ({l.phone} - {l.city || 'No city'})
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
              placeholder="Candidate interest, reminder requests..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRegisterCandidateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm Registration</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      {deletingWorkshop && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingWorkshop)}
          onClose={() => setDeletingWorkshop(null)}
          onConfirm={handleDeleteWorkshop}
          title={`Delete "${deletingWorkshop.title}"?`}
          description="Are you sure? This will remove the workshop and all candidate registration records."
        />
      )}
    </div>
  )
}
