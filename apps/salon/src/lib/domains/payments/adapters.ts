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
    const cleanCard = (request.cardNumber || '').replace(/\s/g, '')
    const cleanCvv = (request.cvv || '').trim()

    if (cleanCard.endsWith('0002') || cleanCvv === '000') {
      return {
        success: false,
        transactionReference: `TXN-DECLINED-${Date.now()}`,
        errorMessage: 'Card declined by issuing bank.',
      }
    }

    if (cleanCard.endsWith('0003')) {
      return {
        success: false,
        transactionReference: `TXN-TIMEOUT-${Date.now()}`,
        errorMessage: 'Gateway timeout during card verification.',
      }
    }

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
    // Detect declined or timed-out transactions by their reference prefix
    // (set by createPaymentIntent when the gateway rejects the card).
    if (
      transactionReference.startsWith('TXN-DECLINED-') ||
      transactionReference.startsWith('TXN-TIMEOUT-')
    ) {
      return {
        isVerified: false,
        amount: 0,
        status: 'FAILED',
      }
    }

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