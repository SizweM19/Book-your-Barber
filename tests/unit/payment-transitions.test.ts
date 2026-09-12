import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentService } from '@/application/services/PaymentService'
import { RefundService } from '@/application/services/RefundService'
import { MockAppointmentRepository, MockPaymentRepository, MockRefundRepository } from '@/infrastructure/repositories/MockRepositories'
import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { getRepositories } from '@/infrastructure/repositories/container'

describe('Payment & Refund State Transitions', () => {
  let mockRepos: RepositoryContainer
  let paymentService: PaymentService
  let refundService: RefundService

  beforeEach(() => {
    mockRepos = getRepositories('mock')
    paymentService = new PaymentService(mockRepos)
    refundService = new RefundService(mockRepos)
  })

  it('transitions payment status from unpaid to partial when amount is less than total charged', async () => {
    // Create an unpaid appointment
    const appt = await mockRepos.appointments.create({
      tenantId: 'tenant-1',
      bookingReference: 'BYB-20260910-00101',
      customerId: 'cust-1',
      serviceId: 's1',
      appointmentDate: '2026-09-15',
      startTime: '10:00',
      durationMinutes: 45,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      totalCharged: 200,
      totalPaid: 0,
      bookingSource: 'online',
      reminderChannel: 'whatsapp',
    })

    expect(appt.paymentStatus).toBe('unpaid')

    // Record partial payment of R100
    const payment = await paymentService.recordPayment({
      tenantId: 'tenant-1',
      appointmentId: appt.id,
      amount: 100,
      method: 'card',
    })

    expect(payment.status).toBe('successful')

    const updatedAppt = await mockRepos.appointments.findById(appt.id)
    expect(updatedAppt?.totalPaid).toBe(100)
    expect(updatedAppt?.paymentStatus).toBe('partial')
  })

  it('transitions payment status from partial to paid when balance is settled', async () => {
    // Create an appointment with totalCharged R150, paid R100
    const appt = await mockRepos.appointments.create({
      tenantId: 'tenant-1',
      bookingReference: 'BYB-20260910-00102',
      customerId: 'cust-1',
      serviceId: 's1',
      appointmentDate: '2026-09-15',
      startTime: '11:00',
      durationMinutes: 45,
      status: 'confirmed',
      paymentStatus: 'partial',
      totalCharged: 150,
      totalPaid: 100,
      bookingSource: 'online',
      reminderChannel: 'whatsapp',
    })

    // Settle the remaining R50
    await paymentService.recordPayment({
      tenantId: 'tenant-1',
      appointmentId: appt.id,
      amount: 50,
      method: 'cash',
    })

    const fullyPaidAppt = await mockRepos.appointments.findById(appt.id)
    expect(fullyPaidAppt?.totalPaid).toBe(150)
    expect(fullyPaidAppt?.paymentStatus).toBe('paid')
  })

  it('manages refund status lifecycle (requested -> processing -> completed / failed)', async () => {
    const refund = await refundService.requestRefund({
      tenantId: 'tenant-1',
      appointmentId: 'appt-1',
      customerId: 'cust-1',
      originalAmount: 200,
      feePercent: 10,
      feeAmount: 20,
      refundAmount: 180,
      cancelledBy: 'customer',
    })

    expect(refund.status).toBe('requested')
    expect(refund.refundAmount).toBe(180)

    const completed = await refundService.completeRefund(refund.id)
    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeDefined()
  })

  it('handles failed refund status transitions with failure reasons', async () => {
    const refund = await refundService.requestRefund({
      tenantId: 'tenant-1',
      appointmentId: 'appt-2',
      customerId: 'cust-2',
      originalAmount: 150,
      feePercent: 0,
      feeAmount: 0,
      refundAmount: 150,
      cancelledBy: 'salon',
    })

    const failed = await refundService.failRefund(refund.id, 'Payment gateway unreachable')
    expect(failed.status).toBe('failed')
    expect(failed.failureReason).toBe('Payment gateway unreachable')
  })
})

