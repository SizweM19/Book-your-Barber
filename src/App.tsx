'use client'

import { useState, useEffect, useRef } from "react"
import SalonOps from "./SalonOps"
import { repositories } from "@/infrastructure/repositories/container"
import { availabilityService } from "@/application/services/AvailabilityService"
import { bookingService } from "@/application/services/BookingService"
import { appointmentService } from "@/application/services/AppointmentService"
import { calculateCancellationFee } from "@/domains/appointments/rules"
import type { SalonEntity } from "@/application/repositories/interfaces"

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Step =
  | "salon" | "service" | "staff" | "date" | "time"
  | "info" | "reminder" | "summary"
  | "paymentMethod" | "payment"
  | "paymentSuccessProcessing" | "paymentDuplicate"
  | "paymentFailed" | "confirmed" | "notificationFailure"
  | "unavailable" | "slotHoldExpired"
  | "fullyBooked" | "staffUnavailable" | "serviceUnavailable" | "salonUnavailable"
  | "bookingLookup" | "bookingDetails"
  | "rescheduleSuccess" | "rescheduleFailure"
  | "cancellationReview" | "cancellationConfirmed"
  | "salonCancelled"
  | "refundProcessing" | "refundCompleted" | "refundFailed"
  | "sessionExpired" | "rateLimited"
  | "loading" | "error"

interface Service {
  id: string; name: string; description: string; duration: number; price: number; category: string
}
interface StaffMember {
  id: string; name: string; role: string; photo: string; nextAvailable: string
}
interface BookingData {
  appointmentId?: string
  service?: Service
  staff?: StaffMember | null
  date?: string
  time?: string
  name?: string
  phone?: string
  email?: string
  reminder?: "whatsapp" | "sms" | "email" | "none"
  paymentMethod?: "card" | "cash"
  reference?: string
  notificationFailed?: boolean
  cancellationResult?: {
    feePercent: number
    feeAmount: number
    refundAmount: number
    reference: string
  }
  lookupRecord?: {
    reference: string
    salon: string
    address: string
    service: string
    staff: string
    date: string
    time: string
    duration: string
    paymentStatus: string
    bookingStatus: string
    appointmentId: string
    totalPaid: number
    price: number
  }
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// ─── CONSTANTS & HELPERS ──────────────────────────────────────────────────────

const SALON_NAME = "Fade & Edge Barbershop"
const SALON_ADDRESS = "15 Loader Street, De Waterkant, Cape Town, 8001"
const SALON_MAPS_URL = "https://maps.google.com/?q=15+Loader+Street+De+Waterkant+Cape+Town"
const SALON_PHONE = "011 555 0192"

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

// Replace these with API-driven values in production
const MAX_ADVANCE_DAYS = 60      // how many days ahead customers may book
const CLOSED_DAYS: number[] = [] // day-of-week indices (0=Sun … 6=Sat); empty = open every day

const SLOT_HOLD_SECONDS = 10 * 60 // 10-minute reservation window for online payments

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [
  { id:"s1", name:"Classic Haircut",       description:"Precision cut, style and finish",         duration:45, price:150, category:"Haircuts" },
  { id:"s2", name:"Line-up and Edge",      description:"Sharp lines and clean fades only",         duration:20, price:80,  category:"Haircuts" },
  { id:"s3", name:"Kids Cut (Under 12)",   description:"Gentle cut for the little ones",           duration:30, price:100, category:"Haircuts" },
  { id:"s4", name:"Beard Trim and Shape",  description:"Sculpted edges and hot towel finish",      duration:30, price:120, category:"Beard"    },
  { id:"s5", name:"Hot Towel Shave",       description:"Traditional straight-razor shave",         duration:60, price:200, category:"Shaving"  },
  { id:"s6", name:"Hair and Beard Combo",  description:"Full cut plus beard sculpt",               duration:75, price:250, category:"Combos"   },
]

const STAFF: StaffMember[] = [
  { id:"t1", name:"Themba Ndlovu",  role:"Master Barber",    photo:"photo-1507003211169-0a1dd7228f2d", nextAvailable:"09:00" },
  { id:"t2", name:"Devon Williams", role:"Senior Stylist",   photo:"photo-1472099645785-5658abf4ff4e", nextAvailable:"10:30" },
  { id:"t3", name:"Aisha Jacobs",   role:"Style Specialist", photo:"photo-1494790108377-be9c29b29330", nextAvailable:"11:00" },
  { id:"t4", name:"Ntombi Dlamini", role:"Senior Barber",    photo:"photo-1438761681033-6461ffad8d80", nextAvailable:"14:00" },
]


const MONTHS      = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS_SHORT  = ["Su","Mo","Tu","We","Th","Fr","Sa"]

const REMINDER_OPTIONS = [
  { id:"whatsapp" as const, icon:"💬", label:"WhatsApp",    desc:"Message sent to your WhatsApp number",   badge:"Most popular" },
  { id:"sms"      as const, icon:"📱", label:"SMS",         desc:"Text message reminder to your phone"                          },
  { id:"email"    as const, icon:"📧", label:"Email",       desc:"Reminder delivered to your inbox"                             },
  { id:"none"     as const, icon:"🔕", label:"No reminder", desc:"Booking confirmed, no reminder sent"                          },
]


// ─── UTILITIES ────────────────────────────────────────────────────────────────

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay()      }

function formatDateLong(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
}
function formatDateShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { weekday:"short", day:"numeric", month:"short" })
}

