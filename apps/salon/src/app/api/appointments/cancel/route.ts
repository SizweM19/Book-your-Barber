import { NextRequest, NextResponse } from 'next/server'
import {
  getDefaultRepositoryMode,
  getRepositories,
  createSupabaseContainer,
} from '@byb/database'
import { AppointmentService } from '@/lib/services/AppointmentService'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/appointments/cancel
 *
 * Salon-owner cancellation endpoint.
 * Authenticates via the caller's JWT (user JWT, not service-role key) so that
 * all Supabase RLS policies are honoured using the authenticated user's session.
 *
 * Authorisation: caller must have OWNER or MANAGER role in tenant_memberships.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { appointmentId } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required.' },
        { status: 400 }
      )
    }

    const mode = getDefaultRepositoryMode()

    // Build a repository container. In Supabase mode we use the server-side
    // client that carries the authenticated session cookie (user JWT),
    // so RLS policies in Supabase will see auth.uid() correctly.
    let container = mode === 'supabase'
      ? createSupabaseContainer(await createServerSupabaseClient())
      : getRepositories('mock')

    // ──────────────────────────────────────────────────────────────────────────
    // AUTHORISATION: verify caller is an OWNER or MANAGER of this tenant
    // ──────────────────────────────────────────────────────────────────────────
    if (mode === 'supabase') {
      const serverClient = await createServerSupabaseClient()
      const { data: { user }, error: authError } = await serverClient.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized: valid session required to cancel on behalf of salon.' },
          { status: 401 }
        )
      }

      // Lookup appointment first so we can check tenant membership
      const appt = await container.appointments.findById(appointmentId)
      if (!appt) {
        return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 })
      }

      const { data: membership } = await serverClient
        .from('tenant_memberships')
        .select('role')
        .eq('tenant_id', appt.tenantId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
        return NextResponse.json(
          { error: 'Forbidden: only salon OWNER or MANAGER can cancel appointments.' },
          { status: 403 }
        )
      }

      // Re-create the container with the authenticated server client so that
      // subsequent mutations are executed with the user's JWT (RLS-governed).
      container = createSupabaseContainer(serverClient)
    } else {
      // Dev/test mode: accept x-test-role header for automated testing
      const testRole = req.headers.get('x-test-role')
      if (testRole !== 'OWNER' && testRole !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Forbidden: x-test-role header must be OWNER or MANAGER in mock mode.' },
          { status: 403 }
        )
      }
    }

    const appointmentService = new AppointmentService(container)
    const result = await appointmentService.cancelAppointment(appointmentId, 'salon')

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      feePercent: result.feePercent,
      feeAmount: result.feeAmount,
      refundAmount: result.refundAmount,
      bookingReference: result.bookingReference,
      message: 'Appointment cancelled by salon. Refund record created.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error during salon cancellation.' },
      { status: 500 }
    )
  }
}
