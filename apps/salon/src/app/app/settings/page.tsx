'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { getRouteForOpsView } from '@/ops/shared'

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view')
  const [activeScreen, setActiveScreen] = useState<string>(viewParam || 'hub')
  const [editServiceId, setEditServiceId] = useState<string>('')
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    if (viewParam) {
      setActiveScreen(viewParam)
    }
  }, [viewParam])

  function navTo(screen: string) {
    if (screen === 'staffList') {
      router.push('/app/staff')
      return
    }
    if (screen === 'dashboard') {
      router.push('/app')
      return
    }
    const internalScreens = [
      'settingsServices', 'settingsAddService', 'settingsEditService',
      'settingsAddStaff', 'settingsAvailability', 'settingsBooking',
      'settingsPayments', 'settingsCancellation', 'hub'
    ]
    if (internalScreens.includes(screen)) {
      setHistory(h => [...h, activeScreen])
      setActiveScreen(screen)
    } else {
      router.push(getRouteForOpsView(screen))
    }
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