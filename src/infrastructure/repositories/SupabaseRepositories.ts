import { createBrowserSupabaseClient } from '@/infrastructure/supabase/client'
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

export class SupabaseCustomerRepository implements CustomerRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findById(id: string): Promise<CustomerEntity | null> {
    const { data } = await this.supabase.from('customers').select('*').eq('id', id).single()
    return data ? this.map(data) : null
  }

  async findByPhone(tenantId: string, phone: string): Promise<CustomerEntity | null> {
    const { data } = await this.supabase.from('customers').select('*').eq('tenant_id', tenantId).eq('phone', phone).maybeSingle()
    return data ? this.map(data) : null
  }

  async list(tenantId: string): Promise<CustomerEntity[]> {
    const { data } = await this.supabase.from('customers').select('*').eq('tenant_id', tenantId).order('name')
    return (data || []).map(this.map)
  }

  async create(data: Omit<CustomerEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerEntity> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const { error } = await this.supabase.from('customers').insert({
      id,
      tenant_id: data.tenantId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      segment: data.segment,
    })

    if (error) throw error

    return {
      id,
      tenantId: data.tenantId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      segment: data.segment,
      createdAt: now,
      updatedAt: now,
    }
  }

  async update(id: string, data: Partial<CustomerEntity>): Promise<CustomerEntity> {
    const updatePayload: any = {}
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.phone !== undefined) updatePayload.phone = data.phone
    if (data.email !== undefined) updatePayload.email = data.email
    if (data.notes !== undefined) updatePayload.notes = data.notes
    if (data.segment !== undefined) updatePayload.segment = data.segment

    const { data: updated, error } = await this.supabase.from('customers').update(updatePayload).eq('id', id).select().single()
    if (error) throw error
    return this.map(updated)
  }

  private map(row: any): CustomerEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      segment: row.segment,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

