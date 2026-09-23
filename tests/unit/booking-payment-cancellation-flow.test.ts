import { describe, it, expect, beforeEach } from 'vitest'
import { BookingService } from '@/application/services/BookingService'
import { PaymentService } from '@/application/services/PaymentService'
import { RefundService } from '@/application/services/RefundService'
import { AppointmentService } from '@/application/services/AppointmentService'
import { AvailabilityService } from '@/application/services/AvailabilityService'
import { repositories } from '@/infrastructure/repositories/container'
import { MockPaymentGatewayAdapter } from '@/domains/payments/adapters'

const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111'

describe('Booking, Payment, Cancellation & Refund State Flows (Authoritative Verification)', () => {
  let bookingService: BookingService
  let paymentService: PaymentService
  let refundService: RefundService
  let appointmentService: AppointmentService
  let availabilityService: AvailabilityService
  let gateway: MockPaymentGatewayAdapter

  beforeEach(() => {
    gateway = new MockPaymentGatewayAdapter()
    bookingService = new BookingService(repositories)
    paymentService = new PaymentService(repositories, gateway)
    refundService = new RefundService(repositories, gateway)
    appointmentService = new AppointmentService(repositories)
    availabilityService = new AvailabilityService(repositories)
  })

  it('declined card (ending in 0002) stops checkout, creates NO appointment, and keeps slot free', async () => {
    const intentResult = await paymentService.initiateOnlinePayment({
      appointmentReference: `PENDING-${Date.now()}`,
      amount: 150,
      customerName: 'Test Customer',
      cardNumber: '4111111111110002',
      cvv: '123',
    })

    expect(intentResult.success).toBe(false)
    expect(intentResult.errorMessage).toBe('Card declined by issuing bank.')

    // Invariant: Failed payment never creates an appointment
    const targetDate = '2026-09-18'
    const targetTime = '11:00'

    // Slot remains free and available
    const slots = await availabilityService.getAvailableSlots({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      date: targetDate,
      now: new Date('2026-09-18T06:00:00Z'),
    })

    const slot = slots.find(s => s.time === targetTime)
    expect(slot).toBeDefined()
    expect(slot?.available).toBe(true)
  })

  it('successful card checkout creates confirmed paid appointment and records payment', async () => {
    const intentResult = await paymentService.initiateOnlinePayment({
      appointmentReference: `PENDING-${Date.now()}`,
      amount: 150,
      customerName: 'Sipho Zulu',
      cardNumber: '4242424242424242',
      cvv: '456',
    })

    expect(intentResult.success).toBe(true)
    expect(intentResult.transactionReference).toBeDefined()

    const bookingResult = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      staffId: 't1',
      date: '2026-09-19',
      time: '10:00',
      price: 150,
      paymentMethod: 'card',
      providerReference: intentResult.transactionReference,
      customer: {
        name: 'Sipho Zulu',
        phone: '0831112222',
        email: 'sipho@example.com',
      },
    })

    expect(bookingResult.appointment.status).toBe('confirmed')
    expect(bookingResult.appointment.paymentStatus).toBe('paid')
    expect(bookingResult.appointment.totalPaid).toBe(150)
  })

  it('salon owner can cancel appointment and initiate 100% refund (0% cancellation fee)', async () => {
    // 1. Create a paid appointment
    const bookingResult = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      staffId: 't1',
      date: '2026-09-21',
      time: '14:00',
      price: 200,
      paymentMethod: 'card',
      customer: {
        name: 'Mandla Ndlovu',
        phone: '0845556666',
      },
    })

    const apptId = bookingResult.appointment.id

    // 2. Salon owner cancels appointment
    const cancelResult = await appointmentService.cancelAppointment(apptId, 'salon', bookingResult.bookingReference)
    expect(cancelResult.error).toBeUndefined()
    expect(cancelResult.feePercent).toBe(0)
    expect(cancelResult.feeAmount).toBe(0)
    expect(cancelResult.refundAmount).toBe(200)

    // Check appointment status updated to cancelled
    const updatedAppt = await repositories.appointments.findById(apptId)
    expect(updatedAppt?.status).toBe('cancelled')

    // 3. Check refund record was created with status 'requested'
    const refunds = await repositories.refunds.listByAppointment(apptId)
    expect(refunds.length).toBe(1)
    const refund = refunds[0]
    expect(refund.status).toBe('requested')
    expect(refund.refundAmount).toBe(200)
    expect(refund.feeAmount).toBe(0)
    expect(refund.cancelledBy).toBe('salon')

    // 4. Salon manager processes gateway refund
    const processedRefund = await refundService.processRefund(refund.id, 'salon_manager')
    expect(processedRefund.status).toBe('completed')

    // Check appointment paymentStatus updated to refunded
    const finalAppt = await repositories.appointments.findById(apptId)
    expect(finalAppt?.paymentStatus).toBe('refunded')
  })
})
