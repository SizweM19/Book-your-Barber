import React, { useState } from "react"
import React, { useState, useEffect } from "react"
import type { OpsView } from "./types"
import { OPS_CUSTOMERS, OPS_APPOINTMENTS } from "./data"
import { repositories } from "@/infrastructure/repositories/container"
import { useTenantContext } from "@/application/tenant"
import type { CustomerEntity } from "@/application/repositories/interfaces"
import {
  fmtR, Card, SectionTitle, OpsDetailRow, ApptBadge, PayBadge,
  SearchBar, PrimaryBtn, SecondaryBtn, BackBtn, EmptyState,
  SearchBar, PrimaryBtn, SecondaryBtn, DangerBtn, BackBtn, EmptyState,
} from "./shared"

// ─── SEGMENT CONFIG ───────────────────────────────────────────────────────────

const SEGMENTS = [
  { key:"all",       label:"All"        },
  { key:"new",       label:"New"        },
  { key:"returning", label:"Returning"  },
  { key:"regular",   label:"Regular"    },
  { key:"vip",       label:"VIP"        },
  { key:"atRisk",    label:"At Risk"    },
  { key:"inactive",  label:"Inactive"   },
] as const

type SegmentKey = typeof SEGMENTS[number]["key"]

function SegmentBadge({ segment }: { segment: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    new:       { bg:"bg-blue-50",    text:"text-blue-700"   },
    returning: { bg:"bg-indigo-50",  text:"text-indigo-700" },
    regular:   { bg:"bg-emerald-50", text:"text-emerald-700"},
    vip:       { bg:"bg-amber-50",   text:"text-amber-700"  },
    atRisk:    { bg:"bg-red-50",     text:"text-red-600"    },
    inactive:  { bg:"bg-gray-100",   text:"text-gray-500"   },
  }
  const labels: Record<string, string> = {
    new:"New", returning:"Returning", regular:"Regular", vip:"VIP", atRisk:"At Risk", inactive:"Inactive"
  }
  const c = map[segment] ?? { bg:"bg-gray-100", text:"text-gray-500" }
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${c.bg} ${c.text}`}>{labels[segment] ?? segment}</span>
}

// ─── CUSTOMER LIST ────────────────────────────────────────────────────────────

export function CustomerListScreen({ onNav, onCustomer }: {
  onNav: (v: OpsView) => void; onCustomer: (id: string) => void
}) {
  const { tenantId } = useTenantContext()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [segment, setSegment] = useState<SegmentKey>("all")

  const filtered = OPS_CUSTOMERS.filter(c => {
  // Add customer modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  function loadCustomers() {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      repositories.customers.list(tenantId),
      repositories.appointments.listByTenant(tenantId, 500),
    ]).then(([custs, appts]) => {
      const customerStats = custs.map(c => {
        const myAppts = appts.filter(a => a.customerId === c.id)
        const nonCancelled = myAppts.filter(a => a.status !== "cancelled" && a.status !== "noShow")
        const visits = myAppts.filter(a => a.status === "completed").length || nonCancelled.length
        const totalSpend = myAppts.reduce((sum, a) => sum + (a.totalPaid || 0), 0)
        const sortedAppts = [...myAppts].sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
        const lastVisit = sortedAppts[0]?.appointmentDate || "—"
        const outstandingBalance = nonCancelled.reduce((sum, a) => sum + Math.max(0, a.totalCharged - a.totalPaid), 0)
        return {
          ...c,
          visits,
          totalSpend,
          lastVisit,
          outstandingBalance,
        }
      })
      setCustomers(customerStats)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    loadCustomers()
  }, [tenantId])

  async function handleCreateCustomer() {
    if (!tenantId || !newName.trim() || !newPhone.trim()) return
    setIsCreating(true)
    setCreateError(null)
    try {
      const created = await repositories.customers.create({
        tenantId,
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        notes: newNotes.trim() || undefined,
        segment: "new",
      })
      setShowAddModal(false)
      setNewName("")
      setNewPhone("")
      setNewEmail("")
      setNewNotes("")
      loadCustomers()
      onCustomer(created.id)
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create customer.")
    } finally {
      setIsCreating(false)
    }
  }

  const filtered = customers.filter(c => {
    if (segment !== "all" && c.segment !== segment) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
        (c.email ? c.email.toLowerCase().includes(q) : false)
      )
    }
    return true
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Customers</SectionTitle>
        <PrimaryBtn label="Add customer" onClick={() => onNav("createAppt")} icon="+" />
        <PrimaryBtn label="Add customer" onClick={() => setShowAddModal(true)} icon="+" />
      </div>

      {/* Segment tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl w-fit">
        {SEGMENTS.map(s => (
          <button key={s.key} onClick={() => setSegment(s.key)}
            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${segment === s.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {s.label}
            {s.key !== "all" && (
              <span className="ml-1.5 text-[10px] text-gray-400">{OPS_CUSTOMERS.filter(c => c.segment === s.key).length}</span>
              <span className="ml-1.5 text-[10px] text-gray-400">{customers.filter(c => c.segment === s.key).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-sm">
        <SearchBar placeholder="Name, phone or email…" value={search} onChange={setSearch} />
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[18px] text-gray-900">Add new customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            {createError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700">
                {createError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Full name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Sipho Sithole"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Phone number *</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="e.g. 082 123 4567"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. sipho@example.co.za"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Notes (optional)</label>
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Special preferences, clipper guard preferences, etc."
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={!newName.trim() || !newPhone.trim() || isCreating}
                onClick={handleCreateCustomer}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-[14px] hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isCreating ? "Saving..." : "Save customer"}
              </button>
              <SecondaryBtn label="Cancel" onClick={() => setShowAddModal(false)} />
            </div>
          </div>
        </div>
      )}

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="👤" title="No customers found" body="Try adjusting the search or filter." />
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👤" title="No customers found" body="Try adjusting the search or filter, or add a new customer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Customer","Phone","Segment","Visits","Total spend","Last visit","Outstanding"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => onCustomer(c.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[13px] text-gray-700 flex-shrink-0">{c.name[0]}</div>
                        <div>
                          <p className="font-semibold text-[14px] text-gray-900">{c.name}</p>
                          <p className="text-[12px] text-gray-400">{c.email}</p>
                          {c.email && <p className="text-[12px] text-gray-400">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap">{c.phone}</td>
                    <td className="px-5 py-4"><SegmentBadge segment={c.segment} /></td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-gray-900">{c.visits}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-gray-900">{fmtR(c.totalSpend)}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-500">{c.lastVisit}</td>
                    <td className="px-5 py-4">
                      {c.outstandingBalance > 0 ? (
                        <span className="text-[13px] font-bold text-red-600">{fmtR(c.outstandingBalance)}</span>
                      ) : (
                        <span className="text-[12px] text-gray-300">—</span>
                      )}
                    </td>
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

// ─── CUSTOMER PROFILE ─────────────────────────────────────────────────────────

type ProfileTab = "history" | "payments" | "packages" | "loyalty" | "communications"

export function CustomerProfileScreen({ customerId, onBack, onAppt }: {
  customerId: string; onBack: () => void; onAppt: (ref: string) => void
export function CustomerProfileScreen({ customerId, onBack, onAppt, onNav }: {
  customerId: string; onBack: () => void; onAppt: (ref: string) => void; onNav?: (v: OpsView) => void
}) {
  const cust = OPS_CUSTOMERS.find(c => c.id === customerId)
  const [cust, setCust] = useState<any>(null)
  const [custAppts, setCustAppts] = useState<any[]>([])
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ProfileTab>("history")

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editSegment, setEditSegment] = useState<string>("regular")
  const [isSaving, setIsSaving] = useState(false)

  function loadCustomerDetails() {
    if (!customerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    repositories.customers.findById(customerId).then(async dbCust => {
      if (!dbCust) {
        setCust(null)
        setLoading(false)
        return
      }

      setEditName(dbCust.name)
      setEditPhone(dbCust.phone)
      setEditEmail(dbCust.email || "")
      setEditNotes(dbCust.notes || "")
      setEditSegment(dbCust.segment)

      const appts = await repositories.appointments.listByTenant(dbCust.tenantId, 500)
      const myAppts = appts.filter(a => a.customerId === dbCust.id)
      const nonCancelled = myAppts.filter(a => a.status !== "cancelled" && a.status !== "noShow")
      const visits = myAppts.filter(a => a.status === "completed").length || nonCancelled.length
      const totalSpend = myAppts.reduce((sum, a) => sum + (a.totalPaid || 0), 0)
      const sortedAppts = [...myAppts].sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
      const lastVisit = sortedAppts[0]?.appointmentDate || "—"
      const outstandingBalance = nonCancelled.reduce((sum, a) => sum + Math.max(0, a.totalCharged - a.totalPaid), 0)

      const detailedAppts = await Promise.all(myAppts.map(async a => {
        const svc = await repositories.services.findById(a.serviceId)
        const stf = a.staffId ? await repositories.staff.findById(a.staffId) : null
        return {
          id: a.id,
          ref: a.bookingReference,
          service: svc?.name || "Service",
          staff: stf?.name || "Staff",
          date: a.appointmentDate,
          time: a.startTime,
          charged: a.totalCharged,
          paid: a.totalPaid,
          status: a.status,
          paymentStatus: a.paymentStatus,
          notifications: (a as any).notifications || [],
        }
      }))

      const allPayments: any[] = []
      await Promise.all(detailedAppts.map(async da => {
        try {
          const pmts = await repositories.payments.listByAppointment(da.id)
          pmts.forEach(p => {
            allPayments.push({
              id: p.id,
              amount: p.amount,
              method: p.method,
              status: p.status,
              recordedAt: p.recordedAt,
              apptRef: da.ref,
              service: da.service,
              date: da.date,
            })
          })
        } catch {}
      }))
      allPayments.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))

      setCust({
        ...dbCust,
        since: dbCust.createdAt ? new Date(dbCust.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently",
        visits,
        totalSpend,
        lastVisit,
        outstandingBalance,
      })
      setCustAppts(detailedAppts)
      setPaymentHistory(allPayments)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    loadCustomerDetails()
  }, [customerId])

  async function handleSaveEdit() {
    if (!cust?.id || !editName.trim() || !editPhone.trim()) return
    setIsSaving(true)
    try {
      await repositories.customers.update(cust.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        notes: editNotes.trim() || undefined,
        segment: editSegment as any,
      })
      setShowEditModal(false)
      loadCustomerDetails()
    } catch {} finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading customer profile...</div>
  }

  if (!cust) return (
    <div className="p-8 text-center">
      <p className="font-bold text-gray-900 mb-2">Customer not found</p>
      <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
    </div>
  )

  const [tab, setTab] = useState<ProfileTab>("history")

  const custAppts = OPS_APPOINTMENTS.filter(a => a.customerId === cust.id)

  // All payment records across all appointments for this customer
  const paymentHistory = custAppts.flatMap(a =>
    a.payments.map(p => ({ ...p, apptRef: a.ref, service: a.service, date: a.date }))
  ).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))

  const tabs: { key: ProfileTab; label: string }[] = [
    { key:"history",        label:"History"        },
    { key:"payments",       label:"Payments"       },
    { key:"packages",       label:"Packages"       },
    { key:"loyalty",        label:"Loyalty"        },
    { key:"communications", label:"Communications" },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackBtn onClick={onBack} />

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[18px] text-gray-900">Edit customer profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Full name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Segment</label>
                <select
                  value={editSegment}
                  onChange={e => setEditSegment(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white"
                >
                  <option value="new">New</option>
                  <option value="returning">Returning</option>
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                  <option value="atRisk">At Risk</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={!editName.trim() || !editPhone.trim() || isSaving}
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-[14px] hover:bg-gray-800 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <SecondaryBtn label="Cancel" onClick={() => setShowEditModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="flex items-start gap-5 mb-6 flex-wrap">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-[24px] font-black text-gray-500 flex-shrink-0">{cust.name[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-[22px] font-black text-gray-900">{cust.name}</h2>
            <SegmentBadge segment={cust.segment} />
          </div>
          <p className="text-[13px] text-gray-500">{cust.phone} · {cust.email}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">Member since {cust.since}</p>
          <p className="text-[13px] text-gray-500">{cust.phone} {cust.email ? `· ${cust.email}` : ''}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">Customer since {cust.since}</p>
        </div>
        <SecondaryBtn label="Edit" onClick={() => {}} />
        <div className="flex gap-2">
          {onNav && (
            <PrimaryBtn label="Book appointment" onClick={() => onNav("createAppt")} />
          )}
          <SecondaryBtn label="Edit profile" onClick={() => setShowEditModal(true)} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label:"Visits",       value:String(cust.visits)          },
          { label:"Total spent",  value:fmtR(cust.totalSpend)        },
          { label:"Last visit",   value:cust.lastVisit               },
          { label:"Outstanding",  value:cust.outstandingBalance > 0 ? fmtR(cust.outstandingBalance) : "None" },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
            <p className="text-[18px] font-black text-gray-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Notes */}
      {cust.notes && (
        <Card className="px-5 py-4 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Notes</p>
          <p className="text-[13px] text-gray-700 leading-relaxed">{cust.notes}</p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* History tab */}
      {tab === "history" && (
        <Card>
          {custAppts.length === 0 ? (
            <EmptyState icon="📋" title="No appointments" body="This customer has no booking history yet." />
          ) : (
            <div className="divide-y divide-gray-50">
              {custAppts.map(a => (
                <button key={a.ref} onClick={() => onAppt(a.ref)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-gray-900">{a.service}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{a.date} · {a.time} · {a.staff.split(" ")[0]}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{a.date} · {a.time} · {a.staff}</p>
                    <p className="font-mono text-[11px] text-gray-400 mt-0.5">{a.ref}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[14px] font-bold text-gray-900">{fmtR(a.charged)}</span>
                    <ApptBadge status={a.status} />
                    <PayBadge  status={a.paymentStatus} />
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Payments tab */}
      {tab === "payments" && (
        <Card>
          {paymentHistory.length === 0 ? (
            <EmptyState icon="💳" title="No payment records" body="No payments have been recorded for this customer." />
          ) : (
            <div>
              <div className="px-5 py-3 border-b border-gray-100 flex gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total collected</p>
                  <p className="text-[20px] font-black text-gray-900">{fmtR(paymentHistory.filter(p => p.status === "successful").reduce((s,p) => s + p.amount, 0))}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {paymentHistory.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-semibold text-[14px] text-gray-900 capitalize">{p.method}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{p.service}</p>
                      <p className="font-mono text-[11px] text-gray-400 mt-0.5">{p.apptRef} · {p.recordedAt}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[16px] font-black ${p.status === "successful" ? "text-emerald-600" : "text-red-600"}`}>{fmtR(p.amount)}</p>
                      <p className={`text-[11px] font-semibold capitalize ${p.status === "successful" ? "text-emerald-500" : "text-red-500"}`}>{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Packages tab */}
      {tab === "packages" && (
        <Card>
          <EmptyState icon="📦" title="No packages" body="Package management coming soon. Customers can be enrolled in prepaid service bundles." />
        </Card>
      )}

      {/* Loyalty tab */}
      {tab === "loyalty" && (
        <Card>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Loyalty points</p>
                <p className="text-[32px] font-black text-gray-900">{cust.visits * 10} pts</p>
              </div>
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-[28px]">⭐</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[12px] text-gray-500 leading-relaxed">Points are earned at 10 per visit. Redemption and tier management coming soon.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Communications tab */}
      {tab === "communications" && (
        <Card>
          {custAppts.flatMap(a => a.notifications).length === 0 ? (
          {custAppts.flatMap(a => a.notifications || []).length === 0 ? (
            <EmptyState icon="📨" title="No communications" body="No notifications have been sent to this customer." />
          ) : (
            <div className="divide-y divide-gray-50">
              {custAppts.flatMap(a => a.notifications.map(n => ({
              {custAppts.flatMap(a => (a.notifications || []).map((n: any) => ({
                ...n, apptRef: a.ref, service: a.service, date: a.date
              }))).sort((a,b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? "")).map((n, i) => (
              }))).sort((a: any, b: any) => (b.sentAt ?? "").localeCompare(a.sentAt ?? "")).map((n: any, i: number) => (
                <div key={i} className="flex items-start justify-between px-5 py-4">
                  <div>
                    <p className="font-semibold text-[13px] text-gray-800 capitalize">{n.type} · {n.channel}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{n.service}</p>
                    {n.sentAt && <p className="font-mono text-[11px] text-gray-400 mt-0.5">{n.sentAt}</p>}
                    {n.failReason && <p className="text-[11px] text-red-500 mt-0.5">{n.failReason}</p>}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md capitalize ${
                    n.status === "sent"    ? "bg-emerald-50 text-emerald-700" :
                    n.status === "failed"  ? "bg-red-50 text-red-600"         :
                    n.status === "pending" ? "bg-amber-50 text-amber-700"     :
                    "bg-gray-100 text-gray-400"
                  }`}>{n.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
