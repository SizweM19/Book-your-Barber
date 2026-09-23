/**
 * Payment & Refund Domain Contracts
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
  source?: 'ONLINE' | 'SALON'
  provider?: string
  providerReference?: string
  idempotencyKey?: string
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
  providerReference?: string
  idempotencyKey?: string
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
  cardNumber?: string
  cvv?: string
  metadata?: Record<string, any>
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

export interface PaymentGatewayAdapter {
  readonly providerName: string
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult>
  verifyPayment(transactionReference: string): Promise<{ isVerified: boolean; amount: number; status: DomainPaymentStatus }>
  processRefund(request: RefundRequest): Promise<RefundResult>
}

export interface CanonicalPaymentTransaction {
  id: string
  tenant_id: string
  appointment_id?: string
  amount_cents: number
  currency: string
  gateway: string
  gateway_transaction_id?: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  metadata?: Record<string, unknown>
  created_at: string
}

export interface CanonicalRefundRecord {
  id: string
  tenant_id: string
  payment_id: string
  amount_cents: number
  reason: string
  gateway_refund_id?: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  created_at: string
}
