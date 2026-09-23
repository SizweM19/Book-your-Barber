import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type {
  AppointmentEntity,
  CustomerEntity,
  ExpenseEntity,
  SalonEntity,
  ServiceEntity,
  StaffEntity,
  CanonicalStaffWorkingHours,
  CanonicalScheduleBreak,
  CanonicalScheduleException,
  SalonBookingSettings,
} from '@/application/repositories/interfaces'
import { appointmentService, AppointmentService } from '@/application/services/AppointmentService'
import { bookingService, BookingService } from '@/application/services/BookingService'
import { availabilityService, AvailabilityService } from '@/application/services/AvailabilityService'
import { paymentService, PaymentService } from '@/application/services/PaymentService'
import { refundService, RefundService } from '@/application/services/RefundService'
import { notificationService, NotificationService } from '@/application/services/NotificationService'
import type { PaymentMethod } from '@/ops/types'

// ─── TYPES & CONTRACTS ────────────────────────────────────────────────────────

export interface OpsAppointmentListItem {
  id: string
  ref: string
  customer: string
  customerId: string
  phone: string
  email: string
  service: string
  serviceId: string
  staff: string
  staffId: string
  date: string
  time: string
  duration: number
  charged: number
  paid: number
  paymentMethod: 'card' | 'cash'
  status: AppointmentEntity['status']
  paymentStatus: AppointmentEntity['paymentStatus']
  source: AppointmentEntity['bookingSource']
  reminderChannel: AppointmentEntity['reminderChannel']
  notifications: any[]
  payments: any[]
}

export interface OpsAppointmentDetail {
  id: string
  ref: string
  tenantId: string
  customer: string
  customerId: string
  phone: string
  email: string
  service: string
  serviceId: string
  staff: string
  staffId: string
  date: string
  time: string
  duration: number
  charged: number
  paid: number
  paymentMethod: 'card' | 'cash'
  status: AppointmentEntity['status']
  paymentStatus: AppointmentEntity['paymentStatus']
  source: AppointmentEntity['bookingSource']
  reminderChannel: AppointmentEntity['reminderChannel']
  notifications: Array<{
    id: string
    type: string
    channel: string
    status: string
    sentAt: string
    failReason?: string
  }>
  payments: any[]
  refunds: any[]
  cancellation: {
    id: string | null
    refundReference: string | null
    cancelledBy: string
    cancelledAt: string
    originalAmount: number
    feePercent: number
    feeAmount: number
    refundAmount: number
    refundStatus: string
    failureReason?: string
  } | null
}

export interface OpsAppointmentSummary {
  id: string
  ref: string
  tenantId: string
  customer: string
  service: string
  serviceId?: string
  staff: string
  staffId?: string
  date: string
  time: string
  charged: number
  paid: number
  outstanding: number
  paymentStatus: AppointmentEntity['paymentStatus']
  status: AppointmentEntity['status']
}

export interface OpsCustomerWithStats extends CustomerEntity {
  visits: number
  totalSpend: number
  lastVisit: string
  outstandingBalance: number
}

export interface OpsCustomerDetail extends CustomerEntity {
  since: string
  visits: number
  totalSpend: number
  lastVisit: string
  outstandingBalance: number
  appointments: Array<{
    id: string
    ref: string
    service: string
    staff: string
    date: string
    time: string
    charged: number
    paid: number
    status: AppointmentEntity['status']
    paymentStatus: AppointmentEntity['paymentStatus']
    notifications: any[]
  }>
  payments: Array<{
    id: string
    amount: number
    method: string
    status: string
    recordedAt: string
    apptRef: string
    service: string
    date: string
  }>
}

export interface OpsStaffWithRevenue extends StaffEntity {
  todayRevenue: number
}

export interface OpsStaffDetail {
  staff: StaffEntity
  metrics: {
    todayRevenue: number
    monthRevenue: number
    monthAppointments: number
    completionRate: number
    noShowCount: number
    uniqueCusts: number
    completed: number
    cancelled: number
  }
  weeklySchedule: CanonicalStaffWorkingHours[]
  breaks: CanonicalScheduleBreak[]
  exceptions: CanonicalScheduleException[]
  allServices: ServiceEntity[]
  assignedServiceIds: string[]
}

