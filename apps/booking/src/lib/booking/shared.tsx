'use client'

import React from "react"
import { formatZAR } from "@/domains/payments/money"
import { Step } from "./types"

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

// Replace these with API-driven values in production
const MAX_ADVANCE_DAYS = 60      // how many days ahead customers may book
const CLOSED_DAYS: number[] = [] // day-of-week indices (0=Sun … 6=Sat); empty = open every day

const SLOT_HOLD_SECONDS = 10 * 60 // 10-minute reservation window for online payments

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [

        {label}
      </button>
    </div>
  )
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className={`text-[13px] font-semibold text-right max-w-[200px] ${accent ? "text-emerald-600" : "text-gray-900"}`}>{value}</span>
    </div>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

const FLOW_STEPS: Step[] = ["salon","service","staff","date","time","info","reminder","summary","paymentMethod","payment","confirmed"]

function ProgressBar({ step }: { step: Step }) {
  const idx = FLOW_STEPS.indexOf(step)
  if (idx < 1) return null
  const pct = Math.round((idx / (FLOW_STEPS.length - 1)) * 100)
  return (
    <div className="h-[3px] bg-gray-100 w-full flex-shrink-0">
      <div className="h-full bg-gray-900 transition-all duration-500 ease-out" style={{width:`${pct}%`}} />
    </div>
  )
}

// ─── 1. SALON LANDING ─────────────────────────────────────────────────────────

function SalonPage({ salon, services = SERVICES, onBook, onLookup }: {
  salon?: SalonEntity | null
  services?: Service[]
  onBook: () => void
  onLookup: () => void
}) {
  const salonName = salon?.name || SALON_NAME
  const salonAddress = salon?.address || SALON_ADDRESS
  const salonHours = salon?.openingHours || "08:00–18:00"
  const serviceList = services && services.length > 0 ? services : SERVICES

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="relative h-64 bg-gray-800 overflow-hidden flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=520&fit=crop&auto=format"
          alt={`${salonName} interior`}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">Open now</span>
          </div>
          <h1 className="text-white text-[22px] font-bold leading-tight tracking-tight">{salonName}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-white/70 text-sm">{salonAddress.split(",")[1]?.trim() || "De Waterkant, Cape Town"}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/70 text-sm">Mon–Sat</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3.5 overflow-x-auto flex-shrink-0">
        {[
          { icon:"🕐", text: salonHours },
          { icon:"📍", text: salonAddress.split(",")[1]?.trim() || "De Waterkant" },
          { icon:"💳", text:"Card & cash" },
        ].map(p => (
          <span key={p.text} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-full text-[13px] text-gray-600 whitespace-nowrap flex-shrink-0 font-medium">
            <span className="text-base">{p.icon}</span>{p.text}
          </span>
        ))}
      </div>

      <div className="px-4 pb-4 flex-shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Popular services</p>
        <div className="divide-y divide-gray-50">
          {serviceList.slice(0,4).map(s => (
            <div key={s.id} className="flex justify-between items-center py-3">
              <div>
                <p className="text-[14px] font-medium text-gray-800">{s.name}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{s.duration} min</p>

          ))}
        </div>
      )}
    </>
  )
}

// ─── ROOT WRAPPER ─────────────────────────────────────────────────────────────

export default function App({ hideSwitcher = false }: { hideSwitcher?: boolean }) {
  const [mode, setMode] = useState<"customer" | "ops">("customer")

  return (
    <>
      {mode === "ops" ? <SalonOps /> : <CustomerApp />}
      {!hideSwitcher && (
        <button
          onClick={() => setMode(m => m === "customer" ? "ops" : "customer")}
          className="fixed bottom-5 left-4 z-50 px-3.5 py-2 bg-black/75 text-white text-[12px] font-semibold rounded-full backdrop-blur-sm shadow-lg hover:bg-black/90 transition-colors flex items-center gap-1.5"
        >
          {mode === "customer" ? "⚙️ Salon view" : "📱 Customer view"}
        </button>
      )}
    </>
  )
}

// ─── CUSTOMER BOOKING APP ─────────────────────────────────────────────────────
