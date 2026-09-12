import { describe, it, expect } from 'vitest'
import {
  canCompleteAppointment,
  calculateCancellationFee,
  canRescheduleAppointment,
} from '@/domains/appointments/rules'

describe('Appointment Domain Rules', () => {
  describe('canCompleteAppointment', () => {
    it('allows completion when outstanding balance is zero', () => {
      const result = canCompleteAppointment({ totalCharged: 150, totalPaid: 150 })
      expect(result.canComplete).toBe(true)
      expect(result.outstandingBalance).toBe(0)
    })

    it('rejects completion when totalPaid is less than totalCharged', () => {
      const result = canCompleteAppointment({ totalCharged: 150, totalPaid: 100 })
      expect(result.canComplete).toBe(false)
      expect(result.outstandingBalance).toBe(50)
      expect(result.reason).toContain('outstanding balance')
    })

    it('rejects completion for unpaid appointments', () => {
      const result = canCompleteAppointment({ totalCharged: 200, totalPaid: 0 })
      expect(result.canComplete).toBe(false)
      expect(result.outstandingBalance).toBe(200)
    })
  })

  describe('calculateCancellationFee', () => {
    const referenceTime = new Date('2026-09-10T12:00:00Z')

    it('charges 0% fee and 100% refund for salon-initiated cancellations', () => {
      const apptTime = new Date('2026-09-10T14:00:00Z') // 2h ahead
      const result = calculateCancellationFee(200, apptTime, 'salon', referenceTime)

      expect(result.feePercent).toBe(0)
      expect(result.feeAmount).toBe(0)
      expect(result.refundAmount).toBe(200)
      expect(result.isEligibleForRefund).toBe(true)
    })

    it('charges 10% cancellation fee when customer cancels more than 24 hours ahead', () => {
      const apptTime = new Date('2026-09-12T12:00:00Z') // 48h ahead
      const result = calculateCancellationFee(200, apptTime, 'customer', referenceTime)

      expect(result.feePercent).toBe(10)
      expect(result.feeAmount).toBe(20) // 10% of 200
      expect(result.refundAmount).toBe(180)
      expect(result.isEligibleForRefund).toBe(true)
    })

    it('charges 18% cancellation fee when customer cancels 24 hours or less ahead', () => {
      const apptTime = new Date('2026-09-11T10:00:00Z') // 22h ahead
      const result = calculateCancellationFee(200, apptTime, 'customer', referenceTime)

      expect(result.feePercent).toBe(18)
      expect(result.feeAmount).toBe(36) // 18% of 200
      expect(result.refundAmount).toBe(164)
      expect(result.isEligibleForRefund).toBe(true)
    })

    it('returns zero refund and not eligible if amount paid is 0', () => {
      const apptTime = new Date('2026-09-12T12:00:00Z')
      const result = calculateCancellationFee(0, apptTime, 'customer', referenceTime)

      expect(result.feeAmount).toBe(0)
      expect(result.refundAmount).toBe(0)
      expect(result.isEligibleForRefund).toBe(false)
    })
  })

  describe('canRescheduleAppointment', () => {
    const referenceTime = new Date('2026-09-10T12:00:00Z')

    it('permits rescheduling when appointment is at least 2 hours away', () => {
      const futureAppt = new Date('2026-09-10T15:00:00Z') // 3h ahead
      const result = canRescheduleAppointment(futureAppt, referenceTime)
      expect(result.canReschedule).toBe(true)
    })

    it('prohibits rescheduling when appointment is less than 2 hours away', () => {
      const imminentAppt = new Date('2026-09-10T13:30:00Z') // 1.5h ahead
      const result = canRescheduleAppointment(imminentAppt, referenceTime)
      expect(result.canReschedule).toBe(false)
      expect(result.reason).toContain('within 2 hours')
    })
  })
})

