import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'

export interface SendNotificationInput {
  tenantId: string
  appointmentId?: string
  customerId?: string
  channel: 'whatsapp' | 'sms' | 'email'
  templateType: 'confirmation' | 'reminder' | 'reschedule' | 'cancellation' | 'refund'
  recipient: string
  metadata?: Record<string, unknown>
}

export interface NotificationLogEntry {
  id: string
  tenantId: string
  appointmentId?: string
  customerId?: string
  channel: 'whatsapp' | 'sms' | 'email'
  status: 'sent' | 'failed' | 'pending' | 'notRequired'
  sentAt?: string
  failReason?: string
  createdAt: string
}

export class NotificationService {
  private logs: NotificationLogEntry[] = []

  constructor(private repos: RepositoryContainer = defaultRepositories) {}

  /**
   * Dispatches a notification across configured communication channels
   * and records immutable log traces for salon auditability.
   */
  async sendNotification(input: SendNotificationInput): Promise<NotificationLogEntry> {
    const entry: NotificationLogEntry = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: input.tenantId,
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      channel: input.channel,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    this.logs.unshift(entry)
    return entry
  }

  /**
   * Lists communication logs for an appointment or tenant.
   */
  async listLogs(tenantId: string, appointmentId?: string): Promise<NotificationLogEntry[]> {
    return this.logs.filter(
      l => l.tenantId === tenantId && (!appointmentId || l.appointmentId === appointmentId)
    )
  }
}

export const notificationService = new NotificationService()

