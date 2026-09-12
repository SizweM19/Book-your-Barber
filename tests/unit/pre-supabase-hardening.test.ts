import { describe, it, expect, beforeEach } from 'vitest'
import {
  MockSalonRepository,
  MockAppointmentRepository,
  MockCustomerRepository,
} from '@/infrastructure/repositories/MockRepositories'
import { CustomerService } from '@/application/services/CustomerService'
import { AppointmentService } from '@/application/services/AppointmentService'
import { BookingService } from '@/application/services/BookingService'
import { getRepositories } from '@/infrastructure/repositories/container'
import { isSupabaseConfigured, getClientSupabaseConfig } from '@/infrastructure/supabase/client'
import { resolveServerTenantContext } from '@/application/tenant/server'

describe('Pre-Supabase Integration Hardening Test Suite', () => {
  const TEST_TENANT = '11111111-1111-1111-1111-111111111111'
  const OTHER_TENANT = '22222222-2222-2222-2222-222222222222'

  describe('1. Salon Profile Repository Contract & Slug Uniqueness (Fix B1)', () => {
    let salonRepo: MockSalonRepository

    beforeEach(() => {
      salonRepo = new MockSalonRepository()
    })

    it('resolves salon profile by slug (case-insensitive)', async () => {
      const salon = await salonRepo.findBySlug('FADE-AND-EDGE')
      expect(salon).not.toBeNull()
      expect(salon?.slug).toBe('fade-and-edge')
      expect(salon?.name).toBe('Fade & Edge Barbershop')
      expect(salon?.active).toBe(true)
    })

    it('returns null for unknown salon slug', async () => {
      const salon = await salonRepo.findBySlug('non-existent-barber')
      expect(salon).toBeNull()
    })

    it('resolves salon profile by tenantId', async () => {
      const salon = await salonRepo.findByTenantId(TEST_TENANT)
      expect(salon).not.toBeNull()
      expect(salon?.tenantId).toBe(TEST_TENANT)
    })
  })

  describe('2. Supabase Client Configuration & Fallback (Fix B2)', () => {
    it('detects when Supabase is in mock/offline mode', () => {
      const isConfigured = isSupabaseConfigured()
      expect(typeof isConfigured).toBe('boolean')
    })

    it('provides safe placeholder fallback credentials when not configured', () => {
      const config = getClientSupabaseConfig()
      expect(config.url).toBeDefined()
      expect(config.key).toBeDefined()
      expect(config.url).not.toBe('')
      expect(config.key).not.toBe('')
    })
  })

  describe('3. Tenant Context Resolution & No Hardcoded Production Dependency (Fix B3)', () => {
    it('resolves dev tenant context in non-production environment', async () => {
      // In development mode, resolveServerTenantContext returns valid dev tenant
      const context = await resolveServerTenantContext()
      expect(context).not.toBeNull()
      expect(context?.tenantId).toBe(TEST_TENANT)
      expect(context?.role).toBeDefined()
      expect(context?.tenant.name).toBe('Fade & Edge Barbershop')
    })

    it('does not allow arbitrary unverified tenant parameter', async () => {
      // Trying to resolve another tenant the user does not belong to
      const context = await resolveServerTenantContext(OTHER_TENANT)
      // In dev fallback, it returns the user's actual tenant, not the arbitrary requested one
      expect(context?.tenantId).toBe(TEST_TENANT)
    })
  })

  describe('4. Double-Booking Protection & Concurrency Invariants (Fix H2)', () => {
    let apptRepo: MockAppointmentRepository

    beforeEach(() => {
      apptRepo = new MockAppointmentRepository()
    })

    it('rejects two appointments for the same staff member at the exact same date and time', async () => {
      const date = '2026-10-01'
      const time = '10:00'
      const staffId = 't1'

      // First booking succeeds
      await apptRepo.create({
        tenantId: TEST_TENANT,
        bookingReference: 'BYB-20261001-00001',
        customerId: 'c1',
        serviceId: 's1',
        staffId,
        appointmentDate: date,
        startTime: time,
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Second booking for same staff at same time must throw a conflict error
      await expect(
        apptRepo.create({
          tenantId: TEST_TENANT,
          bookingReference: 'BYB-20261001-00002',
          customerId: 'c2',
          serviceId: 's2',
          staffId,
          appointmentDate: date,
          startTime: time,
          durationMinutes: 30,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          totalCharged: 80,
          totalPaid: 0,
          bookingSource: 'online',
          reminderChannel: 'whatsapp',
        })
      ).rejects.toThrow(/Double-booking conflict/)
    })

    it('allows non-overlapping appointments for the same staff member on the same day', async () => {
      const date = '2026-10-02'
      const staffId = 't1'

      const appt1 = await apptRepo.create({
        tenantId: TEST_TENANT,
        bookingReference: 'BYB-20261002-00001',
        customerId: 'c1',
        serviceId: 's1',
        staffId,
        appointmentDate: date,
        startTime: '09:00',
        durationMinutes: 45, // 09:00 - 09:45
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Starts after first appointment finishes
      const appt2 = await apptRepo.create({
        tenantId: TEST_TENANT,
        bookingReference: 'BYB-20261002-00002',
        customerId: 'c2',
        serviceId: 's2',
        staffId,
        appointmentDate: date,
        startTime: '10:00', // 10:00 - 10:30
        durationMinutes: 30,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 80,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      expect(appt1.id).toBeDefined()
      expect(appt2.id).toBeDefined()
    })

    it('permits booking a slot that was previously cancelled', async () => {
      const date = '2026-10-03'
      const time = '11:00'
      const staffId = 't1'

      const appt1 = await apptRepo.create({
        tenantId: TEST_TENANT,
        bookingReference: 'BYB-20261003-00001',
        customerId: 'c1',
        serviceId: 's1',
        staffId,
        appointmentDate: date,
        startTime: time,
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Cancel the appointment
      await apptRepo.updateStatus(appt1.id, 'cancelled')

      // Creating a new booking into the cancelled slot must succeed
      const appt2 = await apptRepo.create({
        tenantId: TEST_TENANT,
        bookingReference: 'BYB-20261003-00002',
        customerId: 'c2',
        serviceId: 's1',
        staffId,
        appointmentDate: date,
        startTime: time,
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      expect(appt2.id).toBeDefined()
    })

    it('enforces booking reference uniqueness', async () => {
      const duplicateRef = 'BYB-UNIQUE-REF-001'

      await apptRepo.create({
        tenantId: TEST_TENANT,
        bookingReference: duplicateRef,
        customerId: 'c1',
        serviceId: 's1',
        appointmentDate: '2026-10-04',
        startTime: '09:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      await expect(
        apptRepo.create({
          tenantId: TEST_TENANT,
          bookingReference: duplicateRef,
          customerId: 'c2',
          serviceId: 's2',
          appointmentDate: '2026-10-04',
          startTime: '10:00',
          durationMinutes: 30,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          totalCharged: 80,
          totalPaid: 0,
          bookingSource: 'online',
          reminderChannel: 'whatsapp',
        })
      ).rejects.toThrow(/Unique constraint violation/)
    })
  })

  describe('5. Customer Creation Tenant Scoping (Fix H3)', () => {
    let customerService: CustomerService

    beforeEach(() => {
      customerService = new CustomerService()
    })

    it('rejects customer creation if tenantId is missing or empty', async () => {
      await expect(
        customerService.findOrCreate('', {
          name: 'Jane Doe',
          phone: '0812345678',
        })
      ).rejects.toThrow(/Tenant ID is required/)
    })

    it('scopes customer lookup and creation strictly to tenantId', async () => {
      const phone = '0829998877'
      const c1 = await customerService.findOrCreate(TEST_TENANT, {
        name: 'Client In Tenant A',
        phone,
      })
      expect(c1.tenantId).toBe(TEST_TENANT)

      const c2 = await customerService.findOrCreate(OTHER_TENANT, {
        name: 'Client In Tenant B',
        phone,
      })
      expect(c2.tenantId).toBe(OTHER_TENANT)
      expect(c2.id).not.toBe(c1.id)
    })
  })

  describe('6. Public Appointment Lookup Security Boundary (Fix H1)', () => {
    let apptService: AppointmentService
    let repos: ReturnType<typeof getRepositories>

    beforeEach(async () => {
      repos = getRepositories('mock')
      apptService = new AppointmentService(repos)
    })

    it('returns minimal guest booking details when reference and phone match', async () => {
      const res = await apptService.lookupGuestBooking(
        'BYB-20260908-00481',
        '082 345 6789' // Thabo Mokoena phone
      )

      expect(res.error).toBeUndefined()
      expect(res.booking).toBeDefined()
      expect(res.booking?.bookingReference).toBe('BYB-20260908-00481')
      expect(res.booking?.salonName).toBe('Fade & Edge Barbershop')
      expect(res.booking?.serviceName).toBe('Classic Haircut')
      // Sensitive internal CRM data must NOT be present on the returned booking object
      expect((res.booking as any).notes).toBeUndefined()
      expect((res.booking as any).expenses).toBeUndefined()
    })

    it('rejects lookup when phone does not match booking customer', async () => {
      const res = await apptService.lookupGuestBooking(
        'BYB-20260908-00481',
        '071 000 0000' // wrong phone
      )

      expect(res.error).toBe('The contact details do not match this booking.')
      expect(res.booking).toBeUndefined()
    })

    it('rejects lookup when reference does not exist', async () => {
      const res = await apptService.lookupGuestBooking(
        'BYB-NONEXISTENT',
        '082 345 6789'
      )

      expect(res.error).toBe('No booking found with this reference.')
      expect(res.booking).toBeUndefined()
    })
  })

  describe('7. Public Booking Flow Tenant Isolation (BookingService)', () => {
    let bookingService: BookingService
    let repos: ReturnType<typeof getRepositories>

    beforeEach(() => {
      repos = getRepositories('mock')
      bookingService = new BookingService(repos)
    })

    it('rejects booking when service does not belong to the requested salon tenant', async () => {
      await expect(
        bookingService.createBooking({
          tenantId: OTHER_TENANT, // Arbitrary tenant ID supplied
          serviceId: 's1',        // Belongs to TEST_TENANT
          date: '2026-10-10',
          time: '14:00',
          customer: {
            name: 'Attempted Cross-Tenant',
            phone: '0821234567',
          },
          paymentMethod: 'cash',
        })
      ).rejects.toThrow(/This service is currently unavailable|Service not found/)
    })
  })
})
