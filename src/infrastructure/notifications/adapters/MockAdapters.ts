/**
 * Mock Notification Adapters for Testing & Offline Local Development.
 * 
 * Invariants:
 * - Completely in-memory and deterministic (zero external network requests).
 * - Records dispatch history for assertions.
 * - Supports transient and permanent error simulations.
 */

import type { NotificationProviderAdapter, OutboundMessage, ProviderSendResult } from './types'

export class MockEmailAdapter implements NotificationProviderAdapter {
  readonly channel = 'email' as const
  readonly providerName = 'MockEmail'
  public dispatches: OutboundMessage[] = []
  public simulatedError: { message: string; isTransient: boolean } | null = null

  async send(message: OutboundMessage): Promise<ProviderSendResult> {
    this.dispatches.push(message)

    if (this.simulatedError) {
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: this.simulatedError.message,
        isTransient: this.simulatedError.isTransient,
      }
    }

    return {
      success: true,
      providerName: this.providerName,
      providerMessageId: `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }
  }

  clear(): void {
    this.dispatches = []
    this.simulatedError = null
  }
}

export class MockWhatsAppAdapter implements NotificationProviderAdapter {
  readonly channel = 'whatsapp' as const
  readonly providerName = 'MockWhatsApp'
  public dispatches: OutboundMessage[] = []
  public simulatedError: { message: string; isTransient: boolean } | null = null

  async send(message: OutboundMessage): Promise<ProviderSendResult> {
    this.dispatches.push(message)

    if (this.simulatedError) {
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: this.simulatedError.message,
        isTransient: this.simulatedError.isTransient,
      }
    }

    return {
      success: true,
      providerName: this.providerName,
      providerMessageId: `mock-wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }
  }

  clear(): void {
    this.dispatches = []
    this.simulatedError = null
  }
}

export class MockSmsAdapter implements NotificationProviderAdapter {
  readonly channel = 'sms' as const
  readonly providerName = 'MockSms'
  public dispatches: OutboundMessage[] = []
  public simulatedError: { message: string; isTransient: boolean } | null = null

  async send(message: OutboundMessage): Promise<ProviderSendResult> {
    this.dispatches.push(message)

    if (this.simulatedError) {
      return {
        success: false,
        providerName: this.providerName,
        errorMessage: this.simulatedError.message,
        isTransient: this.simulatedError.isTransient,
      }
    }

    return {
      success: true,
      providerName: this.providerName,
      providerMessageId: `mock-sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }
  }

  clear(): void {
    this.dispatches = []
    this.simulatedError = null
  }
}
