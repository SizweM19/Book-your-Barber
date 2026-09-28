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
    console.error('Salon management error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">An unexpected error occurred</h2>
          <p className="text-sm text-gray-500 mt-1">Failed to load the requested salon management screen.</p>
        </div>
        <button
          onClick={() => reset()}
          className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

