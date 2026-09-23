import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type { PaymentGatewayAdapter } from '@/domains/payments/types'
import { defaultPaymentAdapter } from '@/domains/payments/adapters'
import type {
  DomainPaymentRecord,
  DomainPaymentMethod,
  DomainRefundRecord,
  DomainPaymentStatus,
} from '@/domains/payments/types'
import {
  addMoney,
  subtractMoney,
  assertNonNegative,
  formatZAR,
} from '@/domains/payments/money'
import {
  assertValidTransactionPaymentTransition,
  assertValidRefundTransition,
  isValidAppointmentPaymentTransition,
  TransactionPaymentStatus,
  AppointmentPaymentStatus,
} from '@/domains/payments/state-machine'
import { auditService } from '@/application/services/AuditService'
import { eventBus } from './EventBus'

export interface RecordSalonPaymentInput {
  tenantId: string
  appointmentId: string
  amount: number
  method: DomainPaymentMethod
  providerReference?: string
  idempotencyKey?: string
  actorId?: string
  actorRole?: string
}

export interface AppointmentFinancialState {
  appointmentId: string
  tenantId: string
  totalCharged: number
  totalPaid: number
  outstanding: number
  paymentStatus: AppointmentPaymentStatus
  isFullyPaid: boolean
  payments: DomainPaymentRecord[]
  refunds: DomainRefundRecord[]
}

export class PaymentService {
  constructor(
    private repos: RepositoryContainer = defaultRepositories,
    private gateway: PaymentGatewayAdapter = defaultPaymentAdapter
  ) {}

  /**
   * Calculates outstanding balance for an appointment safely.
   */
  calculateOutstandingBalance(totalCharged: number, totalPaid: number): number {
    return subtractMoney(totalCharged, totalPaid)
  }

  /**
   * Records a payment (salon-side or online capture) against an appointment.
   * 
   * Invariants:
   * - Enforces tenant isolation.
   * - Validates non-negative amounts.
   * - Idempotency: Duplicate submissions with the same idempotency key or provider reference return the existing record.
   * - Overpayment rejection: Cannot pay more than the outstanding balance.
   * - Updates appointment totalPaid and transitions paymentStatus (unpaid -> partial -> paid).
   * - Records an immutable audit log.
   */
  async recordPayment(input: RecordSalonPaymentInput & { source?: 'ONLINE' | 'SALON'; provider?: string }): Promise<DomainPaymentRecord> {
    assertNonNegative(input.amount, 'Payment amount')
    if (input.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.')
    }

    const appt = await this.repos.appointments.findById(input.appointmentId)
    if (!appt) {
      throw new Error('Appointment not found.')
    }

    if (appt.tenantId !== input.tenantId) {
      throw new Error('Access denied: tenant isolation mismatch.')
    }

    // 1. Idempotency Check: check if already recorded
    if (input.idempotencyKey && this.repos.payments.findByIdempotencyKey) {
      const existing = await this.repos.payments.findByIdempotencyKey(input.idempotencyKey)
      if (existing) {
        if (existing.tenantId !== input.tenantId) {
          throw new Error('Access denied: idempotency tenant mismatch.')
        }
        return existing
      }
    }

    if (input.providerReference && this.repos.payments.findByProviderReference) {
      const existing = await this.repos.payments.findByProviderReference(input.providerReference)
      if (existing) {
        if (existing.tenantId !== input.tenantId) {
          throw new Error('Access denied: provider reference tenant mismatch.')
        }
        return existing
      }
    }

    // 2. Overpayment Check
    const outstanding = this.calculateOutstandingBalance(appt.totalCharged, appt.totalPaid)
    if (input.amount > outstanding) {
      throw new Error(
        `Overpayment rejected: payment of ${formatZAR(input.amount)} exceeds outstanding balance of ${formatZAR(outstanding)}.`
      )
    }

    // 3. Record transaction in repository
    const payment = await this.repos.payments.record({
      tenantId: input.tenantId,
      appointmentId: input.appointmentId,
      amount: input.amount,
      method: input.method,
      status: 'successful',
      source: input.source || 'SALON',
      provider: input.provider,
      providerReference: input.providerReference,
      idempotencyKey: input.idempotencyKey,
    })

    // 4. Update appointment financial totals & status
    const newTotalPaid = addMoney(appt.totalPaid, input.amount)
    const newStatus: AppointmentPaymentStatus = newTotalPaid >= appt.totalCharged ? 'paid' : 'partial'

    if (!isValidAppointmentPaymentTransition(appt.paymentStatus, newStatus)) {
      throw new Error(
        `Invalid appointment payment transition from '${appt.paymentStatus}' to '${newStatus}'.`
      )
    }

    await this.repos.appointments.recordPayment(input.appointmentId, input.amount, newStatus)

    // 5. Audit log
    try {
      await auditService.log({
        tenantId: input.tenantId,
        actorId: input.actorId || 'system',
        actorRole: input.actorRole || 'STAFF',
        action: 'PAYMENT_CHARGE',
        entityType: 'PAYMENT',
        entityId: payment.id,
        metadata: {
          appointmentId: input.appointmentId,
          amount: input.amount,
          method: input.method,
          outstandingAfter: subtractMoney(appt.totalCharged, newTotalPaid),
          status: newStatus,
        },
      })
    } catch {
      // Audit failure does not abort committed transaction
    }

    // 6. Publish payment.received domain event
    try {
      const cust = await this.repos.customers.findById(appt.customerId)
      const salon = await this.repos.salons.findByTenantId(input.tenantId)
      const remainingBalance = subtractMoney(appt.totalCharged, newTotalPaid)

      await eventBus.publish({
        eventId: `evt-pay-${payment.id}`,
        timestamp: new Date().toISOString(),
        tenantId: input.tenantId,
        type: 'payment.received',
        appointmentId: appt.id,
        bookingReference: appt.bookingReference,
        customerId: appt.customerId,
        customerName: cust?.name || 'Customer',
        customerPhone: cust?.phone,
        customerEmail: cust?.email,
        amount: input.amount,
        method: input.method,
        remainingBalance,
        providerReference: input.providerReference,
        reminderChannel: appt.reminderChannel || 'none',
        salonName: salon?.name || 'Fade & Edge Barbershop',
      })
    } catch {
      // Invariant: Notification failure must not affect payment recording
    }

    return payment
  }

