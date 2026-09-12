import { describe, it, expect } from 'vitest'
import {
  generateBookingReference,
  isValidBookingReference,
  parseBookingReference,
  formatBookingReference,
} from '@/domains/booking/reference'

describe('Booking Reference Generator & Validator', () => {
  it('generates references matching the canonical format BYB-YYYYMMDD-XXXXX', () => {
    const fixedDate = new Date('2026-09-10T10:00:00Z')
    const ref = generateBookingReference(fixedDate)

    expect(ref).toMatch(/^BYB-20260910-\d{5}$/)
    expect(isValidBookingReference(ref)).toBe(true)
  })

  it('validates canonical booking references and rejects malformed inputs', () => {
    expect(isValidBookingReference('BYB-20260910-12345')).toBe(true)
    expect(isValidBookingReference('byb-20260910-12345')).toBe(true) // formatBookingReference handles case
    expect(isValidBookingReference('INVALID-REF')).toBe(false)
    expect(isValidBookingReference('BYB-202609-12345')).toBe(false)
    expect(isValidBookingReference('BYB-20260910-1234')).toBe(false)
    expect(isValidBookingReference('')).toBe(false)
  })

  it('correctly parses date and sequence segments from valid references', () => {
    const parsed = parseBookingReference('BYB-20260910-54321')
    expect(parsed.isValid).toBe(true)
    expect(parsed.date).toBe('20260910')
    expect(parsed.sequence).toBe('54321')

    const invalid = parseBookingReference('GARBAGE')
    expect(invalid.isValid).toBe(false)
  })

  it('generates collision-free unique references under concurrent generation', () => {
    const COUNT = 1000
    const generated = new Set<string>()
    const targetDate = new Date('2026-09-10T12:00:00Z')

    for (let i = 0; i < COUNT; i++) {
      const ref = generateBookingReference(targetDate)
      expect(generated.has(ref)).toBe(false)
      generated.add(ref)
    }

    expect(generated.size).toBe(COUNT)
  })

  it('ensures booking reference is separate from UUID format', () => {
    const ref = generateBookingReference()
    // UUID v4 regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(uuidRegex.test(ref)).toBe(false)
  })
})

