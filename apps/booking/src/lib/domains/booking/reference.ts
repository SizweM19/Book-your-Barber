/**
 * Booking Reference Model & Generator.
 * 
 * Format: BYB-YYYYMMDD-XXXXX
 * 
 * Invariants:
 * - Stored separately from internal appointment UUID.
 * - Human-readable and uppercase.
 * - Searchable and collision-resistant.
 * - Used for Customer Lookup, Support, Payments, Refunds, Rescheduling, and Notifications.
 */

export const BOOKING_REF_PREFIX = 'BYB'

const BOOKING_REF_REGEX = /^BYB-\d{8}-\d{5}$/

let dailySequence = Math.floor(Date.now() / 1000 + Math.random() * 50000) % 80000
let lastDateSegment = ''

/**
 * Generates a unique, human-readable booking reference code.
 * Example output: "BYB-20260910-00001"
 */
export function generateBookingReference(date: Date = new Date(), sequence?: number): string {
  const yyyy = date.getFullYear().toString()
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  const dateSegment = `${yyyy}${mm}${dd}`

  let seqStr = ''
  if (typeof sequence === 'number' && sequence > 0) {
    seqStr = (sequence % 100000).toString().padStart(5, '0')
  } else {
    if (lastDateSegment !== dateSegment) {
      lastDateSegment = dateSegment
    }
    dailySequence = (dailySequence + 1) % 100000
    if (dailySequence === 0) dailySequence = 1
    seqStr = dailySequence.toString().padStart(5, '0')
  }

  return `${BOOKING_REF_PREFIX}-${dateSegment}-${seqStr}`
}

/**
 * Validates whether a given string matches the canonical booking reference format.
 */
export function isValidBookingReference(reference: string): boolean {
  if (!reference || typeof reference !== 'string') return false
  return BOOKING_REF_REGEX.test(reference.trim().toUpperCase())
}

/**
 * Formats user input into canonical uppercase booking reference.
 */
export function formatBookingReference(input: string): string {
  return input.trim().toUpperCase()
}

/**
 * Parses booking reference into its constituent date and sequence number.
 */
export function parseBookingReference(reference: string): {
  date: string
  sequence: string
  isValid: boolean
} {
  const clean = formatBookingReference(reference)
  if (!isValidBookingReference(clean)) {
    return { date: '', sequence: '', isValid: false }
  }

  const parts = clean.split('-')
  return {
    date: parts[1],
    sequence: parts[2],
    isValid: true,
  }
}