import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#DDDDD8] flex items-start justify-center md:py-10">
      <div className="w-full md:w-[393px] bg-white min-h-[640px] md:min-h-[700px] md:rounded-[44px] md:overflow-hidden md:shadow-2xl md:border md:border-white/20 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5 text-gray-500">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>

        <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Barbershop Not Found</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          The booking link or barbershop you are looking for does not exist or may have been moved.
        </p>

        <Link
          href="/"
          className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-sm transition-all text-center inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}
