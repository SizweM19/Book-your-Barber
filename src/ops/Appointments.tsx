import React, { useState, useEffect } from "react"
import type { OpsView, PaymentMethod } from "./types"
import { OPS_APPOINTMENTS, OPS_STAFF, OPS_SERVICES, OPS_CUSTOMERS, TODAY } from "./data"
import {
  fmtR, Card, SectionTitle, OpsDetailRow, ApptBadge, PayBadge, SourceBadge,
  NotifStatusIcon, channelLabel, SearchBar, PrimaryBtn, SecondaryBtn, DangerBtn,
  BackBtn, EmptyState,
} from "./shared"
import { repositories } from "@/infrastructure/repositories/container"
import { bookingService } from "@/application/services/BookingService"
import { appointmentService } from "@/application/services/AppointmentService"
import { availabilityService } from "@/application/services/AvailabilityService"
import { useTenantContext } from "@/application/tenant"

export function getNextNDates(days: number = 14): { dateStr: string; label: string }[] {
  const dates: { dateStr: string; label: string }[] = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const dateStr = `${yyyy}-${mm}-${dd}`
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })
    dates.push({ dateStr, label })
  }
  return dates
}

// ─── APPOINTMENT LIST ─────────────────────────────────────────────────────────

type ListTab = "today" | "upcoming" | "past" | "cancelled" | "noShow"

