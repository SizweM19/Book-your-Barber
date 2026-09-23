/**
 * Notification Application Service.
 * 
 * Invariants:
 * - Orchestrates template resolution, recipient validation, and outbound delivery.
 * - Idempotent: Duplicate requests return existing logs without duplicate dispatches.
 * - Fault Isolated: External provider failures NEVER throw uncaught errors to core operations.
 * - Records full audit history and schedules retries for transient errors.
 */

import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type {
  NotificationChannel,
  NotificationStatus,
  NotificationEventType,
} from '@/domains/notifications/types'
import {
  validateRecipient,
  calculateBackoffDelaySeconds,
  generateNotificationIdempotencyKey,
  MAX_NOTIFICATION_RETRIES,
} from '@/domains/notifications/rules'
import { renderNotificationMessage } from '@/domains/notifications/templates/engine'
import { DEFAULT_TEMPLATES } from '@/domains/notifications/templates/defaults'
import type {
  NotificationProviderRegistry,
} from '@/infrastructure/notifications/registry'
import { notificationProviderRegistry as defaultRegistry } from '@/infrastructure/notifications/registry'
import type { NotificationLogEntity } from '@/application/repositories/interfaces'
import { eventBus as defaultEventBus, type DomainEventBus } from './EventBus'
import type {
  AppointmentBookedEvent,
  AppointmentCancelledEvent,
  AppointmentRescheduledEvent,
  PaymentReceivedEvent,
  RefundProcessedEvent,
  ReminderDueEvent,
} from '@/domains/notifications/events'
import { formatZAR } from '@/domains/payments/money'

export interface SendNotificationInput {
  tenantId: string
  appointmentId?: string
  customerId?: string
  channel: NotificationChannel
  templateType: NotificationEventType | 'confirmation' | 'reminder' | 'reschedule' | 'cancellation' | 'refund'
  recipient: string
  recipientName?: string
  subject?: string
  variables?: Record<string, string | number | undefined>
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}

export type NotificationLogEntry = NotificationLogEntity

export class NotificationService {
  constructor(
    private repos: RepositoryContainer = defaultRepositories,
    private registry: NotificationProviderRegistry = defaultRegistry
  ) {}

  /**
   * Normalizes legacy template type strings into standard NotificationEventType.
   */
  private normalizeTemplateType(
    rawType: SendNotificationInput['templateType']
  ): NotificationEventType {
    switch (rawType) {
      case 'confirmation':
        return 'booking_confirmed'
      case 'cancellation':
        return 'appointment_cancelled'
      case 'reschedule':
        return 'appointment_rescheduled'
      case 'refund':
        return 'refund_processed'
      case 'reminder':
        return 'reminder_24h'
      default:
        return rawType
    }
  }

