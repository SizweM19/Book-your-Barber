import { NextRequest, NextResponse } from 'next/server'
import {
  getDefaultRepositoryMode,
  getRepositories,
  createSupabaseContainer,
  AppointmentService,
  createServerSupabaseClient,
} from '@byb/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { appointmentId, bookingReference, cancelledBy = 'customer', verificationContact } = body

    if (!appointmentId && !bookingReference) {
      return NextResponse.json(
        { error: 'Appointment ID or booking reference is required.' },
        { status: 400 }
      )
    }

    const mode = getDefaultRepositoryMode()
    const container =
      mode === 'supabase'
        ? createSupabaseContainer()
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

    // ──────────────────────────────────────────────────────────────────────────
    // SECURITY & AUTHORIZATION VERIFICATION
    // ──────────────────────────────────────────────────────────────────────────
    let isAuthorizedStaff = false

    if (mode === 'supabase') {
      try {
        const serverClient = await createServerSupabaseClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (user) {
          const { data: membership } = await serverClient
            .from('tenant_memberships')
            .select('role')
            .eq('tenant_id', appt.tenantId)
            .eq('user_id', user.id)
            .maybeSingle()

          if (membership && (membership.role === 'OWNER' || membership.role === 'MANAGER')) {
            isAuthorizedStaff = true
          }
        }
      } catch {
        // Unauthenticated public request
      }
    } else {
      const testRole = req.headers.get('x-test-role')
      if (testRole === 'OWNER' || testRole === 'MANAGER') {
        isAuthorizedStaff = true
      }
    }

    let effectiveCancelledBy: 'customer' | 'salon' = 'customer'

    if (isAuthorizedStaff) {
      effectiveCancelledBy = cancelledBy === 'salon' ? 'salon' : 'customer'
    } else {
      if (cancelledBy === 'salon') {
        return NextResponse.json(
          { error: 'Forbidden: Public caller cannot cancel an appointment on behalf of the salon.' },
          { status: 403 }
        )
      }

      if (!verificationContact || typeof verificationContact !== 'string' || !verificationContact.trim()) {
        return NextResponse.json(
          { error: 'Verification contact (phone or email) is required to cancel this appointment.' },
          { status: 401 }
        )
      }

      const cust = await container.customers.findById(appt.customerId)
      if (!cust) {
        return NextResponse.json(
          { error: 'Customer record associated with this booking was not found.' },
          { status: 404 }
        )
      }

      const cleanInput = verificationContact.trim().toLowerCase().replace(/[\s\-\(\)]/g, '')
      const custPhone = (cust.phone || '').replace(/[\s\-\(\)]/g, '')
      const custEmail = (cust.email || '').toLowerCase()

      const matches =
        (custPhone &&
          (cleanInput.includes(custPhone) ||
            custPhone.includes(cleanInput) ||
            custPhone.endsWith(cleanInput) ||
            cleanInput.endsWith(custPhone))) ||
        (custEmail && custEmail === cleanInput)

      if (!matches) {
        return NextResponse.json(
          { error: 'Forbidden: Verification contact does not match the booking customer on file.' },
          { status: 403 }
        )
      }

      effectiveCancelledBy = 'customer'
    }

    const appointmentService = new AppointmentService(container)
    const result = await appointmentService.cancelAppointment(appt.id, effectiveCancelledBy)

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      refund: result.refund,
      message:
        effectiveCancelledBy === 'salon'
          ? 'Appointment cancelled by salon. Full refund initiated.'
          : 'Appointment cancelled by customer according to salon cancellation policy.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error while cancelling appointment' },
      { status: 500 }
    )
  }
}
