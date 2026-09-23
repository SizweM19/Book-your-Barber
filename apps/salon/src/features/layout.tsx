'use client'

import React, { useState } from "react"
import type { OpsView } from "./types"

interface NavItem {
  key: OpsView
  label: string
  group: "main" | "ops" | "finance" | "settings"
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Home",
    group: "main",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    key: "calendarDay",
    label: "Calendar",
    group: "main",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: "appointmentList",
    label: "Appointments",
    group: "main",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: "customerList",
    label: "Customers",
    group: "main",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "staffList",
    label: "Staff",
    group: "ops",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "serviceList",
    label: "Services",
    group: "ops",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: "financials",
    label: "Financials",
    group: "finance",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    group: "settings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

// Maps each nav key to all OpsView values it "owns" (for active highlight)
const NAV_OWNS: Record<string, OpsView[]> = {
  dashboard:       ["dashboard"],
  calendarDay:     ["calendarDay","calendarWeek"],
  appointmentList: ["appointmentList","appointmentDetail","recordPayment","completeAppt","cancelAppt","noShow","reschedule","createAppt"],
  customerList:    ["customerList","customerProfile"],
  serviceList:     ["serviceList"],
  staffList:       ["staffList","staffProfile"],
  settings:        ["settings","settingsServices","settingsAddService","settingsEditService","settingsAddStaff","settingsAvailability","settingsBooking","settingsPayments","settingsCancellation"],
  financials:      ["financials","paymentList","paymentDetail","outstandingPayments","refundList","refundDetail","revenueDetail","expenseList","addExpense","editExpense","financialReports"],
  support:         ["support"],
}

export function TopHeader({ current, onNav }: { current: OpsView; onNav: (v: OpsView) => void }) {
  const isActive = (key: string) => NAV_OWNS[key]?.includes(current) ?? false

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
      {/* Salon Brand */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-gray-900 rounded-sm flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[13px] font-bold tracking-wider">B</span>
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">BookYourBarber</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="px-1.5 py-0.2 bg-gray-100 border border-gray-200 text-gray-600 text-[9px] font-semibold rounded-sm uppercase tracking-wider">
              SALON OPS
            </span>
            <span className="text-[10px] text-gray-400">Cape Town</span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex items-center gap-1 overflow-x-auto px-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] whitespace-nowrap transition-colors ${
              isActive(item.key)
                ? "bg-gray-900 text-white font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium"
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Quick Action & Help */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onNav("createAppt")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-sm text-[12px] font-semibold hover:bg-gray-800 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Appointment</span>
        </button>

        <button
          onClick={() => onNav("support")}
          className={`p-2 rounded-sm transition-colors ${
            isActive("support") ? "bg-gray-100 text-gray-900 border border-gray-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
          title="Support & Documentation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </div>
    </header>
  )
}

// Backward compatibility alias for any lingering references
export const Sidebar = TopHeader

export function MobileNav({ current, onNav }: { current: OpsView; onNav: (v: OpsView) => void }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isActive = (key: string) => NAV_OWNS[key]?.includes(current) ?? false

  const isMoreActive = () => {
    return (
      NAV_OWNS.staffList.includes(current) ||
      NAV_OWNS.serviceList.includes(current) ||
      NAV_OWNS.financials.includes(current) ||
      NAV_OWNS.settings.includes(current) ||
      NAV_OWNS.support.includes(current)
    )
  }

  return (
    <>
      {/* Fixed Bottom Tab Bar (5 Tabs) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex items-center justify-around h-16 z-40 safe-area-bottom"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* 1. Home */}
        <button
          onClick={() => onNav("dashboard")}
          className={`flex-1 flex flex-col items-center justify-center h-full text-[10px] transition-colors ${
            isActive("dashboard") ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600 font-medium"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span>Home</span>
        </button>

        {/* 2. Calendar */}
        <button
          onClick={() => onNav("calendarDay")}
          className={`flex-1 flex flex-col items-center justify-center h-full text-[10px] transition-colors ${
            isActive("calendarDay") ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600 font-medium"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Calendar</span>
        </button>

        {/* 3. Appointments */}
        <button
          onClick={() => onNav("appointmentList")}
          className={`flex-1 flex flex-col items-center justify-center h-full text-[10px] transition-colors ${
            isActive("appointmentList") ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600 font-medium"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Appointments</span>
        </button>

        {/* 4. Customers */}
        <button
          onClick={() => onNav("customerList")}
          className={`flex-1 flex flex-col items-center justify-center h-full text-[10px] transition-colors ${
            isActive("customerList") ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600 font-medium"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Customers</span>
        </button>

        {/* 5. More */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center h-full text-[10px] transition-colors ${
            isMoreOpen || isMoreActive() ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600 font-medium"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
          <span>More</span>
        </button>
      </nav>

      {/* Slide-Up Drawer */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            onClick={() => setIsMoreOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          <div
            className="relative z-10 w-full bg-white border-t border-gray-200 rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex flex-col items-center pt-2.5 px-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-300 rounded-full mb-3" />
              <div className="w-full flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-900">More Options</h3>
                <button onClick={() => setIsMoreOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Operations</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { onNav("staffList"); setIsMoreOpen(false) }}
                    className="w-full flex items-center justify-between p-2.5 rounded-sm text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <span>Staff Members</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    onClick={() => { onNav("serviceList"); setIsMoreOpen(false) }}
                    className="w-full flex items-center justify-between p-2.5 rounded-sm text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <span>Services & Pricing</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    onClick={() => { onNav("financials"); setIsMoreOpen(false) }}
                    className="w-full flex items-center justify-between p-2.5 rounded-sm text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <span>Financials & Payments</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Salon Admin</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { onNav("settings"); setIsMoreOpen(false) }}
                    className="w-full flex items-center justify-between p-2.5 rounded-sm text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <span>Salon Settings</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    onClick={() => { onNav("support"); setIsMoreOpen(false) }}
                    className="w-full flex items-center justify-between p-2.5 rounded-sm text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <span>Support & Help Center</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
