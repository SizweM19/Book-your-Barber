import React, { useState } from "react"
import React, { useState, useEffect } from "react"
import type { OpsView } from "./types"
import { OPS_SERVICES, OPS_STAFF, OPS_APPOINTMENTS, DAY_SLOTS } from "./data"
import {
  fmtR, Card, SectionTitle, OpsDetailRow, PrimaryBtn, SecondaryBtn, DangerBtn, BackBtn, EmptyState,
} from "./shared"
import { repositories } from "@/infrastructure/repositories/container"
import { useTenantContext } from "@/application/tenant"
import { availabilityService } from "@/application/services/AvailabilityService"
import type { ServiceEntity, StaffEntity } from "@/application/repositories/interfaces"

// ─── SHARED SETTINGS PRIMITIVES ───────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[13px] font-black uppercase tracking-widest text-gray-400">{title}</h3>
      {children}
    </div>
  )
}

function Toggle({ on, onToggle, label, description }: { on: boolean; onToggle: () => void; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-gray-900">{label}</p>
        {description && <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button onClick={onToggle} role="switch" aria-checked={on}
        className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors mt-0.5 ${on ? "bg-gray-900" : "bg-gray-200"}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  )
}

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <p className="text-[13px] font-semibold text-emerald-800">{message}</p>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
      <p className="text-[13px] font-semibold text-red-700">{message}</p>
      <button onClick={onRetry} className="text-[12px] font-bold text-red-700 underline underline-offset-2 flex-shrink-0">Try again</button>
    </div>
  )
}

function SettingsNavCard({ emoji, title, description, onClick }: { emoji: string; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-left w-full group">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-gray-100 transition-colors">{emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[14px] text-gray-900">{title}</p>
        <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-1"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  )
}

// ─── QR CODE SVG ─────────────────────────────────────────────────────────────

function QrPlaceholder() {
  // Simple SVG QR-like grid pattern
  const cells: React.JSX.Element[] = []
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,1,0,1,1,1,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,1,0,1,1,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,1,1,1,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,1,0,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,0,1,0],
    [0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,1,0,1],
    [1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,0,1,1],
    [0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,1,0,0],
    [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,1,1,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,1,1,1,0,1,1],
  ]
  pattern.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (cell) {
        cells.push(<rect key={`${ri}-${ci}`} x={ci * 10} y={ri * 10} width="9" height="9" fill="#111827" rx="1" />)
      }
    })
  })
  return (
    <svg width="210" height="210" viewBox="0 0 210 210" xmlns="http://www.w3.org/2000/svg" className="rounded-lg">
      <rect width="210" height="210" fill="white" />
      {cells}
    </svg>
  )
}

// ─── 1. SETTINGS HUB ──────────────────────────────────────────────────────────

