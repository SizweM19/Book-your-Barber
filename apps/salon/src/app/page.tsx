'use client'

import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-between p-6 md:p-12">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-lg">
            B
          </div>
          <div>
            <span className="font-black text-gray-900 tracking-tight text-lg">BookYourBarber</span>
            <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Production</span>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="text-xs font-bold text-gray-700 hover:text-gray-900 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm transition-colors"
        >
          Salon Portal Sign In →
        </Link>
      </header>

      <main className="max-w-4xl mx-auto w-full py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Multi-Tenant Barbershop Operations Engine
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          Book your cut.<br className="hidden md:inline" /> Run your barbershop.
        </h1>

        <p className="text-gray-600 text-sm md:text-base max-w-xl mb-10 leading-relaxed">
          The all-in-one platform for South African barbershops. Frictionless customer booking without app downloads, combined with an operational hub for calendar, appointments, staff, and cash register.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
          <Link
            href="/book/fade-and-edge"
            className="flex flex-col items-start p-6 bg-gray-900 text-white rounded-3xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl text-left group"
          >
            <span className="text-2xl mb-3">📱</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Experience</span>
            <span className="text-lg font-black text-white mt-1 group-hover:translate-x-0.5 transition-transform">
              Book at Fade &amp; Edge →
            </span>
            <span className="text-xs text-gray-400 mt-2">
              Step-by-step haircut reservation with instant WhatsApp confirmation and slot hold.
            </span>
          </Link>

          <Link
            href="/app"
            className="flex flex-col items-start p-6 bg-white text-gray-900 rounded-3xl border border-gray-200 hover:border-gray-400 transition-all shadow-sm hover:shadow-md text-left group"
          >
            <span className="text-2xl mb-3">⚙️</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Salon Operations</span>
            <span className="text-lg font-black text-gray-900 mt-1 group-hover:translate-x-0.5 transition-transform">
              Salon Dashboard →
            </span>
            <span className="text-xs text-gray-500 mt-2">
              Staff roster, daily calendar grid, client CRM, payments, and financial register.
            </span>
          </Link>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-4">
        <p>© 2026 BookYourBarber. All rights reserved.</p>
        <div className="flex items-center gap-6 font-medium">
          <span>RLS Enforced</span>
          <span>•</span>
          <span>Next.js App Router</span>
          <span>•</span>
          <span>ZAR South Africa</span>
        </div>
      </footer>
    </div>
  )
}
