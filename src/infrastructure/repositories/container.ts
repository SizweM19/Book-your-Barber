import type {
  CustomerRepository,
  ServiceRepository,
  StaffRepository,
  AppointmentRepository,
  PaymentRepository,
  RefundRepository,
  ExpenseRepository,
  StaffServiceRepository,
  ScheduleRepository,
  SalonSettingsRepository,
  SalonRepository,
} from '@/application/repositories/interfaces'
import {
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
  MockSalonRepository,
} from './MockRepositories'
import {
  SupabaseCustomerRepository,
  SupabaseServiceRepository,
  SupabaseStaffRepository,
  SupabaseAppointmentRepository,
  SupabasePaymentRepository,
  SupabaseRefundRepository,
  SupabaseExpenseRepository,
  SupabaseStaffServiceRepository,
  SupabaseScheduleRepository,
  SupabaseSalonSettingsRepository,
  SupabaseSalonRepository,
} from './SupabaseRepositories'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'

export interface RepositoryContainer {
  salons: SalonRepository
  customers: CustomerRepository
  services: ServiceRepository
  staff: StaffRepository
  appointments: AppointmentRepository
  payments: PaymentRepository
  refunds: RefundRepository
  expenses: ExpenseRepository
  staffServices: StaffServiceRepository
  schedules: ScheduleRepository
  settings: SalonSettingsRepository
}

// Singleton instances for Mock Data Mode
const mockContainer: RepositoryContainer = {
  salons: new MockSalonRepository(),
  customers: new MockCustomerRepository(),
  services: new MockServiceRepository(),
  staff: new MockStaffRepository(),
  appointments: new MockAppointmentRepository(),
  payments: new MockPaymentRepository(),
  refunds: new MockRefundRepository(),
  expenses: new MockExpenseRepository(),
  staffServices: new MockStaffServiceRepository(),
  schedules: new MockScheduleRepository(),
  settings: new MockSalonSettingsRepository(),
}

export function createSupabaseContainer(client?: any): RepositoryContainer {
  return {
    salons: new SupabaseSalonRepository(client),
    customers: new SupabaseCustomerRepository(client),
    services: new SupabaseServiceRepository(client),
    staff: new SupabaseStaffRepository(client),
    appointments: new SupabaseAppointmentRepository(client),
    payments: new SupabasePaymentRepository(client),
    refunds: new SupabaseRefundRepository(client),
    expenses: new SupabaseExpenseRepository(client),
    staffServices: new SupabaseStaffServiceRepository(client),
    schedules: new SupabaseScheduleRepository(client),
    settings: new SupabaseSalonSettingsRepository(client),
  }
}

// Singleton instances for Supabase Live Mode
let supabaseContainer: RepositoryContainer | null = null

function getSupabaseContainer(): RepositoryContainer {
  if (!supabaseContainer) {
    supabaseContainer = {
      salons: new SupabaseSalonRepository(),
      customers: new SupabaseCustomerRepository(),
      services: new SupabaseServiceRepository(),
      staff: new SupabaseStaffRepository(),
      appointments: new SupabaseAppointmentRepository(),
      payments: new SupabasePaymentRepository(),
      refunds: new SupabaseRefundRepository(),
      expenses: new SupabaseExpenseRepository(),
      staffServices: new SupabaseStaffServiceRepository(),
      schedules: new SupabaseScheduleRepository(),
      settings: new SupabaseSalonSettingsRepository(),
    }
    supabaseContainer = createSupabaseContainer()
  }
  return supabaseContainer
}

/**
 * Determines default repository mode based on environment variables and context.
 */
export function getDefaultRepositoryMode(): 'mock' | 'supabase' {
  if (process.env.NEXT_PUBLIC_USE_MOCK_REPOSITORIES === 'true') {
    return 'mock'
  }
  if (process.env.NODE_ENV === 'test' && !process.env.INTEGRATION_TEST) {
    return 'mock'
  }
  if (process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' || isSupabaseConfigured()) {
    return 'supabase'
  }
  return 'mock'
}

/**
 * Accesses the active repository container.
 * 
 * Allows modules to gradually migrate from mock repositories to Supabase repositories
 * Allows modules to dynamically or explicitly select mock repositories or Supabase repositories
 * without any breaking changes or mixing uncontrolled fake data with production data.
 */
export function getRepositories(mode?: 'mock' | 'supabase'): RepositoryContainer {
  const activeMode = mode || getDefaultRepositoryMode()
  if (activeMode === 'supabase') {
    return getSupabaseContainer()
  }
  return mockContainer
}

// Default export uses dynamic proxy routing to the active container
export const repositories: RepositoryContainer = new Proxy({} as RepositoryContainer, {
  get(_target, prop: string) {
    const container = getRepositories()
    return (container as any)[prop]
  },
})