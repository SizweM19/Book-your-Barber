'use client'

import React, { useState } from "react"
import { BookingData, Service, SERVICES, STAFF } from "./types"
import { StepHeader, CtaBar, DetailRow, formatDateLong, formatDateShort } from "./shared"

          <DetailRow label="Time"           value={b.time} />
          <DetailRow label="Duration"       value={b.duration} />
          <DetailRow label="Payment"        value={b.paymentStatus} accent />
          <DetailRow label="Booking status" value={b.bookingStatus} />
        </div>

        <div className="rounded-2xl border border-gray-100 px-4 py-3.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">📍</span>
            <div>
              <p className="font-semibold text-[13px] text-gray-900">{b.salon}</p>
              <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{b.address}</p>
            </div>
          </div>
          <a href={SALON_MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-gray-900 underline underline-offset-2 whitespace-nowrap flex-shrink-0 mt-1">Get directions</a>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">Booking Reference</p>
          <p className="text-white font-mono text-[17px] font-black tracking-wider">{b.reference}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              const title = `${b.service} at ${b.salon}`
              const desc = `Booking Ref: ${b.reference}\nWith: ${b.staff}\nStatus: ${b.bookingStatus}`
              downloadIcsCalendar(title, desc, `${b.salon}, ${b.address}`, b.date, b.time, parseInt(b.duration) || 45)
            }}
            className="w-full py-[13px] bg-gray-900 text-white rounded-2xl font-semibold text-[14px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm"
          >
            <span>📅</span> Add to calendar
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onReschedule} className="py-[13px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[13px] hover:border-gray-300 transition-colors">Reschedule</button>
            <a
              href={`tel:${SALON_PHONE}`}
              className="py-[13px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[13px] hover:border-gray-300 transition-colors flex items-center justify-center"
            >
              Contact salon
            </a>
          </div>
          <button onClick={onCancel} className="w-full py-3 text-red-500 text-[13px] font-semibold rounded-xl hover:bg-red-50 transition-colors">Cancel booking</button>
        </div>
      </div>
    </div>
  )
}

// ─── 23. RESCHEDULE SUCCESS ───────────────────────────────────────────────────

function RescheduleSuccessStep({ booking, onDone }: { booking: BookingData; onDone?: () => void }) {
  const serviceName = booking.service?.name ?? booking.lookupRecord?.service ?? "Barber Service"
  const staffName   = booking.staff === null ? "Any Available" : (booking.staff?.name ?? booking.lookupRecord?.staff ?? "Barber")
  const dateStr     = booking.date ? formatDateLong(booking.date) : (booking.lookupRecord?.date ?? "—")
  const timeStr     = booking.time ?? booking.lookupRecord?.time ?? "—"
  const ref         = booking.reference ?? booking.lookupRecord?.reference ?? "—"

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-5 anim-pop">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Booking updated</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-6">Your appointment has been rescheduled. You will receive an updated confirmation.</p>
      <div className="w-full rounded-2xl border border-gray-100 overflow-hidden mb-6 text-left shadow-sm">
        <DetailRow label="Service" value={serviceName} />
        <DetailRow label="With"    value={staffName} />
        <DetailRow label="Date"    value={dateStr} />
        <DetailRow label="Time"    value={timeStr} />
      </div>
      <div className="w-full bg-gray-900 rounded-2xl p-4 text-left mb-6">
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1">Booking Reference</p>
        <p className="text-white font-mono text-[15px] font-black tracking-wider">{ref}</p>
      </div>
      {onDone && (
        <button
          onClick={onDone}
          className="w-full py-[14px] bg-gray-900 text-white rounded-2xl font-bold text-[14px] active:scale-[0.98] transition-transform shadow-sm"
        >
          View updated booking
        </button>
      )}
    </div>
  )
}

// ─── 24. RESCHEDULE FAILURE ───────────────────────────────────────────────────

function RescheduleFailureStep({
  error,
  onChooseTime,
  onChooseDate,
}: {
  error?: string | null
  onChooseTime: () => void
  onChooseDate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center py-8">
      <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">That time is no longer available</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
        {error || "Someone else just booked this slot or the time is invalid."}
      </p>
      <p className="text-[13px] text-emerald-700 font-semibold mb-8">Your original appointment is still confirmed.</p>
      <div className="w-full space-y-3">
        <button onClick={onChooseTime} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Choose another time</button>
        <button onClick={onChooseDate} className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Choose another date</button>
      </div>
    </div>
  )
}

