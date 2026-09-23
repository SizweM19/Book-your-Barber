/**
 * Notification Provider Adapter Types & Contracts.
 * 
 * Invariants:
 * - Adapters are stateless gateways to external communication networks.
 * - Return standardized ProviderSendResult so services don't depend on proprietary response schemas.
 * - Error classification flags transient vs permanent failures.
 */

import type { NotificationChannel } from '@/domains/notifications/types'

export interface OutboundMessage {
  tenantId: string
  recipient: string // Normalized E.164 phone or lowercase email
  recipientName?: string
  subject?: string
  body: string
  whatsappTemplateName?: string
  whatsappParameters?: string[]
  metadata?: Record<string, unknown>
}

export interface ProviderSendResult {
  success: boolean
  providerName: string
  providerMessageId?: string
  errorMessage?: string
  isTransient?: boolean
  rawResponse?: unknown
}

export interface NotificationProviderAdapter {
  readonly channel: Exclude<NotificationChannel, 'none'>
  readonly providerName: string
  send(message: OutboundMessage): Promise<ProviderSendResult>
}
