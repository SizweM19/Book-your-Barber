'use client'

import React, { useState } from 'react'
import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  SettingsHubScreen,
  SettingsServicesScreen,
  AddServiceScreen,
  EditServiceScreen,
  AddStaffScreen,
  AvailabilityScreen,
  BookingSettingsScreen,
  PaymentSettingsScreen,
  CancellationPolicyScreen,
} from '@/ops/Settings'

export default function SettingsPage() {
function SettingsContent() {
  const router = useRouter()
  const [activeScreen, setActiveScreen] = useState<string>('hub')
  const [editServiceId, setEditServiceId] = useState<string>('')
  const [history, setHistory] = useState<string[]>([])

  function navTo(screen: string) {
    if (screen === 'staffList') {
      router.push('/app/staff')
      return
    }
    if (screen === 'dashboard') {
      router.push('/app')
      return
    }
    setHistory(h => [...h, activeScreen])
    setActiveScreen(screen)
  }

  function back() {
    const prev = history[history.length - 1]
    if (prev) {
      setActiveScreen(prev)
      setHistory(h => h.slice(0, -1))
    } else {
      setActiveScreen('hub')
    }
  }

  switch (activeScreen) {
    case 'settingsServices':
      return <SettingsServicesScreen onBack={back} onNav={navTo as any} onEdit={id => { setEditServiceId(id); navTo('settingsEditService') }} />
    case 'settingsAddService':
      return <AddServiceScreen onBack={back} onDone={back} />
    case 'settingsEditService':
      return <EditServiceScreen serviceId={editServiceId} onBack={back} onDone={back} />
    case 'settingsAddStaff':
      return <AddStaffScreen onBack={back} onDone={back} />
      return <AddStaffScreen onBack={back} onDone={() => router.push('/app/staff')} />
    case 'settingsAvailability':
      return <AvailabilityScreen onBack={back} />
    case 'settingsBooking':
      return <BookingSettingsScreen onBack={back} />
    case 'settingsPayments':
      return <PaymentSettingsScreen onBack={back} />
    case 'settingsCancellation':
      return <CancellationPolicyScreen onBack={back} />
    default:
      return <SettingsHubScreen onNav={navTo as any} />
  }
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  )
}