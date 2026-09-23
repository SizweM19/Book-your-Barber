/**
 * Audit Service
 * Centralized compliance and operational tracking with automatic sensitive data redaction.
 */

import { AuditAction, AuditLogEntry, AuditLogFilter } from '@/domains/audit/types';

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'token',
  'authorization',
  'cvv',
  'cvc',
  'cardnumber',
  'card_number',
  'apikey',
  'api_key',
  'cookie',
]);

export function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey) || normalizedKey.includes('password') || normalizedKey.includes('secret')) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export class AuditService {
  private logs: AuditLogEntry[] = [];

  public async log(params: {
    tenantId: string;
    actorId: string;
    actorRole: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEntry> {
    const sanitizedChanges = params.changes
      ? {
          before: redactSensitiveData(params.changes.before) as Record<string, unknown>,
          after: redactSensitiveData(params.changes.after) as Record<string, unknown>,
        }
      : undefined;

    const sanitizedMetadata = params.metadata
      ? (redactSensitiveData(params.metadata) as Record<string, unknown>)
      : undefined;

    const entry: AuditLogEntry = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      tenantId: params.tenantId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      changes: sanitizedChanges,
      metadata: sanitizedMetadata,
      createdAt: new Date().toISOString(),
    };

    this.logs.unshift(entry);
    return entry;
  }

  public async query(filter: AuditLogFilter): Promise<{ entries: AuditLogEntry[]; total: number }> {
    let result = this.logs.filter(entry => entry.tenantId === filter.tenantId);

    if (filter.action) {
      result = result.filter(e => e.action === filter.action);
    }
    if (filter.actorId) {
      result = result.filter(e => e.actorId === filter.actorId);
    }
    if (filter.entityType) {
      result = result.filter(e => e.entityType === filter.entityType);
    }
    if (filter.entityId) {
      result = result.filter(e => e.entityId === filter.entityId);
    }
    if (filter.startDate) {
      result = result.filter(e => e.createdAt >= filter.startDate!);
    }
    if (filter.endDate) {
      result = result.filter(e => e.createdAt <= filter.endDate!);
    }

    const total = result.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;

    return {
      entries: result.slice(offset, offset + limit),
      total,
    };
  }
}

export const auditService = new AuditService();

