/**
 * Support Session Service
 * Enforces strictly bounded, audited platform-admin support access to tenant data.
 */

import { SupportSession, CreateSupportSessionRequest } from '@/domains/support/types';
import { SupportSessionError, ValidationError } from '@/domains/errors/ApplicationError';
import { auditService } from './AuditService';

const MAX_SESSION_MINUTES = 120; // 2 hours hard maximum

export class SupportService {
  private activeSessions: Map<string, SupportSession> = new Map();

  public async startSession(req: CreateSupportSessionRequest): Promise<SupportSession> {
    if (!req.tenantId) {
      throw new ValidationError('Tenant ID is required to start a support session');
    }
    if (!req.platformAdminId) {
      throw new ValidationError('Platform Admin ID is required');
    }
    if (!req.reason || req.reason.trim().length < 10) {
      throw new ValidationError('A detailed reason (minimum 10 characters) is required for tenant support access');
    }

    const duration = Math.min(Math.max(req.durationMinutes || 30, 5), MAX_SESSION_MINUTES);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

    const sessionId = 'supp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    const session: SupportSession = {
      id: sessionId,
      tenantId: req.tenantId,
      platformAdminId: req.platformAdminId,
      reason: req.reason.trim(),
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
    };

    const audit = await auditService.log({
      tenantId: req.tenantId,
      actorId: req.platformAdminId,
      actorRole: 'PLATFORM_ADMIN',
      action: 'SUPPORT_SESSION_START',
      entityType: 'support_session',
      entityId: sessionId,
      metadata: {
        reason: req.reason,
        durationMinutes: duration,
        expiresAt: session.expiresAt,
      },
    });

    session.auditLogId = audit.id;
    this.activeSessions.set(sessionId, session);

    return session;
  }

  public async validateSession(sessionId: string, tenantId: string): Promise<SupportSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new SupportSessionError('Support session not found');
    }

    if (!session.isActive || session.revokedAt) {
      throw new SupportSessionError('Support session has been terminated');
    }

    if (session.tenantId !== tenantId) {
      throw new SupportSessionError('Support session is not valid for this tenant');
    }

    if (new Date(session.expiresAt) <= new Date()) {
      session.isActive = false;
      throw new SupportSessionError('Support session has expired');
    }

    return session;
  }

  public async revokeSession(sessionId: string, adminId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    session.revokedAt = new Date().toISOString();

    await auditService.log({
      tenantId: session.tenantId,
      actorId: adminId,
      actorRole: 'PLATFORM_ADMIN',
      action: 'SUPPORT_SESSION_TERMINATE',
      entityType: 'support_session',
      entityId: sessionId,
    });
  }
}

export const supportService = new SupportService();

