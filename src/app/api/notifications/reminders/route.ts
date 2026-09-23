import { NextRequest, NextResponse } from 'next/server'
import {
  getDefaultRepositoryMode,
  getRepositories,
  createSupabaseContainer,
} from '@/infrastructure/repositories/container'
import { createAdminClient } from '@/infrastructure/supabase/admin'
import { eventBus } from '@/application/services/EventBus'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 })
    }

    const mode = getDefaultRepositoryMode()
    const container =
      mode === 'supabase'
        ? createSupabaseContainer(createAdminClient())
        : getRepositories('mock')

    const now = new Date()
    // Calculate target date for 24h reminder (tomorrow)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]

    // Fetch salons
    const salons = await container.salons.list()
    let remindersDispatched = 0

    for (const salon of salons) {
      const appointments = await container.appointments.listByTenant(salon.tenantId, 500)
      const upcoming = appointments.filter(
        a =>
          a.appointmentDate === tomorrowDateStr &&
          (a.status === 'confirmed' || a.status === 'booked') &&
          a.reminderChannel !== 'none'
      )

      for (const appt of upcoming) {
        // Check if 24h reminder was already sent
        const logs = await container.notifications.listByAppointment(appt.id)
        const alreadySent = logs.some(
          l => l.eventType === 'reminder_24h' && (l.status === 'sent' || l.status === 'pending')
        )

        if (!alreadySent) {
          const cust = await container.customers.findById(appt.customerId)
          const svc = await container.services.findById(appt.serviceId)
          const stf = appt.staffId ? await container.staff.findById(appt.staffId) : null

          await eventBus.publish({
            eventId: `evt-remind-24h-${appt.id}`,
            timestamp: new Date().toISOString(),
            tenantId: appt.tenantId,
            type: 'reminder.due',
            window: '24h',
            appointmentId: appt.id,
            bookingReference: appt.bookingReference,
            customerId: appt.customerId,
            customerName: cust?.name || 'Customer',
            customerPhone: cust?.phone || '',
            customerEmail: cust?.email,
            serviceName: svc?.name || 'Haircut',
            staffName: stf?.name,
            appointmentDate: appt.appointmentDate,
            startTime: appt.startTime,
            reminderChannel: appt.reminderChannel,
            salonName: salon.name,
            salonAddress: salon.addressStreet ? `${salon.addressStreet}, ${salon.addressCity || ''}` : salon.address,
            salonPhone: salon.phone,
          })
          remindersDispatched++
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersDispatched,
      processedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Reminder dispatch cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error during reminder processing.' },
      { status: 500 }
    )
  }
}