// ─── 25. CANCELLATION REVIEW ──────────────────────────────────────────────────

function CancellationReviewStep({
  booking,
  onConfirm,
  onKeep,
}: {
  booking: BookingData
  onConfirm: () => void
  onKeep: () => void
}) {
  const price = booking.lookupRecord?.price ?? booking.service?.price ?? 150
  const isCash =
    booking.paymentMethod === "cash" ||
    booking.lookupRecord?.paymentStatus === "Pay at shop"
  const amountPaid = isCash ? 0 : (booking.lookupRecord?.totalPaid ?? price)

  const apptDateTime = `${booking.lookupRecord?.date || booking.date || "2026-09-12"}T${booking.lookupRecord?.time || booking.time || "09:00"}:00`
  const feeCalc = calculateCancellationFee(amountPaid, apptDateTime, "customer")

  const feePct = feeCalc.feePercent
  const feeAmount = feeCalc.feeAmount
  const refundAmount = feeCalc.refundAmount
  const refText =
    booking.lookupRecord?.reference ?? booking.reference ?? "—"
  const serviceName =
    booking.lookupRecord?.service ?? booking.service?.name ?? "Barber Service"

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Cancel booking" onBack={onKeep} />
      <div className="flex-1 px-4 py-4 space-y-4">
        {isCash || amountPaid === 0 ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5">
            <p className="font-bold text-[13px] text-amber-900">Are you sure you want to cancel?</p>
            <p className="text-[12px] text-amber-700 mt-0.5 leading-snug">
              This appointment was booked as pay-on-arrival. No cancellation fee applies, and your slot will be released immediately.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3.5">
            <p className="font-bold text-[13px] text-red-900">Are you sure you want to cancel?</p>
            <p className="text-[12px] text-red-700 mt-0.5 leading-snug">
              {feePct === 10
                ? "This cancellation is more than 24 hours before your appointment. A 10% cancellation fee applies."
                : "This cancellation is within 24 hours of your appointment. An 18% cancellation fee applies."}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <DetailRow label="Booking reference" value={refText} />
          <DetailRow label={serviceName} value={`R${price}`} />
          {amountPaid > 0 && (
            <>
              <DetailRow label={`Cancellation fee (${feePct}%)`} value={`R${feeAmount}`} />
              <div className="flex justify-between items-center px-4 py-4 bg-gray-50">
                <span className="font-bold text-[15px] text-gray-900">Refund amount</span>
                <span className="font-black text-[18px] text-emerald-600">R${refundAmount}</span>
              </div>
            </>
          )}
        </div>

        {amountPaid > 0 && (
          <div className="px-4 py-3 bg-gray-50 rounded-xl">
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Estimated refund processing: <span className="font-semibold text-gray-700">3–5 business days</span>. The refund will be returned to your original payment method.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto space-y-2">
        <button onClick={onConfirm} className="w-full py-[15px] rounded-2xl font-bold text-[15px] bg-red-600 text-white active:scale-[0.98] shadow-sm transition-transform">
          Confirm cancellation
        </button>
        <button onClick={onKeep} className="w-full py-[13px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[14px] hover:border-gray-300 transition-colors">
          Keep my booking
        </button>
      </div>
    </div>
  )
}

// ─── 26. CANCELLATION CONFIRMED ───────────────────────────────────────────────

function CancellationConfirmedStep({
  booking,
  onBackToSalon,
}: {
  booking: BookingData
  onBackToSalon?: () => void
}) {
  const res = booking.cancellationResult
  const isCash =
    (!res?.feeAmount && !res?.refundAmount) &&
    (booking.paymentMethod === "cash" || booking.lookupRecord?.paymentStatus === "Pay at shop")
  const feePct = res?.feePercent ?? 10
  const feeAmount = res?.feeAmount ?? 0
  const refundAmount = res?.refundAmount ?? 0
  const ref =
    res?.reference ??
    booking.reference ??
    booking.lookupRecord?.reference ??
    "—"

  return (
    <div className="flex flex-col items-center bg-white min-h-full">
      <div className="bg-gray-900 w-full px-5 pt-10 pb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 anim-pop">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <h1 className="text-white font-black text-[22px] tracking-tight">Booking Cancelled</h1>
        <p className="text-white/50 text-[13px] mt-1">Ref: <span className="font-mono font-semibold">{ref}</span></p>
      </div>

      <div className="px-4 py-4 space-y-3 w-full">
        {isCash ? (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5 flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">ℹ️</span>
            <div>
              <p className="font-bold text-[13px] text-gray-900">Slot Released</p>
              <p className="text-[12px] text-gray-600 mt-0.5 leading-snug">
                Your appointment slot has been made available to other customers. No payment was collected.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <DetailRow label={`Cancellation fee (${feePct}%)`} value={`R${feeAmount}`} />
              <DetailRow label="Refund amount" value={`R${refundAmount}`} accent />
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">💚</span>
              <div>
                <p className="font-bold text-[13px] text-emerald-900">Refund processing</p>
                <p className="text-[12px] text-emerald-700 mt-0.5 leading-snug">
                  Please allow 3–5 business days for R{refundAmount} to reflect on your original payment method.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">Booking Reference</p>
          <p className="text-white font-mono text-[15px] font-black tracking-wider">{ref}</p>
        </div>

        {onBackToSalon && (
          <button
            onClick={onBackToSalon}
            className="w-full py-[14px] bg-gray-900 text-white rounded-2xl font-bold text-[14px] active:scale-[0.98] transition-transform shadow-sm"
          >
            Return to salon
          </button>
        )}
      </div>
    </div>
  )
}

// ─── 27. SALON CANCELLED ─────────────────────────────────────────────────────

function SalonCancelledStep({ booking }: { booking: BookingData }) {
  const price = booking.service?.price ?? 150
  const ref   = booking.reference ?? "BYB-20260908-00482"

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
          <span className="text-xl flex-shrink-0 mt-0.5">💚</span>
          <div>
            <p className="font-bold text-[13px] text-emerald-900">Full refund initiated</p>
            <p className="text-[12px] text-emerald-700 mt-0.5 leading-snug">Your full refund of R{price} has been initiated. Please allow 3–5 business days.</p>
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

function RefundBanner({ icon, title, body, ref: bookingRef, accent = false }: {
  icon: string; title: string; body: string; ref: string; accent?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 anim-pop text-3xl ${accent ? "bg-emerald-50" : "bg-gray-50"}`}>
        {icon}
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">{title}</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-8">{body}</p>
      <div className="w-full bg-gray-900 rounded-2xl p-4 text-left">
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">Booking Reference</p>
        <p className="text-white font-mono text-[15px] font-black tracking-wider">{bookingRef}</p>
      </div>
    </div>
  )
}

function RefundProcessingStep({ booking }: { booking: BookingData }) {
  return <RefundBanner icon="⏳" title="Refund processing" body="Your refund is being processed. This usually takes 3–5 business days." ref={booking.reference ?? "BYB-20260908-00482"} />
}
function RefundCompletedStep({ booking }: { booking: BookingData }) {
  return <RefundBanner icon="✅" title="Refund completed" body="Your refund has been processed and should reflect on your original payment method." ref={booking.reference ?? "BYB-20260908-00482"} accent />
}
function RefundFailedStep({ booking }: { booking: BookingData }) {
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

function SessionExpiredStep({ onRestart }: { onRestart: () => void }) {
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

function RateLimitedStep() {
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

function LoadingStep() {
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

function ErrorStep({ onRetry }: { onRetry: () => void }) {
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
        <button onClick={onRetry} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Try again</button>
        <button className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Contact support</button>
      </div>
    </div>
  )
}

// ─── DEMO NAV ─────────────────────────────────────────────────────────────────

const DEMO_STEPS: { key: Step; label: string; emoji: string }[] = [
  { key:"salon",                    label:"Salon landing",            emoji:"🏪" },
  { key:"service",                  label:"Service selection",        emoji:"✂️" },
  { key:"staff",                    label:"Staff selection",          emoji:"👤" },
  { key:"date",                     label:"Date selection",           emoji:"📆" },
  { key:"time",                     label:"Time slots",               emoji:"🕐" },
  { key:"info",                     label:"Customer info",            emoji:"📝" },
  { key:"reminder",                 label:"Reminder channel",         emoji:"🔔" },
  { key:"summary",                  label:"Booking summary",          emoji:"📋" },
  { key:"paymentMethod",            label:"Payment method",           emoji:"💰" },
