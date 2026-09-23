import React, { useState, useEffect } from "react"
import type { OpsView } from "./types"
import { repositories } from "@byb/database"
import { useTenantContext } from "@/application/tenant"
import type { StaffEntity, ServiceEntity } from "@byb/database"
import { fmtR, Card, SectionTitle, OpsDetailRow, PrimaryBtn, SecondaryBtn, BackBtn, EmptyState } from "./shared"

// ─── STAFF LIST ───────────────────────────────────────────────────────────────

export function StaffListScreen({ onNav, onStaff }: { onNav: (v: OpsView) => void; onStaff: (id: string) => void }) {
  const { tenantId } = useTenantContext()
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Add staff modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("Barber")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  function loadStaff() {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      repositories.staff.list(tenantId, true),
      repositories.appointments.listByDate(tenantId, today),
    ]).then(([stf, todayAppts]) => {
      const mapped = stf.map(s => {
        const myTodayAppts = todayAppts.filter(a => a.staffId === s.id && a.status !== "cancelled" && a.status !== "noShow")
        const todayRevenue = myTodayAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged), 0)
        return {
          ...s,
          todayRevenue,
        }
      })
      setStaffList(mapped)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    loadStaff()
  }, [tenantId])

  async function handleAddStaff() {
    if (!tenantId || !newName.trim()) return
    setIsCreating(true)
    setCreateError(null)
    try {
      const created = await repositories.staff.create({
        tenantId,
        name: newName.trim(),
        role: newRole,
        active: true,
      })
      setShowAddModal(false)
      setNewName("")
      setNewPhone("")
      setNewEmail("")
      loadStaff()
      onStaff(created.id)
    } catch (err: any) {
      setCreateError(err?.message || "Failed to add staff member.")
    } finally {
      setIsCreating(false)
    }
  }

  const active   = staffList.filter(s => s.active)
  const inactive = staffList.filter(s => !s.active)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Staff</SectionTitle>
        <PrimaryBtn label="Add staff" onClick={() => setShowAddModal(true)} icon="+" />
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[18px] text-gray-900">Add staff member</h3>
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
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white"
                >
                  <option value="Barber">Barber</option>
                  <option value="Senior Barber">Senior Barber</option>
                  <option value="Master Barber">Master Barber</option>
                  <option value="Stylist">Stylist</option>
                  <option value="Senior Stylist">Senior Stylist</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Phone (optional)</label>
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
                  placeholder="e.g. sipho@salon.co.za"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={!newName.trim() || isCreating}
                onClick={handleAddStaff}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-[14px] hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isCreating ? "Adding..." : "Add staff member"}
              </button>
              <SecondaryBtn label="Cancel" onClick={() => setShowAddModal(false)} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading staff...</div>
      ) : staffList.length === 0 ? (
        <Card>
          <EmptyState icon="👥" title="No staff members" body="Add your team to begin scheduling and accepting bookings." cta="Add staff" onCta={() => setShowAddModal(true)} />
        </Card>
      ) : (
        <>
          <Card>
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Active ({active.length})</p>
            </div>
            <div className="divide-y divide-gray-50">
              {active.map(s => (
                <button key={s.id} onClick={() => onStaff(s.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                  {(s as any).avatarUrl ? (
                    <img src={(s as any).avatarUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover bg-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center flex-shrink-0">
                      {s.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-gray-900">{s.name}</p>
                    <p className="text-[12px] text-gray-500">{s.role}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className="text-[14px] font-bold text-gray-900">{fmtR(s.todayRevenue)}</p>
                    <p className="text-[11px] text-gray-400">today</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md">Active</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {inactive.length > 0 && (
            <Card>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Inactive ({inactive.length})</p>
              </div>
              <div className="divide-y divide-gray-50">
                {inactive.map(s => (
                  <button key={s.id} onClick={() => onStaff(s.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left opacity-60">
                    {(s as any).avatarUrl ? (
                      <img src={(s as any).avatarUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover bg-gray-100 flex-shrink-0 grayscale" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 font-bold flex items-center justify-center flex-shrink-0">
                        {s.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-gray-900">{s.name}</p>
                      <p className="text-[12px] text-gray-500">{s.role}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-bold rounded-md mr-2">Inactive</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── STAFF PROFILE ────────────────────────────────────────────────────────────

type StaffTab = "overview" | "schedule" | "breaks" | "exceptions" | "services" | "performance"

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const
const DAY_INDEX_MAP: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
}
const INDEX_DAY_MAP: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday",
}

const DEFAULT_HOURS: Record<string, { enabled: boolean; start: string; end: string }> = {
  Monday:    { enabled:true,  start:"08:00", end:"18:00" },
  Tuesday:   { enabled:true,  start:"08:00", end:"18:00" },
  Wednesday: { enabled:true,  start:"08:00", end:"18:00" },
  Thursday:  { enabled:true,  start:"08:00", end:"18:00" },
  Friday:    { enabled:true,  start:"08:00", end:"18:00" },
  Saturday:  { enabled:true,  start:"09:00", end:"15:00" },
  Sunday:    { enabled:false, start:"09:00", end:"14:00" },
}

export function StaffProfileScreen({ staffId, onBack, onNav }: {
  staffId: string; onBack: () => void; onNav: (v: OpsView) => void
}) {
  const [staff, setStaff] = useState<StaffEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<StaffTab>("overview")

  // Overview metrics
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    monthAppointments: 0,
    completionRate: 100,
    noShowCount: 0,
    uniqueCusts: 0,
    completed: 0,
    cancelled: 0,
  })

  // Schedule state
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleSavedToast, setScheduleSavedToast] = useState(false)

  // Breaks state
  const [breaks, setBreaks] = useState<any[]>([])
  const [showAddBreak, setShowAddBreak] = useState(false)
  const [breakDay, setBreakDay] = useState("Monday")
  const [breakStart, setBreakStart] = useState("12:00")
  const [breakEnd, setBreakEnd] = useState("13:00")
  const [breakLabel, setBreakLabel] = useState("Lunch")

  // Exceptions state
  const [exceptions, setExceptions] = useState<any[]>([])
  const [showAddException, setShowAddException] = useState(false)
  const [excDate, setExcDate] = useState("")
  const [excType, setExcType] = useState<"dayOff" | "customHours">("dayOff")
  const [excStart, setExcStart] = useState("11:00")
  const [excEnd, setExcEnd] = useState("18:00")
  const [excReason, setExcReason] = useState("Day off")

  // Services state
  const [allServices, setAllServices] = useState<ServiceEntity[]>([])
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([])

  // Edit staff modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  function loadStaffData() {
    if (!staffId) {
      setLoading(false)
      return
    }
    setLoading(true)
    repositories.staff.findById(staffId).then(async dbStaff => {
      if (!dbStaff) {
        setStaff(null)
        setLoading(false)
        return
      }
      setStaff(dbStaff)
      setEditName(dbStaff.name)
      setEditRole(dbStaff.role)
      setEditPhone("")
      setEditEmail("")

      const tenantId = dbStaff.tenantId
      const todayStr = new Date().toISOString().slice(0, 10)
      const currentMonthStr = todayStr.slice(0, 7)

      const allTenantAppts = await repositories.appointments.listByTenant(tenantId, 500)
      const staffAppts = allTenantAppts.filter(a => a.staffId === dbStaff.id)

      const completed = staffAppts.filter(a => a.status === "completed")
      const cancelled = staffAppts.filter(a => a.status === "cancelled")
      const noShows = staffAppts.filter(a => a.status === "noShow")
      const uniqueCusts = new Set(staffAppts.map(a => a.customerId)).size

      const todayAppts = staffAppts.filter(a => a.appointmentDate === todayStr && a.status !== "cancelled" && a.status !== "noShow")
      const todayRevenue = todayAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged), 0)

      const monthAppts = staffAppts.filter(a => a.appointmentDate.startsWith(currentMonthStr) && a.status !== "cancelled" && a.status !== "noShow")
      const monthRevenue = monthAppts.reduce((sum, a) => sum + (a.totalPaid || a.totalCharged), 0)

      const totalFinished = completed.length + cancelled.length + noShows.length
      const completionRate = totalFinished > 0 ? Math.round((completed.length / totalFinished) * 100) : 100

      setMetrics({
        todayRevenue,
        monthRevenue,
        monthAppointments: monthAppts.length,
        completionRate,
        noShowCount: noShows.length,
        uniqueCusts,
        completed: completed.length,
        cancelled: cancelled.length,
      })

      try {
        const weekly = await repositories.schedules.getWeeklySchedule(tenantId, dbStaff.id)
        if (weekly && weekly.length > 0) {
          const loadedHours: Record<string, { enabled: boolean; start: string; end: string }> = { ...DEFAULT_HOURS }
          weekly.forEach(w => {
            const dayName = INDEX_DAY_MAP[w.day_of_week]
            if (dayName) {
              loadedHours[dayName] = {
                enabled: w.is_active,
                start: w.start_time?.slice(0, 5) || "08:00",
                end: w.end_time?.slice(0, 5) || "18:00",
              }
            }
          })
          setHours(loadedHours)
        }
      } catch {}

      try {
        const dbBreaks = await repositories.schedules.getBreaks(tenantId, dbStaff.id)
        setBreaks(dbBreaks.map(b => ({
          id: b.id,
          day: INDEX_DAY_MAP[b.day_of_week ?? 1] || "Monday",
          start: b.start_time?.slice(0, 5),
          end: b.end_time?.slice(0, 5),
          label: b.description || "Break",
        })))
      } catch {}

      try {
        const dbExc = await repositories.schedules.getExceptions(tenantId, dbStaff.id)
        setExceptions(dbExc.map(e => ({
          id: e.id,
          date: e.exception_date,
          type: e.is_working ? "customHours" : "dayOff",
          start: e.start_time?.slice(0, 5),
          end: e.end_time?.slice(0, 5),
          label: e.reason || (e.is_working ? "Custom hours" : "Day off"),
        })))
      } catch {}

      try {
        const svcs = await repositories.services.list(tenantId, true)
        setAllServices(svcs)
        const assigned = await repositories.staffServices.listServicesByStaff(tenantId, dbStaff.id)
        setAssignedServiceIds(assigned)
      } catch {}

      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    loadStaffData()
  }, [staffId])

  async function handleToggleActive() {
    if (!staff) return
    const updated = await repositories.staff.update(staff.id, { active: !staff.active })
    setStaff(updated)
  }

  async function handleSaveSchedule() {
    if (!staff) return
    setSavingSchedule(true)
    try {
      for (const day of DAYS) {
        const d = hours[day]
        await repositories.schedules.setDaySchedule(staff.tenantId, staff.id, {
          tenant_id: staff.tenantId,
          staff_id: staff.id,
          day_of_week: DAY_INDEX_MAP[day],
          is_active: d.enabled,
          start_time: d.start,
          end_time: d.end,
        })
      }
      setScheduleSavedToast(true)
      setTimeout(() => setScheduleSavedToast(false), 3000)
    } catch {} finally {
      setSavingSchedule(false)
    }
  }

  async function handleAddBreak() {
    if (!staff) return
    try {
      const added = await repositories.schedules.addBreak(staff.tenantId, staff.id, {
        day_of_week: DAY_INDEX_MAP[breakDay],
        start_time: breakStart,
        end_time: breakEnd,
        description: breakLabel,
      })
      setBreaks(prev => [...prev, {
        id: added.id,
        day: breakDay,
        start: breakStart,
        end: breakEnd,
        label: breakLabel,
      }])
      setShowAddBreak(false)
    } catch {}
  }

  async function handleRemoveBreak(id: string) {
    try {
      await repositories.schedules.removeBreak(id)
      setBreaks(prev => prev.filter(b => b.id !== id))
    } catch {}
  }

  async function handleAddException() {
    if (!staff || !excDate) return
    try {
      const isWorking = excType === "customHours"
      const added = await repositories.schedules.addException(staff.tenantId, staff.id, {
        exception_date: excDate,
        is_working: isWorking,
        start_time: isWorking ? excStart : undefined,
        end_time: isWorking ? excEnd : undefined,
        reason: excReason,
      })
      setExceptions(prev => [...prev, {
        id: added.id,
        date: excDate,
        type: excType,
        start: isWorking ? excStart : undefined,
        end: isWorking ? excEnd : undefined,
        label: excReason,
      }])
      setShowAddException(false)
    } catch {}
  }

  async function handleRemoveException(id: string) {
    try {
      await repositories.schedules.removeException(id)
      setExceptions(prev => prev.filter(e => e.id !== id))
    } catch {}
  }

  async function handleToggleService(serviceId: string) {
    if (!staff) return
    const isAssigned = assignedServiceIds.includes(serviceId)
    if (isAssigned) {
      await repositories.staffServices.unassignService(staff.tenantId, staff.id, serviceId)
      setAssignedServiceIds(prev => prev.filter(id => id !== serviceId))
    } else {
      await repositories.staffServices.assignService(staff.tenantId, staff.id, serviceId)
      setAssignedServiceIds(prev => [...prev, serviceId])
    }
  }

  async function handleSaveEdit() {
    if (!staff || !editName.trim()) return
    setIsSavingEdit(true)
    try {
      const updated = await repositories.staff.update(staff.id, {
        name: editName.trim(),
        role: editRole.trim(),
      })
      setStaff(updated)
      setShowEditModal(false)
    } catch {} finally {
      setIsSavingEdit(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading staff profile...</div>
  }

  if (!staff) {
    return (
      <div className="p-8 text-center">
        <p className="font-bold text-gray-900 mb-2">Staff member not found</p>
        <button onClick={onBack} className="text-gray-500 underline text-[13px]">Go back</button>
      </div>
    )
  }

  const tabs: { key: StaffTab; label: string }[] = [
    { key:"overview",     label:"Overview"     },
    { key:"schedule",     label:"Schedule"     },
    { key:"breaks",       label:"Breaks"       },
    { key:"exceptions",   label:"Exceptions"   },
    { key:"services",     label:"Services"     },
    { key:"performance",  label:"Performance"  },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackBtn onClick={onBack} />

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[18px] text-gray-900">Edit staff member</h3>
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
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Role</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
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
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={!editName.trim() || isSavingEdit}
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-[14px] hover:bg-gray-800 disabled:opacity-50"
              >
                {isSavingEdit ? "Saving..." : "Save changes"}
              </button>
              <SecondaryBtn label="Cancel" onClick={() => setShowEditModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-5 mb-6 flex-wrap">
        {(staff as any).avatarUrl ? (
          <img src={(staff as any).avatarUrl} alt={staff.name} className="w-16 h-16 rounded-2xl object-cover bg-gray-100 flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-700 font-black text-[24px] flex items-center justify-center flex-shrink-0">
            {staff.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h2 className="text-[22px] font-black text-gray-900">{staff.name}</h2>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${staff.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              {staff.active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-[14px] text-gray-500">{staff.role}</p>
        </div>
        <div className="flex gap-2">
          <SecondaryBtn label="Edit" onClick={() => setShowEditModal(true)} />
          {staff.active
            ? <button onClick={handleToggleActive} className="px-4 py-2.5 border-2 border-red-100 text-red-600 rounded-xl text-[13px] font-semibold hover:bg-red-50 transition-colors">Deactivate</button>
            : <button onClick={handleToggleActive} className="px-4 py-2.5 border-2 border-emerald-100 text-emerald-700 rounded-xl text-[13px] font-semibold hover:bg-emerald-50 transition-colors">Reactivate</button>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="px-5">
            <div className="py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Revenue</p>
            </div>
            <OpsDetailRow label="Today"  value={fmtR(metrics.todayRevenue)}  />
            <OpsDetailRow label="Month"  value={fmtR(metrics.monthRevenue)}  />
            <OpsDetailRow label="Appointments this month" value={String(metrics.monthAppointments)} />
          </Card>
          <Card className="px-5">
            <div className="py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Performance</p>
            </div>
            <OpsDetailRow label="Completion rate" value={`${metrics.completionRate}%`} />
            <OpsDetailRow label="No-shows"        value={String(metrics.noShowCount)}  />
            <OpsDetailRow label="Customers served" value={String(metrics.uniqueCusts)} />
          </Card>
        </div>
      )}

      {/* Schedule */}
      {tab === "schedule" && (
        <Card>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Weekly schedule</p>
            {scheduleSavedToast && (
              <span className="text-[12px] font-bold text-emerald-600">Schedule saved ✓</span>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {DAYS.map(day => {
              const d = hours[day]
              return (
                <div key={day} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-24 text-[13px] font-semibold text-gray-900 flex-shrink-0">{day}</span>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={d.enabled}
                      onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], enabled: e.target.checked } }))}
                      className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                  {d.enabled ? (
                    <div className="flex items-center gap-2">
                      <input type="time" value={d.start}
                        onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], start: e.target.value } }))}
                        className="border-2 border-gray-200 rounded-lg px-2 py-1.5 text-[13px] font-mono focus:border-gray-900 outline-none" />
                      <span className="text-gray-400 font-medium">–</span>
                      <input type="time" value={d.end}
                        onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], end: e.target.value } }))}
                        className="border-2 border-gray-200 rounded-lg px-2 py-1.5 text-[13px] font-mono focus:border-gray-900 outline-none" />
                    </div>
                  ) : (
                    <span className="text-[12px] text-gray-400 font-semibold">Off</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
            <PrimaryBtn
              label={savingSchedule ? "Saving..." : "Save schedule"}
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
            />
          </div>
        </Card>
      )}

      {/* Breaks */}
      {tab === "breaks" && (
        <div className="space-y-4">
          {showAddBreak && (
            <Card className="p-5 border-2 border-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[14px] text-gray-900">Add recurring break</h4>
                <button onClick={() => setShowAddBreak(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Day</label>
                  <select value={breakDay} onChange={e => setBreakDay(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none bg-white">
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Label</label>
                  <input type="text" value={breakLabel} onChange={e => setBreakLabel(e.target.value)} placeholder="e.g. Lunch"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] font-mono focus:border-gray-900 outline-none" />
                  <span className="text-gray-400 font-medium">to</span>
                  <input type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] font-mono focus:border-gray-900 outline-none" />
                </div>
              </div>
              <PrimaryBtn label="Add break" onClick={handleAddBreak} />
            </Card>
          )}

          <Card>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Recurring breaks</p>
              {!showAddBreak && <button onClick={() => setShowAddBreak(true)} className="text-[12px] font-bold text-gray-900">+ Add</button>}
            </div>
            {breaks.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[13px]">No recurring breaks configured.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {breaks.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-semibold text-[14px] text-gray-900">{b.label}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{b.day}s, {b.start} – {b.end}</p>
                    </div>
                    <button onClick={() => handleRemoveBreak(b.id)} className="text-[12px] font-bold text-red-500 hover:text-red-700">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Exceptions */}
      {tab === "exceptions" && (
        <div className="space-y-4">
          {showAddException && (
            <Card className="p-5 border-2 border-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[14px] text-gray-900">Add schedule exception</h4>
                <button onClick={() => setShowAddException(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date</label>
                  <input type="date" value={excDate} onChange={e => setExcDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Type</label>
                  <select value={excType} onChange={e => setExcType(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none bg-white">
                    <option value="dayOff">Day off</option>
                    <option value="customHours">Custom hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Reason / Label</label>
                  <input type="text" value={excReason} onChange={e => setExcReason(e.target.value)} placeholder="e.g. Public holiday"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] focus:border-gray-900 outline-none" />
                </div>
                {excType === "customHours" && (
                  <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                    <input type="time" value={excStart} onChange={e => setExcStart(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] font-mono focus:border-gray-900 outline-none" />
                    <span className="text-gray-400 font-medium">to</span>
                    <input type="time" value={excEnd} onChange={e => setExcEnd(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-[13px] font-mono focus:border-gray-900 outline-none" />
                  </div>
                )}
              </div>
              <PrimaryBtn label="Add exception" onClick={handleAddException} />
            </Card>
          )}

          <Card>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Specific dates (Time off / Extra shifts)</p>
              {!showAddException && <button onClick={() => setShowAddException(true)} className="text-[12px] font-bold text-gray-900">+ Add</button>}
            </div>
            {exceptions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[13px]">No upcoming exceptions.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {exceptions.map(e => (
                  <div key={e.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${e.type === "dayOff" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
                          {e.type === "dayOff" ? "Day off" : "Custom hours"}
                        </span>
                        <span className="font-semibold text-[13px] text-gray-900">{e.date}</span>
                      </div>
                      <p className="text-[12px] text-gray-500">
                        {e.label} {e.type === "customHours" && `(${e.start} – ${e.end})`}
                      </p>
                    </div>
                    <button onClick={() => handleRemoveException(e.id)} className="text-[12px] font-bold text-red-500 hover:text-red-700">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Services */}
      {tab === "services" && (
        <Card>
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Assigned services</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Select the services this staff member can perform.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {allServices.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[13px]">No services available in the system.</div>
            ) : (
              allServices.map(s => {
                const assigned = assignedServiceIds.includes(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={assigned} onChange={() => handleToggleService(s.id)}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900" />
                    <div className="flex-1">
                      <p className="font-semibold text-[14px] text-gray-900">{s.name}</p>
                      <p className="text-[12px] text-gray-500">{s.category} · {s.duration} min</p>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </Card>
      )}

      {/* Performance */}
      {tab === "performance" && (
        <Card>
          <EmptyState icon="📈" title="Detailed performance" body="Advanced analytics and commission tracking coming soon." />
        </Card>
      )}
    </div>
  )
}
