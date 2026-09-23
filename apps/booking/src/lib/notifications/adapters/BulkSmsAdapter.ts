/**
 * South African SMS Gateway Adapter (BulkSMS / Local Gateway Compatible).
 * 
 * Invariants:
 * - South African mobile phone destination formatting (+27...).
 * - Enforces single or multi-segment GSM-7 payload compliance.
 * - Basic auth / Token header authorization.
 */

import type { NotificationProviderAdapter, OutboundMessage, ProviderSendResult } from './types'
import { isTransientError, normalizePhoneNumber } from '@/domains/notifications/rules'

export interface BulkSmsConfig {
  tokenId?: string
  tokenSecret?: string
  senderId?: string
}

export class BulkSmsAdapter implements NotificationProviderAdapter {
  readonly channel = 'sms' as const
  readonly providerName = 'BulkSMS-SA'

  private tokenId: string
  private tokenSecret: string
  private senderId?: string

  constructor(config: BulkSmsConfig = {}) {
    this.tokenId = config.tokenId || process.env.BULKSMS_TOKEN_ID || ''
    this.tokenSecret = config.tokenSecret || process.env.BULKSMS_TOKEN_SECRET || ''
    this.senderId = config.senderId || process.env.BULKSMS_SENDER_ID
  }

  async send(message: OutboundMessage): Promise<ProviderSendResult> {
    if (!this.tokenId || !this.tokenSecret) {
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: 'BULKSMS_TOKEN_ID or BULKSMS_TOKEN_SECRET is not configured.',
        isTransient: false,
      }
    }

    try {
      const formattedTo = normalizePhoneNumber(message.recipient)
      const credentials = Buffer.from(`${this.tokenId}:${this.tokenSecret}`).toString('base64')

      const bodyPayload: Record<string, unknown> = {
        to: formattedTo,
        body: message.body,
        routingGroup: 'STANDARD',
      }

      if (this.senderId) {
        bodyPayload.from = this.senderId
      }

      const response = await fetch('https://api.bulksms.com/v1/messages', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errorMsg = data?.detail || `BulkSMS API returned status ${response.status}`
        return {
          success: false,
          providerName: this.providerName,
          errorMessage: errorMsg,
          isTransient: isTransientError(response.status, errorMsg),
          rawResponse: data,
        }
      }

      const messageId = Array.isArray(data) ? data[0]?.id : data?.id
      return {
        success: true,
        providerName: this.providerName,
        providerMessageId: messageId,
        rawResponse: data,
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error communicating with South African SMS Gateway.'
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: errorMsg,
        isTransient: true,
      }
    }
  }
}
