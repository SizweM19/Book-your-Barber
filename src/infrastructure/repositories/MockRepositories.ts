import type {
  CustomerEntity,
  CustomerRepository,
  ServiceEntity,
  ServiceRepository,
  StaffEntity,
  StaffRepository,
  AppointmentEntity,
  AppointmentRepository,
  PaymentRepository,
  RefundRepository,
  ExpenseEntity,
  ExpenseRepository,
  StaffServiceRepository,
  ScheduleRepository,
  SalonSettingsRepository,
  SalonEntity,
  SalonRepository,
} from '@/application/repositories/interfaces'
import type {
  DomainPaymentRecord,
  DomainRefundRecord,
  DomainRefundStatus,
} from '@/domains/payments/types'
import type {
  CanonicalStaffWorkingHours,
  CanonicalScheduleBreak,
  CanonicalScheduleException,
  SalonBookingSettings,
} from '@/domains/canonical/types'

const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111'

let mockIdCounter = 0
function generateMockId(prefix: string): string {
  mockIdCounter += 1
  return `${prefix}-${Date.now()}-${mockIdCounter}-${Math.random().toString(36).substring(2, 7)}`
}

export class MockCustomerRepository implements CustomerRepository {
  private customers: CustomerEntity[] = [
    { id: 'c1', tenantId: DEFAULT_TENANT_ID, name: 'Thabo Mokoena', phone: '082 345 6789', email: 'thabo@gmail.com', notes: 'Prefers Themba. Short sides.', segment: 'regular', createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 'c2', tenantId: DEFAULT_TENANT_ID, name: 'Lerato Dlamini', phone: '071 234 5678', email: 'lerato@gmail.com', notes: '', segment: 'returning', createdAt: '2025-04-01', updatedAt: '2026-09-08' },
    { id: 'c3', tenantId: DEFAULT_TENANT_ID, name: 'Sanele Khumalo', phone: '083 456 7890', email: 'sanele@gmail.com', notes: 'Regular. Beard + cut combo.', segment: 'vip', createdAt: '2024-10-01', updatedAt: '2026-09-08' },
    { id: 'c4', tenantId: DEFAULT_TENANT_ID, name: 'Busisiwe Nkosi', phone: '074 567 8901', email: 'busi@outlook.com', notes: 'First visit Dec. Very satisfied.', segment: 'new', createdAt: '2026-03-01', updatedAt: '2026-09-08' },
    { id: 'c5', tenantId: DEFAULT_TENANT_ID, name: 'Mpho Sithole', phone: '079 678 9012', email: 'mpho@gmail.com', notes: '', segment: 'atRisk', createdAt: '2026-06-01', updatedAt: '2026-09-08' },
  ]

