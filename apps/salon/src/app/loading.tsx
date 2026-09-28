export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-600">Loading salon portal...</p>
      </div>
    </div>
  )
}

