import React, { useState, useEffect, useRef } from "react"
import type { OpsView } from "./types"
import { OPS_APPOINTMENTS, OPS_STAFF, DAY_SLOTS, TODAY } from "./data"
import { ApptBadge, PayBadge, PrimaryBtn, EmptyState } from "./shared"
import { repositories } from "@/infrastructure/repositories/container"
import { useTenantContext } from "@/application/tenant"


// Pixel height per 30-minute slot in the staff-column grid
const SLOT_HEIGHT = 56

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

const START_MINUTES = timeToMinutes("08:00")

function minutesToPx(mins: number) {
  return Math.round((mins / 30) * SLOT_HEIGHT)
}

// ─── CURRENT TIME INDICATOR ───────────────────────────────────────────────────

function CurrentTimeBar() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(iv)
  }, [])

  const mins  = now.getHours() * 60 + now.getMinutes()
  const top   = minutesToPx(mins - START_MINUTES)
  const label = now.toLocaleTimeString("en-ZA", { hour:"2-digit", minute:"2-digit" })

  if (top < 0 || top > minutesToPx(10 * 60)) return null // outside working hours

  return (
    <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top }}>
      <span className="text-[10px] font-black text-red-500 bg-white px-1 leading-none ml-1 flex-shrink-0">{label}</span>
      <div className="h-[2px] bg-red-500 flex-1 rounded-full" />
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
    </div>
  )
}

// ─── APPOINTMENT BLOCK (duration-aware) ───────────────────────────────────────

function ApptBlock({
  appt, onClick,
}: {
  appt: typeof OPS_APPOINTMENTS[number]
  onClick: () => void
}) {
  const heightPx = minutesToPx(appt.duration)
  const color =
    appt.status === "completed"  ? "bg-emerald-700" :
    appt.status === "inProgress" ? "bg-amber-500"   :
    appt.status === "cancelled"  ? "bg-gray-300 !text-gray-500" :
    appt.status === "noShow"     ? "bg-red-400"     :
                                   "bg-gray-800"

  return (
    <button
      onClick={onClick}
      className={`absolute inset-x-0.5 rounded-lg px-2 py-1 overflow-hidden text-left text-white hover:opacity-90 transition-opacity ${color}`}
      style={{ height: Math.max(heightPx - 4, 22), top: 2 }}
    >
      <p className="text-[11px] font-bold leading-tight truncate">{appt.customer.split(" ")[0]}</p>
      {heightPx > 34 && <p className="text-[10px] opacity-75 truncate">{appt.service}</p>}
      {appt.paymentMethod === "payAtShop" && heightPx > 46 && (
        <p className="text-[9px] opacity-60 mt-0.5">Pay at shop</p>
      )}
    </button>
  )
}

// ─── CALENDAR DAY ─────────────────────────────────────────────────────────────

interface CalendarDayProps {
  onNav: (v: OpsView) => void
  onAppt: (ref: string) => void
}

