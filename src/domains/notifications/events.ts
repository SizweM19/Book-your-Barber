/**
 * Domain Events for Book-Your-Barber.
 * 
 * Invariants:
 * - Domain events are immutable value objects.
 * - Events carry sufficient context for decoupled subscribers (e.g. notifications, audit, analytics)
 *   without requiring immediate synchronous entity lookups.
 */

import type { NotificationChannel } from './types'

export interface BaseDomainEvent {
  readonly eventId: string
  readonly timestamp: string
  readonly tenantId: string
}

export interface AppointmentBookedEvent extends BaseDomainEvent {
  readonly type: 'appointment.booked'
  readonly appointmentId: string
  readonly bookingReference: string
  readonly customerId: string
  readonly customerName: string
  readonly customerPhone: string
  readonly customerEmail?: string
  readonly serviceId: string
  readonly serviceName: string
  readonly staffId?: string
  readonly staffName?: string
  readonly appointmentDate: string
  readonly startTime: string
  readonly durationMinutes: number
  readonly totalCharged: number
  readonly totalPaid: number
  readonly reminderChannel: NotificationChannel
  readonly bookingSource: 'online' | 'qr' | 'manual'
  readonly salonName: string
  readonly salonAddress?: string
  readonly salonPhone?: string
}

export interface AppointmentCancelledEvent extends BaseDomainEvent {
  readonly type: 'appointment.cancelled'
  readonly appointmentId: string
  readonly bookingReference: string
  readonly customerId: string
  readonly customerName: string
  readonly customerPhone: string
  readonly customerEmail?: string
  readonly serviceName: string
  readonly appointmentDate: string
  readonly startTime: string
  readonly cancelledBy: 'customer' | 'salon'
  readonly feePercent: number
  readonly feeAmount: number
  readonly refundAmount: number
  readonly reminderChannel: NotificationChannel
  readonly salonName: string
}

export interface AppointmentRescheduledEvent extends BaseDomainEvent {
  readonly type: 'appointment.rescheduled'
  readonly appointmentId: string
  readonly bookingReference: string
  readonly customerId: string
  readonly customerName: string
  readonly customerPhone: string
  readonly customerEmail?: string
  readonly serviceName: string
  readonly staffName?: string
  readonly oldDate: string
  readonly oldTime: string
  readonly newDate: string
  readonly newTime: string
  readonly reminderChannel: NotificationChannel
  readonly salonName: string
  readonly salonAddress?: string
}

export interface PaymentReceivedEvent extends BaseDomainEvent {
  readonly type: 'payment.received'
  readonly appointmentId: string
  readonly bookingReference: string
  readonly customerId: string
  readonly customerName: string
  readonly customerEmail?: string
  readonly customerPhone?: string
  readonly amount: number
  readonly method: string
  readonly remainingBalance: number
  readonly providerReference?: string
  readonly reminderChannel: NotificationChannel
  readonly salonName: string
}

export interface RefundProcessedEvent extends BaseDomainEvent {
  readonly type: 'refund.processed'
  readonly appointmentId: string
  readonly bookingReference: string
  readonly refundReference: string
  readonly customerId: string
  readonly customerName: string
  readonly customerEmail?: string
  readonly customerPhone?: string
  readonly originalAmount: number
  readonly refundAmount: number
  readonly feeAmount: number
  readonly status: 'completed' | 'failed'
  readonly failureReason?: string
  readonly reminderChannel: NotificationChannel
  readonly salonName: string
}

export interface ReminderDueEvent extends BaseDomainEvent {
  readonly type: 'reminder.due'
  readonly window: '24h' | '2h'
  readonly appointmentId: string
  readonly bookingReference: string
  readonly customerId: string
  readonly customerName: string
  readonly customerPhone: string
  readonly customerEmail?: string
  readonly serviceName: string
  readonly staffName?: string
  readonly appointmentDate: string
  readonly startTime: string
  readonly reminderChannel: NotificationChannel
  readonly salonName: string
  readonly salonAddress?: string
  readonly salonPhone?: string
}

export type DomainEvent =
  | AppointmentBookedEvent
  | AppointmentCancelledEvent
  | AppointmentRescheduledEvent
  | PaymentReceivedEvent
  | RefundProcessedEvent
  | ReminderDueEvent
