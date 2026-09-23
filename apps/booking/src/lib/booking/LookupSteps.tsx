'use client'

import React, { useState } from "react"
import { formatZAR } from "@/domains/payments/money"
import { calculateCancellationFee } from "@/domains/appointments/rules"
import { appointmentService } from "@/application/services/AppointmentService"
import { BookingData } from "./types"
import {
  SALON_NAME, SALON_ADDRESS, SALON_MAPS_URL, SALON_PHONE
} from "./constants"
import {
  StepHeader, DetailRow,
  formatDateLong, downloadIcsCalendar
} from "./shared"

// ─── 21. BOOKING LOOKUP ───────────────────────────────────────────────────────

export function BookingLookupStep({ onBack, onFind }: {
  onBack: () => void
  onFind: (record: NonNullable<BookingData["lookupRecord"]>) => void
}) {
  const [ref,     setRef]     = useState("")
  const [contact, setContact] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const valid = ref.trim().length >= 10 && contact.trim().length >= 5

  const inputCls = "w-full px-4 py-[13px] rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-900 outline-none transition-colors text-[14px] bg-white"

  async function handleFind() {
    if (!valid) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const cleanRef = ref.trim().toUpperCase()
      const { booking, error } = await appointmentService.lookupGuestBooking(cleanRef, contact)
      if (error || !booking) {
        setErrorMsg(error || "No booking found with this reference.")
        setLoading(false)
        return
      }

      const lookupRecord = {
        reference: booking.bookingReference,
        salon: booking.salonName,
        address: booking.salonAddress,
        service: booking.serviceName,
        staff: booking.staffName,
        date: booking.appointmentDate,
        time: booking.startTime,
        duration: `${booking.durationMinutes} min`,
        paymentStatus: booking.paymentStatus === "paid" ? `Paid · R${booking.totalCharged}` : "Pay at shop",
        bookingStatus: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
        appointmentId: booking.id,
        totalPaid: booking.totalPaid,
        price: booking.totalCharged,
        contact,
      }

      onFind(lookupRecord)
    } catch {
      setErrorMsg("Failed to find booking. Please check your reference.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Find my booking" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <p className="text-[13px] text-gray-500 leading-relaxed">Enter your booking reference and the phone number or email you used when booking.</p>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Booking reference</label>
          <input
            type="text"
            value={ref}
            onChange={e => setRef(e.target.value.toUpperCase())}
            placeholder="BYB-20260908-00482"
            className={`${inputCls} font-mono tracking-widest`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Phone number or email</label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="082 123 4567 or sipho@gmail.com"
            className={inputCls}
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
          <span className="text-gray-400 text-base flex-shrink-0 mt-0.5">ℹ️</span>
          <p className="text-[12px] text-gray-500 leading-relaxed">No account needed. Your booking reference was sent in your confirmation message.</p>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
        <button
          onClick={handleFind}
          disabled={!valid || loading}
          className={`w-full py-[15px] rounded-2xl font-bold text-[15px] transition-all duration-150 flex items-center justify-center gap-2 ${
            valid && !loading ? "bg-gray-900 text-white active:scale-[0.98] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding…</> : "Find booking"}
        </button>
      </div>
    </div>
  )
}

// ─── 22. BOOKING DETAILS ──────────────────────────────────────────────────────

export function BookingDetailsStep({
  booking,
  onBack,
  onCancel,
  onReschedule,
}: {
  booking: BookingData
  onBack: () => void
  onCancel: () => void
  onReschedule: () => void
}) {
  if (!booking.lookupRecord && !booking.reference) {
    return (
      <div className="flex flex-col min-h-full bg-white">
        <StepHeader title="Booking details" onBack={onBack} />
        <div className="flex-1 px-4 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[16px] font-bold text-gray-900">No booking found</p>
          <p className="text-[13px] text-gray-500 mt-1 mb-6">We could not find an active or verified booking record.</p>
          <button onClick={onBack} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors">Go back</button>
        </div>
      </div>
    )
  }

  const b = booking.lookupRecord || {
    reference: booking.reference || "",
    salon: SALON_NAME,
    address: SALON_ADDRESS,
    service: booking.service?.name || "Service",
    staff: booking.staff === null ? "Any Available" : (booking.staff?.name || "Any Barber"),
    date: booking.date || "",
    time: booking.time || "",
    duration: booking.service ? `${booking.service.duration} min` : "30 min",
    paymentStatus: booking.paymentMethod === "card" ? "Paid" : "Pay at shop",
    bookingStatus: "Confirmed",
    appointmentId: booking.appointmentId || "",
    totalPaid: booking.service?.price || 0,
    price: booking.service?.price || 0,
  }
  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Booking details" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-3 pb-6">
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-900 px-4 py-3.5">
            <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest">{b.salon}</p>
            <p className="text-white font-bold text-[17px] mt-0.5 tracking-tight">{b.service}</p>
          </div>
          <DetailRow label="With"           value={b.staff} />
          <DetailRow label="Date"           value={b.date} />
          <DetailRow label="Time"           value={b.time} />
          <DetailRow label="Duration"       value={b.duration} />
          <DetailRow label="Payment"        value={b.paymentStatus} accent />
          <DetailRow label="Booking status" value={b.bookingStatus} />
        </div>

        <div className="rounded-2xl border border-gray-100 px-4 py-3.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 flex-shrink-0 mt-0.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
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
            className="w-full py-[13px] bg-gray-900 text-white rounded-2xl font-semibold text-[14px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Add to calendar</span>
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

export function RescheduleSuccessStep({ booking, onDone }: { booking: BookingData; onDone?: () => void }) {
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

export function RescheduleFailureStep({
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

export function CancellationReviewStep({
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
          <DetailRow label={serviceName} value={formatZAR(price)} />
          {amountPaid > 0 && (
            <>
              <DetailRow label={`Cancellation fee (${feePct}%)`} value={formatZAR(feeAmount)} />
              <div className="flex justify-between items-center px-4 py-4 bg-gray-50">
                <span className="font-bold text-[15px] text-gray-900">Refund amount</span>
                <span className="font-black text-[18px] text-emerald-600">{formatZAR(refundAmount)}</span>
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

export function CancellationConfirmedStep({
  booking,
  onBackToSalon,
}: {
  booking: BookingData
  onBackToSalon?: () => void
}) {
  const res = booking.cancellationResult
  const isCash =
    (!res?.feeAmount && !res?.refundAmount && res?.paidAmount === 0) ||
    (!res?.feeAmount && !res?.refundAmount && (booking.paymentMethod === "cash" || booking.lookupRecord?.paymentStatus === "Pay at shop"))
  const feePct = res?.feePercent ?? 10
  const feeAmount = res?.feeAmount ?? 0
  const refundAmount = res?.refundAmount ?? 0
  const ref =
    res?.reference ||
    booking.reference ||
    booking.lookupRecord?.reference ||
    "—"
  const serviceName =
    res?.serviceName ||
    booking.service?.name ||
    booking.lookupRecord?.service ||
    "Barber Service"

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
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-gray-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
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
              <DetailRow label="Service" value={serviceName} />
              <DetailRow label={`Cancellation fee (${feePct}%)`} value={formatZAR(feeAmount)} />
              <DetailRow label="Refund amount" value={formatZAR(refundAmount)} accent />
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-[13px] text-emerald-900">Refund processing</p>
                <p className="text-[12px] text-emerald-700 mt-0.5 leading-snug">
                  Please allow 3–5 business days for {formatZAR(refundAmount)} to be returned to your original payment method.
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