export class SupabaseServiceRepository implements ServiceRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    const { data } = await this.supabase.from('services').select('*').eq('id', id).single()
    return data ? this.map(data) : null
  }

  async list(tenantId: string, includeInactive = false): Promise<ServiceEntity[]> {
    let query = this.supabase.from('services').select('*').eq('tenant_id', tenantId)
    if (!includeInactive) query = query.eq('active', true)
    const { data } = await query.order('category')
    return (data || []).map(this.map)
  }

  async create(data: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceEntity> {
    const { data: created, error } = await this.supabase.from('services').insert({
      tenant_id: data.tenantId,
      name: data.name,
      category: data.category,
      description: data.description,
      duration: data.duration,
      price: data.price,
      active: data.active,
    }).select().single()

    if (error) throw error
    return this.map(created)
  }

  async update(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity> {
    const payload: any = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.category !== undefined) payload.category = data.category
    if (data.description !== undefined) payload.description = data.description
    if (data.duration !== undefined) payload.duration = data.duration
    if (data.price !== undefined) payload.price = data.price
    if (data.active !== undefined) payload.active = data.active

    const { data: updated, error } = await this.supabase.from('services').update(payload).eq('id', id).select().single()
    if (error) throw error
    return this.map(updated)
  }

  private map(row: any): ServiceEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      category: row.category,
      description: row.description,
      duration: row.duration,
      price: Number(row.price),
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

export class SupabaseStaffRepository implements StaffRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findById(id: string): Promise<StaffEntity | null> {
    const { data } = await this.supabase.from('staff').select('*').eq('id', id).single()
    return data ? this.map(data) : null
  }

  async list(tenantId: string, includeInactive = false): Promise<StaffEntity[]> {
    let query = this.supabase.from('staff').select('*').eq('tenant_id', tenantId)
    if (!includeInactive) query = query.eq('active', true)
    const { data } = await query.order('name')
    return (data || []).map(this.map)
  }

  async create(data: Omit<StaffEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffEntity> {
    const { data: created, error } = await this.supabase.from('staff').insert({
      tenant_id: data.tenantId,
      name: data.name,
      role: data.role,
      photo_url: data.photoUrl,
      active: data.active,
    }).select().single()

    if (error) throw error
    return this.map(created)
  }

  async update(id: string, data: Partial<StaffEntity>): Promise<StaffEntity> {
    const payload: any = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.role !== undefined) payload.role = data.role
    if (data.photoUrl !== undefined) payload.photo_url = data.photoUrl
    if (data.active !== undefined) payload.active = data.active

    const { data: updated, error } = await this.supabase.from('staff').update(payload).eq('id', id).select().single()
    if (error) throw error
    return this.map(updated)
  }

  private map(row: any): StaffEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      role: row.role,
      photoUrl: row.photo_url,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

export class SupabaseAppointmentRepository implements AppointmentRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    const { data } = await this.supabase.from('appointments').select('*').eq('id', id).single()
    return data ? this.map(data) : null
  }

  async findByReference(reference: string): Promise<AppointmentEntity | null> {
    const { data } = await this.supabase.from('appointments').select('*').eq('booking_reference', reference).single()
    return data ? this.map(data) : null
  }

  async listByDate(tenantId: string, date: string): Promise<AppointmentEntity[]> {
    const { data } = await this.supabase.from('appointments').select('*').eq('tenant_id', tenantId).eq('appointment_date', date).order('start_time')
    return (data || []).map(this.map)
  }

  async listByTenant(tenantId: string, limit = 50): Promise<AppointmentEntity[]> {
    const { data } = await this.supabase.from('appointments').select('*').eq('tenant_id', tenantId).order('appointment_date', { ascending: false }).limit(limit)
    return (data || []).map(this.map)
  }

  async create(data: Omit<AppointmentEntity, 'id' | 'createdAt' | 'updatedAt' | 'reminderChannel'> & { reminderChannel?: 'whatsapp' | 'sms' | 'email' | 'none' }): Promise<AppointmentEntity> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const channel = data.reminderChannel || 'whatsapp'
    const { error } = await this.supabase.from('appointments').insert({
      id,
      tenant_id: data.tenantId,
      booking_reference: data.bookingReference,
      customer_id: data.customerId,
      service_id: data.serviceId,
      staff_id: data.staffId,
      appointment_date: data.appointmentDate,
      start_time: data.startTime,
      duration_minutes: data.durationMinutes,
      status: data.status,
      payment_status: data.paymentStatus,
      total_charged: data.totalCharged,
      total_paid: data.totalPaid,
      booking_source: data.bookingSource,
      reminder_channel: channel,
    })

    if (error) {
      if (error.code === '23P01' || error.message?.includes('exclude_overlapping_staff_appointments') || error.message?.includes('exclusion')) {
        const conflictErr = new Error('That appointment time is no longer available due to a scheduling conflict.')
        ;(conflictErr as any).code = '23P01'
        throw conflictErr
      }
      throw error
    }

    return {
      id,
      tenantId: data.tenantId,
      bookingReference: data.bookingReference,
      customerId: data.customerId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      status: data.status,
      paymentStatus: data.paymentStatus,
      totalCharged: data.totalCharged,
      totalPaid: data.totalPaid,
      bookingSource: data.bookingSource,
      reminderChannel: channel,
      createdAt: now,
      updatedAt: now,
    }
  }

  async updateStatus(id: string, status: AppointmentEntity['status']): Promise<AppointmentEntity> {
    const { data: updated, error } = await this.supabase.from('appointments').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return this.map(updated)
  }

  async updateDateTime(id: string, date: string, time: string): Promise<AppointmentEntity> {
    const { data: updated, error } = await this.supabase.from('appointments').update({
      appointment_date: date,
      start_time: time,
    }).eq('id', id).select().single()
    if (error) throw error
    if (error) {
      if (error.code === '23P01' || error.message?.includes('exclude_overlapping_staff_appointments') || error.message?.includes('exclusion')) {
        const conflictErr = new Error('That appointment time is no longer available due to a scheduling conflict.')
        ;(conflictErr as any).code = '23P01'
        throw conflictErr
      }
      throw error
    }
    return this.map(updated)
  }

  async lookupGuest(reference: string, verificationContact: string): Promise<AppointmentEntity | null> {
    const cleanRef = reference.trim().toUpperCase()
    const cleanContact = verificationContact.trim()
    const isEmail = cleanContact.includes('@')

    const { data, error } = await this.supabase.rpc('lookup_guest_appointment', {
      p_booking_reference: cleanRef,
      p_verification_phone: isEmail ? null : cleanContact,
      p_verification_email: isEmail ? cleanContact : null,
    })

    if (error || !data || data.length === 0) {
      return null
    }

    return this.map(data[0])
  }

  async recordPayment(id: string, amount: number, paymentStatus: AppointmentEntity['paymentStatus']): Promise<AppointmentEntity> {
    const current = await this.findById(id)
    if (!current) throw new Error('Appointment not found')

    const newPaid = current.totalPaid + amount
    const { data: updated, error } = await this.supabase.from('appointments').update({
      total_paid: newPaid,
      payment_status: paymentStatus,
    }).eq('id', id).select().single()

    if (error) throw error
    return this.map(updated)
  }

  private map(row: any): AppointmentEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      bookingReference: row.booking_reference,
      customerId: row.customer_id,
      serviceId: row.service_id,
      staffId: row.staff_id,
      appointmentDate: row.appointment_date,
      startTime: row.start_time ? String(row.start_time).slice(0, 5) : row.start_time,
      durationMinutes: row.duration_minutes,
      status: row.status,
      paymentStatus: row.payment_status,
      totalCharged: Number(row.total_charged),
      totalPaid: Number(row.total_paid),
      bookingSource: row.booking_source,
      reminderChannel: row.reminder_channel,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

