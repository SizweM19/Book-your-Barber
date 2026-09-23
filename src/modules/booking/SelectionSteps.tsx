'use client'

import React, { useState } from "react"
import type { SalonEntity } from "@/application/repositories/interfaces"
import {
  Service, StaffMember,
} from "./types"
import {
  SERVICES, STAFF, MONTHS, DAYS_SHORT,
  SALON_NAME, SALON_ADDRESS,
  MAX_ADVANCE_DAYS, CLOSED_DAYS
} from "./constants"
import {
  StepHeader, CtaBar,
  getDaysInMonth, getFirstDay, formatDateLong
} from "./shared"

// ─── 1. SALON PAGE ────────────────────────────────────────────────────────────

export function SalonPage({ salon, services = SERVICES, onBook, onLookup }: {
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
          {
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            text: salonHours,
          },
          {
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            ),
            text: salonAddress.split(",")[1]?.trim() || "De Waterkant",
          },
          {
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            ),
            text: "Card & cash",
          },
        ].map(p => (
          <span key={p.text} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-[12px] text-gray-700 whitespace-nowrap flex-shrink-0 font-medium">
            <span className="text-gray-500">{p.icon}</span>{p.text}
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

export function ServiceStep({ services = SERVICES, selected, onSelect, onBack, onNext }: {
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

export function StaffStep({ staffList, selected, onSelect, onBack, onNext }: {
  staffList?: StaffMember[]
  selected?: StaffMember | null
  onSelect: (s: StaffMember | null) => void
  onBack: () => void; onNext: () => void
}) {
  const list = staffList !== undefined ? staffList : STAFF
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
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${anySelected ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className={`font-semibold text-[15px] ${anySelected ? "text-white" : "text-gray-900"}`}>Any Available</p>
            <p className={`text-[12px] mt-0.5 leading-snug ${anySelected ? "text-white/65" : "text-gray-500"}`}>First available barber — you get the next open slot sooner</p>
          </div>
          <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${anySelected ? "border-white bg-white" : "border-gray-300"}`}>
            {anySelected && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {list.map(member => {
            const active = selected?.id === member.id
            const photoSrc = member.photo && member.photo.startsWith("http")
              ? member.photo
              : `https://images.unsplash.com/${member.photo || "photo-1507003211169-0a1dd7228f2d"}?w=120&h=120&fit=crop&crop=face&auto=format`
            return (
              <button
                key={member.id}
                onClick={() => onSelect(member)}
                className={`flex items-center sm:flex-col p-3 sm:p-4 rounded-2xl border-2 text-left transition-all duration-150 gap-3 sm:gap-0 ${
                  active ? "border-gray-900 bg-gray-900" : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <img
                  src={photoSrc}
                  alt={member.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover sm:mb-3 bg-gray-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-[13px] sm:text-[14px] leading-snug truncate ${active ? "text-white" : "text-gray-900"}`}>{member.name}</p>
                  <p className={`text-[11px] mt-0.5 truncate ${active ? "text-white/65" : "text-gray-500"}`}>{member.role}</p>
                  <p className={`text-[11px] mt-1 sm:mt-2 ${active ? "text-white/55" : "text-gray-400"}`}>Next: {member.nextAvailable}</p>
                </div>
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

export function DateStep({ selected, onSelect, onBack, onNext }: {
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
      <div className="flex-1 px-2.5 xs:px-4 py-4">
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

        <div className="grid grid-cols-7 gap-0.5 xs:gap-1 mb-1">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[11px] font-bold py-1 text-gray-400">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 xs:gap-1">
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
                className={`aspect-square min-h-[38px] xs:min-h-[42px] flex items-center justify-center text-[13px] xs:text-[14px] font-medium rounded-full transition-all duration-150 ${
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

export function SlotGroup({ label, slots, selected, onSelect }: {
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
              className={`py-2.5 xs:py-3 rounded-xl text-[13px] font-semibold border-2 transition-all duration-150 ${
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

export function TimeStep({ slots = [], loading = false, selected, date, onSelect, onBack, onNext }: {
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
