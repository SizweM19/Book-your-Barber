'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDayScreen, CalendarWeekScreen } from '@/ops/Calendar'

export default function CalendarPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  function handleNav(view: string) {
    if (view === 'calendarWeek') setViewMode('week')
    else if (view === 'calendarDay') setViewMode('day')
    else if (view === 'createAppt') router.push('/app/appointments?action=create')
    else if (view === 'dashboard') router.push('/app')
    else router.push(`/app/${view}`)
  }

  function handleAppt(ref: string) {
    router.push(`/app/appointments?ref=${ref}`)
  }

  return viewMode === 'day' ? (
    <CalendarDayScreen onNav={handleNav as any} onAppt={handleAppt} />
  ) : (
    <CalendarWeekScreen onNav={handleNav as any} onAppt={handleAppt} />
  )
}