export class SupabasePaymentRepository implements PaymentRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findById(id: string): Promise<DomainPaymentRecord | null> {
    const { data } = await this.supabase.from('payments').select('*').eq('id', id).single()
    return data ? this.map(data) : null
  }

  async listByAppointment(appointmentId: string): Promise<DomainPaymentRecord[]> {
    const { data } = await this.supabase.from('payments').select('*').eq('appointment_id', appointmentId).order('recorded_at')
    return (data || []).map(this.map)
  }

  async record(data: Omit<DomainPaymentRecord, 'id' | 'recordedAt'>): Promise<DomainPaymentRecord> {
    const { data: created, error } = await this.supabase.from('payments').insert({
      tenant_id: data.tenantId,
      appointment_id: data.appointmentId,
      amount: data.amount,
      payment_method: data.method,
      status: data.status,
      provider_reference: data.providerReference,
    }).select().single()

    if (error) throw error
    return this.map(created)
  }

  private map(row: any): DomainPaymentRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      appointmentId: row.appointment_id,
      amount: Number(row.amount),
      method: row.payment_method,
      status: row.status,
      providerReference: row.provider_reference,
      recordedAt: row.recorded_at,
    }
  }
}

export class SupabaseRefundRepository implements RefundRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findById(id: string): Promise<DomainRefundRecord | null> {
    const { data } = await this.supabase.from('refunds').select('*').eq('id', id).single()
    return data ? this.map(data) : null
  }

  async findByReference(refundReference: string): Promise<DomainRefundRecord | null> {
    const { data } = await this.supabase.from('refunds').select('*').eq('refund_reference', refundReference).single()
    return data ? this.map(data) : null
  }

  async listByTenant(tenantId: string): Promise<DomainRefundRecord[]> {
    const { data } = await this.supabase.from('refunds').select('*').eq('tenant_id', tenantId).order('requested_at', { ascending: false })
    return (data || []).map(this.map)
  }

  async create(data: Omit<DomainRefundRecord, 'id' | 'requestedAt'>): Promise<DomainRefundRecord> {
    const { data: created, error } = await this.supabase.from('refunds').insert({
      tenant_id: data.tenantId,
      refund_reference: data.refundReference,
      appointment_id: data.appointmentId,
      payment_id: data.paymentId,
      customer_id: data.customerId,
      original_amount: data.originalAmount,
      fee_percent: data.feePercent,
      fee_amount: data.feeAmount,
      refund_amount: data.refundAmount,
      status: data.status,
      cancelled_by: data.cancelledBy,
      failure_reason: data.failureReason,
    }).select().single()

    if (error) throw error
    return this.map(created)
  }

  async updateStatus(id: string, status: DomainRefundStatus, failureReason?: string): Promise<DomainRefundRecord> {
    const payload: any = { status }
    if (status === 'completed') payload.completed_at = new Date().toISOString()
    if (failureReason) payload.failure_reason = failureReason

    const { data: updated, error } = await this.supabase.from('refunds').update(payload).eq('id', id).select().single()
    if (error) throw error
    return this.map(updated)
  }

  private map(row: any): DomainRefundRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      refundReference: row.refund_reference,
      appointmentId: row.appointment_id,
      paymentId: row.payment_id,
      customerId: row.customer_id,
      originalAmount: Number(row.original_amount),
      feePercent: Number(row.fee_percent),
      feeAmount: Number(row.fee_amount),
      refundAmount: Number(row.refund_amount),
      status: row.status,
      cancelledBy: row.cancelled_by,
      failureReason: row.failure_reason,
      requestedAt: row.requested_at,
      completedAt: row.completed_at,
    }
  }
}

