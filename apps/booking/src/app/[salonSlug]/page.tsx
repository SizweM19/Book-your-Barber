'use client'

import React from 'react'
import CustomerBookingEngine from '@/lib/CustomerBookingEngine'

export default function SalonBookingPage({
  params,
}: {
  params: Promise<{ salonSlug: string }>
}) {
  const { salonSlug } = React.use(params)
  return <CustomerBookingEngine salonSlug={salonSlug} />
}
