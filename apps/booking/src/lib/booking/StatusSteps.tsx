'use client'

import React from "react"
import { BookingData } from "./types"
import { RefundBanner } from "./shared"

        appointmentId: booking.id,
        totalPaid: booking.totalPaid,
        price: booking.totalCharged,
      }

      onFind(lookupRecord)
    } catch {
      setErrorMsg("Failed to find booking. Please check your reference.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Find my booking" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <p className="text-[13px] text-gray-500 leading-relaxed">Enter your booking reference and the phone number or email you used when booking.</p>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Booking reference</label>
          <input
            type="text"
            value={ref}
            onChange={e => setRef(e.target.value.toUpperCase())}
            placeholder="BYB-20260908-00482"
            className={`${inputCls} font-mono tracking-widest`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Phone number or email</label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="082 123 4567 or sipho@gmail.com"
            className={inputCls}
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
          <span className="text-gray-400 text-base flex-shrink-0 mt-0.5">ℹ️</span>
          <p className="text-[12px] text-gray-500 leading-relaxed">No account needed. Your booking reference was sent in your confirmation message.</p>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
        <button
          onClick={handleFind}
          disabled={!valid || loading}
          className={`w-full py-[15px] rounded-2xl font-bold text-[15px] transition-all duration-150 flex items-center justify-center gap-2 ${
            valid && !loading ? "bg-gray-900 text-white active:scale-[0.98] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding…</> : "Find booking"}
        </button>
      </div>
    </div>
  )
}

// ─── 22. BOOKING DETAILS ──────────────────────────────────────────────────────

function BookingDetailsStep({
  booking,
  onBack,
  onCancel,
  onReschedule,
}: {
  booking: BookingData
  onBack: () => void
  onCancel: () => void
  onReschedule: () => void
}) {
  if (!booking.lookupRecord && !booking.reference) {
    return (
      <div className="flex flex-col min-h-full bg-white">
        <StepHeader title="Booking details" onBack={onBack} />
        <div className="flex-1 px-4 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[16px] font-bold text-gray-900">No booking found</p>
          <p className="text-[13px] text-gray-500 mt-1 mb-6">We could not find an active or verified booking record.</p>
          <button onClick={onBack} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors">Go back</button>
        </div>
      </div>
    )
  }

  const b = booking.lookupRecord || {
    reference: booking.reference || "",
    salon: SALON_NAME,
    address: SALON_ADDRESS,
    service: booking.service?.name || "Service",
    staff: booking.staff === null ? "Any Available" : (booking.staff?.name || "Any Barber"),
    date: booking.date || "",
    time: booking.time || "",
    duration: booking.service ? `${booking.service.duration} min` : "30 min",
    paymentStatus: booking.paymentMethod === "card" ? "Paid" : "Pay at shop",
    bookingStatus: "Confirmed",
    appointmentId: booking.appointmentId || "",
    totalPaid: booking.service?.price || 0,
    price: booking.service?.price || 0,
  }
  return (
    <div className="flex flex-col min-h-full bg-white">
      <StepHeader title="Booking details" onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-3 pb-6">
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-900 px-4 py-3.5">
            <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest">{b.salon}</p>
            <p className="text-white font-bold text-[17px] mt-0.5 tracking-tight">{b.service}</p>
          </div>
          <DetailRow label="With"           value={b.staff} />
          <DetailRow label="Date"           value={b.date} />

  { key:"payment",                  label:"Pay online (card)",        emoji:"💳" },
  { key:"paymentSuccessProcessing", label:"Payment success processing",emoji:"⏳" },
  { key:"paymentDuplicate",         label:"Duplicate payment",        emoji:"🚫" },
  { key:"paymentFailed",            label:"Payment failed",           emoji:"❌" },
  { key:"confirmed",                label:"Booking confirmed",        emoji:"✅" },
  { key:"notificationFailure",      label:"Notification failure",     emoji:"📵" },
  { key:"unavailable",              label:"Slot unavailable",         emoji:"⚠️" },
  { key:"slotHoldExpired",          label:"Hold expired",             emoji:"⌛" },
  { key:"fullyBooked",              label:"Fully booked day",         emoji:"📅" },
  { key:"staffUnavailable",         label:"Staff unavailable",        emoji:"🙅" },
  { key:"serviceUnavailable",       label:"Service unavailable",      emoji:"🚫" },
  { key:"salonUnavailable",         label:"Salon unavailable",        emoji:"🏚️" },
  { key:"bookingLookup",            label:"Find my booking",          emoji:"🔍" },
  { key:"bookingDetails",           label:"Booking details",          emoji:"📄" },
  { key:"rescheduleSuccess",        label:"Reschedule success",       emoji:"📅" },
  { key:"rescheduleFailure",        label:"Reschedule failure",       emoji:"⚠️" },
  { key:"cancellationReview",       label:"Cancellation review",      emoji:"🗑️" },
  { key:"cancellationConfirmed",    label:"Cancellation confirmed",   emoji:"❎" },
  { key:"salonCancelled",           label:"Salon cancelled",          emoji:"🏴" },
  { key:"refundProcessing",         label:"Refund processing",        emoji:"💸" },
  { key:"refundCompleted",          label:"Refund completed",         emoji:"💚" },
  { key:"refundFailed",             label:"Refund failed",            emoji:"🔴" },
  { key:"sessionExpired",           label:"Session expired",          emoji:"🔒" },
  { key:"rateLimited",              label:"Rate limited",             emoji:"🛑" },
  { key:"loading",                  label:"Loading state",            emoji:"⏳" },
  { key:"error",                    label:"Network error",            emoji:"📡" },
]

function DemoNav({ current, onJump }: { current: Step; onJump: (s: Step) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-4 z-50 px-4 py-2 bg-black/75 text-white text-[12px] font-semibold rounded-full backdrop-blur-sm shadow-lg hover:bg-black/90 transition-colors"
      >
        {open ? "✕ Close" : "🗂 States"}
      </button>
      {open && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-56 overflow-y-auto" style={{maxHeight:"65vh"}}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 py-2 border-b border-gray-50">Jump to state ({DEMO_STEPS.length})</p>
          {DEMO_STEPS.map(s => (
            <button
              key={s.key}
              onClick={() => { onJump(s.key); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-colors ${
                current === s.key ? "bg-gray-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{s.emoji}</span>
              <span className="leading-snug">{s.label}</span>
            </button>


export function CustomerApp({ salonSlug }: { salonSlug?: string } = {}) {
  const [step,    setStep]    = useState<Step>("salon")
  const [history, setHistory] = useState<Step[]>([])
  const [booking, setBooking] = useState<BookingData>({})

  const [resolvedSalon, setResolvedSalon] = useState<SalonEntity | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [salonLoading, setSalonLoading] = useState<boolean>(true)
  const [salonNotFound, setSalonNotFound] = useState<boolean>(false)

  const [services, setServices] = useState<Service[]>(SERVICES)
  const [staffList, setStaffList] = useState<StaffMember[]>(STAFF)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false)

  // Resolve salon by slug
  useEffect(() => {
    let mounted = true
    setSalonLoading(true)
    setSalonNotFound(false)
    const slugToFind = salonSlug || "fade-and-edge"
    repositories.salons.findBySlug(slugToFind).then(salon => {
      if (!mounted) return
      if (!salon) {
        setSalonNotFound(true)
        setResolvedSalon(null)
        setTenantId(null)
        setStep("salonUnavailable")
      } else {
        setResolvedSalon(salon)
        setTenantId(salon.tenantId)
        setSalonNotFound(false)
      }
    }).catch(() => {
      if (mounted) {
        setSalonNotFound(true)
        setStep("salonUnavailable")
      }
    }).finally(() => {
      if (mounted) setSalonLoading(false)
    })
    return () => { mounted = false }
  }, [salonSlug])

  // Load services
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    repositories.services.list(tenantId).then(items => {
      if (!mounted || !items.length) return
      setServices(items.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description ?? "",
        duration: s.duration,
        price: s.price,
        category: s.category || "Haircuts"
      })))
    }).catch(() => {})
    return () => { mounted = false }
  }, [tenantId])

  // Load staff based on service eligibility
  useEffect(() => {
    if (!tenantId) return
    let mounted = true
    if (!booking.service?.id) {
      repositories.staff.list(tenantId).then(staff => {
        if (!mounted || !staff.length) return
        setStaffList(staff.map(st => ({
          id: st.id,
          name: st.name,
          role: st.role || "Barber",
          photo: st.photoUrl || "photo-1507003211169-0a1dd7228f2d",
          nextAvailable: "09:00"
        })))
      }).catch(() => {})
      return
    }

    repositories.staffServices.listStaffByService(tenantId, booking.service.id).then(async (staffIds) => {
      const allStaff = await repositories.staff.list(tenantId)
      if (!mounted) return
      const filtered = allStaff.filter(st => staffIds.includes(st.id))
      const listToUse = filtered.length > 0 ? filtered : allStaff
      setStaffList(listToUse.map(st => ({
        id: st.id,
        name: st.name,
        role: st.role || "Barber",
        photo: st.photoUrl || "photo-1507003211169-0a1dd7228f2d",
        nextAvailable: "09:00"
      })))
    }).catch(() => {})

    return () => { mounted = false }
  }, [tenantId, booking.service?.id])

  // Compute dynamic availability slots
  useEffect(() => {
    if (!tenantId || !booking.date || !booking.service) {
      return
    }

    let mounted = true
    setSlotsLoading(true)

    const fetchSlots = async () => {
      try {
        if (booking.staff?.id) {
          const slotsList = await availabilityService.getAvailableSlots({
            tenantId,
            serviceId: booking.service!.id,
            date: booking.date!,
            staffId: booking.staff.id
          })
          if (!mounted) return
          setSlots(slotsList.map(s => ({ time: s.time, available: s.available })))
        } else {
          const res = await availabilityService.getAvailableStaffAndSlots({
            tenantId,
            serviceId: booking.service!.id,
            date: booking.date!
          })
          if (!mounted) return
          setSlots(res.slots.map(s => ({ time: s.time, available: s.available })))
        }
      } catch {
        if (mounted) setSlots([])
      } finally {
        if (mounted) setSlotsLoading(false)
      }
    }

    fetchSlots()
