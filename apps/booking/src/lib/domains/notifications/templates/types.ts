/**
 * Notification Template Types & Schema Definitions.
 */

import type { NotificationChannel, NotificationEventType } from '../types'

export interface MessageTemplateEntity {
  id: string
  tenantId: string
  templateType: NotificationEventType
  channel: Exclude<NotificationChannel, 'none'>
  subject?: string
  content: string
  whatsappTemplateName?: string
  active: boolean
  createdAt: string
  updatedAt?: string
}

export interface RenderedMessage {
  channel: Exclude<NotificationChannel, 'none'>
  subject?: string
  content: string
  whatsappTemplateName?: string
  whatsappParameters?: string[]
}

export type TemplateVariables = Record<string, string | number | undefined>
