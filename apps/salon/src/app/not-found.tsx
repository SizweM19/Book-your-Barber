import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center space-y-4">
        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Screen not found</h2>
          <p className="text-sm text-gray-500 mt-1">The salon management page you are looking for does not exist.</p>
        </div>
        <Link
          href="/app"
          className="inline-block w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors text-center"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

