import React from "react"
import type { AppointmentStatus, PaymentStatus, NotificationStatus, NotificationChannel, OpsView } from "./types"

// ─── FORMATTERS ───────────────────────────────────────────────────────────────

export function fmtR(n: number) {
  return `R${n.toLocaleString("en-ZA")}`
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

export function statusConfig(s: AppointmentStatus) {
  const map = {
    booked:     { label:"Booked",      bg:"bg-blue-50",   text:"text-blue-700",   dot:"bg-blue-400"   },
    confirmed:  { label:"Confirmed",   bg:"bg-indigo-50", text:"text-indigo-700", dot:"bg-indigo-400" },
    inProgress: { label:"In progress", bg:"bg-amber-50",  text:"text-amber-700",  dot:"bg-amber-400"  },
    completed:  { label:"Completed",   bg:"bg-emerald-50",text:"text-emerald-700",dot:"bg-emerald-500" },
    cancelled:  { label:"Cancelled",   bg:"bg-gray-100",  text:"text-gray-500",   dot:"bg-gray-400"   },
    noShow:     { label:"No-show",     bg:"bg-red-50",    text:"text-red-600",    dot:"bg-red-400"    },
  }
  return map[s]
}

export function payConfig(s: PaymentStatus) {
  const map = {
    unpaid:          { label:"Unpaid",      bg:"bg-red-50",    text:"text-red-600"     },
    partial:         { label:"Part-paid",   bg:"bg-amber-50",  text:"text-amber-700"   },
    paid:            { label:"Paid",        bg:"bg-emerald-50",text:"text-emerald-700" },
    refundProcessing:{ label:"Refunding",   bg:"bg-amber-50",  text:"text-amber-700"   },
    refunded:        { label:"Refunded",    bg:"bg-gray-100",  text:"text-gray-500"    },
    paymentFailed:   { label:"Pay failed",  bg:"bg-red-100",   text:"text-red-700"     },
  }
  return map[s]
}

// ─── BADGES ───────────────────────────────────────────────────────────────────

export function ApptBadge({ status }: { status: AppointmentStatus }) {
  const c = statusConfig(status)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}

export function PayBadge({ status }: { status: PaymentStatus }) {
  const c = payConfig(status)
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${c.bg} ${c.text}`}>{c.label}</span>
}

export function SourceBadge({ source }: { source: "online" | "qr" | "manual" }) {
  const map = {
    online: { label:"Online", bg:"bg-blue-50",  text:"text-blue-700" },
    qr:     { label:"QR",     bg:"bg-purple-50",text:"text-purple-700"},
    manual: { label:"Manual", bg:"bg-gray-100", text:"text-gray-600"  },
  }
  const c = map[source]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${c.bg} ${c.text}`}>{c.label}</span>
}

export function NotifStatusIcon({ status }: { status: NotificationStatus }) {
  if (status === "sent")        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Sent</span>
  if (status === "failed")      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700">Failed</span>
  if (status === "pending")     return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">Pending</span>
  if (status === "notRequired") return <span className="text-gray-300 font-bold">—</span>
  return null
}

export function channelLabel(ch: NotificationChannel) {
  return { whatsapp:"WhatsApp", sms:"SMS", email:"Email", none:"None" }[ch]
}

// ─── LAYOUT PRIMITIVES ────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">{children}</h2>
}

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
}


export function OpsDetailRow({ label, value, mono, accent }: {
  label: string; value: React.ReactNode; mono?: boolean; accent?: string
}) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[13px] text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-[13px] font-semibold text-right max-w-[240px] ml-4 ${mono ? "font-mono" : ""} ${accent ?? "text-gray-900"}`}>{value}</span>
    </div>
  )
}

export function StatTile({ label, value, sub, accent, onClick }: {
  label: string; value: string; sub?: string; accent?: string; onClick?: () => void;
}) {
  return (
    <Card className={`p-4 ${onClick ? "cursor-pointer hover:border-gray-200 transition-colors" : ""}`} onClick={onClick}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className={`text-[24px] font-black tracking-tight ${accent ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-[12px] text-gray-400 mt-0.5 font-medium">{sub}</p>}
    </Card>
  )
}

export function SearchBar({ placeholder, value, onChange }: {
  placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 text-[14px] placeholder-gray-400 focus:border-gray-900 outline-none transition-colors bg-white"
      />
    </div>
  )
}

export function PrimaryBtn({ label, onClick, icon, disabled }: {
  label: string; onClick: () => void; icon?: React.ReactNode; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold shadow-sm transition-colors active:scale-[0.98] ${
        disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"
      }`}>
      {icon && <span>{icon}</span>}{label}
    </button>
  )
}

export function SecondaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">
      {label}
    </button>
  )
}

export function DangerBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors shadow-sm ${
        disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"
      }`}
    >
      {label}
    </button>
  )
}

export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors mb-4">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Back
    </button>
  )
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  body?: string
  description?: string
  cta?: string
  action?: React.ReactNode
  onCta?: () => void
}

export function EmptyState({ icon, title, body, description, cta, action, onCta }: EmptyStateProps) {
  const text = body || description
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 mb-4 shadow-xs">
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>
      <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">{title}</h3>
      {text && <p className="text-[13px] text-gray-500 mb-6 max-w-xs leading-relaxed">{text}</p>}
      {cta && onCta && <PrimaryBtn label={cta} onClick={onCta} />}
      {action}
    </div>
  )
}

export function SectionDivider({ label }: { label: string }) {
  return <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-5 pt-4 pb-1">{label}</p>
}

export function InlineFeedback({ type, message }: { type: 'loading' | 'error' | 'success' | 'info'; message: string }) {
  const bg = type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
             type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
             type === 'loading' ? 'bg-blue-50 text-blue-700 border-blue-200' :
             'bg-gray-50 text-gray-700 border-gray-200'
  return (
    <div className={`p-4 rounded-xl border text-[13px] font-medium flex items-center gap-2 ${bg}`}>
      {type === 'loading' && <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />}
      <span>{message}</span>
    </div>
  )
}

export function getRouteForOpsView(view: OpsView | string): string {
  switch (view) {
    case "dashboard":
      return "/app"
    case "calendarDay":
    case "calendarWeek":
      return "/app/calendar"
    case "appointmentList":
    case "appointmentDetail":
      return "/app/appointments"
    case "createAppt":
      return "/app/appointments?action=create"
    case "customerList":
    case "customerProfile":
      return "/app/customers"
    case "staffList":
    case "staffProfile":
      return "/app/staff"
    case "serviceList":
      return "/app/services"
    case "financials":
      return "/app/financials"
    case "paymentList":
      return "/app/financials?view=paymentList"
    case "outstandingPayments":
      return "/app/financials?view=outstandingPayments"
    case "refundList":
      return "/app/financials?view=refundList"
    case "revenueDetail":
      return "/app/financials?view=revenueDetail"
    case "expenseList":
      return "/app/financials?view=expenseList"
    case "financialReports":
      return "/app/financials?view=financialReports"
    case "settings":
      return "/app/settings"
    case "settingsServices":
      return "/app/settings?view=settingsServices"
    case "settingsAddService":
      return "/app/settings?view=settingsAddService"
    case "settingsAvailability":
      return "/app/settings?view=settingsAvailability"
    case "settingsBooking":
      return "/app/settings?view=settingsBooking"
    case "settingsPayments":
      return "/app/settings?view=settingsPayments"
    case "settingsCancellation":
      return "/app/settings?view=settingsCancellation"
    case "support":
      return "/app/support"
    default:
      if (typeof view === "string" && view.startsWith("/app")) {
        return view
      }
      return "/app"
  }
}

