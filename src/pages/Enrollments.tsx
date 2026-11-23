import React, { useState, useEffect } from 'react'
import { getEnrollments, getPackages, createEnrollment, updateEnrollment, deleteEnrollment } from '@/services/enrollments.service'
import { getLeads } from '@/services/leads.service'
import type { CourseEnrollment, Package, PackageName, PaymentStatus, Lead } from '@/types/crm.types'
import { GraduationCap, Plus, IndianRupee, Trash2, ExternalLink, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDateSafe } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DeleteConfirmModal } from '@/components/leads/DeleteConfirmModal'
import { Link } from 'react-router-dom'

const packageNames: PackageName[] = ['Standard', 'Prime', 'Infinity', 'Legacy']
const paymentStatuses: PaymentStatus[] = ['Pending', 'Partial', 'Paid', 'Refunded']

export const Enrollments: React.FC = () => {
  const { success, error } = useToast()
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [packageFilter, setPackageFilter] = useState<PackageName | 'all'>('all')

  // New Enrollment Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<PackageName>('Standard')
  const [amount, setAmount] = useState<number>(4999)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid')
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Enrollment Modal
  const [deletingEnrollment, setDeletingEnrollment] = useState<CourseEnrollment | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [enr, pkgs] = await Promise.all([getEnrollments(), getPackages()])
      setEnrollments(enr)
      setPackages(pkgs)
    } catch (err: any) {
      error('Failed to load enrollments', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openNewEnrollment = async () => {
    const res = await getLeads({ pageSize: 200 })
    setAllLeads(res.leads)
    if (res.leads.length > 0) setSelectedLeadId(res.leads[0].id)
    setIsModalOpen(true)
  }

  const handlePackageSelect = (pkg: PackageName) => {
    setSelectedPackage(pkg)
    const found = packages.find((p) => p.name === pkg)
    if (found) setAmount(Number(found.price))
  }

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLeadId) return
    try {
      setIsSubmitting(true)
      const pkgObj = packages.find((p) => p.name === selectedPackage)

      await createEnrollment({
        lead_id: selectedLeadId,
        package_name: selectedPackage,
        package_id: pkgObj?.id || null,
        enrollment_date: new Date(enrollmentDate).toISOString(),
        amount: Number(amount),
        payment_status: paymentStatus,
        notes,
      })

      success('Enrollment Saved', 'Candidate enrollment recorded.')
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      error('Enrollment failed', err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePaymentStatus = async (enr: CourseEnrollment, newStatus: PaymentStatus) => {
    try {
      await updateEnrollment(enr.id, { payment_status: newStatus }, enr.lead_id)
      success('Payment Updated', `Status updated to ${newStatus}.`)
      fetchData()
    } catch (err: any) {
      error('Update failed', err.message)
    }
  }

  const handleDeleteEnrollment = async () => {
    if (!deletingEnrollment) return
    try {
      await deleteEnrollment(deletingEnrollment.id)
      success('Enrollment Removed', 'Enrollment record deleted.')
      setDeletingEnrollment(null)
      fetchData()
    } catch (err: any) {
      error('Delete failed', err.message)
    }
  }

  // Calculated Package Statistics from real DB records
  const packageStats = packageNames.map((pkg) => {
    const matching = enrollments.filter((e) => e.package_name === pkg)
    const count = matching.length
    const collected = matching
      .filter((e) => ['Paid', 'Partial'].includes(e.payment_status))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
    return { pkg, count, collected }
  })

  const totalRevenue = enrollments
    .filter((e) => ['Paid', 'Partial'].includes(e.payment_status))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const filteredEnrollments =
    packageFilter === 'all'
      ? enrollments
      : enrollments.filter((e) => e.package_name === packageFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            Course Enrollments & Package Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time enrollment tracking for Standard, Prime, Infinity, and Legacy packages with billing statuses.
          </p>
        </div>
        <Button onClick={openNewEnrollment}>
          <Plus className="w-4 h-4 mr-1.5" />
          Enroll Candidate
        </Button>
      </div>

      {/* Package-Wise KPI Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {packageStats.map((item) => (
          <Card key={item.pkg} className="p-4 bg-white hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {item.pkg}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {formatCurrency(item.collected)}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">{item.count}</p>
              <p className="text-[11px] text-slate-400">Total Enrollments</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setPackageFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              packageFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Packages ({enrollments.length})
          </button>
          {packageNames.map((pkg) => (
            <button
              key={pkg}
              onClick={() => setPackageFilter(pkg)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                packageFilter === pkg
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {pkg} ({enrollments.filter((e) => e.package_name === pkg).length})
            </button>
          ))}
        </div>

        <div className="text-xs font-semibold text-slate-700">
          Total Collected:{' '}
          <span className="font-mono text-emerald-700 font-bold text-sm">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>

      {/* Enrollments Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          Loading enrollments...
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          No enrollments found for this filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Candidate Details</th>
                  <th className="p-3.5">Enrolled Package</th>
                  <th className="p-3.5">Fee Amount</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5">Enrollment Date</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5">
                      <Link
                        to={`/leads/${enr.lead_id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {enr.lead?.first_name} {enr.lead?.last_name || ''}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                      <p className="text-[11px] text-slate-400 font-mono">{enr.lead?.phone}</p>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {enr.package_name}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {formatCurrency(enr.amount)}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {getStatusBadge('payment', enr.payment_status)}
                        <select
                          value={enr.payment_status}
                          onChange={(e) =>
                            handleUpdatePaymentStatus(enr, e.target.value as PaymentStatus)
                          }
                          className="h-7 text-[11px] bg-white border border-slate-200 rounded px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                        >
                          {paymentStatuses.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-500">{formatDateSafe(enr.enrollment_date)}</td>

                    <td className="p-3.5 text-slate-500 max-w-[200px] truncate">
                      {enr.notes || '-'}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setDeletingEnrollment(enr)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete enrollment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Enrollment Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll Candidate in Course"
        description="Select candidate, package tier, and record collection status."
        maxWidth="md"
      >
        <form onSubmit={handleCreateEnrollment} className="space-y-4">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Package Tier <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {packageNames.map((pkg) => (
                <button
                  type="button"
                  key={pkg}
                  onClick={() => handlePackageSelect(pkg)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                    selectedPackage === pkg
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pkg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount (₹)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              >
                {paymentStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Enrollment Date</label>
            <Input
              type="date"
              value={enrollmentDate}
              onChange={(e) => setEnrollmentDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice / Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. UPI Ref #492810"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirm Enrollment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      {deletingEnrollment && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingEnrollment)}
          onClose={() => setDeletingEnrollment(null)}
          onConfirm={handleDeleteEnrollment}
          title="Delete Enrollment Record?"
          description="Are you sure you want to remove this enrollment record?"
        />
      )}
    </div>
  )
}