function fmtCard(v: string) {
  return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim()
}
function fmtExpiry(v: string) {
  const n = v.replace(/\D/g,"").slice(0,4)
  return n.length >= 3 ? n.slice(0,2) + "/" + n.slice(2) : n
}
function fmtCountdown(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function StepHeader({ title, onBack }: { title: string; onBack: () => void }) {
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

function CtaBar({ label, onClick, disabled = false, danger = false }: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-[15px] rounded-2xl font-semibold text-[15px] transition-all duration-150 ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : danger  ? "bg-red-600 text-white active:scale-[0.98] shadow-sm"
          :           "bg-gray-900 text-white shadow-sm active:scale-[0.98]"
        }`}
      >
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
              </div>
              <span className="text-[14px] font-semibold text-gray-700">R{s.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-36">
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Cape Town's most trusted barbershop since 2014. Expert cuts, hot towel shaves, and beard sculpting. Walk-ins welcome, appointments preferred.
        </p>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-6 mt-auto space-y-2">
        <button
          onClick={onBook}
          className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-semibold text-[15px] active:scale-[0.98] transition-transform shadow-sm"
        >
          Book an Appointment
        </button>
        <button
          onClick={onLookup}
          className="w-full py-3 text-gray-500 text-[13px] font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Find my booking
        </button>
        <p className="text-center text-[12px] text-gray-400 font-medium">No account needed · Takes 2 minutes</p>
      </div>
    </div>
  )
}

// ─── 2. SERVICE SELECTION ─────────────────────────────────────────────────────

function ServiceStep({ services = SERVICES, selected, onSelect, onBack, onNext }: {
  services?: Service[]; selected?: Service; onSelect: (s: Service) => void; onBack: () => void; onNext: () => void
}) {
  const list = services && services.length > 0 ? services : SERVICES
  const categories = [...new Set(list.map(s => s.category))]
  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Choose a service" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-6 pb-4">
        {categories.map(cat => (
          <div key={cat}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">{cat}</p>
            <div className="space-y-2">
              {list.filter(s => s.category === cat).map(s => {
                const active = selected?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                      active ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className={`font-semibold text-[14px] leading-snug ${active ? "text-white" : "text-gray-900"}`}>{s.name}</p>
                      <p className={`text-[12px] mt-0.5 ${active ? "text-white/65" : "text-gray-500"}`}>{s.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-[15px] ${active ? "text-white" : "text-gray-900"}`}>R{s.price}</p>
                      <p className={`text-[12px] mt-0.5 ${active ? "text-white/55" : "text-gray-400"}`}>{s.duration} min</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <CtaBar label="Continue" onClick={onNext} disabled={!selected} />
    </div>
  )
}

// ─── 3. STAFF SELECTION ──────────────────────────────────────────────────────

