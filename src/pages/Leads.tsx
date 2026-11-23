import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getLeads,
  deleteLead,
  getAllLeadsForExport,
} from '@/services/leads.service'
import type { Lead } from '@/types/crm.types'
import { Users, Plus, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadFilterBar } from '@/components/leads/LeadFilterBar'
import { LeadTable } from '@/components/leads/LeadTable'
import { BulkActionToolbar } from '@/components/leads/BulkActionToolbar'
import { LeadModal } from '@/components/leads/LeadModal'
import { CsvImportModal } from '@/components/leads/CsvImportModal'
import { DeleteConfirmModal } from '@/components/leads/DeleteConfirmModal'
import { useToast } from '@/components/ui/toast'
import Papa from 'papaparse'

export const Leads: React.FC = () => {
  const { success, error } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filter States initialized from URL params if present
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [qualification, setQualification] = useState(searchParams.get('qualification') || '')
  const [interestStatus, setInterestStatus] = useState(searchParams.get('interestStatus') || '')
  const [callStatus, setCallStatus] = useState(searchParams.get('callStatus') || '')
  const [leadSource, setLeadSource] = useState(searchParams.get('leadSource') || '')
  const [sortBy, setSortBy] = useState<'created_at' | 'first_name' | 'next_follow_up_date'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Data States
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const res = await getLeads({
        search,
        city,
        qualification,
        interestStatus,
        callStatus,
        leadSource,
        sortBy,
        sortOrder,
        page,
        pageSize,
      })
      setLeads(res.leads)
      setTotalCount(res.totalCount)
      setTotalPages(res.totalPages)
    } catch (err: any) {
      error('Failed to load leads', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [search, city, qualification, interestStatus, callStatus, leadSource, sortBy, sortOrder, page])

  const handleResetFilters = () => {
    setSearch('')
    setCity('')
    setQualification('')
    setInterestStatus('')
    setCallStatus('')
    setLeadSource('')
    setPage(1)
    setSearchParams({})
  }

  const hasActiveFilters = Boolean(
    search || city || qualification || interestStatus || callStatus || leadSource
  )

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(leads.map((l) => l.id))
    }
  }

  const handleSort = (column: 'created_at' | 'first_name' | 'next_follow_up_date') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingLead) return
    try {
      await deleteLead(deletingLead.id)
      success('Lead Deleted', `${deletingLead.first_name} has been removed.`)
      setDeletingLead(null)
      fetchLeads()
    } catch (err: any) {
      error('Delete failed', err.message)
    }
  }

  const handleExportFilteredCsv = async () => {
    try {
      const exportData = await getAllLeadsForExport({
        search,
        city,
        qualification,
        interestStatus,
        callStatus,
        leadSource,
      })

      const rows = exportData.map((l) => ({
        'First Name': l.first_name,
        'Last Name': l.last_name,
        Phone: l.phone,
        'Active Calling No': l.active_calling_no || '',
        'Alternate Phone': l.alternate_phone || '',
        Age: l.age || '',
        City: l.city,
        Qualification: l.qualification,
        Occupation: l.occupation || '',
        'Lead Source': l.lead_source,
        'Call Status': l.call_status,
        'WhatsApp Status': l.whatsapp_status,
        'Interest Status': l.interest_status,
        'Next Follow-up': l.next_follow_up_date || '',
        'Created At': l.created_at,
      }))

      const csv = Papa.unparse(rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      success('CSV Exported', `Exported ${exportData.length} records.`)
    } catch (err: any) {
      error('Export failed', err.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            All Candidate Leads ({totalCount})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidates from initial inquiry to final course enrollment.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportFilteredCsv}>
            <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingLead(null)
              setIsAddEditModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <LeadFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        city={city}
        onCityChange={(val) => {
          setCity(val)
          setPage(1)
        }}
        qualification={qualification}
        onQualificationChange={(val) => {
          setQualification(val)
          setPage(1)
        }}
        interestStatus={interestStatus}
        onInterestStatusChange={(val) => {
          setInterestStatus(val)
          setPage(1)
        }}
        callStatus={callStatus}
        onCallStatusChange={(val) => {
          setCallStatus(val)
          setPage(1)
        }}
        leadSource={leadSource}
        onLeadSourceChange={(val) => {
          setLeadSource(val)
          setPage(1)
        }}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onRefresh={() => {
          setSelectedIds([])
          fetchLeads()
        }}
      />

      {/* Table */}
      <LeadTable
        leads={leads}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onEdit={(lead) => {
          setEditingLead(lead)
          setIsAddEditModalOpen(true)
        }}
        onDelete={(lead) => setDeletingLead(lead)}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs text-xs">
          <span className="text-slate-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of{' '}
            <strong>{totalCount}</strong> candidates
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 rounded-md">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      {isAddEditModalOpen && (
        <LeadModal
          isOpen={isAddEditModalOpen}
          leadToEdit={editingLead}
          onClose={() => setIsAddEditModalOpen(false)}
          onSuccess={() => {
            setIsAddEditModalOpen(false)
            fetchLeads()
            success(
              editingLead ? 'Lead Updated' : 'Lead Created',
              `Candidate details have been saved.`
            )
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingLead && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingLead)}
          onClose={() => setDeletingLead(null)}
          onConfirm={handleDeleteConfirm}
          title={`Delete "${deletingLead.first_name} ${deletingLead.last_name || ''}"?`}
          description="Are you sure you want to permanently delete this candidate? This will remove all call logs, activities, and enrollments."
        />
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <CsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            fetchLeads()
          }}
        />
      )}
    </div>
  )
}
