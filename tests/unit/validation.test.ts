import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidSAMobile,
  formatSAMobile,
  isValidUUID,
  isValidAmount,
  isValidDate,
  isValidTimeSlot,
  sanitizeInput,
  validateBookingRequest,
} from '@/domains/validation/validators'
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  PaymentError,
  toUserFacingMessage,
} from '@/domains/errors/ApplicationError'

describe('Boundary Validation & Error Translation', () => {
  describe('Input Validators', () => {
    it('validates email addresses correctly', () => {
      expect(isValidEmail('barber@example.com')).toBe(true)
      expect(isValidEmail('customer.test@fadeandedge.co.za')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@missinguser.com')).toBe(false)
      expect(isValidEmail(null)).toBe(false)
    })

    it('validates South African mobile numbers', () => {
      expect(isValidSAMobile('0821234567')).toBe(true)
      expect(isValidSAMobile('+27821234567')).toBe(true)
      expect(isValidSAMobile('071 987 6543')).toBe(true)
      expect(isValidSAMobile('0111234567')).toBe(false) // Landline
      expect(isValidSAMobile('12345')).toBe(false)
      expect(isValidSAMobile(undefined)).toBe(false)
    })

    it('formats South African numbers with +27 international dial code', () => {
      expect(formatSAMobile('0821234567')).toBe('+27821234567')
      expect(formatSAMobile('+27821234567')).toBe('+27821234567')
    })

    it('validates UUIDs', () => {
      expect(isValidUUID('c732b184-7505-4c07-ba75-01e43c5b8b9a')).toBe(true)
      expect(isValidUUID('not-a-uuid')).toBe(false)
    })

    it('validates monetary amounts in cents', () => {
      expect(isValidAmount(15000)).toBe(true)
      expect(isValidAmount(0)).toBe(true)
      expect(isValidAmount(-50)).toBe(false)
      expect(isValidAmount(150.5)).toBe(false) // Non-integer
      expect(isValidAmount('15000')).toBe(false)
    })

    it('validates dates (YYYY-MM-DD)', () => {
      expect(isValidDate('2026-09-10')).toBe(true)
      expect(isValidDate('2026-02-30')).toBe(false)
      expect(isValidDate('10-09-2026')).toBe(false)
    })

    it('validates time slot ranges', () => {
      expect(isValidTimeSlot('09:00', '09:45')).toBe(true)
      expect(isValidTimeSlot('10:30', '10:00')).toBe(false) // End before start
    })

    it('sanitizes input and strips dangerous HTML/script tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>Sizwe')).toBe('Sizwe')
      expect(sanitizeInput('<b>John</b>')).toBe('John')
      expect(sanitizeInput('  Clean String  ')).toBe('Clean String')
    })
  })

  describe('validateBookingRequest', () => {
    it('accepts a valid booking payload', () => {
      const payload = {
        tenantId: 'c732b184-7505-4c07-ba75-01e43c5b8b9a',
        salonSlug: 'fade-and-edge',
        barberId: 'devon-williams',
        serviceIds: ['classic-haircut'],
        date: '2026-09-15',
        timeSlot: '10:00',
        customerName: 'Sizwe Mkhize',
        customerPhone: '0821234567',
        customerEmail: 'sizwe@example.com',
        paymentMethod: 'card',
      }
      const result = validateBookingRequest(payload)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('flags missing required booking fields with descriptive messages', () => {
      const payload = {
        customerName: 'S', // too short
        customerPhone: 'invalid-phone',
        paymentMethod: 'crypto', // unsupported
      }
      const result = validateBookingRequest(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'barberId')).toBe(true)
      expect(result.errors.some(e => e.field === 'customerPhone')).toBe(true)
      expect(result.errors.some(e => e.field === 'paymentMethod')).toBe(true)
    })
  })

  describe('toUserFacingMessage Error Handling', () => {
    it('translates ValidationError into user-readable field messages', () => {
      const err = new ValidationError('Validation failed', [
        { field: 'customerPhone', message: 'Invalid phone format' },
      ])
      expect(toUserFacingMessage(err)).toBe('customerPhone: Invalid phone format')
    })

    it('safely obscures internal database or system error stack details', () => {
      const dbError = new Error('FATAL: database connection timed out at postgres://user:secret@db.internal')
      const msg = toUserFacingMessage(dbError)
      expect(msg).toBe('An unexpected error occurred. Please try again or contact support if the issue persists.')
      expect(msg).not.toContain('secret')
      expect(msg).not.toContain('postgres')
    })

    it('translates Auth and Payment errors into friendly guidance', () => {
      expect(toUserFacingMessage(new AuthenticationError())).toBe('Please sign in to continue.')
      expect(toUserFacingMessage(new AuthorizationError())).toContain('authorization')
      expect(toUserFacingMessage(new PaymentError('Card declined by bank'))).toBe('Card declined by bank')
    })
  })
})

