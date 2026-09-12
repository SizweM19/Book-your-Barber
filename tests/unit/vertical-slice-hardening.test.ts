import { describe, it, expect, beforeEach } from 'vitest'
import { repositories } from '@/infrastructure/repositories/container'
import { BookingService } from '@/application/services/BookingService'
import { AppointmentService } from '@/application/services/AppointmentService'
import { AuthService } from '@/application/auth/AuthService'

const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_TENANT_ID = '22222222-2222-2222-2222-222222222222'

describe('Booking Vertical Slice Hardening Suite', () => {
  let bookingService: BookingService
  let appointmentService: AppointmentService
  let authService: AuthService

  beforeEach(() => {
    bookingService = new BookingService(repositories)
    appointmentService = new AppointmentService(repositories)
    authService = new AuthService()
  })

  describe('1. Salon Repository Slug Resolution', () => {
    it('resolves known salon slug "fade-and-edge" to correct tenant', async () => {
      const salon = await repositories.salons.findBySlug('fade-and-edge')
      expect(salon).not.toBeNull()
      expect(salon?.name).toBe('Fade & Edge Barbershop')
      expect(salon?.tenantId).toBe(TEST_TENANT_ID)
      expect(salon?.active).toBe(true)
    })

    it('returns null for an invalid or unknown salon slug', async () => {
      const salon = await repositories.salons.findBySlug('unknown-barbershop')
      expect(salon).toBeNull()
    })

    it('retrieves salon by tenantId', async () => {
      const salon = await repositories.salons.findByTenantId(TEST_TENANT_ID)
      expect(salon).not.toBeNull()
      expect(salon?.slug).toBe('fade-and-edge')
    })
  })

  describe('2. CustomerService Delegation & Tenant Scoping', () => {
    it('creates or finds customer with tenant isolation', async () => {
      const uniquePhone = `082${Date.now().toString().slice(-7)}`

      // 1. Create booking in TEST_TENANT_ID
      const booking1 = await bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        staffId: 't1',
        date: '2026-09-15',
        time: '14:00',
        durationMinutes: 45,
        price: 150,
        customer: {
          name: 'Multi-Tenant Tester',
          phone: uniquePhone,
          email: 'tester@example.com',
        },
        paymentMethod: 'card',
      })

      expect(booking1.customer).toBeDefined()
      expect(booking1.customer.tenantId).toBe(TEST_TENANT_ID)
      expect(booking1.customer.phone).toBe(uniquePhone)

      // 2. Lookup in CustomerRepository directly
      const foundInTenant1 = await repositories.customers.findByPhone(TEST_TENANT_ID, uniquePhone)
      expect(foundInTenant1).not.toBeNull()
      expect(foundInTenant1?.id).toBe(booking1.customer.id)

      // 3. Verify cross-tenant isolation: phone does not leak into OTHER_TENANT_ID
      const foundInTenant2 = await repositories.customers.findByPhone(OTHER_TENANT_ID, uniquePhone)
      expect(foundInTenant2).toBeNull()
    })
  })

  describe('3. Canonical Reference & Database Consistency', () => {
    it('returns canonical reference and makes appointment retrievable by reference', async () => {
      const result = await bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        staffId: 't1',
        date: '2026-09-15',
        time: '15:00',
        durationMinutes: 45,
        price: 150,
        customer: {
          name: 'Lookup Customer',
          phone: '083 111 2233',
        },
        paymentMethod: 'card',
      })

      expect(result.bookingReference).toBeDefined()
      expect(result.bookingReference).toMatch(/^BYB-\d{8}-\d{5}$/)
      expect(result.appointment.bookingReference).toBe(result.bookingReference)

      // Lookup by reference from AppointmentRepository
      const lookedUp = await repositories.appointments.findByReference(result.bookingReference)
      expect(lookedUp).not.toBeNull()
      expect(lookedUp?.id).toBe(result.appointment.id)
      expect(lookedUp?.customerId).toBe(result.customer.id)
      expect(lookedUp?.appointmentDate).toBe('2026-09-15')
      expect(lookedUp?.startTime).toBe('15:00')
    })
  })

  describe('4. Appointment Lifecycle: Cancellation & Status Updates', () => {
    it('processes salon-initiated cancellation with full refund and no fee', async () => {
      const booking = await bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        staffId: 't1',
        date: '2026-09-15',
        time: '16:00',
        durationMinutes: 45,
        price: 150,
        customer: {
          name: 'Cancel Me',
          phone: '084 555 6677',
        },
        paymentMethod: 'card',
      })

      const cancelResult = await appointmentService.cancelAppointment(booking.appointment.id, 'salon')
      expect(cancelResult.error).toBeUndefined()
      expect(cancelResult.appointment?.status).toBe('cancelled')
      expect(cancelResult.feePercent).toBe(0)
      expect(cancelResult.refundAmount).toBe(150)

      // Verify appointment status updated in repository
      const updatedAppt = await repositories.appointments.findById(booking.appointment.id)
      expect(updatedAppt?.status).toBe('cancelled')
    })

    it('marks appointment as no-show', async () => {
      const booking = await bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        staffId: 't1',
        date: '2026-09-15',
        time: '17:00',
        durationMinutes: 45,
        price: 150,
        customer: {
          name: 'No Show Tester',
          phone: '084 777 8899',
        },
        paymentMethod: 'cash',
      })

      const marked = await appointmentService.markNoShow(booking.appointment.id)
      expect(marked.status).toBe('noShow')

      const updated = await repositories.appointments.findById(booking.appointment.id)
      expect(updated?.status).toBe('noShow')
    })

    it('updates appointment status via updateAppointmentStatus', async () => {
      const booking = await bookingService.createBooking({
        tenantId: TEST_TENANT_ID,
        serviceId: 's1',
        staffId: 't1',
        date: '2026-09-16',
        time: '09:00',
        durationMinutes: 45,
        price: 150,
        customer: {
          name: 'Status Tester',
          phone: '084 123 9999',
        },
        paymentMethod: 'cash',
      })

      const updated = await appointmentService.updateAppointmentStatus(booking.appointment.id, 'inProgress')
      expect(updated.status).toBe('inProgress')

      const reloaded = await repositories.appointments.findById(booking.appointment.id)
      expect(reloaded?.status).toBe('inProgress')
    })
  })

  describe('5. Development Authentication Isolation', () => {
    it('authenticates valid dev accounts in non-production environment', async () => {
      const originalEnv = process.env.NODE_ENV
      try {
        ;(process.env as any).NODE_ENV = 'development'
        const res = await authService.login({
          email: 'owner@fadeandedge.co.za',
          password: 'password123',
        })

        expect(res.error).toBeNull()
        expect(res.user).not.toBeNull()
        expect(res.user?.email).toBe('owner@fadeandedge.co.za')
        expect(res.user?.memberships[0]?.role).toBe('OWNER')
        expect(res.user?.memberships[0]?.tenantId).toBe(TEST_TENANT_ID)
      } finally {
        ;(process.env as any).NODE_ENV = originalEnv
      }
    })

    it('rejects incorrect credentials even in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      try {
        ;(process.env as any).NODE_ENV = 'development'
        const res = await authService.login({
          email: 'owner@fadeandedge.co.za',
          password: 'wrongpassword',
        })

        expect(res.user).toBeNull()
        expect(res.error).not.toBeNull()
      } finally {
        ;(process.env as any).NODE_ENV = originalEnv
      }
    })
  })
})
