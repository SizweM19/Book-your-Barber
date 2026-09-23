import { describe, it, expect } from 'vitest'
import {
  normalizePhoneNumber,
  isValidMobileNumber,
  isValidEmailAddress,
  validateRecipient,
  calculateBackoffDelaySeconds,
  isTransientError,
  calculateSmsSegments,
  generateNotificationIdempotencyKey,
} from '@/domains/notifications/rules'

describe('Notification Domain Rules', () => {
  describe('Phone Number Normalization & Validation', () => {
    it('normalizes local South African 10-digit format to E.164 (+27...) correctly', () => {
      expect(normalizePhoneNumber('0821234567')).toBe('+27821234567')
      expect(normalizePhoneNumber('071 234 5678')).toBe('+27712345678')
      expect(normalizePhoneNumber('27831234567')).toBe('+27831234567')
      expect(normalizePhoneNumber('+27841234567')).toBe('+27841234567')
    })

    it('validates valid South African mobile numbers', () => {
      expect(isValidMobileNumber('0821234567')).toBe(true)
      expect(isValidMobileNumber('+27712345678')).toBe(true)
      expect(isValidMobileNumber('0601234567')).toBe(true)
    })

    it('rejects invalid mobile numbers', () => {
      expect(isValidMobileNumber('12345')).toBe(false)
      expect(isValidMobileNumber('abcdefghij')).toBe(false)
      expect(isValidMobileNumber('')).toBe(false)
    })
  })

  describe('Email Validation', () => {
    it('validates standard email addresses', () => {
      expect(isValidEmailAddress('test@gmail.com')).toBe(true)
      expect(isValidEmailAddress('barber.shop@domain.co.za')).toBe(true)
    })

    it('rejects invalid email formats', () => {
      expect(isValidEmailAddress('plainaddress')).toBe(false)
      expect(isValidEmailAddress('@missingusername.com')).toBe(false)
      expect(isValidEmailAddress('user@.com')).toBe(false)
    })
  })

  describe('validateRecipient boundary checks', () => {
    it('approves channel "none" without requiring recipient', () => {
      const check = validateRecipient('none', '')
      expect(check.isValid).toBe(true)
    })

    it('validates WhatsApp recipient requiring valid mobile phone', () => {
      const valid = validateRecipient('whatsapp', '082 555 1234')
      expect(valid.isValid).toBe(true)
      expect(valid.normalized).toBe('+27825551234')

      const invalid = validateRecipient('whatsapp', 'not-a-number')
      expect(invalid.isValid).toBe(false)
      expect(invalid.error).toBeDefined()
    })

    it('validates Email recipient requiring valid email address', () => {
      const valid = validateRecipient('email', 'Customer@Example.com')
      expect(valid.isValid).toBe(true)
      expect(valid.normalized).toBe('customer@example.com')

      const invalid = validateRecipient('email', 'bad_email')
      expect(invalid.isValid).toBe(false)
    })
  })

  describe('Exponential Backoff & Error Classification', () => {
    it('calculates backoff delay with jitter within expected bounds', () => {
      const delay1 = calculateBackoffDelaySeconds(1, 60, 0.2) // ~120s
      expect(delay1).toBeGreaterThanOrEqual(96)
      expect(delay1).toBeLessThanOrEqual(144)

      const delay2 = calculateBackoffDelaySeconds(2, 60, 0.2) // ~240s
      expect(delay2).toBeGreaterThanOrEqual(192)
      expect(delay2).toBeLessThanOrEqual(288)
    })

    it('classifies permanent errors correctly as non-transient', () => {
      expect(isTransientError(400, 'Invalid number format')).toBe(false)
      expect(isTransientError(422, 'Unallocated destination')).toBe(false)
      expect(isTransientError(undefined, 'Recipient unsubscribed')).toBe(false)
    })

    it('classifies transient errors as eligible for retry', () => {
      expect(isTransientError(429, 'Too many requests')).toBe(true)
      expect(isTransientError(500, 'Internal server error')).toBe(true)
      expect(isTransientError(503, 'Service unavailable')).toBe(true)
      expect(isTransientError(undefined, 'Gateway timeout')).toBe(true)
    })
  })

  describe('SMS Segments & Idempotency Key', () => {
    it('calculates single-segment SMS under 160 characters', () => {
      const text = 'Booking confirmed at Fade & Edge on 20 Sep at 10:00. Ref: BYB-123. Info: 021 555 0192'
      const segments = calculateSmsSegments(text)
      expect(segments.segments).toBe(1)
      expect(segments.length).toBeLessThanOrEqual(160)
    })

    it('calculates multi-segment SMS over 160 characters', () => {
      const longText = 'A'.repeat(200)
      const segments = calculateSmsSegments(longText)
      expect(segments.segments).toBe(2)
    })

    it('generates deterministic idempotency key', () => {
      const key1 = generateNotificationIdempotencyKey('tenant1', 'appt123', 'booking_confirmed', 'whatsapp')
      const key2 = generateNotificationIdempotencyKey('tenant1', 'appt123', 'booking_confirmed', 'whatsapp')
      expect(key1).toBe(key2)
      expect(key1).toContain('booking_confirmed')
    })
  })
})
