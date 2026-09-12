import { describe, it, expect, beforeEach } from 'vitest'
import { BookingService } from '@/application/services/BookingService'
import { AppointmentService } from '@/application/services/AppointmentService'
import { repositories } from '@/infrastructure/repositories/container'

const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111'

describe('Booking Service & Concurrency (BookingService)', () => {
  let bookingService: BookingService
  let appointmentService: AppointmentService

  beforeEach(() => {
    bookingService = new BookingService(repositories)
    appointmentService = new AppointmentService(repositories)
  })

  it('successfully creates a valid booking with reference and customer resolution', async () => {
    // 2026-09-14 is Monday. Themba (t1) is free at 08:00 for s1 (Classic Haircut)
    const result = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      staffId: 't1',
      date: '2026-09-14',
      time: '08:00',
      durationMinutes: 45,
      price: 150,
      customer: {
        name: 'Kagiso Rabada',
        phone: '081 999 8888',
        email: 'kagiso@gmail.com',
      },
      paymentMethod: 'card',
    })

    expect(result.appointment).toBeDefined()
    expect(result.appointment.startTime).toBe('08:00')
    expect(result.appointment.appointmentDate).toBe('2026-09-14')
    expect(result.appointment.staffId).toBe('t1')
    expect(result.appointment.status).toBe('confirmed')
    expect(result.appointment.paymentStatus).toBe('paid')
    expect(result.customer.phone).toBe('081 999 8888')

    // Stable, canonical booking reference
    expect(result.bookingReference).toMatch(/^BYB-\d{8}-\d{5}$/)
  })

  it('reuses existing customer by phone number', async () => {
    // Thabo Mokoena (c1) has phone '082 345 6789' in MockCustomerRepository
    // 09:00 is free (08:00-08:45 was booked in previous test)
    const result = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      staffId: 't1',
      date: '2026-09-14',
      time: '09:00',
      durationMinutes: 45,
      price: 150,
      customer: {
        name: 'Thabo Mokoena',
        phone: '082 345 6789',
      },
    })

    expect(result.customer.id).toBe('c1')
  })

  it('resolves ANY_AVAILABLE staff automatically and creates booking', async () => {
    const result = await bookingService.createBooking({
      tenantId: TEST_TENANT_ID,
      serviceId: 's1',
      staffId: 'any',
      date: '2026-09-14',
      time: '14:00',
      durationMinutes: 45,
      price: 150,
      customer: {
        name: 'David Miller',
        phone: '082 000 1111',
      },
    })

    expect(result.appointment).toBeDefined()
    expect(['t1', 't2']).toContain(result.appointment.staffId)
  })

  it('rejects booking when service does not exist', async () => {
    await expect(
      bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 'non-existent-service',
        date: '2026-09-14',
        time: '09:00',
        customer: { name: 'Test', phone: '082 123 4567' },
      })
    ).rejects.toThrow('Service not found.')
  })

  it('rejects booking when service is inactive', async () => {
    // s7 is Scalp Treatment (active: false in MockServiceRepository)
    await expect(
      bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's7',
        date: '2026-09-14',
        time: '09:00',
        customer: { name: 'Test', phone: '082 123 4567' },
      })
    ).rejects.toThrow('This service is currently unavailable.')
  })

  it('rejects booking when staff member is inactive', async () => {
    // t4 is Ntombi Dlamini (active: false in MockStaffRepository)
    await expect(
      bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        staffId: 't4',
        date: '2026-09-14',
        time: '09:00',
        customer: { name: 'Test', phone: '082 123 4567' },
      })
    ).rejects.toThrow('Selected staff member is currently inactive.')
  })

  it('rejects booking when staff is not assigned to service', async () => {
    // Devon (t2) does not do Beard Trim (s4)
    await expect(
      bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's4',
        staffId: 't2',
        date: '2026-09-14',
        time: '09:00',
        customer: { name: 'Test', phone: '082 123 4567' },
      })
    ).rejects.toThrow('Selected staff member cannot perform this service.')
  })

  it('rejects concurrent booking with standard conflict message', async () => {
    // We already booked 08:00 on 2026-09-14 for t1 with 45 mins duration in first test
    // Attempting to book 08:00 again must fail with exact required message
    await expect(
      bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        staffId: 't1',
        date: '2026-09-14',
        time: '08:00',
        durationMinutes: 45,
        customer: { name: 'Another Client', phone: '082 999 1234' },
      })
    ).rejects.toThrow('That appointment time is no longer available.')
  })

  describe('Appointment Reschedule Validation', () => {
    it('rejects rescheduling to an occupied slot without altering the original appointment', async () => {
      // Find appointment a1 (Themba on 2026-09-08 09:00)
      const apptBefore = await repositories.appointments.findById('a1')
      expect(apptBefore?.startTime).toBe('09:00')

      // Attempt to reschedule to 12:00 on 2026-09-14 (Themba's lunch break)
      const result = await appointmentService.rescheduleAppointment(
        'a1',
        '2026-09-14',
        '12:00',
        new Date('2026-09-01T08:00:00') // plenty of advance notice
      )

      expect(result.error).toBe('That appointment time is no longer available.')

      // Original appointment remains completely unchanged
      const apptAfter = await repositories.appointments.findById('a1')
      expect(apptAfter?.appointmentDate).toBe('2026-09-08')
      expect(apptAfter?.startTime).toBe('09:00')
    })

    it('successfully reschedules appointment to an available slot', async () => {
      // Reschedule to 15:00 on 2026-09-14 (open slot for Themba)
      const result = await appointmentService.rescheduleAppointment(
        'a1',
        '2026-09-14',
        '15:00',
        new Date('2026-09-01T08:00:00')
      )

      expect(result.error).toBeUndefined()
      expect(result.appointment?.appointmentDate).toBe('2026-09-14')
      expect(result.appointment?.startTime).toBe('15:00')

      // Check repository persistence
      const updated = await repositories.appointments.findById('a1')
      expect(updated?.appointmentDate).toBe('2026-09-14')
      expect(updated?.startTime).toBe('15:00')
    })
  })
})