  async findById(id: string) { return this.customers.find(c => c.id === id) || null }
  async findByPhone(tenantId: string, phone: string) { return this.customers.find(c => c.tenantId === tenantId && c.phone === phone) || null }
  async list(tenantId: string) { return this.customers.filter(c => c.tenantId === tenantId) }
  async create(data: Omit<CustomerEntity, 'id' | 'createdAt' | 'updatedAt'>) {
    const customer: CustomerEntity = {
      ...data,
      id: generateMockId('c'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.customers.push(customer)
    return customer
  }
  async update(id: string, data: Partial<CustomerEntity>) {
    const idx = this.customers.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Customer not found')
    this.customers[idx] = { ...this.customers[idx], ...data, updatedAt: new Date().toISOString() }
    return this.customers[idx]
  }
}

export class MockServiceRepository implements ServiceRepository {
  private services: ServiceEntity[] = [
    { id: 's1', tenantId: DEFAULT_TENANT_ID, name: 'Classic Haircut', category: 'Haircuts', description: 'Precision cut, style and finish', duration: 45, price: 150, active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 's2', tenantId: DEFAULT_TENANT_ID, name: 'Line-up and Edge', category: 'Haircuts', description: 'Sharp lines and clean fades only', duration: 20, price: 80, active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 's3', tenantId: DEFAULT_TENANT_ID, name: 'Kids Cut (Under 12)', category: 'Haircuts', description: 'Gentle cut for the little ones', duration: 30, price: 100, active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 's4', tenantId: DEFAULT_TENANT_ID, name: 'Beard Trim and Shape', category: 'Beard', description: 'Sculpted edges and hot towel finish', duration: 30, price: 120, active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 's5', tenantId: DEFAULT_TENANT_ID, name: 'Hot Towel Shave', category: 'Shaving', description: 'Traditional straight-razor shave', duration: 60, price: 200, active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 's6', tenantId: DEFAULT_TENANT_ID, name: 'Hair and Beard Combo', category: 'Combos', description: 'Full cut plus beard sculpt', duration: 75, price: 250, active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 's7', tenantId: DEFAULT_TENANT_ID, name: 'Scalp Treatment', category: 'Treatments', description: 'Invigorating scalp massage', duration: 45, price: 180, active: false, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
  ]

  async findById(id: string) { return this.services.find(s => s.id === id) || null }
  async list(tenantId: string, includeInactive = false) {
    return this.services.filter(s => s.tenantId === tenantId && (includeInactive || s.active))
  }
  async create(data: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt'>) {
    const service: ServiceEntity = {
      ...data,
      id: generateMockId('s'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.services.push(service)
    return service
  }
  async update(id: string, data: Partial<ServiceEntity>) {
    const idx = this.services.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Service not found')
    this.services[idx] = { ...this.services[idx], ...data, updatedAt: new Date().toISOString() }
    return this.services[idx]
  }
}

export class MockStaffRepository implements StaffRepository {
  private staff: StaffEntity[] = [
    { id: 't1', tenantId: DEFAULT_TENANT_ID, name: 'Themba Ndlovu', role: 'Master Barber', photoUrl: 'photo-1507003211169-0a1dd7228f2d', active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 't2', tenantId: DEFAULT_TENANT_ID, name: 'Devon Williams', role: 'Senior Stylist', photoUrl: 'photo-1472099645785-5658abf4ff4e', active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 't3', tenantId: DEFAULT_TENANT_ID, name: 'Aisha Jacobs', role: 'Style Specialist', photoUrl: 'photo-1494790108377-be9c29b29330', active: true, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
    { id: 't4', tenantId: DEFAULT_TENANT_ID, name: 'Ntombi Dlamini', role: 'Senior Barber', photoUrl: 'photo-1438761681033-6461ffad8d80', active: false, createdAt: '2025-01-01', updatedAt: '2026-09-08' },
  ]

  async findById(id: string) { return this.staff.find(s => s.id === id) || null }
  async list(tenantId: string, includeInactive = false) {
    return this.staff.filter(s => s.tenantId === tenantId && (includeInactive || s.active))
  }
  async create(data: Omit<StaffEntity, 'id' | 'createdAt' | 'updatedAt'>) {
    const member: StaffEntity = {
      ...data,
      id: generateMockId('t'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.staff.push(member)
    return member
  }
  async update(id: string, data: Partial<StaffEntity>) {
    const idx = this.staff.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Staff not found')
    this.staff[idx] = { ...this.staff[idx], ...data, updatedAt: new Date().toISOString() }
    return this.staff[idx]
  }
}

export class MockAppointmentRepository implements AppointmentRepository {
  private appointments: AppointmentEntity[] = [
    { id: 'a1', tenantId: DEFAULT_TENANT_ID, bookingReference: 'BYB-20260908-00481', customerId: 'c1', serviceId: 's1', staffId: 't1', appointmentDate: '2026-09-08', startTime: '09:00', durationMinutes: 45, status: 'completed', paymentStatus: 'paid', totalCharged: 150, totalPaid: 150, bookingSource: 'online', reminderChannel: 'whatsapp', createdAt: '2026-09-08', updatedAt: '2026-09-08' },
    { id: 'a2', tenantId: DEFAULT_TENANT_ID, bookingReference: 'BYB-20260908-00482', customerId: 'c2', serviceId: 's4', staffId: 't3', appointmentDate: '2026-09-08', startTime: '10:00', durationMinutes: 30, status: 'confirmed', paymentStatus: 'unpaid', totalCharged: 120, totalPaid: 0, bookingSource: 'online', reminderChannel: 'whatsapp', createdAt: '2026-09-08', updatedAt: '2026-09-08' },
    { id: 'a3', tenantId: DEFAULT_TENANT_ID, bookingReference: 'BYB-20260908-00483', customerId: 'c3', serviceId: 's6', staffId: 't1', appointmentDate: '2026-09-08', startTime: '11:00', durationMinutes: 75, status: 'inProgress', paymentStatus: 'paid', totalCharged: 250, totalPaid: 250, bookingSource: 'manual', reminderChannel: 'sms', createdAt: '2026-09-08', updatedAt: '2026-09-08' },
  ]

  async findById(id: string) { return this.appointments.find(a => a.id === id) || null }
  async findByReference(ref: string) { return this.appointments.find(a => a.bookingReference === ref) || null }
  async listByDate(tenantId: string, date: string) { return this.appointments.filter(a => a.tenantId === tenantId && a.appointmentDate === date) }
  async listByTenant(tenantId: string, limit = 50) { return this.appointments.filter(a => a.tenantId === tenantId).slice(0, limit) }
  async create(data: Omit<AppointmentEntity, 'id' | 'createdAt' | 'updatedAt' | 'reminderChannel'> & { reminderChannel?: 'whatsapp' | 'sms' | 'email' | 'none' }) {
    if (this.appointments.some(a => a.bookingReference === data.bookingReference)) {
      throw new Error(`Unique constraint violation: booking reference '${data.bookingReference}' already exists`)
    }

    // Database double-booking constraint simulation (Fix H2)
    if (data.staffId) {
      const [newH, newM] = data.startTime.split(':').map(Number)
      const newStartMins = newH * 60 + newM
      const newEndMins = newStartMins + (data.durationMinutes || 45)

      const conflict = this.appointments.find(a => {
        if (a.tenantId !== data.tenantId || a.staffId !== data.staffId || a.appointmentDate !== data.appointmentDate) {
          return false
        }
        if (a.status === 'cancelled') {
          return false
        }
        const [aH, aM] = a.startTime.split(':').map(Number)
        const aStartMins = aH * 60 + aM
        const aEndMins = aStartMins + (a.durationMinutes || 45)

        return newStartMins < aEndMins && aStartMins < newEndMins
      })

      if (conflict) {
        throw new Error(
          `Double-booking conflict: staff ${data.staffId} already has an overlapping appointment on ${data.appointmentDate} at ${conflict.startTime}`
        )
      }
    }

    const appt: AppointmentEntity = {
      ...data,
      reminderChannel: data.reminderChannel || 'whatsapp',
      id: generateMockId('a'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.appointments.unshift(appt)
    return appt
  }
  async updateStatus(id: string, status: AppointmentEntity['status']) {
    const idx = this.appointments.findIndex(a => a.id === id)
    if (idx === -1) throw new Error('Appointment not found')
    this.appointments[idx] = { ...this.appointments[idx], status, updatedAt: new Date().toISOString() }
    return this.appointments[idx]
  }
  async updateDateTime(id: string, date: string, time: string) {
    const idx = this.appointments.findIndex(a => a.id === id)
    if (idx === -1) throw new Error('Appointment not found')
    this.appointments[idx] = {
      ...this.appointments[idx],
      appointmentDate: date,
      startTime: time,
      updatedAt: new Date().toISOString(),
    }
    return this.appointments[idx]
  }
  async recordPayment(id: string, amount: number, paymentStatus: AppointmentEntity['paymentStatus']) {
    const idx = this.appointments.findIndex(a => a.id === id)
    if (idx === -1) throw new Error('Appointment not found')
    this.appointments[idx] = {
      ...this.appointments[idx],
      totalPaid: this.appointments[idx].totalPaid + amount,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    }
    return this.appointments[idx]
  }
}

export class MockPaymentRepository implements PaymentRepository {
  private payments: DomainPaymentRecord[] = [
    { id: 'p1', tenantId: DEFAULT_TENANT_ID, appointmentId: 'a1', amount: 150, method: 'card', status: 'successful', recordedAt: '2026-09-08 08:55' },
    { id: 'p2', tenantId: DEFAULT_TENANT_ID, appointmentId: 'a3', amount: 250, method: 'card', status: 'successful', recordedAt: '2026-09-08 10:58' },
  ]

  async findById(id: string) { return this.payments.find(p => p.id === id) || null }
  async listByAppointment(appointmentId: string) { return this.payments.filter(p => p.appointmentId === appointmentId) }
  async record(data: Omit<DomainPaymentRecord, 'id' | 'recordedAt'>) {
    const payment: DomainPaymentRecord = {
      ...data,
      id: generateMockId('p'),
      recordedAt: new Date().toISOString(),
    }
    this.payments.push(payment)
    return payment
  }
}

export class MockRefundRepository implements RefundRepository {
  private refunds: DomainRefundRecord[] = [
    { id: 'r1', tenantId: DEFAULT_TENANT_ID, refundReference: 'REF-20260907-001', appointmentId: 'a1', customerId: 'c2', originalAmount: 100, feePercent: 10, feeAmount: 10, refundAmount: 90, status: 'completed', cancelledBy: 'customer', requestedAt: '2026-09-07 14:20', completedAt: '2026-09-10 09:14' },
    { id: 'r2', tenantId: DEFAULT_TENANT_ID, refundReference: 'REF-20260908-002', appointmentId: 'a3', customerId: 'c3', originalAmount: 250, feePercent: 0, feeAmount: 0, refundAmount: 250, status: 'processing', cancelledBy: 'salon', requestedAt: '2026-09-08 16:05' },
  ]

  async findById(id: string) { return this.refunds.find(r => r.id === id) || null }
  async findByReference(ref: string) { return this.refunds.find(r => r.refundReference === ref) || null }
  async listByTenant(tenantId: string) { return this.refunds.filter(r => r.tenantId === tenantId) }
  async create(data: Omit<DomainRefundRecord, 'id' | 'requestedAt'>) {
    const refund: DomainRefundRecord = {
      ...data,
      id: generateMockId('r'),
      requestedAt: new Date().toISOString(),
    }
    this.refunds.unshift(refund)
    return refund
  }
  async updateStatus(id: string, status: DomainRefundStatus, failureReason?: string) {
    const idx = this.refunds.findIndex(r => r.id === id)
    if (idx === -1) throw new Error('Refund not found')
    this.refunds[idx] = {
      ...this.refunds[idx],
      status,
      failureReason,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    }
    return this.refunds[idx]
  }
}

export class MockExpenseRepository implements ExpenseRepository {
  private expenses: ExpenseEntity[] = [
    { id: 'e1', tenantId: DEFAULT_TENANT_ID, category: 'Rent', description: 'Monthly salon rent — September', amount: 8500, expenseDate: '2026-09-01', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
    { id: 'e2', tenantId: DEFAULT_TENANT_ID, category: 'Products', description: 'Hair products restock — Wahl, Andis', amount: 1200, expenseDate: '2026-09-03', createdAt: '2026-09-03', updatedAt: '2026-09-03' },
    { id: 'e3', tenantId: DEFAULT_TENANT_ID, category: 'Electricity', description: 'Municipal electricity bill', amount: 750, expenseDate: '2026-09-05', createdAt: '2026-09-05', updatedAt: '2026-09-05' },
  ]

  async findById(id: string) { return this.expenses.find(e => e.id === id) || null }
  async list(tenantId: string) { return this.expenses.filter(e => e.tenantId === tenantId) }
  async create(data: Omit<ExpenseEntity, 'id' | 'createdAt' | 'updatedAt'>) {
    const expense: ExpenseEntity = {
      ...data,
      id: generateMockId('e'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.expenses.unshift(expense)
    return expense
  }
  async update(id: string, data: Partial<ExpenseEntity>) {
    const idx = this.expenses.findIndex(e => e.id === id)
    if (idx === -1) throw new Error('Expense not found')
    this.expenses[idx] = { ...this.expenses[idx], ...data, updatedAt: new Date().toISOString() }
    return this.expenses[idx]
  }
  async delete(id: string) {
    const initialLen = this.expenses.length
    this.expenses = this.expenses.filter(e => e.id !== id)
    return this.expenses.length < initialLen
  }
}

export class MockStaffServiceRepository implements StaffServiceRepository {
  private mappings: { tenantId: string; staffId: string; serviceId: string }[] = [
    // Themba (t1): s1 (Classic Cut), s2 (Line-up), s4 (Beard Trim), s5 (Hot Towel Shave), s6 (Combo)
    { tenantId: DEFAULT_TENANT_ID, staffId: 't1', serviceId: 's1' },
    { tenantId: DEFAULT_TENANT_ID, staffId: 't1', serviceId: 's2' },
    { tenantId: DEFAULT_TENANT_ID, staffId: 't1', serviceId: 's4' },
    { tenantId: DEFAULT_TENANT_ID, staffId: 't1', serviceId: 's5' },
    { tenantId: DEFAULT_TENANT_ID, staffId: 't1', serviceId: 's6' },
    // Devon (t2): s1 (Classic Cut), s2 (Line-up), s3 (Kids Cut)
    { tenantId: DEFAULT_TENANT_ID, staffId: 't2', serviceId: 's1' },
    { tenantId: DEFAULT_TENANT_ID, staffId: 't2', serviceId: 's2' },
    { tenantId: DEFAULT_TENANT_ID, staffId: 't2', serviceId: 's3' },
    // Aisha (t3): s4 (Beard Trim), s6 (Combo)
    { tenantId: DEFAULT_TENANT_ID, staffId: 't3', serviceId: 's4' },
    { tenantId: DEFAULT_TENANT_ID, staffId: 't3', serviceId: 's6' },
    // Ntombi (t4): s1 (inactive staff)
    { tenantId: DEFAULT_TENANT_ID, staffId: 't4', serviceId: 's1' },
  ]

  async listServicesByStaff(tenantId: string, staffId: string): Promise<string[]> {
    return this.mappings
      .filter(m => m.tenantId === tenantId && m.staffId === staffId)
      .map(m => m.serviceId)
  }

  async listStaffByService(tenantId: string, serviceId: string): Promise<string[]> {
    return this.mappings
      .filter(m => m.tenantId === tenantId && m.serviceId === serviceId)
      .map(m => m.staffId)
  }

  async isEligible(tenantId: string, staffId: string, serviceId: string): Promise<boolean> {
    return this.mappings.some(
      m => m.tenantId === tenantId && m.staffId === staffId && m.serviceId === serviceId
    )
  }

  async assignService(tenantId: string, staffId: string, serviceId: string): Promise<void> {
    if (!(await this.isEligible(tenantId, staffId, serviceId))) {
      this.mappings.push({ tenantId, staffId, serviceId })
    }
  }

  async unassignService(tenantId: string, staffId: string, serviceId: string): Promise<void> {
    this.mappings = this.mappings.filter(
      m => !(m.tenantId === tenantId && m.staffId === staffId && m.serviceId === serviceId)
    )
  }
}

export class MockScheduleRepository implements ScheduleRepository {
  private schedules: CanonicalStaffWorkingHours[] = [
    // t1 (Themba) - Mon-Fri: 08:00-18:00; Sat: 09:00-15:00; Sun: OFF
    { id: 'sch-t1-1', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', day_of_week: 1, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t1-2', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', day_of_week: 2, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t1-3', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', day_of_week: 3, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t1-4', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', day_of_week: 4, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t1-5', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', day_of_week: 5, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t1-6', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', day_of_week: 6, start_time: '09:00', end_time: '15:00', is_active: true, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t1-0', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', day_of_week: 0, start_time: '09:00', end_time: '14:00', is_active: false, created_at: '2025-01-01', updated_at: '2026-09-08' },

    // t2 (Devon) - split shift Mon-Fri: 08:00-12:00 and 14:00-18:00; Sat-Sun: OFF
    ...[1, 2, 3, 4, 5].map(day => ({
      id: `sch-t2-${day}`,
      tenant_id: DEFAULT_TENANT_ID,
      staff_id: 't2',
      day_of_week: day,
      start_time: '08:00',
      end_time: '18:00',
      periods: [
        { start_time: '08:00', end_time: '12:00' },
        { start_time: '14:00', end_time: '18:00' },
      ],
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2026-09-08',
    })),
    { id: 'sch-t2-6', tenant_id: DEFAULT_TENANT_ID, staff_id: 't2', day_of_week: 6, start_time: '09:00', end_time: '14:00', is_active: false, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t2-0', tenant_id: DEFAULT_TENANT_ID, staff_id: 't2', day_of_week: 0, start_time: '09:00', end_time: '14:00', is_active: false, created_at: '2025-01-01', updated_at: '2026-09-08' },

    // t3 (Aisha) - Tue-Sat: 09:00-17:00; Sun-Mon: OFF
    ...[2, 3, 4, 5, 6].map(day => ({
      id: `sch-t3-${day}`,
      tenant_id: DEFAULT_TENANT_ID,
      staff_id: 't3',
      day_of_week: day,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2026-09-08',
    })),
    { id: 'sch-t3-0', tenant_id: DEFAULT_TENANT_ID, staff_id: 't3', day_of_week: 0, start_time: '09:00', end_time: '14:00', is_active: false, created_at: '2025-01-01', updated_at: '2026-09-08' },
    { id: 'sch-t3-1', tenant_id: DEFAULT_TENANT_ID, staff_id: 't3', day_of_week: 1, start_time: '09:00', end_time: '14:00', is_active: false, created_at: '2025-01-01', updated_at: '2026-09-08' },
  ]

  private breaks: CanonicalScheduleBreak[] = [
    // t1 lunch break: 12:00 - 13:00
    { id: 'brk-t1', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', start_time: '12:00', end_time: '13:00', description: 'Lunch Break' },
    // t2 morning tea: 10:00 - 10:30
    { id: 'brk-t2', tenant_id: DEFAULT_TENANT_ID, staff_id: 't2', start_time: '10:00', end_time: '10:30', description: 'Morning Break' },
    // t3 afternoon lunch: 13:00 - 14:00
    { id: 'brk-t3', tenant_id: DEFAULT_TENANT_ID, staff_id: 't3', start_time: '13:00', end_time: '14:00', description: 'Lunch Break' },
  ]

  private exceptions: CanonicalScheduleException[] = [
    // t1 closed / day off on 2026-09-25
    { id: 'exc-t1-1', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', exception_date: '2026-09-25', is_working: false, reason: 'Personal Day Off' },
    // t1 custom hours on 2026-09-27 (Sunday): 12:00 - 16:00
    { id: 'exc-t1-2', tenant_id: DEFAULT_TENANT_ID, staff_id: 't1', exception_date: '2026-09-27', is_working: true, start_time: '12:00', end_time: '16:00', reason: 'Sunday Special Session' },
  ]

  async getWeeklySchedule(tenantId: string, staffId: string): Promise<CanonicalStaffWorkingHours[]> {
    return this.schedules.filter(s => s.tenant_id === tenantId && s.staff_id === staffId)
  }

  async setDaySchedule(
    tenantId: string,
    staffId: string,
    schedule: Omit<CanonicalStaffWorkingHours, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CanonicalStaffWorkingHours> {
    const idx = this.schedules.findIndex(
      s => s.tenant_id === tenantId && s.staff_id === staffId && s.day_of_week === schedule.day_of_week
    )
    const record: CanonicalStaffWorkingHours = {
      ...schedule,
      id: idx >= 0 ? this.schedules[idx].id : `sch-${Date.now()}`,
      created_at: idx >= 0 ? this.schedules[idx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (idx >= 0) {
      this.schedules[idx] = record
    } else {
      this.schedules.push(record)
    }
    return record
  }

  async getBreaks(tenantId: string, staffId: string): Promise<CanonicalScheduleBreak[]> {
    return this.breaks.filter(b => b.tenant_id === tenantId && b.staff_id === staffId)
  }

  async addBreak(
    tenantId: string,
    staffId: string,
    breakData: Omit<CanonicalScheduleBreak, 'id' | 'tenant_id' | 'staff_id'>
  ): Promise<CanonicalScheduleBreak> {
    const record: CanonicalScheduleBreak = {
      id: `brk-${Date.now()}`,
      tenant_id: tenantId,
      staff_id: staffId,
      ...breakData,
    }
    this.breaks.push(record)
    return record
  }

  async removeBreak(id: string): Promise<boolean> {
    const prevLen = this.breaks.length
    this.breaks = this.breaks.filter(b => b.id !== id)
    return this.breaks.length < prevLen
  }

  async getExceptions(tenantId: string, staffId: string, startDate?: string, endDate?: string): Promise<CanonicalScheduleException[]> {
    return this.exceptions.filter(e => {
      if (e.tenant_id !== tenantId || e.staff_id !== staffId) return false
      if (startDate && e.exception_date < startDate) return false
      if (endDate && e.exception_date > endDate) return false
      return true
    })
  }

  async addException(
    tenantId: string,
    staffId: string,
    exceptionData: Omit<CanonicalScheduleException, 'id' | 'tenant_id' | 'staff_id'>
  ): Promise<CanonicalScheduleException> {
    const record: CanonicalScheduleException = {
      id: `exc-${Date.now()}`,
      tenant_id: tenantId,
      staff_id: staffId,
      ...exceptionData,
    }
    this.exceptions.push(record)
    return record
  }

  async removeException(id: string): Promise<boolean> {
    const prevLen = this.exceptions.length
    this.exceptions = this.exceptions.filter(e => e.id !== id)
    return this.exceptions.length < prevLen
  }
}

export class MockSalonSettingsRepository implements SalonSettingsRepository {
  private settings: Record<string, SalonBookingSettings> = {
    [DEFAULT_TENANT_ID]: {
      tenant_id: DEFAULT_TENANT_ID,
      online_booking_enabled: true,
      slot_interval_minutes: 30,
      min_notice_minutes: 30,
      max_advance_days: 60,
      assignment_strategy: 'FIRST_AVAILABLE',
    },
  }

  async getBookingSettings(tenantId: string): Promise<SalonBookingSettings> {
    return this.settings[tenantId] || {
      tenant_id: tenantId,
      online_booking_enabled: true,
      slot_interval_minutes: 30,
      min_notice_minutes: 30,
      max_advance_days: 60,
      assignment_strategy: 'FIRST_AVAILABLE',
    }
  }

  async updateBookingSettings(tenantId: string, update: Partial<SalonBookingSettings>): Promise<SalonBookingSettings> {
    const current = await this.getBookingSettings(tenantId)
    this.settings[tenantId] = { ...current, ...update }
    return this.settings[tenantId]
  }
}

export class MockSalonRepository implements SalonRepository {
  private salons: SalonEntity[] = [
    {
      id: 'salon-1',
      tenantId: DEFAULT_TENANT_ID,
      name: 'Fade & Edge Barbershop',
      slug: 'fade-and-edge',
      tagline: 'Expert cuts, hot towel shaves, and beard sculpting',
      description: "Cape Town's most trusted barbershop since 2014. Expert cuts, hot towel shaves, and beard sculpting. Walk-ins welcome, appointments preferred.",
      addressStreet: '15 Loader Street',
      addressCity: 'De Waterkant, Cape Town',
      addressPostalCode: '8001',
      phone: '021 555 0192',
      email: 'info@fadeandedge.co.za',
      currency: 'ZAR',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2026-09-08T00:00:00Z',
    },
  ]

  async findBySlug(slug: string): Promise<SalonEntity | null> {
    const clean = slug.toLowerCase().trim()
    return this.salons.find(s => s.slug.toLowerCase() === clean && s.active) || null
  }

  async findById(id: string): Promise<SalonEntity | null> {
    return this.salons.find(s => s.id === id) || null
  }

  async findByTenantId(tenantId: string): Promise<SalonEntity | null> {
    return this.salons.find(s => s.tenantId === tenantId) || null
  }

  async list(): Promise<SalonEntity[]> {
    return this.salons.filter(s => s.active)
  }
}