export interface CreateManualAppointmentPayload {
  serviceId: string
  staffId?: string
  date: string
  time: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  paymentMethod?: 'cash' | 'card'
}

// ─── SALON OPERATIONS FACADE ─────────────────────────────────────────────────

export class SalonOperationsFacade {
  constructor(
    private repos: RepositoryContainer = defaultRepositories,
    private apptSvc: AppointmentService = appointmentService,
    private bookSvc: BookingService = bookingService,
    private availSvc: AvailabilityService = availabilityService,
    private paySvc: PaymentService = paymentService,
    private refSvc: RefundService = refundService,
    private notifSvc: NotificationService = notificationService
  ) {}

  private assertTenant(tenantId?: string | null): string {
    if (!tenantId || tenantId.trim() === '') {
      throw new Error('Tenant ID is required for salon operations')
    }
    return tenantId.trim()
  }

  // ─── APPOINTMENT MANAGEMENT ──────────────────────────────────────────────────

  async listAppointments(tenantId: string): Promise<OpsAppointmentListItem[]> {
    const tid = this.assertTenant(tenantId)

    const [appts, servicesList, staffList] = await Promise.all([
      this.repos.appointments.listByTenant(tid),
      this.repos.services.list(tid, true),
      this.repos.staff.list(tid, true),
    ])

    if (appts.length === 0) return []

    // Fetch deduplicated unique customers
    const uniqueCustomerIds = Array.from(new Set(appts.map(a => a.customerId).filter(Boolean)))
    const customers = await Promise.all(uniqueCustomerIds.map(id => this.repos.customers.findById(id)))

    const customerMap = new Map(customers.filter(Boolean).map(c => [c!.id, c!]))
    const serviceMap = new Map(servicesList.map(s => [s.id, s.name]))
    const staffMap = new Map(staffList.map(s => [s.id, s.name]))

    return appts.map(a => {
      const cust = customerMap.get(a.customerId)
      const serviceName = serviceMap.get(a.serviceId) || 'Service'
      const staffName = a.staffId ? (staffMap.get(a.staffId) || 'Staff') : 'Staff'
      return {
        id: a.id,
        ref: a.bookingReference,
        customer: cust?.name || 'Customer',
        customerId: a.customerId,
        phone: cust?.phone || '',
        email: cust?.email || '',
        service: serviceName,
        serviceId: a.serviceId,
        staff: staffName,
        staffId: a.staffId || '',
        date: a.appointmentDate,
        time: a.startTime,
        duration: a.durationMinutes,
        charged: a.totalCharged,
        paid: a.totalPaid,
        paymentMethod: (a.paymentStatus === 'paid' ? 'card' : 'cash') as 'card' | 'cash',
        status: a.status,
        paymentStatus: a.paymentStatus,
        source: a.bookingSource,
        reminderChannel: a.reminderChannel,
        notifications: [],
        payments: [],
      }
    })
  }

