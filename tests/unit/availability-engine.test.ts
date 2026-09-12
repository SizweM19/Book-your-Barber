import { describe, it, expect, beforeEach } from 'vitest'
import { AvailabilityService, DEFAULT_SLOT_INTERVAL_MINUTES } from '@/application/services/AvailabilityService'
import { repositories } from '@/infrastructure/repositories/container'

const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111'

describe('Availability Engine (AvailabilityService)', () => {
  let availability: AvailabilityService

  beforeEach(() => {
    availability = new AvailabilityService(repositories)
  })

  it('defines centralized slot interval of 30 minutes', () => {
    expect(DEFAULT_SLOT_INTERVAL_MINUTES).toBe(30)
  })

  describe('Staff Working Hours & Split Shifts', () => {
    it('calculates regular continuous working hours for staff (Themba on Monday)', async () => {
      // 2026-09-14 is a Monday. Themba works 08:00 - 18:00 with 12:00-13:00 lunch break.
      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't1',
        serviceId: 's1', // Classic Haircut: 45 min
        date: '2026-09-14',
      })

      expect(slots.length).toBeGreaterThan(0)
      const slotTimes = slots.map(s => s.time)
      expect(slotTimes).toContain('08:00')
      expect(slotTimes).toContain('08:30')
      expect(slotTimes).toContain('17:00')
      // Operating ends at 18:00, so a 45-min service cannot start at 17:30
      expect(slotTimes).not.toContain('17:30')
    })

    it('calculates split shifts properly (Devon: 08:00-12:00 and 14:00-18:00)', async () => {
      // 2026-09-14 is a Monday. Devon (t2) works split shifts.
      // Classic Haircut (s1): 45 mins.
      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't2',
        serviceId: 's1',
        date: '2026-09-14',
      })

      const availableTimes = slots.filter(s => s.available).map(s => s.time)

      // Morning shift: 08:00 - 12:00
      expect(availableTimes).toContain('08:00')
      expect(availableTimes).toContain('08:30')
      // Devon has break at 10:00 - 10:30, so 10:00 is unavailable
      expect(availableTimes).not.toContain('10:00')

      // Between 12:00 and 14:00 is off shift (split shift gap)
      expect(availableTimes).not.toContain('12:00')
      expect(availableTimes).not.toContain('12:30')
      expect(availableTimes).not.toContain('13:00')
      expect(availableTimes).not.toContain('13:30')

      // Afternoon shift: 14:00 - 18:00
      expect(availableTimes).toContain('14:00')
      expect(availableTimes).toContain('15:00')
    })
  })

  describe('Break Periods', () => {
    it('marks slots that overlap staff breaks as unavailable', async () => {
      // Themba (t1) lunch break is 12:00 - 13:00
      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't1',
        serviceId: 's1', // 45 min duration
        date: '2026-09-14',
      })

      const slot1200 = slots.find(s => s.time === '12:00')
      expect(slot1200).toBeDefined()
      expect(slot1200?.available).toBe(false)
      expect(slot1200?.reason).toBe('Staff on break')

      const slot1230 = slots.find(s => s.time === '12:30')
      expect(slot1230).toBeDefined()
      expect(slot1230?.available).toBe(false)
      expect(slot1230?.reason).toBe('Staff on break')

      // Also, a 45-minute service starting at 11:30 would run until 12:15, overlapping the 12:00 break!
      const slot1130 = slots.find(s => s.time === '11:30')
      expect(slot1130).toBeDefined()
      expect(slot1130?.available).toBe(false)
      expect(slot1130?.reason).toBe('Staff on break')
    })
  })

  describe('Schedule Exceptions', () => {
    it('overrides recurring schedule when exception marks day as closed', async () => {
      // 2026-09-25 is Friday, but fixture has exception for t1 (Themba): is_working = false
      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't1',
        serviceId: 's1',
        date: '2026-09-25',
      })

      expect(slots.length).toBe(0)
    })

    it('overrides day-off recurring schedule with custom hours exception', async () => {
      // 2026-09-27 is Sunday (normally OFF for t1), but exception has custom hours 12:00 - 16:00
      // Note: Themba's lunch break 12:00-13:00 still applies, so availability starts at 13:00
      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't1',
        serviceId: 's1', // 45 min
        date: '2026-09-27',
      })

      expect(slots.length).toBeGreaterThan(0)
      const availableTimes = slots.filter(s => s.available).map(s => s.time)
      expect(availableTimes).not.toContain('12:00') // Break 12:00-13:00
      expect(availableTimes).toContain('13:00')
      expect(availableTimes).toContain('14:00')
      expect(availableTimes).toContain('15:00')
      // Custom hours end at 16:00, so a 45 min cut cannot start at 15:30
      expect(availableTimes).not.toContain('15:30')
    })
  })

  describe('Staff-Service Eligibility', () => {
    it('rejects booking when staff member is not assigned to the requested service', async () => {
      // Devon (t2) is assigned to s1 (Haircut), s2 (Line-up), s3 (Kids Cut), but NOT s4 (Beard Trim)
      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't2',
        serviceId: 's4', // Beard Trim and Shape
        date: '2026-09-14',
      })

      expect(slots).toEqual([])
    })

    it('rejects inactive staff members even if eligible', async () => {
      // Ntombi (t4) is inactive
      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't4',
        serviceId: 's1',
        date: '2026-09-14',
      })

      expect(slots).toEqual([])
    })
  })

  describe('Multi-Interval Appointment Conflict Detection', () => {
    it('blocks slots that overlap existing appointments across service duration', async () => {
      // On 2026-09-08, Themba (t1) has an appointment (a1) from 09:00 with 45 min duration (09:00 - 09:45)
      // Provide simulated now at 07:00 on 2026-09-08
      const simulatedNow = new Date('2026-09-08T07:00:00')

      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't1',
        serviceId: 's1', // 45 min
        date: '2026-09-08',
        now: simulatedNow,
      })

      const slot0900 = slots.find(s => s.time === '09:00')
      expect(slot0900?.available).toBe(false)
      expect(slot0900?.reason).toBe('Slot already reserved')

      // Slot at 08:30 (45 min duration runs 08:30 - 09:15) overlaps the 09:00 - 09:45 appointment!
      const slot0830 = slots.find(s => s.time === '08:30')
      expect(slot0830?.available).toBe(false)
      expect(slot0830?.reason).toBe('Slot already reserved')

      // Slot at 08:00 (45 min duration runs 08:00 - 08:45) ends before 09:00 -> available
      const slot0800 = slots.find(s => s.time === '08:00')
      expect(slot0800?.available).toBe(true)
    })
  })

  describe('Minimum Notice & Maximum Advance Booking Limits', () => {
    it('rejects slots that are too close to current time on the same day', async () => {
      // Simulate today at 09:15, with 30-min minimum booking notice (cutoff 09:45)
      const simulatedNow = new Date('2026-09-14T09:15:00')

      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't1',
        serviceId: 's1',
        date: '2026-09-14',
        now: simulatedNow,
      })

      // 08:00, 08:30, 09:00, 09:30 should all be unavailable due to notice rule
      const slot0900 = slots.find(s => s.time === '09:00')
      expect(slot0900?.available).toBe(false)
      expect(slot0900?.reason).toBe('Requires advance booking notice')

      const slot0930 = slots.find(s => s.time === '09:30')
      expect(slot0930?.available).toBe(false)
      expect(slot0930?.reason).toBe('Requires advance booking notice')

      // 10:00 is after 09:45 cutoff -> available
      const slot1000 = slots.find(s => s.time === '10:00')
      expect(slot1000?.available).toBe(true)
    })

    it('rejects dates beyond the configured maximum advance booking window', async () => {
      // Max advance is 60 days in settings
      const simulatedNow = new Date('2026-09-01T10:00:00')
      const targetDate = '2026-11-15' // 75 days in advance

      const slots = await availability.getAvailableSlots({
        tenantId: TEST_TENANT_ID,
        staffId: 't1',
        serviceId: 's1',
        date: targetDate,
        now: simulatedNow,
      })

      expect(slots).toEqual([])
    })
  })

  describe('Any Available Staff Calculation', () => {
    it('aggregates available slots across all eligible staff for a service', async () => {
      // Classic Haircut (s1) can be performed by Themba (t1) and Devon (t2)
      const result = await availability.getAvailableStaffAndSlots({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        date: '2026-09-14',
      })

      expect(result.eligibleStaff.length).toBe(2)
      expect(result.eligibleStaff.map(s => s.id)).toEqual(expect.arrayContaining(['t1', 't2']))

      // Result slots should include valid times
      const availSlots = result.slots.filter(s => s.available)
      expect(availSlots.length).toBeGreaterThan(0)

      // Verify each available slot has an assigned staff ID in assignmentMap
      for (const slot of availSlots) {
        expect(result.assignmentMap[slot.time]).toBeDefined()
        expect(['t1', 't2']).toContain(result.assignmentMap[slot.time])
      }
    })

    it('respects FIRST_AVAILABLE assignment strategy', async () => {
      // Default mock setting is FIRST_AVAILABLE
      const result = await availability.getAvailableStaffAndSlots({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        date: '2026-09-14',
      })

      // Both t1 and t2 are available at 08:00, so t1 (first in list) is chosen
      expect(result.assignmentMap['08:00']).toBe('t1')
    })
  })
})
