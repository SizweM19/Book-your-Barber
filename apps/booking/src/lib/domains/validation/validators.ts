/**
 * Boundary Validators & Input Sanitizers
 * BookYourBarber Production Foundation
 */

import { ValidationError, ValidationErrorItem } from '../errors/ApplicationError';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const SA_PHONE_REGEX = /^(?:\+27|0)[6-8][0-9]{8}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TIME_HH_MM_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const DATE_YYYY_MM_DD_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidSAMobile(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return SA_PHONE_REGEX.test(cleaned);
}

export function formatSAMobile(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    return '+27' + cleaned.substring(1);
  }
  return cleaned;
}

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

export function isValidAmount(cents: unknown): boolean {
  if (typeof cents !== 'number') return false;
  return Number.isInteger(cents) && cents >= 0;
}

export function isValidTimeSlot(startTime: string, endTime: string): boolean {
  if (!TIME_HH_MM_REGEX.test(startTime) || !TIME_HH_MM_REGEX.test(endTime)) {
    return false;
  }
  return startTime < endTime;
}

export function isValidDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  if (!DATE_YYYY_MM_DD_REGEX.test(dateStr)) return false;
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

export function sanitizeInput(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
}

export interface BookingValidationPayload {
  tenantId: string;
  salonSlug: string;
  barberId: string;
  serviceIds: string[];
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: 'cash' | 'card';
}

export function validateBookingRequest(payload: unknown): { isValid: boolean; errors: ValidationErrorItem[] } {
  const errors: ValidationErrorItem[] = [];
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: [{ field: 'root', message: 'Request body must be a valid JSON object' }] };
  }

  const p = payload as Record<string, unknown>;

  if (!p.tenantId && !p.salonSlug) {
    errors.push({ field: 'tenantId', message: 'Tenant ID or salon slug is required' });
  }

  if (!p.barberId || typeof p.barberId !== 'string') {
    errors.push({ field: 'barberId', message: 'A barber must be selected' });
  }

  if (!Array.isArray(p.serviceIds) || p.serviceIds.length === 0) {
    errors.push({ field: 'serviceIds', message: 'At least one service must be selected' });
  }

  if (!isValidDate(p.date)) {
    errors.push({ field: 'date', message: 'A valid booking date (YYYY-MM-DD) is required' });
  }

  if (!p.timeSlot || typeof p.timeSlot !== 'string' || !TIME_HH_MM_REGEX.test(p.timeSlot as string)) {
    errors.push({ field: 'timeSlot', message: 'A valid start time (HH:MM) is required' });
  }

  const sanitizedName = sanitizeInput(p.customerName);
  if (!sanitizedName || sanitizedName.length < 2) {
    errors.push({ field: 'customerName', message: 'Customer name is required (minimum 2 characters)' });
  }

  if (!isValidSAMobile(p.customerPhone)) {
    errors.push({ field: 'customerPhone', message: 'A valid South African mobile number is required (e.g., 0821234567 or +27821234567)' });
  }

  if (p.customerEmail && !isValidEmail(p.customerEmail)) {
    errors.push({ field: 'customerEmail', message: 'Invalid email address format' });
  }

  if (p.paymentMethod !== 'cash' && p.paymentMethod !== 'card') {
    errors.push({ field: 'paymentMethod', message: "Payment method must be 'cash' or 'card'" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function assertValidBookingRequest(payload: unknown): asserts payload is BookingValidationPayload {
  const { isValid, errors } = validateBookingRequest(payload);
  if (!isValid) {
    throw new ValidationError('Booking validation failed', errors);
  }
}

