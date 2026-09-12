/**
 * Audit Logging Domain Models
 * BookYourBarber Production Foundation
 */

export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_REGISTER'
  | 'AUTH_PASSWORD_RESET'
  | 'APPOINTMENT_CREATE'
  | 'APPOINTMENT_RESCHEDULE'
  | 'APPOINTMENT_CANCEL'
  | 'APPOINTMENT_COMPLETE'
  | 'PAYMENT_CHARGE'
  | 'PAYMENT_REFUND'
  | 'STAFF_CREATE'
  | 'STAFF_UPDATE'
  | 'STAFF_DELETE'
  | 'SERVICE_CREATE'
  | 'SERVICE_UPDATE'
  | 'SETTINGS_UPDATE'
  | 'SUPPORT_SESSION_START'
  | 'SUPPORT_SESSION_TERMINATE';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilter {
  tenantId: string;
  action?: AuditAction;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

