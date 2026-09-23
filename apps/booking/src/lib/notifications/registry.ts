/**
 * Notification Provider Registry & Factory.
 * 
 * Invariants:
 * - Dynamically resolves adapters based on environment and configuration.
 * - In test environments or when credentials are not configured, gracefully falls back to MockAdapters.
 * - Allows swapping adapters at runtime for integration testing.
 */

import type { NotificationChannel } from '@/domains/notifications/types'
import type { NotificationProviderAdapter } from './adapters/types'
import {
  MockEmailAdapter,
  MockWhatsAppAdapter,
  MockSmsAdapter,
} from './adapters/MockAdapters'
import { ResendEmailAdapter } from './adapters/ResendEmailAdapter'
import { MetaWhatsAppAdapter } from './adapters/MetaWhatsAppAdapter'
import { BulkSmsAdapter } from './adapters/BulkSmsAdapter'

export class NotificationProviderRegistry {
  private adapters: Map<Exclude<NotificationChannel, 'none'>, NotificationProviderAdapter> = new Map()

  constructor() {
    this.initializeDefaultAdapters()
  }

  private initializeDefaultAdapters(): void {
    const isProd = process.env.NODE_ENV === 'production'
    const forceMock = process.env.NOTIFICATION_MODE === 'mock' || !isProd

    // Email Adapter
    if (!forceMock && process.env.RESEND_API_KEY) {
      this.adapters.set('email', new ResendEmailAdapter())
    } else {
      this.adapters.set('email', new MockEmailAdapter())
    }

    // WhatsApp Adapter
    if (!forceMock && process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      this.adapters.set('whatsapp', new MetaWhatsAppAdapter())
    } else {
      this.adapters.set('whatsapp', new MockWhatsAppAdapter())
    }

    // SMS Adapter (South African Gateway)
    if (!forceMock && process.env.BULKSMS_TOKEN_ID && process.env.BULKSMS_TOKEN_SECRET) {
      this.adapters.set('sms', new BulkSmsAdapter())
    } else {
      this.adapters.set('sms', new MockSmsAdapter())
    }
  }

  getAdapter(channel: Exclude<NotificationChannel, 'none'>): NotificationProviderAdapter {
    const adapter = this.adapters.get(channel)
    if (!adapter) {
      throw new Error(`No adapter registered for notification channel: ${channel}`)
    }
    return adapter
  }

  setAdapter(channel: Exclude<NotificationChannel, 'none'>, adapter: NotificationProviderAdapter): void {
    this.adapters.set(channel, adapter)
  }

  resetToDefaults(): void {
    this.adapters.clear()
    this.initializeDefaultAdapters()
  }
}

export const notificationProviderRegistry = new NotificationProviderRegistry()