  /**
   * Convenience alias for salon staff payment recording.
   */
  async recordSalonPayment(input: RecordSalonPaymentInput): Promise<DomainPaymentRecord> {
    return this.recordPayment({
      ...input,
      source: 'SALON',
    })
  }

  /**
   * Retrieves complete financial state and transaction history for an appointment.
   */
  async getAppointmentFinancialState(
    appointmentId: string,
    tenantId: string
  ): Promise<AppointmentFinancialState> {
    const appt = await this.repos.appointments.findById(appointmentId)
    if (!appt) {
      throw new Error('Appointment not found.')
    }
    if (appt.tenantId !== tenantId) {
      throw new Error('Access denied: tenant mismatch.')
    }

    const [payments, refunds] = await Promise.all([
      this.repos.payments.listByAppointment(appointmentId),
      this.repos.refunds.listByAppointment
        ? this.repos.refunds.listByAppointment(appointmentId)
        : this.repos.refunds.listByTenant(tenantId).then(list => list.filter(r => r.appointmentId === appointmentId)),
    ])

    const outstanding = this.calculateOutstandingBalance(appt.totalCharged, appt.totalPaid)

    return {
      appointmentId: appt.id,
      tenantId: appt.tenantId,
      totalCharged: appt.totalCharged,
      totalPaid: appt.totalPaid,
      outstanding,
      paymentStatus: appt.paymentStatus as AppointmentPaymentStatus,
      isFullyPaid: appt.totalPaid >= appt.totalCharged,
      payments,
      refunds,
    }
  }

  /**
   * Initiates online checkout via provider gateway adapter.
   */
  async initiateOnlinePayment(input: {
    appointmentReference: string
    amount: number
    customerName: string
    customerPhone?: string
    customerEmail?: string
    cardNumber?: string
    expiry?: string
    cvv?: string
  }) {
    assertNonNegative(input.amount, 'Online payment amount')
    return this.gateway.createPaymentIntent({
      amount: input.amount,
      currency: 'ZAR',
      appointmentReference: input.appointmentReference,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      cardNumber: input.cardNumber,
      expiry: input.expiry,
      cvv: input.cvv,
    })
  }
}

export const paymentService = new PaymentService()
