'use client'

import React from 'react'
import CustomerBookingEngine from '@/lib/CustomerBookingEngine'

export default function ReschedulePage() {
  return <CustomerBookingEngine initialStep="bookingLookup" />
}
