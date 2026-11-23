import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isPast, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes phone numbers: removes non-digits, trims spaces.
 * If 10 digits and starts with 6-9 (standard Indian format), keeps clean format.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  // Strip non-numeric characters except leading '+'
  const cleaned = phone.trim().replace(/[^\d+]/g, '')
  return cleaned
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

export function createWhatsAppLink(phone: string, text?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  // If 10 digits without country code, default to 91
  const fullPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned
  const baseUrl = `https://wa.me/${fullPhone}`
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`
  }
  return baseUrl
}

export function createTelLink(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return `tel:${cleaned}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateSafe(dateStr?: string | null, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateStr) return '-'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, formatStr) : '-'
  } catch {
    return '-'
  }
}

export function formatDateTimeSafe(dateStr?: string | null): string {
  return formatDateSafe(dateStr, 'dd MMM yyyy, hh:mm a')
}

export function isOverdue(dueDateStr?: string | null, status?: string): boolean {
  if (!dueDateStr || status === 'Completed' || status === 'Cancelled') return false
  try {
    const d = parseISO(dueDateStr)
    return isPast(d) && !isToday(d)
  } catch {
    return false
  }
}
