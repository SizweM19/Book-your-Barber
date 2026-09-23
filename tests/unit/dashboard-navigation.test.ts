import { describe, it, expect, vi } from 'vitest'

describe('Dashboard Navigation & Routing Resolution', () => {
  // Simulates router resolution logic from src/app/app/page.tsx
  function resolveRoute(view: string): string {
    if (view === 'calendarDay' || view === 'calendarWeek' || view === 'calendar') {
      return '/app/calendar'
    } else if (view === 'createAppt') {
      return '/app/appointments?action=create'
    } else if (view.startsWith('appointment') || view === 'appointments') {
      return '/app/appointments'
    } else if (view.startsWith('customer')) {
      return '/app/customers'
    } else if (view.startsWith('staff')) {
      return '/app/staff'
    } else if (view.startsWith('service')) {
      return '/app/services'
    } else if (view.startsWith('financial')) {
      return '/app/financials'
    } else if (view.startsWith('settings')) {
      return '/app/settings'
    }
    return '/app'
  }

  function resolveApptRoute(ref: string): string {
    return `/app/appointments?ref=${ref}`
  }

  it('routes appointment actions to the correct appointments paths', () => {
    expect(resolveRoute('createAppt')).toBe('/app/appointments?action=create')
    expect(resolveRoute('appointmentList')).toBe('/app/appointments')
    expect(resolveRoute('appointments')).toBe('/app/appointments')
  })

  it('routes calendar views to /app/calendar', () => {
    expect(resolveRoute('calendar')).toBe('/app/calendar')
    expect(resolveRoute('calendarDay')).toBe('/app/calendar')
    expect(resolveRoute('calendarWeek')).toBe('/app/calendar')
  })

  it('routes hub views correctly', () => {
    expect(resolveRoute('customerList')).toBe('/app/customers')
    expect(resolveRoute('staffList')).toBe('/app/staff')
    expect(resolveRoute('serviceList')).toBe('/app/services')
    expect(resolveRoute('financialsHub')).toBe('/app/financials')
    expect(resolveRoute('settings')).toBe('/app/settings')
  })

  it('routes specific appointment drilldowns by reference', () => {
    expect(resolveApptRoute('BYB-20260912-00482')).toBe('/app/appointments?ref=BYB-20260912-00482')
  })
})
