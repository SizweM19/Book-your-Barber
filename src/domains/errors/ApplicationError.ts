/**
 * Domain & Application Error Hierarchy
 * BookYourBarber Production Foundation
 */

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'TENANT_ACCESS_DENIED'
  | 'VALIDATION_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'PAYMENT_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SUPPORT_SESSION_EXPIRED';

export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code: ErrorCode = 'INTERNAL_ERROR',
    details?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required to access this resource', details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHENTICATED', details);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message = 'You do not have permission to perform this action', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class TenantAccessError extends ApplicationError {
  constructor(tenantId?: string, message = 'Access to this salon tenant is restricted') {
    super(message, 403, 'TENANT_ACCESS_DENIED', tenantId ? { tenantId } : undefined);
  }
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export class ValidationError extends ApplicationError {
  public readonly validationErrors: ValidationErrorItem[];

  constructor(message = 'Invalid input parameters provided', validationErrors: ValidationErrorItem[] = []) {
    super(message, 400, 'VALIDATION_FAILED', { validationErrors });
    this.validationErrors = validationErrors;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource = 'Resource', id?: string) {
    super(`${resource}${id ? ` with id '${id}'` : ''} was not found`, 404, 'RESOURCE_NOT_FOUND', id ? { id } : undefined);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message = 'A conflict occurred with an existing resource', details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class PaymentError extends ApplicationError {
  constructor(message = 'Payment processing failed', details?: Record<string, unknown>) {
    super(message, 402, 'PAYMENT_FAILED', details);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message = 'Too many requests. Please slow down and try again shortly.') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class SupportSessionError extends ApplicationError {
  constructor(message = 'Support session has expired or is invalid') {
    super(message, 403, 'SUPPORT_SESSION_EXPIRED');
  }
}

/**
 * Sanitizes and safely converts any thrown error into a user-friendly string.
 * Ensures zero database credentials, stack traces, or internal server internals leak to users.
 */
export function toUserFacingMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    if (error.validationErrors && error.validationErrors.length > 0) {
      return error.validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
    }
    return error.message;
  }

  if (error instanceof NotFoundError) {
    return error.message;
  }

  if (error instanceof ConflictError) {
    return error.message;
  }

  if (error instanceof AuthenticationError) {
    return 'Please sign in to continue.';
  }

  if (error instanceof AuthorizationError || error instanceof TenantAccessError) {
    return 'You do not have authorization to view or change this information.';
  }

  if (error instanceof PaymentError) {
    return error.message || 'Payment could not be processed. Please check your card or select cash payment.';
  }

  if (error instanceof RateLimitError) {
    return error.message;
  }

  if (error instanceof ApplicationError && error.isOperational) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
}