export function AppointmentListScreen({ onNav, onAppt }: { onNav: (v: OpsView) => void; onAppt: (ref: string) => void }) {
  const { tenantId } = useTenantContext()
  const [tab, setTab]         = useState<ListTab>("today")
  const [search, setSearch]   = useState("")
  const [staffFilter, setStaffFilter] = useState("all")
  const [dbAppts, setDbAppts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    repositories.appointments.listByTenant(tenantId).then(async appts => {
      if (!mounted) return
      if (appts.length === 0) {
        setDbAppts([])
        setLoading(false)
        return
      }
      const mapped = await Promise.all(appts.map(async a => {
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
        setDbAppts(mapped)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setDbAppts([])
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [tenantId])

  const tabs: { key: ListTab; label: string }[] = [
    { key:"today",     label:"Today"     },
    { key:"upcoming",  label:"Upcoming"  },
    { key:"past",      label:"Past"      },
    { key:"cancelled", label:"Cancelled" },
    { key:"noShow",    label:"No-show"   },
  ]

  const todayStr = new Date().toISOString().split("T")[0]

  function filterAppts() {
    let appts = dbAppts
    if (tab === "today")     appts = appts.filter(a => a.date === todayStr && a.status !== "cancelled" && a.status !== "noShow")
    if (tab === "upcoming")  appts = appts.filter(a => a.date > todayStr  && a.status !== "cancelled" && a.status !== "noShow")
    if (tab === "past")      appts = appts.filter(a => a.status === "completed")
    if (tab === "cancelled") appts = appts.filter(a => a.status === "cancelled")
    if (tab === "noShow")    appts = appts.filter(a => a.status === "noShow")
    if (staffFilter !== "all") appts = appts.filter(a => a.staffId === staffFilter)
    if (search) appts = appts.filter(a =>
      a.customer.toLowerCase().includes(search.toLowerCase()) ||
      a.ref.toLowerCase().includes(search.toLowerCase()) ||
      a.service.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search)
    )
    return appts
  }

  const appts = filterAppts()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Appointments</SectionTitle>
        <PrimaryBtn label="New appointment" onClick={() => onNav("createAppt")} icon="+" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchBar placeholder="Name, reference, phone…" value={search} onChange={setSearch} />
        </div>
        <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)}
          className="px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] text-gray-700 outline-none focus:border-gray-900 bg-white font-medium">
          <option value="all">All staff</option>
          {OPS_STAFF.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name.split(" ")[0]}</option>)}
        </select>
      </div>

      <Card>
        {appts.length === 0 ? (
          <EmptyState icon="📋" title="No appointments" body="No appointments match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Reference","Customer","Service","Staff","Date / Time","Source","Payment","Status"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appts.map(a => (
                  <tr key={a.ref} onClick={() => onAppt(a.ref)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-4 font-mono text-[12px] text-gray-500 whitespace-nowrap">{a.ref}</td>
                    <td className="px-5 py-4 font-semibold text-[14px] text-gray-900 whitespace-nowrap">{a.customer}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap">{a.service}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600">{a.staff.split(" ")[0]}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap">
                      <span className="font-medium">{a.date === todayStr ? "Today" : a.date} </span>
                      <span className="font-mono text-gray-400">{a.time}</span>
                    </td>
                    <td className="px-5 py-4"><SourceBadge source={a.source} /></td>
                    <td className="px-5 py-4"><PayBadge status={a.paymentStatus} /></td>
                    <td className="px-5 py-4"><ApptBadge status={a.status} /></td>
                    <td className="px-5 py-4">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── APPOINTMENT DETAIL ───────────────────────────────────────────────────────

export function AppointmentDetailScreen({ apptRef, onBack, onNav }: {
  apptRef: string; onBack: () => void; onNav: (v: OpsView) => void
}) {
  const [appt, setAppt] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    repositories.appointments.findByReference(apptRef).then(async dbAppt => {
      if (!mounted) return
      if (dbAppt) {
        const cust = await repositories.customers.findById(dbAppt.customerId)
        const svc = await repositories.services.findById(dbAppt.serviceId)
        const stf = dbAppt.staffId ? await repositories.staff.findById(dbAppt.staffId) : null
        setAppt({
          ref: dbAppt.bookingReference,
          id: dbAppt.id,
          customer: cust?.name || 'Customer',
          customerId: dbAppt.customerId,
          phone: cust?.phone || '',
          email: cust?.email || '',
          service: svc?.name || 'Service',
          serviceId: dbAppt.serviceId,
          staff: stf?.name || 'Staff',
          staffId: dbAppt.staffId || '',
          date: dbAppt.appointmentDate,
          time: dbAppt.startTime,
          duration: dbAppt.durationMinutes,
          charged: dbAppt.totalCharged,
          paid: dbAppt.totalPaid,
          paymentMethod: dbAppt.paymentStatus === 'paid' ? 'card' : 'cash',
          status: dbAppt.status,
          paymentStatus: dbAppt.paymentStatus,
          source: dbAppt.bookingSource,
          reminderChannel: dbAppt.reminderChannel,
          notifications: [],
          payments: [],
        })
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [apptRef])

  if (loading && !appt) {
    return (
      <div className="p-8 text-gray-500 text-center">
        <p className="text-[15px] font-semibold text-gray-600">Loading appointment...</p>
      </div>
    )
  }

  if (!appt) return (
    <div className="p-8 text-gray-500 text-center">
      <p className="text-[17px] font-bold text-gray-900 mb-2">Appointment not found</p>
      <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
    </div>
  )

  const outstanding = appt.charged - appt.paid
  const canComplete = outstanding === 0 && appt.status !== "completed" && appt.status !== "cancelled" && appt.status !== "noShow"
  const isActive    = !["completed","cancelled","noShow"].includes(appt.status)

  const hasFailedNotif = appt.notifications?.some((n: any) => n.status === "failed") ?? false

  const payMethodLabel = ({
    card:"Card (online)", cash:"Cash", yoco:"Yoco", payshap:"PayShap", other:"Other", payAtShop:"Pay at shop"
  } as Record<string, string>)[appt.paymentMethod] ?? appt.paymentMethod

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackBtn onClick={onBack} />

      {/* Failed notification banner */}
      {hasFailedNotif && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 mb-4">
          <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-[13px] text-amber-900">Notification delivery failed</p>
            <p className="text-[12px] text-amber-700 mt-0.5">One or more notifications could not be delivered. See Notifications section below.</p>
          </div>
          <button className="text-[12px] font-semibold text-amber-700 underline underline-offset-2 flex-shrink-0">Retry</button>
        </div>
      )}

      <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Booking reference</p>
          <p className="font-mono text-[20px] font-black text-gray-900 tracking-widest">{appt.ref}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SourceBadge source={appt.source} />
          <ApptBadge   status={appt.status} />
          <PayBadge    status={appt.paymentStatus} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Appointment info */}
          <Card>
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Appointment</p>
            </div>
            <div className="px-5">
              <OpsDetailRow label="Customer"       value={appt.customer} />
              <OpsDetailRow label="Phone"          value={appt.phone} />
              <OpsDetailRow label="Email"          value={appt.email} />
              <OpsDetailRow label="Service"        value={appt.service} />
              <OpsDetailRow label="Staff"          value={appt.staff} />
              <OpsDetailRow label="Date"           value={appt.date} />
              <OpsDetailRow label="Time"           value={`${appt.time} (${appt.duration} min)`} />
              <OpsDetailRow label="Booking source" value={appt.source === "online" ? "Online booking" : appt.source === "qr" ? "QR scan" : "Manual entry"} />
              <OpsDetailRow label="Payment method" value={payMethodLabel} />
              <OpsDetailRow label="Reminder channel" value={channelLabel(appt.reminderChannel)} />
            </div>
          </Card>

          {/* Payment */}
          <Card>
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Payment</p>
            </div>
            <div className="px-5">
              <OpsDetailRow label="Charged"     value={fmtR(appt.charged)} />
              <OpsDetailRow label="Paid"        value={fmtR(appt.paid)} />
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-[14px] font-bold text-gray-900">Outstanding</span>
                <span className={`text-[18px] font-black ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtR(outstanding)}</span>
              </div>
              {appt.payments && appt.payments.length > 0 && (
                <div className="py-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Payment history</p>
                  {appt.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center py-1.5">
                      <div>
                        <span className="text-[12px] font-semibold text-gray-700 capitalize">{p.method}</span>
                        <span className="text-[11px] text-gray-400 ml-2">{p.recordedAt}</span>
                      </div>
                      <span className={`text-[12px] font-bold ${p.status === "successful" ? "text-emerald-600" : "text-red-600"}`}>{fmtR(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Cancellation info */}
          {appt.cancellation && (
            <Card>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Cancellation</p>
              </div>
              <div className="px-5">
                <OpsDetailRow label="Cancelled by"  value={appt.cancellation.cancelledBy === "salon" ? "Salon" : "Customer"} />
                <OpsDetailRow label="Cancelled at"  value={appt.cancellation.cancelledAt} />
                <OpsDetailRow label="Original amount" value={fmtR(appt.charged)} />
                <OpsDetailRow label={`Cancellation fee (${appt.cancellation.feePercent}%)`} value={fmtR(appt.cancellation.feeAmount)} />
                <OpsDetailRow label="Refund amount" value={fmtR(appt.cancellation.refundAmount)} accent="text-emerald-600" />
                <OpsDetailRow label="Refund status" value={({
                  none:"N/A", processing:"Processing (3–5 business days)", completed:"Completed", failed:"Failed — contact support"
                } as Record<string, string>)[appt.cancellation.refundStatus] ?? appt.cancellation.refundStatus} />
              </div>
            </Card>
          )}

          {/* Notifications */}
          <Card>
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Notifications</p>
            </div>
            <div className="px-5 divide-y divide-gray-50">
              {appt.notifications && appt.notifications.map((n: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 capitalize">{n.type}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{channelLabel(n.channel)}{n.sentAt ? ` · ${n.sentAt}` : ""}</p>
                    {n.failReason && <p className="text-[11px] text-red-500 mt-0.5">{n.failReason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <NotifStatusIcon status={n.status} />
                    <span className="text-[11px] font-semibold text-gray-500 capitalize">{n.status}</span>
                    {n.status === "failed" && (
                      <button className="text-[11px] font-bold text-gray-700 underline underline-offset-2 ml-1">Retry</button>
                    )}
                  </div>
                </div>
              ))}
              {appt.notifications.length === 0 && (
                <p className="py-4 text-[13px] text-gray-400">No notifications sent.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-3">
          {isActive && (
            <Card className="p-4 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Actions</p>

              {/* Primary: payment + completion */}
              {outstanding > 0 ? (
                <>
                  <div className="bg-amber-50 rounded-xl px-4 py-3">
                    <p className="text-[12px] font-bold text-amber-900">Payment required before completing</p>
                    <p className="text-[14px] font-black text-amber-700 mt-1">Outstanding: {fmtR(outstanding)}</p>
                  </div>
                  <button
                    onClick={() => onNav("recordPayment")}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl text-[13px] font-bold hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Record payment
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNav("completeAppt")}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[13px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  ✓ Complete appointment
                </button>
              )}

              {/* Secondary actions */}
              <div className="pt-1 border-t border-gray-100 space-y-2">
                <button onClick={() => onNav("reschedule")} className="w-full py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">Reschedule</button>
                <button onClick={() => onNav("noShow")} className="w-full py-2.5 border-2 border-gray-200 text-amber-700 rounded-xl text-[13px] font-semibold hover:bg-amber-50 hover:border-amber-300 transition-colors">Mark as no-show</button>
              </div>

              {/* Destructive */}
              <div className="pt-1 border-t border-gray-100">
                <button onClick={() => onNav("cancelAppt")} className="w-full py-2.5 border-2 border-red-100 text-red-600 rounded-xl text-[13px] font-semibold hover:bg-red-50 hover:border-red-300 transition-colors">Cancel appointment</button>
              </div>
            </Card>
          )}

          {appt.status === "completed" && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <p className="font-bold text-[14px] text-emerald-700">Completed</p>
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed">Customer history, visit count and loyalty points updated.</p>
            </Card>
          )}

          {/* Customer link */}
          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Customer</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700 flex-shrink-0">{appt.customer[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-gray-900 truncate">{appt.customer}</p>
                <p className="text-[12px] text-gray-500">{appt.phone}</p>
              </div>
            </div>
            <button onClick={() => onNav("customerProfile")} className="w-full mt-3 py-2 border-2 border-gray-200 text-gray-700 rounded-xl text-[12px] font-semibold hover:border-gray-400 transition-colors">View customer profile →</button>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── RECORD PAYMENT ───────────────────────────────────────────────────────────

export function RecordPaymentScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const appt = OPS_APPOINTMENTS[3] // demo: Busisiwe, partial paid
  const outstanding = appt.charged - appt.paid
  const [amount, setAmount] = useState(String(outstanding))
export function RecordPaymentScreen({
  apptRef,
  onBack,
  onDone,
}: {
  apptRef?: string
  onBack: () => void
  onDone: () => void
}) {
  const [appt, setAppt] = useState<any>(null)
  const [loading, setLoading] = useState(Boolean(apptRef))
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [done,   setDone]   = useState(false)
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apptRef) {
      setLoading(false)
      return
    }
    let mounted = true
    repositories.appointments.findByReference(apptRef).then(async dbAppt => {
      if (!mounted) return
      if (dbAppt) {
        const cust = await repositories.customers.findById(dbAppt.customerId)
        const svc = await repositories.services.findById(dbAppt.serviceId)
        const rem = dbAppt.totalCharged - dbAppt.totalPaid
        setAppt({
          id: dbAppt.id,
          ref: dbAppt.bookingReference,
          tenantId: dbAppt.tenantId,
          customer: cust?.name || "Customer",
          service: svc?.name || "Service",
          charged: dbAppt.totalCharged,
          paid: dbAppt.totalPaid,
          outstanding: rem,
          paymentStatus: dbAppt.paymentStatus,
        })
        setAmount(String(Math.max(0, rem)))
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [apptRef])

  const methods: { key: PaymentMethod; label: string }[] = [
    { key:"cash",    label:"Cash"    },
    { key:"card",    label:"Card"    },
    { key:"yoco",    label:"Yoco"    },
    { key:"payshap", label:"PayShap" },
    { key:"other",   label:"Other"   },
    { key: "cash",    label: "Cash"    },
    { key: "card",    label: "Card"    },
    { key: "yoco",    label: "Yoco"    },
    { key: "payshap", label: "PayShap" },
    { key: "other",   label: "Other"   },
  ]

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading appointment details...</div>
  }

  if (!appt) {
    return (
      <div className="p-8 text-center">
        <p className="text-[17px] font-bold text-gray-900 mb-2">No appointment selected</p>
        <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
      </div>
    )
  }

  const outstanding = appt.outstanding

  if (done) return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h2 className="text-[20px] font-black text-gray-900 mb-2">Payment recorded</h2>
      <p className="text-[13px] text-gray-500 mb-6">
        {Number(amount) >= outstanding ? "Full amount settled. This appointment is ready to complete." : "Partial payment recorded. Outstanding balance updated."}
      </p>
      <Card className="w-full text-left px-5 mb-6">
        <OpsDetailRow label="Charged"     value={fmtR(appt.charged)} />
        <OpsDetailRow label="Previously paid" value={fmtR(appt.paid)} />
        <OpsDetailRow label="This payment" value={fmtR(Number(amount))} />
        <OpsDetailRow label="Outstanding"  value={fmtR(Math.max(0, outstanding - Number(amount)))} />
      </Card>
      <PrimaryBtn label="Back to appointment" onClick={onDone} />
    </div>
  )

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Record payment</SectionTitle>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700">
          {error}
        </div>
      )}
      <Card className="divide-y divide-gray-50 mb-5 px-5">
        <OpsDetailRow label="Customer" value={appt.customer} />
        <OpsDetailRow label="Service"  value={appt.service} />
        <OpsDetailRow label="Charged"  value={fmtR(appt.charged)} />
        <OpsDetailRow label="Paid"     value={fmtR(appt.paid)} />
        <div className="flex justify-between items-center py-3">
          <span className="font-bold text-[14px] text-gray-900">Outstanding</span>
          <span className={`text-[18px] font-black ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtR(outstanding)}</span>
        </div>
      </Card>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-[16px] font-bold text-gray-900 focus:border-gray-900 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Payment method</label>
          <div className="flex gap-2 flex-wrap">
            {methods.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-colors ${method === m.key ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={async () => {
            if (!amount || Number(amount) <= 0 || !appt?.id) return
            setIsSubmitting(true)
            setError(null)
            try {
              const payAmt = Number(amount)
              const newTotalPaid = (appt.paid || 0) + payAmt
              const newStatus = newTotalPaid >= appt.charged ? "paid" : "partial"
              await repositories.appointments.recordPayment(appt.id, payAmt, newStatus)
              try {
                await repositories.payments.record({
                  tenantId: appt.tenantId,
                  appointmentId: appt.id,
                  amount: payAmt,
                  method: method as any,
                  status: "successful",
                })
              } catch {}
              setDone(true)
            } catch (err: any) {
              setError(err?.message || "Failed to record payment.")
            } finally {
              setIsSubmitting(false)
            }
          }}
          disabled={!amount || Number(amount) <= 0 || isSubmitting}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-[15px] hover:bg-gray-800 transition-colors shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? "Recording..." : `Record ${amount ? fmtR(Number(amount)) : "—"} · ${methods.find(m => m.key === method)?.label}`}
        </button>
      </div>
    </div>
  )
}

// ─── COMPLETE APPOINTMENT ─────────────────────────────────────────────────────

export function CompleteApptScreen({
  apptRef,
  onBack,
  onDone,
  onRecordPayment,
}: {
  apptRef?: string
  onBack: () => void
  onDone: () => void
  onRecordPayment?: () => void
}) {
  const [appt, setAppt] = useState<any>(null)
  const [loading, setLoading] = useState(Boolean(apptRef))
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apptRef) {
      setLoading(false)
      return
    }
    let mounted = true
    repositories.appointments.findByReference(apptRef).then(async dbAppt => {
      if (!mounted) return
      if (dbAppt) {
        const cust = await repositories.customers.findById(dbAppt.customerId)
        const svc = await repositories.services.findById(dbAppt.serviceId)
        const stf = dbAppt.staffId ? await repositories.staff.findById(dbAppt.staffId) : null
        setAppt({
          id: dbAppt.id,
          ref: dbAppt.bookingReference,
          customer: cust?.name || "Customer",
          service: svc?.name || "Service",
          staff: stf?.name || "Staff",
          date: dbAppt.appointmentDate,
          time: dbAppt.startTime,
          charged: dbAppt.totalCharged,
          paid: dbAppt.totalPaid,
          paymentStatus: dbAppt.paymentStatus,
          status: dbAppt.status,
        })
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [apptRef])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading appointment details...</div>
  }

  if (!appt) {
    return (
      <div className="p-8 text-center">
        <p className="text-[17px] font-bold text-gray-900 mb-2">No appointment selected</p>
        <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
      </div>
    )
  }

  const outstanding = appt.charged - appt.paid

  if (done) return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h2 className="text-[22px] font-black text-gray-900 mb-2">Appointment completed</h2>
      <p className="text-[13px] text-gray-500 mb-1">Customer history, visit count and loyalty points updated.</p>
      <p className="text-[13px] text-gray-500 mb-1">Customer history, visit count and appointment status updated.</p>
      <p className="text-[12px] text-gray-400 mb-8">Revenue counted toward today's total.</p>
      <PrimaryBtn label="Back to appointments" onClick={onDone} />
    </div>
  )

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Complete appointment?</SectionTitle>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700">
          {error}
        </div>
      )}
      {outstanding > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 mb-5 border border-amber-100">
          <p className="text-[13px] font-bold text-amber-900 mb-1">Outstanding balance: {fmtR(outstanding)}</p>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            Salon policy requires all appointments to have zero outstanding balance before being marked as completed.
          </p>
        </div>
      )}
      <Card className="p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-700">{appt.customer[0]}</div>
          <div><p className="font-bold text-[14px] text-gray-900">{appt.customer}</p><p className="text-[12px] text-gray-500">{appt.service}</p></div>
        </div>
        <div className="divide-y divide-gray-50">
          <OpsDetailRow label="Staff"   value={appt.staff} />
          <OpsDetailRow label="Date"    value={appt.date} />
          <OpsDetailRow label="Time"    value={appt.time} />
          <OpsDetailRow label="Charged" value={fmtR(appt.charged)} />
          <OpsDetailRow label="Paid"    value={fmtR(appt.paid)} />
          <div className="flex justify-between items-center pt-3">
            <span className="font-bold text-[14px] text-gray-900">Payment</span>
            <PayBadge status={appt.paymentStatus} />
          </div>
        </div>
      </Card>
      <div className="flex gap-3">
        {outstanding > 0 ? (
          <button
            onClick={() => onRecordPayment ? onRecordPayment() : onBack()}
            className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-bold text-[15px] hover:bg-gray-800 transition-colors shadow-sm"
          >
            Record payment first ({fmtR(outstanding)})
          </button>
        ) : (
          <button
            disabled={isSubmitting}
            onClick={async () => {
              if (!appt?.id) return
              setIsSubmitting(true)
              setError(null)
              try {
                const res = await appointmentService.completeAppointment(appt.id)
                if (res.error) {
                  setError(res.error)
                } else {
                  setDone(true)
                }
              } catch (err: any) {
                setError(err?.message || "Failed to complete appointment.")
              } finally {
                setIsSubmitting(false)
              }
            }}
            className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold text-[15px] hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Completing..." : "Complete appointment"}
          </button>
        )}
        <SecondaryBtn label="Cancel" onClick={onBack} />
      </div>
    </div>
  )
}

// ─── CANCEL APPOINTMENT ───────────────────────────────────────────────────────

export function CancelApptScreen({ apptRef, onBack, onDone }: { apptRef?: string; onBack: () => void; onDone: () => void }) {
  const [appt, setAppt] = useState<any>(null)
  const [loading, setLoading] = useState(Boolean(apptRef))
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!apptRef) {
      setLoading(false)
      return
    }
    let mounted = true
    repositories.appointments.findByReference(apptRef).then(async dbAppt => {
      if (!mounted) return
      if (dbAppt) {
        const cust = await repositories.customers.findById(dbAppt.customerId)
        const svc = await repositories.services.findById(dbAppt.serviceId)
        setAppt({
          id: dbAppt.id,
          ref: dbAppt.bookingReference,
          customer: cust?.name || 'Customer',
          service: svc?.name || 'Service',
          date: dbAppt.appointmentDate,
          time: dbAppt.startTime,
          paid: dbAppt.totalPaid,
          paymentMethod: dbAppt.paymentStatus === 'paid' ? 'card' : 'payAtShop'
        })
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [apptRef])

  if (!loading && !appt) {
    return (
      <div className="p-8 text-gray-500 text-center">
        <p className="text-[17px] font-bold text-gray-900 mb-2">Appointment not found</p>
        <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
      </div>
    )
  }

  if (confirmed) return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
        </svg>
      </div>
      <h2 className="text-[20px] font-black text-gray-900 mb-2">Appointment cancelled</h2>
      <p className="text-[13px] text-gray-500 mb-1">{appt.customer} has been notified.</p>
      {appt.paymentMethod !== "payAtShop" && appt.paid > 0 && (
        <p className="text-[13px] text-emerald-700 font-semibold mb-6">Full refund of {fmtR(appt.paid)} initiated.</p>
      )}
      <PrimaryBtn label="Back to appointments" onClick={onDone} />
    </div>
  )

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Cancel appointment?</SectionTitle>
      <div className="bg-red-50 rounded-2xl p-4 mb-5 border border-red-100">
        <p className="text-[13px] font-bold text-red-900 mb-1">This is a salon-initiated cancellation.</p>
        <p className="text-[12px] text-red-700 leading-relaxed">
          {appt.paid > 0
            ? "This booking was paid. The customer will receive an eligible full refund. No cancellation fee applies to salon-initiated cancellations."
            : "This is a pay-at-shop booking. No refund is required."}
        </p>
      </div>
      <Card className="px-5 mb-5">
        <OpsDetailRow label="Booking ref" value={appt.ref} mono />
        <OpsDetailRow label="Customer"   value={appt.customer} />
        <OpsDetailRow label="Service"    value={appt.service} />
        <OpsDetailRow label="Date"       value={appt.date} />
        <OpsDetailRow label="Time"       value={appt.time} />
        {appt.paid > 0 && <OpsDetailRow label="Refund" value={`${fmtR(appt.paid)} (full)`} accent="text-emerald-600" />}
      </Card>
      <div className="flex gap-3">
        <DangerBtn
          label={isSubmitting ? "Cancelling..." : "Confirm cancellation"}
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true)
            try {
              if (appt?.id) {
                await appointmentService.cancelAppointment(appt.id, 'salon')
              }
              setConfirmed(true)
            } catch {
              setConfirmed(true)
            } finally {
              setIsSubmitting(false)
            }
          }}
        />
        <SecondaryBtn label="Keep appointment" onClick={onBack} />
      </div>
    </div>
  )
}

