// No booking found - We could not find an active or verified booking record.
'use client'

import { useState, useEffect } from "react"
import { repositories } from "@/infrastructure/repositories/container"
import { availabilityService } from "@/application/services/AvailabilityService"
import { bookingService } from "@/application/services/BookingService"
import { appointmentService } from "@/application/services/AppointmentService"
import { paymentService } from "@/application/services/PaymentService"
import type { SalonEntity } from "@/application/repositories/interfaces"

import {
  Step, BookingData, Service, StaffMember,
  SERVICES, STAFF,
  SALON_NAME, SALON_ADDRESS,
  ProgressBar,
  SalonPage, ServiceStep, StaffStep, DateStep, TimeStep,
  InfoStep, ReminderStep, SummaryStep,
  PaymentMethodStep, PaymentStep, PaymentSuccessProcessingStep, PaymentDuplicateStep, PaymentFailedStep, ConfirmedStep,
  UnavailableStep, SlotHoldExpiredStep, FullyBookedStep, StaffUnavailableStep, ServiceUnavailableStep, SalonUnavailableStep,
  BookingLookupStep, BookingDetailsStep, RescheduleSuccessStep, RescheduleFailureStep, CancellationReviewStep, CancellationConfirmedStep,
  SalonCancelledStep, RefundProcessingStep, RefundCompletedStep, RefundFailedStep, SessionExpiredStep, RateLimitedStep, LoadingStep, ErrorStep
} from "@/modules/booking"

export default function App() {
  return <CustomerApp />
}

