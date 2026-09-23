'use client'

import React, { useState, useEffect, useRef } from "react"
import { formatZAR } from "@/domains/payments/money"
import {
  BookingData,
} from "./types"
import {
  REMINDER_OPTIONS,
  SALON_NAME, SALON_ADDRESS, SALON_MAPS_URL, SLOT_HOLD_SECONDS
} from "./constants"
import {
  StepHeader, CtaBar, DetailRow,
  formatDateLong, formatDateShort, fmtCard, fmtExpiry, fmtCountdown, downloadIcsCalendar
} from "./shared"

// ─── 6. CUSTOMER INFO ─────────────────────────────────────────────────────────

export function InfoStep({ data, onChange, onBack, onNext }: {
  data: { name?: string; phone?: string; email?: string }
  onChange: (k: "name" | "phone" | "email", v: string) => void
  onBack: () => void; onNext: () => void
}) {
  const valid = (data.name?.trim().length ?? 0) > 1
    && (data.phone?.trim().length ?? 0) >= 9
    && (data.email ?? "").includes("@") && (data.email ?? "").includes(".")

  const inputCls = "w-full px-4 py-[13px] rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-900 outline-none transition-colors text-[14px] bg-white"

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Your details" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <p className="text-[13px] text-gray-500 leading-relaxed pb-1">No account created. Your details are used only for this booking and your reminder.</p>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Full name</label>
          <input type="text" autoComplete="name" value={data.name ?? ""} onChange={e => onChange("name", e.target.value)} placeholder="e.g. Sipho Mthembu" className={inputCls} />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Phone number</label>
          <div className="flex gap-2">
            <div className="flex items-center px-3 py-[13px] rounded-xl border-2 border-gray-200 bg-gray-50 text-[12px] text-gray-700 whitespace-nowrap font-bold flex-shrink-0">
              ZA +27
            </div>
            <input type="tel" inputMode="numeric" autoComplete="tel" value={data.phone ?? ""} onChange={e => onChange("phone", e.target.value.replace(/\D/g,""))} placeholder="82 123 4567" className={`flex-1 ${inputCls}`} />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email address</label>
          <input type="email" autoComplete="email" value={data.email ?? ""} onChange={e => onChange("email", e.target.value)} placeholder="sipho@gmail.com" className={inputCls} />
        </div>

        <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mt-0.5 flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-[12px] text-gray-500 leading-relaxed">We never store your card details or create an account. Your info stays private.</p>
        </div>
      </div>
      <CtaBar label="Continue" onClick={onNext} disabled={!valid} />
    </div>
  )
}

// ─── 7. REMINDER CHANNEL ─────────────────────────────────────────────────────

