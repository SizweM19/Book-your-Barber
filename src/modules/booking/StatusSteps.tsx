'use client'

import React from "react"
import { formatZAR } from "@/domains/payments/money"
import { BookingData } from "./types"
import { RefundBanner, DetailRow, formatDateLong } from "./shared"

// ─── 15. TIME SLOT UNAVAILABLE ────────────────────────────────────────────────

export function UnavailableStep({ onChooseTime, onChooseDate }: { onChooseTime: () => void; onChooseDate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">This appointment time is no longer available</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">Someone just booked this time slot. Please choose another available time.</p>
      <div className="w-full space-y-3">
        <button onClick={onChooseTime} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Choose another time</button>
        <button onClick={onChooseDate} className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Choose another date</button>
      </div>
    </div>
  )
}

// ─── 16. SLOT HOLD EXPIRED ────────────────────────────────────────────────────

export function SlotHoldExpiredStep({ onChooseTime, onChooseDate }: { onChooseTime: () => void; onChooseDate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Appointment hold expired</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
        Your reserved time slot is no longer held. Please choose a new time to continue.
      </p>
      <div className="w-full space-y-3">
        <button onClick={onChooseTime} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Choose another time</button>
        <button onClick={onChooseDate} className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Choose another date</button>
      </div>
    </div>
  )
}

// ─── 17. FULLY BOOKED DAY ─────────────────────────────────────────────────────

export function FullyBookedStep({ date, onChooseDate, onChooseStaff }: { date?: string; onChooseDate: () => void; onChooseStaff: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Fully booked on this day</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
        There are no appointment slots left on {date ? formatDateLong(date) : "this day"}. Try another date or check other staff members.
      </p>
      <div className="w-full space-y-3">
        <button onClick={onChooseDate}  className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Choose another date</button>
        <button onClick={onChooseStaff} className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Choose another staff member</button>
      </div>
    </div>
  )
}

// ─── 18. STAFF UNAVAILABLE ────────────────────────────────────────────────────

export function StaffUnavailableStep({ staffName, onChooseStaff, onChooseDate }: { staffName?: string; onChooseStaff: () => void; onChooseDate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">{staffName ?? "This barber"} is not available</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
        {staffName ? `${staffName} has` : "This staff member has"} no available slots on the selected date.
      </p>
      <div className="w-full space-y-3">
        <button onClick={onChooseStaff} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Choose another staff member</button>
        <button onClick={onChooseDate}  className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Choose another date</button>
      </div>
    </div>
  )
}

// ─── 19. SERVICE UNAVAILABLE ──────────────────────────────────────────────────

export function ServiceUnavailableStep({ onChooseService }: { onChooseService: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Service currently unavailable</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">This service is not available at the moment. Please choose another service.</p>
      <button onClick={onChooseService} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Choose another service</button>
    </div>
  )
}

// ─── 20. SALON BOOKING UNAVAILABLE ───────────────────────────────────────────

export function SalonUnavailableStep({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Online booking unavailable</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-2">Online booking is currently unavailable for this salon.</p>
      <p className="text-[13px] text-gray-400 mb-8">Please try again later or contact the salon directly.</p>
      <div className="w-full space-y-3">
        <button onClick={onRetry} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Try again</button>
        <button className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Contact salon</button>
      </div>
    </div>
  )
}

// ─── 21. SALON CANCELLED ──────────────────────────────────────────────────────

