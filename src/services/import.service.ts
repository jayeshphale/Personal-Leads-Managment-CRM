import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { normalizePhoneNumber } from '@/lib/utils'
import type { Qualification } from '@/types/crm.types'
import { logActivity } from './activities.service'

export interface ParsedCsvRow {
  'First Name'?: string
  'Last Name'?: string
  'Phone'?: string
  'Active Calling No'?: string
  'Qualification'?: string
  'Age'?: string | number
  'City'?: string
  [key: string]: any
}

export interface ValidatedImportLead {
  first_name: string
  last_name: string
  phone: string
  alternate_phone?: string
  active_calling_no?: string
  age?: number | null
  city: string
  qualification: Qualification
  lead_source: string
  isDuplicate: boolean
  isValid: boolean
  errors: string[]
  rawRow: ParsedCsvRow
}

const VALID_QUALIFICATIONS: Qualification[] = [
  'Undergraduate Student',
  'High School / 12th Pass',
  'Graduate / Postgraduate',
  'Working Professional',
  'Other',
]

export function mapQualification(raw?: string): Qualification {
  if (!raw) return 'Other'
  const trimmed = raw.trim()
  const matched = VALID_QUALIFICATIONS.find(
    (q) => q.toLowerCase() === trimmed.toLowerCase()
  )
  if (matched) return matched
  if (/student|undergrad/i.test(trimmed)) return 'Undergraduate Student'
  if (/12th|high school/i.test(trimmed)) return 'High School / 12th Pass'
  if (/grad|postgrad|b\.tech|m\.tech|bca|mca/i.test(trimmed)) return 'Graduate / Postgraduate'
  if (/working|employed|professional|job/i.test(trimmed)) return 'Working Professional'
  return 'Other'
}

export async function parseCsvFile(file: File): Promise<ParsedCsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<ParsedCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        resolve(results.data)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export async function validateAndCheckDuplicates(
  rows: ParsedCsvRow[],
  defaultSource: string = 'CSV Import'
): Promise<ValidatedImportLead[]> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  // Fetch all existing phone numbers for this owner to perform high-speed in-memory duplicate check
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('phone')
  
  const existingPhoneSet = new Set<string>()
  if (existingLeads) {
    existingLeads.forEach((l) => {
      existingPhoneSet.add(normalizePhoneNumber(l.phone))
    })
  }

  const seenInCurrentCsv = new Set<string>()

  return rows.map((row) => {
    const errors: string[] = []

    const firstName = (row['First Name'] || row['first_name'] || row['Name'] || '').trim()
    const lastName = (row['Last Name'] || row['last_name'] || '').trim()
    const rawPhone = String(row['Phone'] || row['phone'] || row['Mobile'] || row['Contact'] || '').trim()
    const activeCallingNo = String(
      row['Active Calling No'] || row['active_calling_no'] || row['Calling No'] || ''
    ).trim()
    const rawAge = row['Age'] || row['age']
    const city = (row['City'] || row['city'] || '').trim()
    const rawQual = row['Qualification'] || row['qualification']

    const normalizedPhone = normalizePhoneNumber(rawPhone)
    const normalizedActiveNo = normalizePhoneNumber(activeCallingNo)

    if (!firstName) {
      errors.push('First Name is required')
    }
    if (!normalizedPhone || normalizedPhone.length < 7) {
      errors.push('Valid Phone is required (min 7 digits)')
    }

    let age: number | null = null
    if (rawAge !== undefined && rawAge !== '') {
      const parsedAge = parseInt(String(rawAge), 10)
      if (!isNaN(parsedAge) && parsedAge >= 10 && parsedAge <= 100) {
        age = parsedAge
      }
    }

    const isDuplicate = existingPhoneSet.has(normalizedPhone) || seenInCurrentCsv.has(normalizedPhone)
    if (normalizedPhone) {
      seenInCurrentCsv.add(normalizedPhone)
    }

    return {
      first_name: firstName,
      last_name: lastName,
      phone: normalizedPhone,
      active_calling_no: normalizedActiveNo || '',
      age,
      city,
      qualification: mapQualification(rawQual),
      lead_source: defaultSource,
      isDuplicate,
      isValid: errors.length === 0,
      errors,
      rawRow: row,
    }
  })
}

export async function batchInsertLeads(
  leadsToInsert: ValidatedImportLead[],
  onProgress?: (inserted: number, total: number) => void
) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const batchSize = 50
  let totalInserted = 0

  for (let i = 0; i < leadsToInsert.length; i += batchSize) {
    const chunk = leadsToInsert.slice(i, i + batchSize).map((item) => ({
      owner_id: user.id,
      first_name: item.first_name,
      last_name: item.last_name,
      phone: item.phone,
      active_calling_no: item.active_calling_no || null,
      age: item.age,
      city: item.city,
      qualification: item.qualification,
      lead_source: item.lead_source,
      interest_status: 'New',
      call_status: 'Not Called',
      whatsapp_status: 'Not Sent',
      closing_status: 'Not Scheduled',
    }))

    const { data, error } = await supabase
      .from('leads')
      .insert(chunk)
      .select('id, first_name, last_name')

    if (error) {
      console.error('Batch insert error:', error)
      throw error
    }

    totalInserted += (data || []).length
    if (onProgress) {
      onProgress(totalInserted, leadsToInsert.length)
    }

    // Log activity for each inserted lead
    if (data) {
      for (const lead of data) {
        await logActivity({
          lead_id: lead.id,
          activity_type: 'Lead Created',
          new_value: `${lead.first_name} ${lead.last_name || ''}`.trim(),
          notes: 'Imported via CSV',
        })
      }
    }
  }

  return totalInserted
}
