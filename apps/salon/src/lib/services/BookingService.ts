import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import { generateBookingReference } from '@/domains/booking/reference'
import type { AppointmentEntity, CustomerEntity } from '@/application/repositories/interfaces'
import { AvailabilityService } from './AvailabilityService'
import { CustomerService } from './CustomerService'

export interface CreateBookingInput {
  tenantId: string
  serviceId: string
  staffId?: string
  date: string
  time: string
  durationMinutes?: number
  price?: number
  customer: {
    name: string
    phone: string
    email?: string
  }
  reminderChannel?: 'whatsapp' | 'sms' | 'email' | 'none'
  paymentMethod?: 'cash' | 'card' | 'yoco' | 'payshap' | 'other'
  bookingSource?: 'online' | 'qr' | 'manual'
  now?: Date
}

export class BookingService {
  private availability: AvailabilityService
  private customerService: CustomerService

  constructor(private repos: RepositoryContainer = defaultRepositories) {
    this.availability = new AvailabilityService(repos)
    this.customerService = new CustomerService(repos)
  }

  /**
   * Orchestrates customer creation/lookup and appointment reservation.
   * Orchestrates customer lookup/creation, concurrency validation, and appointment reservation.
   * Performs server-side availability re-validation before committing the booking.
   */
  async createBooking(input: CreateBookingInput): Promise<{
    appointment: AppointmentEntity
    customer: CustomerEntity
    bookingReference: string
  }> {
    // 1. Resolve or create customer
    // 1. Validate Service
    const service = await this.repos.services.findById(input.serviceId)
    if (!service) {
      throw new Error('Service not found.')
    }
    if (!service.active || service.tenantId !== input.tenantId) {
      throw new Error('This service is currently unavailable.')
    }

    const duration = input.durationMinutes || service.duration
    const chargedPrice = input.price !== undefined ? input.price : service.price

    // 2. Resolve Staff & Validate Eligibility
    let resolvedStaffId = input.staffId

    if (!resolvedStaffId || resolvedStaffId === 'any') {
      // ANY AVAILABLE: resolve staff dynamically using assignment rules
      const anyAvail = await this.availability.getAvailableStaffAndSlots({
        tenantId: input.tenantId,
        serviceId: input.serviceId,
        date: input.date,
        now: input.now,
      })

      resolvedStaffId = anyAvail.assignmentMap[input.time]
      if (!resolvedStaffId) {
        throw new Error('That appointment time is no longer available.')
      }
    } else {
      // Explicit staff selected: validate active status & eligibility
      const staffMember = await this.repos.staff.findById(resolvedStaffId)
      if (!staffMember) {
        throw new Error('Selected staff member was not found.')
      }
      if (!staffMember.active || staffMember.tenantId !== input.tenantId) {
        throw new Error('Selected staff member is currently inactive.')
      }

      const isEligible = await this.repos.staffServices.isEligible(
        input.tenantId,
        resolvedStaffId,
        input.serviceId
      )
      if (!isEligible) {
        throw new Error('Selected staff member cannot perform this service.')
      }
    }

    // 3. Concurrency Protection: Re-validate slot availability prior to commit
    const slots = await this.availability.getAvailableSlots({
      tenantId: input.tenantId,
      staffId: resolvedStaffId,
      serviceId: input.serviceId,
      date: input.date,
      durationMinutes: duration,
      now: input.now,
    })

    const targetSlot = slots.find(s => s.time === input.time)
    if (!targetSlot || !targetSlot.available) {
      throw new Error('That appointment time is no longer available.')
    }

    // 4. Resolve or create tenant-scoped customer via CustomerService
    const customer = await this.customerService.findOrCreate(input.tenantId, {
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email,
    })

    // 5. Generate unique collision-resistant booking reference
    let bookingReference = generateBookingReference(new Date(input.date))
    let existingAppt = await this.repos.appointments.findByReference(bookingReference)
    let retries = 0
    while (existingAppt && retries < 20) {
      bookingReference = generateBookingReference(new Date(input.date))
      existingAppt = await this.repos.appointments.findByReference(bookingReference)
      retries++
    }

    // 6. Create appointment record
    const appointment = await this.repos.appointments.create({
      tenantId: input.tenantId,
      bookingReference,
      customerId: customer.id,
      serviceId: input.serviceId,
      staffId: resolvedStaffId,
      appointmentDate: input.date,
      startTime: input.time,
      durationMinutes: duration,
      status: 'confirmed',
      paymentStatus: input.paymentMethod === 'cash' ? 'unpaid' : 'paid',
      totalCharged: chargedPrice,
      totalPaid: input.paymentMethod === 'cash' ? 0 : chargedPrice,
      bookingSource: input.bookingSource || 'online',
      reminderChannel: input.reminderChannel || 'whatsapp',
    })

    return {
      appointment,
      customer,
      bookingReference,
    }
  }

  /**
   * Looks up an appointment and associated customer details by booking reference.
   */
  async lookupBooking(reference: string) {
    const appointment = await this.repos.appointments.findByReference(reference)
    if (!appointment) return null

    const customer = await this.repos.customers.findById(appointment.customerId)
    const service = await this.repos.services.findById(appointment.serviceId)
    const staff = appointment.staffId ? await this.repos.staff.findById(appointment.staffId) : null

    return {
      appointment,
      customer,
      service,
      staff,
    }
  }
}

export const bookingService = new BookingService()