function StaffStep({ staffList = STAFF, selected, onSelect, onBack, onNext }: {
  staffList?: StaffMember[]
  selected?: StaffMember | null
  onSelect: (s: StaffMember | null) => void
  onBack: () => void; onNext: () => void
}) {
  const list = staffList && staffList.length > 0 ? staffList : STAFF
  const anySelected  = selected === null
  const hasSelection = selected !== undefined
  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Choose your barber" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
            anySelected ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${anySelected ? "bg-white/10" : "bg-gray-100"}`}>👥</div>
          <div>
            <p className={`font-semibold text-[15px] ${anySelected ? "text-white" : "text-gray-900"}`}>Any Available</p>
            <p className={`text-[12px] mt-0.5 leading-snug ${anySelected ? "text-white/65" : "text-gray-500"}`}>First available barber — you get the next open slot sooner</p>
          </div>
          <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${anySelected ? "border-white bg-white" : "border-gray-300"}`}>
            {anySelected && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {list.map(member => {
            const active = selected?.id === member.id
            const photoSrc = member.photo && member.photo.startsWith("http")
              ? member.photo
              : `https://images.unsplash.com/${member.photo || "photo-1507003211169-0a1dd7228f2d"}?w=120&h=120&fit=crop&crop=face&auto=format`
            return (
              <button
                key={member.id}
                onClick={() => onSelect(member)}
                className={`flex flex-col p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  active ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <img
                  src={photoSrc}
                  alt={member.name}
                  className="w-14 h-14 rounded-full object-cover mb-3 bg-gray-200"
                />
                <p className={`font-semibold text-[13px] leading-snug ${active ? "text-white" : "text-gray-900"}`}>{member.name}</p>
                <p className={`text-[11px] mt-0.5 ${active ? "text-white/65" : "text-gray-500"}`}>{member.role}</p>
                <p className={`text-[11px] mt-2 ${active ? "text-white/55" : "text-gray-400"}`}>Next: {member.nextAvailable}</p>
              </button>
            )
          })}
        </div>
      </div>
      <CtaBar label="Continue" onClick={onNext} disabled={!hasSelection} />
    </div>
  )
}

// ─── 4. DATE SELECTION ────────────────────────────────────────────────────────

function DateStep({ selected, onSelect, onBack, onNext }: {
  selected?: string; onSelect: (d: string) => void; onBack: () => void; onNext: () => void
}) {
  const today = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())

  function prevMonth() { if (vm === 0) { setVm(11); setVy(y => y - 1) } else setVm(m => m - 1) }
  function nextMonth() { if (vm === 11) { setVm(0); setVy(y => y + 1) } else setVm(m => m + 1) }

  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + MAX_ADVANCE_DAYS)

  function isDisabled(day: number) {
    const d = new Date(vy, vm, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < todayStart || d > maxDate || CLOSED_DAYS.includes(d.getDay())
  }

  function ds(day: number) {
    return `${vy}-${String(vm + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`
  const isPrevDisabled = vy === today.getFullYear() && vm === today.getMonth()

  // Prevent navigating past the max month
  const maxMonth = maxDate.getMonth(), maxYear = maxDate.getFullYear()
  const isNextDisabled = vy > maxYear || (vy === maxYear && vm >= maxMonth)

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Choose a date" onBack={onBack} />
      <div className="flex-1 px-4 py-4">
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} disabled={isPrevDisabled}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isPrevDisabled ? "text-gray-200 cursor-not-allowed" : "hover:bg-gray-100 text-gray-600"}`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="font-bold text-[15px] text-gray-900 tracking-tight">{MONTHS[vm]} {vy}</span>
          <button onClick={nextMonth} disabled={isNextDisabled}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isNextDisabled ? "text-gray-200 cursor-not-allowed" : "hover:bg-gray-100 text-gray-600"}`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[11px] font-bold py-1.5 text-gray-400">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array(getFirstDay(vy, vm)).fill(null).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({length: getDaysInMonth(vy, vm)}, (_, i) => i + 1).map(day => {
            const dateStr  = ds(day)
            const disabled = isDisabled(day)
            const isSelected = selected === dateStr
            const isToday    = dateStr === todayStr
            return (
              <button
                key={day}
                onClick={() => !disabled && onSelect(dateStr)}
                disabled={disabled}
                className={`aspect-square flex items-center justify-center text-[14px] font-medium rounded-full mx-0.5 my-0.5 transition-all duration-150 ${
                  isSelected ? "bg-gray-900 text-white font-bold"
                  : disabled  ? "text-gray-200 cursor-not-allowed"
                  : isToday   ? "text-gray-900 underline underline-offset-2 hover:bg-gray-50"
                  :             "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>

        <p className="text-[12px] text-gray-400 text-center mt-4">Unavailable dates are greyed out</p>

        {selected && (
          <div className="mt-4 px-4 py-3 bg-emerald-50 rounded-xl text-center">
            <p className="text-[13px] font-semibold text-emerald-800">{formatDateLong(selected)}</p>
          </div>
        )}
      </div>
      <CtaBar label="Continue" onClick={onNext} disabled={!selected} />
    </div>
  )
}

// ─── 5. TIME SLOTS ────────────────────────────────────────────────────────────

function SlotGroup({ label, slots, selected, onSelect }: {
  label: string; slots: { time: string; available: boolean }[]; selected?: string; onSelect: (t: string) => void
}) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map(s => {
          const active = selected === s.time
          return (
            <button
              key={s.time}
              onClick={() => s.available && onSelect(s.time)}
              disabled={!s.available}
              className={`py-[13px] rounded-xl text-[13px] font-semibold border-2 transition-all duration-150 ${
                active       ? "border-gray-900 bg-gray-900 text-white"
                : !s.available ? "border-gray-100 text-gray-300 line-through cursor-not-allowed bg-gray-50"
                :                "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
              }`}
            >
              {s.time}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimeStep({ slots = [], loading = false, selected, date, onSelect, onBack, onNext }: {
  slots?: { time: string; available: boolean }[]
  loading?: boolean
  selected?: string; date?: string; onSelect: (t: string) => void; onBack: () => void; onNext: () => void
}) {
  const slotList = slots || []
  const morning   = slotList.filter(s => parseInt(s.time) < 12)
  const afternoon = slotList.filter(s => parseInt(s.time) >= 12)
  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Choose a time" onBack={onBack} />
      <div className="flex-1 px-4 py-4">
        {date && <p className="text-[13px] text-gray-500 font-medium mb-5 pb-4 border-b border-gray-50">{formatDateLong(date)}</p>}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
            <p className="text-[13px] text-gray-400">Checking availability...</p>
          </div>
        ) : slotList.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-800">No available times</p>
            <p className="text-[13px] text-gray-500 mt-1">There are no open slots on this date. Please go back and choose another date.</p>
          </div>
        ) : (
          <>
            {morning.length > 0 && <SlotGroup label="Morning"   slots={morning}   selected={selected} onSelect={onSelect} />}
            {afternoon.length > 0 && <SlotGroup label="Afternoon" slots={afternoon} selected={selected} onSelect={onSelect} />}
          </>
        )}
      </div>
      <CtaBar label="Continue" onClick={onNext} disabled={!selected} />
    </div>
  )
}

// ─── 6. CUSTOMER INFO ─────────────────────────────────────────────────────────

function InfoStep({ data, onChange, onBack, onNext }: {
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
            <div className="flex items-center px-3.5 py-[13px] rounded-xl border-2 border-gray-200 bg-gray-50 text-[13px] text-gray-600 whitespace-nowrap font-medium flex-shrink-0">
              🇿🇦 +27
            </div>
            <input type="tel" inputMode="numeric" autoComplete="tel" value={data.phone ?? ""} onChange={e => onChange("phone", e.target.value.replace(/\D/g,""))} placeholder="82 123 4567" className={`flex-1 ${inputCls}`} />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email address</label>
          <input type="email" autoComplete="email" value={data.email ?? ""} onChange={e => onChange("email", e.target.value)} placeholder="sipho@gmail.com" className={inputCls} />
        </div>

        <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
          <span className="text-gray-400 text-lg leading-none mt-0.5 flex-shrink-0">🔒</span>
          <p className="text-[12px] text-gray-500 leading-relaxed">We never store your card details or create an account. Your info stays private.</p>
        </div>
      </div>
      <CtaBar label="Continue" onClick={onNext} disabled={!valid} />
    </div>
  )
}

// ─── 7. REMINDER CHANNEL ─────────────────────────────────────────────────────

function ReminderStep({ selected, onSelect, onBack, onNext }: {
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
                <span className="text-2xl w-9 text-center flex-shrink-0">{opt.icon}</span>
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

function SummaryStep({ booking, onBack, onNext }: { booking: BookingData; onBack: () => void; onNext: () => void }) {
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

function PaymentMethodStep({ initial, onBack, onContinue }: {
  initial?: "card" | "cash"; onBack: () => void; onContinue: (m: "card" | "cash") => void
}) {
  const [method, setMethod] = useState<"card" | "cash">(initial ?? "card")

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Payment method" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <p className="text-[13px] text-gray-500 leading-relaxed">Choose how you would like to pay for your appointment.</p>

        <div className="space-y-3">
          {([
            {
              id: "card" as const,
              icon: "💳",
              label: "Pay online now",
              desc: "Secure card payment. Your booking is confirmed instantly after payment.",
            },
            {
              id: "cash" as const,
              icon: "💵",
              label: "Pay at the barbershop",
              desc: "No payment is required now. You'll pay at the salon when you arrive.",
            },
          ] as const).map(opt => {
            const active = method === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  active ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-[15px] ${active ? "text-white" : "text-gray-900"}`}>{opt.label}</p>
                  <p className={`text-[12px] mt-1 leading-snug ${active ? "text-white/65" : "text-gray-500"}`}>{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${active ? "border-white bg-white" : "border-gray-300"}`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                </div>
              </button>
            )
          })}
        </div>

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

function PaymentStep({ booking, onBack, onSuccess, onFail, onHoldExpired }: {
  booking: BookingData; onBack: () => void
  onSuccess: () => void; onFail: () => void; onHoldExpired: () => void
}) {
  const [card,       setCard]       = useState("")
  const [name,       setName]       = useState("")
  const [expiry,     setExpiry]     = useState("")
  const [cvv,        setCvv]        = useState("")
  const [processing, setProcessing] = useState(false)
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

  // Compute hold end time label (HH:MM)
  const holdEnd = new Date(Date.now() + secs * 1000)
  const holdEndStr = holdEnd.toLocaleTimeString("en-ZA", { hour:"2-digit", minute:"2-digit" })

  function handlePay() {
    if (!cardValid) return
    setProcessing(true)
    setTimeout(() => { setProcessing(false); onSuccess() }, 2800)
  }

  const inputCls = "w-full px-4 py-[13px] rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-900 outline-none transition-colors text-[14px] bg-white"

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-white px-6">
        <div className="relative mb-7">
          <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-gray-900 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl">💳</span></div>
        </div>
        <h2 className="text-[20px] font-bold text-gray-900 mb-2 tracking-tight">Processing payment</h2>
        <p className="text-[13px] text-gray-500 text-center leading-relaxed">Please wait and do not close the app</p>
        <div className="mt-5 px-5 py-3 bg-gray-50 rounded-2xl">
          <p className="text-[17px] font-black text-gray-900">R{price}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Secure payment" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4">

        {/* Slot hold countdown */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
          secs < 120 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
        }`}>
          <div>
            <p className={`text-[12px] font-semibold ${secs < 120 ? "text-red-700" : "text-gray-600"}`}>
              Slot reserved until {holdEndStr}
            </p>
            <p className={`text-[11px] mt-0.5 ${secs < 120 ? "text-red-500" : "text-gray-400"}`}>Complete payment before the hold expires</p>
          </div>
          <div className={`font-mono text-[18px] font-black tabular-nums ${secs < 120 ? "text-red-600" : "text-gray-700"}`}>
            {fmtCountdown(secs)}
          </div>
        </div>

        {/* Card preview */}
        <div className="relative h-44 rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
          style={{background:"linear-gradient(135deg,#111111 0%,#2a2a2a 60%,#1a1a1a 100%)"}}>
          <div className="flex justify-between items-start">
            <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">BookYourBarber</span>
            <div className="flex items-center -space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-red-500 opacity-90" />
              <div className="w-7 h-7 rounded-full bg-yellow-400 opacity-90" />
            </div>
          </div>
          <div>
            <p className="text-white font-mono text-[17px] tracking-[0.15em] mb-3">{card || "••••  ••••  ••••  ••••"}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Name</p>
                <p className="text-white text-[13px] font-medium tracking-wide">{name || "YOUR NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
                <p className="text-white text-[13px] font-medium">{expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Card number</label>
          <input type="tel" inputMode="numeric" value={card} onChange={e => setCard(fmtCard(e.target.value))} placeholder="0000 0000 0000 0000" className={`${inputCls} font-mono tracking-widest`} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Name on card</label>
          <input type="text" autoComplete="cc-name" value={name} onChange={e => setName(e.target.value)} placeholder="As it appears on your card" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Expiry</label>
            <input type="tel" inputMode="numeric" value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/YY" className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">CVV</label>
            <input type="tel" inputMode="numeric" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••" className={`${inputCls} font-mono tracking-widest`} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-1">
          <span className="text-gray-300 text-sm">🔒</span>
          <span className="text-[12px] text-gray-400">Secure payment · 256-bit encryption</span>
        </div>
        <button onClick={onFail} className="w-full text-[12px] text-gray-400 underline text-center pb-1">
          Demo: Simulate payment failure
        </button>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
        <button
          onClick={handlePay}
          disabled={!cardValid}
          className={`w-full py-[15px] rounded-2xl font-bold text-[15px] transition-all duration-150 ${
            cardValid ? "bg-gray-900 text-white active:scale-[0.98] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Pay now · R{price}
        </button>
      </div>
    </div>
  )
}

// ─── 11. PAYMENT SUCCESSFUL — BOOKING PROCESSING ──────────────────────────────

function PaymentSuccessProcessingStep({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2000)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="relative mb-7">
        <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl">✅</span></div>
      </div>
      <h2 className="text-[20px] font-bold text-gray-900 mb-2 tracking-tight">Payment received</h2>
      <p className="text-[13px] text-gray-500 text-center leading-relaxed">We are completing your booking.</p>
      <p className="text-[13px] text-gray-500 text-center leading-relaxed">Please do not close this page.</p>
    </div>
  )
}

// ─── 12. PAYMENT DUPLICATE PROTECTION ────────────────────────────────────────

function PaymentDuplicateStep() {
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

function PaymentFailedStep({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 anim-pop">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Payment declined</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
        Your card was declined. Please check your details and try again, or use a different card.
      </p>
      <p className="text-[12px] text-gray-400 mb-10 font-mono">CARD_DECLINED · TXN-847291</p>
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

function ConfirmedStep({
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
    // Simulate success; in production this calls the calendar API
    setTimeout(() => setCalendarResult("success"), 700)
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
            <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-bold text-[13px] text-amber-900">Your booking is confirmed</p>
              <p className="text-[12px] text-amber-700 mt-0.5 leading-snug">
                We could not send your confirmation via {REMINDER_OPTIONS.find(r => r.id === booking.reminder)?.label ?? "your chosen channel"}. Please save your booking reference below.
              </p>
            </div>
          </div>
        )}

        {/* Booking details */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
            <span className="text-lg flex-shrink-0 mt-0.5">📍</span>
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
            <span className="text-xl flex-shrink-0 mt-0.5">💵</span>
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
          <button onClick={handleAddCalendar} className="w-full py-[13px] bg-gray-900 text-white rounded-2xl font-semibold text-[14px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm">
            <span>📅</span> Add to calendar
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

// ─── 15. SLOT UNAVAILABLE ─────────────────────────────────────────────────────

function UnavailableStep({ onChooseTime, onChooseDate }: { onChooseTime: () => void; onChooseDate: () => void }) {
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

function SlotHoldExpiredStep({ onChooseTime, onChooseDate }: { onChooseTime: () => void; onChooseDate: () => void }) {
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

function FullyBookedStep({ date, onChooseDate, onChooseStaff }: { date?: string; onChooseDate: () => void; onChooseStaff: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          <path d="M9 15h6M12 12v6"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">No appointments available</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
        There are no available times{date ? ` on ${formatDateShort(date)}` : " on this date"}.
      </p>
      <p className="text-[13px] text-gray-400 mb-8">Try a different date or another staff member.</p>
      <div className="w-full space-y-3">
        <button onClick={onChooseDate}  className="w-full py-[15px] bg-gray-900 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform shadow-sm">Choose another date</button>
        <button onClick={onChooseStaff} className="w-full py-[15px] border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-300 transition-colors">Choose another staff member</button>
      </div>
    </div>
  )
}

// ─── 18. STAFF UNAVAILABLE ────────────────────────────────────────────────────

function StaffUnavailableStep({ staffName, onChooseStaff, onChooseDate }: { staffName?: string; onChooseStaff: () => void; onChooseDate: () => void }) {
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

function ServiceUnavailableStep({ onChooseService }: { onChooseService: () => void }) {
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

function SalonUnavailableStep({ onRetry }: { onRetry: () => void }) {
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

// ─── 21. BOOKING LOOKUP ───────────────────────────────────────────────────────

function BookingLookupStep({ onBack, onFind }: {
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

function BookingDetailsStep({
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
  { key:"payment",                  label:"Pay online (card)",        emoji:"💳" },
  { key:"paymentSuccessProcessing", label:"Payment success processing",emoji:"⏳" },
  { key:"paymentDuplicate",         label:"Duplicate payment",        emoji:"🚫" },
  { key:"paymentFailed",            label:"Payment failed",           emoji:"❌" },
  { key:"confirmed",                label:"Booking confirmed",        emoji:"✅" },
  { key:"notificationFailure",      label:"Notification failure",     emoji:"📵" },
  { key:"unavailable",              label:"Slot unavailable",         emoji:"⚠️" },
  { key:"slotHoldExpired",          label:"Hold expired",             emoji:"⌛" },
  { key:"fullyBooked",              label:"Fully booked day",         emoji:"📅" },
  { key:"staffUnavailable",         label:"Staff unavailable",        emoji:"🙅" },
  { key:"serviceUnavailable",       label:"Service unavailable",      emoji:"🚫" },
  { key:"salonUnavailable",         label:"Salon unavailable",        emoji:"🏚️" },
  { key:"bookingLookup",            label:"Find my booking",          emoji:"🔍" },
  { key:"bookingDetails",           label:"Booking details",          emoji:"📄" },
  { key:"rescheduleSuccess",        label:"Reschedule success",       emoji:"📅" },
  { key:"rescheduleFailure",        label:"Reschedule failure",       emoji:"⚠️" },
  { key:"cancellationReview",       label:"Cancellation review",      emoji:"🗑️" },
  { key:"cancellationConfirmed",    label:"Cancellation confirmed",   emoji:"❎" },
  { key:"salonCancelled",           label:"Salon cancelled",          emoji:"🏴" },
  { key:"refundProcessing",         label:"Refund processing",        emoji:"💸" },
  { key:"refundCompleted",          label:"Refund completed",         emoji:"💚" },
  { key:"refundFailed",             label:"Refund failed",            emoji:"🔴" },
  { key:"sessionExpired",           label:"Session expired",          emoji:"🔒" },
  { key:"rateLimited",              label:"Rate limited",             emoji:"🛑" },
  { key:"loading",                  label:"Loading state",            emoji:"⏳" },
  { key:"error",                    label:"Network error",            emoji:"📡" },
]

function DemoNav({ current, onJump }: { current: Step; onJump: (s: Step) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-4 z-50 px-4 py-2 bg-black/75 text-white text-[12px] font-semibold rounded-full backdrop-blur-sm shadow-lg hover:bg-black/90 transition-colors"
      >
        {open ? "✕ Close" : "🗂 States"}
      </button>
      {open && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-56 overflow-y-auto" style={{maxHeight:"65vh"}}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 py-2 border-b border-gray-50">Jump to state ({DEMO_STEPS.length})</p>
          {DEMO_STEPS.map(s => (
            <button
              key={s.key}
              onClick={() => { onJump(s.key); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-colors ${
                current === s.key ? "bg-gray-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{s.emoji}</span>
              <span className="leading-snug">{s.label}</span>
            </button>
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

export function CustomerApp({ salonSlug }: { salonSlug?: string } = {}) {
  const [step,    setStep]    = useState<Step>("salon")
  const [history, setHistory] = useState<Step[]>([])
  const [booking, setBooking] = useState<BookingData>({})

  const [resolvedSalon, setResolvedSalon] = useState<SalonEntity | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [salonLoading, setSalonLoading] = useState<boolean>(true)
  const [salonNotFound, setSalonNotFound] = useState<boolean>(false)

  const [services, setServices] = useState<Service[]>(SERVICES)
  const [staffList, setStaffList] = useState<StaffMember[]>(STAFF)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false)

  // Resolve salon by slug
  useEffect(() => {
    let mounted = true
    setSalonLoading(true)
    setSalonNotFound(false)
    const slugToFind = salonSlug || "fade-and-edge"
    repositories.salons.findBySlug(slugToFind).then(salon => {
      if (!mounted) return
      if (!salon) {
        setSalonNotFound(true)
        setResolvedSalon(null)
        setTenantId(null)
        setStep("salonUnavailable")
      } else {
        setResolvedSalon(salon)
        setTenantId(salon.tenantId)
        setSalonNotFound(false)
      }
    }).catch(() => {
      if (mounted) {
        setSalonNotFound(true)
        setStep("salonUnavailable")
      }
    }).finally(() => {
      if (mounted) setSalonLoading(false)
    })
    return () => { mounted = false }
  }, [salonSlug])

  // Load services
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.services.list(tenantId).then(items => {
      if (!mounted || !items.length) return
      setServices(items.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description ?? "",
        duration: s.duration,
        price: s.price,
        category: s.category || "Haircuts"
      })))
    }).catch(() => {})
    return () => { mounted = false }
  }, [tenantId])

  // Load staff based on service eligibility
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    if (!booking.service?.id) {
      repositories.staff.list(tenantId).then(staff => {
        if (!mounted || !staff.length) return
        setStaffList(staff.map(st => ({
          id: st.id,
          name: st.name,
          role: st.role || "Barber",
          photo: st.photoUrl || "photo-1507003211169-0a1dd7228f2d",
          nextAvailable: "09:00"
        })))
      }).catch(() => {})
      return
    }

    repositories.staffServices.listStaffByService(tenantId, booking.service.id).then(async (staffIds) => {
      const allStaff = await repositories.staff.list(tenantId)
      if (!mounted) return
      const filtered = allStaff.filter(st => staffIds.includes(st.id))
      const listToUse = filtered.length > 0 ? filtered : allStaff
      setStaffList(listToUse.map(st => ({
        id: st.id,
        name: st.name,
        role: st.role || "Barber",
        photo: st.photoUrl || "photo-1507003211169-0a1dd7228f2d",
        nextAvailable: "09:00"
      })))
    }).catch(() => {})

    return () => { mounted = false }
  }, [tenantId, booking.service?.id])

  // Compute dynamic availability slots
  useEffect(() => {
    if (!tenantId || !booking.date || !booking.service) {
      return
    }

    let mounted = true
    setSlotsLoading(true)

    const fetchSlots = async () => {
      try {
        if (booking.staff?.id) {
          const slotsList = await availabilityService.getAvailableSlots({
            tenantId,
            serviceId: booking.service!.id,
            date: booking.date!,
            staffId: booking.staff.id
          })
          if (!mounted) return
          setSlots(slotsList.map(s => ({ time: s.time, available: s.available })))
        } else {
          const res = await availabilityService.getAvailableStaffAndSlots({
            tenantId,
            serviceId: booking.service!.id,
            date: booking.date!
          })
          if (!mounted) return
          setSlots(res.slots.map(s => ({ time: s.time, available: s.available })))
        }
      } catch {
        if (mounted) setSlots([])
      } finally {
        if (mounted) setSlotsLoading(false)
      }
    }

    fetchSlots()
    return () => { mounted = false }
  }, [tenantId, booking.date, booking.staff?.id, booking.service?.id])

  function patch(p: Partial<BookingData>) { setBooking(b => ({ ...b, ...p })) }

  const [isRescheduling, setIsRescheduling] = useState<boolean>(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  function prepareBookingDetailsRecord() {
    const isCash = booking.paymentMethod === "cash"
    const price = booking.service?.price ?? 0
    const staffName = booking.staff === null ? "Any Available" : (booking.staff?.name ?? "—")
    const ref = booking.reference ?? "BYB-20260912-00482"
    const lookupRecord = {
      reference: ref,
      salon: SALON_NAME,
      address: SALON_ADDRESS,
      service: booking.service?.name ?? "Barber Service",
      staff: staffName,
      date: booking.date ?? "",
      time: booking.time ?? "",
      duration: booking.service ? `${booking.service.duration} min` : "30 min",
      paymentStatus: isCash ? "Pay at shop" : "Paid",
      bookingStatus: "Confirmed",
      appointmentId: booking.appointmentId ?? "",
      totalPaid: isCash ? 0 : price,
      price: price,
    }
    patch({ lookupRecord })
    return lookupRecord
  }

  function go(next: Step) {
    setHistory(h => [...h, step])
    setStep(next)
    document.getElementById("booking-scroll")?.scrollTo(0, 0)
  }
  function goBack() {
    const prev = history[history.length - 1]
    if (prev) { setHistory(h => h.slice(0,-1)); setStep(prev) }
  }
  function jumpTo(s: Step) { setHistory([]); setStep(s) }
  function restart()        { setHistory([]); setBooking({}); setStep("salon") }
  function restart()        { setHistory([]); setBooking({}); setIsRescheduling(false); setStep("salon") }

  async function handlePaymentSuccess() {
    if (!tenantId) return
    try {
      const result = await bookingService.createBooking({
        tenantId,
        serviceId: booking.service?.id || "s1",
        staffId: booking.staff?.id || "ANY_AVAILABLE",
        date: booking.date || new Date().toISOString().split("T")[0],
        time: booking.time || "09:00",
        customer: {
          name: booking.name || "Customer",
          phone: booking.phone || "0821234567",
          email: booking.email || "customer@example.com"
        }
      })
      patch({
        reference: result.bookingReference,
        appointmentId: result.appointment.id,
        paymentMethod: "card"
      })
      go("paymentSuccessProcessing")
    } catch (err: any) {
      if (err?.message?.includes("no longer available") || err?.message?.includes("conflict")) {
        go("unavailable")
      } else {
        go("paymentSuccessProcessing")
      }
    }
  }

  function renderStep() {
    switch (step) {
      case "salon":
        if (salonLoading && !resolvedSalon && !salonNotFound) {
          return <LoadingStep />
        }
        return (
          <SalonPage
            salon={resolvedSalon}
            services={services}
            onBook={() => go("service")}
            onLookup={() => go("bookingLookup")}
          />
        )
      case "service": return (
        <ServiceStep services={services} selected={booking.service} onSelect={s => patch({ service: s })} onBack={goBack} onNext={() => go("staff")} />
      )
      case "staff": return (
        <StaffStep staffList={staffList} selected={booking.staff} onSelect={s => patch({ staff: s })} onBack={goBack} onNext={() => go("date")} />
      )
      case "date": return (
        <DateStep selected={booking.date} onSelect={d => patch({ date: d })} onBack={goBack} onNext={() => go("time")} />
      )
      case "time": return (
        <TimeStep
          slots={slots}
          loading={slotsLoading}
          selected={booking.time}
          date={booking.date}
          onSelect={t => patch({ time: t })}
          onBack={goBack}
          onNext={async () => {
            if (isRescheduling) {
              const apptId = booking.appointmentId || booking.lookupRecord?.appointmentId
              if (!apptId) {
                setRescheduleError("No active booking found to reschedule.")
                go("rescheduleFailure")
                return
              }
              try {
                const res = await appointmentService.rescheduleAppointment(apptId, booking.date!, booking.time!)
                if (res.error || !res.appointment) {
                  setRescheduleError(res.error || "That slot is no longer available.")
                  go("rescheduleFailure")
                } else {
                  patch({
                    date: booking.date,
                    time: booking.time,
                    appointmentId: res.appointment.id,
                    reference: res.appointment.bookingReference,
                    lookupRecord: booking.lookupRecord ? {
                      ...booking.lookupRecord,
                      date: booking.date!,
                      time: booking.time!,
                      reference: res.appointment.bookingReference,
                    } : undefined,
                  })
                  setIsRescheduling(false)
                  go("rescheduleSuccess")
                }
              } catch (err: any) {
                setRescheduleError(err?.message || "Failed to reschedule appointment.")
                go("rescheduleFailure")
              }
              return
            }
            go("info")
          }}
        />
      )
      case "info": return (
        <InfoStep
          data={{ name: booking.name, phone: booking.phone, email: booking.email }}
          onChange={(k, v) => patch({ [k]: v })}
          onBack={goBack}
          onNext={() => go("reminder")}
        />
      )
      case "reminder": return (
        <ReminderStep selected={booking.reminder} onSelect={r => patch({ reminder: r })} onBack={goBack} onNext={() => go("summary")} />
      )
      case "summary": return (
        <SummaryStep booking={booking} onBack={goBack} onNext={() => go("paymentMethod")} />
      )
      case "paymentMethod": return (
        <PaymentMethodStep
          initial={booking.paymentMethod}
          onBack={goBack}
          onContinue={async (m) => {
            patch({ paymentMethod: m })
            if (m === "cash") {
              if (!tenantId) return
              try {
                const result = await bookingService.createBooking({
                  tenantId,
                  serviceId: booking.service?.id || "s1",
                  staffId: booking.staff?.id || "ANY_AVAILABLE",
                  date: booking.date || new Date().toISOString().split("T")[0],
                  time: booking.time || "09:00",
                  customer: {
                    name: booking.name || "Customer",
                    phone: booking.phone || "0821234567",
                    email: booking.email || "customer@example.com"
                  }
                })
                patch({
                  paymentMethod: "cash",
                  reference: result.bookingReference,
                  appointmentId: result.appointment.id
                })
                go("confirmed")
              } catch (err: any) {
                if (err?.message?.includes("no longer available") || err?.message?.includes("conflict")) {
                  go("unavailable")
                } else {
                  go("confirmed")
                }
              }
            } else {
              go("payment")
            }
          }}
        />
      )
      case "payment": return (
        <PaymentStep
          booking={booking}
          onBack={goBack}
          onSuccess={handlePaymentSuccess}
          onFail={() => go("paymentFailed")}
          onHoldExpired={() => go("slotHoldExpired")}
        />
      )
      case "paymentSuccessProcessing": return (
        <PaymentSuccessProcessingStep onComplete={() => go("confirmed")} />
      )
      case "paymentDuplicate": return <PaymentDuplicateStep />
      case "paymentFailed":    return (
        <PaymentFailedStep onRetry={() => go("payment")} onBack={() => go("paymentMethod")} />
      )
      case "confirmed": return (
        <ConfirmedStep
          booking={booking}
          onViewBooking={() => {
            prepareBookingDetailsRecord()
            go("bookingDetails")
          }}
          onReschedule={() => {
            prepareBookingDetailsRecord()
            setIsRescheduling(true)
            setRescheduleError(null)
            go("date")
          }}
          onCancel={() => {
            prepareBookingDetailsRecord()
            go("cancellationReview")
          }}
        />
      )
      case "notificationFailure": return (
        <ConfirmedStep
          booking={{
            ...booking,
            reference:         booking.reference         ?? "BYB-20260908-00482",
            service:           booking.service           ?? SERVICES[0],
            staff:             booking.staff             ?? STAFF[0],
            date:              booking.date              ?? "2026-09-12",
            time:              booking.time              ?? "09:00",
            paymentMethod:     booking.paymentMethod     ?? "card",
            reminder:          booking.reminder          ?? "whatsapp",
            notificationFailed: true,
          }}
          onViewBooking={() => {
            prepareBookingDetailsRecord()
            go("bookingDetails")
          }}
          onReschedule={() => {
            prepareBookingDetailsRecord()
            setIsRescheduling(true)
            setRescheduleError(null)
            go("date")
          }}
          onCancel={() => {
            prepareBookingDetailsRecord()
            go("cancellationReview")
          }}
        />
      )
      case "unavailable":      return <UnavailableStep onChooseTime={() => go("time")} onChooseDate={() => go("date")} />
      case "slotHoldExpired":  return <SlotHoldExpiredStep onChooseTime={() => go("time")} onChooseDate={() => go("date")} />
      case "fullyBooked":      return <FullyBookedStep date={booking.date} onChooseDate={() => go("date")} onChooseStaff={() => go("staff")} />
      case "staffUnavailable": return <StaffUnavailableStep staffName={booking.staff?.name} onChooseStaff={() => go("staff")} onChooseDate={() => go("date")} />
      case "serviceUnavailable": return <ServiceUnavailableStep onChooseService={() => go("service")} />
      case "salonUnavailable": return <SalonUnavailableStep onRetry={() => {
        if (salonSlug) {
          window.location.reload()
        } else {
          go("salon")
        }
      }} />
      case "bookingLookup":    return (
        <BookingLookupStep
          onBack={goBack}
          onFind={(record) => {
            if (record) {
              patch({
                reference: record.reference,
                appointmentId: record.appointmentId,
                lookupRecord: record,
                service: services.find(s => s.name === record.service) || {
                  id: "looked-up",
                  name: record.service,
                  description: "",
                  duration: parseInt(record.duration) || 45,
                  price: record.price,
                  category: "Haircuts"
                }
              })
            }
            go("bookingDetails")
          }}
        />
      )
      case "bookingDetails":   return (
        <BookingDetailsStep
          booking={booking}
          onBack={goBack}
          onCancel={() => go("cancellationReview")}
          onReschedule={() => {
            setIsRescheduling(true)
            setRescheduleError(null)
            go("date")
          }}
        />
      )
      case "rescheduleSuccess": return (
        <RescheduleSuccessStep
          booking={booking}
          onDone={() => {
            prepareBookingDetailsRecord()
            go("bookingDetails")
          }}
        />
      )
      case "rescheduleFailure": return (
        <RescheduleFailureStep
          error={rescheduleError}
          onChooseTime={() => go("time")}
          onChooseDate={() => go("date")}
        />
      )
      case "cancellationReview": return (
        <CancellationReviewStep
          booking={booking}
          onConfirm={async () => {
            const apptId = booking.appointmentId || booking.lookupRecord?.appointmentId
            if (apptId) {
              try {
                const res = await appointmentService.cancelAppointment(apptId, "customer")
                patch({
                  cancellationResult: {
                    feePercent: res.feePercent,
                    feeAmount: res.feeAmount,
                    refundAmount: res.refundAmount,
                    reference: booking.reference || booking.lookupRecord?.reference || "",
                  },
                  lookupRecord: booking.lookupRecord ? {
                    ...booking.lookupRecord,
                    bookingStatus: "Cancelled",
                  } : undefined,
                })
              } catch (e) {
                console.error("Failed to cancel appointment", e)
              }
            }
            go("cancellationConfirmed")
          }}
          onKeep={goBack}
        />
      )
      case "cancellationConfirmed": return (
        <CancellationConfirmedStep
          booking={booking}
          onBackToSalon={restart}
        />
      )
      case "salonCancelled":   return <SalonCancelledStep booking={booking} />
      case "refundProcessing": return <RefundProcessingStep booking={booking} />
      case "refundCompleted":  return <RefundCompletedStep  booking={booking} />
      case "refundFailed":     return <RefundFailedStep     booking={booking} />
      case "sessionExpired":   return <SessionExpiredStep onRestart={restart} />
      case "rateLimited":      return <RateLimitedStep />
      case "loading":          return <LoadingStep />
      case "error":            return <ErrorStep onRetry={() => go("salon")} />
    }
  }

  return (
    <div className="min-h-screen bg-[#DDDDD8] flex items-start justify-center md:py-10">
      <div className="phone-frame w-full md:w-[393px] bg-white flex flex-col md:rounded-[44px] md:overflow-hidden md:shadow-2xl md:border md:border-white/20 relative">
        <ProgressBar step={step} />
        <div id="booking-scroll" className="flex-1 overflow-y-auto overscroll-contain" style={{scrollbarWidth:"none"}}>
          {renderStep()}
        </div>
      </div>
      <DemoNav current={step} onJump={jumpTo} />
    </div>
  )
}