  /**
   * Dispatches a notification across configured communication channels
   * and records immutable log traces for salon auditability.
   */
  async sendNotification(input: SendNotificationInput): Promise<NotificationLogEntry> {
    const eventType = this.normalizeTemplateType(input.templateType)

    // Channel: 'none' -> mark notRequired immediately
    if (input.channel === 'none') {
      return this.repos.notifications.create({
        tenantId: input.tenantId,
        appointmentId: input.appointmentId,
        customerId: input.customerId,
        eventType,
        channel: 'none',
        recipient: input.recipient || 'none',
        subject: input.subject,
        content: 'No notification requested.',
        status: 'notRequired',
        providerName: 'none',
        retryCount: 0,
        maxRetries: 0,
        metadata: input.metadata,
      })
    }

    // 1. Validate Recipient
    const recipientValidation = validateRecipient(input.channel, input.recipient)
    if (!recipientValidation.isValid) {
      return this.repos.notifications.create({
        tenantId: input.tenantId,
        appointmentId: input.appointmentId,
        customerId: input.customerId,
        eventType,
        channel: input.channel,
        recipient: input.recipient,
        subject: input.subject,
        content: 'Validation failed before rendering.',
        status: 'failed',
        providerName: 'none',
        failReason: recipientValidation.error || 'Invalid recipient format.',
        retryCount: 0,
        maxRetries: 0,
        metadata: input.metadata,
      })
    }

    const normalizedRecipient = recipientValidation.normalized

    // 2. Idempotency Check
    const idempotencyKey =
      input.idempotencyKey ||
      (input.appointmentId
        ? generateNotificationIdempotencyKey(input.tenantId, input.appointmentId, eventType, input.channel)
        : undefined)

    if (idempotencyKey) {
      const existing = await this.repos.notifications.findByIdempotencyKey(idempotencyKey)
      if (existing) {
        return existing
      }
    }

    // 3. Resolve Template (custom tenant template or default system template)
    const customTemplate = await this.repos.templates.findByTypeAndChannel(
      input.tenantId,
      eventType,
      input.channel
    )

    const defaultDefinition = DEFAULT_TEMPLATES[eventType]?.[input.channel] || {
      content: `Notification for ${eventType}. Ref: {{booking_reference}}`,
      subject: `Notification: ${eventType}`,
    }

    const templateContent = customTemplate?.content || defaultDefinition.content
    const subjectTemplate = input.subject || customTemplate?.subject || defaultDefinition.subject
    const whatsappTemplateName =
      customTemplate?.whatsappTemplateName || defaultDefinition.whatsappTemplateName

    // 4. Render Message
    const rendered = renderNotificationMessage({
      channel: input.channel,
      templateContent,
      subjectTemplate,
      variables: input.variables || {},
      whatsappTemplateName,
      whatsappParamOrder: defaultDefinition.whatsappParamOrder,
    })

    // 5. Create Pending Log Entry
    const logEntry = await this.repos.notifications.create({
      tenantId: input.tenantId,
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      eventType,
      channel: input.channel,
      recipient: normalizedRecipient,
      subject: rendered.subject,
      content: rendered.content,
      status: 'pending',
      providerName: 'resolving',
      idempotencyKey,
      retryCount: 0,
      maxRetries: MAX_NOTIFICATION_RETRIES,
      metadata: input.metadata,
    })

    // 6. Deliver via Adapter
    try {
      const adapter = this.registry.getAdapter(input.channel)
      const sendResult = await adapter.send({
        tenantId: input.tenantId,
        recipient: normalizedRecipient,
        recipientName: input.recipientName,
        subject: rendered.subject,
        body: rendered.content,
        whatsappTemplateName: rendered.whatsappTemplateName,
        whatsappParameters: rendered.whatsappParameters,
        metadata: input.metadata,
      })

      if (sendResult.success) {
        return this.repos.notifications.updateStatus(logEntry.id, {
          status: 'sent',
          providerMessageId: sendResult.providerMessageId,
          sentAt: new Date().toISOString(),
        })
      } else {
        const isTransient = sendResult.isTransient ?? true
        const nextRetryAt = isTransient
          ? new Date(Date.now() + calculateBackoffDelaySeconds(1) * 1000).toISOString()
          : undefined

        return this.repos.notifications.updateStatus(logEntry.id, {
          status: 'failed',
          failReason: sendResult.errorMessage || 'Unknown delivery failure.',
          retryCount: 1,
          nextRetryAt,
        })
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Unexpected error during notification dispatch.'
      const nextRetryAt = new Date(Date.now() + calculateBackoffDelaySeconds(1) * 1000).toISOString()

      return this.repos.notifications.updateStatus(logEntry.id, {
        status: 'failed',
        failReason: errorMsg,
        retryCount: 1,
        nextRetryAt,
      })
    }
  }

  /**
   * Manually retries a failed notification (Spec Requirement 11).
   */
  async retryNotification(id: string): Promise<NotificationLogEntry> {
    const log = await this.repos.notifications.findById(id)
    if (!log) {
      throw new Error('Notification record not found.')
    }

    if (log.channel === 'none') {
      return log
    }

    const adapter = this.registry.getAdapter(log.channel)
    const newRetryCount = (log.retryCount || 0) + 1

    try {
      const result = await adapter.send({
        tenantId: log.tenantId,
        recipient: log.recipient,
        subject: log.subject,
        body: log.content,
        metadata: log.metadata,
      })

      if (result.success) {
        return this.repos.notifications.updateStatus(id, {
          status: 'sent',
          providerMessageId: result.providerMessageId,
          sentAt: new Date().toISOString(),
          retryCount: newRetryCount,
          nextRetryAt: undefined,
          failReason: undefined,
        })
      } else {
        const isTransient = result.isTransient ?? true
        const canRetryAgain = isTransient && newRetryCount < log.maxRetries
        const nextRetryAt = canRetryAgain
          ? new Date(Date.now() + calculateBackoffDelaySeconds(newRetryCount) * 1000).toISOString()
          : undefined

        return this.repos.notifications.updateStatus(id, {
          status: 'failed',
          failReason: result.errorMessage || 'Retry failed.',
          retryCount: newRetryCount,
          nextRetryAt,
        })
      }
    } catch (err: any) {
      return this.repos.notifications.updateStatus(id, {
        status: 'failed',
        failReason: err?.message || 'Exception during notification retry.',
        retryCount: newRetryCount,
      })
    }
  }

  /**
   * Processes all pending retries that have reached their scheduled retry time.
   */
  async processPendingRetries(limit = 20): Promise<{ processed: number; succeeded: number; failed: number }> {
    const pending = await this.repos.notifications.listPendingRetries(limit)
    let succeeded = 0
    let failed = 0

    for (const log of pending) {
      try {
        const result = await this.retryNotification(log.id)
        if (result.status === 'sent') {
          succeeded++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return { processed: pending.length, succeeded, failed }
  }

  /**
   * Lists communication logs for an appointment or tenant.
   */
  async listLogs(tenantId: string, appointmentId?: string): Promise<NotificationLogEntry[]> {
    if (appointmentId) {
      return this.repos.notifications.listByAppointment(appointmentId)
    }
    return this.repos.notifications.listByTenant(tenantId)
  }

  /**
   * Subscribes this service to core domain events published through DomainEventBus.
   */
  registerEventHandlers(bus: DomainEventBus = defaultEventBus): () => void {
    const unsubs: (() => void)[] = []

    // 1. Appointment Booked
    unsubs.push(
      bus.subscribe<AppointmentBookedEvent>('appointment.booked', async evt => {
        const recipientContact = evt.reminderChannel === 'email' ? evt.customerEmail : evt.customerPhone
        if (!recipientContact) return

        await this.sendNotification({
          tenantId: evt.tenantId,
          appointmentId: evt.appointmentId,
          customerId: evt.customerId,
          channel: evt.reminderChannel,
          templateType: 'booking_confirmed',
          recipient: recipientContact,
          recipientName: evt.customerName,
          variables: {
            customer_name: evt.customerName,
            service_name: evt.serviceName,
            barber_name: evt.staffName || 'Any Barber',
            appointment_date: evt.appointmentDate,
            start_time: evt.startTime,
            duration_minutes: evt.durationMinutes,
            booking_reference: evt.bookingReference,
            total_charged: formatZAR(evt.totalCharged),
            total_paid: formatZAR(evt.totalPaid),
            salon_name: evt.salonName,
            salon_address: evt.salonAddress || '',
            salon_phone: evt.salonPhone || '',
            manage_url: `https://bookyourbarber.co.za/book/guest?ref=${evt.bookingReference}`,
          },
        })
      })
    )

    // 2. Appointment Cancelled
    unsubs.push(
      bus.subscribe<AppointmentCancelledEvent>('appointment.cancelled', async evt => {
        const recipientContact = evt.reminderChannel === 'email' ? evt.customerEmail : evt.customerPhone
        if (!recipientContact) return

        const refundSummary =
          evt.refundAmount > 0
            ? `Refund: ${formatZAR(evt.refundAmount)} (Fee: ${formatZAR(evt.feeAmount)}).`
            : 'No refund applicable.'

        await this.sendNotification({
          tenantId: evt.tenantId,
          appointmentId: evt.appointmentId,
          customerId: evt.customerId,
          channel: evt.reminderChannel,
          templateType: 'appointment_cancelled',
          recipient: recipientContact,
          recipientName: evt.customerName,
          variables: {
            customer_name: evt.customerName,
            booking_reference: evt.bookingReference,
            service_name: evt.serviceName,
            appointment_date: evt.appointmentDate,
            start_time: evt.startTime,
            cancelled_by: evt.cancelledBy,
            cancellation_fee: formatZAR(evt.feeAmount),
            refund_amount: formatZAR(evt.refundAmount),
            refund_status: evt.refundAmount > 0 ? 'Requested' : 'None',
            refund_summary: refundSummary,
            salon_name: evt.salonName,
          },
        })
      })
    )

    // 3. Appointment Rescheduled
    unsubs.push(
      bus.subscribe<AppointmentRescheduledEvent>('appointment.rescheduled', async evt => {
        const recipientContact = evt.reminderChannel === 'email' ? evt.customerEmail : evt.customerPhone
        if (!recipientContact) return

        await this.sendNotification({
          tenantId: evt.tenantId,
          appointmentId: evt.appointmentId,
          customerId: evt.customerId,
          channel: evt.reminderChannel,
          templateType: 'appointment_rescheduled',
          recipient: recipientContact,
          recipientName: evt.customerName,
          variables: {
            customer_name: evt.customerName,
            service_name: evt.serviceName,
            barber_name: evt.staffName || 'Your Barber',
            booking_reference: evt.bookingReference,
            old_date: evt.oldDate,
            old_time: evt.oldTime,
            new_date: evt.newDate,
            new_time: evt.newTime,
            salon_name: evt.salonName,
            salon_address: evt.salonAddress || '',
            manage_url: `https://bookyourbarber.co.za/book/guest?ref=${evt.bookingReference}`,
          },
        })
      })
    )

    // 4. Payment Received
    unsubs.push(
      bus.subscribe<PaymentReceivedEvent>('payment.received', async evt => {
        // Receipts default to Email if available, otherwise selected reminderChannel
        const channel: NotificationChannel = evt.customerEmail ? 'email' : evt.reminderChannel
        const recipientContact = channel === 'email' ? evt.customerEmail : evt.customerPhone
        if (!recipientContact) return

        await this.sendNotification({
          tenantId: evt.tenantId,
          appointmentId: evt.appointmentId,
          customerId: evt.customerId,
          channel,
          templateType: 'payment_received',
          recipient: recipientContact,
          recipientName: evt.customerName,
          variables: {
            customer_name: evt.customerName,
            booking_reference: evt.bookingReference,
            amount_paid: formatZAR(evt.amount),
            payment_method: evt.method.toUpperCase(),
            outstanding_balance: formatZAR(evt.remainingBalance),
            receipt_ref: evt.providerReference || `PAY-${evt.bookingReference}`,
            salon_name: evt.salonName,
          },
        })
      })
    )

    // 5. Refund Processed
    unsubs.push(
      bus.subscribe<RefundProcessedEvent>('refund.processed', async evt => {
        const channel: NotificationChannel = evt.customerEmail ? 'email' : evt.reminderChannel
        const recipientContact = channel === 'email' ? evt.customerEmail : evt.customerPhone
        if (!recipientContact) return

        await this.sendNotification({
          tenantId: evt.tenantId,
          appointmentId: evt.appointmentId,
          customerId: evt.customerId,
          channel,
          templateType: 'refund_processed',
          recipient: recipientContact,
          recipientName: evt.customerName,
          variables: {
            customer_name: evt.customerName,
            booking_reference: evt.bookingReference,
            refund_reference: evt.refundReference,
            refund_amount: formatZAR(evt.refundAmount),
            refund_status: evt.status === 'completed' ? 'Completed' : 'Failed',
            salon_name: evt.salonName,
          },
        })
      })
    )

    // 6. Reminder Due (24h or 2h)
    unsubs.push(
      bus.subscribe<ReminderDueEvent>('reminder.due', async evt => {
        const recipientContact = evt.reminderChannel === 'email' ? evt.customerEmail : evt.customerPhone
        if (!recipientContact) return

        const templateType: NotificationEventType = evt.window === '24h' ? 'reminder_24h' : 'reminder_2h'

        await this.sendNotification({
          tenantId: evt.tenantId,
          appointmentId: evt.appointmentId,
          customerId: evt.customerId,
          channel: evt.reminderChannel,
          templateType,
          recipient: recipientContact,
          recipientName: evt.customerName,
          variables: {
            customer_name: evt.customerName,
            service_name: evt.serviceName,
            barber_name: evt.staffName || 'Your Barber',
            appointment_date: evt.appointmentDate,
            start_time: evt.startTime,
            booking_reference: evt.bookingReference,
            salon_name: evt.salonName,
            salon_address: evt.salonAddress || '',
            salon_phone: evt.salonPhone || '',
            manage_url: `https://bookyourbarber.co.za/book/guest?ref=${evt.bookingReference}`,
          },
        })
      })
    )

    return () => {
      unsubs.forEach(u => u())
    }
  }
}

export const notificationService = new NotificationService()

// Auto-register domain event handlers on default bus
notificationService.registerEventHandlers(defaultEventBus)
