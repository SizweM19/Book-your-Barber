export default function Loading() {
  return (
    <div className="min-h-screen bg-[#DDDDD8] flex items-start justify-center md:py-10">
      <div className="w-full md:w-[393px] bg-white min-h-[640px] md:min-h-[700px] md:rounded-[44px] md:overflow-hidden md:shadow-2xl md:border md:border-white/20 p-5 flex flex-col justify-between">
        <div>
          {/* Header Skeleton */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="space-y-3">
            {[100, 80, 90, 70].map((w, i) => (
              <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                <div
                  className="h-4 bg-gray-200 rounded-full animate-pulse mb-2.5"
                  style={{ width: `${w}%` }}
                />
                <div className="h-3 w-1/2 bg-gray-100 rounded-full animate-pulse mb-3" />
                <div className="flex justify-between items-center pt-1">
                  <div className="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-6 w-14 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-400 font-medium">Loading booking session...</span>
        </div>
      </div>
    </div>
  )
}
