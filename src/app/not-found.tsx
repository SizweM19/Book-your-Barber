import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#DDDDD8] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <span className="text-white text-lg font-black">B</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-xs text-gray-600 mb-6 max-w-xs">
        The requested page could not be found.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors"
      >
        Return to Booking
      </Link>
    </div>
  )
}