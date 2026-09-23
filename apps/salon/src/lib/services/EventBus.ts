/**
 * Domain Event Bus.
 * 
 * Invariants:
 * - Decouples application services from asynchronous side-effects.
 * - Non-blocking: Listener execution failures NEVER bubble up to crash or roll back
 *   the publisher's transaction.
 * - Supports type-safe event subscriptions.
 */

import type { DomainEvent } from '@/domains/notifications/events'

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void

export class DomainEventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map()

  /**
   * Subscribes a handler to a specific domain event type.
   */
  subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): () => void {
    const existing = this.handlers.get(eventType) || []
    this.handlers.set(eventType, [...existing, handler])

    // Return unsubscribe callback
    return () => {
      const current = this.handlers.get(eventType) || []
      this.handlers.set(
        eventType,
        current.filter(h => h !== handler)
      )
    }
  }

  /**
   * Publishes an event to all registered subscribers asynchronously.
   * Ensures isolation: Errors in subscribers are captured and logged, never crashing the publisher.
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const matching = this.handlers.get(event.type) || []
    if (matching.length === 0) return

    const executions = matching.map(async handler => {
      try {
        await handler(event)
      } catch (err: any) {
        console.error(`[DomainEventBus] Error executing subscriber for ${event.type}:`, err?.message || err)
      }
    })

    // Wait for executions without re-throwing
    await Promise.allSettled(executions)
  }

  /**
   * Clears all registered handlers (used in test teardown).
   */
  clear(): void {
    this.handlers.clear()
  }
}

export const eventBus = new DomainEventBus()
