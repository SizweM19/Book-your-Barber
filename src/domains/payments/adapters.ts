import type {
  PaymentGatewayAdapter,
  PaymentIntentRequest,
  PaymentIntentResult,
  RefundRequest,
  RefundResult,
  DomainPaymentStatus,
} from './types'

/**
 * Mock payment gateway adapter for local development, demo flows, and automated testing.
 * Strictly avoids hardcoding third-party credentials or external network calls.
 */
export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'MockGateway'

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const transactionReference = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    return {
      success: true,
      transactionReference,
    }
  }

  async verifyPayment(transactionReference: string): Promise<{
    isVerified: boolean
    amount: number
    status: DomainPaymentStatus
  }> {
    return {
      isVerified: true,
      amount: 150,
      status: 'PAID',
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    const refundReference = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    return {
      success: true,
      refundReference,
    }
  }
}

export const defaultPaymentAdapter: PaymentGatewayAdapter = new MockPaymentGatewayAdapter()