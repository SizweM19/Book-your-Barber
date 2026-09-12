import { describe, it, expect, beforeAll } from 'vitest'
import { createBrowserClient } from '@supabase/ssr'
import { getRepositories, createSupabaseContainer } from '@/infrastructure/repositories/container'
import { createAdminSupabaseClient } from '@/infrastructure/supabase/server'
import { BookingService } from '@/application/services/BookingService'
import { AppointmentService } from '@/application/services/AppointmentService'
import { CustomerService } from '@/application/services/CustomerService'
import { AvailabilityService } from '@/application/services/AvailabilityService'

// Set environment for integration test
process.env.INTEGRATION_TEST = 'true'
process.env.NEXT_PUBLIC_USE_SUPABASE = 'true'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jezrogioagnuworbmgue.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LXONyNNZVrLsk9-ldu7sHA_8OyldzJy'
const FADE_AND_EDGE_TENANT = '11111111-1111-1111-1111-111111111111'

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('Live Supabase Integration & E2E Verification Suite', () => {
  // Public / Anonymous customer perspective (browser client)
  const repos = getRepositories('supabase')
  const bookingService = new BookingService(repos)
  const appointmentService = new AppointmentService(repos)
  const customerService = new CustomerService(repos)
  const availabilityService = new AvailabilityService(repos)

  // Salon Staff / Server Operator perspective (admin/privileged client)
  const adminRepos = createSupabaseContainer(createAdminSupabaseClient())
  const adminAppointmentService = new AppointmentService(adminRepos)
  const adminCustomerService = new CustomerService(adminRepos)
  const adminAvailabilityService = new AvailabilityService(adminRepos)

  const anonClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  let activeServiceId: string
  let activeStaffId: string
  let createdCustomerPhone: string
  let createdCustomerId: string
  let createdBookingRef: string
  let createdAppointmentId: string
  let createdBookingDate: string

  beforeAll(async () => {
    // Ensure remote connectivity
    expect(SUPABASE_URL).toContain('jezrogioagnuworbmgue')
  })

  // ─── 1. LIVE SALON PROFILE & PUBLIC METADATA ──────────────────────────────────
  describe('1. Live Salon Profile & Public Metadata Verification', () => {
    it('resolves active salon profile by slug fade-and-edge', async () => {
      const salon = await repos.salons.findBySlug('fade-and-edge')
      expect(salon).not.toBeNull()
      expect(salon?.name).toBe('Fade & Edge Barbershop')
      expect(salon?.tenantId).toBe(FADE_AND_EDGE_TENANT)
      expect(salon?.currency).toBe('ZAR')
      expect(salon?.active).toBe(true)
    })

    it('resolves salon profile by tenant ID', async () => {
      const salon = await repos.salons.findByTenantId(FADE_AND_EDGE_TENANT)
      expect(salon).not.toBeNull()
      expect(salon?.slug).toBe('fade-and-edge')
    })

    it('loads active services for the tenant', async () => {
      const services = await repos.services.list(FADE_AND_EDGE_TENANT)
      expect(services.length).toBeGreaterThanOrEqual(6)
      
      const haircut = services.find(s => s.name === 'Classic Haircut')
      expect(haircut).toBeDefined()
      expect(haircut?.price).toBe(150)
      expect(haircut?.duration).toBe(45)

      activeServiceId = haircut!.id
    })

    it('loads active staff members and capabilities', async () => {
      const staff = await repos.staff.list(FADE_AND_EDGE_TENANT)
      expect(staff.length).toBeGreaterThanOrEqual(3)

      const masterBarber = staff.find(s => s.name.includes('Themba'))
      expect(masterBarber).toBeDefined()
      expect(masterBarber?.active).toBe(true)

      activeStaffId = masterBarber!.id

      // Verify service capability assignment
      const eligibleStaff = await repos.staffServices.listStaffByService(FADE_AND_EDGE_TENANT, activeServiceId)
      expect(eligibleStaff).toContain(activeStaffId)

      const isEligible = await repos.staffServices.isEligible(FADE_AND_EDGE_TENANT, activeStaffId, activeServiceId)
      expect(isEligible).toBe(true)
    })

    it('loads weekly staff schedules and booking settings', async () => {
      const schedules = await repos.schedules.getWeeklySchedule(FADE_AND_EDGE_TENANT, activeStaffId)
      expect(schedules.length).toBeGreaterThan(0)

      const settings = await repos.settings.getBookingSettings(FADE_AND_EDGE_TENANT)
      expect(settings.tenant_id).toBe(FADE_AND_EDGE_TENANT)
      expect(settings.slot_interval_minutes).toBe(30)
      expect(settings.online_booking_enabled).toBe(true)
    })
  })

  // ─── 2. LIVE CUSTOMER DEDUPLICATION & CRM ─────────────────────────────────────
  describe('2. Live Customer Deduplication & CRM Verification', () => {
    it('creates a new customer and deduplicates on subsequent lookup by phone', async () => {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
      createdCustomerPhone = `082${randomSuffix}77`

      const cust1 = await adminCustomerService.findOrCreate(FADE_AND_EDGE_TENANT, {
        name: 'Live E2E Verification Customer',
        phone: createdCustomerPhone,
        email: `verify_${randomSuffix}@bookyourbarber.test`,
        notes: 'Integration test automated customer',
      })

      expect(cust1.id).toBeDefined()
      expect(cust1.tenantId).toBe(FADE_AND_EDGE_TENANT)
      expect(cust1.phone).toBe(createdCustomerPhone)
      createdCustomerId = cust1.id

      // Subsequent call with the same phone in CRM must return identical customer record
      const cust2 = await adminCustomerService.findOrCreate(FADE_AND_EDGE_TENANT, {
        name: 'Different Name Same Phone',
        phone: createdCustomerPhone,
        email: 'different@example.com',
      })

      expect(cust2.id).toBe(cust1.id)
      expect(cust2.name).toBe('Live E2E Verification Customer')
    })
  })

  // ─── 3. LIVE CUSTOMER BOOKING FLOW & REFERENCE GENERATION ────────────────────
  describe('3. Live Customer Booking Flow & Reference Generation', () => {
    it('successfully reserves an appointment with canonical reference', async () => {
      // Pick a future Monday dynamically within 14-28 days
      const d = new Date()
      d.setDate(d.getDate() + 14 + Math.floor(Math.random() * 14))
      while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
      const bookingDate = formatLocalDate(d)

      // Query available slots dynamically to ensure a guaranteed free slot
      const slots = await adminAvailabilityService.getAvailableSlots({
        tenantId: FADE_AND_EDGE_TENANT,
        staffId: activeStaffId,
        serviceId: activeServiceId,
        date: bookingDate,
      })
      const freeSlot = slots.find(s => s.available)
      expect(freeSlot).toBeDefined()
      const bookingTime = freeSlot!.time

      const result = await bookingService.createBooking({
        tenantId: FADE_AND_EDGE_TENANT,
        serviceId: activeServiceId,
        staffId: activeStaffId,
        date: bookingDate,
        time: bookingTime,
        customer: {
          name: 'Live E2E Booking Customer',
          phone: createdCustomerPhone,
          email: 'livebooking@bookyourbarber.test',
        },
        paymentMethod: 'cash',
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      expect(result.appointment).toBeDefined()
      expect(result.appointment.id).toBeDefined()
      expect(result.bookingReference).toMatch(/^BYB-\d{8}-[A-Z0-9]{5}$/)
      expect(result.appointment.tenantId).toBe(FADE_AND_EDGE_TENANT)
      expect(result.appointment.staffId).toBe(activeStaffId)
      expect(result.appointment.serviceId).toBe(activeServiceId)
      expect(result.appointment.status).toBe('confirmed')
      expect(result.appointment.paymentStatus).toBe('unpaid')
      expect(result.appointment.totalCharged).toBe(150)
      expect(result.appointment.totalPaid).toBe(0)

      createdBookingRef = result.bookingReference
      createdAppointmentId = result.appointment.id
      createdBookingDate = bookingDate
    })
  })

  // ─── 4. LIVE SALON OPERATIONS & LIFECYCLE ────────────────────────────────────
  describe('4. Live Salon Operations & Lifecycle State Updates', () => {
    it('reschedules an appointment to a new date and time', async () => {
      const slots = await adminAvailabilityService.getAvailableSlots({
        tenantId: FADE_AND_EDGE_TENANT,
        staffId: activeStaffId,
        serviceId: activeServiceId,
        date: createdBookingDate,
      })
      const freeReschedSlot = slots.find(s => s.available)
      expect(freeReschedSlot).toBeDefined()
      const targetTime = freeReschedSlot!.time

      const resched = await adminAppointmentService.rescheduleAppointment(
        createdAppointmentId,
        createdBookingDate,
        targetTime
      )

      expect(resched.error).toBeUndefined()
      expect(resched.appointment).toBeDefined()
      expect(resched.appointment!.id).toBe(createdAppointmentId)
      expect(resched.appointment!.startTime).toBe(targetTime)
      expect(resched.appointment!.appointmentDate).toBe(createdBookingDate)
    })

    it('updates status from confirmed to inProgress then completed', async () => {
      const inProgress = await adminRepos.appointments.updateStatus(createdAppointmentId, 'inProgress')
      expect(inProgress.status).toBe('inProgress')

      const completed = await adminRepos.appointments.updateStatus(createdAppointmentId, 'completed')
      expect(completed.status).toBe('completed')
    })

    it('records cash payment at shop updating totalPaid and paymentStatus', async () => {
      const paid = await adminRepos.appointments.recordPayment(createdAppointmentId, 150, 'paid')
      expect(paid.totalPaid).toBe(150)
      expect(paid.paymentStatus).toBe('paid')
    })
  })

  // ─── 5. LIVE GUEST BOOKING LOOKUP RPC ─────────────────────────────────────────
  describe('5. Live Guest Booking Lookup RPC Security Verification', () => {
    it('looks up booking details via lookup_guest_appointment RPC when phone matches', async () => {
      const result = await appointmentService.lookupGuestBooking(
        createdBookingRef,
        createdCustomerPhone
      )

      expect(result.error).toBeUndefined()
      expect(result.booking).toBeDefined()
      expect(result.booking?.bookingReference).toBe(createdBookingRef)
      expect(result.booking?.salonName).toBe('Fade & Edge Barbershop')
      expect(result.booking?.serviceName).toBe('Classic Haircut')
      expect(result.booking?.status).toBe('completed')
      expect(result.booking?.paymentStatus).toBe('paid')
      expect(result.booking?.totalPaid).toBe(150)
    })

    it('rejects guest lookup when phone does not match', async () => {
      const result = await appointmentService.lookupGuestBooking(
        createdBookingRef,
        '082 000 0000'
      )

      expect(result.booking).toBeUndefined()
      expect(result.error).toBeDefined()
    })
  })

  // ─── 6. LIVE GiST EXCLUSION CONSTRAINT (OVERLAP PREVENTION) ───────────────────
  describe('6. Live PostgreSQL GiST Exclusion Overlap Protection', () => {
    it('prevents overlapping bookings on the same staff member via database constraint', async () => {
      // Pick a future Monday within 35-45 days
      const d2 = new Date()
      d2.setDate(d2.getDate() + 35 + Math.floor(Math.random() * 7))
      while (d2.getDay() !== 1) d2.setDate(d2.getDate() + 1)
      const testDate = formatLocalDate(d2)

      const slots2 = await adminAvailabilityService.getAvailableSlots({
        tenantId: FADE_AND_EDGE_TENANT,
        staffId: activeStaffId,
        serviceId: activeServiceId,
        date: testDate,
      })
      const freeSlot2 = slots2.find(s => s.available)
      expect(freeSlot2).toBeDefined()
      const slotTime = freeSlot2!.time

      // First booking: 45 min duration
      const firstBooking = await bookingService.createBooking({
        tenantId: FADE_AND_EDGE_TENANT,
        serviceId: activeServiceId,
        staffId: activeStaffId,
        date: testDate,
        time: slotTime,
        durationMinutes: 45,
        customer: {
          name: 'GiST Overlap Test 1',
          phone: '0831112222',
        },
        paymentMethod: 'cash',
      })

      expect(firstBooking.appointment.id).toBeDefined()

      // Calculate an overlapping time 15 minutes after slotTime
      const [hStr, mStr] = slotTime.split(':')
      const totalMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + 15
      const overlapH = String(Math.floor(totalMins / 60)).padStart(2, '0')
      const overlapM = String(totalMins % 60).padStart(2, '0')
      const overlapTime = `${overlapH}:${overlapM}`

      // Attempt second overlapping booking directly at repository level:
      // Same staff, same date, overlapping interval (e.g. slotTime + 15 mins for 30 mins)
      await expect(
        repos.appointments.create({
          tenantId: FADE_AND_EDGE_TENANT,
          bookingReference: `BYB-TEST-${Date.now().toString().slice(-5)}`,
          customerId: createdCustomerId,
          serviceId: activeServiceId,
          staffId: activeStaffId,
          appointmentDate: testDate,
          startTime: overlapTime,
          durationMinutes: 30,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          totalCharged: 100,
          totalPaid: 0,
          bookingSource: 'online',
          reminderChannel: 'whatsapp',
        })
      ).rejects.toThrow(/scheduling conflict|no longer available/i)
    })
  })

  // ─── 7. LIVE RLS SECURITY BOUNDARY AUDIT ──────────────────────────────────────
  describe('7. Live Row Level Security (RLS) Isolation Boundary', () => {
    it('blocks anonymous enumeration of customers table (0 rows)', async () => {
      const { data, error } = await anonClient.from('customers').select('id, name, phone')
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('blocks anonymous enumeration of appointments table (0 rows)', async () => {
      const { data, error } = await anonClient.from('appointments').select('id, booking_reference')
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('allows anonymous reads of active salon profiles', async () => {
      const { data, error } = await anonClient.from('salon_profiles').select('id, salon_name, slug').eq('active', true)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(1)
      expect(data?.some(s => s.slug === 'fade-and-edge')).toBe(true)
    })

    it('allows anonymous reads of active services', async () => {
      const { data, error } = await anonClient.from('services').select('id, name').eq('active', true)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(6)
    })

    it('allows anonymous reads of active staff', async () => {
      const { data, error } = await anonClient.from('staff').select('id, name').eq('active', true)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(3)
    })
  })
})

