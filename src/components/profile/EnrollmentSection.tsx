import React, { useState, useEffect } from 'react'
import type { Lead, CourseEnrollment, Package, PackageName, PaymentStatus } from '@/types/crm.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Plus, IndianRupee, CreditCard, ShieldCheck } from 'lucide-react'
import { getStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDateSafe } from '@/lib/utils'
import {
  getLeadEnrollments,
  getPackages,
  createEnrollment,
  updateEnrollment,
} from '@/services/enrollments.service'
import { useToast } from '@/components/ui/toast'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface EnrollmentSectionProps {
  lead: Lead
  onLeadUpdated: () => void
}

const packagesList: PackageName[] = ['Standard', 'Prime', 'Infinity', 'Legacy']
const paymentStatuses: PaymentStatus[] = ['Pending', 'Partial', 'Paid', 'Refunded']

export const EnrollmentSection: React.FC<EnrollmentSectionProps> = ({ lead, onLeadUpdated }) => {
  const { success, error } = useToast()
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPackageName, setSelectedPackageName] = useState<PackageName>('Standard')
  const [amount, setAmount] = useState<number>(4999)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid')
  const [enrollmentDate, setEnrollmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [enr, pkgs] = await Promise.all([
        getLeadEnrollments(lead.id),
        getPackages(),
      ])
      setEnrollments(enr)
      setPackages(pkgs)
      if (pkgs.length > 0) {
        const std = pkgs.find((p: Package) => p.name === 'Standard') || pkgs[0]
        setSelectedPackageName(std.name)
        setAmount(Number(std.price))
      }
    } catch (err: any) {
      console.warn('Could not load enrollment records:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [lead.id])

  const handlePackageChange = (pkgName: PackageName) => {
    setSelectedPackageName(pkgName)
    const found = packages.find((p) => p.name === pkgName)
    if (found) {
      setAmount(Number(found.price))
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const pkgObj = packages.find((p) => p.name === selectedPackageName)

      await createEnrollment({
        lead_id: lead.id,
        package_name: selectedPackageName,
        package_id: pkgObj?.id || null,
        enrollment_date: new Date(enrollmentDate).toISOString(),
        amount: Number(amount),
        payment_status: paymentStatus,
        notes: notes || undefined,
      })

      success(
        'Enrollment Recorded',
        `Successfully enrolled candidate into ${selectedPackageName} package.`
      )
      setIsModalOpen(false)
      loadData()
      onLeadUpdated()
    } catch (err: any) {
      error('Enrollment failed', err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentUpdate = async (enrId: string, newStatus: PaymentStatus) => {
    try {
      await updateEnrollment(enrId, { payment_status: newStatus }, lead.id)
      success('Payment Status Updated', `Payment marked as ${newStatus}.`)
      loadData()
    } catch (err: any) {
      error('Failed to update payment status', err.message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          Course Enrollment & Billing
        </CardTitle>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Enroll in Course
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {enrollments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            Candidate has not enrolled into any course package yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {enrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-emerald-50/20 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{enr.package_name} Package</span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {formatCurrency(enr.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enrolled on: {formatDateSafe(enr.enrollment_date)}
                    {enr.notes && <span className="ml-2 font-normal italic">— "{enr.notes}"</span>}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Payment:</span>
                    {getStatusBadge('payment', enr.payment_status)}
                  </div>

                  {/* Payment status dropdown */}
                  <select
                    value={enr.payment_status}
                    onChange={(e) => handlePaymentUpdate(enr.id, e.target.value as PaymentStatus)}
                    className="h-8 text-xs bg-white border border-slate-300 rounded-md px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  >
                    {paymentStatuses.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Enroll Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll Candidate into Course"
        description="Select package tier and specify payment collection details. Historical records are preserved."
        maxWidth="md"
      >
        <form onSubmit={handleEnroll} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Package Tier <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {packagesList.map((pkg) => (
                <button
                  type="button"
                  key={pkg}
                  onClick={() => handlePackageChange(pkg)}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                    selectedPackageName === pkg
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pkg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enrollment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="4999"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Status
              </label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enrollment Date
            </label>
            <Input
              type="date"
              value={enrollmentDate}
              onChange={(e) => setEnrollmentDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enrollment / Invoice Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Paid via UPI, transaction ID #382918"
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
    </Card>
  )
}
