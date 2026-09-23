/**
 * Default System Notification Templates.
 * Tailored for South African salon operations.
 * 
 * Invariants:
 * - SMS templates are strictly concise (<= 160 characters whenever possible).
 * - WhatsApp copy includes friendly formatting (*bold*, emojis).
 * - Email templates provide detailed context, reference codes, and salon support info.
 */

import type { NotificationChannel, NotificationEventType } from '../types'

export interface DefaultTemplateDefinition {
  subject?: string
  content: string
  whatsappTemplateName?: string
  whatsappParamOrder?: string[]
}

export const DEFAULT_TEMPLATES: Record<
  NotificationEventType,
  Record<Exclude<NotificationChannel, 'none'>, DefaultTemplateDefinition>
> = {
  booking_confirmed: {
    whatsapp: {
      content:
        '💈 *Booking Confirmed at {{salon_name}}!*\n\nHi {{customer_name}}, your appointment for *{{service_name}}* with *{{barber_name}}* is confirmed.\n\n📅 *Date:* {{appointment_date}}\n⏰ *Time:* {{start_time}}\n📍 *Address:* {{salon_address}}\n🔖 *Ref:* {{booking_reference}}\n\nNeed to manage your booking? Visit {{manage_url}}',
      whatsappTemplateName: 'byb_booking_confirmed',
      whatsappParamOrder: [
        'salon_name',
        'customer_name',
        'service_name',
        'barber_name',
        'appointment_date',
        'start_time',
        'booking_reference',
      ],
    },
    sms: {
      content:
        'Booking Confirmed: {{service_name}} at {{salon_name}} on {{appointment_date}} at {{start_time}}. Ref: {{booking_reference}}. Info: {{salon_phone}}',
    },
    email: {
      subject: 'Booking Confirmed: {{service_name}} at {{salon_name}} ({{booking_reference}})',
      content: `<h2>Booking Confirmed!</h2>
<p>Hi {{customer_name}},</p>
<p>Your appointment has been successfully scheduled at <strong>{{salon_name}}</strong>.</p>
<hr />
<ul>
  <li><strong>Service:</strong> {{service_name}}</li>
  <li><strong>Barber:</strong> {{barber_name}}</li>
  <li><strong>Date & Time:</strong> {{appointment_date}} at {{start_time}} ({{duration_minutes}} mins)</li>
  <li><strong>Location:</strong> {{salon_address}}</li>
  <li><strong>Booking Reference:</strong> {{booking_reference}}</li>
  <li><strong>Total Charged:</strong> {{total_charged}} (Paid: {{total_paid}})</li>
</ul>
<hr />
<p><a href="{{manage_url}}">View and Manage Your Booking</a></p>
<p>Thank you for choosing {{salon_name}}!</p>`,
    },
  },

  appointment_cancelled: {
    whatsapp: {
      content:
        '⚠️ *Appointment Cancelled*\n\nHi {{customer_name}}, your booking {{booking_reference}} at {{salon_name}} for {{appointment_date}} at {{start_time}} has been cancelled.\n\n{{refund_summary}}\n\nQuestions? Contact {{salon_phone}}.',
      whatsappTemplateName: 'byb_appointment_cancelled',
      whatsappParamOrder: ['customer_name', 'booking_reference', 'salon_name', 'appointment_date', 'start_time'],
    },
    sms: {
      content:
        'Cancelled: Booking {{booking_reference}} at {{salon_name}} on {{appointment_date}} is cancelled. Refund: {{refund_amount}}. Info: {{salon_phone}}',
    },
    email: {
      subject: 'Appointment Cancelled - Ref: {{booking_reference}} - {{salon_name}}',
      content: `<h2>Appointment Cancelled</h2>
<p>Hi {{customer_name}},</p>
<p>Your appointment for <strong>{{service_name}}</strong> on <strong>{{appointment_date}} at {{start_time}}</strong> has been cancelled.</p>
<hr />
<ul>
  <li><strong>Booking Reference:</strong> {{booking_reference}}</li>
  <li><strong>Cancellation Fee:</strong> {{cancellation_fee}}</li>
  <li><strong>Refund Amount:</strong> {{refund_amount}}</li>
  <li><strong>Refund Status:</strong> {{refund_status}}</li>
</ul>
<p>If eligible for a refund, funds will reflect in your account according to standard banking clearing times.</p>
<p>For inquiries, please contact {{salon_name}} at {{salon_phone}}.</p>`,
    },
  },

  appointment_rescheduled: {
    whatsapp: {
      content:
        '🔄 *Appointment Rescheduled*\n\nHi {{customer_name}}, your booking at {{salon_name}} has been updated:\n\n🗓 *New Date:* {{new_date}}\n⏰ *New Time:* {{new_time}}\n✂️ *Service:* {{service_name}}\n💈 *Barber:* {{barber_name}}\n🔖 *Ref:* {{booking_reference}}\n\nManage: {{manage_url}}',
      whatsappTemplateName: 'byb_appointment_rescheduled',
      whatsappParamOrder: [
        'customer_name',
        'salon_name',
        'new_date',
        'new_time',
        'service_name',
        'booking_reference',
      ],
    },
    sms: {
      content:
        'Rescheduled: Booking {{booking_reference}} at {{salon_name}} moved to {{new_date}} at {{new_time}}. Info: {{salon_phone}}',
    },
    email: {
      subject: 'Appointment Rescheduled: {{booking_reference}} - {{salon_name}}',
      content: `<h2>Your Appointment Has Been Rescheduled</h2>
<p>Hi {{customer_name}},</p>
<p>Your appointment at <strong>{{salon_name}}</strong> has been updated to:</p>
<hr />
<ul>
  <li><strong>New Date & Time:</strong> {{new_date}} at {{new_time}}</li>
  <li><strong>Service:</strong> {{service_name}}</li>
  <li><strong>Barber:</strong> {{barber_name}}</li>
  <li><strong>Booking Reference:</strong> {{booking_reference}}</li>
  <li><strong>Location:</strong> {{salon_address}}</li>
</ul>
<hr />
<p><a href="{{manage_url}}">Manage Your Appointment</a></p>`,
    },
  },

  payment_received: {
    whatsapp: {
      content:
        '💳 *Payment Received*\n\nHi {{customer_name}}, we received your payment of *{{amount_paid}}* for booking {{booking_reference}} at {{salon_name}}.\n\nOutstanding balance: {{outstanding_balance}}.\nReceipt Ref: {{receipt_ref}}',
      whatsappTemplateName: 'byb_payment_received',
      whatsappParamOrder: ['customer_name', 'amount_paid', 'booking_reference', 'salon_name'],
    },
    sms: {
      content:
        'Payment of {{amount_paid}} received for booking {{booking_reference}} at {{salon_name}}. Outstanding: {{outstanding_balance}}.',
    },
    email: {
      subject: 'Payment Receipt: {{booking_reference}} - {{salon_name}}',
      content: `<h2>Payment Confirmation</h2>
<p>Hi {{customer_name}},</p>
<p>Thank you! Your payment of <strong>{{amount_paid}}</strong> has been recorded.</p>
<hr />
<ul>
  <li><strong>Salon:</strong> {{salon_name}}</li>
  <li><strong>Booking Reference:</strong> {{booking_reference}}</li>
  <li><strong>Payment Method:</strong> {{payment_method}}</li>
  <li><strong>Amount Paid:</strong> {{amount_paid}}</li>
  <li><strong>Remaining Balance:</strong> {{outstanding_balance}}</li>
  <li><strong>Transaction Reference:</strong> {{receipt_ref}}</li>
</ul>`,
    },
  },

  refund_processed: {
    whatsapp: {
      content:
        '💸 *Refund Update*\n\nHi {{customer_name}}, a refund of *{{refund_amount}}* for booking {{booking_reference}} at {{salon_name}} is *{{refund_status}}*.\n\nRefund Ref: {{refund_reference}}.\nFunds typically reflect within 3-5 business days.',
      whatsappTemplateName: 'byb_refund_update',
      whatsappParamOrder: ['customer_name', 'refund_amount', 'booking_reference', 'salon_name', 'refund_status'],
    },
    sms: {
      content:
        'Refund {{refund_status}}: {{refund_amount}} for booking {{booking_reference}} at {{salon_name}}. Ref: {{refund_reference}}.',
    },
    email: {
      subject: 'Refund Update: {{refund_reference}} - {{salon_name}}',
      content: `<h2>Refund Update</h2>
<p>Hi {{customer_name}},</p>
<p>A refund has been processed for booking <strong>{{booking_reference}}</strong>.</p>
<hr />
<ul>
  <li><strong>Salon:</strong> {{salon_name}}</li>
  <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
  <li><strong>Refund Amount:</strong> {{refund_amount}}</li>
  <li><strong>Status:</strong> {{refund_status}}</li>
</ul>
<p>Depending on your card issuer or bank, credit will reflect within 3-5 business days.</p>`,
    },
  },

  reminder_24h: {
    whatsapp: {
      content:
        '⏰ *Appointment Reminder (Tomorrow)*\n\nHi {{customer_name}}, this is a friendly reminder for your appointment tomorrow with *{{barber_name}}* at *{{salon_name}}*.\n\n📅 *Date:* {{appointment_date}}\n⏰ *Time:* {{start_time}}\n📍 *Location:* {{salon_address}}\n\nNeed to reschedule? Please make changes at least 24h before to avoid cancellation fees: {{manage_url}}',
      whatsappTemplateName: 'byb_reminder_24h',
      whatsappParamOrder: ['customer_name', 'barber_name', 'salon_name', 'appointment_date', 'start_time'],
    },
    sms: {
      content:
        'Reminder: Your appointment at {{salon_name}} is tomorrow at {{start_time}}. Ref: {{booking_reference}}. Need to reschedule? Visit: {{manage_url}}',
    },
    email: {
      subject: 'Reminder: Appointment Tomorrow at {{salon_name}} ({{start_time}})',
      content: `<h2>Appointment Reminder</h2>
<p>Hi {{customer_name}},</p>
<p>We look forward to seeing you tomorrow at <strong>{{salon_name}}</strong>!</p>
<hr />
<ul>
  <li><strong>Service:</strong> {{service_name}}</li>
  <li><strong>Barber:</strong> {{barber_name}}</li>
  <li><strong>Time:</strong> Tomorrow, {{appointment_date}} at {{start_time}}</li>
  <li><strong>Location:</strong> {{salon_address}}</li>
  <li><strong>Booking Reference:</strong> {{booking_reference}}</li>
</ul>
<hr />
<p>Please arrive 5 minutes early. Need to manage or reschedule? <a href="{{manage_url}}">Click here</a>.</p>`,
    },
  },

  reminder_2h: {
    whatsapp: {
      content:
        '✂️ *See You Soon!*\n\nHi {{customer_name}}, your appointment with *{{barber_name}}* is in 2 hours at *{{start_time}}*.\n\n📍 *Address:* {{salon_address}}\n📞 *Salon Phone:* {{salon_phone}}\n\nSafe travels!',
      whatsappTemplateName: 'byb_reminder_2h',
      whatsappParamOrder: ['customer_name', 'barber_name', 'start_time', 'salon_address'],
    },
    sms: {
      content:
        'Reminder: See you in 2 hours at {{salon_name}} ({{start_time}}). Ref: {{booking_reference}}. Address: {{salon_address}}',
    },
    email: {
      subject: 'Reminder: See you in 2 hours at {{salon_name}} ({{start_time}})',
      content: `<h2>See You Soon!</h2>
<p>Hi {{customer_name}},</p>
<p>Your appointment is coming up today in 2 hours at <strong>{{start_time}}</strong>.</p>
<p><strong>Address:</strong> {{salon_address}}</p>
<p>If you're running late, please call {{salon_phone}}.</p>`,
    },
  },
}