// ─── CUSTOMER BOOKING APP ─────────────────────────────────────────────────────

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
        const activeStaff = staff.filter(st => st.active)
        setStaffList(activeStaff.map(st => ({
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
      const filtered = allStaff.filter(st => st.active && staffIds.includes(st.id))
      setStaffList(filtered.map(st => ({
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
    return () => { mounted = false }
  }, [tenantId, booking.date, booking.staff?.id, booking.service?.id])

  function patch(p: Partial<BookingData>) { setBooking(b => ({ ...b, ...p })) }

  const [isRescheduling, setIsRescheduling] = useState<boolean>(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  function prepareBookingDetailsRecord() {
    const isCash = booking.paymentMethod === "cash"
    const price = booking.service?.price ?? 0
    const staffName = booking.staff === null ? "Any Available" : (booking.staff?.name ?? "—")
    const ref = booking.reference ?? "BYB-20260912-00482"
    const lookupRecord = {
      reference: ref,
      salon: SALON_NAME,
      address: SALON_ADDRESS,
      service: booking.service?.name ?? "Barber Service",
      staff: staffName,
      date: booking.date ?? "",
      time: booking.time ?? "",
      duration: booking.service ? `${booking.service.duration} min` : "30 min",
      paymentStatus: isCash ? "Pay at shop" : "Paid",
      bookingStatus: "Confirmed",
      appointmentId: booking.appointmentId ?? "",
      totalPaid: isCash ? 0 : price,
      price: price,
    }
    patch({ lookupRecord })
    return lookupRecord
  }

  function go(next: Step) {
    setHistory(h => [...h, step])
    setStep(next)
    document.getElementById("booking-scroll")?.scrollTo(0, 0)
  }
  function goBack() {
    const prev = history[history.length - 1]
    if (prev) { setHistory(h => h.slice(0,-1)); setStep(prev) }
  }
  function restart()        { setHistory([]); setBooking({}); setIsRescheduling(false); setStep("salon") }

  const [paymentError, setPaymentError] = useState<{ message: string; reference?: string } | null>(null)

  async function handlePaymentSubmit(cardDetails: { cardNumber: string; name: string; expiry: string; cvv: string }) {
    if (!tenantId) return
    const price = booking.service?.price ?? 0

    // 1. Authorise online payment with gateway adapter
    const intentResult = await paymentService.initiateOnlinePayment({
      appointmentReference: `PENDING-${Date.now()}`,
      amount: price,
      customerName: cardDetails.name || booking.name || "Customer",
      customerPhone: booking.phone || "",
      customerEmail: booking.email || "",
      cardNumber: cardDetails.cardNumber,
      cvv: cardDetails.cvv,
    })

    if (!intentResult.success) {
      setPaymentError({
        message: intentResult.errorMessage || "Payment was declined by your bank or payment provider.",
        reference: intentResult.transactionReference || "GATEWAY_DECLINED",
      })
      go("paymentFailed")
      return
    }

    // 2. Create the booking atomically
    try {
      const result = await bookingService.createBooking({
        tenantId,
        serviceId: booking.service?.id || "s1",
        staffId: booking.staff?.id || "ANY_AVAILABLE",
        date: booking.date || new Date().toISOString().split("T")[0],
        time: booking.time || "09:00",
        customer: {
          name: booking.name || "Customer",
          phone: booking.phone || "0821234567",
          email: booking.email || "customer@example.com"
        },
        paymentMethod: "card",
        providerReference: intentResult.transactionReference,
      })

      patch({
        reference: result.bookingReference,
        appointmentId: result.appointment.id,
        paymentMethod: "card"
      })
      go("paymentSuccessProcessing")
    } catch (err: any) {
      if (err?.message?.includes("no longer available") || err?.message?.includes("conflict")) {
        go("unavailable")
      } else {
        setPaymentError({
          message: err?.message || "Payment authorised, but failed to confirm booking.",
          reference: intentResult.transactionReference,
        })
        go("paymentFailed")
      }
    }
  }

  function renderStep() {
    switch (step) {
      case "salon":
        if (salonLoading && !resolvedSalon && !salonNotFound) {
          return <LoadingStep />
        }
        return (
          <SalonPage
            salon={resolvedSalon}
            services={services}
            onBook={() => go("service")}
            onLookup={() => go("bookingLookup")}
          />
        )
      case "service": return (
        <ServiceStep services={services} selected={booking.service} onSelect={s => patch({ service: s })} onBack={goBack} onNext={() => go("staff")} />
      )
      case "staff": return (
        <StaffStep staffList={staffList} selected={booking.staff} onSelect={s => patch({ staff: s })} onBack={goBack} onNext={() => go("date")} />
      )
      case "date": return (
        <DateStep selected={booking.date} onSelect={d => patch({ date: d })} onBack={goBack} onNext={() => go("time")} />
      )
      case "time": return (
        <TimeStep
          slots={slots}
          loading={slotsLoading}
          selected={booking.time}
          date={booking.date}
          onSelect={t => patch({ time: t })}
          onBack={goBack}
          onNext={async () => {
            if (isRescheduling) {
              const apptId = booking.appointmentId || booking.lookupRecord?.appointmentId
              if (!apptId) {
                setRescheduleError("No active booking found to reschedule.")
                go("rescheduleFailure")
                return
              }
              try {
                const res = await appointmentService.rescheduleAppointment(apptId, booking.date!, booking.time!)
                if (res.error || !res.appointment) {
                  setRescheduleError(res.error || "That slot is no longer available.")
                  go("rescheduleFailure")
                } else {
                  patch({
                    date: booking.date,
                    time: booking.time,
                    appointmentId: res.appointment.id,
                    reference: res.appointment.bookingReference,
                    lookupRecord: booking.lookupRecord ? {
                      ...booking.lookupRecord,
                      date: booking.date!,
                      time: booking.time!,
                      reference: res.appointment.bookingReference,
                    } : undefined,
                  })
                  setIsRescheduling(false)
                  go("rescheduleSuccess")
                }
              } catch (err: any) {
                setRescheduleError(err?.message || "Failed to reschedule appointment.")
                go("rescheduleFailure")
              }
              return
            }
            go("info")
          }}
        />
      )
      case "info": return (
        <InfoStep
          data={{ name: booking.name, phone: booking.phone, email: booking.email }}
          onChange={(k, v) => patch({ [k]: v })}
          onBack={goBack}
          onNext={() => go("reminder")}
        />
      )
      case "reminder": return (
        <ReminderStep selected={booking.reminder} onSelect={r => patch({ reminder: r })} onBack={goBack} onNext={() => go("summary")} />
      )
      case "summary": return (
        <SummaryStep booking={booking} onBack={goBack} onNext={() => go("paymentMethod")} />
      )
      case "paymentMethod": return (
        <PaymentMethodStep
          initial={booking.paymentMethod}
          onBack={goBack}
          onContinue={async (m) => {
            patch({ paymentMethod: m })
            if (m === "cash") {
              if (!tenantId) return
              try {
                const result = await bookingService.createBooking({
                  tenantId,
                  serviceId: booking.service?.id || "s1",
                  staffId: booking.staff?.id || "ANY_AVAILABLE",
                  date: booking.date || new Date().toISOString().split("T")[0],
                  time: booking.time || "09:00",
                  customer: {
                    name: booking.name || "Customer",
                    phone: booking.phone || "0821234567",
                    email: booking.email || "customer@example.com"
                  }
                })
                patch({
                  paymentMethod: "cash",
                  reference: result.bookingReference,
                  appointmentId: result.appointment.id
                })
                go("confirmed")
              } catch (err: any) {
                if (err?.message?.includes("no longer available") || err?.message?.includes("conflict")) {
                  go("unavailable")
                } else {
                  go("error")
                }
              }
            } else {
              go("payment")
            }
          }}
        />
      )
      case "payment": return (
        <PaymentStep
          booking={booking}
          onBack={goBack}
          onSubmitPayment={handlePaymentSubmit}
          onHoldExpired={() => go("slotHoldExpired")}
        />
      )
      case "paymentSuccessProcessing": return (
        <PaymentSuccessProcessingStep onComplete={() => go("confirmed")} />
      )
      case "paymentDuplicate": return <PaymentDuplicateStep />
      case "paymentFailed":    return (
        <PaymentFailedStep
          onRetry={() => go("payment")}
          onBack={() => go("paymentMethod")}
          errorMessage={paymentError?.message}
          errorReference={paymentError?.reference}
        />
      )
      case "confirmed": return (
        <ConfirmedStep
          booking={booking}
          onViewBooking={() => {
            prepareBookingDetailsRecord()
            go("bookingDetails")
          }}
          onReschedule={() => {
            prepareBookingDetailsRecord()
            setIsRescheduling(true)
            setRescheduleError(null)
            go("date")
          }}
          onCancel={() => {
            prepareBookingDetailsRecord()
            go("cancellationReview")
          }}
        />
      )
      case "notificationFailure": return (
        <ConfirmedStep
          booking={{
            ...booking,
            reference:         booking.reference         ?? "BYB-20260908-00482",
            service:           booking.service           ?? SERVICES[0],
            staff:             booking.staff             ?? STAFF[0],
            date:              booking.date              ?? "2026-09-12",
            time:              booking.time              ?? "09:00",
            paymentMethod:     booking.paymentMethod     ?? "card",
            reminder:          booking.reminder          ?? "whatsapp",
            notificationFailed: true,
          }}
          onViewBooking={() => {
            prepareBookingDetailsRecord()
            go("bookingDetails")
          }}
          onReschedule={() => {
            prepareBookingDetailsRecord()
            setIsRescheduling(true)
            setRescheduleError(null)
            go("date")
          }}
          onCancel={() => {
            prepareBookingDetailsRecord()
            go("cancellationReview")
          }}
        />
      )
      case "unavailable":      return <UnavailableStep onChooseTime={() => go("time")} onChooseDate={() => go("date")} />
      case "slotHoldExpired":  return <SlotHoldExpiredStep onChooseTime={() => go("time")} onChooseDate={() => go("date")} />
      case "fullyBooked":      return <FullyBookedStep date={booking.date} onChooseDate={() => go("date")} onChooseStaff={() => go("staff")} />
      case "staffUnavailable": return <StaffUnavailableStep staffName={booking.staff?.name} onChooseStaff={() => go("staff")} onChooseDate={() => go("date")} />
      case "serviceUnavailable": return <ServiceUnavailableStep onChooseService={() => go("service")} />
      case "salonUnavailable": return <SalonUnavailableStep onRetry={() => {
        if (salonSlug) {
          window.location.reload()
        } else {
          go("salon")
        }
      }} />
      case "bookingLookup":    return (
        <BookingLookupStep
          onBack={goBack}
          onFind={(record) => {
            if (record) {
              patch({
                reference: record.reference,
                appointmentId: record.appointmentId,
                lookupRecord: record,
                service: services.find(s => s.name === record.service) || {
                  id: "looked-up",
                  name: record.service,
                  description: "",
                  duration: parseInt(record.duration) || 45,
                  price: record.price,
                  category: "Haircuts"
                }
              })
            }
            go("bookingDetails")
          }}
        />
      )
      case "bookingDetails":   return (
        <BookingDetailsStep
          booking={booking}
          onBack={goBack}
          onCancel={() => go("cancellationReview")}
          onReschedule={() => {
            setIsRescheduling(true)
            setRescheduleError(null)
            go("date")
          }}
        />
      )
      case "rescheduleSuccess": return (
        <RescheduleSuccessStep
          booking={booking}
          onDone={() => {
            prepareBookingDetailsRecord()
            go("bookingDetails")
          }}
        />
      )
      case "rescheduleFailure": return (
        <RescheduleFailureStep
          error={rescheduleError}
          onChooseTime={() => go("time")}
          onChooseDate={() => go("date")}
        />
      )
      case "cancellationReview": return (
        <CancellationReviewStep
          booking={booking}
          onConfirm={async () => {
            const apptId = booking.appointmentId || booking.lookupRecord?.appointmentId || ""
            const ref = booking.reference || booking.lookupRecord?.reference || ""
            const contact = booking.phone || booking.email || booking.lookupRecord?.contact || ""
            if (apptId || ref) {
              try {
                const res = await appointmentService.cancelAppointment(apptId, "customer", ref, contact)
                if (res.error) {
                  console.error("Failed to cancel appointment:", res.error)
                  alert(res.error)
                  return
                }
                patch({
                  cancellationResult: {
                    feePercent: res.feePercent,
                    feeAmount: res.feeAmount,
                    refundAmount: res.refundAmount,
                    reference: res.bookingReference || ref,
                    serviceName: res.serviceName || booking.service?.name || booking.lookupRecord?.service || "Barber Service",
                    chargedAmount: booking.lookupRecord?.price ?? booking.service?.price ?? 0,
                    paidAmount: booking.lookupRecord?.totalPaid ?? (booking.paymentMethod === "cash" ? 0 : (booking.service?.price ?? 0)),
                    cancelledBy: "customer",
                    refundStatus: res.refundAmount > 0 ? "requested" : "none",
                  },
                  lookupRecord: booking.lookupRecord ? {
                    ...booking.lookupRecord,
                    bookingStatus: "Cancelled",
                  } : undefined,
                })
                go("cancellationConfirmed")
              } catch (e: any) {
                console.error("Failed to cancel appointment", e)
                alert(e.message || "Failed to cancel appointment. Please try again.")
              }
            } else {
              go("cancellationConfirmed")
            }
          }}
          onKeep={goBack}
        />
      )
      case "cancellationConfirmed": return (
        <CancellationConfirmedStep
          booking={booking}
          onBackToSalon={restart}
        />
      )
      case "salonCancelled":   return <SalonCancelledStep booking={booking} />
      case "refundProcessing": return <RefundProcessingStep booking={booking} />
      case "refundCompleted":  return <RefundCompletedStep  booking={booking} />
      case "refundFailed":     return <RefundFailedStep     booking={booking} />
      case "sessionExpired":   return <SessionExpiredStep onRestart={restart} />
      case "rateLimited":      return <RateLimitedStep />
      case "loading":          return <LoadingStep />
      case "error":            return <ErrorStep onRetry={() => go("salon")} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen bg-white flex flex-col sm:border-x sm:border-gray-200">
        <ProgressBar step={step} />
        <div id="booking-scroll" className="flex-1 overflow-y-auto overscroll-contain" style={{scrollbarWidth:"none"}}>
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