export class SupabaseExpenseRepository implements ExpenseRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findById(id: string): Promise<ExpenseEntity | null> {
    const { data } = await this.supabase.from('expenses').select('*').eq('id', id).single()
    return data ? this.map(data) : null
  }

  async list(tenantId: string): Promise<ExpenseEntity[]> {
    const { data } = await this.supabase.from('expenses').select('*').eq('tenant_id', tenantId).order('expense_date', { ascending: false })
    return (data || []).map(this.map)
  }

  async create(data: Omit<ExpenseEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExpenseEntity> {
    const { data: created, error } = await this.supabase.from('expenses').insert({
      tenant_id: data.tenantId,
      category: data.category,
      description: data.description,
      amount: data.amount,
      expense_date: data.expenseDate,
    }).select().single()

    if (error) throw error
    return this.map(created)
  }

  async update(id: string, data: Partial<ExpenseEntity>): Promise<ExpenseEntity> {
    const payload: any = {}
    if (data.category !== undefined) payload.category = data.category
    if (data.description !== undefined) payload.description = data.description
    if (data.amount !== undefined) payload.amount = data.amount
    if (data.expenseDate !== undefined) payload.expense_date = data.expenseDate

    const { data: updated, error } = await this.supabase.from('expenses').update(payload).eq('id', id).select().single()
    if (error) throw error
    return this.map(updated)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('expenses').delete().eq('id', id)
    return !error
  }

  private map(row: any): ExpenseEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      category: row.category,
      description: row.description,
      amount: Number(row.amount),
      expenseDate: row.expense_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

export class SupabaseStaffServiceRepository implements StaffServiceRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async listServicesByStaff(tenantId: string, staffId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('staff_services')
      .select('service_id')
      .eq('tenant_id', tenantId)
      .eq('staff_id', staffId)
    return (data || []).map((row: any) => row.service_id)
  }

  async listStaffByService(tenantId: string, serviceId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('staff_services')
      .select('staff_id')
      .eq('tenant_id', tenantId)
      .eq('service_id', serviceId)
    return (data || []).map((row: any) => row.staff_id)
  }

  async isEligible(tenantId: string, staffId: string, serviceId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('staff_services')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('staff_id', staffId)
      .eq('service_id', serviceId)
      .maybeSingle()
    return !!data
  }

  async assignService(tenantId: string, staffId: string, serviceId: string): Promise<void> {
    await this.supabase.from('staff_services').upsert({
      tenant_id: tenantId,
      staff_id: staffId,
      service_id: serviceId,
    })
  }

  async unassignService(tenantId: string, staffId: string, serviceId: string): Promise<void> {
    await this.supabase
      .from('staff_services')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('staff_id', staffId)
      .eq('service_id', serviceId)
  }
}

export class SupabaseScheduleRepository implements ScheduleRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async getWeeklySchedule(tenantId: string, staffId: string): Promise<CanonicalStaffWorkingHours[]> {
    const { data } = await this.supabase
      .from('staff_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('staff_id', staffId)
      .order('day_of_week')
    return (data || []).map(this.mapSchedule)
  }

  async setDaySchedule(
    tenantId: string,
    staffId: string,
    schedule: Omit<CanonicalStaffWorkingHours, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CanonicalStaffWorkingHours> {
    const { data, error } = await this.supabase
      .from('staff_schedules')
      .upsert({
        tenant_id: tenantId,
        staff_id: staffId,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_working: schedule.is_active,
      })
      .select()
      .single()
    if (error) throw error
    return this.mapSchedule(data)
  }

  async getBreaks(tenantId: string, staffId: string): Promise<CanonicalScheduleBreak[]> {
    const { data } = await this.supabase
      .from('schedule_breaks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('staff_id', staffId)
      .order('start_time')
    return (data || []).map(this.mapBreak)
  }

  async addBreak(
    tenantId: string,
    staffId: string,
    breakData: Omit<CanonicalScheduleBreak, 'id' | 'tenant_id' | 'staff_id'>
  ): Promise<CanonicalScheduleBreak> {
    const { data, error } = await this.supabase
      .from('schedule_breaks')
      .insert({
        tenant_id: tenantId,
        staff_id: staffId,
        start_time: breakData.start_time,
        end_time: breakData.end_time,
        description: breakData.description || 'Break',
      })
      .select()
      .single()
    if (error) throw error
    return this.mapBreak(data)
  }

  async removeBreak(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('schedule_breaks').delete().eq('id', id)
    return !error
  }

  async getExceptions(tenantId: string, staffId: string, startDate?: string, endDate?: string): Promise<CanonicalScheduleException[]> {
    let query = this.supabase
      .from('schedule_exceptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('staff_id', staffId)
    if (startDate) query = query.gte('exception_date', startDate)
    if (endDate) query = query.lte('exception_date', endDate)
    const { data } = await query.order('exception_date')
    return (data || []).map(this.mapException)
  }

  async addException(
    tenantId: string,
    staffId: string,
    exceptionData: Omit<CanonicalScheduleException, 'id' | 'tenant_id' | 'staff_id'>
  ): Promise<CanonicalScheduleException> {
    const { data, error } = await this.supabase
      .from('schedule_exceptions')
      .insert({
        tenant_id: tenantId,
        staff_id: staffId,
        exception_date: exceptionData.exception_date,
        is_working: exceptionData.is_working,
        start_time: exceptionData.start_time,
        end_time: exceptionData.end_time,
        reason: exceptionData.reason,
      })
      .select()
      .single()
    if (error) throw error
    return this.mapException(data)
  }

  async removeException(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('schedule_exceptions').delete().eq('id', id)
    return !error
  }

  private mapSchedule(row: any): CanonicalStaffWorkingHours {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      staff_id: row.staff_id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      is_active: row.is_working ?? true,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    }
  }

  private mapBreak(row: any): CanonicalScheduleBreak {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      staff_id: row.staff_id,
      start_time: row.start_time,
      end_time: row.end_time,
      description: row.description,
    }
  }

  private mapException(row: any): CanonicalScheduleException {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      staff_id: row.staff_id,
      exception_date: row.exception_date,
      is_working: row.is_working,
      start_time: row.start_time,
      end_time: row.end_time,
      reason: row.reason,
    }
  }
}