// ─── NO-SHOW ──────────────────────────────────────────────────────────────────

export function NoShowScreen({ apptRef, onBack, onDone }: { apptRef?: string; onBack: () => void; onDone: () => void }) {
  const [appt, setAppt] = useState<any>(null)
  const [loading, setLoading] = useState(Boolean(apptRef))
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!apptRef) {
      setLoading(false)
      return
    }
    let mounted = true
    repositories.appointments.findByReference(apptRef).then(async dbAppt => {
      if (!mounted) return
      if (dbAppt) {
        const cust = await repositories.customers.findById(dbAppt.customerId)
        const svc = await repositories.services.findById(dbAppt.serviceId)
        setAppt({
          id: dbAppt.id,
          ref: dbAppt.bookingReference,
          customer: cust?.name || 'Customer',
          service: svc?.name || 'Service',
          time: dbAppt.startTime
        })
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [apptRef])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading appointment details...</div>
  }

  if (!appt) {
    return (
      <div className="p-8 text-center">
        <p className="text-[17px] font-bold text-gray-900 mb-2">No appointment selected</p>
        <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
      </div>
    )
  }

  if (confirmed) return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-5">🕐</div>
      <h2 className="text-[20px] font-black text-gray-900 mb-2">Marked as no-show</h2>
      <p className="text-[13px] text-gray-500 mb-3">Appointment status updated to NO_SHOW.</p>
      <p className="text-[12px] text-gray-400 mb-8">This appointment will not count as completed revenue. Payment and refund handling is separate — no automatic refund has been triggered.</p>
      <PrimaryBtn label="Back to appointments" onClick={onDone} />
    </div>
  )

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Mark as no-show?</SectionTitle>
      <p className="text-[14px] text-gray-600 mb-5 leading-relaxed">
        This appointment will be marked as a no-show and will not count as completed revenue or toward the customer's visit history.
      </p>
      <div className="bg-amber-50 rounded-xl border border-amber-100 px-4 py-3.5 mb-5">
        <p className="text-[12px] font-semibold text-amber-900">Note on payment</p>
        <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed">Payment and refund handling for no-shows requires a business rule decision. No refund will be automatically triggered. Handle any refund manually if required.</p>
      </div>
      <Card className="px-5 mb-6">
        <OpsDetailRow label="Customer" value={appt.customer} />
        <OpsDetailRow label="Service"  value={appt.service} />
        <OpsDetailRow label="Time"     value={appt.time} />
      </Card>
      <div className="flex gap-3">
        <button
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true)
            try {
              if (appt?.id) {
                await appointmentService.updateAppointmentStatus(appt.id, 'noShow')
              }
              setConfirmed(true)
            } catch {
              setConfirmed(true)
            } finally {
              setIsSubmitting(false)
            }
          }}
          className="px-5 py-3 bg-amber-500 text-white rounded-xl font-bold text-[13px] hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? "Updating..." : "Confirm no-show"}
        </button>
        <SecondaryBtn label="Cancel" onClick={onBack} />
      </div>
    </div>
  )
}

