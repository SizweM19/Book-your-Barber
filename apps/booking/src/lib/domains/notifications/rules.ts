/**
 * Notification Business Rules & Utility Invariants.
 * 
 * Invariants:
 * - South African mobile phone numbers normalize to E.164 (+27...).
 * - SMS messages track GSM-7 segment boundaries (160 characters for single segment).
 * - Jittered exponential backoff prevents thundering herds on provider recovery.
 * - Permanent errors fail fast without retry waste.
 */

import type { NotificationChannel } from './types'

export const MAX_NOTIFICATION_RETRIES = 3
export const BASE_BACKOFF_SECONDS = 60
export const MAX_SMS_SINGLE_SEGMENT_LENGTH = 160

/**
 * Normalizes South African phone numbers to standard E.164 format (+27...).
 * Supports inputs like '0821234567', '+27821234567', '27821234567', '082 123 4567'.
 */
export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  if (!digits) return ''

  // Format 082XXXXXXX -> +2782XXXXXXX
  if (digits.startsWith('0') && digits.length === 10) {
    return `+27${digits.slice(1)}`
  }

  // Format 2782XXXXXXX -> +2782XXXXXXX
  if (digits.startsWith('27') && digits.length === 11) {
    return `+${digits}`
  }

  // If already full international length without plus
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`
  }

  return raw.trim()
}

/**
 * Validates whether a phone number matches South African mobile number patterns.
 */
export function isValidMobileNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  // E.164 pattern for SA: +27 followed by 6, 7, or 8 and 8 digits
  const saMobileRegex = /^\+27[678]\d{8}$/
  // Generic international fallback (E.164: 10-15 digits total)
  const genericE164 = /^\+[1-9]\d{9,14}$/
  return saMobileRegex.test(normalized) || genericE164.test(normalized)
}

/**
 * Validates email address format.
 */
export function isValidEmailAddress(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}

/**
 * Validates recipient contact information for the chosen communication channel.
 */
export function validateRecipient(
  channel: NotificationChannel,
  recipient: string
): { isValid: boolean; normalized: string; error?: string } {
  if (channel === 'none') {
    return { isValid: true, normalized: '' }
  }

  const clean = recipient.trim()
  if (!clean) {
    return { isValid: false, normalized: '', error: 'Recipient address cannot be empty.' }
  }

  if (channel === 'whatsapp' || channel === 'sms') {
    if (!isValidMobileNumber(clean)) {
      return {
        isValid: false,
        normalized: clean,
        error: `Invalid mobile phone number format for ${channel.toUpperCase()}: ${clean}`,
      }
    }
    return { isValid: true, normalized: normalizePhoneNumber(clean) }
  }

  if (channel === 'email') {
    if (!isValidEmailAddress(clean)) {
      return {
        isValid: false,
        normalized: clean,
        error: `Invalid email address format: ${clean}`,
      }
    }
    return { isValid: true, normalized: clean.toLowerCase() }
  }

  return { isValid: false, normalized: clean, error: `Unsupported notification channel: ${channel}` }
}

/**
 * Calculates exponential backoff with deterministic jitter for retrying failed notifications.
 * attempt 1: ~120s (2m), attempt 2: ~240s (4m), attempt 3: ~480s (8m).
 */
export function calculateBackoffDelaySeconds(
  retryCount: number,
  baseSeconds = BASE_BACKOFF_SECONDS,
  jitterPercent = 0.2
): number {
  const exponential = Math.pow(2, Math.max(1, retryCount)) * baseSeconds
  const jitterRange = exponential * jitterPercent
  // Consistent pseudo-jitter using retry count
  const jitter = (retryCount % 2 === 0 ? 1 : -1) * (jitterRange / 2)
  return Math.round(exponential + jitter)
}

/**
 * Determines whether an error is transient (eligible for retry) or permanent (fail-fast).
 */
export function isTransientError(statusCode?: number, errorMessage = ''): boolean {
  const lowerMsg = errorMessage.toLowerCase()

  // Permanent failure keywords
  if (
    lowerMsg.includes('invalid number') ||
    lowerMsg.includes('unallocated') ||
    lowerMsg.includes('unregistered') ||
    lowerMsg.includes('invalid email') ||
    lowerMsg.includes('blacklisted') ||
    lowerMsg.includes('unsubscribed') ||
    lowerMsg.includes('missing recipient') ||
    statusCode === 400 ||
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 404 ||
    statusCode === 422
  ) {
    return false
  }

  // Transient failure indicators (rate limit or gateway error)
  if (
    statusCode === 429 ||
    (statusCode !== undefined && statusCode >= 500 && statusCode < 600) ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('network') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('gateway')
  ) {
    return true
  }

  // Default to transient if uncertain to allow at least one retry attempt
  return true
}

/**
 * Calculates SMS segment count based on standard GSM-7 message lengths.
 */
export function calculateSmsSegments(text: string): { length: number; segments: number } {
  const length = text.length
  if (length === 0) return { length: 0, segments: 0 }
  if (length <= 160) return { length, segments: 1 }
  // Concatenated SMS uses 153 chars per segment due to UDH header
  const segments = Math.ceil(length / 153)
  return { length, segments }
}

/**
 * Computes deterministic collision-resistant idempotency key.
 */
export function generateNotificationIdempotencyKey(
  tenantId: string,
  appointmentId: string,
  eventType: string,
  channel: string,
  version = 1
): string {
  return `notif_${tenantId}_${appointmentId}_${eventType}_${channel}_v${version}`
}