export function CalendarDayScreen({ onNav, onAppt }: CalendarDayProps) {
  const { tenantId } = useTenantContext()
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [staffFilter, setStaffFilter] = useState("all")
  const [allAppts, setAllAppts] = useState<typeof OPS_APPOINTMENTS>([])
  const [staffList, setStaffList] = useState(OPS_STAFF)
  const [loading, setLoading] = useState(true)

  function shiftDate(days: number) {
    const d = new Date(selectedDate + "T00:00:00")
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split("T")[0])
  }

  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.staff.list(tenantId).then(items => {
      if (mounted && items.length > 0) {
        setStaffList(items.map(s => ({
          id: s.id,
          name: s.name,
          role: s.role || "Barber",
          photo: s.photoUrl || "photo-1507003211169-0a1dd7228f2d",
          active: s.active ?? true,
          todayRevenue: 0,
          monthRevenue: 0,
          monthAppointments: 0,
          completionRate: 100,
          noShowCount: 0
        })))
      }
    }).catch(() => {})

    repositories.appointments.listByTenant(tenantId).then(async list => {
      if (!mounted) return
      if (list.length === 0) {
        setAllAppts([])
        setLoading(false)
        return
      }
      const mapped = await Promise.all(list.map(async a => {
        const cust = await repositories.customers.findById(a.customerId)
        const svc = await repositories.services.findById(a.serviceId)
        const stf = a.staffId ? await repositories.staff.findById(a.staffId) : null
        return {
          ref: a.bookingReference,
          customer: cust?.name || 'Customer',
          customerId: a.customerId,
          phone: cust?.phone || '',
          email: cust?.email || '',
          service: svc?.name || 'Service',
          serviceId: a.serviceId,
          staff: stf?.name || 'Staff',
          staffId: a.staffId || '',
          date: a.appointmentDate,
          time: a.startTime,
          duration: a.durationMinutes,
          charged: a.totalCharged,
          paid: a.totalPaid,
          paymentMethod: (a.paymentStatus === 'paid' ? 'card' : 'cash') as any,
          status: a.status,
          paymentStatus: a.paymentStatus,
          source: a.bookingSource,
          reminderChannel: a.reminderChannel,
          notifications: [],
          payments: [],
        }
      }))
      if (mounted) {
        setAllAppts(mapped)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setAllAppts([])
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [tenantId])

  const todayAppts = allAppts.filter(a =>
    a.date === selectedDate && (staffFilter === "all" || a.staffId === staffFilter)
  )

  const activeStaff = staffList.filter(s =>
    s.active && (staffFilter === "all" || s.id === staffFilter)
  )

  const gridRef = useRef<HTMLDivElement>(null)

  // Scroll to ~09:00 on mount
  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = minutesToPx(60)
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => shiftDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 className="text-[15px] font-bold text-gray-900">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-ZA", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </h2>
          <button onClick={() => shiftDate(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] text-gray-700 outline-none focus:border-gray-900 bg-white font-medium"
          >
            <option value="all">All staff</option>
            {staffList.filter(s => s.active).map(s => (
              <option key={s.id} value={s.id}>{s.name.split(" ")[0]}</option>
            ))}
          </select>
          <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
            <button className="px-3.5 py-2 text-[12px] font-bold bg-gray-900 text-white">Day</button>
            <button onClick={() => onNav("calendarWeek")} className="px-3.5 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Week</button>
          </div>
          <PrimaryBtn label="New appointment" onClick={() => onNav("createAppt")} icon="+" />
        </div>
      </div>

      {/* Desktop: staff-column grid */}
      <div ref={gridRef} className="hidden md:flex flex-1 overflow-auto">
        {/* Time column */}
        <div className="w-20 flex-shrink-0 border-r border-gray-100 bg-white relative">
          <div className="h-12 border-b border-gray-100 sticky top-0 bg-white z-10" />
          {DAY_SLOTS.map(t => (
            <div key={t} className="flex items-start justify-end pr-3 pt-1 border-b border-gray-50" style={{ height: SLOT_HEIGHT }}>
              <span className="text-[11px] font-medium text-gray-400">{t}</span>
            </div>
          ))}
        </div>

        {/* Staff columns */}
        {activeStaff.map(staff => {
          const staffAppts = todayAppts.filter(a => a.staffId === staff.id)
          return (
            <div key={staff.id} className="flex-1 min-w-[160px] border-r border-gray-50 flex flex-col">
              {/* Staff header */}
              <div className="h-12 border-b border-gray-100 flex items-center gap-2.5 px-3 sticky top-0 bg-white z-10 flex-shrink-0">
                <img
                  src={`https://images.unsplash.com/${staff.photo}?w=48&h=48&fit=crop&crop=face&auto=format`}
                  alt={staff.name}
                  className="w-7 h-7 rounded-full object-cover bg-gray-200 flex-shrink-0"
                />
                <p className="text-[12px] font-bold text-gray-700 truncate">{staff.name.split(" ")[0]}</p>
              </div>

              {/* Time grid — relative container for absolute appt blocks */}
              <div className="relative flex-1">
                <CurrentTimeBar />
                {/* Slot lines */}
                {DAY_SLOTS.map(t => (
                  <div key={t} className="border-b border-gray-50" style={{ height: SLOT_HEIGHT }} />
                ))}
                {/* Appointment blocks */}
                {staffAppts.map(appt => {
                  const offsetPx = minutesToPx(timeToMinutes(appt.time) - START_MINUTES)
                  return (
                    <div key={appt.ref} className="absolute inset-x-0.5" style={{ top: offsetPx, height: minutesToPx(appt.duration) }}>
                      <ApptBlock appt={appt} onClick={() => onAppt(appt.ref)} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: day agenda */}
      <div className="md:hidden flex-1 overflow-auto px-4 py-4">
        {todayAppts.length === 0 ? (
          <EmptyState icon="📅" title="No appointments" body="No bookings for today." cta="New appointment" onCta={() => onNav("createAppt")} />
        ) : (
          <div className="space-y-3">
            {[...todayAppts]
              .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
              .map(a => (
                <button
                  key={a.ref}
                  onClick={() => onAppt(a.ref)}
                  className="w-full flex gap-3 text-left bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="text-right flex-shrink-0 pt-0.5 w-12">
                    <p className="font-mono text-[12px] font-bold text-gray-500">{a.time}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{a.duration}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px] text-gray-900">{a.customer}</p>
                    <p className="text-[12px] text-gray-500">{a.service} · {a.staff.split(" ")[0]}</p>
                    {a.paymentMethod === "payAtShop" && (
                      <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Pay at shop · {a.charged > a.paid ? `R${a.charged - a.paid} outstanding` : "Settled"}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <ApptBadge status={a.status} />
                      <PayBadge  status={a.paymentStatus} />
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CALENDAR WEEK ────────────────────────────────────────────────────────────

const WEEK_DAYS = [
  { label:"Mon", date:"2026-09-07", num:"7"  },
  { label:"Tue", date:"2026-09-08", num:"8"  },
  { label:"Wed", date:"2026-09-09", num:"9"  },
  { label:"Thu", date:"2026-09-10", num:"10" },
  { label:"Fri", date:"2026-09-11", num:"11" },
  { label:"Sat", date:"2026-09-12", num:"12" },
]
function getWeekDays(baseDate: Date) {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))

  const days: { label: string; date: string; num: string }[] = []
  for (let i = 0; i < 6; i++) {
    const cur = new Date(monday)
    cur.setDate(monday.getDate() + i)
    const yyyy = cur.getFullYear()
    const mm = String(cur.getMonth() + 1).padStart(2, "0")
    const dd = String(cur.getDate()).padStart(2, "0")
    const dateStr = `${yyyy}-${mm}-${dd}`
    days.push({
      label: cur.toLocaleDateString("en-US", { weekday: "short" }),
      date: dateStr,
      num: String(cur.getDate()),
    })
  }
  return { monday, days }
}

interface CalendarWeekProps {
  onNav: (v: OpsView) => void
  onAppt: (ref: string) => void
}

export function CalendarWeekScreen({ onNav, onAppt }: CalendarWeekProps) {
  const { tenantId } = useTenantContext()
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const { monday, days: weekDays } = getWeekDays(currentDate)

  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  const weekTitle = `${monday.getDate()}–${saturday.getDate()} ${saturday.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}`

  function shiftWeek(weeks: number) {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + weeks * 7)
    setCurrentDate(next)
  }

  const [activeDayMobile, setActiveDayMobile] = useState(() => new Date().toISOString().split("T")[0])
  const [allAppts, setAllAppts] = useState<typeof OPS_APPOINTMENTS>([])
  const [loading, setLoading] = useState(true)

  const gridRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = minutesToPx(60)
  }, [])

  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.appointments.listByTenant(tenantId).then(async list => {
      if (!mounted) return
      if (list.length === 0) {
        setAllAppts([])
        setLoading(false)
        return
      }
      const mapped = await Promise.all(list.map(async a => {
        const cust = await repositories.customers.findById(a.customerId)
        const svc = await repositories.services.findById(a.serviceId)
        const stf = a.staffId ? await repositories.staff.findById(a.staffId) : null
        return {
          ref: a.bookingReference,
          customer: cust?.name || 'Customer',
          customerId: a.customerId,
          phone: cust?.phone || '',
          email: cust?.email || '',
          service: svc?.name || 'Service',
          serviceId: a.serviceId,
          staff: stf?.name || 'Staff',
          staffId: a.staffId || '',
          date: a.appointmentDate,
          time: a.startTime,
          duration: a.durationMinutes,
          charged: a.totalCharged,
          paid: a.totalPaid,
          paymentMethod: (a.paymentStatus === 'paid' ? 'card' : 'cash') as any,
          status: a.status,
          paymentStatus: a.paymentStatus,
          source: a.bookingSource,
          reminderChannel: a.reminderChannel,
          notifications: [],
          payments: [],
        }
      }))
      if (mounted) {
        setAllAppts(mapped)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setAllAppts([])
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [tenantId])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <button onClick={() => shiftWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 className="text-[15px] font-bold text-gray-900">7–12 September 2026</h2>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900">{weekTitle}</h2>
          <button onClick={() => shiftWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => onNav("calendarDay")} className="px-3.5 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50">Day</button>
            <button className="px-3.5 py-2 text-[12px] font-bold bg-gray-900 text-white">Week</button>
          </div>
          <PrimaryBtn label="New appointment" onClick={() => onNav("createAppt")} icon="+" />
        </div>
      </div>

      {/* Desktop week grid */}
      <div ref={gridRef} className="hidden md:flex flex-1 overflow-auto">
        {/* Time column */}
        <div className="w-20 flex-shrink-0 border-r border-gray-100 bg-white">
          <div className="h-14 border-b border-gray-100 sticky top-0 bg-white z-10" />
          {DAY_SLOTS.filter((_, i) => i % 2 === 0).map(t => (
            <div key={t} className="flex items-start justify-end pr-3 pt-1 border-b border-gray-50" style={{ height: SLOT_HEIGHT * 2 }}>
              <span className="text-[11px] font-medium text-gray-400">{t}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {WEEK_DAYS.map(day => {
        {weekDays.map(day => {
          const dayAppts = allAppts.filter(a => a.date === day.date)
          const isToday  = day.date === (new Date().toISOString().split("T")[0])
          return (
            <div key={day.date} className="flex-1 min-w-[120px] border-r border-gray-50 flex flex-col">
              <div className={`h-14 border-b border-gray-100 flex flex-col items-center justify-center sticky top-0 z-10 ${isToday ? "bg-gray-900 text-white" : "bg-white"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-white/60" : "text-gray-400"}`}>{day.label}</p>
                <p className={`text-[18px] font-black ${isToday ? "text-white" : "text-gray-900"}`}>{day.num}</p>
              </div>
              <div className="relative flex-1">
                {isToday && <CurrentTimeBar />}
                {DAY_SLOTS.filter((_, i) => i % 2 === 0).map(t => (
                  <div key={t} className="border-b border-gray-50" style={{ height: SLOT_HEIGHT * 2 }} />
                ))}
                {dayAppts.map(appt => {
                  const offsetPx = minutesToPx(timeToMinutes(appt.time) - START_MINUTES)
                  return (
                    <div key={appt.ref} className="absolute inset-x-0.5" style={{ top: offsetPx, height: Math.max(minutesToPx(appt.duration) - 2, 22) }}>
                      <ApptBlock appt={appt} onClick={() => onAppt(appt.ref)} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: horizontal date tabs + agenda */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100 bg-white flex-shrink-0">
          {WEEK_DAYS.map(day => {
          {weekDays.map(day => {
            const isActive = activeDayMobile === day.date
            return (
              <button key={day.date} onClick={() => setActiveDayMobile(day.date)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 border-b-2 transition-colors ${isActive ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest">{day.label}</span>
                <span className={`text-[18px] font-black mt-0.5 ${day.date === (new Date().toISOString().split("T")[0]) ? "text-gray-900" : ""}`}>{day.num}</span>
              </button>
            )
          })}
        </div>
        <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
          {allAppts.filter(a => a.date === activeDayMobile)
            .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
            .map(a => (
              <button key={a.ref} onClick={() => onAppt(a.ref)}
                className="w-full flex gap-3 text-left bg-white rounded-xl border border-gray-100 p-4">
                <span className="font-mono text-[12px] text-gray-400 pt-0.5 flex-shrink-0 w-12">{a.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] text-gray-900">{a.customer}</p>
                  <p className="text-[12px] text-gray-500">{a.service}</p>
                </div>
                <ApptBadge status={a.status} />
              </button>
            ))}
          {allAppts.filter(a => a.date === activeDayMobile).length === 0 && (
            <p className="text-center text-[13px] text-gray-400 py-12">No appointments</p>
          )}
        </div>
      </div>
    </div>
  )
}