export function SalonCancelledStep({ booking }: { booking: BookingData }) {
  const price = booking.service?.price ?? 150
  const ref   = booking.reference ?? "BYB-20260908-00482"
  const refundValue = booking.lookupRecord?.totalPaid ?? price

  return (
    <div className="flex flex-col items-center bg-white min-h-full">
      <div className="bg-gray-900 w-full px-5 pt-10 pb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-4 anim-pop">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h1 className="text-white font-black text-[22px] tracking-tight">Salon cancelled your appointment</h1>
        <p className="text-white/50 text-[13px] mt-1">We apologise for the inconvenience</p>
      </div>

      <div className="px-4 py-4 space-y-3 w-full">
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <DetailRow label="Service" value={booking.service?.name ?? "—"} />
          <DetailRow label="Date"    value={booking.date ? formatDateLong(booking.date) : "—"} />
          <DetailRow label="Time"    value={booking.time ?? "—"} />
        </div>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-[13px] text-emerald-900">Full refund initiated</p>
            <p className="text-[12px] text-emerald-700 mt-0.5 leading-snug">Your full refund of {formatZAR(refundValue)} has been initiated. Please allow 3–5 business days.</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">Booking Reference</p>
          <p className="text-white font-mono text-[15px] font-black tracking-wider">{ref}</p>
        </div>

        <button className="w-full py-[13px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[14px] hover:border-gray-300 transition-colors">
          Contact BookYourBarber support
        </button>
      </div>
    </div>
  )
}

// ─── 28–30. REFUND STATES ────────────────────────────────────────────────────

export function RefundProcessingStep({ booking }: { booking: BookingData }) {
  return (
    <RefundBanner
      iconSvg={
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      }
      title="Refund processing"
      body="Your refund is being processed. This usually takes 3–5 business days."
      ref={booking.reference ?? "BYB-20260908-00482"}
    />
  )
}

export function RefundCompletedStep({ booking }: { booking: BookingData }) {
  return (
    <RefundBanner
      iconSvg={
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      }
      title="Refund completed"
      body="Your refund has been processed and should reflect on your original payment method."
      ref={booking.reference ?? "BYB-20260908-00482"}
      accent
    />
  )
}

export function RefundFailedStep({ booking }: { booking: BookingData }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Refund could not be completed</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">Please contact BookYourBarber support with your booking reference and we will resolve this for you.</p>
      <div className="w-full bg-gray-900 rounded-2xl p-4 text-left mb-4">
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">Booking Reference</p>
        <p className="text-white font-mono text-[15px] font-black tracking-wider">{booking.reference ?? "BYB-20260908-00482"}</p>
      </div>
      <button className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] shadow-sm">Contact support</button>
    </div>
  )
}

// ─── 31. SESSION EXPIRED ─────────────────────────────────────────────────────

export function SessionExpiredStep({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Your session has expired</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">For your security, your session has timed out. Please start a new booking.</p>
      <button onClick={onRestart} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] shadow-sm">Start booking again</button>
    </div>
  )
}

// ─── 32. RATE LIMITED ─────────────────────────────────────────────────────────

export function RateLimitedStep() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Too many attempts</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">Please wait a moment before trying again. This is to keep bookings fair for everyone.</p>
      <button className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Try again in a moment</button>
    </div>
  )
}

// ─── 33. LOADING STATE ────────────────────────────────────────────────────────

export function LoadingStep() {
  return (
    <div className="flex flex-col bg-white min-h-full px-4 py-5">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-4 w-36 bg-gray-100 rounded-full animate-pulse" />
      </div>
      <div className="space-y-3">
        {[100, 75, 90, 65].map((w, i) => (
          <div key={i} className="p-4 rounded-2xl border-2 border-gray-100">
            <div className="h-4 bg-gray-100 rounded-full animate-pulse mb-2.5" style={{width:`${w}%`}} />
            <div className="h-3 w-1/2 bg-gray-50 rounded-full animate-pulse mb-3" />
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-gray-50 rounded-full animate-pulse" />
              <div className="h-6 w-12 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-auto pt-16">
        {[0,150,300].map(delay => (
          <div key={delay} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay:`${delay}ms`}} />
        ))}
      </div>
    </div>
  )
}

// ─── 34. ERROR STATE ──────────────────────────────────────────────────────────

export function ErrorStep({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">We could not connect to BookYourBarber</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-2">Check your internet connection and try again. Your booking progress has not been lost.</p>
      <p className="text-[12px] text-gray-400 mb-10 font-mono">NETWORK_TIMEOUT · 503</p>
      <div className="w-full space-y-3">
        <button onClick={onRetry} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform">Try again</button>
        <button className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Contact support</button>
      </div>
    </div>
  )
}
