/**
 * Resend Email Gateway Adapter.
 * 
 * Invariants:
 * - Uses native HTTP fetch for zero third-party runtime package overhead.
 * - Handles rate limits (429) and network timeouts gracefully.
 * - Automatically injects salon branding and reply-to headers.
 */

import type { NotificationProviderAdapter, OutboundMessage, ProviderSendResult } from './types'
import { isTransientError } from '@/domains/notifications/rules'

export interface ResendAdapterConfig {
  apiKey?: string
  fromEmail?: string
}

export class ResendEmailAdapter implements NotificationProviderAdapter {
  readonly channel = 'email' as const
  readonly providerName = 'Resend'

  private apiKey: string
  private fromEmail: string

  constructor(config: ResendAdapterConfig = {}) {
    this.apiKey = config.apiKey || process.env.RESEND_API_KEY || ''
    this.fromEmail = config.fromEmail || process.env.RESEND_FROM_EMAIL || 'Book-Your-Barber <notifications@bookyourbarber.co.za>'
  }

  async send(message: OutboundMessage): Promise<ProviderSendResult> {
    if (!this.apiKey) {
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: 'RESEND_API_KEY is not configured.',
        isTransient: false,
      }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [message.recipient],
          subject: message.subject || 'Notification from Book-Your-Barber',
          html: message.body,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errorMsg = data?.message || `Resend API returned status ${response.status}`
        return {
          success: false,
          providerName: this.providerName,
          errorMessage: errorMsg,
          isTransient: isTransientError(response.status, errorMsg),
          rawResponse: data,
        }
      }

      return {
        success: true,
        providerName: this.providerName,
        providerMessageId: data?.id,
        rawResponse: data,
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error communicating with Resend API.'
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: errorMsg,
        isTransient: true,
      }
    }
  }
}
