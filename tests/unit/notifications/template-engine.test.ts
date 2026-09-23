import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  interpolateTemplate,
  renderNotificationMessage,
} from '@/domains/notifications/templates/engine'
import { DEFAULT_TEMPLATES } from '@/domains/notifications/templates/defaults'

describe('Notification Template Engine', () => {
  it('escapes HTML special characters for email templates', () => {
    const raw = '<script>alert("xss")</script> & "barber\'s"'
    const escaped = escapeHtml(raw)
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;barber&#039;s&quot;')
  })

  it('interpolates variables properly into template strings', () => {
    const template = 'Hi {{customer_name}}, your booking is at {{time}} with {{barber}}.'
    const result = interpolateTemplate(template, {
      customer_name: 'Sizwe',
      time: '14:30',
      barber: 'Themba',
    })
    expect(result).toBe('Hi Sizwe, your booking is at 14:30 with Themba.')
  })

  it('replaces missing or undefined variables with empty strings without crashing', () => {
    const template = 'Hello {{name}}, ref: {{ref}}, note: {{missing_note}}'
    const result = interpolateTemplate(template, {
      name: 'John',
      ref: 'BYB-100',
    })
    expect(result).toBe('Hello John, ref: BYB-100, note: ')
  })

  it('renders email message with HTML escaping and subject', () => {
    const rendered = renderNotificationMessage({
      channel: 'email',
      templateContent: '<p>Hi {{name}}, service: {{service}}</p>',
      subjectTemplate: 'Booking: {{service}}',
      variables: {
        name: '<Thabo>',
        service: 'Fade & Trim',
      },
    })

    expect(rendered.channel).toBe('email')
    expect(rendered.subject).toBe('Booking: Fade & Trim')
    expect(rendered.content).toBe('<p>Hi &lt;Thabo&gt;, service: Fade &amp; Trim</p>')
  })

  it('renders WhatsApp message with template parameters', () => {
    const rendered = renderNotificationMessage({
      channel: 'whatsapp',
      templateContent: DEFAULT_TEMPLATES.booking_confirmed.whatsapp.content,
      variables: {
        customer_name: 'Lerato',
        service_name: 'Haircut',
        barber_name: 'Themba',
        appointment_date: '2026-09-20',
        start_time: '10:00',
        salon_name: 'Fade & Edge',
        salon_address: '15 Loader Street',
        booking_reference: 'BYB-999',
        manage_url: 'https://bookyourbarber.co.za/manage',
      },
      whatsappTemplateName: 'byb_booking_confirmed',
      whatsappParamOrder: ['salon_name', 'customer_name', 'service_name', 'barber_name', 'appointment_date', 'start_time', 'booking_reference'],
    })

    expect(rendered.channel).toBe('whatsapp')
    expect(rendered.whatsappTemplateName).toBe('byb_booking_confirmed')
    expect(rendered.whatsappParameters).toEqual([
      'Fade & Edge',
      'Lerato',
      'Haircut',
      'Themba',
      '2026-09-20',
      '10:00',
      'BYB-999',
    ])
    expect(rendered.content).toContain('💈 *Booking Confirmed at Fade & Edge!*')
  })
})