export function ReminderStep({ selected, onSelect, onBack, onNext }: {
  selected?: string; onSelect: (r: "whatsapp" | "sms" | "email" | "none") => void; onBack: () => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Reminder preference" onBack={onBack} />
      <div className="flex-1 px-4 py-4">
        <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">We send one reminder 24 hours before your appointment. Choose your preferred channel.</p>
        <div className="space-y-2.5">
          {REMINDER_OPTIONS.map(opt => {
            const active = selected === opt.id
            return (
              <button key={opt.id} onClick={() => onSelect(opt.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  active ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-[14px] ${active ? "text-white" : "text-gray-900"}`}>{opt.label}</p>
                    {opt.badge && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wide ${active ? "bg-white/15 text-white" : "bg-emerald-100 text-emerald-700"}`}>{opt.badge}</span>
                    )}
                  </div>
                  <p className={`text-[12px] mt-0.5 ${active ? "text-white/65" : "text-gray-500"}`}>{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${active ? "border-white bg-white" : "border-gray-300"}`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <CtaBar label="Continue" onClick={onNext} disabled={!selected} />
    </div>
  )
}

// ─── 8. BOOKING SUMMARY ───────────────────────────────────────────────────────

export function SummaryStep({ booking, onBack, onNext }: { booking: BookingData; onBack: () => void; onNext: () => void }) {
  const [agreed, setAgreed] = useState(false)
  const staffName    = booking.staff === null ? "Any Available" : booking.staff?.name ?? "—"
  const price        = booking.service?.price ?? 0
  const reminderLabel = REMINDER_OPTIONS.find(r => r.id === booking.reminder)?.label ?? "—"

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Review booking" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-900 px-4 py-3.5">
            <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest">{SALON_NAME}</p>
            <p className="text-white font-bold text-[17px] mt-0.5 tracking-tight">{booking.service?.name}</p>
          </div>
          <DetailRow label="With"     value={staffName} />
          <DetailRow label="Date"     value={booking.date ? formatDateShort(booking.date) : "—"} />
          <DetailRow label="Time"     value={booking.time ?? "—"} />
          <DetailRow label="Duration" value={`${booking.service?.duration ?? 0} minutes`} />
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <DetailRow label="Name"     value={booking.name ?? "—"} />
          <DetailRow label="Phone"    value={`+27 ${booking.phone ?? ""}`} />
          <DetailRow label="Email"    value={booking.email ?? "—"} />
          <DetailRow label="Reminder" value={reminderLabel} />
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <DetailRow label={booking.service?.name ?? "Service"} value={`R${price}`} />
          <div className="flex justify-between items-center px-4 py-4 bg-gray-50">
            <span className="font-bold text-[15px] text-gray-900">Total</span>
            <span className="font-black text-[18px] text-gray-900">R{price}</span>
          </div>
        </div>

        <button onClick={() => setAgreed(a => !a)} className="flex items-start gap-3 text-left w-full py-1">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? "bg-gray-900 border-gray-900" : "border-gray-300"}`}>
            {agreed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            I agree to the <span className="text-gray-900 underline">Terms &amp; Conditions</span> and <span className="text-gray-900 underline">Cancellation Policy</span>. Cancellations more than 24 hours before carry a 10% fee. Under 24 hours: 18% fee.
          </p>
        </button>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
        <button
          onClick={onNext}
          disabled={!agreed}
          className={`w-full py-[15px] rounded-2xl font-bold text-[15px] transition-all duration-150 ${
            agreed ? "bg-gray-900 text-white active:scale-[0.98] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}

// ─── 9. PAYMENT METHOD SELECTION ─────────────────────────────────────────────

export function PaymentMethodStep({ initial, onBack, onContinue }: {
  initial?: "card" | "cash"; onBack: () => void; onContinue: (m: "card" | "cash") => void
}) {
  const [method, setMethod] = useState<"card" | "cash">(initial ?? "card")

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Payment method" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <p className="text-[13px] text-gray-500 mb-2 leading-relaxed">Choose how you would like to pay for your appointment.</p>

        {/* Card option */}
        <button
          onClick={() => setMethod("card")}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
            method === "card" ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === "card" ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-semibold text-[15px] ${method === "card" ? "text-white" : "text-gray-900"}`}>Pay online now</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${method === "card" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>Instant confirmation</span>
            </div>
            <p className={`text-[12px] mt-0.5 ${method === "card" ? "text-white/65" : "text-gray-500"}`}>Debit or credit card · Secured by Paystack</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${method === "card" ? "border-white bg-white" : "border-gray-300"}`}>
            {method === "card" && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
          </div>
        </button>

        {/* Cash option */}
        <button
          onClick={() => setMethod("cash")}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
            method === "cash" ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === "cash" ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-[15px] ${method === "cash" ? "text-white" : "text-gray-900"}`}>Pay at the shop</p>
            <p className={`text-[12px] mt-0.5 ${method === "cash" ? "text-white/65" : "text-gray-500"}`}>Pay with cash or card when you arrive</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${method === "cash" ? "border-white bg-white" : "border-gray-300"}`}>
            {method === "cash" && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
          </div>
        </button>

        {method === "cash" && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">ℹ️</span>
            <div>
              <p className="font-semibold text-[13px] text-amber-900">Your slot will be reserved</p>
              <p className="text-[12px] text-amber-700 mt-0.5 leading-snug">Please arrive on time. Late arrivals or no-shows may forfeit your reserved slot.</p>
            </div>
          </div>
        )}
      </div>
      <CtaBar label="Continue" onClick={() => onContinue(method)} />
    </div>
  )
}

// ─── 10. PAYMENT (CARD ONLY) ─────────────────────────────────────────────────

interface PaymentStepProps {
  booking: BookingData
  onBack: () => void
  onSubmitPayment: (cardDetails: { cardNumber: string; name: string; expiry: string; cvv: string }) => Promise<void>
  onHoldExpired: () => void
}

export function PaymentStep({ booking, onBack, onSubmitPayment, onHoldExpired }: PaymentStepProps) {
  const [card,       setCard]       = useState("")
  const [name,       setName]       = useState("")
  const [expiry,     setExpiry]     = useState("")
  const [cvv,        setCvv]        = useState("")
  const [processing, setProcessing] = useState(false)
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const [secs,       setSecs]       = useState(SLOT_HOLD_SECONDS)

  const onHoldExpiredRef = useRef(onHoldExpired)
  onHoldExpiredRef.current = onHoldExpired

  useEffect(() => {
    const iv = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(iv); onHoldExpiredRef.current(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const price    = booking.service?.price ?? 0
  const cardValid = card.replace(/\s/g,"").length === 16 && name.length > 1 && expiry.length === 5 && cvv.length >= 3

  const holdEnd = new Date(Date.now() + secs * 1000)
  const holdTimeStr = holdEnd.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false })

  async function handlePay() {
    if (!cardValid || processing) return
    setProcessing(true)
    setErrorMsg(null)
    try {
      await onSubmitPayment({
        cardNumber: card.replace(/\s/g, ""),
        name,
        expiry,
        cvv
      })
    } catch (err: any) {
      setErrorMsg(err?.message || "Payment processing failed. Please check your details.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Payment" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Hold banner */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-2 text-amber-800 text-[13px] font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Slot held until <span className="font-bold">{holdTimeStr}</span></span>
          </div>
          <span className="font-mono font-bold text-[14px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg">
            {fmtCountdown(secs)}
          </span>
        </div>

        {/* Order total banner */}
        <div className="p-4 rounded-2xl bg-gray-900 text-white flex justify-between items-center">
          <div>
            <p className="text-[12px] text-white/60">Total to pay</p>
            <p className="text-[20px] font-black tracking-tight">{formatZAR(price)}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-medium">{booking.service?.name}</p>
            <p className="text-[11px] text-white/50">{booking.date ? formatDateShort(booking.date) : ""} · {booking.time}</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Card number</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={card}
              onChange={e => setCard(fmtCard(e.target.value))}
              className="w-full px-4 py-[13px] rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-900 outline-none transition-colors text-[14px] font-mono tracking-wider bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Cardholder name</label>
            <input
              type="text"
              placeholder="Name on card"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-[13px] rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-900 outline-none transition-colors text-[14px] bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Expiry date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={e => setExpiry(fmtExpiry(e.target.value))}
                className="w-full px-4 py-[13px] rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-900 outline-none transition-colors text-[14px] font-mono bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">CVV</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="123"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g,""))}
                className="w-full px-4 py-[13px] rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-900 outline-none transition-colors text-[14px] font-mono bg-white"
              />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700 font-medium">
            {errorMsg}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
        <button
          onClick={handlePay}
          disabled={!cardValid || processing}
          className={`w-full py-[15px] rounded-2xl font-bold text-[15px] transition-all duration-150 ${
            cardValid && !processing ? "bg-gray-900 text-white active:scale-[0.98]" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {processing ? "Authorising..." : `Pay now · R${price}`}
        </button>
      </div>
    </div>
  )
}

// ─── 11. PAYMENT SUCCESSFUL — BOOKING PROCESSING ──────────────────────────────

export function PaymentSuccessProcessingStep({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2000)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="relative mb-7">
        <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-emerald-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <h2 className="text-[20px] font-bold text-gray-900 mb-2 tracking-tight">Payment received</h2>
      <p className="text-[13px] text-gray-500 text-center leading-relaxed">Processing payment securely with payment provider...</p>
      <p className="text-[13px] text-gray-500 text-center leading-relaxed mt-1">Please do not close this page.</p>
    </div>
  )
}

// ─── 12. PAYMENT DUPLICATE PROTECTION ────────────────────────────────────────

export function PaymentDuplicateStep() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Payment already processing</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed">
        Your payment is being processed. Please do not refresh or close this page.
      </p>
      <div className="mt-8 w-full px-4 py-4 bg-gray-50 rounded-2xl">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-gray-700 animate-spin mx-auto" />
      </div>
    </div>
  )
}

// ─── 13. PAYMENT FAILED ───────────────────────────────────────────────────────

export function PaymentFailedStep({
  onRetry,
  onBack,
  errorMessage,
  errorReference,
}: {
  onRetry: () => void
  onBack: () => void
  errorMessage?: string
  errorReference?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Payment declined</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
        {errorMessage || "Your card was declined. Please check your details and try again, or use a different card."}
      </p>
      {errorReference && (
        <p className="text-[12px] text-gray-400 mb-10 font-mono">{errorReference}</p>
      )}
      <div className="w-full space-y-3">
        <button onClick={onRetry} className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">
          Try again
        </button>
        <button onClick={onBack} className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">
          Change payment method
        </button>
      </div>
      <p className="text-[12px] text-gray-400 mt-6">Your slot is held for <span className="font-semibold text-gray-600">8 minutes</span></p>
    </div>
  )
}

// ─── 14. BOOKING CONFIRMED ────────────────────────────────────────────────────

export function ConfirmedStep({
  booking,
  onViewBooking,
  onReschedule,
  onCancel,
}: {
  booking: BookingData
  onViewBooking?: () => void
  onReschedule?: () => void
  onCancel?: () => void
}) {
  const [copied,         setCopied]         = useState(false)
  const [calendarResult, setCalendarResult] = useState<"idle" | "success" | "failed">("idle")

  const ref        = booking.reference ?? "BYB-20260912-00482"
  const staffName  = booking.staff === null ? "Any Available" : booking.staff?.name ?? "—"
  const price      = booking.service?.price ?? 0
  const isCash     = booking.paymentMethod === "cash"

  function copyRef() {
    navigator.clipboard.writeText(ref).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleAddCalendar() {
    const serviceName = booking.service?.name ?? "Barber Service"
    const title = `${serviceName} at ${SALON_NAME}`
    const desc = `Booking Ref: ${ref}\nWith: ${staffName}\nPrice: R${price}`
    const loc = `${SALON_NAME}, ${SALON_ADDRESS}`
    try {
      downloadIcsCalendar(
        title,
        desc,
        loc,
        booking.date ?? "",
        booking.time ?? "09:00",
        booking.service?.duration ?? 45
      )
      setCalendarResult("success")
      setTimeout(() => setCalendarResult("idle"), 4000)
    } catch {
      setCalendarResult("failed")
    }
  }

  return (
    <div className="flex flex-col bg-white min-h-full pb-6">
      <div className="bg-gray-900 px-5 pt-10 pb-8 text-center flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4 anim-pop">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h1 className="text-white font-black text-[24px] tracking-tight">BOOKING CONFIRMED</h1>
        <p className="text-white/50 text-[13px] mt-1.5 font-medium">See you soon at {SALON_NAME}</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Notification failure banner */}
        {booking.notificationFailed && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0 mt-0.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="font-bold text-[13px] text-amber-900">Your booking is confirmed</p>
              <p className="text-[12px] text-amber-700 mt-0.5 leading-snug">
                We could not send your confirmation via {REMINDER_OPTIONS.find(r => r.id === booking.reminder)?.label ?? "your chosen channel"}. Please save your booking reference below.
              </p>
            </div>
          </div>
        )}

        {/* Booking details */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 pt-3.5 pb-2 border-b border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{SALON_NAME}</p>
          </div>
          <DetailRow label="Service"  value={booking.service?.name ?? "—"} />
          <DetailRow label="With"     value={staffName} />
          <DetailRow label="Date"     value={booking.date ? formatDateLong(booking.date) : "—"} />
          <DetailRow label="Time"     value={booking.time ?? "—"} />
          <DetailRow label={isCash ? "Amount due at shop" : "Amount paid"} value={`R${price}`} accent />
        </div>

        {/* Address + directions */}
        <div className="rounded-2xl border border-gray-100 px-4 py-3.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 flex-shrink-0 mt-0.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <p className="font-semibold text-[13px] text-gray-900">{SALON_NAME}</p>
              <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{SALON_ADDRESS}</p>
            </div>
          </div>
          <a
            href={SALON_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold text-gray-900 underline underline-offset-2 whitespace-nowrap flex-shrink-0 mt-1"
          >
            Get directions
          </a>
        </div>

        {/* Cash reminder */}
        {isCash && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700 flex-shrink-0 mt-0.5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
            <div>
              <p className="font-bold text-[13px] text-amber-900">Pay R{price} on arrival</p>
              <p className="text-[12px] text-amber-700 mt-0.5 leading-snug">Bring cash or your card. Arrive 5 minutes early. Late arrival may forfeit your slot.</p>
            </div>
          </div>
        )}

        {/* Reference */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2.5">Booking Reference</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-white font-mono text-[17px] font-black tracking-wider leading-none">{ref}</p>
            <button
              onClick={copyRef}
              className={`text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all flex-shrink-0 ${copied ? "bg-emerald-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"}`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-white/30 text-[11px] mt-2">Keep this reference for cancellations and queries</p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button onClick={handleAddCalendar} className="w-full py-[13px] bg-gray-900 text-white rounded-2xl font-semibold text-[14px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Add to calendar</span>
          </button>
          {calendarResult === "success" && <p className="text-center text-[12px] text-emerald-600 font-medium">Added to your calendar</p>}
          {calendarResult === "failed"  && (
            <p className="text-center text-[12px] text-gray-500">
              Could not add automatically —{" "}
              <button
                onClick={() => {
                  const serviceName = booking.service?.name ?? "Barber Service"
                  downloadIcsCalendar(
                    `${serviceName} at ${SALON_NAME}`,
                    `Booking Ref: ${ref}\nWith: ${staffName}\nPrice: R${price}`,
                    `${SALON_NAME}, ${SALON_ADDRESS}`,
                    booking.date ?? "",
                    booking.time ?? "09:00",
                    booking.service?.duration ?? 45
                  )
                }}
                className="underline cursor-pointer text-gray-700 font-semibold"
              >
                download .ics file
              </button>
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onViewBooking}
              className="py-[13px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[13px] hover:border-gray-300 transition-colors"
            >
              View booking
            </button>
            <button
              onClick={onReschedule}
              className="py-[13px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[13px] hover:border-gray-300 transition-colors"
            >
              Reschedule
            </button>
          </div>
          <button
            onClick={onCancel}
            className="w-full py-3 text-red-500 text-[13px] font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            Cancel booking
          </button>
        </div>

        {booking.email && (
          <p className="text-center text-[12px] text-gray-400 pt-1">
            Confirmation sent to <span className="font-medium text-gray-600">{booking.email}</span>
          </p>
        )}
      </div>
    </div>
  )
}
