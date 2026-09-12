import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import {
  canCompleteAppointment,
  calculateCancellationFee,
  canRescheduleAppointment,
} from '@/domains/appointments/rules'
import type { AppointmentEntity } from '@/application/repositories/interfaces'
import { AvailabilityService } from './AvailabilityService'

export class AppointmentService {
  private availability: AvailabilityService

  constructor(private repos: RepositoryContainer = defaultRepositories) {
    this.availability = new AvailabilityService(repos)
  }

  async completeAppointment(id: string): Promise<{
    appointment?: AppointmentEntity
    error?: string
  }> {
    const appt = await this.repos.appointments.findById(id)
    if (!appt) return { error: 'Appointment not found' }

    // Enforce business rule: outstanding balance must equal 0
    const check = canCompleteAppointment({
      totalCharged: appt.totalCharged,
      totalPaid: appt.totalPaid,
    })

    if (!check.canComplete) {
      return { error: check.reason }
    }

    const updated = await this.repos.appointments.updateStatus(id, 'completed')
    return { appointment: updated }
  }

  async cancelAppointment(
    id: string,
    cancelledBy: 'customer' | 'salon'
  ): Promise<{
    appointment?: AppointmentEntity
    feePercent: number
    feeAmount: number
    refundAmount: number
    error?: string
  }> {
    const appt = await this.repos.appointments.findById(id)
    if (!appt) return { feePercent: 0, feeAmount: 0, refundAmount: 0, error: 'Appointment not found' }

    // Calculate cancellation fee using domain rules
    const apptDateTime = `${appt.appointmentDate}T${appt.startTime}:00`
    const feeCalc = calculateCancellationFee(
      appt.totalPaid,
      apptDateTime,
      cancelledBy
    )

    // Update appointment status to cancelled
    const updated = await this.repos.appointments.updateStatus(id, 'cancelled')

    // If eligible for refund, create refund record
    if (feeCalc.isEligibleForRefund) {
      await this.repos.refunds.create({
        tenantId: appt.tenantId,
        refundReference: `REF-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        appointmentId: appt.id,
        customerId: appt.customerId,
        originalAmount: appt.totalPaid,
        feePercent: feeCalc.feePercent,
        feeAmount: feeCalc.feeAmount,
        refundAmount: feeCalc.refundAmount,
        status: 'requested',
        cancelledBy,
      })
    }

    return {
      appointment: updated,
      feePercent: feeCalc.feePercent,
      feeAmount: feeCalc.feeAmount,
      refundAmount: feeCalc.refundAmount,
    }
  }

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTime: string,
    now?: Date
  ): Promise<{
    appointment?: AppointmentEntity
    error?: string
  }> {
    const appt = await this.repos.appointments.findById(id)
    if (!appt) return { error: 'Appointment not found' }

    const check = canRescheduleAppointment(`${appt.appointmentDate}T${appt.startTime}:00`, now)
    if (!check.canReschedule) {
      return { error: check.reason }
    }

    // Validate availability of the new slot using AvailabilityService
    const slots = await this.availability.getAvailableSlots({
      tenantId: appt.tenantId,
      staffId: appt.staffId,
      serviceId: appt.serviceId,
      date: newDate,
      durationMinutes: appt.durationMinutes,
      now,
    })

    const targetSlot = slots.find(s => s.time === newTime)
    if (!targetSlot || !targetSlot.available) {
      return { error: 'That appointment time is no longer available.' }
    }

    // Update time and date in-place
    const updated = await this.repos.appointments.updateDateTime(id, newDate, newTime)

    return { appointment: updated }
  }

  async markNoShow(id: string): Promise<AppointmentEntity> {
    return this.repos.appointments.updateStatus(id, 'noShow')
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentEntity['status']
  ): Promise<AppointmentEntity> {
    return this.repos.appointments.updateStatus(id, status)
  }

  /**
   * Secure guest booking lookup boundary (Fix H1).
   * Verifies reference and contact (phone/email), returning minimal customer-facing data.
   */
  async lookupGuestBooking(
    reference: string,
    verificationContact: string
  ): Promise<{ booking?: GuestBookingDetails; error?: string }> {
    const cleanRef = reference.trim().toUpperCase()
    let appt: AppointmentEntity | null = null

    if (typeof (this.repos.appointments as any).lookupGuest === 'function') {
      appt = await (this.repos.appointments as any).lookupGuest(cleanRef, verificationContact)
    }

    if (!appt) {
      appt = await this.repos.appointments.findByReference(cleanRef)
      if (!appt) {
        return { error: 'No booking found with this reference.' }
      }

      const cust = await this.repos.customers.findById(appt.customerId)
      if (!cust) {
        return { error: 'Customer record not found.' }
      }

      const cleanInput = verificationContact.trim().toLowerCase().replace(/[\s\-\(\)]/g, '')
      const custPhone = cust.phone.replace(/[\s\-\(\)]/g, '')
      const custEmail = cust.email?.toLowerCase() || ''

      const matches =
        (custPhone &&
          (cleanInput.includes(custPhone) ||
            custPhone.includes(cleanInput) ||
            custPhone.endsWith(cleanInput) ||
            cleanInput.endsWith(custPhone))) ||
        (custEmail && custEmail === cleanInput)

      if (!matches) {
        return { error: 'The contact details do not match this booking.' }
      }
    }

    const [svc, staff, salon] = await Promise.all([
      this.repos.services.findById(appt.serviceId),
      appt.staffId ? this.repos.staff.findById(appt.staffId) : null,
      this.repos.salons.findByTenantId(appt.tenantId),
    ])

    const apptDateTime = `${appt.appointmentDate}T${appt.startTime}:00`
    const canResched =
      canRescheduleAppointment(apptDateTime).canReschedule &&
      appt.status !== 'cancelled' &&
      appt.status !== 'completed'
    const canCanc = appt.status !== 'cancelled' && appt.status !== 'completed'

    return {
      booking: {
        id: appt.id,
        bookingReference: appt.bookingReference,
        tenantId: appt.tenantId,
        salonName: salon?.name || 'Barbershop',
        salonAddress: salon?.address || salon?.addressStreet || 'Salon Address',
        serviceName: svc?.name || 'Barber Service',
        staffName: staff?.name || 'Any Staff',
        appointmentDate: appt.appointmentDate,
        startTime: appt.startTime,
        durationMinutes: appt.durationMinutes,
        status: appt.status,
        paymentStatus: appt.paymentStatus,
        totalCharged: appt.totalCharged,
        totalPaid: appt.totalPaid,
        canCancel: canCanc,
        canReschedule: canResched,
      },
    }
  }}

export interface GuestBookingDetails {
  id: string
  bookingReference: string
  tenantId: string
  salonName: string
  salonAddress: string
  serviceName: string
  staffName: string
  appointmentDate: string
  startTime: string
  durationMinutes: number
  status: AppointmentEntity['status']
  paymentStatus: AppointmentEntity['paymentStatus']
  totalCharged: number
  totalPaid: number
  canCancel: boolean
  canReschedule: boolean
}

export const appointmentService = new AppointmentService()