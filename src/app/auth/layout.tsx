import React from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-base font-black tracking-wider">B</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">BookYourBarber</span>
        </Link>
        <p className="mt-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Salon Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-3xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  )
}

