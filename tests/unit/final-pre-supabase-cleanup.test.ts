import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  MockAppointmentRepository,
  MockCustomerRepository,
  MockStaffRepository,
  MockServiceRepository,
  MockSalonRepository,
} from '@/infrastructure/repositories/MockRepositories'
import { AppointmentService } from '@/application/services/AppointmentService'
import { BookingService } from '@/application/services/BookingService'
import { AvailabilityService } from '@/application/services/AvailabilityService'
import { getRepositories } from '@/infrastructure/repositories/container'

describe('Final Pre-Supabase Cleanup & Concurrency Hardening', () => {
  const TENANT_ID = '11111111-1111-1111-1111-111111111111'
  const STAFF_ID = 't1'
  const SERVICE_ID = 's1'
  const CUSTOMER_ID = 'c1'

  let apptRepo: MockAppointmentRepository
  let apptService: AppointmentService

  beforeEach(() => {
    apptRepo = new MockAppointmentRepository()
    apptService = new AppointmentService({ ...getRepositories('mock'), appointments: apptRepo })
  })

  describe('1. Double-Booking Overlap Detection with Duration (Task 1)', () => {
    it('prevents overlapping appointment when start times are different but intervals intersect (e.g. 09:00-10:00 vs 09:30-10:00)', async () => {
      // Create first appointment 09:00 - 10:00 (duration: 60)
      const appt1 = await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: CUSTOMER_ID,
        serviceId: SERVICE_ID,
        staffId: STAFF_ID,
        appointmentDate: '2026-10-15',
        startTime: '09:00',
        durationMinutes: 60,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-OVERLAP-1',
      })
      expect(appt1).toBeDefined()
      expect(appt1.startTime).toBe('09:00')

      // Attempt to book 09:30 - 10:00 (duration: 30) for same staff on same date
      await expect(
        apptRepo.create({
          tenantId: TENANT_ID,
          customerId: 'c2',
          serviceId: SERVICE_ID,
          staffId: STAFF_ID,
          appointmentDate: '2026-10-15',
          startTime: '09:30',
          durationMinutes: 30,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          totalCharged: 120,
          totalPaid: 0,
          bookingSource: 'online',
          bookingReference: 'TEST-OVERLAP-2',
        })
      ).rejects.toThrow(/Double-booking conflict|already booked/i)
    })

    it('prevents overlapping appointment when second appointment envelops or begins before first (e.g. 08:30-09:30 vs 09:00-10:00)', async () => {
      // Existing appointment 09:00 - 10:00
      await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: CUSTOMER_ID,
        serviceId: SERVICE_ID,
        staffId: STAFF_ID,
        appointmentDate: '2026-10-16',
        startTime: '09:00',
        durationMinutes: 60,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 200,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-OVERLAP-3',
      })

      // Attempt overlap starting earlier 08:30 - 09:30
      await expect(
        apptRepo.create({
          tenantId: TENANT_ID,
          customerId: 'c2',
          serviceId: SERVICE_ID,
          staffId: STAFF_ID,
          appointmentDate: '2026-10-16',
          startTime: '08:30',
          durationMinutes: 60,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          totalCharged: 200,
          totalPaid: 0,
          bookingSource: 'online',
          bookingReference: 'TEST-OVERLAP-4',
        })
      ).rejects.toThrow(/Double-booking conflict|already booked/i)
    })

    it('permits adjacent non-overlapping appointments (e.g. 09:00-09:30 and 09:30-10:00)', async () => {
      // First appointment 09:00 - 09:30
      const a1 = await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: CUSTOMER_ID,
        serviceId: SERVICE_ID,
        staffId: STAFF_ID,
        appointmentDate: '2026-10-17',
        startTime: '09:00',
        durationMinutes: 30,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 100,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-ADJACENT-1',
      })
      expect(a1).toBeDefined()

      // Second appointment 09:30 - 10:00
      const a2 = await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: 'c2',
        serviceId: SERVICE_ID,
        staffId: STAFF_ID,
        appointmentDate: '2026-10-17',
        startTime: '09:30',
        durationMinutes: 30,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 100,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-ADJACENT-2',
      })
      expect(a2).toBeDefined()
      expect(a2.startTime).toBe('09:30')
    })

    it('allows re-booking into a previously cancelled slot', async () => {
      // Book initial slot
      const initial = await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: CUSTOMER_ID,
        serviceId: SERVICE_ID,
        staffId: STAFF_ID,
        appointmentDate: '2026-10-18',
        startTime: '10:00',
        durationMinutes: 60,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-CANCELLED-1',
      })

      // Cancel it
      await apptRepo.updateStatus(initial.id, 'cancelled')

      // Re-book same slot and staff
      const replacement = await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: 'c2',
        serviceId: SERVICE_ID,
        staffId: STAFF_ID,
        appointmentDate: '2026-10-18',
        startTime: '10:00',
        durationMinutes: 60,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-CANCELLED-2',
      })
      expect(replacement).toBeDefined()
      expect(replacement.status).toBe('confirmed')
    })

    it('allows concurrent appointments at the same time for different staff members', async () => {
      const apptStaff1 = await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: CUSTOMER_ID,
        serviceId: SERVICE_ID,
        staffId: 't1',
        appointmentDate: '2026-10-19',
        startTime: '11:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-DIFF-STAFF-1',
      })

      const apptStaff2 = await apptRepo.create({
        tenantId: TENANT_ID,
        customerId: 'c2',
        serviceId: SERVICE_ID,
        staffId: 't2',
        appointmentDate: '2026-10-19',
        startTime: '11:00',
        durationMinutes: 45,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalCharged: 150,
        totalPaid: 0,
        bookingSource: 'online',
        bookingReference: 'TEST-DIFF-STAFF-2',
      })

      expect(apptStaff1.staffId).toBe('t1')
      expect(apptStaff2.staffId).toBe('t2')
    })
  })

  describe('2. Exclusion Constraint Schema Verification in Migration (Task 1)', () => {
    it('migration file defines btree_gist extension and exclude_overlapping_staff_appointments', () => {
      const migrationPath = path.resolve(
        process.cwd(),
        'supabase/migrations/20260911000001_pre_supabase_hardening.sql'
      )
      const migrationContent = fs.readFileSync(migrationPath, 'utf8')

      expect(migrationContent).toContain('CREATE EXTENSION IF NOT EXISTS btree_gist;')
      expect(migrationContent).toContain('DROP INDEX IF EXISTS idx_appointments_staff_slot_unique;')
      expect(migrationContent).toContain('appointment_range tsrange')
      expect(migrationContent).toContain('GENERATED ALWAYS AS')
      expect(migrationContent).toContain('exclude_overlapping_staff_appointments')
      expect(migrationContent).toContain('EXCLUDE USING gist')
      expect(migrationContent).toContain('tenant_id WITH =')
      expect(migrationContent).toContain('staff_id WITH =')
      expect(migrationContent).toContain('appointment_range WITH &&')
      expect(migrationContent).toContain("WHERE (status NOT IN ('cancelled') AND staff_id IS NOT NULL)")
    })

    it('migration file enforces active tenant check on appointments INSERT policy', () => {
      const migrationPath = path.resolve(
        process.cwd(),
        'supabase/migrations/20260911000001_pre_supabase_hardening.sql'
      )
      const migrationContent = fs.readFileSync(migrationPath, 'utf8')

      expect(migrationContent).toContain('CREATE POLICY "Appointments can be created for active salons"')
      expect(migrationContent).toContain('ON appointments FOR INSERT')
      expect(migrationContent).toContain('WHERE id = tenant_id')
      expect(migrationContent).toContain("status = 'active'")
    })
  })

  describe('3. Token Audit & Fallback Removal in Production Code (Tasks 2, 3, 4, 5, 6)', () => {
    it('App.tsx does not contain MOCK_LOOKUP or mock SLOTS array', () => {
      const appPath = path.resolve(process.cwd(), 'src/App.tsx')
      const appContent = fs.readFileSync(appPath, 'utf8')

      expect(appContent).not.toContain('const MOCK_LOOKUP')
      expect(appContent).not.toContain('MOCK_LOOKUP.')
      expect(appContent).not.toContain('const SLOTS =')
      expect(appContent).not.toContain('slots = SLOTS')
      expect(appContent).toContain('No booking found')
      // It has the new error boundary
      expect(appContent).toContain('We could not find an active or verified booking record.')
    })

    it('Appointments.tsx does not contain SIMPLE_SLOTS and does not initialize dbAppts to OPS_APPOINTMENTS', () => {
      const apptsPath = path.resolve(process.cwd(), 'src/ops/Appointments.tsx')
      const apptsContent = fs.readFileSync(apptsPath, 'utf8')

      expect(apptsContent).not.toContain('SIMPLE_SLOTS')
      expect(apptsContent).not.toContain('const [dbAppts, setDbAppts] = useState<typeof OPS_APPOINTMENTS>(OPS_APPOINTMENTS)')
      expect(apptsContent).toContain('const [dbAppts, setDbAppts] = useState<any[]>([])')
      // Dynamic today date is used for filtering
      expect(apptsContent).toContain('new Date().toISOString().split("T")[0]')
    })

    it('Calendar.tsx does not initialize allAppts to OPS_APPOINTMENTS and uses dynamic today', () => {
      const calPath = path.resolve(process.cwd(), 'src/ops/Calendar.tsx')
      const calContent = fs.readFileSync(calPath, 'utf8')

      expect(calContent).not.toContain('const [allAppts, setAllAppts] = useState<typeof OPS_APPOINTMENTS>(OPS_APPOINTMENTS)')
      expect(calContent).toContain('const [allAppts, setAllAppts] = useState<typeof OPS_APPOINTMENTS>([])')
      expect(calContent).toContain('new Date().toISOString().split("T")[0]')
    })

    it('No production UI or application files contain DEFAULT_TENANT_ID', () => {
      const filesToCheck = [
        'src/App.tsx',
        'src/SalonOps.tsx',
        'src/ops/Appointments.tsx',
        'src/ops/Calendar.tsx',
        'src/application/services/BookingService.ts',
        'src/application/services/AvailabilityService.ts',
        'src/application/services/AppointmentService.ts',
        'src/application/services/CustomerService.ts',
      ]

      for (const relPath of filesToCheck) {
        const fullPath = path.resolve(process.cwd(), relPath)
        const fileContent = fs.readFileSync(fullPath, 'utf8')
        expect(fileContent).not.toContain('DEFAULT_TENANT_ID')
      }
    })
  })
})
