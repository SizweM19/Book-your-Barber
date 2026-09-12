/**
 * Payment & Refund Domain Types.
 * 
 * Invariants:
 * - Payment states are strictly enumerated; never represented as a boolean.
 * - Payment provider details are encapsulated behind gateway adapters.
 * - Customer cancellations and salon cancellations are explicitly auditable.
 */

export type DomainPaymentStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'FAILED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'

export type DomainPaymentMethod = 'cash' | 'card' | 'yoco' | 'payshap' | 'other'

export type DomainRefundStatus = 'requested' | 'processing' | 'completed' | 'failed'

export interface DomainPaymentRecord {
  id: string
  tenantId: string
  appointmentId: string
  amount: number
  method: DomainPaymentMethod
  status: 'successful' | 'failed' | 'pending'
  providerReference?: string
  recordedAt: string
}

export interface DomainRefundRecord {
  id: string
  tenantId: string
  refundReference: string
  appointmentId: string
  paymentId?: string
  customerId: string
  originalAmount: number
  feePercent: number
  feeAmount: number
  refundAmount: number
  status: DomainRefundStatus
  cancelledBy: 'customer' | 'salon'
  failureReason?: string
  requestedAt: string
  completedAt?: string
}

export interface PaymentIntentRequest {
  amount: number
  currency: string
  appointmentReference: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
}

export interface PaymentIntentResult {
  success: boolean
  transactionReference: string
  redirectUrl?: string
  errorMessage?: string
}

export interface RefundRequest {
  paymentReference: string
  amount: number
  reason: string
}

export interface RefundResult {
  success: boolean
  refundReference: string
  errorMessage?: string
}

/**
 * Interface boundary for payment gateways (e.g. Yoco, PayFast, PayShap, Mock).
 */
export interface PaymentGatewayAdapter {
  readonly providerName: string
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult>
  verifyPayment(transactionReference: string): Promise<{ isVerified: boolean; amount: number; status: DomainPaymentStatus }>
  processRefund(request: RefundRequest): Promise<RefundResult>
}