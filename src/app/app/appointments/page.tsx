'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AppointmentListScreen,
  AppointmentDetailScreen,
  RecordPaymentScreen,
  CompleteApptScreen,
  CancelApptScreen,
  NoShowScreen,
  RescheduleScreen,
  CreateApptScreen,
} from '@/ops/Appointments'

export default function AppointmentsPage() {
function AppointmentsContent() {
  const router = useRouter()
  const [selectedApptRef, setSelectedApptRef] = useState<string | null>(null)
  const [subView, setSubView] = useState<'list' | 'detail' | 'recordPayment' | 'complete' | 'cancel' | 'noShow' | 'reschedule' | 'create'>('list')
  const searchParams = useSearchParams()
  const refParam = searchParams.get('ref')
  const actionParam = searchParams.get('action')

  const [selectedApptRef, setSelectedApptRef] = useState<string | null>(refParam)
  const [subView, setSubView] = useState<'list' | 'detail' | 'recordPayment' | 'complete' | 'cancel' | 'noShow' | 'reschedule' | 'create'>(() => {
    if (actionParam === 'create') return 'create'
    if (actionParam === 'reschedule') return 'reschedule'
    if (actionParam === 'recordPayment') return 'recordPayment'
    if (actionParam === 'complete') return 'complete'
    if (actionParam === 'cancel') return 'cancel'
    if (actionParam === 'noShow') return 'noShow'
    if (refParam) return 'detail'
    return 'list'
  })

  useEffect(() => {
    if (refParam) setSelectedApptRef(refParam)
    if (actionParam === 'create') setSubView('create')
    else if (actionParam === 'reschedule') setSubView('reschedule')
    else if (actionParam === 'recordPayment') setSubView('recordPayment')
    else if (actionParam === 'complete') setSubView('complete')
    else if (actionParam === 'cancel') setSubView('cancel')
    else if (actionParam === 'noShow') setSubView('noShow')
    else if (refParam) setSubView('detail')
  }, [refParam, actionParam])

  function handleNav(view: string) {
    if (view === 'createAppt') setSubView('create')
    else if (view === 'appointmentList') setSubView('list')
    else if (view === 'dashboard') router.push('/app')
    else router.push(`/app/${view}`)
  }

  function handleAppt(ref: string) {
    setSelectedApptRef(ref)
    setSubView('detail')
  }

  function handleSubNav(view: string) {
    if (view === 'recordPayment') setSubView('recordPayment')
    else if (view === 'completeAppt') setSubView('complete')
    else if (view === 'cancelAppt') setSubView('cancel')
    else if (view === 'noShow') setSubView('noShow')
    else if (view === 'reschedule') setSubView('reschedule')
    else setSubView('list')
  }

  if (subView === 'detail' && selectedApptRef) {
    return <AppointmentDetailScreen apptRef={selectedApptRef} onBack={() => setSubView('list')} onNav={handleSubNav as any} />
  }

  if (subView === 'recordPayment') {
    return <RecordPaymentScreen onBack={() => setSubView('detail')} onDone={() => setSubView('detail')} />
    return (
      <RecordPaymentScreen
        apptRef={selectedApptRef || undefined}
        onBack={() => setSubView(selectedApptRef ? 'detail' : 'list')}
        onDone={() => setSubView(selectedApptRef ? 'detail' : 'list')}
      />
    )
  }

  if (subView === 'complete') {
    return <CompleteApptScreen onBack={() => setSubView('detail')} onDone={() => setSubView('list')} />
    return (
      <CompleteApptScreen
        apptRef={selectedApptRef || undefined}
        onBack={() => setSubView('detail')}
        onDone={() => setSubView('list')}
        onRecordPayment={() => setSubView('recordPayment')}
      />
    )
  }

  if (subView === 'cancel') {
    return <CancelApptScreen onBack={() => setSubView('detail')} onDone={() => setSubView('list')} />
    return (
      <CancelApptScreen
        apptRef={selectedApptRef || undefined}
        onBack={() => setSubView('detail')}
        onDone={() => setSubView('list')}
      />
    )
  }

  if (subView === 'noShow') {
    return <NoShowScreen onBack={() => setSubView('detail')} onDone={() => setSubView('list')} />
    return (
      <NoShowScreen
        apptRef={selectedApptRef || undefined}
        onBack={() => setSubView('detail')}
        onDone={() => setSubView('list')}
      />
    )
  }

  if (subView === 'reschedule') {
    return <RescheduleScreen onBack={() => setSubView('detail')} onDone={() => setSubView('detail')} />
    return (
      <RescheduleScreen
        apptRef={selectedApptRef || undefined}
        onBack={() => setSubView('detail')}
        onDone={() => setSubView('detail')}
      />
    )
  }

  if (subView === 'create') {
    return <CreateApptScreen onBack={() => setSubView('list')} onDone={() => setSubView('list')} onNav={handleNav as any} />
  }

  return <AppointmentListScreen onNav={handleNav as any} onAppt={handleAppt} />
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading appointments...</div>}>
      <AppointmentsContent />
    </Suspense>
  )
}