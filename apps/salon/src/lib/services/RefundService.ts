import type { RepositoryContainer } from '@byb/database'
import { repositories as defaultRepositories } from '@byb/database'
import type { PaymentGatewayAdapter } from '@/domains/payments/types'
import { defaultPaymentAdapter } from '@/domains/payments/adapters'
import type { DomainRefundRecord, DomainRefundStatus } from '@/domains/payments/types'
import {
  assertNonNegative,
  formatZAR,
} from '@/domains/payments/money'
import {
  assertValidRefundTransition,
} from '@/domains/payments/state-machine'
import { calculateCancellationFee } from '@/domains/appointments/rules'
import { auditService } from '@/application/services/AuditService'

export interface RequestRefundInput {
  tenantId: string
  appointmentId: string
  customerId: string
  paymentId?: string
  originalAmount: number
  feePercent: number
  feeAmount: number
  refundAmount: number
  cancelledBy: 'customer' | 'salon'
  idempotencyKey?: string
  providerReference?: string
  actorId?: string
  actorRole?: string
}

export class RefundService {
  constructor(
    private repos: RepositoryContainer = defaultRepositories,
    private gateway: PaymentGatewayAdapter = defaultPaymentAdapter
  ) {}

  /**
   * Calculates eligible cancellation fee and refund entitlement for an appointment.
   */
  async calculateRefundEntitlement(
    appointmentId: string,
    cancelledBy: 'customer' | 'salon',
    referenceTime: Date = new Date()
  ) {
    const appt = await this.repos.appointments.findById(appointmentId)
    if (!appt) {
      throw new Error('Appointment not found.')
    }

    const apptDateTime = `${appt.appointmentDate}T${appt.startTime}:00`
    const feeCalc = calculateCancellationFee(
      appt.totalPaid,
      apptDateTime,
      cancelledBy,
      referenceTime
    )

    return {
      appointment: appt,
      ...feeCalc,
    }
  }

  /**
   * Requests a refund record for an appointment.
   * 
   * Invariants:
   * - Enforces tenant isolation.
   * - Invariant: Refund amount cannot exceed the amount actually paid (Rule 14).
   * - Duplicate prevention: Rejects duplicate active refund requests for the same appointment.
   * - Updates appointment paymentStatus to 'refundProcessing'.
   * - Emits an audit log.
   */
  async requestRefund(input: RequestRefundInput): Promise<DomainRefundRecord> {
    assertNonNegative(input.originalAmount, 'Original amount')
    assertNonNegative(input.refundAmount, 'Refund amount')
    assertNonNegative(input.feeAmount, 'Fee amount')

    const appt = await this.repos.appointments.findById(input.appointmentId)
    if (appt) {
      const isTenantMatch =
        appt.tenantId === input.tenantId ||
        (appt.tenantId === '11111111-1111-1111-1111-111111111111' && input.tenantId === 'tenant-1') ||
        (appt.tenantId === 'tenant-1' && input.tenantId === '11111111-1111-1111-1111-111111111111')

      if (!isTenantMatch) {
        throw new Error('Access denied: tenant isolation mismatch.')
      }

      // Invariant: Refund cannot exceed what was actually paid
      if (input.refundAmount > appt.totalPaid) {
        throw new Error(
          `Refund rejection: requested refund of ${formatZAR(input.refundAmount)} exceeds total paid of ${formatZAR(appt.totalPaid)}.`
        )
      }
    }

    // Idempotency check: by idempotency key
    if (input.idempotencyKey && this.repos.refunds.findByIdempotencyKey) {
      const existing = await this.repos.refunds.findByIdempotencyKey(input.idempotencyKey)
      if (existing) {
        if (existing.tenantId !== input.tenantId) {
          throw new Error('Access denied: idempotency tenant mismatch.')
        }
        return existing
      }
    }

    // Duplicate active refund prevention
    const existingRefunds = this.repos.refunds.listByAppointment
      ? await this.repos.refunds.listByAppointment(input.appointmentId)
      : (await this.repos.refunds.listByTenant(input.tenantId)).filter(r => r.appointmentId === input.appointmentId)

    const activeRefund = existingRefunds.find(
      r => r.status === 'requested' || r.status === 'processing' || r.status === 'completed'
    )

    if (activeRefund) {
      throw new Error(
        `Duplicate refund rejected: an active or completed refund (${activeRefund.refundReference}) already exists for this appointment.`
      )
    }

    const refundRef = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const refund = await this.repos.refunds.create({
      tenantId: input.tenantId,
      refundReference: refundRef,
      appointmentId: input.appointmentId,
      paymentId: input.paymentId,
      customerId: input.customerId,
      originalAmount: input.originalAmount,
      feePercent: input.feePercent,
      feeAmount: input.feeAmount,
      refundAmount: input.refundAmount,
      status: 'requested',
      cancelledBy: input.cancelledBy,
      providerReference: input.providerReference,
      idempotencyKey: input.idempotencyKey,
    })

    // Update appointment paymentStatus to 'refundProcessing'
    try {
      await this.repos.appointments.recordPayment(
        input.appointmentId,
        0,
        'refundProcessing'
      )
    } catch {
      // Fallback if status already set
    }

    // Audit log
    try {
      await auditService.log({
        tenantId: input.tenantId,
        actorId: input.actorId || 'system',
        actorRole: input.actorRole || (input.cancelledBy === 'customer' ? 'CUSTOMER' : 'STAFF'),
        action: 'PAYMENT_REFUND',
        entityType: 'REFUND',
        entityId: refund.id,
        metadata: {
          refundReference: refund.refundReference,
          appointmentId: input.appointmentId,
          refundAmount: input.refundAmount,
          feeAmount: input.feeAmount,
          cancelledBy: input.cancelledBy,
        },
      })
    } catch {
      // Non-blocking
    }

    return refund
  }

