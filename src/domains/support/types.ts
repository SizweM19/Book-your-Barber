/**
 * Controlled Support Session Domain Models
 * Allows Platform Admins to provide time-limited, audited assistance to tenants.
 */

export interface SupportSession {
  id: string;
  tenantId: string;
  platformAdminId: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  revokedAt?: string;
  isActive: boolean;
  auditLogId?: string;
}

export interface CreateSupportSessionRequest {
  tenantId: string;
  platformAdminId: string;
  reason: string;
  durationMinutes?: number;
}

