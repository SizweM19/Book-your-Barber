import { describe, it, expect, beforeEach } from 'vitest'
import {
  MockCustomerRepository,
  MockStaffRepository,
  MockServiceRepository,
  MockAppointmentRepository,
  MockPaymentRepository,
  MockExpenseRepository,
} from '@/infrastructure/repositories/MockRepositories'

describe('Multi-Tenant RLS & Data Isolation Security Suite', () => {
  const TENANT_A = 'tenant-salon-a-fade-edge'
  const TENANT_B = 'tenant-salon-b-grooming-lounge'

  let customerRepo: MockCustomerRepository
  let staffRepo: MockStaffRepository
  let serviceRepo: MockServiceRepository
  let apptRepo: MockAppointmentRepository
  let paymentRepo: MockPaymentRepository
  let expenseRepo: MockExpenseRepository

  beforeEach(async () => {
    customerRepo = new MockCustomerRepository()
    staffRepo = new MockStaffRepository()
    serviceRepo = new MockServiceRepository()
    apptRepo = new MockAppointmentRepository()
    paymentRepo = new MockPaymentRepository()
    expenseRepo = new MockExpenseRepository()

    // ─── SEED TENANT A FIXTURES ───
    await customerRepo.create({
      tenantId: TENANT_A,
      name: 'Tenant A Customer',
      phone: '0821111111',
      email: 'custA@fadeandedge.co.za',
      segment: 'regular',
    })
    await staffRepo.create({
      tenantId: TENANT_A,
      name: 'Tenant A Barber',
      role: 'Master Barber',
      active: true,
    })
    await serviceRepo.create({
      tenantId: TENANT_A,
      name: 'Tenant A Haircut',
      category: 'Haircuts',
      duration: 45,
      price: 150,
      active: true,
    })
    await apptRepo.create({
      tenantId: TENANT_A,
      bookingReference: 'BYB-20260910-00001',
      customerId: 'cust-a-1',
      serviceId: 'svc-a-1',
      appointmentDate: '2026-09-15',
      startTime: '10:00',
      durationMinutes: 45,
      status: 'confirmed',
      paymentStatus: 'paid',
      totalCharged: 150,
      totalPaid: 150,
      bookingSource: 'online',
      reminderChannel: 'whatsapp',
    })
    await expenseRepo.create({
      tenantId: TENANT_A,
      category: 'Rent',
      description: 'Tenant A Shop Rent',
      amount: 8500,
      expenseDate: '2026-09-01',
    })

    // ─── SEED TENANT B FIXTURES ───
    await customerRepo.create({
      tenantId: TENANT_B,
      name: 'Tenant B Customer',
      phone: '0822222222',
      email: 'custB@groominglounge.co.za',
      segment: 'vip',
    })
    await staffRepo.create({
      tenantId: TENANT_B,
      name: 'Tenant B Barber',
      role: 'Stylist',
      active: true,
    })
    await serviceRepo.create({
      tenantId: TENANT_B,
      name: 'Tenant B Shave',
      category: 'Shaving',
      duration: 30,
      price: 200,
      active: true,
    })
    await apptRepo.create({
      tenantId: TENANT_B,
      bookingReference: 'BYB-20260910-00002',
      customerId: 'cust-b-1',
      serviceId: 'svc-b-1',
      appointmentDate: '2026-09-16',
      startTime: '11:00',
      durationMinutes: 30,
      status: 'confirmed',
      paymentStatus: 'paid',
      totalCharged: 200,
      totalPaid: 200,
      bookingSource: 'online',
      reminderChannel: 'sms',
    })
    await expenseRepo.create({
      tenantId: TENANT_B,
      category: 'Products',
      description: 'Tenant B Pomade Stock',
      amount: 3200,
      expenseDate: '2026-09-02',
    })
  })

  describe('Cross-Tenant Read Isolation', () => {
    it('prevents Tenant A from listing Tenant B customers', async () => {
      const customersA = await customerRepo.list(TENANT_A)
      expect(customersA.length).toBeGreaterThan(0)
      expect(customersA.every(c => c.tenantId === TENANT_A)).toBe(true)
      expect(customersA.some(c => c.tenantId === TENANT_B)).toBe(false)
    })

    it('prevents Tenant A from listing Tenant B staff', async () => {
      const staffA = await staffRepo.list(TENANT_A)
      expect(staffA.every(s => s.tenantId === TENANT_A)).toBe(true)
      expect(staffA.some(s => s.tenantId === TENANT_B)).toBe(false)
    })

    it('prevents Tenant A from listing Tenant B services', async () => {
      const servicesA = await serviceRepo.list(TENANT_A)
      expect(servicesA.every(s => s.tenantId === TENANT_A)).toBe(true)
      expect(servicesA.some(s => s.tenantId === TENANT_B)).toBe(false)
    })

    it('prevents Tenant A from reading Tenant B appointments', async () => {
      const apptsA = await apptRepo.listByTenant(TENANT_A)
      expect(apptsA.every(a => a.tenantId === TENANT_A)).toBe(true)
      expect(apptsA.some(a => a.tenantId === TENANT_B)).toBe(false)
    })

    it('prevents Tenant A from reading Tenant B expenses', async () => {
      const expensesA = await expenseRepo.list(TENANT_A)
      expect(expensesA.every(e => e.tenantId === TENANT_A)).toBe(true)
      expect(expensesA.some(e => e.tenantId === TENANT_B)).toBe(false)
    })
  })

  describe('Symmetric Tenant B Isolation', () => {
    it('prevents Tenant B from reading any Tenant A data', async () => {
      const customersB = await customerRepo.list(TENANT_B)
      const staffB = await staffRepo.list(TENANT_B)
      const servicesB = await serviceRepo.list(TENANT_B)
      const apptsB = await apptRepo.listByTenant(TENANT_B)
      const expensesB = await expenseRepo.list(TENANT_B)

      expect(customersB.every(c => c.tenantId === TENANT_B)).toBe(true)
      expect(staffB.every(s => s.tenantId === TENANT_B)).toBe(true)
      expect(servicesB.every(s => s.tenantId === TENANT_B)).toBe(true)
      expect(apptsB.every(a => a.tenantId === TENANT_B)).toBe(true)
      expect(expensesB.every(e => e.tenantId === TENANT_B)).toBe(true)
    })
  })

  describe('Cross-Tenant Mutation Boundaries', () => {
    it('guarantees tenant assignment on record creation', async () => {
      const newCust = await customerRepo.create({
        tenantId: TENANT_A,
        name: 'Another Tenant A Client',
        phone: '0833333333',
        segment: 'new',
      })
      expect(newCust.tenantId).toBe(TENANT_A)

      // Querying Tenant B list does NOT return this newly created customer
      const listB = await customerRepo.list(TENANT_B)
      expect(listB.some(c => c.id === newCust.id)).toBe(false)
    })

    it('prevents customer lookup across tenant boundaries by phone', async () => {
      // Customer belongs to Tenant A
      const foundInA = await customerRepo.findByPhone(TENANT_A, '0821111111')
      expect(foundInA).not.toBeNull()

      // Searching for same phone under Tenant B scope returns null
      const foundInB = await customerRepo.findByPhone(TENANT_B, '0821111111')
      expect(foundInB).toBeNull()
    })
  })
})

