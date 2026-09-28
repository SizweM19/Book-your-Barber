'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Customer booking error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#DDDDD8] flex items-start justify-center md:py-10">
      <div className="w-full md:w-[393px] bg-white min-h-[640px] md:min-h-[700px] md:rounded-[44px] md:overflow-hidden md:shadow-2xl md:border md:border-white/20 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5 text-red-500">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          We encountered an issue loading your booking session. Please try again or return to the barbershop page.
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-block w-full py-3.5 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl font-semibold text-sm transition-colors text-center"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
