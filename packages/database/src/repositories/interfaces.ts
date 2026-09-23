import type {
  DomainPaymentRecord,
  DomainPaymentMethod,
  DomainRefundRecord,
  DomainRefundStatus,
  CanonicalStaffWorkingHours,
  CanonicalScheduleBreak,
  CanonicalScheduleException,
  SalonBookingSettings,
  AppointmentEntity,
  StaffEntity,
  ServiceEntity,
  CustomerEntity,
} from '@byb/types'

export type {
  DomainPaymentRecord,
  DomainPaymentMethod,
  DomainRefundRecord,
  DomainRefundStatus,
  CanonicalStaffWorkingHours,
  CanonicalScheduleBreak,
  CanonicalScheduleException,
  SalonBookingSettings,
  AppointmentEntity,
  StaffEntity,
  ServiceEntity,
  CustomerEntity,
}

export interface SalonEntity {
  id: string
  tenantId: string
  name: string
  slug: string
  tagline?: string
  description?: string
  addressStreet?: string
  addressCity?: string
  addressPostalCode?: string
  phone?: string
  email?: string
  currency?: string
  address?: string
  openingHours?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ExpenseEntity {
  id: string
  tenantId: string
  category: 'Rent' | 'Electricity' | 'Products' | 'Salaries' | 'Marketing' | 'Transport' | 'Other'
  description: string
  amount: number
  expenseDate: string
  createdAt: string
  updatedAt: string
}

export interface SalonRepository {
  findBySlug(slug: string): Promise<SalonEntity | null>
  findById(id: string): Promise<SalonEntity | null>
  findByTenantId(tenantId: string): Promise<SalonEntity | null>
  list(): Promise<SalonEntity[]>
}

export interface CustomerRepository {
  findById(id: string): Promise<CustomerEntity | null>
  findByPhone(tenantId: string, phone: string): Promise<CustomerEntity | null>
  list(tenantId: string): Promise<CustomerEntity[]>
  create(data: Omit<CustomerEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerEntity>
  update(id: string, data: Partial<CustomerEntity>): Promise<CustomerEntity>
}

export interface ServiceRepository {
  findById(id: string): Promise<ServiceEntity | null>
  list(tenantId: string, includeInactive?: boolean): Promise<ServiceEntity[]>
  create(data: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceEntity>
  update(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity>
}

export interface StaffRepository {
  findById(id: string): Promise<StaffEntity | null>
  list(tenantId: string, includeInactive?: boolean): Promise<StaffEntity[]>
  create(data: Omit<StaffEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffEntity>
  update(id: string, data: Partial<StaffEntity>): Promise<StaffEntity>
}

export interface AppointmentRepository {
  findById(id: string): Promise<AppointmentEntity | null>
  findByReference(reference: string): Promise<AppointmentEntity | null>
  listByDate(tenantId: string, date: string): Promise<AppointmentEntity[]>
  listByTenant(tenantId: string, limit?: number): Promise<AppointmentEntity[]>
  create(data: Omit<AppointmentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppointmentEntity>
  updateStatus(id: string, status: AppointmentEntity['status']): Promise<AppointmentEntity>
  updateDateTime(id: string, date: string, time: string): Promise<AppointmentEntity>
  updatePaymentStatus(id: string, paymentStatus: AppointmentEntity['paymentStatus']): Promise<AppointmentEntity>
  recordPayment(id: string, amount: number, paymentStatus: AppointmentEntity['paymentStatus']): Promise<AppointmentEntity>
  lookupGuest?(reference: string, verificationContact: string): Promise<AppointmentEntity | null>
}

export interface StaffServiceRepository {
  listServicesByStaff(tenantId: string, staffId: string): Promise<string[]>
  listStaffByService(tenantId: string, serviceId: string): Promise<string[]>
  isEligible(tenantId: string, staffId: string, serviceId: string): Promise<boolean>
  assignService(tenantId: string, staffId: string, serviceId: string): Promise<void>
  unassignService(tenantId: string, staffId: string, serviceId: string): Promise<void>
}

export interface ScheduleRepository {
  getWeeklySchedule(tenantId: string, staffId: string): Promise<CanonicalStaffWorkingHours[]>
  setDaySchedule(tenantId: string, staffId: string, schedule: Omit<CanonicalStaffWorkingHours, 'id' | 'created_at' | 'updated_at'>): Promise<CanonicalStaffWorkingHours>
  getBreaks(tenantId: string, staffId: string): Promise<CanonicalScheduleBreak[]>
  addBreak(tenantId: string, staffId: string, breakData: Omit<CanonicalScheduleBreak, 'id' | 'tenant_id' | 'staff_id'>): Promise<CanonicalScheduleBreak>
  removeBreak(id: string): Promise<boolean>
  getExceptions(tenantId: string, staffId: string, startDate?: string, endDate?: string): Promise<CanonicalScheduleException[]>
  addException(tenantId: string, staffId: string, exceptionData: Omit<CanonicalScheduleException, 'id' | 'tenant_id' | 'staff_id'>): Promise<CanonicalScheduleException>
  removeException(id: string): Promise<boolean>
}

export interface SalonSettingsRepository {
  getBookingSettings(tenantId: string): Promise<SalonBookingSettings>
  updateBookingSettings(tenantId: string, settings: Partial<SalonBookingSettings>): Promise<SalonBookingSettings>
}

export interface PaymentRepository {
  findById(id: string): Promise<DomainPaymentRecord | null>
  findByIdempotencyKey?(key: string): Promise<DomainPaymentRecord | null>
  findByProviderReference?(ref: string): Promise<DomainPaymentRecord | null>
  listByAppointment(appointmentId: string): Promise<DomainPaymentRecord[]>
  listByTenant?(tenantId: string, limit?: number): Promise<DomainPaymentRecord[]>
  record(data: Omit<DomainPaymentRecord, 'id' | 'recordedAt'>): Promise<DomainPaymentRecord>
}

export interface RefundRepository {
  findById(id: string): Promise<DomainRefundRecord | null>
  findByReference(refundReference: string): Promise<DomainRefundRecord | null>
  findByIdempotencyKey?(key: string): Promise<DomainRefundRecord | null>
  listByTenant(tenantId: string): Promise<DomainRefundRecord[]>
  listByAppointment?(appointmentId: string): Promise<DomainRefundRecord[]>
  create(data: Omit<DomainRefundRecord, 'id' | 'requestedAt'>): Promise<DomainRefundRecord>
  updateStatus(id: string, status: DomainRefundStatus, failureReason?: string): Promise<DomainRefundRecord>
}

export interface ExpenseRepository {
  findById(id: string): Promise<ExpenseEntity | null>
  list(tenantId: string): Promise<ExpenseEntity[]>
  create(data: Omit<ExpenseEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExpenseEntity>
  update(id: string, data: Partial<ExpenseEntity>): Promise<ExpenseEntity>
  delete(id: string): Promise<boolean>
}

export interface NotificationLogEntity {
  id: string
  tenantId: string
  appointmentId?: string
  customerId?: string
  eventType: string
  channel: 'whatsapp' | 'sms' | 'email' | 'none'
  recipient: string
  subject?: string
  content: string
  status: 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'notRequired'
  providerName: string
  providerMessageId?: string
  idempotencyKey?: string
  retryCount: number
  maxRetries: number
  nextRetryAt?: string
  sentAt?: string
  deliveredAt?: string
  failReason?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface NotificationTemplateEntity {
  id: string
  tenantId: string
  templateType: string
  channel: 'whatsapp' | 'sms' | 'email'
  subject?: string
  content: string
  whatsappTemplateName?: string
  active: boolean
  createdAt: string
  updatedAt?: string
}

export interface NotificationRepository {
  findById(id: string): Promise<NotificationLogEntity | null>
  findByIdempotencyKey(key: string): Promise<NotificationLogEntity | null>
  listByAppointment(appointmentId: string): Promise<NotificationLogEntity[]>
  listByTenant(tenantId: string, limit?: number): Promise<NotificationLogEntity[]>
  listPendingRetries(limit?: number): Promise<NotificationLogEntity[]>
  create(data: Omit<NotificationLogEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationLogEntity>
  updateStatus(
    id: string,
    params: {
      status: NotificationLogEntity['status']
      providerMessageId?: string
      sentAt?: string
      deliveredAt?: string
      failReason?: string
      retryCount?: number
      nextRetryAt?: string
    }
  ): Promise<NotificationLogEntity>
}

export interface TemplateRepository {
  findByTypeAndChannel(
    tenantId: string,
    templateType: string,
    channel: 'whatsapp' | 'sms' | 'email'
  ): Promise<NotificationTemplateEntity | null>
  listByTenant(tenantId: string): Promise<NotificationTemplateEntity[]>
  upsert(
    data: Omit<NotificationTemplateEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationTemplateEntity>
}
