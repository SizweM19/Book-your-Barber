import { describe, it, expect, beforeEach } from 'vitest'
import { FinancialService } from '@/application/services/FinancialService'
import {
  MockSalonRepository,
  MockCustomerRepository,
  MockServiceRepository,
  MockStaffRepository,
  MockAppointmentRepository,
  MockPaymentRepository,
  MockRefundRepository,
  MockExpenseRepository,
  MockStaffServiceRepository,
  MockScheduleRepository,
  MockSalonSettingsRepository,
} from '@/infrastructure/repositories/MockRepositories'
import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { createMockContainer } from '@/infrastructure/repositories/container'

describe('FinancialService Domain & Display Unit Tests', () => {
  let repos: RepositoryContainer
  let financialService: FinancialService
  const TENANT_A = 'tenant-salon-a'
  const TENANT_B = 'tenant-salon-b'

  beforeEach(() => {
    // Instantiate fresh repositories for total test isolation
    repos = createMockContainer()
    financialService = new FinancialService(repos)
  })

  describe('Period Filtering (isInPeriod)', () => {
    const fixedNow = new Date('2026-06-15T12:00:00Z')

    it('correctly filters for Today', () => {
      expect(financialService.isInPeriod('2026-06-15', 'Today', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-06-15T09:30:00Z', 'Today', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-06-14', 'Today', fixedNow)).toBe(false)
      expect(financialService.isInPeriod('2026-06-16', 'Today', fixedNow)).toBe(false)
    })

    it('correctly filters for Week (last 7 days)', () => {
      expect(financialService.isInPeriod('2026-06-15', 'Week', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-06-09', 'Week', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-06-08', 'Week', fixedNow)).toBe(false)
      expect(financialService.isInPeriod('2026-06-16', 'Week', fixedNow)).toBe(false)
    })

    it('correctly filters for Month', () => {
      expect(financialService.isInPeriod('2026-06-01', 'Month', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-06-30', 'Month', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-05-31', 'Month', fixedNow)).toBe(false)
      expect(financialService.isInPeriod('2026-07-01', 'Month', fixedNow)).toBe(false)
    })

    it('correctly filters for Last month', () => {
      expect(financialService.isInPeriod('2026-05-01', 'Last month', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-05-31', 'Last month', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('2026-06-01', 'Last month', fixedNow)).toBe(false)
      expect(financialService.isInPeriod('2026-04-30', 'Last month', fixedNow)).toBe(false)
    })

    it('returns true for All for any valid date and false for invalid dates', () => {
      expect(financialService.isInPeriod('2024-01-01', 'All', fixedNow)).toBe(true)
      expect(financialService.isInPeriod('', 'Today', fixedNow)).toBe(false)
      expect(financialService.isInPeriod('not-a-date', 'Today', fixedNow)).toBe(false)
    })
  })

  describe('Financial Overview & Math Invariants', () => {
    it('computes operating result = collected - expenses with zero floating-point drift', async () => {
      const todayStr = new Date().toISOString().split('T')[0]

      // Create appointment in Tenant A
      const appt = await repos.appointments.create({
        tenantId: TENANT_A,
        bookingReference: 'REF-001',
        customerId: 'cust-1',
        serviceId: 'srv-1',
        staffId: 'staff-1',
        appointmentDate: todayStr,
        startTime: '10:00',
        durationMinutes: 30,
        status: 'completed',
        totalCharged: 250,
        totalPaid: 250,
        paymentStatus: 'paid',
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Record payment for Tenant A
      await repos.payments.record({
        tenantId: TENANT_A,
        appointmentId: appt.id,
        amount: 250,
        method: 'card',
        status: 'successful',
        providerReference: 'tx-001',
      })

      // Record an expense for Tenant A
      await repos.expenses.create({
        tenantId: TENANT_A,
        category: 'Products',
        description: 'Blade cleaner',
        amount: 80,
        expenseDate: todayStr,
      })

      const overview = await financialService.getFinancialOverview(TENANT_A, 'Today')
      expect(overview.totalCollected).toBe(250)
      expect(overview.totalExpenses).toBe(80)
      expect(overview.operatingResult).toBe(170) // 250 - 80
      expect(overview.totalOutstanding).toBe(0)
    })

    it('enforces multi-tenant isolation', async () => {
      const todayStr = new Date().toISOString().split('T')[0]

      // Tenant A
      await repos.appointments.create({
        tenantId: TENANT_A,
        bookingReference: 'REF-A',
        customerId: 'cust-A',
        serviceId: 'srv-1',
        staffId: 'staff-1',
        appointmentDate: todayStr,
        startTime: '09:00',
        durationMinutes: 30,
        status: 'confirmed',
        totalCharged: 200,
        totalPaid: 0,
        paymentStatus: 'unpaid',
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Tenant B
      await repos.appointments.create({
        tenantId: TENANT_B,
        bookingReference: 'REF-B',
        customerId: 'cust-B',
        serviceId: 'srv-2',
        staffId: 'staff-2',
        appointmentDate: todayStr,
        startTime: '09:00',
        durationMinutes: 30,
        status: 'confirmed',
        totalCharged: 900,
        totalPaid: 0,
        paymentStatus: 'unpaid',
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const overviewA = await financialService.getFinancialOverview(TENANT_A, 'All')
      const overviewB = await financialService.getFinancialOverview(TENANT_B, 'All')

      expect(overviewA.totalCharged).toBe(200)
      expect(overviewA.totalOutstanding).toBe(200)
      expect(overviewB.totalCharged).toBe(900)
      expect(overviewB.totalOutstanding).toBe(900)
    })

    it('never allows negative outstanding balance', async () => {
      const todayStr = new Date().toISOString().split('T')[0]

      // Create an appointment where totalPaid matches totalCharged
      await repos.appointments.create({
        tenantId: TENANT_A,
        bookingReference: 'REF-PAID',
        customerId: 'cust-1',
        serviceId: 'srv-1',
        staffId: 'staff-1',
        appointmentDate: todayStr,
        startTime: '11:00',
        durationMinutes: 30,
        status: 'confirmed',
        totalCharged: 150,
        totalPaid: 150,
        paymentStatus: 'paid',
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      const outstanding = await financialService.getOutstandingAppointments(TENANT_A)
      expect(outstanding.length).toBe(0)
    })
  })

  describe('Revenue Breakdown Resolution', () => {
    it('aggregates revenue by staff, source, and payment method', async () => {
      const todayStr = new Date().toISOString().split('T')[0]

      // Staff member
      const staffMember = await repos.staff.create({
        tenantId: TENANT_A,
        name: 'Thabo Barber',
        role: 'Master Barber',
        active: true,
      })

      // Service
      const service = await repos.services.create({
        tenantId: TENANT_A,
        name: 'Signature Fade',
        duration: 30,
        price: 250,
        category: 'Haircuts',
        active: true,
      })

      // Completed appointment
      const appt = await repos.appointments.create({
        tenantId: TENANT_A,
        bookingReference: 'REF-THABO',
        customerId: 'cust-1',
        serviceId: service.id,
        staffId: staffMember.id,
        appointmentDate: todayStr,
        startTime: '14:00',
        durationMinutes: 30,
        status: 'completed',
        totalCharged: 250,
        totalPaid: 250,
        paymentStatus: 'paid',
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
      })

      // Online card payment
      await repos.payments.record({
        tenantId: TENANT_A,
        appointmentId: appt.id,
        amount: 250,
        method: 'card',
        status: 'successful',
        providerReference: 'tx-thabo-001',
      })

      const breakdown = await financialService.getRevenueBreakdown(TENANT_A, 'Today')

      expect(breakdown.totalCollected).toBe(250)

      // Staff breakdown
      const staffEntry = breakdown.byStaff.find(s => s.id === staffMember.id)
      expect(staffEntry).toBeDefined()
      expect(staffEntry?.completedCount).toBe(1)
      expect(staffEntry?.revenue).toBe(250)

      // Source breakdown
      const onlineSource = breakdown.bySource.find(s => s.source === 'online')
      expect(onlineSource).toBeDefined()
      expect(onlineSource?.revenue).toBe(250)
      expect(onlineSource?.percentage).toBe(100)

      // Method breakdown
      const cardMethod = breakdown.byMethod.find(m => m.method === 'card')
      expect(cardMethod).toBeDefined()
      expect(cardMethod?.amount).toBe(250)
      expect(cardMethod?.percentage).toBe(100)
    })
  })
})
