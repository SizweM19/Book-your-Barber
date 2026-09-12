import React from "react"
import type { OpsView } from "./types"
import { OPS_APPOINTMENTS, OPS_STAFF, TODAY, TODAY_LABEL, OPS_SALON_NAME } from "./data"
import { fmtR, StatTile, Card, SectionTitle, ApptBadge, PayBadge, PrimaryBtn, EmptyState } from "./shared"

interface Props {
  onNav: (v: OpsView) => void
  onAppt: (ref: string) => void
}

export function DashboardScreen({ onNav, onAppt }: Props) {
  const todayAppts  = OPS_APPOINTMENTS.filter(a => a.date === TODAY)
  const totalCharged = todayAppts.reduce((s, a) => s + a.charged, 0)
  const totalPaid    = todayAppts.reduce((s, a) => s + a.paid,    0)
  const outstanding  = totalCharged - totalPaid

  // Appointment with a failed notification
  const failedNotif = OPS_APPOINTMENTS.find(a =>
    a.notifications.some(n => n.status === "failed")
  )

  const alerts = [
    {
      emoji:"💰",
      label:`${todayAppts.filter(a => a.paymentStatus === "unpaid" || a.paymentStatus === "partial").length} outstanding payments`,
      action:"View payments",
      nav:"appointmentList" as OpsView,
      color:"text-amber-700",
    },
    {
      emoji:"👤",
      label:"5 customers at risk",
      action:"View customers",
      nav:"customerList" as OpsView,
      color:"text-amber-700",
    },
    {
      emoji:"📵",
      label:"1 notification failed",
      action:"View notification",
      nav:"appointmentDetail" as OpsView,
      ref: failedNotif?.ref,
      color:"text-gray-700",
    },
    {
      emoji:"⚠️",
      label:"1 booking conflict",
      action:"Resolve conflict",
      nav:"calendarDay" as OpsView,
      color:"text-red-600",
    },
  ]

  const isEmpty = todayAppts.length === 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-black text-gray-900 tracking-tight">Good morning, Sanele 👋</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">{TODAY_LABEL} · {OPS_SALON_NAME}</p>
        </div>
        <PrimaryBtn label="New appointment" onClick={() => onNav("createAppt")} icon="+" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Appointments" value={String(todayAppts.length)} sub="today" />
        <StatTile label="Charged"      value={fmtR(totalCharged)} sub="today" />
        <StatTile label="Paid"         value={fmtR(totalPaid)}    sub="today" accent="text-emerald-600" />
        <StatTile label="Outstanding"  value={fmtR(outstanding)}  sub="today" accent={outstanding > 0 ? "text-amber-600" : "text-gray-900"} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => onNav("createAppt")}   className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors shadow-sm">+ New appointment</button>
        <button onClick={() => onNav("calendarDay")}  className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">📅 View calendar</button>
        <button onClick={() => onNav("customerList")} className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">+ Add customer</button>
        <button onClick={() => onNav("serviceList")}  className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">+ Add service</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Today's appointments */}
        <div className="lg:col-span-2 space-y-3">
          <SectionTitle>Today's appointments</SectionTitle>
          <Card>
            {isEmpty ? (
              <EmptyState
                icon="📅"
                title="No appointments today"
                body="Your schedule is clear."
                cta="Create appointment"
                onCta={() => onNav("createAppt")}
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {todayAppts.map(a => (
                  <button
                    key={a.ref}
                    onClick={() => onAppt(a.ref)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="text-[13px] font-mono font-bold text-gray-400 w-12 flex-shrink-0">{a.time}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-gray-900">{a.customer}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {a.service} · {a.staff.split(" ")[0]}
                        {a.paymentMethod === "payAtShop" && (
                          <span className="ml-2 text-amber-600 font-semibold">· Pay at shop</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PayBadge  status={a.paymentStatus} />
                      <ApptBadge status={a.status} />
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </Card>
          {isEmpty && (
            <div className="flex gap-3">
              <button onClick={() => onNav("createAppt")} className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-[13px] hover:bg-gray-800 transition-colors shadow-sm">Create appointment</button>
              <button className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-[13px] hover:border-gray-400 transition-colors">Share booking link</button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Attention required */}
          <div>
            <SectionTitle>Attention required</SectionTitle>
            <Card>
              <div className="divide-y divide-gray-50">
                {alerts.map(a => (
                  <button
                    key={a.label}
                    onClick={() => {
                      if (a.ref) onAppt(a.ref)
                      else onNav(a.nav)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-base flex-shrink-0">{a.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold ${a.color}`}>{a.label}</p>
                      <p className="text-[11px] text-gray-400 underline underline-offset-2">{a.action}</p>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Staff performance */}
          <div>
            <SectionTitle>Staff today</SectionTitle>
            <Card>
              <div className="divide-y divide-gray-50">
                {OPS_STAFF.filter(s => s.active).map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                    <img
                      src={`https://images.unsplash.com/${s.photo}?w=64&h=64&fit=crop&crop=face&auto=format`}
                      alt={s.name}
                      className="w-9 h-9 rounded-full object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{s.name.split(" ")[0]}</p>
                      <p className="text-[11px] text-gray-400">{s.role}</p>
                    </div>
                    <p className="text-[14px] font-bold text-gray-900">{fmtR(s.todayRevenue)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
