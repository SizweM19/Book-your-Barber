import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type { PaymentGatewayAdapter } from '@/domains/payments/types'
import { defaultPaymentAdapter } from '@/domains/payments/adapters'
import type { DomainRefundRecord } from '@/domains/payments/types'

export class RefundService {
  constructor(
    private repos: RepositoryContainer = defaultRepositories,
    private gateway: PaymentGatewayAdapter = defaultPaymentAdapter
  ) {}

  /**
   * Processes a refund execution against a payment gateway.
   */
  async processRefund(refundId: string): Promise<DomainRefundRecord> {
    const refund = await this.repos.refunds.findById(refundId)
    if (!refund) throw new Error('Refund not found')

    // Mark as processing
    await this.repos.refunds.updateStatus(refundId, 'processing')

    // Invoke payment gateway adapter
    const result = await this.gateway.processRefund({
      paymentReference: refund.refundReference,
      amount: refund.refundAmount,
      reason: `Cancellation by ${refund.cancelledBy}`,
    })

    if (result.success) {
      return this.repos.refunds.updateStatus(refundId, 'completed')
    } else {
      return this.repos.refunds.updateStatus(refundId, 'failed', result.errorMessage || 'Gateway refund failure')
    }
  }

  /**
   * Creates a refund request record.
   */
  async requestRefund(input: {
    tenantId: string
    appointmentId: string
    customerId: string
    paymentId?: string
    originalAmount: number
    feePercent: number
    feeAmount: number
    refundAmount: number
    cancelledBy: 'customer' | 'salon'
  }): Promise<DomainRefundRecord> {
    const refundRef = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    return this.repos.refunds.create({
      tenantId: input.tenantId,
      refundReference: refundRef,
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      paymentId: input.paymentId,
      originalAmount: input.originalAmount,
      feePercent: input.feePercent,
      feeAmount: input.feeAmount,
      refundAmount: input.refundAmount,
      status: 'requested',
      cancelledBy: input.cancelledBy,
    })
  }

  /**
   * Manually completes a refund status.
   */
  async completeRefund(refundId: string): Promise<DomainRefundRecord> {
    return this.repos.refunds.updateStatus(refundId, 'completed')
  }

  /**
   * Marks a refund as failed with reason.
   */
  async failRefund(refundId: string, reason: string): Promise<DomainRefundRecord> {
    return this.repos.refunds.updateStatus(refundId, 'failed', reason)
  }

  async listRefunds(tenantId: string): Promise<DomainRefundRecord[]> {
    return this.repos.refunds.listByTenant(tenantId)
  }
}

export const refundService = new RefundService()