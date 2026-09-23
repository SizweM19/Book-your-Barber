/**
 * Lightweight Safe Template Interpolation Engine.
 * 
 * Invariants:
 * - HTML-escapes content for Email to prevent injection.
 * - Missing variables are replaced with empty strings or fallbacks rather than throwing runtime exceptions.
 * - String immutability is preserved.
 */

import type { TemplateVariables, RenderedMessage } from './types'
import type { NotificationChannel } from '../types'

/**
 * Escapes HTML characters to prevent XSS in email templates.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Interpolates variables into a template string: {{variable_name}}.
 */
export function interpolateTemplate(
  template: string,
  variables: TemplateVariables,
  shouldEscapeHtml = false
): string {
  if (!template) return ''

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const val = variables[key]
    if (val === undefined || val === null) {
      return ''
    }
    const strVal = String(val)
    return shouldEscapeHtml ? escapeHtml(strVal) : strVal
  })
}

/**
 * Renders a full notification message for a specific channel.
 */
export function renderNotificationMessage(params: {
  channel: Exclude<NotificationChannel, 'none'>
  templateContent: string
  subjectTemplate?: string
  variables: TemplateVariables
  whatsappTemplateName?: string
  whatsappParamOrder?: string[]
}): RenderedMessage {
  const isEmail = params.channel === 'email'

  const renderedContent = interpolateTemplate(
    params.templateContent,
    params.variables,
    isEmail
  )

  const renderedSubject = params.subjectTemplate
    ? interpolateTemplate(params.subjectTemplate, params.variables, false)
    : undefined

  const whatsappParameters = params.whatsappParamOrder
    ? params.whatsappParamOrder.map(k => String(params.variables[k] ?? ''))
    : undefined

  return {
    channel: params.channel,
    subject: renderedSubject,
    content: renderedContent,
    whatsappTemplateName: params.whatsappTemplateName,
    whatsappParameters,
  }
}
