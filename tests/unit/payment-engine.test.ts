import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentService } from '@/application/services/PaymentService'
import { RefundService } from '@/application/services/RefundService'
import { AppointmentService } from '@/application/services/AppointmentService'
import {
  calculateCancellationFee,
  canCompleteAppointment,
} from '@/domains/appointments/rules'
import {
  randsToCents,
  centsToRands,
  addMoney,
  subtractMoney,
  calculatePercentageFee,
  formatZAR,
} from '@/domains/payments/money'
import {
  isValidTransactionPaymentTransition,
  isValidRefundTransition,
  isValidAppointmentPaymentTransition,
  assertValidTransactionPaymentTransition,
  assertValidRefundTransition,
} from '@/domains/payments/state-machine'
import { MockPaymentGatewayAdapter } from '@/domains/payments/adapters'
import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { getRepositories, createMockContainer } from '@/infrastructure/repositories/container'

describe('Payment & Refund Engine Core Test Suite', () => {
  let mockRepos: RepositoryContainer
  let paymentService: PaymentService
  let refundService: RefundService
  let appointmentService: AppointmentService
  let mockGateway: MockPaymentGatewayAdapter

  beforeEach(() => {
    mockRepos = createMockContainer()
    mockGateway = new MockPaymentGatewayAdapter()
    paymentService = new PaymentService(mockRepos, mockGateway)
    refundService = new RefundService(mockRepos, mockGateway)
    appointmentService = new AppointmentService(mockRepos)
  })

  // ============================================================================
  // 1. PAYMENTS
  // ============================================================================
  describe('1. Payments & Balances', () => {
    it('1. unpaid appointment: initializes with totalPaid = 0, paymentStatus = unpaid', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-UNPAID-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '09:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 250,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const state = await paymentService.getAppointmentFinancialState(appt.id, 'tenant-1')
      expect(state.totalCharged).toBe(250)
      expect(state.totalPaid).toBe(0)
      expect(state.outstanding).toBe(250)
      expect(state.paymentStatus).toBe('unpaid')
      expect(state.isFullyPaid).toBe(false)
    })

    it('2. partial payment: transitions status to partial and derives outstanding balance', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-PARTIAL-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '10:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 250,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const payment = await paymentService.recordSalonPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 100,
        method: 'cash',
      })

      expect(payment.amount).toBe(100)
      expect(payment.status).toBe('successful')

      const updated = await mockRepos.appointments.findById(appt.id)
      expect(updated?.totalPaid).toBe(100)
      expect(updated?.paymentStatus).toBe('partial')

      const state = await paymentService.getAppointmentFinancialState(appt.id, 'tenant-1')
      expect(state.outstanding).toBe(150)
    })

    it('3. multiple partial payments: accurately accumulates totalPaid across transactions', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-MULTI-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '11:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 250,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      await paymentService.recordSalonPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 100,
        method: 'cash',
      })

      await paymentService.recordSalonPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 50,
        method: 'card',
      })

      const state = await paymentService.getAppointmentFinancialState(appt.id, 'tenant-1')
      expect(state.totalPaid).toBe(150)
      expect(state.outstanding).toBe(100)
      expect(state.paymentStatus).toBe('partial')
      expect(state.payments.length).toBe(2)
    })

    it('4. full payment: settles remaining balance and transitions status to paid', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-FULL-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '12:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 250,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      await paymentService.recordSalonPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 250,
        method: 'card',
      })

      const state = await paymentService.getAppointmentFinancialState(appt.id, 'tenant-1')
      expect(state.totalPaid).toBe(250)
      expect(state.outstanding).toBe(0)
      expect(state.paymentStatus).toBe('paid')
      expect(state.isFullyPaid).toBe(true)
    })

    it('5. overpayment rejection: rejects payment amount exceeding outstanding balance', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-OVERPAY-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '13:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 150,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Outstanding is R50; trying to pay R100 should be rejected
      await expect(
        paymentService.recordSalonPayment({
          tenantId: 'tenant-1',
          appointmentId: appt.id,
          amount: 100,
          method: 'cash',
        })
      ).rejects.toThrow(/Overpayment rejected/)

      // Appointment totals must remain untouched
      const current = await mockRepos.appointments.findById(appt.id)
      expect(current?.totalPaid).toBe(150)
    })

    it('6. payment failure / non-negative rejection: rejects negative or zero payments', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-NONNEG-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '14:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      await expect(
        paymentService.recordSalonPayment({
          tenantId: 'tenant-1',
          appointmentId: appt.id,
          amount: -50,
          method: 'cash',
        })
      ).rejects.toThrow()

      await expect(
        paymentService.recordSalonPayment({
          tenantId: 'tenant-1',
          appointmentId: appt.id,
          amount: 0,
          method: 'cash',
        })
      ).rejects.toThrow(/greater than zero/)
    })

    it('7. duplicate payment submission (idempotencyKey): does not duplicate transaction record', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-IDEMP-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '15:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const idempKey = 'client-req-key-12345'

      const p1 = await paymentService.recordPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 100,
        method: 'card',
        idempotencyKey: idempKey,
      })

      const p2 = await paymentService.recordPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 100,
        method: 'card',
        idempotencyKey: idempKey,
      })

      expect(p1.id).toBe(p2.id)

      const payments = await mockRepos.payments.listByAppointment(appt.id)
      expect(payments.length).toBe(1)
    })

    it('8. duplicate provider reference (idempotency): does not duplicate transaction record', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-PROVREF-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '16:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const providerRef = 'YOCO-WEBHOOK-REF-999'

      const p1 = await paymentService.recordPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 150,
        method: 'yoco',
        providerReference: providerRef,
      })

      const p2 = await paymentService.recordPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 150,
        method: 'yoco',
        providerReference: providerRef,
      })

      expect(p1.id).toBe(p2.id)
    })

    it('9. invalid payment transition: rejects disallowed transitions', () => {
      expect(isValidTransactionPaymentTransition('successful', 'pending')).toBe(false)
      expect(isValidTransactionPaymentTransition('failed', 'successful')).toBe(false)
      expect(() => assertValidTransactionPaymentTransition('successful', 'pending')).toThrow()

      expect(isValidAppointmentPaymentTransition('paid', 'unpaid')).toBe(false)
      expect(isValidAppointmentPaymentTransition('refunded', 'unpaid')).toBe(false)
    })

    it('10. tenant isolation: rejects access across tenants', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-A',
        bookingReference: 'TEST-TENANT-01',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '17:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      await expect(
        paymentService.recordSalonPayment({
          tenantId: 'tenant-B',
          appointmentId: appt.id,
          amount: 100,
          method: 'cash',
        })
      ).rejects.toThrow(/tenant isolation mismatch/)

      await expect(
        paymentService.getAppointmentFinancialState(appt.id, 'tenant-B')
      ).rejects.toThrow(/tenant mismatch/)
    })
  })

  // ============================================================================
  // 2. CANCELLATION & FEES
  // ============================================================================
  describe('2. Cancellation Business Rules', () => {
    it('11. > 24h customer cancellation: calculates exactly 10% fee and 90% refund', () => {
      const apptTime = '2026-09-25T14:00:00'
      const refTime = new Date('2026-09-24T10:00:00') // 28 hours remaining

      const result = calculateCancellationFee(250, apptTime, 'customer', refTime)
      expect(result.feePercent).toBe(10)
      expect(result.feeAmount).toBe(25)
      expect(result.refundAmount).toBe(225)
      expect(result.isEligibleForRefund).toBe(true)
    })

    it('12. <= 24h customer cancellation: calculates exactly 18% fee and 82% refund', () => {
      const apptTime = '2026-09-25T14:00:00'
      const refTime = new Date('2026-09-25T02:00:00') // 12 hours remaining

      const result = calculateCancellationFee(250, apptTime, 'customer', refTime)
      expect(result.feePercent).toBe(18)
      expect(result.feeAmount).toBe(45)
      expect(result.refundAmount).toBe(205)
      expect(result.isEligibleForRefund).toBe(true)
    })

    it('13. exactly 24h boundary: falls under <= 24h policy (18% fee)', () => {
      const apptTime = '2026-09-25T14:00:00'
      const refTime = new Date('2026-09-24T14:00:00') // exactly 24 hours remaining

      const result = calculateCancellationFee(250, apptTime, 'customer', refTime)
      expect(result.feePercent).toBe(18)
      expect(result.feeAmount).toBe(45)
      expect(result.refundAmount).toBe(205)
    })

    it('14. salon-initiated cancellation: 0% fee and 100% refund of paid amount', () => {
      const apptTime = '2026-09-25T14:00:00'
      const refTime = new Date('2026-09-25T13:00:00') // 1 hour remaining

      const result = calculateCancellationFee(250, apptTime, 'salon', refTime)
      expect(result.feePercent).toBe(0)
      expect(result.feeAmount).toBe(0)
      expect(result.refundAmount).toBe(250)
      expect(result.isEligibleForRefund).toBe(true)
    })

    it('15. unpaid appointment cancellation: 0% fee and 0 refund amount', () => {
      const apptTime = '2026-09-25T14:00:00'
      const result = calculateCancellationFee(0, apptTime, 'customer')
      expect(result.feePercent).toBe(0)
      expect(result.feeAmount).toBe(0)
      expect(result.refundAmount).toBe(0)
      expect(result.isEligibleForRefund).toBe(false)
    })

    it('16. partially paid cancellation: calculates fee safely against amount paid', () => {
      // Charged R250, Paid R100. >24h cancellation (10% of R100 = R10, refund = R90)
      const apptTime = '2026-09-25T14:00:00'
      const refTime = new Date('2026-09-24T10:00:00') // >24h

      const result = calculateCancellationFee(100, apptTime, 'customer', refTime)
      expect(result.feePercent).toBe(10)
      expect(result.feeAmount).toBe(10)
      expect(result.refundAmount).toBe(90)
      expect(result.isEligibleForRefund).toBe(true)
    })

    it('17. fully paid cancellation through AppointmentService creates refund record', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-CANC-FULL',
        customerId: 'cust-1',
        serviceId: 's1',
        appointmentDate: '2026-09-28',
        startTime: '10:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalCharged: 200,
        totalPaid: 200,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const cancelResult = await appointmentService.cancelAppointment(appt.id, 'customer')
      expect(cancelResult.appointment?.status).toBe('cancelled')
      expect(cancelResult.refundAmount).toBe(180) // >24h = 10% fee (R20), refund R180

      const refunds = await mockRepos.refunds.listByTenant('tenant-1')
      const createdRefund = refunds.find(r => r.appointmentId === appt.id)
      expect(createdRefund).toBeDefined()
      expect(createdRefund?.refundAmount).toBe(180)
      expect(createdRefund?.status).toBe('requested')
    })
  })

  // ============================================================================
  // 3. REFUNDS
  // ============================================================================
  describe('3. Refund Engine Operations', () => {
    it('19. refund requested -> creates record and sets status to requested', async () => {
      const refund = await refundService.requestRefund({
        tenantId: 'tenant-1',
        appointmentId: 'a1',
        customerId: 'c1',
        originalAmount: 150,
        feePercent: 10,
        feeAmount: 15,
        refundAmount: 135,
        cancelledBy: 'customer',
      })

      expect(refund.status).toBe('requested')
      expect(refund.refundAmount).toBe(135)
    })

    it('20. refund processing -> transitions to processing via processRefund', async () => {
      const refund = await refundService.requestRefund({
        tenantId: 'tenant-1',
        appointmentId: 'a3',
        customerId: 'c3',
        originalAmount: 250,
        feePercent: 0,
        feeAmount: 0,
        refundAmount: 250,
        cancelledBy: 'salon',
      })

      const processed = await refundService.processRefund(refund.id)
      expect(processed.status).toBe('completed')
    })

    it('21. refund completed -> updates appointment paymentStatus to refunded', async () => {
      const refund = await refundService.requestRefund({
        tenantId: 'tenant-1',
        appointmentId: 'a1',
        customerId: 'c1',
        originalAmount: 150,
        feePercent: 0,
        feeAmount: 0,
        refundAmount: 150,
        cancelledBy: 'salon',
      })

      await refundService.completeRefund(refund.id)

      const appt = await mockRepos.appointments.findById('a1')
      expect(appt?.paymentStatus).toBe('refunded')
    })

    it('22. refund failed -> marks refund as failed with explicit reason', async () => {
      const refund = await refundService.requestRefund({
        tenantId: 'tenant-1',
        appointmentId: 'a3',
        customerId: 'c3',
        originalAmount: 200,
        feePercent: 0,
        feeAmount: 0,
        refundAmount: 200,
        cancelledBy: 'salon',
      })

      const failed = await refundService.failRefund(refund.id, 'Provider connection timeout')
      expect(failed.status).toBe('failed')
      expect(failed.failureReason).toBe('Provider connection timeout')
    })

    it('23. duplicate refund prevention -> rejects second active refund request for same appointment', async () => {
      await refundService.requestRefund({
        tenantId: 'tenant-1',
        appointmentId: 'a1',
        customerId: 'c1',
        originalAmount: 150,
        feePercent: 10,
        feeAmount: 15,
        refundAmount: 135,
        cancelledBy: 'customer',
      })

      await expect(
        refundService.requestRefund({
          tenantId: 'tenant-1',
          appointmentId: 'a1',
          customerId: 'c1',
          originalAmount: 150,
          feePercent: 10,
          feeAmount: 15,
          refundAmount: 135,
          cancelledBy: 'customer',
        })
      ).rejects.toThrow(/Duplicate refund rejected/)
    })

    it('24. refund cannot exceed paid amount', async () => {
      // Appointment a1 totalPaid is 150
      await expect(
        refundService.requestRefund({
          tenantId: 'tenant-1',
          appointmentId: 'a1',
          customerId: 'c1',
          originalAmount: 150,
          feePercent: 0,
          feeAmount: 0,
          refundAmount: 300, // Exceeds 150!
          cancelledBy: 'salon',
        })
      ).rejects.toThrow(/exceeds total paid/)
    })

    it('25. refund calculation rounding determinism', () => {
      // Amount R155.55 with 18% fee
      // 15555 cents * 18 / 100 = 2799.9 cents -> rounds to 2800 cents (R28.00)
      // Refund: 15555 - 2800 = 12755 cents (R127.55)
      const fee = calculatePercentageFee(155.55, 18)
      const refund = subtractMoney(155.55, fee)

      expect(fee).toBe(28)
      expect(refund).toBe(127.55)
      expect(addMoney(fee, refund)).toBe(155.55)
    })

    it('26. tenant isolation on refunds', async () => {
      await expect(
        refundService.requestRefund({
          tenantId: 'tenant-WRONG',
          appointmentId: 'a1', // Belongs to DEFAULT_TENANT_ID
          customerId: 'c1',
          originalAmount: 150,
          feePercent: 0,
          feeAmount: 0,
          refundAmount: 150,
          cancelledBy: 'salon',
        })
      ).rejects.toThrow(/tenant isolation mismatch/)
    })
  })

  // ============================================================================
  // 4. APPOINTMENT COMPLETION & LIFECYCLE
  // ============================================================================
  describe('4. Appointment Completion & Lifecycle Boundary', () => {
    it('27. completion blocked with outstanding balance > R0', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-COMPL-BLOCKED',
        customerId: 'c1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '10:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'partial',
        totalCharged: 250,
        totalPaid: 200, // Outstanding R50
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const res = await appointmentService.completeAppointment(appt.id)
      expect(res.error).toBeDefined()
      expect(res.error).toContain('outstanding balance')

      const current = await mockRepos.appointments.findById(appt.id)
      expect(current?.status).not.toBe('completed')
    })

    it('28. completion allowed when fully paid (outstanding = R0)', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-COMPL-OK',
        customerId: 'c1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '10:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalCharged: 250,
        totalPaid: 250,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const res = await appointmentService.completeAppointment(appt.id)
      expect(res.error).toBeUndefined()
      expect(res.appointment?.status).toBe('completed')
    })

    it('29. cancellation preserves financial history', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-HISTORY-PRESERVED',
        customerId: 'c1',
        serviceId: 's1',
        appointmentDate: '2026-09-28',
        startTime: '10:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Record payment
      await paymentService.recordSalonPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 200,
        method: 'card',
      })

      // Cancel appointment
      await appointmentService.cancelAppointment(appt.id, 'customer')

      // Check financial history is retained
      const state = await paymentService.getAppointmentFinancialState(appt.id, 'tenant-1')
      expect(state.payments.length).toBe(1)
      expect(state.payments[0].amount).toBe(200)
      expect(state.refunds.length).toBe(1)
    })

    it('30. payment status remains strictly separate from appointment status', async () => {
      const appt = await mockRepos.appointments.create({
        tenantId: 'tenant-1',
        bookingReference: 'TEST-DECOUPLED',
        customerId: 'c1',
        serviceId: 's1',
        appointmentDate: '2026-09-20',
        startTime: '10:00',
        durationMinutes: 45,
        status: 'inProgress',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      expect(appt.status).toBe('inProgress')
      expect(appt.paymentStatus).toBe('unpaid')

      await paymentService.recordSalonPayment({
        tenantId: 'tenant-1',
        appointmentId: appt.id,
        amount: 200,
        method: 'cash',
      })

      const updated = await mockRepos.appointments.findById(appt.id)
      expect(updated?.status).toBe('inProgress') // Status unchanged
      expect(updated?.paymentStatus).toBe('paid') // Payment status updated
    })
  })

  // ============================================================================
  // 5. MONEY MATH ENGINE
  // ============================================================================
  describe('5. Money Math Engine', () => {
    it('34. calculates safe minor unit arithmetic without floating-point error', () => {
      // 0.1 + 0.2 in standard JS floats is 0.30000000000000004
      expect(addMoney(0.1, 0.2)).toBe(0.3)
      expect(subtractMoney(0.3, 0.1)).toBe(0.2)
      expect(formatZAR(0)).toBe('R0.00')
      expect(formatZAR(0.01)).toBe('R0.01')
      expect(formatZAR(100.5)).toBe('R100.50')
      expect(formatZAR(250)).toBe('R250.00')
      expect(formatZAR(9999.99)).toBe('R9 999.99')
    })
  })
})
