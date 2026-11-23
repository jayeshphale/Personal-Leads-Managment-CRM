import React, { useState } from 'react'
import type { Lead } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatPhoneNumber } from '@/lib/utils'
import { User, MapPin, GraduationCap, Briefcase, Tag, Image as ImageIcon, ZoomIn, Download, X, Paperclip } from 'lucide-react'
import { getStatusBadge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScreenshotAttachment } from '@/components/common/ScreenshotAttachment'
import { updateLead } from '@/services/leads.service'
import { useToast } from '@/components/ui/toast'

interface PersonalInfoSectionProps {
  lead: Lead
  onEdit: () => void
  onLeadUpdated?: () => void
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ lead, onEdit, onLeadUpdated }) => {
  const { success, error } = useToast()
  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false)
  const [tempNotes, setTempNotes] = useState(lead.notes || '')
  const [tempImages, setTempImages] = useState<string[]>(lead.notes_images || [])
  const [isSaving, setIsSaving] = useState(false)
  const [activePreview, setActivePreview] = useState<string | null>(null)

  const handleOpenEditNotes = () => {
    setTempNotes(lead.notes || '')
    setTempImages(lead.notes_images || [])
    setIsEditNotesOpen(true)
  }

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      await updateLead(
        lead.id,
        {
          notes: tempNotes,
          notes_images: tempImages,
        },
        lead
      )
      success('Notes & Screenshots Updated', 'General notes and attachments have been saved.')
      setIsEditNotesOpen(false)
      if (onLeadUpdated) onLeadUpdated()
    } catch (err: any) {
      error('Failed to update notes', err?.message || 'Error saving notes')
    } finally {
      setIsSaving(false)
    }
  }

  const notesImages = lead.notes_images || []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Personal & Demographic Information
        </CardTitle>
        <button
          onClick={onEdit}
          className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
        >
          Edit Profile
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Full Name</p>
            <p className="font-semibold text-slate-900 mt-0.5">
              {lead.first_name} {lead.last_name || ''}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Age</p>
            <p className="font-semibold text-slate-900 mt-0.5">{lead.age ? `${lead.age} yrs` : 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">City</p>
            <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {lead.city || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Lead Source</p>
            <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              {lead.lead_source}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-slate-100">
          <div>
            <p className="text-slate-400 font-medium">Primary Phone</p>
            <p className="font-mono font-semibold text-slate-900 mt-0.5">
              {formatPhoneNumber(lead.phone)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Active Calling Line</p>
            <p className="font-mono font-semibold text-blue-700 mt-0.5">
              {lead.active_calling_no ? formatPhoneNumber(lead.active_calling_no) : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Alternate Phone</p>
            <p className="font-mono text-slate-700 mt-0.5">
              {lead.alternate_phone ? formatPhoneNumber(lead.alternate_phone) : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Interest Status</p>
            <div className="mt-0.5">{getStatusBadge('interest', lead.interest_status)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100">
          <div>
            <p className="text-slate-400 font-medium">Qualification</p>
            <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              {lead.qualification}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Occupation</p>
            <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              {lead.occupation || 'Not specified'}
            </p>
          </div>
        </div>

        {/* General Notes & Attached Screenshots */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>General Notes</span>
              {notesImages.length > 0 && (
                <span className="text-[11px] font-normal text-blue-600 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                  <ImageIcon className="w-3 h-3" /> {notesImages.length} screenshot{notesImages.length > 1 ? 's' : ''}
                </span>
              )}
            </p>
            <button
              onClick={handleOpenEditNotes}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 px-2 py-0.5 rounded transition-colors"
            >
              <Paperclip className="w-3 h-3" />
              {lead.notes || notesImages.length > 0 ? 'Edit Notes & Screenshots' : '+ Add Note & Screenshot'}
            </button>
          </div>

          {lead.notes ? (
            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
              {lead.notes}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50/50 p-2.5 rounded-lg border border-dashed border-slate-200">
              No general notes recorded yet. Click "+ Add Note & Screenshot" to attach notes or paste screenshots.
            </p>
          )}

          {/* Attached Screenshots Gallery */}
          {notesImages.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                Attached Screenshots ({notesImages.length}):
              </p>
              <div className="flex flex-wrap gap-2.5">
                {notesImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePreview(img)}
                    className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:border-blue-500 hover:shadow-md transition-all bg-slate-100"
                    title="Click to view full screenshot"
                  >
                    <img src={img} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-medium gap-1">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Notes & Screenshots Modal */}
      <Dialog
        isOpen={isEditNotesOpen}
        onClose={() => setIsEditNotesOpen(false)}
        title="Candidate Notes & Screenshots"
        description="Write discussion notes and attach or paste (Ctrl+V) screenshots directly."
        maxWidth="md"
      >
        <form onSubmit={handleSaveNotes} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Notes
            </label>
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              rows={3}
              placeholder="Discussion summary, candidate preferences, requirements..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <ScreenshotAttachment
            images={tempImages}
            onChange={setTempImages}
            label="Attached Screenshots"
            helperText="Click to upload, drag & drop, or press Ctrl+V to paste screenshot from clipboard"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditNotesOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Notes & Screenshots
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
                <ImageIcon className="w-4 h-4 text-blue-400" /> Attached Screenshot
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview}
                  download="candidate_screenshot.jpg"
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
