import { describe, it, expect, beforeEach } from 'vitest'
import {
  SalonOperationsFacade,
  OpsAppointmentListItem,
  OpsAppointmentDetail,
  OpsAppointmentSummary,
} from '@/application/facades/SalonOperationsFacade'
import type {
  AppointmentEntity,
  CustomerEntity,
  ExpenseEntity,
  SalonEntity,
  ServiceEntity,
  StaffEntity,
} from '@/application/repositories/interfaces'
import type { RepositoryContainer } from '@/infrastructure/repositories/container'

describe('SalonOperationsFacade — Architecture & Tenant Isolation Tests', () => {
  const TENANT_A = 'tenant-salon-a'
  const TENANT_B = 'tenant-salon-b'

  let mockRepos: RepositoryContainer
  let mockApptService: any
  let mockBookingService: any
  let mockAvailService: any
  let mockPayService: any
  let mockRefundService: any
  let mockNotifService: any

  let appts: AppointmentEntity[]
  let customers: CustomerEntity[]
  let services: ServiceEntity[]
  let staff: StaffEntity[]
  let expenses: ExpenseEntity[]
  let payments: any[]
  let refunds: any[]
  let notifications: any[]

  beforeEach(() => {
    appts = [
      {
        id: 'appt-1',
        tenantId: TENANT_A,
        bookingReference: 'BYB-20260901-00001',
        customerId: 'cust-1',
        serviceId: 'svc-1',
        staffId: 'staff-1',
        appointmentDate: '2026-09-17',
        startTime: '10:00',
        durationMinutes: 30,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalCharged: 250,
        totalPaid: 250,
        bookingSource: 'online',
        reminderChannel: 'whatsapp',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
      {
        id: 'appt-2',
        tenantId: TENANT_B,
        bookingReference: 'BYB-20260901-00002',
        customerId: 'cust-2',
        serviceId: 'svc-2',
        staffId: 'staff-2',
        appointmentDate: '2026-09-17',
        startTime: '11:00',
        durationMinutes: 45,
        status: 'booked',
        paymentStatus: 'unpaid',
        totalCharged: 300,
        totalPaid: 0,
        bookingSource: 'online',
        reminderChannel: 'sms',
        createdAt: '2026-09-01T11:00:00Z',
        updatedAt: '2026-09-01T11:00:00Z',
      },
    ]

    customers = [
      {
        id: 'cust-1',
        tenantId: TENANT_A,
        name: 'Sipho Zulu',
        phone: '0821234567',
        email: 'sipho@example.com',
        segment: 'regular',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'cust-2',
        tenantId: TENANT_B,
        name: 'John Doe',
        phone: '0839876543',
        email: 'john@example.com',
        segment: 'new',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]

    services = [
      {
        id: 'svc-1',
        tenantId: TENANT_A,
        name: 'Signature Fade',
        category: 'Haircuts',
        duration: 30,
        price: 250,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'svc-2',
        tenantId: TENANT_B,
        name: 'Beard Trim',
        category: 'Beard',
        duration: 20,
        price: 150,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]

    staff = [
      {
        id: 'staff-1',
        tenantId: TENANT_A,
        name: 'Marcus Master Barber',
        role: 'Senior Barber',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'staff-2',
        tenantId: TENANT_B,
        name: 'David Blade',
        role: 'Barber',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]

    expenses = []
    payments = []
    refunds = []
    notifications = []

    mockRepos = {
      appointments: {
        findById: async (id: string) => appts.find(a => a.id === id) || null,
        findByReference: async (ref: string) => appts.find(a => a.bookingReference === ref) || null,
        listByTenant: async (tid: string) => appts.filter(a => a.tenantId === tid),
        listByDate: async (tid: string, date: string) =>
          appts.filter(a => a.tenantId === tid && a.appointmentDate === date),
        create: async (data: any) => {
          const created = { id: `appt-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          appts.push(created)
          return created
        },
        updateStatus: async (id: string, status: any) => {
          const a = appts.find(item => item.id === id)
          if (!a) throw new Error('Not found')
          a.status = status
          return a
        },
        updateDateTime: async (id: string, date: string, time: string) => {
          const a = appts.find(item => item.id === id)
          if (!a) throw new Error('Not found')
          a.appointmentDate = date
          a.startTime = time
          return a
        },
        recordPayment: async (id: string, amount: number, paymentStatus: any) => {
          const a = appts.find(item => item.id === id)
          if (!a) throw new Error('Not found')
          a.totalPaid += amount
          a.paymentStatus = paymentStatus
          return a
        },
      } as any,
      customers: {
        findById: async (id: string) => customers.find(c => c.id === id) || null,
        findByPhone: async (tid: string, phone: string) =>
          customers.find(c => c.tenantId === tid && c.phone === phone) || null,
        list: async (tid: string) => customers.filter(c => c.tenantId === tid),
        create: async (data: any) => {
          const created = { id: `cust-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          customers.push(created)
          return created
        },
        update: async (id: string, data: any) => {
          const c = customers.find(item => item.id === id)
          if (!c) throw new Error('Customer not found')
          Object.assign(c, data)
          return c
        },
      } as any,
      services: {
        findById: async (id: string) => services.find(s => s.id === id) || null,
        list: async (tid: string) => services.filter(s => s.tenantId === tid),
        create: async (data: any) => {
          const created = { id: `svc-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          services.push(created)
          return created
        },
        update: async (id: string, data: any) => {
          const s = services.find(item => item.id === id)
          if (!s) throw new Error('Service not found')
          Object.assign(s, data)
          return s
        },
      } as any,
      staff: {
        findById: async (id: string) => staff.find(st => st.id === id) || null,
        list: async (tid: string) => staff.filter(st => st.tenantId === tid),
        create: async (data: any) => {
          const created = { id: `staff-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          staff.push(created)
          return created
        },
        update: async (id: string, data: any) => {
          const st = staff.find(item => item.id === id)
          if (!st) throw new Error('Staff not found')
          Object.assign(st, data)
          return st
        },
      } as any,
      expenses: {
        findById: async (id: string) => expenses.find(e => e.id === id) || null,
        list: async (tid: string) => expenses.filter(e => e.tenantId === tid),
        create: async (data: any) => {
          const created = { id: `exp-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          expenses.push(created)
          return created
        },
        update: async () => ({} as any),
        delete: async () => true,
      } as any,
      payments: {
        listByAppointment: async (apptId: string) => payments.filter(p => p.appointmentId === apptId),
        record: async (data: any) => {
          const p = { id: `pay-${Date.now()}`, ...data, recordedAt: new Date().toISOString() }
          payments.push(p)
          return p
        },
      } as any,
      refunds: {
        listByAppointment: async (apptId: string) => refunds.filter(r => r.appointmentId === apptId),
      } as any,
      notifications: {
        listByAppointment: async (apptId: string) => notifications.filter(n => n.appointmentId === apptId),
      } as any,
      salons: {
        findByTenantId: async (tid: string) => ({
          id: `salon-${tid}`,
          tenantId: tid,
          name: 'Fade & Edge Barbershop',
          slug: 'fade-and-edge',
          active: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      } as any,
    } as any

    mockApptService = {
      completeAppointment: async (id: string) => {
        const a = appts.find(x => x.id === id)
        if (!a) return { error: 'Not found' }
        a.status = 'completed'
        return { success: true, appointment: a }
      },
      cancelAppointment: async (id: string, cancelledBy: string, reference: string) => {
        const a = appts.find(x => x.id === id)
        if (!a) return { error: 'Not found' }
        a.status = 'cancelled'
        return { success: true, appointment: a, bookingReference: reference }
      },
      updateAppointmentStatus: async (id: string, status: any) => {
        const a = appts.find(x => x.id === id)
        if (a) a.status = status
        return a
      },
      rescheduleAppointment: async (id: string, date: string, time: string) => {
        const a = appts.find(x => x.id === id)
        if (!a) return { error: 'Not found' }
        a.appointmentDate = date
        a.startTime = time
        return { success: true, appointment: a }
      },
    }

    mockBookingService = {
      createBooking: async (payload: any) => {
        const created: AppointmentEntity = {
          id: `appt-manual-${Date.now()}`,
          tenantId: payload.tenantId,
          bookingReference: `BYB-${Date.now()}`,
          customerId: 'cust-manual',
          serviceId: payload.serviceId,
          staffId: payload.staffId,
          appointmentDate: payload.date,
          startTime: payload.time,
          durationMinutes: 30,
          status: 'confirmed',
          paymentStatus: payload.paymentMethod === 'card' ? 'paid' : 'unpaid',
          totalCharged: 250,
          totalPaid: payload.paymentMethod === 'card' ? 250 : 0,
          bookingSource: 'manual',
          reminderChannel: 'none',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        appts.push(created)
        return { bookingReference: created.bookingReference, appointment: created }
      },
    }

    mockAvailService = {
      getAvailableSlots: async () => [{ time: '10:00', available: true }],
      getAvailableStaffAndSlots: async () => ({ slots: [{ time: '10:00', available: true }] }),
    }

    mockPayService = {
      recordSalonPayment: async ({ appointmentId, amount }: any) => {
        const a = appts.find(x => x.id === appointmentId)
        if (a) {
          a.totalPaid += amount
          if (a.totalPaid >= a.totalCharged) a.paymentStatus = 'paid'
        }
      },
    }

    mockRefundService = {
      processRefund: async () => ({ status: 'completed' }),
      retryRefund: async () => ({ status: 'completed' }),
    }

    mockNotifService = {
      retryNotification: async () => {},
    }
  })

  it('enforces tenant ID assertion across all methods', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    await expect(facade.listAppointments('')).rejects.toThrow('Tenant ID is required')
    await expect(facade.getAppointmentDetails('   ', 'ref')).rejects.toThrow('Tenant ID is required')
    await expect(facade.getAppointmentSummary(null as any, 'ref')).rejects.toThrow('Tenant ID is required')
    await expect(facade.completeAppointment('', 'appt-1')).rejects.toThrow('Tenant ID is required')
    await expect(facade.cancelAppointment('', 'appt-1', 'ref')).rejects.toThrow('Tenant ID is required')
    await expect(facade.markNoShow('', 'appt-1')).rejects.toThrow('Tenant ID is required')
    await expect(facade.rescheduleAppointment('', 'appt-1', '2026-09-20', '10:00')).rejects.toThrow('Tenant ID is required')
    await expect(facade.listCustomersWithStats('')).rejects.toThrow('Tenant ID is required')
    await expect(facade.listStaffWithRevenue('')).rejects.toThrow('Tenant ID is required')
    await expect(facade.getDashboardData('')).rejects.toThrow('Tenant ID is required')
  })

  it('prevents cross-tenant access to appointments in getAppointmentDetails and getAppointmentSummary', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    // Appt 1 belongs to TENANT_A. TENANT_B cannot retrieve it!
    const detailB = await facade.getAppointmentDetails(TENANT_B, 'BYB-20260901-00001')
    expect(detailB).toBeNull()

    const summaryB = await facade.getAppointmentSummary(TENANT_B, 'BYB-20260901-00001')
    expect(summaryB).toBeNull()

    // TENANT_A can retrieve it
    const detailA = await facade.getAppointmentDetails(TENANT_A, 'BYB-20260901-00001')
    expect(detailA).not.toBeNull()
    expect(detailA?.customer).toBe('Sipho Zulu')
    expect(detailA?.service).toBe('Signature Fade')
    expect(detailA?.staff).toBe('Marcus Master Barber')
  })

  it('prevents cross-tenant actions in complete, cancel, no-show, reschedule, and payment', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    // Attempting to complete Appt 1 (Tenant A) from Tenant B must fail with error
    const completeRes = await facade.completeAppointment(TENANT_B, 'appt-1')
    expect(completeRes.success).toBe(false)
    expect(completeRes.error).toContain('Appointment not found for this salon')

    const cancelRes = await facade.cancelAppointment(TENANT_B, 'appt-1', 'ref')
    expect(cancelRes.success).toBe(false)
    expect(cancelRes.error).toContain('Appointment not found for this salon')

    const reschedRes = await facade.rescheduleAppointment(TENANT_B, 'appt-1', '2026-09-20', '14:00')
    expect(reschedRes.success).toBe(false)
    expect(reschedRes.error).toContain('Appointment not found for this salon')

    const payRes = await facade.recordPayment(TENANT_B, {
      appointmentId: 'appt-1',
      amount: 250,
      method: 'cash',
    })
    expect(payRes.success).toBe(false)
    expect(payRes.error).toContain('Appointment not found for this salon')
  })

  it('lists appointments scoped strictly to tenant and formats rich list items', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    const listA = await facade.listAppointments(TENANT_A)
    expect(listA.length).toBe(1)
    expect(listA[0].id).toBe('appt-1')
    expect(listA[0].customer).toBe('Sipho Zulu')
    expect(listA[0].service).toBe('Signature Fade')
    expect(listA[0].staff).toBe('Marcus Master Barber')
    expect(listA[0].charged).toBe(250)
    expect(listA[0].paid).toBe(250)
  })

  it('computes customer statistics correctly (visits, total spend, outstanding balance)', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    const customersA = await facade.listCustomersWithStats(TENANT_A)
    expect(customersA.length).toBe(1)
    expect(customersA[0].name).toBe('Sipho Zulu')
    expect(customersA[0].visits).toBe(1)
    expect(customersA[0].totalSpend).toBe(250)
    expect(customersA[0].outstandingBalance).toBe(0)
    expect(customersA[0].lastVisit).toBe('2026-09-17')
  })

  it('computes staff revenue correctly for today appointments', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    const staffA = await facade.listStaffWithRevenue(TENANT_A, '2026-09-17')
    expect(staffA.length).toBe(1)
    expect(staffA[0].name).toBe('Marcus Master Barber')
    expect(staffA[0].todayRevenue).toBe(250)
  })

  it('completes, cancels, marks no-show, and records payment for authorized salon', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    // Complete appointment
    const completeRes = await facade.completeAppointment(TENANT_A, 'appt-1')
    expect(completeRes.success).toBe(true)
    expect(appts.find(a => a.id === 'appt-1')?.status).toBe('completed')

    // Cancel appointment
    const cancelRes = await facade.cancelAppointment(TENANT_A, 'appt-1', 'BYB-20260901-00001')
    expect(cancelRes.success).toBe(true)
    expect(appts.find(a => a.id === 'appt-1')?.status).toBe('cancelled')

    // Mark no show
    const noShowRes = await facade.markNoShow(TENANT_A, 'appt-1')
    expect(noShowRes.success).toBe(true)
    expect(appts.find(a => a.id === 'appt-1')?.status).toBe('noShow')

    // Record payment
    const payRes = await facade.recordPayment(TENANT_A, {
      appointmentId: 'appt-1',
      amount: 100,
      method: 'cash',
    })
    expect(payRes.success).toBe(true)
  })

  it('creates manual appointment and delegates to booking service with manual source', async () => {
    const facade = new SalonOperationsFacade(mockRepos, mockApptService, mockBookingService, mockAvailService, mockPayService, mockRefundService, mockNotifService)

    const createRes = await facade.createManualAppointment(TENANT_A, {
      serviceId: 'svc-1',
      staffId: 'staff-1',
      date: '2026-09-20',
      time: '14:00',
      customer: {
        name: 'Walk-in Client',
        phone: '0812345678',
      },
      paymentMethod: 'cash',
    })

    expect(createRes.success).toBe(true)
    expect(createRes.bookingReference).toBeDefined()
    const created = appts.find(a => a.bookingReference === createRes.bookingReference)
    expect(created?.bookingSource).toBe('manual')
    expect(created?.tenantId).toBe(TENANT_A)
  })
})
