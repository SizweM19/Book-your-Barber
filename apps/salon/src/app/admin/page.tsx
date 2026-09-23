'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/application/auth'

export default function PlatformAdminPage() {
  const { user, isPlatformAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-[#F8F8F6] p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-md">
                Platform Admin Scope
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">BookYourBarber Administration</h1>
            <p className="text-xs text-gray-500 mt-0.5">Platform governance, salon monitoring, and support sessions</p>
          </div>
          <Link
            href="/app"
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl text-xs font-semibold transition-colors shadow-sm self-start"
          >
            ← Back to Salon View
          </Link>
        </div>

        {/* Platform KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Salons</p>
            <p className="text-2xl font-black text-gray-900 mt-1">1</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Fade &amp; Edge Barbershop</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-black text-gray-900 mt-1">482</p>
            <p className="text-[11px] text-gray-400 mt-1">Platform aggregate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform Volume</p>
            <p className="text-2xl font-black text-gray-900 mt-1">R 84,250</p>
            <p className="text-[11px] text-gray-400 mt-1">Gross ZAR processed</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Database Status</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">Healthy</p>
            <p className="text-[11px] text-gray-400 mt-1">RLS active on 24 tables</p>
          </div>
        </div>

        {/* Support Sessions Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Controlled Support Sessions</h2>
          <p className="text-xs text-gray-500 mb-4">
            Audited impersonation and diagnostic sessions require recorded authorization reasons.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <p className="text-xs text-gray-500">No active support sessions. System operating under standard isolation rules.</p>
          </div>
        </div>
      </div>
    </div>
  )
}