'use client'

import React from 'react'
import { CustomerApp } from '@/App'

export default function SalonBookingPage({
  params,
}: {
  params: Promise<{ salonSlug: string }>
}) {
  const { salonSlug } = React.use(params)
  // Mounts dedicated customer booking experience for the salon
  return <CustomerApp salonSlug={salonSlug} />
}