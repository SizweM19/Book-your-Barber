/**
 * Meta WhatsApp Cloud API Provider Adapter.
 * 
 * Invariants:
 * - Direct integration with Graph API (v20.0).
 * - Outbound business notifications use approved HSM templates.
 * - Formats parameters as component body text.
 */

import type { NotificationProviderAdapter, OutboundMessage, ProviderSendResult } from './types'
import { isTransientError } from '@/domains/notifications/rules'

export interface MetaWhatsAppConfig {
  accessToken?: string
  phoneNumberId?: string
}

export class MetaWhatsAppAdapter implements NotificationProviderAdapter {
  readonly channel = 'whatsapp' as const
  readonly providerName = 'MetaWhatsApp'

  private accessToken: string
  private phoneNumberId: string

  constructor(config: MetaWhatsAppConfig = {}) {
    this.accessToken = config.accessToken || process.env.WHATSAPP_API_TOKEN || ''
    this.phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  }

  async send(message: OutboundMessage): Promise<ProviderSendResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: 'WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.',
        isTransient: false,
      }
    }

    try {
      const cleanPhone = message.recipient.replace(/\+/g, '')

      let payload: Record<string, unknown>

      if (message.whatsappTemplateName && message.whatsappParameters?.length) {
        // Business Initiated Template Message (HSM)
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'template',
          template: {
            name: message.whatsappTemplateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: message.whatsappParameters.map(param => ({
                  type: 'text',
                  text: param,
                })),
              },
            ],
          },
        }
      } else {
        // Standard text fallback
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: message.body,
          },
        }
      }

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errorMsg = data?.error?.message || `WhatsApp API returned status ${response.status}`
        return {
          success: false,
          providerName: this.providerName,
          errorMessage: errorMsg,
          isTransient: isTransientError(response.status, errorMsg),
          rawResponse: data,
        }
      }

      const messageId = data?.messages?.[0]?.id
      return {
        success: true,
        providerName: this.providerName,
        providerMessageId: messageId,
        rawResponse: data,
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error communicating with WhatsApp Cloud API.'
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: errorMsg,
        isTransient: true,
      }
    }
  }
}
