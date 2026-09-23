import { NextRequest, NextResponse } from 'next/server'
import {
  getDefaultRepositoryMode,
  getRepositories,
  createSupabaseContainer,
} from '@/infrastructure/repositories/container'
import { createAdminClient } from '@/infrastructure/supabase/admin'
import { AppointmentService } from '@/application/services/AppointmentService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { appointmentId, bookingReference, cancelledBy = 'customer' } = body

    if (!appointmentId && !bookingReference) {
      return NextResponse.json(
        { error: 'Appointment ID or booking reference is required.' },
        { status: 400 }
      )
    }

    // Resolve repository container with elevated administrative privileges for Supabase
    const mode = getDefaultRepositoryMode()
    const container =
      mode === 'supabase'
        ? createSupabaseContainer(createAdminClient())
        : getRepositories('mock')

    // Find appointment by ID or reference
    let appt = appointmentId
      ? await container.appointments.findById(appointmentId)
      : null

    if (!appt && bookingReference) {
      appt = await container.appointments.findByReference(bookingReference)
    }

    if (!appt) {
      return NextResponse.json(
        { error: 'Appointment not found.' },
        { status: 404 }
      )
    }

    if (appt.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled.' },
        { status: 400 }
      )
    }

    // Execute cancellation through domain service using elevated container
    const appointmentService = new AppointmentService(container)
    const result = await appointmentService.cancelAppointment(appt.id, cancelledBy)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Fetch service details for receipt
    const service = appt.serviceId
      ? await container.services.findById(appt.serviceId)
      : null

    return NextResponse.json({
      success: true,
      bookingReference: appt.bookingReference,
      serviceName: service?.name || 'Barber Service',
      chargedAmount: appt.totalCharged,
      paidAmount: appt.totalPaid,
      feePercent: result.feePercent,
      feeAmount: result.feeAmount,
      refundAmount: result.refundAmount,
      cancelledBy,
      refundStatus: result.refundAmount > 0 ? 'requested' : 'none',
      appointmentDate: appt.appointmentDate,
      startTime: appt.startTime,
      appointment: result.appointment,
    })
  } catch (error: any) {
    console.error('Cancellation endpoint error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error during cancellation.' },
      { status: 500 }
    )
  }
}
