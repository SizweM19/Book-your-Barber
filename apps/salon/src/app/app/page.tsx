'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { DashboardScreen } from '@/ops/Dashboard'

export default function SalonDashboardPage() {
  const router = useRouter()

  function handleNav(view: string) {
    if (view === 'calendarDay' || view === 'calendarWeek') router.push('/app/calendar')
    else if (view.startsWith('appointment')) router.push('/app/appointments')
    else if (view.startsWith('customer')) router.push('/app/customers')
    else if (view.startsWith('staff')) router.push('/app/staff')
    else if (view.startsWith('service')) router.push('/app/services')
    else if (view.startsWith('financial')) router.push('/app/financials')
    else if (view.startsWith('settings')) router.push('/app/settings')
    else router.push('/app')
  }

  function handleAppt(ref: string) {
    router.push(`/app/appointments?ref=${ref}`)
  }

  return <DashboardScreen onNav={handleNav as any} onAppt={handleAppt} />
}