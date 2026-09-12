'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StaffListScreen, StaffProfileScreen } from '@/ops/Staff'

export default function StaffPage() {
function StaffContent() {
  const router = useRouter()
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(idParam)

  useEffect(() => {
    if (idParam) {
      setSelectedStaffId(idParam)
    }
  }, [idParam])

  function handleNav(view: string) {
    if (view === 'dashboard') router.push('/app')
    else router.push(`/app/${view}`)
  }

  if (selectedStaffId) {
    return (
      <StaffProfileScreen
        staffId={selectedStaffId}
        onBack={() => setSelectedStaffId(null)}
        onNav={handleNav as any}
      />
    )
  }

  return <StaffListScreen onNav={handleNav as any} onStaff={setSelectedStaffId} />
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading staff...</div>}>
      <StaffContent />
    </Suspense>
  )
}