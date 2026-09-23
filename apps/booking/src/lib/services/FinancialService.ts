/**
 * Financial Application Service.
 * 
 * Authoritative source of truth for Salon Financial Management.
 * Enforces strict domain rules:
 * - Operating Result = Salon Revenue - Salon Expenses (Not formal accounting).
 * - Outstanding = Charged - Paid (Cannot be negative).
 * - Platform cancellation fees are platform revenue and excluded from salon revenue.
 * - Refunds are tracked separately and not treated as new sales or negative revenue.
 * - Uniform period filtering applied consistently across appointments, payments, refunds, and expenses.
 * - Integer minor units (cents) via money utilities for zero floating-point drift.
 */

import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type {
  AppointmentEntity,
  DomainPaymentRecord,
  DomainRefundRecord,
  ExpenseEntity,
} from '@/application/repositories/interfaces'
import {
  addMoney,
  subtractMoney,
  assertNonNegative,
  formatZAR,
} from '@/domains/payments/money'

export type FinancialPeriod = 'Today' | 'Week' | 'Month' | 'Last month' | 'All'

export interface FinancialOverview {
  period: FinancialPeriod
  totalCharged: number
  totalCollected: number
  totalOutstanding: number
  totalRefunded: number
  totalExpenses: number
  operatingResult: number
  outstandingCount: number
  paymentCount: number
  refundCount: number
}

export interface PaymentDisplayRecord {
  id: string
  appointmentId: string
  bookingReference: string
  customerName: string
  serviceName: string
  amount: number
  method: 'cash' | 'card' | 'yoco' | 'payshap' | 'other'
  status: 'successful' | 'failed' | 'pending'
  source: 'ONLINE' | 'SALON'
  recordedAt: string
}

export interface OutstandingDisplayRecord {
  appointmentId: string
  bookingReference: string
  customerName: string
  serviceName: string
  appointmentDate: string
  startTime: string
  totalCharged: number
  totalPaid: number
  outstanding: number
  paymentStatus: AppointmentEntity['paymentStatus']
}

export interface RefundDisplayRecord {
  id: string
  refundReference: string
  appointmentId: string
  bookingReference: string
  customerName: string
  cancelledBy: 'customer' | 'salon'
  originalAmount: number
  feePercent: number
  feeAmount: number
  refundAmount: number
  status: DomainRefundRecord['status']
  requestedAt: string
  completedAt?: string
}

export interface StaffRevenueItem {
  id: string
  name: string
  role: string
  completedCount: number
  revenue: number
}

export interface SourceRevenueItem {
  source: 'online' | 'qr' | 'manual'
  label: string
  revenue: number
  count: number
  percentage: number
}

export interface MethodRevenueItem {
  method: 'cash' | 'card' | 'yoco' | 'payshap' | 'other'
  label: string
  amount: number
  count: number
  percentage: number
}

export interface RevenueBreakdown {
  period: FinancialPeriod
  totalCharged: number
  totalCollected: number
  totalOutstanding: number
  totalRefunded: number
  totalExpenses: number
  operatingResult: number
  byStaff: StaffRevenueItem[]
  bySource: SourceRevenueItem[]
  byMethod: MethodRevenueItem[]
}

export class FinancialService {
  constructor(private repos: RepositoryContainer = defaultRepositories) {}

  /**
   * Helper to check if an ISO date string (YYYY-MM-DD or full timestamp) falls within a period.
   */
  isInPeriod(dateStr: string, period: FinancialPeriod, now: Date = new Date()): boolean {
    if (period === 'All') return true
    if (!dateStr) return false

    const date = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr)
    if (isNaN(date.getTime())) return false

    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth()
    const nowDate = now.getDate()

    if (period === 'Today') {
      return (
        date.getFullYear() === nowYear &&
        date.getMonth() === nowMonth &&
        date.getDate() === nowDate
      )
    }

    if (period === 'Week') {
      // Last 7 days including today
      const startOfWeek = new Date(nowYear, nowMonth, nowDate - 6)
      const endOfWeek = new Date(nowYear, nowMonth, nowDate, 23, 59, 59, 999)
      return date >= startOfWeek && date <= endOfWeek
    }

    if (period === 'Month') {
      return (
        date.getFullYear() === nowYear &&
        date.getMonth() === nowMonth
      )
    }

    if (period === 'Last month') {
      const lastMonthDate = new Date(nowYear, nowMonth - 1, 1)
      const lastMonthYear = lastMonthDate.getFullYear()
      const lastMonthMonth = lastMonthDate.getMonth()
      return (
        date.getFullYear() === lastMonthYear &&
        date.getMonth() === lastMonthMonth
      )
    }

