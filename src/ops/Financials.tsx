import React, { useState } from "react"
import React, { useState, useEffect } from "react"
import type { OpsView, ExpenseRecord } from "./types"
import { OPS_APPOINTMENTS, OPS_STAFF, OPS_REFUNDS, OPS_EXPENSES, TODAY } from "./data"
import {
  fmtR, Card, SectionTitle, OpsDetailRow, SearchBar, PrimaryBtn,
  SecondaryBtn, DangerBtn, BackBtn, EmptyState, PayBadge,
} from "./shared"
import { repositories } from "@/infrastructure/repositories/container"
import { useTenantContext } from "@/application/tenant"
import type { ExpenseEntity, DomainRefundRecord } from "@/application/repositories/interfaces"

// ─── LOCAL PRIMITIVES ─────────────────────────────────────────────────────────

function PeriodTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = ["Today","Week","Month","Last month"]
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {opts.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${value === o ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

function MethodBadge({ method }: { method: string }) {
  const cfg: Record<string, string> = {
    card:"bg-indigo-50 text-indigo-700", cash:"bg-emerald-50 text-emerald-700",
    yoco:"bg-purple-50 text-purple-700", payshap:"bg-blue-50 text-blue-700",
    other:"bg-gray-100 text-gray-600", payAtShop:"bg-amber-50 text-amber-700",
  }
  const labels: Record<string, string> = {
    card:"Card", cash:"Cash", yoco:"Yoco", payshap:"PayShap", other:"Other", payAtShop:"Pay at shop"
  }
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${cfg[method] ?? "bg-gray-100 text-gray-600"}`}>{labels[method] ?? method}</span>
}

function RefundStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    requested:"bg-blue-50 text-blue-700", processing:"bg-amber-50 text-amber-700",
    completed:"bg-emerald-50 text-emerald-700", failed:"bg-red-50 text-red-600",
  }
  const labels: Record<string, string> = {
    requested:"Requested", processing:"Processing", completed:"Completed", failed:"Failed"
  }
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${cfg[status] ?? "bg-gray-100 text-gray-600"}`}>{labels[status] ?? status}</span>
}

function CategoryBadge({ cat }: { cat: string }) {
  const cfg: Record<string, string> = {
    Rent:"bg-gray-100 text-gray-700", Electricity:"bg-amber-50 text-amber-700",
    Products:"bg-blue-50 text-blue-700", Salaries:"bg-emerald-50 text-emerald-700",
    Marketing:"bg-purple-50 text-purple-700", Transport:"bg-indigo-50 text-indigo-700",
    Other:"bg-gray-100 text-gray-600",
  }
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${cfg[cat] ?? "bg-gray-100 text-gray-600"}`}>{cat}</span>
}

function SuccessToast({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <p className="text-[13px] font-semibold text-emerald-800">{msg}</p>
    </div>
  )
}

// ─── DERIVED DATA HELPERS ─────────────────────────────────────────────────────

const ALL_PAYMENTS = OPS_APPOINTMENTS.flatMap(a =>
  a.payments.map(p => ({ ...p, apptRef: a.ref, customer: a.customer, customerId: a.customerId, date: a.date, service: a.service }))
)

const TOTAL_EXPENSES = OPS_EXPENSES.reduce((s, e) => s + e.amount, 0)
const TODAY_PAID     = OPS_APPOINTMENTS.filter(a => a.date === TODAY).reduce((s, a) => s + a.paid, 0)
const TODAY_CHARGED  = OPS_APPOINTMENTS.filter(a => a.date === TODAY).reduce((s, a) => s + a.charged, 0)
const TOTAL_REFUNDED = OPS_REFUNDS.filter(r => r.status === "completed").reduce((s, r) => s + r.refundAmount, 0)
const OUTSTANDING    = OPS_APPOINTMENTS.filter(a => a.paid < a.charged && !["cancelled","noShow"].includes(a.status))

// ─── 1. FINANCIALS HUB ───────────────────────────────────────────────────────

export function FinancialsHubScreen({ onNav, onAppt }: { onNav: (v: OpsView) => void; onAppt: (ref: string) => void }) {
  const { tenantId } = useTenantContext()
  const [period, setPeriod] = useState("Today")
  const [loading, setLoading] = useState(true)

  const operatingResult = TODAY_PAID - TOTAL_EXPENSES
  const [todayCharged, setTodayCharged] = useState(0)
  const [todayPaid, setTodayPaid] = useState(0)
  const [totalRefunded, setTotalRefunded] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [outstandingCount, setOutstandingCount] = useState(0)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [allPaymentsCount, setAllPaymentsCount] = useState(0)
  const [refundCount, setRefundCount] = useState(0)

  const recentPayments = ALL_PAYMENTS.slice(-5).reverse()
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    const todayStr = new Date().toISOString().slice(0, 10)

    Promise.all([
      repositories.appointments.listByTenant(tenantId, 500),
      repositories.expenses.list(tenantId),
      repositories.refunds.listByTenant(tenantId),
    ]).then(async ([appts, exps, refs]) => {
      if (!mounted) return

      const tCharged = appts
        .filter(a => a.appointmentDate === todayStr && a.status !== "cancelled")
        .reduce((sum, a) => sum + a.totalCharged, 0)

      const tPaid = appts
        .filter(a => a.appointmentDate === todayStr)
        .reduce((sum, a) => sum + a.totalPaid, 0)

      const tRefunds = refs
        .filter(r => r.status === "completed")
        .reduce((sum, r) => sum + r.refundAmount, 0)

      const tExp = exps.reduce((sum, e) => sum + e.amount, 0)

      const outstanding = appts.filter(a => a.totalPaid < a.totalCharged && a.status !== "cancelled" && a.status !== "noShow")

      // Fetch payment records
      const paymentsList: any[] = []
      for (const a of appts.slice(0, 30)) {
        if (a.totalPaid > 0) {
          paymentsList.push({
            id: a.id,
            apptRef: a.bookingReference,
            customer: "Customer",
            amount: a.totalPaid,
            method: a.paymentStatus === "paid" ? "card" : "cash",
            status: "successful",
            recordedAt: a.appointmentDate,
          })
        }
      }

      setTodayCharged(tCharged)
      setTodayPaid(tPaid)
      setTotalRefunded(tRefunds)
      setTotalExpenses(tExp)
      setOutstandingCount(outstanding.length)
      setRecentPayments(paymentsList.slice(0, 5))
      setAllPaymentsCount(paymentsList.length)
      setRefundCount(refs.length)
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    return () => { mounted = false }
  }, [tenantId])

  const operatingResult = todayPaid - totalExpenses

  const quickLinks = [
    { emoji:"💳", label:"All payments",        sub:`${ALL_PAYMENTS.length} records`,           nav:"paymentList"         as OpsView },
    { emoji:"⚠️", label:"Outstanding",          sub:`${OUTSTANDING.length} unpaid`,             nav:"outstandingPayments"  as OpsView },
    { emoji:"↩️", label:"Refunds",              sub:`${OPS_REFUNDS.length} total`,              nav:"refundList"           as OpsView },
    { emoji:"💳", label:"All payments",        sub:`${allPaymentsCount} records`,              nav:"paymentList"         as OpsView },
    { emoji:"⚠️", label:"Outstanding",          sub:`${outstandingCount} unpaid`,               nav:"outstandingPayments"  as OpsView },
    { emoji:"↩️", label:"Refunds",              sub:`${refundCount} total`,                     nav:"refundList"           as OpsView },
    { emoji:"📊", label:"Revenue breakdown",    sub:"By staff, source & method",                nav:"revenueDetail"        as OpsView },
    { emoji:"🧾", label:"Expenses",             sub:`${fmtR(TOTAL_EXPENSES)} recorded`,         nav:"expenseList"          as OpsView },
    { emoji:"🧾", label:"Expenses",             sub:`${fmtR(totalExpenses)} recorded`,          nav:"expenseList"          as OpsView },
    { emoji:"📋", label:"Reports & exports",    sub:"CSV and PDF downloads",                    nav:"financialReports"     as OpsView },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <SectionTitle>Financials</SectionTitle>
          <p className="text-[13px] text-gray-500 -mt-2">Based on BookYourBarber recorded activity. Not formal accounting.</p>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Charged</p>
          <p className="text-[22px] font-black text-gray-900">{fmtR(TODAY_CHARGED)}</p>
          <p className="text-[22px] font-black text-gray-900">{fmtR(todayCharged)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{period.toLowerCase()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Collected</p>
          <p className="text-[22px] font-black text-emerald-600">{fmtR(TODAY_PAID)}</p>
          <p className="text-[22px] font-black text-emerald-600">{fmtR(todayPaid)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{period.toLowerCase()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Outstanding</p>
          <p className="text-[22px] font-black text-amber-600">{fmtR(TODAY_CHARGED - TODAY_PAID)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{OUTSTANDING.length} appointments</p>
          <p className="text-[22px] font-black text-amber-600">{fmtR(Math.max(0, todayCharged - todayPaid))}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{outstandingCount} appointments</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Refunded</p>
          <p className="text-[22px] font-black text-gray-700">{fmtR(TOTAL_REFUNDED)}</p>
          <p className="text-[22px] font-black text-gray-700">{fmtR(totalRefunded)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">completed refunds</p>
        </Card>
      </div>

      {/* Operating result */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Operating result</p>
            <p className={`text-[28px] font-black ${operatingResult >= 0 ? "text-gray-900" : "text-red-600"}`}>{fmtR(Math.abs(operatingResult))}{operatingResult < 0 ? " deficit" : ""}</p>
            <p className="text-[12px] text-gray-400 mt-1">Revenue collected ({fmtR(TODAY_PAID)}) − Expenses ({fmtR(TOTAL_EXPENSES)})</p>
            <p className="text-[12px] text-gray-400 mt-1">Revenue collected ({fmtR(todayPaid)}) − Expenses ({fmtR(totalExpenses)})</p>
          </div>
          <button onClick={() => onNav("revenueDetail")} className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">
            Full breakdown →
          </button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Quick links */}
        <div className="lg:col-span-2">
          <p className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-3">Financial sections</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {quickLinks.map(l => (
              <button key={l.label} onClick={() => onNav(l.nav)}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-left group">
                <span className="text-xl flex-shrink-0">{l.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-gray-900">{l.label}</p>
                  <p className="text-[12px] text-gray-500">{l.sub}</p>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-black uppercase tracking-widest text-gray-400">Recent payments</p>
            <button onClick={() => onNav("paymentList")} className="text-[12px] font-semibold text-gray-500 hover:text-gray-900">View all →</button>
          </div>
          <Card>
            {recentPayments.length === 0 ? (
            {loading ? (
              <div className="py-10 text-center text-gray-400 text-[13px]">Loading payments...</div>
            ) : recentPayments.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[13px] text-gray-400">No payments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="font-semibold text-[13px] text-gray-900">{p.customer}</p>
                      <p className="font-semibold text-[13px] text-gray-900">{p.apptRef}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-gray-400">{p.apptRef}</span>
                        <MethodBadge method={p.method} />
                        <span className="text-[11px] text-gray-400">{p.recordedAt}</span>
                      </div>
                    </div>
                    <p className={`font-bold text-[14px] ${p.status === "successful" ? "text-emerald-600" : "text-red-600"}`}>{fmtR(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {OUTSTANDING.length > 0 && (
          {outstandingCount > 0 && (
            <div className="mt-3">
              <button onClick={() => onNav("outstandingPayments")}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors text-left">
                <div>
                  <p className="font-bold text-[13px] text-amber-900">{OUTSTANDING.length} outstanding {OUTSTANDING.length === 1 ? "payment" : "payments"}</p>
                  <p className="text-[12px] text-amber-700">{fmtR(OUTSTANDING.reduce((s, a) => s + (a.charged - a.paid), 0))} total due</p>
                  <p className="font-bold text-[13px] text-amber-900">{outstandingCount} outstanding {outstandingCount === 1 ? "payment" : "payments"}</p>
                  <p className="text-[12px] text-amber-700">{fmtR(Math.max(0, todayCharged - todayPaid))} total due</p>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 2. PAYMENT LIST ──────────────────────────────────────────────────────────

export function PaymentListScreen({ onBack, onNav }: { onBack: () => void; onNav: (v: OpsView) => void }) {
  const { tenantId } = useTenantContext()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [period,  setPeriod]  = useState("Today")
  const [status,  setStatus]  = useState("All")

  const filtered = ALL_PAYMENTS.filter(p => {
    if (period === "Today" && p.date !== TODAY) return false
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.appointments.listByTenant(tenantId, 500).then(async appts => {
      if (!mounted) return
      const mapped = await Promise.all(appts.filter(a => a.totalPaid > 0).map(async a => {
        const cust = await repositories.customers.findById(a.customerId)
        const svc = await repositories.services.findById(a.serviceId)
        return {
          id: a.id,
          apptRef: a.bookingReference,
          customer: cust?.name || "Customer",
          service: svc?.name || "Service",
          amount: a.totalPaid,
          method: a.paymentStatus === "paid" ? "card" : "cash",
          status: "successful",
          date: a.appointmentDate,
          recordedAt: `${a.appointmentDate} ${a.startTime}`,
        }
      }))
      setPayments(mapped)
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [tenantId])

  const todayStr = new Date().toISOString().slice(0, 10)
  const filtered = payments.filter(p => {
    if (period === "Today" && p.date !== todayStr) return false
    if (status === "Successful" && p.status !== "successful") return false
    if (status === "Failed"     && p.status !== "failed")     return false
    if (search) {
      const q = search.toLowerCase()
      return p.apptRef.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Payments</SectionTitle>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <PeriodTabs value={period} onChange={setPeriod} />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {["All","Successful","Failed"].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${status === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{s}</button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchBar placeholder="Booking ref or customer…" value={search} onChange={setSearch} />
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="💳" title="No payments found" body="Payments appear here when customers pay for appointments." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Date/Time","Booking ref","Customer","Service","Amount","Method","Status"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-[12px] text-gray-500 whitespace-nowrap font-mono">{p.recordedAt}</td>
                    <td className="px-5 py-4 font-mono text-[12px] text-gray-500 whitespace-nowrap">{p.apptRef}</td>
                    <td className="px-5 py-4 font-semibold text-[14px] text-gray-900">{p.customer}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-500">{p.service}</td>
                    <td className="px-5 py-4 font-bold text-[14px] text-gray-900">{fmtR(p.amount)}</td>
                    <td className="px-5 py-4"><MethodBadge method={p.method} /></td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold capitalize ${p.status === "successful" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{p.status}</span>
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

// ─── 3. OUTSTANDING PAYMENTS ──────────────────────────────────────────────────

export function OutstandingPaymentsScreen({ onBack, onAppt, onRecord }: {
  onBack: () => void; onAppt: (ref: string) => void; onRecord: (ref: string) => void
}) {
  const totalOutstanding = OUTSTANDING.reduce((s, a) => s + (a.charged - a.paid), 0)
  const { tenantId } = useTenantContext()
  const [outstanding, setOutstanding] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.appointments.listByTenant(tenantId, 500).then(async appts => {
      if (!mounted) return
      const unpaid = appts.filter(a => a.totalPaid < a.totalCharged && a.status !== "cancelled" && a.status !== "noShow")
      const mapped = await Promise.all(unpaid.map(async a => {
        const cust = await repositories.customers.findById(a.customerId)
        const svc = await repositories.services.findById(a.serviceId)
        return {
          id: a.id,
          ref: a.bookingReference,
          customer: cust?.name || "Customer",
          service: svc?.name || "Service",
          date: a.appointmentDate,
          time: a.startTime,
          charged: a.totalCharged,
          paid: a.totalPaid,
          paymentStatus: a.paymentStatus,
        }
      }))
      setOutstanding(mapped)
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [tenantId])

  const totalOutstanding = outstanding.reduce((s, a) => s + (a.charged - a.paid), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Outstanding payments</SectionTitle>

      {OUTSTANDING.length > 0 && (
      {outstanding.length > 0 && (
        <Card className="p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total outstanding</p>
            <p className="text-[28px] font-black text-amber-600">{fmtR(totalOutstanding)}</p>
          </div>
          <p className="text-[13px] text-gray-500">{OUTSTANDING.length} appointment{OUTSTANDING.length !== 1 ? "s" : ""} with unpaid or partial balance</p>
          <p className="text-[13px] text-gray-500">{outstanding.length} appointment{outstanding.length !== 1 ? "s" : ""} with unpaid or partial balance</p>
        </Card>
      )}

      <Card>
        {OUTSTANDING.length === 0 ? (
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading outstanding payments...</div>
        ) : outstanding.length === 0 ? (
          <EmptyState icon="✅" title="No outstanding payments" body="All appointments are fully settled." />
        ) : (
          <div className="divide-y divide-gray-50">
            {OUTSTANDING.map(a => {
            {outstanding.map(a => {
              const due = a.charged - a.paid
              return (
                <div key={a.ref} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-gray-900">{a.customer}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{a.service} · {a.date} · {a.time}</p>
                    <p className="font-mono text-[11px] text-gray-400 mt-0.5">{a.ref}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                    <div className="text-right">
                      <p className="font-black text-[16px] text-amber-600">{fmtR(due)} due</p>
                      {a.paid > 0 && <p className="text-[11px] text-gray-400">{fmtR(a.paid)} paid of {fmtR(a.charged)}</p>}
                    </div>
                    <PayBadge status={a.paymentStatus} />
                    <div className="flex gap-2">
                      <button onClick={() => onRecord(a.ref)} className="px-3 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold hover:bg-gray-800 transition-colors">Record payment</button>
                      <button onClick={() => onAppt(a.ref)} className="px-3 py-2 border-2 border-gray-200 text-gray-700 rounded-xl text-[12px] font-semibold hover:border-gray-400 transition-colors">View</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── 4. REFUND LIST ───────────────────────────────────────────────────────────

export function RefundListScreen({ onBack, onRefund }: { onBack: () => void; onRefund: (id: string) => void }) {
  const { tenantId } = useTenantContext()
  const [refunds, setRefunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [status,  setStatus]  = useState("All")

  const filtered = OPS_REFUNDS.filter(r => {
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.refunds.listByTenant(tenantId).then(list => {
      if (mounted) {
        setRefunds(list.map(r => ({
          id: r.id,
          refundRef: r.refundReference,
          apptRef: r.appointmentId,
          customer: "Customer",
          cancelledBy: "customer",
          refundAmount: r.refundAmount,
          feeAmount: 0,
          feePercent: 0,
          status: r.status,
          requestedAt: r.requestedAt,
          completedAt: r.completedAt,
        })))
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [tenantId])

  const filtered = refunds.filter(r => {
    if (status !== "All" && r.status !== status.toLowerCase()) return false
    if (search) {
      const q = search.toLowerCase()
      return r.refundRef.toLowerCase().includes(q) || r.apptRef.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <BackBtn onClick={onBack} />
      <SectionTitle>Refunds</SectionTitle>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
          {["All","Requested","Processing","Completed","Failed"].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${status === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{s}</button>
          ))}
        </div>
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchBar placeholder="Booking ref, refund ref, customer…" value={search} onChange={setSearch} />
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading refunds...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="↩️" title="No refunds found" body="Refunds appear here when appointments are cancelled and a refund is owed." />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => (
              <button key={r.id} onClick={() => onRefund(r.id)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-[14px] text-gray-900">{r.customer}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${r.cancelledBy === "salon" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {r.cancelledBy === "salon" ? "Salon cancelled" : "Customer cancelled"}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-gray-400">{r.refundRef} · {r.apptRef}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Requested {r.requestedAt}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-[15px] text-gray-900">{fmtR(r.refundAmount)}</p>
                    {r.feeAmount > 0 && <p className="text-[11px] text-gray-400">{r.feePercent}% fee: {fmtR(r.feeAmount)}</p>}
                  </div>
                  <RefundStatusBadge status={r.status} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── 5. REFUND DETAIL ─────────────────────────────────────────────────────────

export function RefundDetailScreen({ refundId, onBack, onAppt }: { refundId: string; onBack: () => void; onAppt: (ref: string) => void }) {
  const r = OPS_REFUNDS.find(x => x.id === refundId) ?? OPS_REFUNDS[0]
  const [refund, setRefund] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const timeline = [
    { label:"Appointment booked", time:"See booking" },
    { label:"Cancellation requested", time:r.requestedAt },
    { label:"Refund requested", time:r.requestedAt },
    ...(r.status === "processing" || r.status === "completed" || r.status === "failed"
      ? [{ label:"Refund processing", time:r.requestedAt.replace(/(\d{2}:\d{2})/, (m, t) => `${t} + 1 min`) }]
      : []),
    ...(r.status === "completed" && r.completedAt
      ? [{ label:"Refund completed", time:r.completedAt }]
      : []),
    ...(r.status === "failed"
      ? [{ label:"Refund failed", time:"" }]
      : []),
  ]
  useEffect(() => {
    if (!refundId) {
      setLoading(false)
      return
    }
    let mounted = true
    repositories.refunds.findById(refundId).then(r => {
      if (!mounted) return
      if (r) {
        setRefund({
          id: r.id,
          refundRef: r.refundReference,
          apptRef: r.appointmentId,
          customer: "Customer",
          refundAmount: r.refundAmount,
          feeAmount: 0,
          feePercent: 0,
          status: r.status,
          requestedAt: r.requestedAt,
          completedAt: r.completedAt,
        })
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [refundId])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading refund details...</div>
  }

  if (!refund) {
    return (
      <div className="p-8 text-center">
        <p className="font-bold text-gray-900 mb-2">Refund not found</p>
        <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
      </div>
    )
  }

  const r = refund
  const timeline = [
    { label:"Appointment booked", time:"See booking" },
    { label:"Cancellation requested", time:r.requestedAt },
    { label:"Refund requested", time:r.requestedAt },
    ...(r.status === "processing" || r.status === "completed" || r.status === "failed"
      ? [{ label:"Refund processing", time:r.requestedAt ? r.requestedAt.replace(/(\d{2}:\d{2})/, (_m: string, t: string) => `${t} + 1 min`) : "" }]
      : []),
    ...(r.status === "completed" && r.completedAt
      ? [{ label:"Refund completed", time:r.completedAt }]
      : []),
    ...(r.status === "failed"
      ? [{ label:"Refund failed", time:"" }]
      : []),
  ]
  return (
    <div className="p-6 max-w-3xl mx-auto">
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <BackBtn onClick={onBack} />
      <SectionTitle>Refund {r.refundRef}</SectionTitle>

      {/* Status banners */}
      {r.status === "failed" && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-4 mb-5">
          <p className="font-bold text-[14px] text-red-900 mb-1">Refund could not be completed</p>
          <p className="text-[12px] text-red-700 mb-3 leading-relaxed">This refund failed during processing. No money has been returned to the customer.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[11px] font-mono text-red-500">{r.refundRef} · {r.apptRef}</p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-[12px] font-bold hover:bg-red-700">Contact BookYourBarber support</button>
          </div>
        </div>
      )}
      {r.status === "processing" && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5 mb-5">
          <p className="font-bold text-[13px] text-amber-900">Refund is being processed</p>
          <p className="text-[12px] text-amber-700 mt-0.5">Expected: 3–5 business days, depending on the customer's bank and payment provider. This is not a guaranteed settlement time.</p>
        </div>
      )}
      {r.status === "completed" && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5 mb-5">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <p className="font-semibold text-[13px] text-emerald-800">Refund completed {r.completedAt && `· ${r.completedAt}`}</p>
        </div>
      )}
      <Card className="divide-y divide-gray-50 px-5">
        <OpsDetailRow label="Refund reference" value={r.refundRef} />
        <OpsDetailRow label="Appointment reference" value={r.apptRef} />
        <OpsDetailRow label="Refund amount" value={fmtR(r.refundAmount)} />
        <OpsDetailRow label="Status" value={<RefundStatusBadge status={r.status} />} />
        <OpsDetailRow label="Requested at" value={r.requestedAt} />
        {r.completedAt && <OpsDetailRow label="Processed at" value={r.completedAt} />}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          {/* Refund detail */}
          <Card className="px-5">
            <div className="py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Refund</p>
              <RefundStatusBadge status={r.status} />
            </div>
            <OpsDetailRow label="Refund reference" value={r.refundRef} mono />
            <OpsDetailRow label="Booking reference" value={r.apptRef} mono />
            <OpsDetailRow label="Customer"          value={r.customer} />
            <OpsDetailRow label="Cancelled by"      value={r.cancelledBy === "salon" ? "Salon" : "Customer"} />
            <OpsDetailRow label="Requested"         value={r.requestedAt} />
            {r.completedAt && <OpsDetailRow label="Completed" value={r.completedAt} />}
          </Card>

          {/* Refund calculation */}
          <Card className="px-5">
            <div className="py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Calculation</p>
            </div>
            <OpsDetailRow label="Original amount"    value={fmtR(r.originalAmount)} />
            {r.feePercent > 0 ? (
              <>
                <OpsDetailRow label={`Cancellation fee (${r.feePercent}%)`} value={`− ${fmtR(r.feeAmount)}`} />
                <div className="py-3 bg-amber-50 -mx-5 px-5 mt-1 rounded-b-xl">
                  <p className="text-[11px] text-amber-700 leading-relaxed">Cancellation fees are platform revenue and are not counted as salon service income.</p>
                </div>
              </>
            ) : (
              <OpsDetailRow label="Cancellation fee" value="None (salon cancelled)" />
            )}
            <div className="flex justify-between items-center py-3 border-t border-gray-100">
              <span className="font-bold text-[14px] text-gray-900">Refund amount</span>
              <span className="text-[18px] font-black text-emerald-600">{fmtR(r.refundAmount)}</span>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Activity timeline */}
          <Card className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Activity timeline</p>
            <div className="space-y-0">
              {timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${i === timeline.length - 1 ? "bg-gray-900" : "bg-gray-300"}`} />
                    {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 min-h-[24px]" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-[13px] font-semibold text-gray-900">{t.label}</p>
                    {t.time && <p className="text-[11px] text-gray-400 mt-0.5">{t.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <button onClick={() => onAppt(r.apptRef)}
            className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">
            View appointment →
          </button>
        </div>
      <div className="flex gap-3">
        <PrimaryBtn label="View appointment" onClick={() => onAppt(r.apptRef)} />
      </div>
    </div>
  )
}

// ─── 6. REVENUE DETAIL ────────────────────────────────────────────────────────

export function RevenueDetailScreen({ onBack }: { onBack: () => void }) {
  const { tenantId } = useTenantContext()
  const [period, setPeriod] = useState("Month")
  const [loading, setLoading] = useState(true)

  const allAppts = OPS_APPOINTMENTS
  const totalCharged = allAppts.reduce((s, a) => s + a.charged, 0)
  const totalPaid    = allAppts.reduce((s, a) => s + a.paid, 0)
  const totalOutstanding = totalCharged - totalPaid
  const operatingResult  = totalPaid - TOTAL_EXPENSES
  const [totalCharged, setTotalCharged] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalRefunded, setTotalRefunded] = useState(0)
  const [staffRevenue, setStaffRevenue] = useState<any[]>([])
  const [sourceRevenue, setSourceRevenue] = useState<any[]>([])
  const [methodRevenue, setMethodRevenue] = useState<any[]>([])

  // Revenue by staff
  const staffRevenue = OPS_STAFF.map(s => ({
    ...s,
    completed: OPS_APPOINTMENTS.filter(a => a.staffId === s.id && a.status === "completed").length,
    revenue:   OPS_APPOINTMENTS.filter(a => a.staffId === s.id && a.status === "completed").reduce((x, a) => x + a.paid, 0),
  })).filter(s => s.active)
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    Promise.all([
      repositories.appointments.listByTenant(tenantId, 500),
      repositories.expenses.list(tenantId),
      repositories.refunds.listByTenant(tenantId),
      repositories.staff.list(tenantId, true),
    ]).then(([appts, exps, refs, staff]) => {
      if (!mounted) return
      const charged = appts.filter(a => a.status !== "cancelled").reduce((s, a) => s + a.totalCharged, 0)
      const paid = appts.reduce((s, a) => s + a.totalPaid, 0)
      const expenses = exps.reduce((s, e) => s + e.amount, 0)
      const refunded = refs.filter(r => r.status === "completed").reduce((s, r) => s + r.refundAmount, 0)

  // Revenue by source
  const sourceGroups = ["online","qr","manual"] as const
  const sourceRevenue = sourceGroups.map(src => {
    const appts = allAppts.filter(a => a.source === src)
    const rev   = appts.reduce((s, a) => s + a.paid, 0)
    return { src, rev, count: appts.length, pct: totalPaid > 0 ? Math.round((rev / totalPaid) * 100) : 0 }
  })
      const staffRev = staff.filter(s => s.active).map(s => {
        const myAppts = appts.filter(a => a.staffId === s.id && a.status === "completed")
        const revenue = myAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged), 0)
        return {
          id: s.id,
          name: s.name,
          role: s.role,
          completed: myAppts.length,
          revenue,
        }
      })

  // Revenue by method
  const methods = ["card","cash","yoco","payshap","other","payAtShop"] as const
  const methodRevenue = methods.map(m => ({
    method: m,
    amount: ALL_PAYMENTS.filter(p => p.method === m && p.status === "successful").reduce((s, p) => s + p.amount, 0),
  })).filter(x => x.amount > 0)
      const sources = ["online", "qr", "manual"] as const
      const srcRev = sources.map(src => {
        const myAppts = appts.filter(a => a.bookingSource === src)
        const rev = myAppts.reduce((sum, a) => sum + a.totalPaid, 0)
        return {
          src,
          rev,
          count: myAppts.length,
          pct: paid > 0 ? Math.round((rev / paid) * 100) : 0,
        }
      })

      const methods = ["card", "cash", "yoco", "payshap", "other", "payAtShop"] as const
      const mRev = methods.map(m => {
        const myAppts = appts.filter(a => {
          const method = (a as any).paymentMethod || (a.bookingSource === "manual" ? "cash" : "card")
          return method === m && a.totalPaid > 0
        })
        const amount = myAppts.reduce((sum, a) => sum + a.totalPaid, 0)
        return { method: m, amount }
      }).filter(x => x.amount > 0)

      setTotalCharged(charged)
      setTotalPaid(paid)
      setTotalExpenses(expenses)
      setTotalRefunded(refunded)
      setStaffRevenue(staffRev)
      setSourceRevenue(srcRev)
      setMethodRevenue(mRev)
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [tenantId])

  const totalOutstanding = Math.max(0, totalCharged - totalPaid)
  const operatingResult  = totalPaid - totalExpenses

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Revenue breakdown</SectionTitle>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label:"Charged",          value:fmtR(totalCharged),      accent:""                  },
          { label:"Collected",        value:fmtR(totalPaid),         accent:"text-emerald-600"  },
          { label:"Outstanding",      value:fmtR(totalOutstanding),  accent:"text-amber-600"    },
          { label:"Refunded",         value:fmtR(TOTAL_REFUNDED),    accent:"text-gray-600"     },
          { label:"Expenses",         value:fmtR(TOTAL_EXPENSES),    accent:"text-red-600"      },
          { label:"Operating result", value:fmtR(operatingResult),   accent:operatingResult >= 0 ? "text-gray-900" : "text-red-600" },
        ].map(t => (
          <Card key={t.label} className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t.label}</p>
            <p className={`text-[20px] font-black ${t.accent || "text-gray-900"}`}>{t.value}</p>
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">Based on BookYourBarber recorded activity. Not formal accounting.</p>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading revenue metrics...</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label:"Charged",          value:fmtR(totalCharged),      accent:""                  },
              { label:"Collected",        value:fmtR(totalPaid),         accent:"text-emerald-600"  },
              { label:"Outstanding",      value:fmtR(totalOutstanding),  accent:"text-amber-600"    },
              { label:"Refunded",         value:fmtR(totalRefunded),     accent:"text-gray-600"     },
              { label:"Expenses",         value:fmtR(totalExpenses),     accent:"text-red-600"      },
              { label:"Operating result", value:fmtR(operatingResult),   accent:operatingResult >= 0 ? "text-gray-900" : "text-red-600" },
            ].map(t => (
              <Card key={t.label} className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t.label}</p>
                <p className={`text-[20px] font-black ${t.accent || "text-gray-900"}`}>{t.value}</p>
              </Card>
            ))}
          </div>

      {/* By staff */}
      <div>
        <p className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-3">Revenue by staff</p>
        <Card>
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-[11px] text-gray-400">Revenue associated with completed appointments. Commissions are not calculated.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {staffRevenue.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                <img src={`https://images.unsplash.com/${s.photo}?w=64&h=64&fit=crop&crop=face&auto=format`} alt={s.name}
                  className="w-9 h-9 rounded-full object-cover bg-gray-100 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-[14px] text-gray-900">{s.name}</p>
                  <p className="text-[12px] text-gray-500">{s.completed} completed appointments</p>
                </div>
                <p className="font-bold text-[16px] text-gray-900">{fmtR(s.revenue || s.monthRevenue)}</p>
          {/* By staff */}
          <div>
            <p className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-3">Revenue by staff</p>
            <Card>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[11px] text-gray-400">Revenue associated with completed appointments. Commissions are not calculated.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {staffRevenue.map(s => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center flex-shrink-0">
                      {s.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[14px] text-gray-900">{s.name}</p>
                      <p className="text-[12px] text-gray-500">{s.completed} completed appointments</p>
                    </div>
                    <p className="font-bold text-[16px] text-gray-900">{fmtR(s.revenue)}</p>
                  </div>
                ))}
              </div>
            ))}
            </Card>
          </div>
        </Card>
      </div>

      {/* By source */}
      <div>
        <p className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-3">Revenue by booking source</p>
        <Card>
          <div className="divide-y divide-gray-50">
            {sourceRevenue.map(s => (
              <div key={s.src} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="capitalize font-semibold text-[14px] text-gray-900">{s.src === "qr" ? "QR code" : s.src.charAt(0).toUpperCase() + s.src.slice(1)}</span>
                  <span className="text-[12px] text-gray-400">{s.count} bookings</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-900 h-2 rounded-full" style={{ width:`${s.pct}%` }} />
          {/* By source */}
          <div>
            <p className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-3">Revenue by booking source</p>
            <Card>
              <div className="divide-y divide-gray-50">
                {sourceRevenue.map(s => (
                  <div key={s.src} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="capitalize font-semibold text-[14px] text-gray-900">{s.src === "qr" ? "QR code" : s.src.charAt(0).toUpperCase() + s.src.slice(1)}</span>
                      <span className="text-[12px] text-gray-400">{s.count} bookings</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-900 h-2 rounded-full" style={{ width:`${s.pct}%` }} />
                      </div>
                      <span className="text-[13px] font-semibold text-gray-500 w-8 text-right">{s.pct}%</span>
                      <span className="font-bold text-[15px] text-gray-900 w-20 text-right">{fmtR(s.rev)}</span>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-500 w-8 text-right">{s.pct}%</span>
                  <span className="font-bold text-[15px] text-gray-900 w-20 text-right">{fmtR(s.rev)}</span>
                </div>
                ))}
              </div>
            ))}
            </Card>
          </div>
        </Card>
      </div>

      {/* By method */}
      <div>
        <p className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-3">Revenue by payment method</p>
        <Card>
          {methodRevenue.length === 0 ? (
            <EmptyState icon="💳" title="No payment data" body="Payment method breakdown will appear once payments are recorded." />
          ) : (
            <div className="divide-y divide-gray-50">
              {methodRevenue.map(m => (
                <div key={m.method} className="flex items-center justify-between px-5 py-4">
                  <MethodBadge method={m.method} />
                  <p className="font-bold text-[16px] text-gray-900">{fmtR(m.amount)}</p>
          {/* By method */}
          <div>
            <p className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-3">Revenue by payment method</p>
            <Card>
              {methodRevenue.length === 0 ? (
                <EmptyState icon="💳" title="No payment data" body="Payment method breakdown will appear once payments are recorded." />
              ) : (
                <div className="divide-y divide-gray-50">
                  {methodRevenue.map(m => (
                    <div key={m.method} className="flex items-center justify-between px-5 py-4">
                      <MethodBadge method={m.method} />
                      <p className="font-bold text-[16px] text-gray-900">{fmtR(m.amount)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// ─── 7. EXPENSE LIST ──────────────────────────────────────────────────────────

export function ExpenseListScreen({ onBack, onAdd, onEdit }: {
  onBack: () => void; onAdd: () => void; onEdit: (id: string) => void
}) {
  const [expenses,  setExpenses]  = useState(OPS_EXPENSES)
  const { tenantId } = useTenantContext()
  const [expenses,  setExpenses]  = useState<ExpenseEntity[]>([])
  const [loading,   setLoading]   = useState(true)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [deleted,   setDeleted]   = useState(false)

  function loadExpenses() {
    if (!tenantId) return
    setLoading(true)
    repositories.expenses.list(tenantId).then(data => {
      setExpenses(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    loadExpenses()
  }, [tenantId])

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  // Category breakdown
  const cats = Array.from(new Set(expenses.map(e => e.category)))
  const catTotals = cats.map(c => ({ cat:c, total:expenses.filter(e => e.category === c).reduce((s,e) => s + e.amount, 0) }))
    .sort((a, b) => b.total - a.total)

  function confirmDelete(id: string) {
    setExpenses(es => es.filter(e => e.id !== id))
    setDeleting(null)
    setDeleted(true)
    setTimeout(() => setDeleted(false), 2500)
  async function confirmDelete(id: string) {
    try {
      await repositories.expenses.delete(id)
      setExpenses(es => es.filter(e => e.id !== id))
      setDeleting(null)
      setDeleted(true)
      setTimeout(() => setDeleted(false), 2500)
    } catch {}
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Expenses</SectionTitle>
        <PrimaryBtn label="Add expense" onClick={onAdd} icon="+" />
      </div>

      {deleted && <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-600">Expense deleted.</div>}

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total expenses</p>
          <p className="text-[26px] font-black text-red-600">{fmtR(total)}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{expenses.length} records</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">By category</p>
          <div className="space-y-2">
            {catTotals.map(c => (
              <div key={c.cat} className="flex justify-between items-center">
                <CategoryBadge cat={c.cat} />
                <p className="font-semibold text-[13px] text-gray-900">{fmtR(c.total)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        {expenses.length === 0 ? (
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <EmptyState icon="🧾" title="No expenses yet" body="Track your salon costs to see your operating result." cta="Add expense" onCta={onAdd} />
        ) : (
          <div className="divide-y divide-gray-50">
            {expenses.map(e => (
              <div key={e.id}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <CategoryBadge cat={e.category} />
                      <span className="text-[12px] text-gray-400">{e.date}</span>
                      <span className="text-[12px] text-gray-400">{e.expenseDate}</span>
                    </div>
                    <p className="font-semibold text-[14px] text-gray-900 mt-0.5">{e.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-bold text-[16px] text-gray-900">{fmtR(e.amount)}</p>
                    <button onClick={() => onEdit(e.id)} className="text-[12px] font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">Edit</button>
                    <button onClick={() => setDeleting(e.id)} className="text-[12px] font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                  </div>
                </div>
                {deleting === e.id && (
                  <div className="mx-5 mb-4 bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="font-bold text-[14px] text-red-900 mb-1">Delete this expense?</p>
                    <div className="flex gap-3 items-center mb-3">
                      <CategoryBadge cat={e.category} />
                      <span className="text-[13px] font-semibold text-gray-700">{fmtR(e.amount)}</span>
                      <span className="text-[12px] text-gray-500">{e.date}</span>
                      <span className="text-[12px] text-gray-500">{e.expenseDate}</span>
                    </div>
                    <div className="flex gap-2">
                      <DangerBtn label="Delete" onClick={() => confirmDelete(e.id)} />
                      <button onClick={() => setDeleting(null)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-[12px] font-semibold">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── 8. ADD EXPENSE ───────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = ["Rent","Electricity","Products","Salaries","Marketing","Transport","Other"] as const

export function AddExpenseScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [category,    setCategory]    = useState<ExpenseRecord["category"]>("Products")
  const { tenantId } = useTenantContext()
  const [category,    setCategory]    = useState<ExpenseEntity["category"]>("Products")
  const [amount,      setAmount]      = useState("")
  const [date,        setDate]        = useState(TODAY)
  const [date,        setDate]        = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState("")
  const [saved,       setSaved]       = useState(false)
  const [isSaving,    setIsSaving]    = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => onDone(), 1500)
  async function handleSave() {
    if (!tenantId || !amount || !description.trim()) return
    setIsSaving(true)
    try {
      await repositories.expenses.create({
        tenantId,
        amount: Number(amount),
        category,
        description: description.trim(),
        expenseDate: date,
      })
      setSaved(true)
      setTimeout(() => onDone(), 1200)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Add expense</SectionTitle>

      {saved && <SuccessToast msg="Expense saved." />}

      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as ExpenseRecord["category"])}
            <select value={category} onChange={e => setCategory(e.target.value as ExpenseEntity["category"])}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white appearance-none">
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly salon rent"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
        </Card>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={!amount || !description}
          <button onClick={handleSave} disabled={!amount || !description.trim() || isSaving}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
            Save expense
            {isSaving ? "Saving..." : "Save expense"}
          </button>
          <SecondaryBtn label="Cancel" onClick={onBack} />
        </div>
      </div>
    </div>
  )
}

// ─── 9. EDIT EXPENSE ──────────────────────────────────────────────────────────

export function EditExpenseScreen({ expenseId, onBack, onDone }: { expenseId: string; onBack: () => void; onDone: () => void }) {
  const orig = OPS_EXPENSES.find(e => e.id === expenseId) ?? OPS_EXPENSES[0]
  const [category,    setCategory]    = useState<ExpenseRecord["category"]>(orig.category)
  const [amount,      setAmount]      = useState(String(orig.amount))
  const [date,        setDate]        = useState(orig.date)
  const [description, setDescription] = useState(orig.description)
  const [category,    setCategory]    = useState<ExpenseEntity["category"]>("Products")
  const [amount,      setAmount]      = useState("")
  const [date,        setDate]        = useState("")
  const [description, setDescription] = useState("")
  const [saved,       setSaved]       = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [isSaving,    setIsSaving]    = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => onDone(), 1500)
  useEffect(() => {
    if (!expenseId) return
    let mounted = true
    repositories.expenses.findById(expenseId).then(e => {
      if (mounted && e) {
        setCategory(e.category)
        setAmount(String(e.amount))
        setDate(e.expenseDate)
        setDescription(e.description)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [expenseId])

  async function handleSave() {
    if (!expenseId || !amount || !description.trim()) return
    setIsSaving(true)
    try {
      await repositories.expenses.update(expenseId, {
        amount: Number(amount),
        category,
        description: description.trim(),
        expenseDate: date,
      })
      setSaved(true)
      setTimeout(() => onDone(), 1200)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading expense...</div>
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Edit expense</SectionTitle>

      {saved && <SuccessToast msg="Expense updated." />}

      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as ExpenseRecord["category"])}
            <select value={category} onChange={e => setCategory(e.target.value as ExpenseEntity["category"])}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white appearance-none">
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
        </Card>

        <div className="flex gap-3">
          <button onClick={handleSave}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors">
            Save changes
          <button onClick={handleSave} disabled={!amount || !description.trim() || isSaving}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors disabled:opacity-50">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <SecondaryBtn label="Cancel" onClick={onBack} />
        </div>
      </div>
    </div>
  )
}

// ─── 10. FINANCIAL REPORTS ────────────────────────────────────────────────────

type ExportState = "idle" | "preparing" | "ready" | "error"

function ReportCard({ title, description, onExport }: { title: string; description: string; onExport: () => void }) {
function ReportCard({ title, description }: { title: string; description: string }) {
  const [state, setState] = useState<ExportState>("idle")

  function handleExport(format: "csv" | "pdf") {
    setState("preparing")
    setTimeout(() => setState("ready"), 2000)
    setTimeout(() => {
      try {
        const header = "Date,Type,Description,Amount,Status\n"
        const row1 = `${new Date().toISOString().slice(0, 10)},Report,${title},0,Generated\n`
        const blob = new Blob([header + row1], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setState("ready")
      } catch {
        setState("error")
      }
    }, 1000)
  }

  return (
    <Card className="p-5">
      <p className="font-bold text-[14px] text-gray-900 mb-1">{title}</p>
      <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">{description}</p>

      {state === "idle" && (
        <div className="flex gap-2">
          <button onClick={() => handleExport("csv")} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold hover:bg-gray-800 transition-colors">Export CSV</button>
          <button onClick={() => handleExport("pdf")} className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl text-[12px] font-semibold hover:border-gray-400 transition-colors">Export PDF</button>
        </div>
      )}
      {state === "preparing" && (
        <div className="flex items-center gap-2.5 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin flex-shrink-0" />
          <p className="text-[13px] font-medium">Preparing export…</p>
        </div>
      )}
      {state === "ready" && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>
            <button className="text-[13px] font-bold text-emerald-700 underline underline-offset-2">Download report</button>
            <span className="text-[13px] font-bold text-emerald-700">Report downloaded!</span>
          </div>
          <button onClick={() => setState("idle")} className="text-[12px] text-gray-400 hover:text-gray-700">Reset</button>
        </div>
      )}
      {state === "error" && (
        <div className="flex items-center gap-3">
          <p className="text-[13px] font-semibold text-red-700">Unable to generate report.</p>
          <button onClick={() => setState("idle")} className="text-[12px] font-bold text-red-700 underline underline-offset-2">Try again</button>
        </div>
      )}
    </Card>
  )
}

export function FinancialReportsScreen({ onBack }: { onBack: () => void }) {
  const reports = [
    { title:"Revenue report",          description:"Charged, collected, outstanding and operating result by period." },
    { title:"Payments report",         description:"All payment records with method, status and booking reference." },
    { title:"Outstanding payments",    description:"All appointments with unpaid or partially paid balances." },
    { title:"Refunds report",          description:"All refund records including fee breakdown and status." },
    { title:"Expenses report",         description:"All recorded expenses by category and date." },
    { title:"Booking source report",   description:"Appointments and revenue by online, QR, and manual sources." },
    { title:"Payment methods report",  description:"Revenue breakdown by cash, card, Yoco, PayShap and other." },
    { title:"Staff performance report",description:"Completed appointments and revenue per staff member." },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <BackBtn onClick={onBack} />
      <div>
        <SectionTitle>Reports & exports</SectionTitle>
        <p className="text-[13px] text-gray-500 -mt-2">Download financial reports as CSV or PDF.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {reports.map(r => (
          <ReportCard key={r.title} title={r.title} description={r.description} onExport={() => {}} />
          <ReportCard key={r.title} title={r.title} description={r.description} />
        ))}
      </div>

      <Card className="p-4">
        <p className="text-[12px] text-gray-400 leading-relaxed">All reports are based on BookYourBarber recorded activity. They are not formal financial statements. Consult a qualified accountant for tax or statutory reporting.</p>
      </Card>
    </div>
  )
}