  async getAppointmentDetails(tenantId: string, reference: string): Promise<OpsAppointmentDetail | null> {
    const tid = this.assertTenant(tenantId)
    if (!reference) return null

    const dbAppt = await this.repos.appointments.findByReference(reference)
    if (!dbAppt || dbAppt.tenantId !== tid) return null

    const [cust, svc, stf, payments, refunds, notifLogs] = await Promise.all([
      this.repos.customers.findById(dbAppt.customerId),
      this.repos.services.findById(dbAppt.serviceId),
      dbAppt.staffId ? this.repos.staff.findById(dbAppt.staffId) : Promise.resolve(null),
      this.repos.payments.listByAppointment(dbAppt.id),
      this.repos.refunds.listByAppointment ? this.repos.refunds.listByAppointment(dbAppt.id) : Promise.resolve([]),
      this.repos.notifications ? this.repos.notifications.listByAppointment(dbAppt.id) : Promise.resolve([]),
    ])

    const activeRefund = refunds && refunds.length > 0 ? refunds[0] : null
    const cancellationInfo = activeRefund ? {
      id: activeRefund.id,
      refundReference: activeRefund.refundReference,
      cancelledBy: activeRefund.cancelledBy,
      cancelledAt: activeRefund.requestedAt,
      originalAmount: activeRefund.originalAmount,
      feePercent: activeRefund.feePercent,
      feeAmount: activeRefund.feeAmount,
      refundAmount: activeRefund.refundAmount,
      refundStatus: activeRefund.status,
      failureReason: activeRefund.failureReason,
    } : (dbAppt.status === 'cancelled' ? {
      id: null,
      refundReference: null,
      cancelledBy: 'salon',
      cancelledAt: dbAppt.updatedAt,
      originalAmount: dbAppt.totalPaid,
      feePercent: 0,
      feeAmount: 0,
      refundAmount: dbAppt.totalPaid,
      refundStatus: 'none',
    } : null)

    return {
      ref: dbAppt.bookingReference,
      id: dbAppt.id,
      tenantId: dbAppt.tenantId,
      customer: cust?.name || 'Customer',
      customerId: dbAppt.customerId,
      phone: cust?.phone || '',
      email: cust?.email || '',
      service: svc?.name || 'Service',
      serviceId: dbAppt.serviceId,
      staff: stf?.name || 'Staff',
      staffId: dbAppt.staffId || '',
      date: dbAppt.appointmentDate,
      time: dbAppt.startTime,
      duration: dbAppt.durationMinutes,
      charged: dbAppt.totalCharged,
      paid: dbAppt.totalPaid,
      paymentMethod: dbAppt.paymentStatus === 'paid' ? 'card' : 'cash',
      status: dbAppt.status,
      paymentStatus: dbAppt.paymentStatus,
      source: dbAppt.bookingSource,
      reminderChannel: dbAppt.reminderChannel,
      notifications: (notifLogs || []).map((n: any) => ({
        id: n.id,
        type: n.eventType ? n.eventType.replace(/_/g, ' ') : 'confirmation',
        channel: n.channel,
        status: n.status,
        sentAt: n.sentAt ? new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        failReason: n.failReason,
      })),
      payments: payments || [],
      refunds: refunds || [],
      cancellation: cancellationInfo,
    }
  }

  async getAppointmentSummary(tenantId: string, reference: string): Promise<OpsAppointmentSummary | null> {
    const tid = this.assertTenant(tenantId)
    if (!reference) return null

    const dbAppt = await this.repos.appointments.findByReference(reference)
    if (!dbAppt || dbAppt.tenantId !== tid) return null

    const [cust, svc, stf] = await Promise.all([
      this.repos.customers.findById(dbAppt.customerId),
      this.repos.services.findById(dbAppt.serviceId),
      dbAppt.staffId ? this.repos.staff.findById(dbAppt.staffId) : Promise.resolve(null),
    ])

    const rem = dbAppt.totalCharged - dbAppt.totalPaid

    return {
      id: dbAppt.id,
      ref: dbAppt.bookingReference,
      tenantId: dbAppt.tenantId,
      customer: cust?.name || 'Customer',
      service: svc?.name || 'Service',
      serviceId: dbAppt.serviceId,
      staff: stf?.name || 'Staff',
      staffId: dbAppt.staffId || '',
      date: dbAppt.appointmentDate,
      time: dbAppt.startTime,
      charged: dbAppt.totalCharged,
      paid: dbAppt.totalPaid,
      outstanding: Math.max(0, rem),
      paymentStatus: dbAppt.paymentStatus,
      status: dbAppt.status,
    }
  }

  async completeAppointment(tenantId: string, appointmentId: string): Promise<{ success: boolean; error?: string }> {
    const tid = this.assertTenant(tenantId)
    const appt = await this.repos.appointments.findById(appointmentId)
    if (!appt || appt.tenantId !== tid) {
      return { success: false, error: 'Appointment not found for this salon' }
    }
    const res = await this.apptSvc.completeAppointment(appointmentId)
    return { success: !res.error, error: res.error }
  }

  async cancelAppointment(
    tenantId: string,
    appointmentId: string,
    reference: string
  ): Promise<{ success: boolean; error?: string }> {
    const tid = this.assertTenant(tenantId)
    const appt = await this.repos.appointments.findById(appointmentId)
    if (!appt || appt.tenantId !== tid) {
      return { success: false, error: 'Appointment not found for this salon' }
    }
    const res = await this.apptSvc.cancelAppointment(appointmentId, 'salon', reference)
    return { success: !res.error, error: res.error }
  }