export function SettingsHubScreen({ onNav }: { onNav: (v: OpsView) => void }) {
  const activeServices = OPS_SERVICES.filter(s => s.active)
  const activeStaff    = OPS_STAFF.filter(s => s.active)

  const checklist = [
    { label:"Salon profile",    done:true  },
    { label:"Services",         done:activeServices.length > 0 },
    { label:"Staff",            done:activeStaff.length > 0 },
    { label:"Working hours",    done:true  },
    { label:"Payment setup",    done:false },
    { label:"Booking settings", done:true  },
  ]
  const incomplete = checklist.filter(c => !c.done)

  const warnings = [
    ...(activeServices.length === 0 ? [{ emoji:"✂️", msg:"No active services", action:"Add service", nav:"settingsServices" as OpsView }] : []),
    ...(activeStaff.length === 0    ? [{ emoji:"👥", msg:"No active staff members", action:"Add staff", nav:"settingsAddStaff" as OpsView }] : []),
    { emoji:"💳", msg:"No payment provider connected. Online payment is unavailable.", action:"Set up payment", nav:"settingsPayments" as OpsView },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <SectionTitle>Settings</SectionTitle>
        <p className="text-[14px] text-gray-500 -mt-2">Configure your booking engine, services, staff, and payments.</p>
      </div>

      {/* Config warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <span className="text-base flex-shrink-0">{w.emoji}</span>
              <p className="flex-1 text-[13px] font-medium text-amber-900">{w.msg}</p>
              <button onClick={() => onNav(w.nav)} className="text-[12px] font-bold text-amber-700 underline underline-offset-2 flex-shrink-0">{w.action} →</button>
            </div>
          ))}
        </div>
      )}

      {/* Config checklist */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-[15px] text-gray-900">Setup checklist</p>
          {incomplete.length === 0
            ? <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full">All done ✓</span>
            : <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full">{incomplete.length} remaining</span>
          }
        </div>
        {incomplete.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-[13px] font-semibold text-amber-900">Your booking page isn't ready yet.</p>
            <p className="text-[12px] text-amber-700 mt-0.5">Complete the remaining steps to start accepting bookings.</p>
          </div>
        )}
        <div className="space-y-2">
          {checklist.map(c => (
            <div key={c.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${c.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                {c.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <p className={`text-[13px] font-medium ${c.done ? "text-gray-600 line-through decoration-gray-300" : "text-gray-900"}`}>{c.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Nav cards grid */}
      <SettingsSection title="Booking">
        <div className="grid sm:grid-cols-2 gap-3">
          <SettingsNavCard emoji="📅" title="Booking settings" description="Online booking, advance limits, staff assignment strategy." onClick={() => onNav("settingsBooking")} />
          <SettingsNavCard emoji="🔗" title="Booking link & QR" description="Share your booking page link and download a QR code." onClick={() => onNav("settingsBooking")} />
          <SettingsNavCard emoji="📊" title="Availability preview" description="See exactly what customers can book and why slots are unavailable." onClick={() => onNav("settingsAvailability")} />
        </div>
      </SettingsSection>

      <SettingsSection title="Services & Staff">
        <div className="grid sm:grid-cols-2 gap-3">
          <SettingsNavCard emoji="✂️" title="Services" description="Manage your service menu, prices, durations, and categories." onClick={() => onNav("settingsServices")} />
          <SettingsNavCard emoji="👥" title="Staff" description="Add staff members and configure their schedules and services." onClick={() => onNav("staffList")} />
        </div>
      </SettingsSection>

      <SettingsSection title="Payments & Policy">
        <div className="grid sm:grid-cols-2 gap-3">
          <SettingsNavCard emoji="💳" title="Payment settings" description="Connect your payment provider and configure pay-at-shop." onClick={() => onNav("settingsPayments")} />
          <SettingsNavCard emoji="📋" title="Cancellation policy" description="View platform-controlled cancellation and refund rules." onClick={() => onNav("settingsCancellation")} />
        </div>
      </SettingsSection>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap pb-2">
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors shadow-sm">
          👁 Preview booking page
        </button>
        <button onClick={() => { navigator.clipboard?.writeText("bookyourbarber.co.za/book/fade-and-edge") }}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">
          🔗 Copy booking link
        </button>
      </div>
    </div>
  )
}

// ─── 2. SETTINGS SERVICES ─────────────────────────────────────────────────────

export function SettingsServicesScreen({ onBack, onNav, onEdit }: {
  onBack: () => void; onNav: (v: OpsView) => void; onEdit: (id: string) => void
}) {
  const [services,     setServices]     = useState(OPS_SERVICES)
  const { tenantId } = useTenantContext()
  const [services,     setServices]     = useState<ServiceEntity[]>([])
  const [loading,      setLoading]      = useState(true)
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [saved,        setSaved]        = useState<string | null>(null)

  function toggleActive(id: string) {
    setServices(ss => ss.map(s => s.id === id ? { ...s, active: !s.active } : s))
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.services.list(tenantId, true).then(list => {
      if (mounted) {
        setServices(list)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [tenantId])

  async function toggleActive(id: string) {
    const svc = services.find(s => s.id === id)
    setSaved(svc ? (svc.active ? "Service deactivated." : "Service reactivated.") : null)
    setTimeout(() => setSaved(null), 3000)
    if (!svc) return
    try {
      const updated = await repositories.services.update(id, { active: !svc.active })
      setServices(ss => ss.map(s => s.id === id ? updated : s))
      setSaved(updated.active ? "Service reactivated." : "Service deactivated.")
      setTimeout(() => setSaved(null), 3000)
    } catch {}
  }

  const categories = Array.from(new Set(services.map(s => s.category)))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <SectionTitle>Services</SectionTitle>
        <PrimaryBtn label="Add service" onClick={() => onNav("settingsAddService")} icon="+" />
      </div>

      {saved && <SuccessToast message={saved} />}

      {services.length === 0 ? (
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading services...</div>
      ) : services.length === 0 ? (
        <Card>
          <EmptyState icon="✂️" title="No services yet" body="Add your first service so customers can start booking." cta="Add service" onCta={() => onNav("settingsAddService")} />
        </Card>
      ) : (
        <div className="space-y-5">
          {categories.map(cat => {
            const catSvcs = services.filter(s => s.category === cat)
            return (
              <div key={cat}>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">{cat}</p>
                <Card>
                  <div className="divide-y divide-gray-50">
                    {catSvcs.map(s => (
                      <div key={s.id}>
                        <div className="flex items-center gap-3 px-5 py-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`font-semibold text-[14px] ${s.active ? "text-gray-900" : "text-gray-400"}`}>{s.name}</p>
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${s.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                                {s.active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-500">{s.duration} min · {fmtR(s.price)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => onEdit(s.id)} className="text-[12px] font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">Edit</button>
                            {s.active
                              ? <button onClick={() => setDeactivating(s.id)} className="text-[12px] font-semibold text-amber-700 hover:text-amber-900 px-3 py-1.5 border border-amber-100 rounded-lg hover:bg-amber-50 transition-colors">Deactivate</button>
                              : <button onClick={() => toggleActive(s.id)} className="text-[12px] font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 border border-emerald-100 rounded-lg hover:bg-emerald-50 transition-colors">Reactivate</button>
                            }
                          </div>
                        </div>
                        {/* Inline deactivation confirmation */}
                        {deactivating === s.id && (
                          <div className="mx-5 mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <p className="font-bold text-[14px] text-amber-900 mb-1">Deactivate {s.name}?</p>
                            <p className="text-[12px] text-amber-700 mb-3 leading-relaxed">This service will no longer be available for new bookings. Existing appointments remain unchanged.</p>
                            <div className="flex gap-2">
                              <button onClick={() => { toggleActive(s.id); setDeactivating(null) }}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-[12px] font-bold hover:bg-amber-700">Deactivate</button>
                              <button onClick={() => setDeactivating(null)}
                                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-[12px] font-semibold">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 3. ADD SERVICE ───────────────────────────────────────────────────────────

const DURATION_OPTIONS = ["15","20","30","45","60","75","90","120"]
const CATEGORY_OPTIONS = ["Haircuts","Beard","Shaving","Combos","Treatments","Colour","Other"]

export function AddServiceScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { tenantId } = useTenantContext()
  const [name,     setName]     = useState("")
  const [category, setCategory] = useState("Haircuts")
  const [duration, setDuration] = useState("30")
  const [price,    setPrice]    = useState("")
  const [saved,    setSaved]    = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error,    setError]    = useState(false)

  function handleSave() {
    if (!name || !price) return
    setSaved(true)
    setTimeout(() => onDone(), 1500)
  async function handleSave() {
    if (!tenantId || !name.trim() || !price) return
    setIsSaving(true)
    setError(false)
    try {
      await repositories.services.create({
        tenantId,
        name: name.trim(),
        category,
        duration: Number(duration),
        price: Number(price),
        active: true,
      })
      setSaved(true)
      setTimeout(() => onDone(), 1200)
    } catch {
      setError(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Add service</SectionTitle>

      {saved && <SuccessToast message="Service saved." />}
      {error && <ErrorBanner message="Unable to save service." onRetry={() => setError(false)} />}

      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Service name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Classic Haircut"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white appearance-none">
              {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white appearance-none">
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="150"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={!name || !price}
          <button onClick={handleSave} disabled={!name || !price || isSaving}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
            Save service
            {isSaving ? "Saving..." : "Save service"}
          </button>
          <SecondaryBtn label="Cancel" onClick={onBack} />
        </div>
      </div>
    </div>
  )
}

// ─── 4. EDIT SERVICE ──────────────────────────────────────────────────────────

export function EditServiceScreen({ serviceId, onBack, onDone }: { serviceId: string; onBack: () => void; onDone: () => void }) {
  const original = OPS_SERVICES.find(s => s.id === serviceId) ?? OPS_SERVICES[0]
  const [name,     setName]     = useState(original.name)
  const [category, setCategory] = useState(original.category)
  const [duration, setDuration] = useState(String(original.duration))
  const [price,    setPrice]    = useState(String(original.price))
  const [original, setOriginal] = useState<ServiceEntity | null>(null)
  const [name,     setName]     = useState("")
  const [category, setCategory] = useState("Haircuts")
  const [duration, setDuration] = useState("30")
  const [price,    setPrice]    = useState("")
  const [saved,    setSaved]    = useState(false)
  const [dirty,    setDirty]    = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const hasChanged = name !== original.name || Number(price) !== original.price || Number(duration) !== original.duration
  useEffect(() => {
    if (!serviceId) return
    let mounted = true
    repositories.services.findById(serviceId).then(s => {
      if (mounted && s) {
        setOriginal(s)
        setName(s.name)
        setCategory(s.category)
        setDuration(String(s.duration))
        setPrice(String(s.price))
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [serviceId])

  function handleSave() {
    setSaved(true)
    setDirty(false)
    setTimeout(() => onDone(), 1500)
  async function handleSave() {
    if (!serviceId || !name.trim() || !price) return
    setIsSaving(true)
    try {
      await repositories.services.update(serviceId, {
        name: name.trim(),
        category,
        duration: Number(duration),
        price: Number(price),
      })
      setSaved(true)
      setTimeout(() => onDone(), 1200)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading service...</div>
  }

  const hasChanged = original && (name !== original.name || Number(price) !== original.price || Number(duration) !== original.duration)

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Edit service</SectionTitle>

      {saved && <SuccessToast message="Service updated." />}

      {(Number(price) !== original.price || Number(duration) !== original.duration) && (
      {hasChanged && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
          <p className="text-[13px] font-semibold text-amber-900 mb-0.5">Note on existing appointments</p>
          <p className="text-[12px] text-amber-700 leading-relaxed">Changing the price or duration won't affect existing appointments. Historical bookings keep their original values.</p>
        </div>
      )}

      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Service name</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setDirty(true) }}
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setDirty(true) }}
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white appearance-none">
              {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Duration</label>
            <select value={duration} onChange={e => { setDuration(e.target.value); setDirty(true) }}
            <select value={duration} onChange={e => setDuration(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white appearance-none">
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R</span>
              <input type="number" value={price} onChange={e => { setPrice(e.target.value); setDirty(true) }}
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <button onClick={handleSave}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors">
            Save changes
          <button onClick={handleSave} disabled={!name || !price || isSaving}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors disabled:opacity-50">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <SecondaryBtn label="Cancel" onClick={onBack} />
        </div>
      </div>
    </div>
  )
}

// ─── 5. ADD STAFF ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS = ["Barber","Senior Barber","Master Barber","Stylist","Senior Stylist","Style Specialist","Other"]

export function AddStaffScreen({ onBack, onDone }: { onBack: () => void; onDone: (id: string) => void }) {
  const [name,  setName]  = useState("")
  const [phone, setPhone] = useState("+27 ")
  const [role,  setRole]  = useState("Barber")
  const [saved, setSaved] = useState(false)
  const { tenantId } = useTenantContext()
  const [name,     setName]     = useState("")
  const [phone,    setPhone]    = useState("+27 ")
  const [role,     setRole]     = useState("Barber")
  const [saved,    setSaved]    = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => onDone("t1"), 1500) // demo: navigate to Themba's profile
  async function handleSave() {
    if (!tenantId || !name.trim() || phone.length < 6) return
    setIsSaving(true)
    try {
      const created = await repositories.staff.create({
        tenantId,
        name: name.trim(),
        role,
        active: true,
      })
      setSaved(true)
      setTimeout(() => onDone(created.id), 1200)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Add staff member</SectionTitle>
      <p className="text-[13px] text-gray-500 -mt-2 mb-5">Staff are records only. They don't need a login to your system.</p>

      {saved && <SuccessToast message="Staff member added. Now set up their schedule and services." />}

      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Thabo Mokoena"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Phone number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 XX XXX XXXX"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white appearance-none">
              {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </Card>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-[12px] font-semibold text-blue-900 mb-0.5">Next steps after adding</p>
          <p className="text-[12px] text-blue-700 leading-relaxed">You'll be taken to the staff profile where you can set working hours, breaks, exceptions, and which services they can perform.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={!name || phone.length < 6}
          <button onClick={handleSave} disabled={!name || phone.length < 6 || isSaving}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
            Add staff
            {isSaving ? "Adding..." : "Add staff"}
          </button>
          <SecondaryBtn label="Cancel" onClick={onBack} />
        </div>
      </div>
    </div>
  )
}

// ─── 6. AVAILABILITY PREVIEW ──────────────────────────────────────────────────

type SlotState = "available" | "booked" | "break" | "outside" | "exception"
type SlotState = "available" | "booked"

interface AvailSlot { time: string; state: SlotState }
interface AvailSlot {
  time: string
  state: SlotState
}

const BREAK_SLOTS = new Set(["12:00","12:30"])
const STAFF_OFF_DAYS: Record<string, string[]> = {}
const slotColors: Record<SlotState, { bg: string; text: string; badge: string }> = {
  available: { bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  booked:    { bg: "bg-gray-50",    text: "text-gray-400",    badge: "bg-gray-100 text-gray-500" },
}

const slotLabels: Record<SlotState, string> = {
  available: "Available",
  booked:    "Already booked",
}

export function AvailabilityScreen({ onBack }: { onBack: () => void }) {
  const { tenantId } = useTenantContext()
  const [services,   setServices]   = useState<ServiceEntity[]>([])
  const [staffList,  setStaffList]  = useState<StaffEntity[]>([])
  const [serviceId,  setServiceId]  = useState("")
  const [staffId,    setStaffId]    = useState("")
  const [date,       setDate]       = useState(() => new Date().toISOString().slice(0, 10))
  const [slots,      setSlots]      = useState<AvailSlot[]>([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState(false)

function computeAvailability(staffId: string, serviceId: string, date: string): AvailSlot[] {
  const svc    = OPS_SERVICES.find(s => s.id === serviceId)
  const slotsNeeded = svc ? Math.ceil(svc.duration / 30) : 1
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    Promise.all([
      repositories.services.list(tenantId, true),
      repositories.staff.list(tenantId, true),
    ]).then(([svcs, stf]) => {
      if (!mounted) return
      setServices(svcs)
      setStaffList(stf.filter(s => s.active))
      const activeStaff = stf.filter(s => s.active)
      setStaffList(activeStaff)
      if (svcs.length > 0) setServiceId(svcs[0].id)
      if (stf.length > 0) setStaffId(stf[0].id)
      if (activeStaff.length > 0) setStaffId(activeStaff[0].id)
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [tenantId])

  return DAY_SLOTS.map((slot, idx) => {
    // Outside hours check (demo: before 08:00 or after 17:30)
    const [h, m] = slot.split(":").map(Number)
    const mins = h * 60 + m
    if (mins < 480 || mins >= 1020) return { time: slot, state: "outside" as SlotState }
  useEffect(() => {
    if (!tenantId || !serviceId || !date) return
    let mounted = true
    if (staffId) {
      availabilityService.getAvailableSlots({
        tenantId,
        serviceId,
        date,
        staffId,
      }).then(rawSlots => {
        if (!mounted) return
        setSlots(rawSlots.map(s => ({
          time: s.time,
          state: (s.available ? "available" : "booked") as SlotState,
        })))
      }).catch(() => {
        if (mounted) setSlots([])
      })
    } else {
      availabilityService.getAvailableStaffAndSlots({
        tenantId,
        serviceId,
        date,
      }).then(res => {
        if (!mounted) return
        setSlots(res.slots.map(s => ({
          time: s.time,
          state: (s.available ? "available" : "booked") as SlotState,
        })))
      }).catch(() => {
        if (mounted) setSlots([])
      })
    }
    return () => { mounted = false }
  }, [tenantId, serviceId, staffId, date])

    // Break check
    if (BREAK_SLOTS.has(slot)) return { time: slot, state: "break" as SlotState }

    // Already booked check
    const booked = OPS_APPOINTMENTS.some(a =>
      a.staffId === staffId && a.date === date && a.time === slot &&
      !["cancelled","noShow"].includes(a.status)
    )
    if (booked) return { time: slot, state: "booked" as SlotState }

    return { time: slot, state: "available" as SlotState }
  })
}

const slotColors: Record<SlotState, { bg: string; text: string; badge: string }> = {
  available: { bg:"bg-emerald-50",  text:"text-emerald-700", badge:"bg-emerald-100 text-emerald-700" },
  booked:    { bg:"bg-gray-50",     text:"text-gray-400",    badge:"bg-gray-100 text-gray-500"       },
  break:     { bg:"bg-amber-50",    text:"text-amber-700",   badge:"bg-amber-100 text-amber-700"     },
  outside:   { bg:"bg-red-50",      text:"text-red-500",     badge:"bg-red-100 text-red-500"         },
  exception: { bg:"bg-purple-50",   text:"text-purple-700",  badge:"bg-purple-100 text-purple-700"   },
}

const slotLabels: Record<SlotState, string> = {
  available: "Available",
  booked:    "Already booked",
  break:     "Break",
  outside:   "Outside working hours",
  exception: "Exception — day off",
}

export function AvailabilityScreen({ onBack }: { onBack: () => void }) {
  const [serviceId, setServiceId] = useState(OPS_SERVICES[0].id)
  const [staffId,   setStaffId]   = useState(OPS_STAFF[0].id)
  const [date,      setDate]      = useState("2026-09-08")
  const [expanded,  setExpanded]  = useState(false)

  const slots = computeAvailability(staffId, serviceId, date)
  const availCount = slots.filter(s => s.state === "available").length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <BackBtn onClick={onBack} />
      <div className="mb-5">
        <SectionTitle>Availability preview</SectionTitle>
        <p className="text-[13px] text-gray-500 -mt-2">Check what appointment times are available for any staff member and service.</p>
      </div>

      {/* How availability works — collapsed explainer */}
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl mb-5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <p className="text-[13px] font-semibold text-blue-900">How are available times calculated?</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {expanded && (
        <Card className="p-5 mb-5">
          <div className="space-y-2">
            {["Staff member","Service duration","Working hours","Breaks","Schedule exceptions","Existing bookings","Booking rules"].map((item, i, arr) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-black">{i + 1}</span>
                  </div>
                  {i < arr.length - 1 && <div className="w-0.5 h-5 bg-gray-200 mt-1" />}
                </div>
                <p className={`text-[13px] ${i < arr.length - 1 ? "font-medium text-gray-700 pb-4" : "font-bold text-gray-900"}`}>{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-900" />
            <p className="text-[13px] font-bold text-gray-900">Available appointment times</p>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-5 mb-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Service</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none bg-white">
              {OPS_SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
              {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Staff</label>
            <select value={staffId} onChange={e => setStaffId(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none bg-white">
              {OPS_STAFF.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none bg-white" />
          </div>
        </div>
      </Card>

      {/* Result summary */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <p className="text-[14px] font-bold text-gray-900">
          {availCount} available {availCount === 1 ? "slot" : "slots"}
        </p>
        <span className="text-gray-300">·</span>
        {Object.entries(slotColors).map(([state, cfg]) => {
          const count = slots.filter(s => s.state === state).length
          if (count === 0) return null
          return (
            <span key={state} className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.badge}`}>
              {slotLabels[state as SlotState]}: {count}
            </span>
          )
        })}
      </div>

      {/* Slot list */}
      <Card>
        <div className="divide-y divide-gray-50">
          {slots.map(s => {
            const cfg = slotColors[s.state]
            return (
        {slots.length === 0 ? (
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-[13px]">Loading availability...</div>
        ) : slots.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-[13px]">No slots available for this selection.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {slots.map(s => (
              <div key={s.time} className={`flex items-center justify-between px-5 py-3.5 ${s.state === "available" ? "" : "opacity-70"}`}>
                <span className="font-mono font-bold text-[14px] text-gray-900">{s.time}</span>
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${cfg.badge}`}>
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${slotColors[s.state].badge}`}>
                  {slotLabels[s.state]}
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${s.state === "available" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.state === "available" ? "Available" : "Booked"}
                </span>
              </div>
            )
          })}
        </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── 7. BOOKING SETTINGS ──────────────────────────────────────────────────────

const ADVANCE_OPTIONS = ["7","14","30","60","90"]
const NOTICE_OPTIONS  = [
  { value:"1h",  label:"1 hour"   },
  { value:"2h",  label:"2 hours"  },
  { value:"4h",  label:"4 hours"  },
  { value:"12h", label:"12 hours" },
  { value:"24h", label:"24 hours" },
  { value:"48h", label:"48 hours" },
]

const ASSIGNMENT_OPTIONS = [
  { value:"first",  label:"First available",   description:"Assign to the first staff member with an open slot." },
  { value:"least",  label:"Least busy",        description:"Assign to whoever has the fewest bookings that day."  },
  { value:"round",  label:"Round robin",       description:"Rotate evenly across staff members over time."        },
]

export function BookingSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tenantId } = useTenantContext()
  const [onlineBooking, setOnlineBooking]     = useState(true)
  const [maxAdvance,    setMaxAdvance]         = useState("60")
  const [minNotice,     setMinNotice]          = useState("2h")
  const [customerStaff, setCustomerStaff]     = useState(true)
  const [anyAvailable,  setAnyAvailable]       = useState(true)
  const [strategy,      setStrategy]           = useState("first")
  const [saved,         setSaved]              = useState(false)
  const [isSaving,      setIsSaving]           = useState(false)
  const [linkCopied,    setLinkCopied]         = useState(false)

  const BOOKING_LINK = "bookyourbarber.co.za/book/fade-and-edge"

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.settings.getBookingSettings(tenantId).then(cfg => {
      if (mounted && cfg) {
        setOnlineBooking(cfg.online_booking_enabled)
        setMaxAdvance(String(cfg.max_advance_days ?? 60))
        setMinNotice(`${Math.round((cfg.min_notice_minutes ?? 120) / 60)}h`)
        if (cfg.assignment_strategy === "LEAST_BUSY") setStrategy("leastBusy")
        else if (cfg.assignment_strategy === "ROUND_ROBIN") setStrategy("roundRobin")
        else setStrategy("first")
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setIsSaving(true)
    try {
      await repositories.settings.updateBookingSettings(tenantId, {
        online_booking_enabled: onlineBooking,
        max_advance_days: Number(maxAdvance) || 60,
        min_notice_minutes: (parseInt(minNotice, 10) || 2) * 60,
        assignment_strategy: strategy === "leastBusy" ? "LEAST_BUSY" : strategy === "roundRobin" ? "ROUND_ROBIN" : "FIRST_AVAILABLE",
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(`https://${BOOKING_LINK}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Booking settings</SectionTitle>

      {saved && <SuccessToast message="Booking settings updated." />}

      <div className="space-y-6">
        {/* Online booking */}
        <Card className="px-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 pt-4 pb-2">General</p>
          <Toggle on={onlineBooking} onToggle={() => setOnlineBooking(b => !b)}
            label="Online booking"
            description="Allow customers to book appointments through your booking link." />
          {!onlineBooking && (
            <div className="pb-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-[12px] font-semibold text-amber-900">Online booking is off</p>
                <p className="text-[12px] text-amber-700 mt-0.5">Your booking page will show a "Not accepting bookings" message. You can still create appointments manually.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Timing */}
        <Card className="px-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 pt-4 pb-2">Timing</p>
          <div className="flex justify-between items-center py-4 border-b border-gray-50">
            <div>
              <p className="text-[14px] font-semibold text-gray-900">Maximum booking advance</p>
              <p className="text-[12px] text-gray-500 mt-0.5">How far ahead customers can book.</p>
            </div>
            <select value={maxAdvance} onChange={e => setMaxAdvance(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] font-semibold focus:border-gray-900 outline-none bg-white ml-4">
              {ADVANCE_OPTIONS.map(o => <option key={o} value={o}>{o} days</option>)}
            </select>
          </div>
          <div className="flex justify-between items-center py-4">
            <div>
              <p className="text-[14px] font-semibold text-gray-900">Minimum booking notice</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Shortest notice before an appointment can be booked.</p>
            </div>
            <select value={minNotice} onChange={e => setMinNotice(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] font-semibold focus:border-gray-900 outline-none bg-white ml-4">
              {NOTICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </Card>

        {/* Staff selection */}
        <Card className="px-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 pt-4 pb-2">Staff selection</p>
          <Toggle on={customerStaff} onToggle={() => setCustomerStaff(b => !b)}
            label="Customer can choose staff"
            description="Show individual staff members to customers during booking." />
          <Toggle on={anyAvailable} onToggle={() => setAnyAvailable(b => !b)}
            label='Allow "Any Available"'
            description="Let customers choose any available staff member instead of picking one." />

          {anyAvailable && (
            <div className="pb-5">
              <p className="text-[13px] font-semibold text-gray-900 mb-3">When a customer selects "Any Available", assign the appointment to…</p>
              <div className="space-y-2">
                {ASSIGNMENT_OPTIONS.map(opt => (
                  <label key={opt.value}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${strategy === opt.value ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}>
                    <input type="radio" name="strategy" value={opt.value} checked={strategy === opt.value} onChange={() => setStrategy(opt.value)} className="mt-0.5 flex-shrink-0 accent-gray-900" />
                    <div>
                      <p className="font-semibold text-[13px] text-gray-900">{opt.label}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Booking link */}
        <Card className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Your booking link</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-3">
            <span className="text-[13px] font-mono text-gray-700 flex-1 truncate">{BOOKING_LINK}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-colors ${linkCopied ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}>
              {linkCopied ? "✓ Copied!" : "📋 Copy link"}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">🔗 Open page</button>
            <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">↗ Share</button>
          </div>
        </Card>

        {/* QR code */}
        <Card className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Your booking QR code</p>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex-shrink-0">
              <QrPlaceholder />
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-[13px] text-gray-600 leading-relaxed mb-4">Customers who scan this QR code go directly to your booking page. Print it and display it in your salon.</p>
              <div className="flex flex-col gap-2">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors">⬇ Download QR code</button>
                <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-colors">🖨 Print QR code</button>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3 pb-4">
          <button onClick={handleSave} className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors shadow-sm">Save settings</button>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50">
            {isSaving ? "Saving..." : "Save settings"}
          </button>
          <SecondaryBtn label="Cancel" onClick={onBack} />
        </div>
      </div>
    </div>
  )
}

// ─── 8. PAYMENT SETTINGS ──────────────────────────────────────────────────────

export function PaymentSettingsScreen({ onBack }: { onBack: () => void }) {
  const [payAtShop, setPayAtShop] = useState(true)
  const [saved,     setSaved]     = useState(false)
  const [connected, setConnected] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <BackBtn onClick={onBack} />
      <SectionTitle>Payment settings</SectionTitle>

      {saved && <SuccessToast message="Payment settings updated." />}

      <div className="space-y-5">
        {/* Payment provider */}
        <Card className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Payment provider</p>
          {connected ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="font-bold text-[14px] text-gray-900">Payment provider connected</p>
                  <p className="text-[12px] text-gray-500">Online payment is active.</p>
                </div>
              </div>
              <button onClick={() => setConnected(false)} className="text-[12px] font-semibold text-red-500 hover:text-red-700">Disconnect</button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
                <div>
                  <p className="font-bold text-[14px] text-gray-900">No payment provider connected</p>
                  <p className="text-[12px] text-gray-500">Online payment is unavailable until you connect a provider.</p>
                </div>
              </div>
              <button onClick={() => setConnected(true)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-[13px] hover:bg-gray-800 transition-colors shadow-sm">
                Connect payment provider
              </button>
            </div>
          )}
        </Card>

        {/* Online payment info */}
        <Card className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Online payment</p>
          <div className="bg-blue-50 rounded-xl px-4 py-3.5">
            <p className="font-semibold text-[13px] text-blue-900 mb-1">Full payment required</p>
            <p className="text-[12px] text-blue-700 leading-relaxed">Customers who choose Pay Online must pay the full booking amount before their appointment is confirmed. Partial payment online is not supported.</p>
          </div>
        </Card>

        {/* Pay at shop */}
        <Card className="px-5">
          <div className="pt-4">
            <Toggle on={payAtShop} onToggle={() => setPayAtShop(b => !b)}
              label="Pay at shop"
              description="Customers can choose to pay when they arrive. They won't be charged online for this option." />
          </div>
          {payAtShop && (
            <div className="pb-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-[12px] text-gray-600 leading-relaxed">
                  Pay-at-shop bookings are confirmed without collecting payment. The appointment is valid and will appear in your calendar as usual. Payment is recorded when the customer arrives.
                </p>
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-3 pb-4">
          <button onClick={handleSave} className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors shadow-sm">Save settings</button>
          <SecondaryBtn label="Cancel" onClick={onBack} />
        </div>
      </div>
    </div>
  )
}

// ─── 9. CANCELLATION POLICY ───────────────────────────────────────────────────

export function CancellationPolicyScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <BackBtn onClick={onBack} />
      <div className="mb-2">
        <SectionTitle>Cancellation policy</SectionTitle>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
        <p className="text-[12px] font-semibold text-blue-900 mb-0.5">Platform-controlled policy</p>
        <p className="text-[12px] text-blue-700 leading-relaxed">This policy is set by BookYourBarber and applies to all salons on the platform. Contact support if you have questions about a specific case.</p>
      </div>

      <div className="space-y-5">
        {/* Customer cancellation */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-base">👤</span>
            </div>
            <div>
              <p className="font-bold text-[15px] text-gray-900">Customer cancellation</p>
              <p className="text-[12px] text-gray-500">When the customer cancels their booking</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-start py-3 border-b border-gray-50">
              <div>
                <p className="font-semibold text-[13px] text-gray-900">More than 24 hours before</p>
                <p className="text-[12px] text-gray-500">Cancelled with sufficient notice</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[14px] text-amber-700">10% fee</p>
                <p className="text-[11px] text-gray-400">of booking value</p>
              </div>
            </div>
            <div className="flex justify-between items-start py-3 border-b border-gray-50">
              <div>
                <p className="font-semibold text-[13px] text-gray-900">Less than 24 hours before</p>
                <p className="text-[12px] text-gray-500">Late cancellation</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[14px] text-red-600">18% fee</p>
                <p className="text-[11px] text-gray-400">of booking value</p>
              </div>
            </div>
            <div className="flex justify-between items-start pt-3">
              <div>
                <p className="font-semibold text-[13px] text-gray-900">Customer refund</p>
                <p className="text-[12px] text-gray-500">Amount after cancellation fee</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[14px] text-emerald-600">Remaining amount</p>
                <p className="text-[11px] text-gray-400">3–5 business days</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Salon cancellation */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-base">🏪</span>
            </div>
            <div>
              <p className="font-bold text-[15px] text-gray-900">Salon cancellation</p>
              <p className="text-[12px] text-gray-500">When your salon cancels a customer's booking</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-start py-3 border-b border-gray-50">
              <div>
                <p className="font-semibold text-[13px] text-gray-900">Cancellation fee to customer</p>
              </div>
              <p className="font-bold text-[14px] text-emerald-700">None</p>
            </div>
            <div className="flex justify-between items-start py-3 border-b border-gray-50">
              <div>
                <p className="font-semibold text-[13px] text-gray-900">Customer refund</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[14px] text-emerald-600">Full refund</p>
                <p className="text-[11px] text-gray-400">of amount paid</p>
              </div>
            </div>
            <div className="flex justify-between items-start pt-3">
              <div>
                <p className="font-semibold text-[13px] text-gray-900">Refund processing</p>
              </div>
              <p className="font-semibold text-[13px] text-gray-600">3–5 business days</p>
            </div>
          </div>
        </Card>

        {/* Refund processing note */}
        <Card className="p-4">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Refund processing times depend on your payment provider and the customer's bank. Typically 3–5 business days. Pay-at-shop bookings have no online charge — no refund is issued for these.
          </p>
        </Card>
      </div>
    </div>
  )
}
