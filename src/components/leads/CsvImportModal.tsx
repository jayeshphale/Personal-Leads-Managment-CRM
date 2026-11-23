import React, { useState, useRef } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import {
  parseCsvFile,
  validateAndCheckDuplicates,
  batchInsertLeads,
  type ValidatedImportLead
} from '@/services/import.service'

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'upload' | 'preview' | 'importing' | 'summary'

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [validatedLeads, setValidatedLeads] = useState<ValidatedImportLead[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [progress, setProgress] = useState<{ inserted: number; total: number }>({
    inserted: 0,
    total: 0,
  })
  const [summary, setSummary] = useState<{ total: number; inserted: number; skipped: number; invalid: number }>({
    total: 0,
    inserted: 0,
    skipped: 0,
    invalid: 0,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsProcessing(true)
      setFileName(file.name)
      const rawRows = await parseCsvFile(file)
      const validated = await validateAndCheckDuplicates(rawRows, 'CSV Import')
      setValidatedLeads(validated)
      setStep('preview')
    } catch (err: any) {
      alert(`CSV parsing error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartImport = async () => {
    try {
      setStep('importing')
      setIsProcessing(true)

      // Filter based on skipDuplicates and validity
      const leadsToInsert = validatedLeads.filter((l) => {
        if (!l.isValid) return false
        if (l.isDuplicate && skipDuplicates) return false
        return true
      })

      const insertedCount = await batchInsertLeads(leadsToInsert, (inserted, total) => {
        setProgress({ inserted, total })
      })

      const duplicatesCount = validatedLeads.filter((l) => l.isDuplicate).length
      const invalidCount = validatedLeads.filter((l) => !l.isValid).length

      setSummary({
        total: validatedLeads.length,
        inserted: insertedCount,
        skipped: skipDuplicates ? duplicatesCount : 0,
        invalid: invalidCount,
      })

      setStep('summary')
    } catch (err: any) {
      alert(`Import error: ${err.message}`)
      setStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFinish = () => {
    onSuccess()
    onClose()
  }

  const duplicatesCount = validatedLeads.filter((l) => l.isDuplicate).length
  const invalidCount = validatedLeads.filter((l) => !l.isValid).length
  const validCount = validatedLeads.filter((l) => l.isValid && (!l.isDuplicate || !skipDuplicates)).length

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import Candidates from CSV"
      description="Upload a CSV file containing candidates with First Name, Phone, Qualification, Age, City, and Active Calling No."
      maxWidth="4xl"
    >
      {/* STEP 1: UPLOAD */}
      {step === 'upload' && (
        <div className="space-y-6 py-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop your CSV file
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported columns: First Name, Last Name, Phone, Qualification, Age, City, Active Calling No
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-800">CSV Formatting Notes:</p>
            <p>• Mandatory fields: First Name and Phone.</p>
            <p>• Active Calling No is stored independently from the WhatsApp/Primary Phone.</p>
            <p>• Phone numbers are automatically normalized and checked for duplicates.</p>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & VALIDATION */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Validation Metrics Banner */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">Total Rows</p>
              <p className="text-base font-bold text-slate-800">{validatedLeads.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-700">Ready to Import</p>
              <p className="text-base font-bold text-emerald-800">{validCount}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-700">Duplicates Detected</p>
              <p className="text-base font-bold text-amber-800">{duplicatesCount}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
              <p className="text-xs text-rose-700">Invalid Rows</p>
              <p className="text-base font-bold text-rose-800">{invalidCount}</p>
            </div>
          </div>

          {/* Duplicate Handling Option */}
          {duplicatesCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {duplicatesCount} candidate(s) already exist with the same phone number.
                </span>
              </div>
              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded border-amber-300 text-blue-600 focus:ring-blue-500"
                />
                Skip duplicates safely (recommended)
              </label>
            </div>
          )}

          {/* Table Preview */}
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                <tr>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Phone</th>
                  <th className="p-2.5">Active Calling No</th>
                  <th className="p-2.5">Qualification</th>
                  <th className="p-2.5">City</th>
                  <th className="p-2.5">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validatedLeads.slice(0, 100).map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      !item.isValid
                        ? 'bg-rose-50/50'
                        : item.isDuplicate
                        ? 'bg-amber-50/40'
                        : 'hover:bg-slate-50'
                    }
                  >
                    <td className="p-2.5">
                      {!item.isValid ? (
                        <span className="text-rose-600 flex items-center gap-1 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Invalid
                        </span>
                      ) : item.isDuplicate ? (
                        <span className="text-amber-600 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Duplicate
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-medium text-slate-900">
                      {item.first_name} {item.last_name}
                    </td>
                    <td className="p-2.5 font-mono text-slate-700">{item.phone}</td>
                    <td className="p-2.5 font-mono text-slate-600">{item.active_calling_no || '-'}</td>
                    <td className="p-2.5 text-slate-600">{item.qualification}</td>
                    <td className="p-2.5 text-slate-600">{item.city || '-'}</td>
                    <td className="p-2.5 text-rose-600">
                      {item.errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Choose Different File
            </Button>
            <Button onClick={handleStartImport} disabled={validCount === 0 || isProcessing}>
              Confirm & Import {validCount} Leads
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: IMPORTING PROGRESS */}
      {step === 'importing' && (
        <div className="py-12 text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <h3 className="text-base font-semibold text-slate-900">Importing Candidates...</h3>
          <p className="text-xs text-slate-500">
            Inserting batches and logging initial activities in Supabase ({progress.inserted} of{' '}
            {progress.total})
          </p>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-md mx-auto">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${
                  progress.total > 0 ? (progress.inserted / progress.total) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* STEP 4: SUMMARY */}
      {step === 'summary' && (
        <div className="py-6 text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Import Completed Successfully</h3>
            <p className="text-xs text-slate-500 mt-1">
              Candidate records have been validated and inserted into your database.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500">Total in File</p>
              <p className="text-sm font-bold text-slate-800">{summary.total}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-700">Inserted</p>
              <p className="text-sm font-bold text-emerald-800">{summary.inserted}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700">Duplicates Skipped</p>
              <p className="text-sm font-bold text-amber-800">{summary.skipped}</p>
            </div>
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
              <p className="text-xs text-rose-700">Invalid Skipped</p>
              <p className="text-sm font-bold text-rose-800">{summary.invalid}</p>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleFinish} className="px-6">
              View Updated Leads
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
