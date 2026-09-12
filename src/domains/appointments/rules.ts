/**
 * Appointment Domain Business Rules.
 * 
 * Invariants:
 * - Appointment status and payment status are strictly decoupled.
 * - Cancellation fees depend on cancellation origin (customer vs salon) and lead time (>24h vs <=24h).
 * - Appointments can only be marked as COMPLETED when outstanding balance is zero.
 */

export interface CancellationCalculation {
  feePercent: number
  feeAmount: number
  refundAmount: number
  isEligibleForRefund: boolean
}

/**
 * Calculates cancellation fee and refundable amount based on salon business policy.
 * 
 * Rules:
 * - Salon-initiated: 0% fee (100% refund).
 * - Customer-initiated (> 24 hours before appointment): 10% cancellation fee.
 * - Customer-initiated (<= 24 hours before appointment): 18% cancellation fee.
 */
export function calculateCancellationFee(
  amountPaid: number,
  appointmentDateTime: string | Date,
  cancelledBy: 'customer' | 'salon',
  referenceTime: Date = new Date()
): CancellationCalculation {
  if (amountPaid <= 0) {
    return {
      feePercent: 0,
      feeAmount: 0,
      refundAmount: 0,
      isEligibleForRefund: false,
    }
  }

  if (cancelledBy === 'salon') {
    return {
      feePercent: 0,
      feeAmount: 0,
      refundAmount: amountPaid,
      isEligibleForRefund: true,
    }
  }

  const apptDate = typeof appointmentDateTime === 'string' ? new Date(appointmentDateTime) : appointmentDateTime
  const diffMs = apptDate.getTime() - referenceTime.getTime()
  const hoursRemaining = diffMs / (1000 * 60 * 60)

  // Policy: > 24h = 10% penalty, <= 24h = 18% penalty
  const feePercent = hoursRemaining > 24 ? 10 : 18
  const feeAmount = Math.round((amountPaid * feePercent) / 100)
  const refundAmount = Math.max(0, amountPaid - feeAmount)

  return {
    feePercent,
    feeAmount,
    refundAmount,
    isEligibleForRefund: refundAmount > 0,
  }
}

/**
 * Verifies if an appointment is eligible for completion.
 * Business Rule: Outstanding balance must equal zero (fully paid).
 */
export function canCompleteAppointment(appointment: {
  totalCharged: number
  totalPaid: number
}): { canComplete: boolean; outstandingBalance: number; reason?: string } {
  const outstandingBalance = Math.max(0, appointment.totalCharged - appointment.totalPaid)

  if (outstandingBalance > 0) {
    return {
      canComplete: false,
      outstandingBalance,
      reason: `Cannot complete appointment with outstanding balance of R${outstandingBalance}. Payment must be recorded first.`,
    }
  }

  return {
    canComplete: true,
    outstandingBalance: 0,
  }
}

/**
 * Validates whether an appointment can be rescheduled.
 */
export function canRescheduleAppointment(
  appointmentDate: string | Date,
  referenceTime: Date = new Date()
): { canReschedule: boolean; reason?: string } {
  const apptDate = typeof appointmentDate === 'string' ? new Date(appointmentDate) : appointmentDate
  const diffMs = apptDate.getTime() - referenceTime.getTime()
  const hoursRemaining = diffMs / (1000 * 60 * 60)

  if (hoursRemaining < 2) {
    return {
      canReschedule: false,
      reason: 'Appointments cannot be rescheduled within 2 hours of the scheduled time.',
    }
  }

  return { canReschedule: true }
}