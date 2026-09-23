import { describe, it, expect, beforeEach } from 'vitest'
import { BookingService } from '@/application/services/BookingService'
import { AppointmentService } from '@/application/services/AppointmentService'
import { PaymentService } from '@/application/services/PaymentService'
import { RefundService } from '@/application/services/RefundService'
import { NotificationService } from '@/application/services/NotificationService'
import { eventBus } from '@/application/services/EventBus'
import { getRepositories } from '@/infrastructure/repositories/container'
import { NotificationProviderRegistry } from '@/infrastructure/notifications/registry'
import {
  MockEmailAdapter,
  MockWhatsAppAdapter,
  MockSmsAdapter,
} from '@/infrastructure/notifications/adapters/MockAdapters'
import { MockPaymentGatewayAdapter } from '@/domains/payments/adapters'

const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111'

describe('Notification Event-Driven Lifecycle & Domain Isolation Flow', () => {
  let repos: ReturnType<typeof getRepositories>
  let registry: NotificationProviderRegistry
  let emailAdapter: MockEmailAdapter
  let waAdapter: MockWhatsAppAdapter
  let smsAdapter: MockSmsAdapter
  let notificationService: NotificationService
  let bookingService: BookingService
  let appointmentService: AppointmentService
  let paymentService: PaymentService
  let refundService: RefundService
  let gateway: MockPaymentGatewayAdapter

  beforeEach(async () => {
    repos = getRepositories('mock')
    registry = new NotificationProviderRegistry()

    emailAdapter = new MockEmailAdapter()
    waAdapter = new MockWhatsAppAdapter()
    smsAdapter = new MockSmsAdapter()

    registry.setAdapter('email', emailAdapter)
    registry.setAdapter('whatsapp', waAdapter)
    registry.setAdapter('sms', smsAdapter)

    notificationService = new NotificationService(repos, registry)
    // Clear and register event handlers on the eventBus
    eventBus.clear()
    notificationService.registerEventHandlers(eventBus)

    gateway = new MockPaymentGatewayAdapter()
    bookingService = new BookingService(repos)
    appointmentService = new AppointmentService(repos)
    paymentService = new PaymentService(repos, gateway)
    refundService = new RefundService(repos, gateway)
  })

  it('booking creation emits appointment.booked and dispatches WhatsApp notification', async () => {
    const result = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1', // Fade & Beard
      date: '2026-09-25',
      time: '14:00',
      customer: {
        name: 'Sipho Zulu',
        phone: '082 999 8888',
        email: 'sipho@zulu.co.za',
      },
      reminderChannel: 'whatsapp',
      paymentMethod: 'cash',
    })

    expect(result.appointment).toBeDefined()
    expect(result.bookingReference).toBeDefined()

    // Verify WhatsApp adapter was triggered
    expect(waAdapter.dispatches.length).toBe(1)
    const dispatch = waAdapter.dispatches[0]
    expect(dispatch.recipient).toBe('+27829998888')
    expect(dispatch.body).toContain(result.bookingReference)
    expect(dispatch.body).toContain('Sipho Zulu')

    // Verify database log entry was created with status 'sent'
    const logs = await repos.notifications.listByAppointment(result.appointment.id)
    expect(logs.length).toBe(1)
    expect(logs[0].status).toBe('sent')
    expect(logs[0].channel).toBe('whatsapp')
    expect(logs[0].eventType).toBe('booking_confirmed')
  })

  it('appointment cancellation emits appointment.cancelled and dispatches notification', async () => {
    const booking = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      date: '2026-09-28',
      time: '10:00',
      customer: {
        name: 'Vusi Khoza',
        phone: '071 888 7777',
      },
      reminderChannel: 'sms',
      paymentMethod: 'cash',
    })

    // Clear SMS dispatches from booking confirmation
    smsAdapter.clear()

    const cancelResult = await appointmentService.cancelAppointment(
      booking.appointment.id,
      'salon',
      booking.bookingReference
    )

    expect(cancelResult.appointment?.status).toBe('cancelled')

    // Verify SMS notification was dispatched for cancellation
    expect(smsAdapter.dispatches.length).toBe(1)
    const dispatch = smsAdapter.dispatches[0]
    expect(dispatch.recipient).toBe('+27718887777')
    expect(dispatch.body).toContain('Cancelled')
    expect(dispatch.body).toContain(booking.bookingReference)

    const logs = await repos.notifications.listByAppointment(booking.appointment.id)
    const cancelLog = logs.find(l => l.eventType === 'appointment_cancelled')
    expect(cancelLog).toBeDefined()
    expect(cancelLog?.status).toBe('sent')
  })

  it('recording a payment emits payment.received and dispatches receipt', async () => {
    const booking = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      date: '2026-09-29',
      time: '11:00',
      customer: {
        name: 'Nandi Sithole',
        phone: '083 777 6666',
        email: 'nandi@gmail.com',
      },
      reminderChannel: 'whatsapp',
      paymentMethod: 'cash',
    })

    emailAdapter.clear()

    // Record salon payment
    await paymentService.recordPayment({
      tenantId: TEST_TENANT_ID,
      appointmentId: booking.appointment.id,
      amount: 150,
      method: 'card',
      providerReference: 'TXN-CARD-1234',
    })

    // Email adapter should receive payment receipt
    expect(emailAdapter.dispatches.length).toBe(1)
    const dispatch = emailAdapter.dispatches[0]
    expect(dispatch.recipient).toBe('nandi@gmail.com')
    expect(dispatch.subject).toContain('Payment Receipt')
    expect(dispatch.body).toContain('R150.00')
  })

  it('CRITICAL INVARIANT: external notification provider failure NEVER breaks booking creation', async () => {
    // Simulate total network breakdown on all adapters
    waAdapter.simulatedError = { message: 'Meta Cloud API 500 Server Error', isTransient: true }
    emailAdapter.simulatedError = { message: 'Resend API Timeout', isTransient: true }
    smsAdapter.simulatedError = { message: 'Carrier Network Down', isTransient: true }

    // Booking must still succeed completely!
    const booking = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      date: '2026-09-30',
      time: '15:00',
      customer: {
        name: 'Bongani Mthembu',
        phone: '084 666 5555',
      },
      reminderChannel: 'whatsapp',
      paymentMethod: 'cash',
    })

    expect(booking.appointment.status).toBe('confirmed')
    expect(booking.bookingReference).toBeDefined()

    // Notification is logged as failed, but appointment is preserved
    const logs = await repos.notifications.listByAppointment(booking.appointment.id)
    expect(logs.length).toBe(1)
    expect(logs[0].status).toBe('failed')
    expect(logs[0].failReason).toContain('Meta Cloud API 500')
  })
})
