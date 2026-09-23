/**
 * Notification Domain Types & Contracts.
 * 
 * Invariants:
 * - Channel choices are strictly WhatsApp, SMS, Email, or None.
 * - Delivery status is strictly separated from appointment, payment, and refund statuses.
 * - All monetary representations in notification payloads must be pre-formatted ZAR strings.
 */

export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'none'

export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'notRequired'

export type NotificationEventType =
  | 'booking_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'payment_received'
  | 'refund_processed'
  | 'reminder_24h'
  | 'reminder_2h'

export interface RecipientInfo {
  name: string
  phone?: string
  email?: string
}

export interface OutboundNotificationPayload {
  tenantId: string
  appointmentId?: string
  customerId?: string
  eventType: NotificationEventType
  channel: Exclude<NotificationChannel, 'none'>
  recipient: string // E.164 phone or valid email
  recipientName: string
  subject?: string // Required for email
  content: string
  templateName?: string
  templateVariables?: Record<string, string>
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface NotificationLog {
  id: string
  tenantId: string
  appointmentId?: string
  customerId?: string
  eventType: NotificationEventType
  channel: NotificationChannel
  recipient: string
  subject?: string
  content: string
  status: NotificationStatus
  providerName: string
  providerMessageId?: string
  idempotencyKey?: string
  retryCount: number
  maxRetries: number
  nextRetryAt?: string
  sentAt?: string
  deliveredAt?: string
  failReason?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