  async markNoShow(tenantId: string, appointmentId: string): Promise<{ success: boolean; error?: string }> {
    const tid = this.assertTenant(tenantId)
    const appt = await this.repos.appointments.findById(appointmentId)
    if (!appt || appt.tenantId !== tid) {
      return { success: false, error: 'Appointment not found for this salon' }
    }
    await this.apptSvc.updateAppointmentStatus(appointmentId, 'noShow')
    return { success: true }
  }

  async rescheduleAppointment(
    tenantId: string,
    appointmentId: string,
    newDate: string,
    newTime: string
  ): Promise<{ success: boolean; error?: string; appointment?: AppointmentEntity }> {
    const tid = this.assertTenant(tenantId)
    const appt = await this.repos.appointments.findById(appointmentId)
    if (!appt || appt.tenantId !== tid) {
      return { success: false, error: 'Appointment not found for this salon' }
    }
    const res = await this.apptSvc.rescheduleAppointment(appointmentId, newDate, newTime)
    return { success: !res.error, error: res.error, appointment: res.appointment }
  }

  async createManualAppointment(
    tenantId: string,
    payload: CreateManualAppointmentPayload
  ): Promise<{ success: boolean; bookingReference?: string; appointmentId?: string; error?: string }> {
    const tid = this.assertTenant(tenantId)
    try {
      const result = await this.bookSvc.createBooking({
        tenantId: tid,
        serviceId: payload.serviceId,
        staffId: payload.staffId,
        date: payload.date,
        time: payload.time,
        customer: payload.customer,
        paymentMethod: payload.paymentMethod || 'cash',
        bookingSource: 'manual',
      })
      return {
        success: true,
        bookingReference: result.bookingReference,
        appointmentId: result.appointment.id,
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create appointment' }
    }
  }

  async getAvailableSlots(
    tenantId: string,
    params: { serviceId: string; date: string; staffId?: string }
  ): Promise<string[]> {
    const tid = this.assertTenant(tenantId)
    if (params.staffId && params.staffId !== 'any') {
      const slots = await this.availSvc.getAvailableSlots({
        tenantId: tid,
        serviceId: params.serviceId,
        date: params.date,
        staffId: params.staffId,
      })
      return slots.filter(s => s.available).map(s => s.time)
    } else {
      const res = await this.availSvc.getAvailableStaffAndSlots({
        tenantId: tid,
        serviceId: params.serviceId,
        date: params.date,
      })
      return res.slots.filter(s => s.available).map(s => s.time)
    }
  }

  // ─── FINANCIAL & REFUND ACTIONS ──────────────────────────────────────────────

  async recordPayment(
    tenantId: string,
    params: { appointmentId: string; amount: number; method: PaymentMethod; idempotencyKey?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const tid = this.assertTenant(tenantId)
    const appt = await this.repos.appointments.findById(params.appointmentId)
    if (!appt || appt.tenantId !== tid) {
      return { success: false, error: 'Appointment not found for this salon' }
    }
    await this.paySvc.recordSalonPayment({
      tenantId: tid,
      appointmentId: params.appointmentId,
      amount: params.amount,
      method: params.method,
      idempotencyKey: params.idempotencyKey || `salon-${params.appointmentId}-${Date.now()}`,
    })
    return { success: true }
  }

  async processRefund(
    tenantId: string,
    refundId: string,
    role = 'salon_manager'
  ): Promise<{ success: boolean; error?: string }> {
    this.assertTenant(tenantId)
    const res = await this.refSvc.processRefund(refundId, role)
    if (res.status === 'failed') {
      return { success: false, error: res.failureReason || 'Failed to process refund' }
    }
    return { success: true }
  }

  async retryFailedRefund(
    tenantId: string,
    refundId: string,
    role = 'salon_manager'
  ): Promise<{ success: boolean; error?: string }> {
    this.assertTenant(tenantId)
    const res = await this.refSvc.retryFailedRefund(refundId, role)
    if (res.status === 'failed') {
      return { success: false, error: res.failureReason || 'Failed to retry refund' }
    }
    return { success: true }
  }

  async retryRefund(
    tenantId: string,
    refundId: string,
    role = 'salon_manager'
  ): Promise<{ success: boolean; error?: string }> {
    return this.retryFailedRefund(tenantId, refundId, role)
  }

  async requestRefund(
    tenantId: string,
    params: {
      appointmentId: string
      customerId: string
      originalAmount: number
      feePercent: number
      feeAmount: number
      refundAmount: number
      cancelledBy: 'customer' | 'salon'
    }
  ) {
    const tid = this.assertTenant(tenantId)
    return this.refSvc.requestRefund({
      ...params,
      tenantId: tid,
      actorRole: 'salon_manager',
    })
  }

  async retryNotification(tenantId: string, notificationId: string): Promise<void> {
    this.assertTenant(tenantId)
    await this.notifSvc.retryNotification(notificationId)
  }

  // ─── EXPENSES ─────────────────────────────────────────────────────────────

  async listExpenses(tenantId: string): Promise<ExpenseEntity[]> {
    const tid = this.assertTenant(tenantId)
    return this.repos.expenses.list(tid)
  }

  async getExpense(tenantId: string, expenseId: string): Promise<ExpenseEntity | null> {
    const tid = this.assertTenant(tenantId)
    const expense = await this.repos.expenses.findById(expenseId)
    if (!expense || expense.tenantId !== tid) return null
    return expense
  }

  async recordExpense(
    tenantId: string,
    data: Omit<ExpenseEntity, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>
  ): Promise<ExpenseEntity> {
    const tid = this.assertTenant(tenantId)
    return this.repos.expenses.create({
      ...data,
      tenantId: tid,
    })
  }

  async updateExpense(
    tenantId: string,
    expenseId: string,
    data: Partial<Omit<ExpenseEntity, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>
  ): Promise<ExpenseEntity> {
    const tid = this.assertTenant(tenantId)
    const existing = await this.repos.expenses.findById(expenseId)
    if (!existing || existing.tenantId !== tid) {
      throw new Error('Expense not found for this salon')
    }
    return this.repos.expenses.update(expenseId, data)
  }

  async deleteExpense(tenantId: string, expenseId: string): Promise<boolean> {
    const tid = this.assertTenant(tenantId)
    const existing = await this.repos.expenses.findById(expenseId)
    if (!existing || existing.tenantId !== tid) {
      throw new Error('Expense not found for this salon')
    }
    return this.repos.expenses.delete(expenseId)
  }

  // ─── CUSTOMER CRM ────────────────────────────────────────────────────────────

  async listCustomersWithStats(tenantId: string): Promise<OpsCustomerWithStats[]> {
    const tid = this.assertTenant(tenantId)
    const [custs, appts] = await Promise.all([
      this.repos.customers.list(tid),
      this.repos.appointments.listByTenant(tid, 500),
    ])

    return custs.map(c => {
      const myAppts = appts.filter(a => a.customerId === c.id)
      const nonCancelled = myAppts.filter(a => a.status !== 'cancelled' && a.status !== 'noShow')
      const visits = myAppts.filter(a => a.status === 'completed').length || nonCancelled.length
      const totalSpend = myAppts.reduce((sum, a) => sum + (a.totalPaid || 0), 0)
      const sortedAppts = [...myAppts].sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
      const lastVisit = sortedAppts[0]?.appointmentDate || '—'
      const outstandingBalance = nonCancelled.reduce((sum, a) => sum + Math.max(0, a.totalCharged - a.totalPaid), 0)
      return {
        ...c,
        visits,
        totalSpend,
        lastVisit,
        outstandingBalance,
      }
    })
  }

  async getCustomerDetails(tenantId: string, customerId: string): Promise<OpsCustomerDetail | null> {
    const tid = this.assertTenant(tenantId)
    const dbCust = await this.repos.customers.findById(customerId)
    if (!dbCust || dbCust.tenantId !== tid) return null

    const [appts, servicesList, staffList] = await Promise.all([
      this.repos.appointments.listByTenant(tid, 500),
      this.repos.services.list(tid, true),
      this.repos.staff.list(tid, true),
    ])

    const myAppts = appts.filter(a => a.customerId === dbCust.id)
    const nonCancelled = myAppts.filter(a => a.status !== 'cancelled' && a.status !== 'noShow')
    const visits = myAppts.filter(a => a.status === 'completed').length || nonCancelled.length
    const totalSpend = myAppts.reduce((sum, a) => sum + (a.totalPaid || 0), 0)
    const sortedAppts = [...myAppts].sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
    const lastVisit = sortedAppts[0]?.appointmentDate || '—'
    const outstandingBalance = nonCancelled.reduce((sum, a) => sum + Math.max(0, a.totalCharged - a.totalPaid), 0)

    const serviceMap = new Map(servicesList.map(s => [s.id, s.name]))
    const staffMap = new Map(staffList.map(s => [s.id, s.name]))

    const detailedAppts = myAppts.map(a => ({
      id: a.id,
      ref: a.bookingReference,
      service: serviceMap.get(a.serviceId) || 'Service',
      staff: a.staffId ? (staffMap.get(a.staffId) || 'Staff') : 'Staff',
      date: a.appointmentDate,
      time: a.startTime,
      charged: a.totalCharged,
      paid: a.totalPaid,
      status: a.status,
      paymentStatus: a.paymentStatus,
      notifications: (a as any).notifications || [],
    }))

    const allPayments: Array<{
      id: string
      amount: number
      method: string
      status: string
      recordedAt: string
      apptRef: string
      service: string
      date: string
    }> = []

    await Promise.all(
      detailedAppts.map(async da => {
        try {
          const pmts = await this.repos.payments.listByAppointment(da.id)
          pmts.forEach(p => {
            allPayments.push({
              id: p.id,
              amount: p.amount,
              method: p.method,
              status: p.status,
              recordedAt: p.recordedAt,
              apptRef: da.ref,
              service: da.service,
              date: da.date,
            })
          })
        } catch {}
      })
    )
    allPayments.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))

    const since = dbCust.createdAt
      ? new Date(dbCust.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Recently'

    return {
      ...dbCust,
      since,
      visits,
      totalSpend,
      lastVisit,
      outstandingBalance,
      appointments: detailedAppts,
      payments: allPayments,
    }
  }

  async createCustomer(
    tenantId: string,
    data: { name: string; phone: string; email?: string; notes?: string }
  ): Promise<CustomerEntity> {
    const tid = this.assertTenant(tenantId)
    return this.repos.customers.create({
      tenantId: tid,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      segment: 'new',
    })
  }

  async updateCustomer(
    tenantId: string,
    id: string,
    patch: Partial<Pick<CustomerEntity, 'name' | 'phone' | 'email' | 'notes' | 'segment'>>
  ): Promise<CustomerEntity | null> {
    const tid = this.assertTenant(tenantId)
    const cust = await this.repos.customers.findById(id)
    if (!cust || cust.tenantId !== tid) return null
    return this.repos.customers.update(id, patch)
  }

  // ─── STAFF & ROSTERS ─────────────────────────────────────────────────────────

  async listStaff(tenantId: string, includeInactive = false): Promise<StaffEntity[]> {
    const tid = this.assertTenant(tenantId)
    return this.repos.staff.list(tid, includeInactive)
  }

  async listStaffWithRevenue(tenantId: string, date?: string): Promise<OpsStaffWithRevenue[]> {
    const tid = this.assertTenant(tenantId)
    const targetDate = date || new Date().toISOString().slice(0, 10)
    const [staff, todayAppts] = await Promise.all([
      this.repos.staff.list(tid, true),
      this.repos.appointments.listByDate(tid, targetDate),
    ])

    return staff.map(s => {
      const myTodayAppts = todayAppts.filter(
        a => a.staffId === s.id && a.status !== 'cancelled' && a.status !== 'noShow'
      )
      const todayRevenue = myTodayAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged), 0)
      return {
        ...s,
        todayRevenue,
      }
    })
  }

  async getStaffDetails(tenantId: string, staffId: string, todayOverride?: string): Promise<OpsStaffDetail | null> {
    const tid = this.assertTenant(tenantId)
    const dbStaff = await this.repos.staff.findById(staffId)
    if (!dbStaff || dbStaff.tenantId !== tid) return null

    const todayStr = todayOverride || new Date().toISOString().slice(0, 10)
    const currentMonthStr = todayStr.slice(0, 7)

    const [allTenantAppts, weekly, breaks, exceptions, svcs, assigned] = await Promise.all([
      this.repos.appointments.listByTenant(tid, 500),
      this.repos.schedules.getWeeklySchedule(tid, dbStaff.id).catch(() => []),
      this.repos.schedules.getBreaks(tid, dbStaff.id).catch(() => []),
      this.repos.schedules.getExceptions(tid, dbStaff.id).catch(() => []),
      this.repos.services.list(tid, true).catch(() => []),
      this.repos.staffServices.listServicesByStaff(tid, dbStaff.id).catch(() => []),
    ])

    const staffAppts = allTenantAppts.filter(a => a.staffId === dbStaff.id)
    const completed = staffAppts.filter(a => a.status === 'completed')
    const cancelled = staffAppts.filter(a => a.status === 'cancelled')
    const noShows = staffAppts.filter(a => a.status === 'noShow')
    const uniqueCusts = new Set(staffAppts.map(a => a.customerId)).size

    const todayAppts = staffAppts.filter(
      a => a.appointmentDate === todayStr && a.status !== 'cancelled' && a.status !== 'noShow'
    )
    const todayRevenue = todayAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged), 0)

    const monthAppts = staffAppts.filter(
      a => a.appointmentDate.startsWith(currentMonthStr) && a.status !== 'cancelled' && a.status !== 'noShow'
    )
    const monthRevenue = monthAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged), 0)

    const totalFinished = completed.length + cancelled.length + noShows.length
    const completionRate = totalFinished > 0 ? Math.round((completed.length / totalFinished) * 100) : 100

    return {
      staff: dbStaff,
      metrics: {
        todayRevenue,
        monthRevenue,
        monthAppointments: monthAppts.length,
        completionRate,
        noShowCount: noShows.length,
        uniqueCusts,
        completed: completed.length,
        cancelled: cancelled.length,
      },
      weeklySchedule: weekly || [],
      breaks: breaks || [],
      exceptions: exceptions || [],
      allServices: svcs || [],
      assignedServiceIds: assigned || [],
    }
  }

  async createStaff(
    tenantId: string,
    data: Omit<StaffEntity, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>
  ): Promise<StaffEntity> {
    const tid = this.assertTenant(tenantId)
    return this.repos.staff.create({
      ...data,
      tenantId: tid,
    })
  }

  async updateStaff(
    tenantId: string,
    id: string,
    patch: Partial<StaffEntity>
  ): Promise<StaffEntity> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.staff.findById(id)
    if (!current || current.tenantId !== tid) {
      throw new Error('Staff member not found for this salon')
    }
    return this.repos.staff.update(id, patch)
  }

  async setStaffDaySchedule(
    tenantId: string,
    staffId: string,
    schedule: Omit<CanonicalStaffWorkingHours, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CanonicalStaffWorkingHours> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.staff.findById(staffId)
    if (!current || current.tenantId !== tid) {
      throw new Error('Staff member not found for this salon')
    }
    return this.repos.schedules.setDaySchedule(tid, staffId, schedule)
  }

  async addStaffBreak(
    tenantId: string,
    staffId: string,
    breakData: Omit<CanonicalScheduleBreak, 'id' | 'tenant_id' | 'staff_id'>
  ): Promise<CanonicalScheduleBreak> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.staff.findById(staffId)
    if (!current || current.tenantId !== tid) {
      throw new Error('Staff member not found for this salon')
    }
    return this.repos.schedules.addBreak(tid, staffId, breakData)
  }

  async removeStaffBreak(tenantId: string, breakId: string): Promise<boolean> {
    this.assertTenant(tenantId)
    return this.repos.schedules.removeBreak(breakId)
  }

  async addStaffException(
    tenantId: string,
    staffId: string,
    exceptionData: Omit<CanonicalScheduleException, 'id' | 'tenant_id' | 'staff_id'>
  ): Promise<CanonicalScheduleException> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.staff.findById(staffId)
    if (!current || current.tenantId !== tid) {
      throw new Error('Staff member not found for this salon')
    }
    return this.repos.schedules.addException(tid, staffId, exceptionData)
  }

  async removeStaffException(tenantId: string, exceptionId: string): Promise<boolean> {
    this.assertTenant(tenantId)
    return this.repos.schedules.removeException(exceptionId)
  }

  async assignStaffService(tenantId: string, staffId: string, serviceId: string): Promise<void> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.staff.findById(staffId)
    if (!current || current.tenantId !== tid) {
      throw new Error('Staff member not found for this salon')
    }
    return this.repos.staffServices.assignService(tid, staffId, serviceId)
  }

  async unassignStaffService(tenantId: string, staffId: string, serviceId: string): Promise<void> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.staff.findById(staffId)
    if (!current || current.tenantId !== tid) {
      throw new Error('Staff member not found for this salon')
    }
    return this.repos.staffServices.unassignService(tid, staffId, serviceId)
  }

  // ─── SERVICE CATALOG ─────────────────────────────────────────────────────────

  async listServices(tenantId: string, includeInactive = false): Promise<ServiceEntity[]> {
    const tid = this.assertTenant(tenantId)
    return this.repos.services.list(tid, includeInactive)
  }

  async getService(tenantId: string, serviceId: string): Promise<ServiceEntity | null> {
    const tid = this.assertTenant(tenantId)
    const svc = await this.repos.services.findById(serviceId)
    if (!svc || svc.tenantId !== tid) return null
    return svc
  }

  async createService(
    tenantId: string,
    data: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>
  ): Promise<ServiceEntity> {
    const tid = this.assertTenant(tenantId)
    return this.repos.services.create({
      ...data,
      tenantId: tid,
    })
  }

  async updateService(
    tenantId: string,
    id: string,
    patch: Partial<ServiceEntity>
  ): Promise<ServiceEntity> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.services.findById(id)
    if (!current || current.tenantId !== tid) {
      throw new Error('Service not found for this salon')
    }
    return this.repos.services.update(id, patch)
  }

  async toggleServiceActive(
    tenantId: string,
    id: string
  ): Promise<ServiceEntity> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.services.findById(id)
    if (!current || current.tenantId !== tid) {
      throw new Error('Service not found for this salon')
    }
    return this.repos.services.update(id, { active: !current.active })
  }

  // ─── DASHBOARD & KPI METRICS ─────────────────────────────────────────────────

  async getDashboardData(tenantId: string, date?: string): Promise<{
    todayAppts: AppointmentEntity[]
    activeStaff: StaffEntity[]
    totalCharged: number
    totalPaid: number
  }> {
    const tid = this.assertTenant(tenantId)
    const targetDate = date || new Date().toISOString().slice(0, 10)
    const [appts, staff] = await Promise.all([
      this.repos.appointments.listByDate(tid, targetDate),
      this.repos.staff.list(tid, true),
    ])

    const activeStaff = staff.filter(s => s.active)
    const totalCharged = appts.reduce((s, a) => s + (a.totalCharged || 0), 0)
    const totalPaid = appts.reduce((s, a) => s + (a.totalPaid || 0), 0)

    return {
      todayAppts: appts,
      activeStaff,
      totalCharged,
      totalPaid,
    }
  }

  // ─── SALON SETTINGS & BOOKING RULES ──────────────────────────────────────────

  async getSalonProfile(tenantId: string): Promise<SalonEntity | null> {
    const tid = this.assertTenant(tenantId)
    return this.repos.salons.findByTenantId(tid)
  }

  async updateSalonProfile(tenantId: string, patch: Partial<SalonEntity>): Promise<SalonEntity> {
    const tid = this.assertTenant(tenantId)
    const current = await this.repos.salons.findByTenantId(tid)
    if (!current) {
      throw new Error('Salon profile not found for this tenant')
    }
    if ((this.repos.salons as any).update) {
      return (this.repos.salons as any).update(current.id, patch)
    }
    return { ...current, ...patch, updatedAt: new Date().toISOString() }
  }

  async getBookingSettings(tenantId: string): Promise<SalonBookingSettings> {
    const tid = this.assertTenant(tenantId)
    return this.repos.settings.getBookingSettings(tid)
  }

  async updateBookingSettings(
    tenantId: string,
    settings: Partial<SalonBookingSettings>
  ): Promise<SalonBookingSettings> {
    const tid = this.assertTenant(tenantId)
    return this.repos.settings.updateBookingSettings(tid, settings)
  }
}

export const salonOperationsFacade = new SalonOperationsFacade()
