import React from "react"
import type { OpsView } from "./types"

const NAV_ITEMS = [
  { key:"dashboard",       label:"Dashboard",    emoji:"📊", group:"main"     },
  { key:"calendarDay",     label:"Calendar",     emoji:"📅", group:"main"     },
  { key:"appointmentList", label:"Appointments", emoji:"📋", group:"main"     },
  { key:"customerList",    label:"Customers",    emoji:"👤", group:"main"     },
  { key:"serviceList",     label:"Services",     emoji:"✂️", group:"ops"      },
  { key:"staffList",       label:"Staff",        emoji:"👥", group:"ops"      },
  { key:"settings",        label:"Settings",     emoji:"⚙️", group:"settings" },
  { key:"financials",      label:"Financials",   emoji:"💰", group:"finance"  },
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
}

export function Sidebar({ current, onNav }: { current: OpsView; onNav: (v: OpsView) => void }) {
  const isActive = (key: string) => NAV_OWNS[key]?.includes(current) ?? false

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-white border-r border-gray-100 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[13px] font-black">B</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">Fade &amp; Edge</p>
            <p className="text-[10px] text-gray-400 font-medium">Salon dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 pb-2 pt-1">Main</p>
        {NAV_ITEMS.filter(i => i.group === "main").map(item => (
          <button
            key={item.key}
            onClick={() => onNav(item.key as OpsView)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold transition-colors ${
              isActive(item.key) ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="text-base w-5 text-center">{item.emoji}</span>
            {item.label}
          </button>
        ))}

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 pb-2 pt-4">Operations</p>
        {NAV_ITEMS.filter(i => i.group === "ops").map(item => (
          <button
            key={item.key}
            onClick={() => onNav(item.key as OpsView)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold transition-colors ${
              isActive(item.key) ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="text-base w-5 text-center">{item.emoji}</span>
            {item.label}
          </button>
        ))}

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 pb-2 pt-4">Configuration</p>
        {NAV_ITEMS.filter(i => i.group === "settings").map(item => (
          <button
            key={item.key}
            onClick={() => onNav(item.key as OpsView)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold transition-colors ${
              isActive(item.key) ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="text-base w-5 text-center">{item.emoji}</span>
            {item.label}
          </button>
        ))}

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 pb-2 pt-4">Finance</p>
        {NAV_ITEMS.filter(i => i.group === "finance").map(item => (
          <button
            key={item.key}
            onClick={() => onNav(item.key as OpsView)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold transition-colors ${
              isActive(item.key) ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="text-base w-5 text-center">{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 pb-5">
        <div className="bg-gray-50 rounded-xl px-3 py-3">
          <p className="text-[11px] font-semibold text-gray-500">Signed in as</p>
          <p className="text-[13px] font-bold text-gray-900 mt-0.5">Sanele Khumalo</p>
          <p className="text-[11px] text-gray-400">Owner</p>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav({ current, onNav }: { current: OpsView; onNav: (v: OpsView) => void }) {
  const tabs = [
    { key:"dashboard",       label:"Home",      emoji:"🏠" },
    { key:"calendarDay",     label:"Calendar",  emoji:"📅" },
    { key:"appointmentList", label:"Bookings",  emoji:"📋" },
    { key:"customerList",    label:"Customers", emoji:"👤" },
  ]
  const isActive = (key: string) => NAV_OWNS[key]?.includes(current) ?? false

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex z-30">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onNav(t.key as OpsView)}
          className={`flex-1 flex flex-col items-center py-2.5 text-[10px] font-semibold transition-colors ${
            isActive(t.key) ? "text-gray-900" : "text-gray-400"
          }`}>
          <span className="text-xl mb-0.5">{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
