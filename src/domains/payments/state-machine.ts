/**
 * Explicit Payment & Refund State Machine
 * 
 * Rules:
 * - Direct arbitrary transitions are strictly prohibited.
 * - Every transition must be valid according to authoritative business rules.
 */

import type { DomainPaymentStatus, DomainRefundStatus } from './types'

export type TransactionPaymentStatus = 'pending' | 'processing' | 'successful' | 'failed'

export type AppointmentPaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'refundProcessing'
  | 'refunded'
  | 'paymentFailed'

export type OnlinePaymentStep =
  | 'PAYMENT_STARTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'BOOKING_PROCESSING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_PROCESSING_FAILED'

const VALID_TRANSACTION_PAYMENT_TRANSITIONS: Record<TransactionPaymentStatus, TransactionPaymentStatus[]> = {
  pending: ['processing', 'successful', 'failed'],
  processing: ['successful', 'failed'],
  successful: [], // Terminal for an individual payment record (refunds are separate refund records)
  failed: [], // Terminal
}

const VALID_REFUND_TRANSITIONS: Record<DomainRefundStatus, DomainRefundStatus[]> = {
  requested: ['processing', 'completed', 'failed'],
  processing: ['completed', 'failed'],
  completed: [], // Terminal
  failed: ['requested'], // May re-request on failure if recoverable
}

const VALID_APPOINTMENT_PAYMENT_TRANSITIONS: Record<AppointmentPaymentStatus, AppointmentPaymentStatus[]> = {
  unpaid: ['partial', 'paid', 'paymentFailed'],
  partial: ['partial', 'paid', 'refundProcessing'],
  paid: ['refundProcessing'],
  refundProcessing: ['refunded', 'paid', 'partial'],
  refunded: [],
  paymentFailed: ['unpaid', 'partial', 'paid'],
}

const VALID_ONLINE_PAYMENT_TRANSITIONS: Record<OnlinePaymentStep, OnlinePaymentStep[]> = {
  PAYMENT_STARTED: ['PAYMENT_PENDING', 'PAYMENT_FAILED'],
  PAYMENT_PENDING: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED'],
  PAYMENT_SUCCESS: ['BOOKING_PROCESSING'],
  PAYMENT_FAILED: ['PAYMENT_STARTED'],
  BOOKING_PROCESSING: ['BOOKING_CONFIRMED', 'BOOKING_PROCESSING_FAILED'],
  BOOKING_CONFIRMED: [],
  BOOKING_PROCESSING_FAILED: ['BOOKING_PROCESSING'],
}

export function isValidTransactionPaymentTransition(
  from: TransactionPaymentStatus,
  to: TransactionPaymentStatus
): boolean {
  if (from === to) return true
  return VALID_TRANSACTION_PAYMENT_TRANSITIONS[from]?.includes(to) ?? false
}

export function isValidRefundTransition(
  from: DomainRefundStatus,
  to: DomainRefundStatus
): boolean {
  if (from === to) return true
  return VALID_REFUND_TRANSITIONS[from]?.includes(to) ?? false
}

export function isValidAppointmentPaymentTransition(
  from: AppointmentPaymentStatus,
  to: AppointmentPaymentStatus
): boolean {
  if (from === to) return true
  return VALID_APPOINTMENT_PAYMENT_TRANSITIONS[from]?.includes(to) ?? false
}

export function isValidOnlinePaymentTransition(
  from: OnlinePaymentStep,
  to: OnlinePaymentStep
): boolean {
  if (from === to) return true
  return VALID_ONLINE_PAYMENT_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertValidTransactionPaymentTransition(
  from: TransactionPaymentStatus,
  to: TransactionPaymentStatus
): void {
  if (!isValidTransactionPaymentTransition(from, to)) {
    throw new Error(`Invalid payment transition from '${from}' to '${to}'.`)
  }
}

export function assertValidRefundTransition(
  from: DomainRefundStatus,
  to: DomainRefundStatus
): void {
  if (!isValidRefundTransition(from, to)) {
    throw new Error(`Invalid refund transition from '${from}' to '${to}'.`)
  }
}