// ─── RESCHEDULE ───────────────────────────────────────────────────────────────

export function RescheduleScreen({ apptRef, onBack, onDone }: { apptRef?: string; onBack: () => void; onDone: () => void }) {
  const { tenantId: ctxTenantId } = useTenantContext()
  const [appt, setAppt] = useState<any>(null)
  const [loadingAppt, setLoadingAppt] = useState(Boolean(apptRef))
  const [stage, setStage] = useState<"date"|"time"|"review"|"success"|"conflict">("date")
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const SIMPLE_DATES = ["Sep 10","Sep 11","Sep 12","Sep 15","Sep 16","Sep 17"]
  const availableDates = getNextNDates(14)

  useEffect(() => {
    if (!apptRef) {
      setLoadingAppt(false)
      return
    }
    let mounted = true
    repositories.appointments.findByReference(apptRef).then(async dbAppt => {
      if (!mounted) return
      if (dbAppt) {
        const cust = await repositories.customers.findById(dbAppt.customerId)
        const svc = await repositories.services.findById(dbAppt.serviceId)
        const stf = dbAppt.staffId ? await repositories.staff.findById(dbAppt.staffId) : null
        setAppt({
          id: dbAppt.id,
          ref: dbAppt.bookingReference,
          customer: cust?.name || "Customer",
          service: svc?.name || "Service",
          serviceId: dbAppt.serviceId,
          staff: stf?.name || "Staff",
          staffId: dbAppt.staffId,
          date: dbAppt.appointmentDate,
          time: dbAppt.startTime,
          tenantId: dbAppt.tenantId
        })
      }
      setLoadingAppt(false)
    }).catch(() => {
      if (mounted) setLoadingAppt(false)
    })
    return () => { mounted = false }
  }, [apptRef])

  useEffect(() => {
    if (!newDate || !appt) return
    let mounted = true
    setLoadingSlots(true)
    const dStr = newDate.includes("-") ? newDate : "2026-09-12"
    const activeTenantId = appt.tenantId || ctxTenantId || ""
    if (appt.staffId) {
      availabilityService.getAvailableSlots({
        tenantId: activeTenantId,
        serviceId: appt.serviceId || "s1",
        date: dStr,
        date: newDate,
        staffId: appt.staffId
      }).then(slots => {
        if (!mounted) return
        setAvailableSlots(slots.filter(s => s.available).map(s => s.time))
      }).catch(() => {
        if (mounted) setAvailableSlots([])
      }).finally(() => {
        if (mounted) setLoadingSlots(false)
      })
    } else {
      availabilityService.getAvailableStaffAndSlots({
        tenantId: activeTenantId,
        serviceId: appt.serviceId || "s1",
        date: newDate,
      }).then(res => {
        if (!mounted) return
        setAvailableSlots(res.slots.filter(s => s.available).map(s => s.time))
      }).catch(() => {
        if (mounted) setAvailableSlots([])
      }).finally(() => {
        if (mounted) setLoadingSlots(false)
      })
    }
    return () => { mounted = false }
  }, [newDate, appt, ctxTenantId])

  const slotsToDisplay = availableSlots

  if (loadingAppt) {
    return <div className="p-8 text-center text-gray-500">Loading appointment details...</div>
  }

  if (!appt) {
    return (
      <div className="p-8 text-center">
        <p className="text-[17px] font-bold text-gray-900 mb-2">No appointment selected</p>
        <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
      </div>
    )
  }

  if (stage === "success") return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center min-h-[60vh] justify-center text-center">
      <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h2 className="text-[20px] font-black text-gray-900 mb-2">Appointment updated</h2>
      <p className="text-[13px] text-gray-500 mb-6">The customer has been notified of the new time.</p>
      <p className="text-[13px] text-gray-500 mb-6">The appointment has been successfully rescheduled.</p>
      <Card className="w-full text-left px-5 mb-6">
        <OpsDetailRow label="New date" value={newDate} />
        <OpsDetailRow label="New time" value={newTime} />
        <OpsDetailRow label="Customer" value={appt?.customer || "Customer"} />
        <OpsDetailRow label="Service"  value={appt?.service || "Service"} />
      </Card>
      <PrimaryBtn label="Back to appointment" onClick={onDone} />
    </div>
  )

  if (stage === "conflict") return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center min-h-[60vh] justify-center text-center">
      <div className="text-5xl mb-5">⚠️</div>
      <h2 className="text-[20px] font-black text-gray-900 mb-2">That time is no longer available</h2>
      <p className="text-[13px] text-gray-500 mb-2">Someone else just booked this slot.</p>
      <p className="text-[13px] text-gray-500 mb-2">Someone else just booked this slot or a schedule conflict occurred.</p>
      <p className="text-[13px] text-emerald-700 font-semibold mb-8">The original appointment remains unchanged.</p>
      <div className="flex gap-3 w-full">
        <button onClick={() => setStage("time")} className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[13px]">Choose another time</button>
        <button onClick={() => setStage("date")} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-[13px]">Choose another date</button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Reschedule appointment</SectionTitle>

      {stage === "date" && (
        <div>
          <p className="text-[13px] text-gray-500 mb-4">Select a new date for {appt?.customer || "Customer"} · {appt?.service || "Service"}</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {availableDates.map(d => (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setNewDate(d.dateStr)}
                className={`py-3 rounded-xl text-[13px] font-semibold border-2 transition-colors ${newDate === d.dateStr ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <PrimaryBtn label="Choose time →" onClick={() => newDate && setStage("time")} disabled={!newDate} />
        </div>
      )}

      {stage === "time" && (
        <div>
          <p className="text-[13px] text-gray-500 mb-4">Available times for {newDate}</p>
          {loadingSlots ? (
            <div className="py-8 text-center text-[13px] text-gray-500">Checking availability...</div>
          ) : slotsToDisplay.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-gray-500">No available times for this date. Please choose another date.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {slotsToDisplay.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewTime(t)}
                  className={`py-3 rounded-xl text-[13px] font-semibold border-2 transition-colors ${newTime === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <PrimaryBtn label="Review →" onClick={() => newTime && setStage("review")} disabled={!newTime} />
            <SecondaryBtn label="← Date" onClick={() => setStage("date")} />
          </div>
        </div>
      )}

      {stage === "review" && (
        <div>
          <Card className="px-5 mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 py-3">Reschedule summary</p>
            <OpsDetailRow label="Customer"   value={appt?.customer || "Customer"} />
            <OpsDetailRow label="Service"    value={appt?.service || "Service"} />
            <OpsDetailRow label="Staff"      value={appt?.staff || "Staff"} />
            <OpsDetailRow label="Was"        value={`${appt?.date || '—'} · ${appt?.time || '—'}`} />
            <OpsDetailRow label="New"        value={`${newDate} · ${newTime}`} />
          </Card>
          <p className="text-[12px] text-gray-400 mb-4">Availability will be validated before confirming.</p>
          <div className="flex gap-3">
            <PrimaryBtn
              label={isSubmitting ? "Updating..." : "Confirm reschedule"}
              disabled={isSubmitting}
              onClick={async () => {
                if (!appt?.id) return
                setIsSubmitting(true)
                try {
                  const res = await appointmentService.rescheduleAppointment(
                    appt.id,
                    newDate,
                    newTime
                  )
                  if (res.error) {
                    setStage("conflict")
                  } else {
                    setStage("success")
                  }
                } catch {
                  setStage("conflict")
                } finally {
                  setIsSubmitting(false)
                }
              }}
            />
            <SecondaryBtn label="← Change" onClick={() => setStage("time")} />
          </div>
          <button onClick={() => setStage("conflict")} className="mt-3 w-full text-center text-[12px] text-gray-400 underline">Demo: simulate conflict</button>
        </div>
      )}
    </div>
  )
}

// ─── CREATE APPOINTMENT ───────────────────────────────────────────────────────

type CreateStage = "customer" | "service" | "staff" | "date" | "time" | "review" | "success"

export function CreateApptScreen({ onBack, onDone, onNav }: {
  onBack: () => void; onDone: () => void; onNav: (v: OpsView) => void
}) {
  const { tenantId } = useTenantContext()
  const [stage,         setStage]         = useState<CreateStage>("customer")
  const [cust,          setCust]          = useState<(typeof OPS_CUSTOMERS)[number] | null>(null)
  const [svc,           setSvc]           = useState<(typeof OPS_SERVICES)[number] | null>(null)
  const [staffChoice,   setStaffChoice]   = useState<(typeof OPS_STAFF)[number] | null | "any">(null)
  const [cust,          setCust]          = useState<{ id: string; name: string; phone: string; email?: string; visits?: number } | null>(null)
  const [svc,           setSvc]           = useState<{ id: string; name: string; duration: number; price: number; category: string; active?: boolean } | null>(null)
  const [staffChoice,   setStaffChoice]   = useState<{ id: string; name: string; role?: string; photo?: string; active?: boolean } | null | "any">(null)
  const [date,          setDate]          = useState("")
  const [time,          setTime]          = useState("")
  const [search,        setSearch]        = useState("")
  const [showNewCust,   setShowNewCust]   = useState(false)
  const [newName,       setNewName]       = useState("")
  const [newPhone,      setNewPhone]      = useState("")
  const [dupWarning,    setDupWarning]    = useState(false)
  const [dupCust,       setDupCust]       = useState<(typeof OPS_CUSTOMERS)[number] | null>(null)
  const [dupCust,       setDupCust]       = useState<{ id: string; name: string; phone: string; email?: string; visits?: number } | null>(null)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [createError,   setCreateError]   = useState<string | null>(null)

  const filteredCusts = OPS_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const SIMPLE_DATES = ["Sep 9","Sep 10","Sep 11","Sep 12","Sep 15","Sep 16"]

  const [servicesList, setServicesList] = useState(OPS_SERVICES)
  const [staffList,    setStaffList]    = useState(OPS_STAFF)
  const [customersList, setCustomersList] = useState<{ id: string; name: string; phone: string; email?: string; visits: number }[]>([])
  const [servicesList,  setServicesList]  = useState<{ id: string; name: string; duration: number; price: number; category: string; active?: boolean }[]>([])
  const [staffList,     setStaffList]     = useState<{ id: string; name: string; role?: string; photo?: string; active?: boolean }[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots,   setLoadingSlots]   = useState(false)

  const availableDates = getNextNDates(14)

  useEffect(() => {
    if (!tenantId) return
    let mounted = true

    repositories.customers.list(tenantId).then(items => {
      if (mounted && items.length > 0) {
        setCustomersList(items.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || "",
          visits: (c as any).totalVisits ?? 0,
        })))
      }
    }).catch(() => {})

    repositories.services.list(tenantId).then(items => {
      if (mounted && items.length > 0) {
        setServicesList(items.map(s => ({
          id: s.id,
          name: s.name,
          duration: s.duration,
          price: s.price,
          category: s.category || "Haircuts",
          active: s.active ?? true,
        })))
      }
    }).catch(() => {})

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

    return () => { mounted = false }
  }, [tenantId])

  const filteredCusts = customersList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  useEffect(() => {
    if (!date || !svc || !tenantId) return
    let mounted = true
    setLoadingSlots(true)
    const dStr = date.includes("-") ? date : "2026-09-12"
    const targetStaffId = staffChoice === "any" || !staffChoice ? undefined : (staffChoice as any).id
    if (targetStaffId) {
      availabilityService.getAvailableSlots({
        tenantId,
        serviceId: svc.id,
        date: dStr,
        date,
        staffId: targetStaffId
      }).then(slots => {
        if (!mounted) return
        const list = slots.filter(s => s.available).map(s => s.time)
        setAvailableSlots(list)
      }).catch(() => {
        if (mounted) setAvailableSlots([])
      }).finally(() => {
        if (mounted) setLoadingSlots(false)
      })
    } else {
      availabilityService.getAvailableStaffAndSlots({
        tenantId,
        serviceId: svc.id,
        date,
      }).then(res => {
        if (!mounted) return
        const list = res.slots.filter(s => s.available).map(s => s.time)
        setAvailableSlots(list)
      }).catch(() => {
        if (mounted) setAvailableSlots([])
      }).finally(() => {
        if (mounted) setLoadingSlots(false)
      })
    }
    return () => { mounted = false }
  }, [date, svc?.id, staffChoice, tenantId])

  function handleNewCust() {
    // Duplicate detection
    const dup = OPS_CUSTOMERS.find(c =>
      c.phone.replace(/\s/g,"") === newPhone.replace(/\s/g,"")
    )
    if (dup) { setDupWarning(true); setDupCust(dup); return }
    const cleanPhone = newPhone.replace(/\s/g, "")
    const dup = customersList.find(c => c.phone.replace(/\s/g, "") === cleanPhone)
    if (dup) {
      setDupWarning(true)
      setDupCust(dup)
      return
    }
    setCust({
      id: "new",
      name: newName,
      phone: newPhone,
      email: "",
      visits: 0,
    })
    setStage("service")
  }

  function StageProgress({ step }: { step: number }) {
    return (
      <div className="mb-5">
        <div className="flex gap-1.5 mb-2">
          {["Customer","Service","Staff","Date","Time","Review"].map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${i < step ? "bg-gray-900" : "bg-gray-100"}`} />
          ))}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Step {step} of 6</p>
      </div>
    )
  }

  if (stage === "success") return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center min-h-[60vh] justify-center text-center">
      <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h2 className="text-[20px] font-black text-gray-900 mb-1">Appointment created</h2>
      <p className="text-[13px] text-gray-500 mb-6">Booking source: MANUAL</p>
      <Card className="w-full text-left px-5 mb-6">
        <OpsDetailRow label="Customer" value={cust?.name ?? newName} />
        <OpsDetailRow label="Service"  value={svc?.name ?? "—"} />
        <OpsDetailRow label="Staff"    value={staffChoice === "any" ? "Any available" : (staffChoice as typeof OPS_STAFF[number])?.name ?? "—"} />
        <OpsDetailRow label="Staff"    value={staffChoice === "any" ? "Any available" : (staffChoice as any)?.name ?? "—"} />
        <OpsDetailRow label="Date"     value={date} />
        <OpsDetailRow label="Time"     value={time} />
        <OpsDetailRow label="Price"    value={svc ? fmtR(svc.price) : "—"} />
      </Card>
      <div className="flex gap-3 w-full">
        <button onClick={() => onNav("appointmentList")} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-[13px]">View appointments</button>
        <button onClick={() => { setStage("customer"); setCust(null); setSvc(null); setStaffChoice(null); setDate(""); setTime("") }}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-[13px]">New appointment</button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <BackBtn onClick={onBack} />

      {stage === "customer" && (
        <div>
          <StageProgress step={1} />
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">Select customer</h3>
          <SearchBar placeholder="Search by name, phone or email…" value={search} onChange={setSearch} />

          {dupWarning && dupCust && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[13px] font-bold text-amber-900 mb-2">Customer already exists</p>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">{dupCust.name[0]}</div>
                <div><p className="font-semibold text-[13px] text-gray-900">{dupCust.name}</p><p className="text-[12px] text-gray-500">{dupCust.phone}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCust(dupCust); setDupWarning(false); setStage("service") }}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-[12px] font-bold">Use existing customer</button>
                <button onClick={() => { setDupWarning(false); setStage("service") }}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg text-[12px] font-semibold">Create new anyway</button>
              </div>
            </div>
          )}

          {!showNewCust && !dupWarning && (
            <div className="mt-3 space-y-2">
              <button onClick={() => setShowNewCust(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-2 border-dashed border-gray-300 rounded-xl text-[13px] font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors">
                <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">+</span> New customer
              </button>
              {filteredCusts.map(c => (
                <button key={c.id} onClick={() => { setCust(c); setStage("service") }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border-2 border-gray-100 hover:border-gray-900 transition-colors text-left">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700 flex-shrink-0">{c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-gray-900">{c.name}</p>
                    <p className="text-[12px] text-gray-500">{c.phone} · {c.visits} visits</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showNewCust && !dupWarning && (
            <div className="mt-4 space-y-3">
              <p className="text-[13px] font-semibold text-gray-700">New customer</p>
              <input type="text"  value={newName}  onChange={e => setNewName(e.target.value)}  placeholder="Full name"    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none" />
              <input type="tel"   value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone number" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none" />
              <div className="flex gap-3">
                <PrimaryBtn label="Add and continue" onClick={handleNewCust} disabled={!newName || !newPhone} />
                <SecondaryBtn label="Cancel" onClick={() => setShowNewCust(false)} />
              </div>
            </div>
          )}
        </div>
      )}

      {stage === "service" && (
        <div>
          <StageProgress step={2} />
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">Select service</h3>
          <div className="space-y-2">
            {servicesList.filter(s => s.active).map(s => (
              <button key={s.id} onClick={() => { setSvc(s); setStage("staff") }}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 text-left transition-colors ${svc?.id === s.id ? "border-gray-900 bg-gray-900" : "border-gray-100 hover:border-gray-300"}`}>
                <div>
                  <p className={`font-semibold text-[14px] ${svc?.id === s.id ? "text-white" : "text-gray-900"}`}>{s.name}</p>
                  <p className={`text-[12px] mt-0.5 ${svc?.id === s.id ? "text-white/60" : "text-gray-500"}`}>{s.duration} min · {s.category}</p>
                </div>
                <span className={`font-bold text-[15px] ${svc?.id === s.id ? "text-white" : "text-gray-900"}`}>{fmtR(s.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "staff" && (
        <div>
          <StageProgress step={3} />
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">Select staff member</h3>
          <div className="space-y-2">
            <button onClick={() => { setStaffChoice("any"); setStage("date") }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-colors ${staffChoice === "any" ? "border-gray-900 bg-gray-900" : "border-gray-100 hover:border-gray-300"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${staffChoice === "any" ? "bg-white/10" : "bg-gray-100"}`}>👥</div>
              <div>
                <p className={`font-semibold text-[14px] ${staffChoice === "any" ? "text-white" : "text-gray-900"}`}>Any available</p>
                <p className={`text-[12px] ${staffChoice === "any" ? "text-white/60" : "text-gray-500"}`}>Use salon assignment rule</p>
              </div>
            </button>
            {staffList.filter(s => s.active).map(s => (
              <button key={s.id} onClick={() => { setStaffChoice(s); setStage("date") }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-colors ${(staffChoice as any)?.id === s.id ? "border-gray-900 bg-gray-900" : "border-gray-100 hover:border-gray-300"}`}>
                <img src={`https://images.unsplash.com/${s.photo}?w=64&h=64&fit=crop&crop=face&auto=format`} alt={s.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div>
                  <p className={`font-semibold text-[14px] ${(staffChoice as any)?.id === s.id ? "text-white" : "text-gray-900"}`}>{s.name}</p>
                  <p className={`text-[12px] ${(staffChoice as any)?.id === s.id ? "text-white/60" : "text-gray-500"}`}>{s.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "date" && (
        <div>
          <StageProgress step={4} />
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">Select date</h3>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {availableDates.map(d => (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setDate(d.dateStr)}
                className={`py-3.5 rounded-xl text-[13px] font-semibold border-2 transition-colors ${date === d.dateStr ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <PrimaryBtn label="Choose time →" onClick={() => date && setStage("time")} disabled={!date} />
        </div>
      )}

      {stage === "time" && (
        <div>
          <StageProgress step={5} />
          <h3 className="text-[18px] font-bold text-gray-900 mb-2">Select time</h3>
          <p className="text-[13px] text-gray-500 mb-4">{date}</p>
          {loadingSlots ? (
            <div className="py-8 text-center text-[13px] text-gray-500">Checking availability...</div>
          ) : availableSlots.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-gray-500">No available times for this date. Please choose another date.</div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mb-5">
              {availableSlots.map(t => (
                <button key={t} onClick={() => setTime(t)}
                  className={`py-3 rounded-xl text-[13px] font-semibold border-2 transition-colors ${time === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}>{t}</button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <PrimaryBtn label="Review →" onClick={() => time && setStage("review")} disabled={!time} />
            <SecondaryBtn label="← Date" onClick={() => setStage("date")} />
          </div>
        </div>
      )}

      {stage === "review" && (
        <div>
          <StageProgress step={6} />
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">Review and create</h3>
          {createError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-[13px] border border-red-100">
              {createError}
            </div>
          )}
          <Card className="px-5 mb-5">
            <OpsDetailRow label="Customer" value={cust?.name ?? newName} />
            <OpsDetailRow label="Service"  value={svc?.name ?? "—"} />
            <OpsDetailRow label="Staff"    value={staffChoice === "any" ? "Any available" : (staffChoice as any)?.name ?? "—"} />
            <OpsDetailRow label="Date"     value={date} />
            <OpsDetailRow label="Time"     value={time} />
            <OpsDetailRow label="Duration" value={svc ? `${svc.duration} min` : "—"} />
            <OpsDetailRow label="Price"    value={svc ? fmtR(svc.price) : "—"} />
            <OpsDetailRow label="Source"   value="Manual" />
          </Card>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (!svc) return
                setIsSubmitting(true)
                setCreateError(null)
                try {
                  const targetStaffId = staffChoice === "any" || !staffChoice ? undefined : (staffChoice as any).id
                  const dStr = date.includes("-") ? date : "2026-09-12"
                  await bookingService.createBooking({
                    tenantId: tenantId || "",
                    serviceId: svc.id,
                    staffId: targetStaffId,
                    date: dStr,
                    date: date,
                    time: time || "09:00",
                    customer: {
                      name: cust?.name || newName || "Walk-in Customer",
                      phone: cust?.phone || newPhone || "",
                      email: cust?.email || "",
                    },
                    paymentMethod: "cash",
                    bookingSource: "manual",
                  })
                  setStage("success")
                } catch (err: any) {
                  setCreateError(err?.message || "Failed to create appointment")
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-bold text-[15px] hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create appointment"}
            </button>
            <SecondaryBtn label="← Edit" onClick={() => setStage("time")} />
          </div>
        </div>
      )}
    </div>
  )
}
