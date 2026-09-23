import { describe, it, expect, beforeEach } from 'vitest'
import { NotificationService } from '@/application/services/NotificationService'
import { getRepositories } from '@/infrastructure/repositories/container'
import { NotificationProviderRegistry } from '@/infrastructure/notifications/registry'
import {
  MockEmailAdapter,
  MockWhatsAppAdapter,
  MockSmsAdapter,
} from '@/infrastructure/notifications/adapters/MockAdapters'

describe('Notification Application Service', () => {
  let repos: ReturnType<typeof getRepositories>
  let registry: NotificationProviderRegistry
  let emailAdapter: MockEmailAdapter
  let waAdapter: MockWhatsAppAdapter
  let smsAdapter: MockSmsAdapter
  let service: NotificationService

  beforeEach(() => {
    repos = getRepositories('mock')
    registry = new NotificationProviderRegistry()

    emailAdapter = new MockEmailAdapter()
    waAdapter = new MockWhatsAppAdapter()
    smsAdapter = new MockSmsAdapter()

    registry.setAdapter('email', emailAdapter)
    registry.setAdapter('whatsapp', waAdapter)
    registry.setAdapter('sms', smsAdapter)

    service = new NotificationService(repos, registry)
  })

  it('dispatches WhatsApp notification successfully and records sent status', async () => {
    const log = await service.sendNotification({
      tenantId: 'tenant-1',
      appointmentId: 'appt-1',
      customerId: 'cust-1',
      channel: 'whatsapp',
      templateType: 'booking_confirmed',
      recipient: '082 123 4567',
      recipientName: 'Thabo Mokoena',
      variables: {
        customer_name: 'Thabo Mokoena',
        service_name: 'Haircut',
        barber_name: 'Themba',
        appointment_date: '2026-09-20',
        start_time: '10:00',
        duration_minutes: 45,
        booking_reference: 'BYB-1234',
        total_charged: 'R 200.00',
        total_paid: 'R 200.00',
        salon_name: 'Fade & Edge',
      },
    })

    expect(log.status).toBe('sent')
    expect(log.channel).toBe('whatsapp')
    expect(log.recipient).toBe('+27821234567')
    expect(log.providerMessageId).toBeDefined()
    expect(waAdapter.dispatches.length).toBe(1)
    expect(waAdapter.dispatches[0].body).toContain('Booking Confirmed')
  })

  it('records "notRequired" status when channel is "none" without dispatching to adapters', async () => {
    const log = await service.sendNotification({
      tenantId: 'tenant-1',
      appointmentId: 'appt-none',
      channel: 'none',
      templateType: 'booking_confirmed',
      recipient: '',
    })

    expect(log.status).toBe('notRequired')
    expect(waAdapter.dispatches.length).toBe(0)
    expect(smsAdapter.dispatches.length).toBe(0)
    expect(emailAdapter.dispatches.length).toBe(0)
  })

  it('records "failed" status on invalid recipient without throwing runtime exception', async () => {
    const log = await service.sendNotification({
      tenantId: 'tenant-1',
      appointmentId: 'appt-bad-phone',
      channel: 'whatsapp',
      templateType: 'booking_confirmed',
      recipient: 'invalid-phone-format',
    })

    expect(log.status).toBe('failed')
    expect(log.failReason).toContain('Invalid mobile phone number format')
    expect(waAdapter.dispatches.length).toBe(0)
  })

  it('deduplicates duplicate dispatches via idempotency key', async () => {
    const payload = {
      tenantId: 'tenant-1',
      appointmentId: 'appt-idemp-1',
      channel: 'email' as const,
      templateType: 'booking_confirmed' as const,
      recipient: 'thabo@gmail.com',
      idempotencyKey: 'idemp_key_unique_123',
      variables: {
        customer_name: 'Thabo',
        booking_reference: 'BYB-IDEMP',
        service_name: 'Haircut',
      },
    }

    const first = await service.sendNotification(payload)
    const second = await service.sendNotification(payload)

    expect(first.id).toBe(second.id)
    expect(emailAdapter.dispatches.length).toBe(1)
  })

  it('uses custom template when defined by tenant instead of default copy', async () => {
    await repos.templates.upsert({
      tenantId: 'tenant-custom',
      templateType: 'booking_confirmed',
      channel: 'sms',
      content: 'Custom VIP Alert: {{customer_name}}, you are booked on {{appointment_date}} at {{start_time}}!',
      active: true,
    })

    const log = await service.sendNotification({
      tenantId: 'tenant-custom',
      appointmentId: 'appt-custom',
      channel: 'sms',
      templateType: 'booking_confirmed',
      recipient: '083 456 7890',
      variables: {
        customer_name: 'Sanele Khumalo',
        appointment_date: '2026-09-22',
        start_time: '15:00',
      },
    })

    expect(log.status).toBe('sent')
    expect(smsAdapter.dispatches.length).toBe(1)
    expect(smsAdapter.dispatches[0].body).toBe(
      'Custom VIP Alert: Sanele Khumalo, you are booked on 2026-09-22 at 15:00!'
    )
  })

  it('handles transient adapter failure by setting status "failed" with nextRetryAt scheduled', async () => {
    waAdapter.simulatedError = {
      message: 'Gateway rate limit exceeded (429)',
      isTransient: true,
    }

    const log = await service.sendNotification({
      tenantId: 'tenant-1',
      appointmentId: 'appt-retry-test',
      channel: 'whatsapp',
      templateType: 'booking_confirmed',
      recipient: '071 234 5678',
    })

    expect(log.status).toBe('failed')
    expect(log.failReason).toContain('429')
    expect(log.retryCount).toBe(1)
    expect(log.nextRetryAt).toBeDefined()
  })

  it('allows manual retry of a failed notification', async () => {
    // 1. Initial failure
    emailAdapter.simulatedError = { message: 'Network timeout', isTransient: true }
    const initialLog = await service.sendNotification({
      tenantId: 'tenant-1',
      appointmentId: 'appt-manual-retry',
      channel: 'email',
      templateType: 'booking_confirmed',
      recipient: 'lerato@gmail.com',
    })
    expect(initialLog.status).toBe('failed')

    // 2. Clear simulated error (network recovered)
    emailAdapter.simulatedError = null

    // 3. Trigger manual retry
    const retriedLog = await service.retryNotification(initialLog.id)
    expect(retriedLog.status).toBe('sent')
    expect(retriedLog.retryCount).toBe(2)
    expect(retriedLog.providerMessageId).toBeDefined()
  })
})
