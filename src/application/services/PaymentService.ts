import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type { PaymentGatewayAdapter } from '@/domains/payments/types'
import { defaultPaymentAdapter } from '@/domains/payments/adapters'
import type { DomainPaymentRecord, DomainPaymentMethod } from '@/domains/payments/types'

export class PaymentService {
  constructor(
    private repos: RepositoryContainer = defaultRepositories,
    private gateway: PaymentGatewayAdapter = defaultPaymentAdapter
  ) {}

  /**
   * Records a payment against an appointment and recalculates payment status.
   */
  async recordPayment(input: {
    tenantId: string
    appointmentId: string
    amount: number
    method: DomainPaymentMethod
    providerReference?: string
  }): Promise<DomainPaymentRecord> {
    const appt = await this.repos.appointments.findById(input.appointmentId)
    if (!appt) throw new Error('Appointment not found')

    // 1. Record payment transaction
    const payment = await this.repos.payments.record({
      tenantId: input.tenantId,
      appointmentId: input.appointmentId,
      amount: input.amount,
      method: input.method,
      status: 'successful',
      providerReference: input.providerReference,
    })

    // 2. Update appointment payment status
    const newPaidTotal = appt.totalPaid + input.amount
    const newStatus = newPaidTotal >= appt.totalCharged ? 'paid' : 'partial'
    await this.repos.appointments.recordPayment(input.appointmentId, input.amount, newStatus)

    return payment
  }

  /**
   * Initiates online checkout via gateway adapter.
   */
  async initiateOnlinePayment(input: {
    appointmentReference: string
    amount: number
    customerName: string
    customerPhone?: string
    customerEmail?: string
  }) {
    return this.gateway.createPaymentIntent({
      amount: input.amount,
      currency: 'ZAR',
      appointmentReference: input.appointmentReference,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
    })
  }
}

export const paymentService = new PaymentService()