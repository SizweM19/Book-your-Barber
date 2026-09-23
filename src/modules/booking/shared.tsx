'use client'

import React from "react"
import { Step } from "./types"

export function downloadIcsCalendar(
  title: string,
  description: string,
  location: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 45
) {
  if (!dateStr || !timeStr) return
  const [y, m, d] = dateStr.split("-").map(Number)
  const [hh, mm] = timeStr.split(":").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, hh, mm))
  const end = new Date(start.getTime() + durationMinutes * 60000)

  const pad = (n: number) => (n < 10 ? "0" + n : "" + n)
  const formatIcsDate = (dt: Date) =>
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookYourBarber//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@bookyourbarber.co.za`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location.replace(/\n/g, " ")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `barber-booking-${dateStr}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
export function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay()      }

export function formatDateLong(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
}
export function formatDateShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { weekday:"short", day:"numeric", month:"short" })
}

export function fmtCard(v: string) {
  return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim()
}
export function fmtExpiry(v: string) {
  const n = v.replace(/\D/g,"").slice(0,4)
  return n.length >= 3 ? n.slice(0,2) + "/" + n.slice(2) : n
}
export function fmtCountdown(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

export function StepHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3.5 bg-white sticky top-0 z-10 border-b border-gray-50">
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1 flex-shrink-0">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h2 className="font-semibold text-[15px] text-gray-900 tracking-tight">{title}</h2>
    </div>
  )
}

export function CtaBar({ label, onClick, disabled = false, danger = false }: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <div
      className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 mt-auto safe-area-bottom"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-[15px] rounded-2xl font-semibold text-[15px] transition-all duration-150 ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : danger  ? "bg-red-600 text-white active:scale-[0.98]"
          :           "bg-gray-900 text-white active:scale-[0.98]"
        }`}
      >
        {label}
      </button>
    </div>
  )
}

export function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className={`text-[13px] font-semibold text-right max-w-[200px] ${accent ? "text-emerald-600" : "text-gray-900"}`}>{value}</span>
    </div>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

const FLOW_STEPS: Step[] = ["salon","service","staff","date","time","info","reminder","summary","paymentMethod","payment","confirmed"]

export function ProgressBar({ step }: { step: Step }) {
  const idx = FLOW_STEPS.indexOf(step)
  if (idx < 1) return null
  const pct = Math.round((idx / (FLOW_STEPS.length - 1)) * 100)
  return (
    <div className="h-[3px] bg-gray-100 w-full flex-shrink-0">
      <div className="h-full bg-gray-900 transition-all duration-500 ease-out" style={{width:`${pct}%`}} />
    </div>
  )
}

export function RefundBanner({
  iconSvg,
  title,
  body,
  ref: bookingRef,
  accent = false,
}: {
  iconSvg: React.ReactNode
  title: string
  body: string
  ref: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 anim-pop ${accent ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
        {iconSvg}
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