    return true
  }

  /**
   * Retrieves high-level operational financial overview for the salon dashboard.
   */
  async getFinancialOverview(
    tenantId: string,
    period: FinancialPeriod = 'Today',
    now: Date = new Date()
  ): Promise<FinancialOverview> {
    const [appts, payments, refunds, expenses] = await Promise.all([
      this.repos.appointments.listByTenant(tenantId, 500),
      this.repos.payments.listByTenant ? this.repos.payments.listByTenant(tenantId, 500) : [],
      this.repos.refunds.listByTenant(tenantId),
      this.repos.expenses.list(tenantId),
    ])

    // Filter by uniform period
    const filteredAppts = appts.filter(a => this.isInPeriod(a.appointmentDate, period, now))
    const filteredPayments = payments.filter(p => this.isInPeriod(p.recordedAt, period, now) && p.status === 'successful')
    const filteredRefunds = refunds.filter(r => this.isInPeriod(r.requestedAt, period, now) && r.status === 'completed')
    const filteredExpenses = expenses.filter(e => this.isInPeriod(e.expenseDate, period, now))

    // 1. Charged: sum of totalCharged for non-cancelled appointments in this period
    const totalCharged = filteredAppts
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, a) => addMoney(sum, a.totalCharged), 0)

    // 2. Collected: sum of actual recorded payments in this period
    // If payments table has records, use authoritative payments table; otherwise fallback to appointment totalPaid
    let totalCollected = 0
    if (filteredPayments.length > 0) {
      totalCollected = filteredPayments.reduce((sum, p) => addMoney(sum, p.amount), 0)
    } else {
      totalCollected = filteredAppts.reduce((sum, a) => addMoney(sum, a.totalPaid), 0)
    }

    // 3. Outstanding: sum of max(0, totalCharged - totalPaid) for active appointments in this period
    const totalOutstanding = filteredAppts
      .filter(a => a.status !== 'cancelled' && a.status !== 'noShow')
      .reduce((sum, a) => {
        const rem = subtractMoney(a.totalCharged, a.totalPaid)
        return addMoney(sum, Math.max(0, rem))
      }, 0)

    const outstandingCount = filteredAppts.filter(
      a => a.status !== 'cancelled' && a.status !== 'noShow' && a.totalPaid < a.totalCharged
    ).length

    // 4. Refunded: sum of completed refund amounts in this period
    const totalRefunded = filteredRefunds.reduce((sum, r) => addMoney(sum, r.refundAmount), 0)

    // 5. Expenses: sum of expenses in this period
    const totalExpenses = filteredExpenses.reduce((sum, e) => addMoney(sum, e.amount), 0)

    // 6. Operating Result: Collected - Expenses (not formal accounting)
    const operatingResult = subtractMoney(totalCollected, totalExpenses)

    return {
      period,
      totalCharged,
      totalCollected,
      totalOutstanding,
      totalRefunded,
      totalExpenses,
      operatingResult,
      outstandingCount,
      paymentCount: filteredPayments.length > 0 ? filteredPayments.length : filteredAppts.filter(a => a.totalPaid > 0).length,
      refundCount: filteredRefunds.length,
    }
  }

  /**
   * Retrieves list of authoritative payment records with customer and service details.
   */
  async getPaymentRecords(
    tenantId: string,
    filter: { period?: FinancialPeriod; status?: string; search?: string } = {}
  ): Promise<PaymentDisplayRecord[]> {
    const period = filter.period || 'All'
    const statusFilter = filter.status || 'All'
    const search = filter.search?.toLowerCase().trim() || ''

    const [payments, appts, customers, services] = await Promise.all([
      this.repos.payments.listByTenant ? this.repos.payments.listByTenant(tenantId, 500) : [],
      this.repos.appointments.listByTenant(tenantId, 500),
      this.repos.customers.list(tenantId),
      this.repos.services.list(tenantId, true),
    ])

    const apptMap = new Map(appts.map(a => [a.id, a]))
    const custMap = new Map(customers.map(c => [c.id, c]))
    const svcMap = new Map(services.map(s => [s.id, s]))

    // If payments table has records, use authoritative payments records
    if (payments.length > 0) {
      return payments
        .filter(p => {
          if (!this.isInPeriod(p.recordedAt, period)) return false
          if (statusFilter !== 'All' && p.status !== statusFilter.toLowerCase()) return false
          return true
        })
        .map(p => {
          const appt = apptMap.get(p.appointmentId)
          const cust = appt ? custMap.get(appt.customerId) : null
          const svc = appt ? svcMap.get(appt.serviceId) : null

          return {
            id: p.id,
            appointmentId: p.appointmentId,
            bookingReference: appt?.bookingReference || p.appointmentId,
            customerName: cust?.name || 'Customer',
            serviceName: svc?.name || 'Service',
            amount: p.amount,
            method: (p.method as any) || 'card',
            status: p.status,
            source: (p.source as any) || 'SALON',
            recordedAt: p.recordedAt,
          }
        })
        .filter(r => {
          if (!search) return true
          return (
            r.bookingReference.toLowerCase().includes(search) ||
            r.customerName.toLowerCase().includes(search) ||
            r.serviceName.toLowerCase().includes(search)
          )
        })
    }

    // Fallback: derive from appointments with totalPaid > 0
    return appts
      .filter(a => a.totalPaid > 0 && this.isInPeriod(a.appointmentDate, period))
      .map(a => {
        const cust = custMap.get(a.customerId)
        const svc = svcMap.get(a.serviceId)
        return {
          id: a.id,
          appointmentId: a.id,
          bookingReference: a.bookingReference,
          customerName: cust?.name || 'Customer',
          serviceName: svc?.name || 'Service',
          amount: a.totalPaid,
          method: (a.bookingSource === 'manual' ? 'cash' : 'card') as any,
          status: 'successful' as const,
          source: (a.bookingSource === 'online' ? 'ONLINE' : 'SALON') as any,
          recordedAt: `${a.appointmentDate} ${a.startTime}`,
        }
      })
      .filter(r => {
        if (!search) return true
        return (
          r.bookingReference.toLowerCase().includes(search) ||
          r.customerName.toLowerCase().includes(search) ||
          r.serviceName.toLowerCase().includes(search)
        )
      })
  }

  /**
   * Retrieves outstanding appointments where totalPaid < totalCharged.
   */
  async getOutstandingAppointments(tenantId: string): Promise<OutstandingDisplayRecord[]> {
    const [appts, customers, services] = await Promise.all([
      this.repos.appointments.listByTenant(tenantId, 500),
      this.repos.customers.list(tenantId),
      this.repos.services.list(tenantId, true),
    ])

    const custMap = new Map(customers.map(c => [c.id, c]))
    const svcMap = new Map(services.map(s => [s.id, s]))

    return appts
      .filter(a => a.totalPaid < a.totalCharged && a.status !== 'cancelled' && a.status !== 'noShow')
      .map(a => {
        const cust = custMap.get(a.customerId)
        const svc = svcMap.get(a.serviceId)
        const outstanding = subtractMoney(a.totalCharged, a.totalPaid)

        return {
          appointmentId: a.id,
          bookingReference: a.bookingReference,
          customerName: cust?.name || 'Customer',
          serviceName: svc?.name || 'Service',
          appointmentDate: a.appointmentDate,
          startTime: a.startTime,
          totalCharged: a.totalCharged,
          totalPaid: a.totalPaid,
          outstanding: Math.max(0, outstanding),
          paymentStatus: a.paymentStatus,
        }
      })
  }

  /**
   * Retrieves refund records with appointment and customer resolution.
   */
  async getRefundRecords(
    tenantId: string,
    filter: { status?: string; search?: string } = {}
  ): Promise<RefundDisplayRecord[]> {
    const statusFilter = filter.status || 'All'
    const search = filter.search?.toLowerCase().trim() || ''

    const [refunds, appts, customers] = await Promise.all([
      this.repos.refunds.listByTenant(tenantId),
      this.repos.appointments.listByTenant(tenantId, 500),
      this.repos.customers.list(tenantId),
    ])

    const apptMap = new Map(appts.map(a => [a.id, a]))
    const custMap = new Map(customers.map(c => [c.id, c]))

    return refunds
      .filter(r => {
        if (statusFilter !== 'All' && r.status !== statusFilter.toLowerCase()) return false
        return true
      })
      .map(r => {
        const appt = apptMap.get(r.appointmentId)
        const cust = r.customerId ? custMap.get(r.customerId) : (appt ? custMap.get(appt.customerId) : null)

        return {
          id: r.id,
          refundReference: r.refundReference,
          appointmentId: r.appointmentId,
          bookingReference: appt?.bookingReference || r.appointmentId,
          customerName: cust?.name || 'Customer',
          cancelledBy: r.cancelledBy,
          originalAmount: r.originalAmount,
          feePercent: r.feePercent,
          feeAmount: r.feeAmount,
          refundAmount: r.refundAmount,
          status: r.status,
          requestedAt: r.requestedAt,
          completedAt: r.completedAt,
        }
      })
      .filter(r => {
        if (!search) return true
        return (
          r.refundReference.toLowerCase().includes(search) ||
          r.bookingReference.toLowerCase().includes(search) ||
          r.customerName.toLowerCase().includes(search)
        )
      })
  }

  /**
   * Retrieves revenue breakdown across staff, booking sources, and payment methods.
   */
  async getRevenueBreakdown(
    tenantId: string,
    period: FinancialPeriod = 'Month',
    now: Date = new Date()
  ): Promise<RevenueBreakdown> {
    const [appts, staff, payments, refunds, expenses] = await Promise.all([
      this.repos.appointments.listByTenant(tenantId, 500),
      this.repos.staff.list(tenantId, true),
      this.repos.payments.listByTenant ? this.repos.payments.listByTenant(tenantId, 500) : [],
      this.repos.refunds.listByTenant(tenantId),
      this.repos.expenses.list(tenantId),
    ])

    const filteredAppts = appts.filter(a => this.isInPeriod(a.appointmentDate, period, now))
    const filteredPayments = payments.filter(p => this.isInPeriod(p.recordedAt, period, now) && p.status === 'successful')
    const filteredRefunds = refunds.filter(r => this.isInPeriod(r.requestedAt, period, now) && r.status === 'completed')
    const filteredExpenses = expenses.filter(e => this.isInPeriod(e.expenseDate, period, now))

    const totalCharged = filteredAppts
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, a) => addMoney(sum, a.totalCharged), 0)

    const totalCollected = filteredPayments.length > 0
      ? filteredPayments.reduce((sum, p) => addMoney(sum, p.amount), 0)
      : filteredAppts.reduce((sum, a) => addMoney(sum, a.totalPaid), 0)

    const totalOutstanding = filteredAppts
      .filter(a => a.status !== 'cancelled' && a.status !== 'noShow')
      .reduce((sum, a) => addMoney(sum, Math.max(0, subtractMoney(a.totalCharged, a.totalPaid))), 0)

    const totalRefunded = filteredRefunds.reduce((sum, r) => addMoney(sum, r.refundAmount), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => addMoney(sum, e.amount), 0)
    const operatingResult = subtractMoney(totalCollected, totalExpenses)

    // By Staff
    const byStaff: StaffRevenueItem[] = staff
      .filter(s => s.active)
      .map(s => {
        const staffAppts = filteredAppts.filter(a => a.staffId === s.id && a.status === 'completed')
        const revenue = staffAppts.reduce((sum, a) => addMoney(sum, a.totalPaid || a.totalCharged), 0)
        return {
          id: s.id,
          name: s.name,
          role: s.role,
          completedCount: staffAppts.length,
          revenue,
        }
      })

    // By Source (ONLINE, QR, MANUAL)
    const sources: ('online' | 'qr' | 'manual')[] = ['online', 'qr', 'manual']
    const bySource: SourceRevenueItem[] = sources.map(src => {
      const srcAppts = filteredAppts.filter(a => a.bookingSource === src)
      const revenue = srcAppts.reduce((sum, a) => addMoney(sum, a.totalPaid), 0)
      const count = srcAppts.length
      const percentage = totalCollected > 0 ? Math.round((revenue / totalCollected) * 100) : 0
      const labels = { online: 'Online Booking', qr: 'QR Walk-in', manual: 'Manual Register' }
      return {
        source: src,
        label: labels[src],
        revenue,
        count,
        percentage,
      }
    })

    // By Method (Cash, Card, Yoco, PayShap, Other)
    const methods: ('cash' | 'card' | 'yoco' | 'payshap' | 'other')[] = ['cash', 'card', 'yoco', 'payshap', 'other']
    const methodLabels = {
      cash: 'Cash',
      card: 'Card',
      yoco: 'Yoco',
      payshap: 'PayShap',
      other: 'Other',
    }

    const byMethod: MethodRevenueItem[] = methods.map(m => {
      let amount = 0
      let count = 0

      if (filteredPayments.length > 0) {
        const mPayments = filteredPayments.filter(p => p.method === m)
        amount = mPayments.reduce((sum, p) => addMoney(sum, p.amount), 0)
        count = mPayments.length
      } else {
        // Fallback approximation when payments table has not been populated
        const mAppts = filteredAppts.filter(a => {
          const derivedMethod = a.bookingSource === 'manual' ? 'cash' : 'card'
          return derivedMethod === m && a.totalPaid > 0
        })
        amount = mAppts.reduce((sum, a) => addMoney(sum, a.totalPaid), 0)
        count = mAppts.length
      }

      const percentage = totalCollected > 0 ? Math.round((amount / totalCollected) * 100) : 0
      return {
        method: m,
        label: methodLabels[m],
        amount,
        count,
        percentage,
      }
    }).filter(m => m.amount > 0 || m.count > 0)

    return {
      period,
      totalCharged,
      totalCollected,
      totalOutstanding,
      totalRefunded,
      totalExpenses,
      operatingResult,
      byStaff,
      bySource,
      byMethod,
    }
  }
}

export const financialService = new FinancialService()