export class SupabaseSalonSettingsRepository implements SalonSettingsRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async getBookingSettings(tenantId: string): Promise<SalonBookingSettings> {
    const { data } = await this.supabase
      .from('salon_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    return {
      tenant_id: tenantId,
      online_booking_enabled: data?.online_booking_enabled ?? true,
      slot_interval_minutes: data?.slot_interval_minutes ?? 30,
      min_notice_minutes: data?.min_notice_minutes ?? 30,
      max_advance_days: data?.max_advance_days ?? 60,
      assignment_strategy: data?.assignment_strategy ?? 'FIRST_AVAILABLE',
    }
  }

  async updateBookingSettings(tenantId: string, settings: Partial<SalonBookingSettings>): Promise<SalonBookingSettings> {
    const updatePayload: any = {}
    if (settings.online_booking_enabled !== undefined) updatePayload.online_booking_enabled = settings.online_booking_enabled
    if (settings.slot_interval_minutes !== undefined) updatePayload.slot_interval_minutes = settings.slot_interval_minutes
    if (settings.min_notice_minutes !== undefined) updatePayload.min_notice_minutes = settings.min_notice_minutes
    if (settings.max_advance_days !== undefined) updatePayload.max_advance_days = settings.max_advance_days
    if (settings.assignment_strategy !== undefined) updatePayload.assignment_strategy = settings.assignment_strategy

    await this.supabase.from('salon_profiles').update(updatePayload).eq('tenant_id', tenantId)
    return this.getBookingSettings(tenantId)
  }
}

export class SupabaseSalonRepository implements SalonRepository {
  private supabase: any

  constructor(client?: any) {
    this.supabase = client || createBrowserSupabaseClient()
  }

  async findBySlug(slug: string): Promise<SalonEntity | null> {
    const { data } = await this.supabase
      .from('salon_profiles')
      .select('*')
      .eq('slug', slug.toLowerCase().trim())
      .eq('active', true)
      .maybeSingle()

    if (!data) return null
    return this.mapToEntity(data)
  }

  async findById(id: string): Promise<SalonEntity | null> {
    const { data } = await this.supabase
      .from('salon_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!data) return null
    return this.mapToEntity(data)
  }

  async findByTenantId(tenantId: string): Promise<SalonEntity | null> {
    const { data } = await this.supabase
      .from('salon_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!data) return null
    return this.mapToEntity(data)
  }

  async list(): Promise<SalonEntity[]> {
    const { data } = await this.supabase
      .from('salon_profiles')
      .select('*')
      .eq('active', true)

    return (data || []).map((row: any) => this.mapToEntity(row))
  }

  private mapToEntity(row: any): SalonEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.salon_name,
      slug: row.slug,
      tagline: row.tagline || undefined,
      description: row.description || undefined,
      addressStreet: row.address_street || undefined,
      addressCity: row.address_city || undefined,
      addressPostalCode: row.address_postal_code || undefined,
      phone: row.phone || undefined,
      email: row.email || undefined,
      currency: row.currency || 'ZAR',
      active: row.active ?? true,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }
  }
}