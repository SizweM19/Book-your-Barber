'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CustomerListScreen, CustomerProfileScreen } from '@/ops/Customers'

export default function CustomersPage() {
function CustomersContent() {
  const router = useRouter()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(idParam)

  useEffect(() => {
    if (idParam) {
      setSelectedCustomerId(idParam)
    }
  }, [idParam])

  function handleNav(view: string) {
    if (view === 'dashboard') router.push('/app')
    else if (view === 'createAppt') router.push('/app/appointments?action=create')
    else router.push(`/app/${view}`)
  }

  function handleAppt(ref: string) {
    router.push(`/app/appointments?ref=${ref}`)
  }

  if (selectedCustomerId) {
    return (
      <CustomerProfileScreen
        customerId={selectedCustomerId}
        onBack={() => setSelectedCustomerId(null)}
        onAppt={handleAppt}
        onNav={handleNav as any}
      />
    )
  }

  return <CustomerListScreen onNav={handleNav as any} onCustomer={setSelectedCustomerId} />
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading customers...</div>}>
      <CustomersContent />
    </Suspense>
  )
}