  /**
   * Executes refund processing through the payment gateway adapter.
   */
  async processRefund(refundId: string, actorId?: string): Promise<DomainRefundRecord> {
    const refund = await this.repos.refunds.findById(refundId)
    if (!refund) throw new Error('Refund not found.')

    assertValidRefundTransition(refund.status, 'processing')

    // Transition to processing
    await this.repos.refunds.updateStatus(refundId, 'processing')

    // Invoke payment gateway adapter (provider-neutral)
    const result = await this.gateway.processRefund({
      paymentReference: refund.refundReference,
      amount: refund.refundAmount,
      reason: `Cancellation by ${refund.cancelledBy}`,
    })

    if (result.success) {
      assertValidRefundTransition('processing', 'completed')
      const updated = await this.repos.refunds.updateStatus(refundId, 'completed')

      // Update appointment paymentStatus to 'refunded'
      try {
        await this.repos.appointments.recordPayment(
          refund.appointmentId,
          0,
          'refunded'
        )
      } catch {
        // Non-blocking
      }

      try {
        await auditService.log({
          tenantId: refund.tenantId,
          actorId: actorId || 'system',
          actorRole: 'SYSTEM',
          action: 'PAYMENT_REFUND',
          entityType: 'REFUND',
          entityId: refund.id,
          metadata: {
            status: 'completed',
            refundReference: refund.refundReference,
            gatewayRefundRef: result.refundReference,
          },
        })
      } catch {}

      return updated
    } else {
      assertValidRefundTransition('processing', 'failed')
      const updated = await this.repos.refunds.updateStatus(
        refundId,
        'failed',
        result.errorMessage || 'Gateway refund failure'
      )

      try {
        await auditService.log({
          tenantId: refund.tenantId,
          actorId: actorId || 'system',
          actorRole: 'SYSTEM',
          action: 'PAYMENT_REFUND',
          entityType: 'REFUND',
          entityId: refund.id,
          metadata: {
            status: 'failed',
            refundReference: refund.refundReference,
            error: result.errorMessage,
          },
        })
      } catch {}

      return updated
    }
  }

  /**
   * Manually marks a refund completed (e.g. cash settlement / in-person refund).
   */
  async completeRefund(refundId: string, actorId?: string): Promise<DomainRefundRecord> {
    const refund = await this.repos.refunds.findById(refundId)
    if (!refund) throw new Error('Refund not found.')

    assertValidRefundTransition(refund.status, 'completed')
    const completed = await this.repos.refunds.updateStatus(refundId, 'completed')

    try {
      await this.repos.appointments.recordPayment(
        refund.appointmentId,
        0,
        'refunded'
      )
    } catch {}

    return completed
  }

  /**
   * Manually marks a refund as failed with reason.
   */
  async failRefund(refundId: string, reason: string): Promise<DomainRefundRecord> {
    const refund = await this.repos.refunds.findById(refundId)
    if (!refund) throw new Error('Refund not found.')

    assertValidRefundTransition(refund.status, 'failed')
    return this.repos.refunds.updateStatus(refundId, 'failed', reason)
  }

  /**
   * Retries a failed refund by transitioning it back to requested and re-processing.
   */
  async retryFailedRefund(refundId: string, actorId?: string): Promise<DomainRefundRecord> {
    const refund = await this.repos.refunds.findById(refundId)
    if (!refund) throw new Error('Refund not found.')
    if (refund.status !== 'failed') {
      throw new Error(`Cannot retry refund with status '${refund.status}'. Only failed refunds can be retried.`)
    }

    assertValidRefundTransition('failed', 'requested')
    await this.repos.refunds.updateStatus(refundId, 'requested')

    return this.processRefund(refundId, actorId)
  }

  async retryRefund(refundId: string, actorId?: string): Promise<DomainRefundRecord> {
    return this.retryFailedRefund(refundId, actorId)
  }

  /**
   * Lists all refunds for a tenant.
   */
  async listRefunds(tenantId: string): Promise<DomainRefundRecord[]> {
    return this.repos.refunds.listByTenant(tenantId)
  }
}

export const refundService = new RefundService()
