import React, { useState, useEffect } from "react"
import { repositories } from "@/infrastructure/repositories/container"
import type { ServiceEntity } from "@/application/repositories/interfaces"
import { useTenantContext } from "@/application/tenant"
import { fmtR, Card, SectionTitle, PrimaryBtn, EmptyState } from "./shared"
import { fmtR, Card, SectionTitle, PrimaryBtn, SecondaryBtn, EmptyState } from "./shared"

const DURATION_OPTIONS = ["15","20","30","45","60","75","90","120"]
const CATEGORY_OPTIONS = ["Haircuts","Beard","Shaving","Combos","Treatments","Colour","Other"]

export function ServiceListScreen() {
  const { tenantId } = useTenantContext()
  const [services, setServices] = useState<ServiceEntity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    let mounted = true
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState("")
  const [addCategory, setAddCategory] = useState("Haircuts")
  const [addDuration, setAddDuration] = useState("30")
  const [addPrice, setAddPrice] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Edit modal state
  const [editingService, setEditingService] = useState<ServiceEntity | null>(null)
  const [editName, setEditName] = useState("")
  const [editCategory, setEditCategory] = useState("Haircuts")
  const [editDuration, setEditDuration] = useState("30")
  const [editPrice, setEditPrice] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function loadServices() {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    repositories.services.list(tenantId, true).then(data => {
      if (mounted) {
        setServices(data)
        setLoading(false)
      }
      setServices(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
    return () => { mounted = false }
  }

  useEffect(() => {
    loadServices()
  }, [tenantId])

  async function toggleActive(id: string) {
    const current = services.find(s => s.id === id)
    if (!current) return
    const updated = await repositories.services.update(id, { active: !current.active })
    setServices(ss => ss.map(s => s.id === id ? updated : s))
  }

  async function handleAddService() {
    if (!tenantId || !addName.trim() || !addPrice) return
    setIsAdding(true)
    setAddError(null)
    try {
      const created = await repositories.services.create({
        tenantId,
        name: addName.trim(),
        category: addCategory,
        duration: Number(addDuration),
        price: Number(addPrice),
        active: true,
      })
      setServices(prev => [...prev, created])
      setShowAddModal(false)
      setAddName("")
      setAddPrice("")
    } catch (err: any) {
      setAddError(err?.message || "Failed to create service.")
    } finally {
      setIsAdding(false)
    }
  }

  function startEdit(s: ServiceEntity) {
    setEditingService(s)
    setEditName(s.name)
    setEditCategory(s.category)
    setEditDuration(String(s.duration))
    setEditPrice(String(s.price))
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editingService || !editName.trim() || !editPrice) return
    setIsEditing(true)
    setEditError(null)
    try {
      const updated = await repositories.services.update(editingService.id, {
        name: editName.trim(),
        category: editCategory,
        duration: Number(editDuration),
        price: Number(editPrice),
      })
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s))
      setEditingService(null)
    } catch (err: any) {
      setEditError(err?.message || "Failed to update service.")
    } finally {
      setIsEditing(false)
    }
  }

  // Group by category
  const categories = Array.from(new Set(services.map(s => s.category)))

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Services</SectionTitle>
        <PrimaryBtn label="Add service" onClick={() => {}} icon="+" />
        <PrimaryBtn label="Add service" onClick={() => setShowAddModal(true)} icon="+" />
      </div>

      {categories.map(cat => {
      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[18px] text-gray-900">Add new service</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            {addError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700">
                {addError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Service name *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="e.g. Skin Fade & Beard Trim"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Category</label>
                <select
                  value={addCategory}
                  onChange={e => setAddCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white"
                >
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Duration</label>
                <select
                  value={addDuration}
                  onChange={e => setAddDuration(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white"
                >
                  {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Price (ZAR) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R</span>
                  <input
                    type="number"
                    value={addPrice}
                    onChange={e => setAddPrice(e.target.value)}
                    placeholder="250"
                    className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={!addName.trim() || !addPrice || isAdding}
                onClick={handleAddService}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-[14px] hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isAdding ? "Saving..." : "Save service"}
              </button>
              <SecondaryBtn label="Cancel" onClick={() => setShowAddModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[18px] text-gray-900">Edit service</h3>
              <button onClick={() => setEditingService(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            {editError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700">
                {editError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Service name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white"
                >
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Duration</label>
                <select
                  value={editDuration}
                  onChange={e => setEditDuration(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none bg-white"
                >
                  {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Price (ZAR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R</span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-[14px] focus:border-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={!editName.trim() || !editPrice || isEditing}
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-[14px] hover:bg-gray-800 disabled:opacity-50"
              >
                {isEditing ? "Saving..." : "Save changes"}
              </button>
              <SecondaryBtn label="Cancel" onClick={() => setEditingService(null)} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading services...</div>
      ) : categories.map(cat => {
        const catServices = services.filter(s => s.category === cat)
        if (catServices.length === 0) return null
        return (
          <div key={cat}>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">{cat}</p>
            <Card>
              <div className="divide-y divide-gray-50">
                {catServices.map(s => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`font-semibold text-[14px] ${s.active ? "text-gray-900" : "text-gray-400"}`}>{s.name}</p>
                        {!s.active && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded">Inactive</span>}
                      </div>
                      <p className="text-[12px] text-gray-500">{s.duration} min</p>
                    </div>
                    <p className={`text-[15px] font-bold flex-shrink-0 mr-4 ${s.active ? "text-gray-900" : "text-gray-400"}`}>{fmtR(s.price)}</p>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={s.active} onChange={() => toggleActive(s.id)} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                      <button className="text-[12px] text-gray-400 hover:text-gray-700 font-semibold transition-colors">Edit</button>
                      <button
                        onClick={() => startEdit(s)}
                        className="text-[12px] text-gray-600 hover:text-gray-900 font-semibold px-2.5 py-1 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      })}

      {services.length === 0 && (
      {!loading && services.length === 0 && (
        <Card>
          <EmptyState icon="✂️" title="No services" body="Add your first service to start accepting bookings." cta="Add service" onCta={() => {}} />
          <EmptyState icon="✂️" title="No services" body="Add your first service to start accepting bookings." cta="Add service" onCta={() => setShowAddModal(true)} />
        </Card>
      )}
    </div>
  )
}
