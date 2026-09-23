import React, { useState, useEffect } from "react"
import type { OpsView } from "./types"
import {
  fmtR, StatTile, Card, SectionTitle, ApptBadge, PayBadge,
  PrimaryBtn, SecondaryBtn, EmptyState, InlineFeedback,
} from "./shared"
import { salonOperationsFacade } from "@/application/facades/SalonOperationsFacade"
import { useTenantContext } from "@/application/tenant"
import type { AppointmentEntity, StaffEntity } from "@/application/repositories/interfaces"

interface Props {
  onNav: (v: OpsView) => void
  onAppt: (refId: string) => void
}

export function DashboardScreen({ onNav, onAppt }: Props) {
  const { tenantId, tenant } = useTenantContext()
  const [todayAppts, setTodayAppts] = useState<AppointmentEntity[]>([])
  const [activeStaff, setActiveStaff] = useState<StaffEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setError(false)
    const today = new Date().toISOString().slice(0, 10)

    salonOperationsFacade.getDashboardData(tenantId, today)
      .then(data => {
        if (mounted) {
          setTodayAppts(data.todayAppts)
          setActiveStaff(data.activeStaff)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error("Failed to load dashboard data:", err)
        if (mounted) {
          setLoading(false)
          setError(true)
        }
      })
    return () => { mounted = false }
  }

  useEffect(() => {
    const cleanup = loadData()
    return cleanup
  }, [tenantId])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <InlineFeedback type="loading" message="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center gap-3">
        <InlineFeedback type="error" message="Failed to load dashboard." />
        <SecondaryBtn label="Retry" onClick={loadData} />
      </div>
    )
  }

  const totalCharged = todayAppts.reduce((s, a) => s + (a.totalCharged || 0), 0)
  const totalPaid    = todayAppts.reduce((s, a) => s + (a.totalPaid || 0), 0)
  const outstanding  = totalCharged - totalPaid

  const unpaidAppts = todayAppts.filter(a => a.paymentStatus === "unpaid" || a.paymentStatus === "partial")

  const alerts = [
    ...(unpaidAppts.length > 0 ? [{
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      label: `${unpaidAppts.length} outstanding payment${unpaidAppts.length > 1 ? 's' : ''}`,
      action: "View payments",
      nav: "appointmentList" as OpsView,
    }] : [])
  ]

  const isEmpty = todayAppts.length === 0
  const dateFormatted = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] sm:text-[19px] font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-[11px] sm:text-[12px] text-gray-500 mt-0.5 truncate">{dateFormatted} · {tenant?.name || 'Salon'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PrimaryBtn
            label="New appointment"
            onClick={() => onNav("createAppt")}
            icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          />
          <div className="hidden sm:flex items-center gap-2">
            <SecondaryBtn label="Appointments" onClick={() => onNav("appointmentList")} />
            <SecondaryBtn label="Calendar" onClick={() => onNav("calendarDay")} />
          </div>
        </div>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatTile label="Appointments" value={String(todayAppts.length)} sub="today" onClick={() => onNav("appointmentList")} />
        <StatTile label="Charged"      value={fmtR(totalCharged)} sub="today" />
        <StatTile label="Paid"         value={fmtR(totalPaid)}    sub="today" />
        <StatTile label="Outstanding"  value={fmtR(outstanding)}  sub="today" accent={outstanding > 0 ? "text-amber-600" : "text-gray-900"} />
      </div>

      {/* 3. Main Operational Sections */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left Column: Today's Appointments */}
        <div className="lg:col-span-2 space-y-2.5">
          <SectionTitle>Today's appointments</SectionTitle>
          <Card>
            {isEmpty ? (
              <EmptyState
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                title="No appointments today"
                body="Your schedule is clear for today."
                cta="Create appointment"
                onCta={() => onNav("createAppt")}
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {todayAppts.map(a => (
                  <div
                    key={a.id}
                    onClick={() => onAppt(a.bookingReference)}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="text-[12px] font-mono font-medium text-gray-500 w-11 sm:w-12 flex-shrink-0">
                      {a.startTime.slice(0, 5)}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="font-semibold text-[13px] text-gray-900 truncate">
                        Ref #{a.bookingReference.split('-').pop()}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        {activeStaff.find(s => s.id === a.staffId)?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                      <PayBadge status={a.paymentStatus} />
                      <ApptBadge status={a.status} />
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 ml-0.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Attention, Quick Actions, Staff Active */}
        <div className="space-y-4">
          {alerts.length > 0 && (
            <div>
              <SectionTitle>Attention required</SectionTitle>
              <Card>
                <div className="divide-y divide-gray-100">
                  {alerts.map(a => (
                    <button
                      key={a.label}
                      onClick={() => onNav(a.nav)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-gray-400 flex-shrink-0">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900">{a.label}</p>
                        <p className="text-[11px] text-gray-500 underline underline-offset-2">{a.action}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <div>
            <SectionTitle>Quick actions</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNav("createAppt")}
                className="flex flex-col items-start p-2.5 border border-gray-200 rounded-sm hover:border-gray-900 bg-white transition-colors text-left"
              >
                <span className="text-[12px] font-semibold text-gray-900">New booking</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Create appointment</span>
              </button>
              <button
                onClick={() => onNav("appointmentList")}
                className="flex flex-col items-start p-2.5 border border-gray-200 rounded-sm hover:border-gray-900 bg-white transition-colors text-left"
              >
                <span className="text-[12px] font-semibold text-gray-900">Appointments</span>
                <span className="text-[10px] text-gray-400 mt-0.5">View bookings</span>
              </button>
              <button
                onClick={() => onNav("calendarDay")}
                className="flex flex-col items-start p-2.5 border border-gray-200 rounded-sm hover:border-gray-900 bg-white transition-colors text-left"
              >
                <span className="text-[12px] font-semibold text-gray-900">Calendar</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Daily & weekly grid</span>
              </button>
              <button
                onClick={() => onNav("customerList")}
                className="flex flex-col items-start p-2.5 border border-gray-200 rounded-sm hover:border-gray-900 bg-white transition-colors text-left"
              >
                <span className="text-[12px] font-semibold text-gray-900">Search clients</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Client CRM list</span>
              </button>
            </div>
          </div>

          <div>
            <SectionTitle>Staff active today</SectionTitle>
            <Card>
              <div className="divide-y divide-gray-100">
                {activeStaff.length === 0 ? (
                  <div className="p-3 text-center text-[12px] text-gray-400">No staff active</div>
                ) : (
                  activeStaff.map(s => {
                    const sAppts = todayAppts.filter(a => a.staffId === s.id && a.status !== 'cancelled' && a.status !== 'noShow')
                    const sRev = sAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged || 0), 0)

                    return (
                      <div key={s.id} className="flex items-center gap-2.5 px-3 py-2">
                        <div className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 text-[10px] font-semibold text-gray-600">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-900 truncate">{s.name}</p>
                          <p className="text-[10px] text-gray-500">{s.role}</p>
                        </div>
                        <p className="text-[12px] font-semibold text-gray-900">{fmtR(sRev)}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
