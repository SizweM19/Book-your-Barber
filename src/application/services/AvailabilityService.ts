import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type {
  CanonicalStaffWorkingHours,
  CanonicalScheduleBreak,
  CanonicalScheduleException,
  SalonBookingSettings,
  StaffAssignmentStrategy,
  WorkPeriod,
} from '@/domains/canonical/types'
import type { StaffEntity } from '@/application/repositories/interfaces'

export const DEFAULT_SLOT_INTERVAL_MINUTES = 30

export interface TimeSlot {
  time: string
  available: boolean
  reason?: string
  staffId?: string
}

export interface StaffScheduleRule {
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorking: boolean
}

export interface ScheduleBreak {
  startTime: string
  endTime: string
  description?: string
}

export interface ScheduleException {
  date: string
  isWorking: boolean
  startTime?: string
  endTime?: string
  reason?: string
}

export interface AvailabilityQueryContext {
  tenantId: string
  date: string
  serviceId?: string
  staffId?: string
  durationMinutes?: number
  now?: Date
  schedules?: StaffScheduleRule[]
  breaks?: ScheduleBreak[]
  exceptions?: ScheduleException[]
  advanceDaysLimit?: number
}

export interface AnyAvailableResult {
  slots: TimeSlot[]
  assignmentMap: Record<string, string>
  eligibleStaff: StaffEntity[]
}

export class AvailabilityService {
  constructor(private repos: RepositoryContainer = defaultRepositories) {}

  /**
   * Calculates slot availability for a specified date and staff member,
   * accounting for staff schedules, breaks, date exceptions, and existing bookings.
   * Calculates slot availability for a specified date and optional staff member.
   * If staffId is not provided, calculates aggregated availability across eligible staff.
   */
  async getAvailableSlots(
    context: AvailabilityQueryContext | string,
    maybeDate?: string,
    maybeStaffId?: string,
    maybeDurationMinutes?: number
  ): Promise<TimeSlot[]> {
    const ctx: AvailabilityQueryContext = typeof context === 'string'
      ? {
          tenantId: context,
          date: maybeDate || new Date().toISOString().split('T')[0],
          staffId: maybeStaffId,
          durationMinutes: maybeDurationMinutes,
        }
      : context

    const now = ctx.now || new Date()
    const settings = await this.repos.settings.getBookingSettings(ctx.tenantId)

    if (!settings.online_booking_enabled) {
      return []
    }

    // Check advance days limit
    const maxDays = ctx.advanceDaysLimit ?? settings.max_advance_days
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [tYear, tMonth, tDay] = ctx.date.split('-').map(Number)
    const targetZero = new Date(tYear, tMonth - 1, tDay)
    const diffDays = Math.round((targetZero.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0 || diffDays > maxDays) {
      return []
    }

    // Determine duration
    let duration = ctx.durationMinutes
    if (!duration && ctx.serviceId) {
      const service = await this.repos.services.findById(ctx.serviceId)
      if (!service || !service.active || service.tenantId !== ctx.tenantId) {
        return []
      }
      duration = service.duration
    }
    duration = duration || 45

    // If specific staff is requested
    if (ctx.staffId && ctx.staffId !== 'any') {
      const staff = await this.repos.staff.findById(ctx.staffId)
      if (!staff || !staff.active || staff.tenantId !== ctx.tenantId) {
        return []
      }

      // Check service eligibility if service is specified
      if (ctx.serviceId) {
        const isEligible = await this.repos.staffServices.isEligible(ctx.tenantId, ctx.staffId, ctx.serviceId)
        if (!isEligible) {
          return []
        }
      }

      return this.computeStaffSlots(ctx.tenantId, ctx.staffId, ctx.date, duration, settings, now, ctx)
    }

    // Otherwise ANY AVAILABLE mode
    if (ctx.serviceId) {
      const anyAvail = await this.getAvailableStaffAndSlots({
        tenantId: ctx.tenantId,
        serviceId: ctx.serviceId,
        date: ctx.date,
        now,
      })
      return anyAvail.slots
    }

    return []
  }

  /**
   * Computes available slots for ALL eligible staff members for a service on a given date,
   * applying the salon's configured assignment strategy (FIRST_AVAILABLE, LEAST_BUSY, ROUND_ROBIN).
   */
  async getAvailableStaffAndSlots(params: {
    tenantId: string
    serviceId: string
    date: string
    now?: Date
  }): Promise<AnyAvailableResult> {
    const now = params.now || new Date()
    const settings = await this.repos.settings.getBookingSettings(params.tenantId)

    if (!settings.online_booking_enabled) {
      return { slots: [], assignmentMap: {}, eligibleStaff: [] }
    }

    const service = await this.repos.services.findById(params.serviceId)
    if (!service || !service.active || service.tenantId !== params.tenantId) {
      return { slots: [], assignmentMap: {}, eligibleStaff: [] }
    }

    // Check advance days limit
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [tYear, tMonth, tDay] = params.date.split('-').map(Number)
    const targetZero = new Date(tYear, tMonth - 1, tDay)
    const diffDays = Math.round((targetZero.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0 || diffDays > settings.max_advance_days) {
      return { slots: [], assignmentMap: {}, eligibleStaff: [] }
    }

    // Find active staff eligible for this service
    const allStaff = await this.repos.staff.list(params.tenantId)
    const eligibleStaff: StaffEntity[] = []

    for (const member of allStaff.filter(s => s.active)) {
      const isEligible = await this.repos.staffServices.isEligible(params.tenantId, member.id, params.serviceId)
      if (isEligible) {
        eligibleStaff.push(member)
      }
    }

    if (eligibleStaff.length === 0) {
      return { slots: [], assignmentMap: {}, eligibleStaff: [] }
    }

    // Compute slots for each eligible staff member
    const staffSlotsMap = new Map<string, TimeSlot[]>()
    for (const member of eligibleStaff) {
      const slots = await this.computeStaffSlots(
        params.tenantId,
        member.id,
        params.date,
        service.duration,
        settings,
        now
      )
      staffSlotsMap.set(member.id, slots)
    }

    // Load active appointments for date to support LEAST_BUSY strategy
    const dateAppointments = await this.repos.appointments.listByDate(params.tenantId, params.date)
    const activeAppts = dateAppointments.filter(a => a.status !== 'cancelled' && a.status !== 'noShow')

    // Find all distinct times
    const allTimes = new Set<string>()
    for (const slots of staffSlotsMap.values()) {
      for (const slot of slots) {
        allTimes.add(slot.time)
      }
    }

    const sortedTimes = Array.from(allTimes).sort()
    const resultSlots: TimeSlot[] = []
    const assignmentMap: Record<string, string> = {}
    let roundRobinCounter = 0

    for (const time of sortedTimes) {
      // Find eligible staff available at this time
      const availableMembers = eligibleStaff.filter(member => {
        const slots = staffSlotsMap.get(member.id) || []
        const slot = slots.find(s => s.time === time)
        return slot && slot.available
      })

      if (availableMembers.length === 0) {
        resultSlots.push({ time, available: false, reason: 'No staff available' })
        continue
      }

      // Apply assignment strategy
      const chosenMember = this.selectStaff(
        availableMembers,
        settings.assignment_strategy,
        activeAppts,
        roundRobinCounter
      )
      roundRobinCounter++

      assignmentMap[time] = chosenMember.id
      resultSlots.push({
        time,
        available: true,
        staffId: chosenMember.id,
      })
    }

    return {
      slots: resultSlots,
      assignmentMap,
      eligibleStaff,
    }
  }

  private selectStaff(
    availableStaff: StaffEntity[],
    strategy: StaffAssignmentStrategy,
    activeAppointments: Array<{ staffId?: string }>,
    roundRobinIndex: number
  ): StaffEntity {
    if (availableStaff.length === 1) {
      return availableStaff[0]
    }

    switch (strategy) {
      case 'LEAST_BUSY': {
        const apptCounts = new Map<string, number>()
        for (const s of availableStaff) {
          const count = activeAppointments.filter(a => a.staffId === s.id).length
          apptCounts.set(s.id, count)
        }
        let leastBusy = availableStaff[0]
        let minCount = apptCounts.get(leastBusy.id) ?? 0

        for (let i = 1; i < availableStaff.length; i++) {
          const member = availableStaff[i]
          const count = apptCounts.get(member.id) ?? 0
          if (count < minCount) {
            leastBusy = member
            minCount = count
          }
        }
        return leastBusy
      }

      case 'ROUND_ROBIN': {
        const index = roundRobinIndex % availableStaff.length
        return availableStaff[index]
      }

      case 'FIRST_AVAILABLE':
      default:
        return availableStaff[0]
    }
  }

  private async computeStaffSlots(
    tenantId: string,
    staffId: string,
    date: string,
    durationMinutes: number,
    settings: SalonBookingSettings,
    now: Date,
    contextOverrides?: AvailabilityQueryContext
  ): Promise<TimeSlot[]> {
    // 1. Determine Working Periods
    let workingPeriods: Array<{ start: string; end: string }> = []

    // Check Exceptions
    let hasException = false
    let isWorkingException = true
    let customStart: string | undefined
    let customEnd: string | undefined

    if (contextOverrides?.exceptions) {
      const exc = contextOverrides.exceptions.find(e => e.date === date)
      if (exc) {
        hasException = true
        isWorkingException = exc.isWorking
        customStart = exc.startTime
        customEnd = exc.endTime
      }
    } else {
      const exceptions = await this.repos.schedules.getExceptions(tenantId, staffId, date, date)
      const exc = exceptions.find(e => e.exception_date === date)
      if (exc) {
        hasException = true
        isWorkingException = exc.is_working
        customStart = exc.start_time
        customEnd = exc.end_time
      }
    }

    if (hasException) {
      if (!isWorkingException) {
        return [] // Closed on this date due to exception
      }
      if (customStart && customEnd) {
        workingPeriods = [{ start: customStart, end: customEnd }]
      }
    }

    // If no custom hours from exception, load regular weekly schedule
    if (workingPeriods.length === 0) {
      const [y, m, d] = date.split('-').map(Number)
      const dayOfWeek = new Date(y, m - 1, d).getDay()

      if (contextOverrides?.schedules) {
        const sched = contextOverrides.schedules.find(s => s.dayOfWeek === dayOfWeek)
        if (!sched || !sched.isWorking) return []
        workingPeriods = [{ start: sched.startTime, end: sched.endTime }]
      } else {
        const weekly = await this.repos.schedules.getWeeklySchedule(tenantId, staffId)
        const sched = weekly.find(s => s.day_of_week === dayOfWeek)
        if (!sched || !sched.is_active) return []

        if (sched.periods && sched.periods.length > 0) {
          workingPeriods = sched.periods.map(p => ({ start: p.start_time, end: p.end_time }))
          workingPeriods = sched.periods.map((p: WorkPeriod) => ({ start: p.start_time, end: p.end_time }))
        } else {
          workingPeriods = [{ start: sched.start_time, end: sched.end_time }]
        }
      }
    }

    if (workingPeriods.length === 0) {
      return []
    }

    // 2. Load Breaks
    interface BreakInterval { start: string; end: string }
    let breaks: BreakInterval[] = []

    if (contextOverrides?.breaks) {
      breaks = contextOverrides.breaks.map(b => ({ start: b.startTime, end: b.endTime }))
    } else {
      const [y, m, d] = date.split('-').map(Number)
      const dayOfWeek = new Date(y, m - 1, d).getDay()
      const dbBreaks = await this.repos.schedules.getBreaks(tenantId, staffId)
      breaks = dbBreaks
        .filter(b => b.day_of_week === undefined || b.day_of_week === dayOfWeek)
        .map(b => ({ start: b.start_time, end: b.end_time }))
    }

    // 3. Load Existing Active Appointments
    const appointments = await this.repos.appointments.listByDate(tenantId, date)
    const staffAppointments = appointments.filter(
      a => a.staffId === staffId && a.status !== 'cancelled' && a.status !== 'noShow'
    )

    // 4. Generate Slots
    const slotInterval = settings.slot_interval_minutes || DEFAULT_SLOT_INTERVAL_MINUTES
    const slots: TimeSlot[] = []

    const nowDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const isToday = date === nowDateStr
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const minNoticeCutoff = nowMinutes + settings.min_notice_minutes

    for (const period of workingPeriods) {
      const [startH, startM] = period.start.split(':').map(Number)
      const [endH, endM] = period.end.split(':').map(Number)
      const pStart = startH * 60 + startM
      const pEnd = endH * 60 + endM

      for (let m = pStart; m + durationMinutes <= pEnd; m += slotInterval) {
        const slotStartM = m
        const slotEndM = m + durationMinutes

        const hh = Math.floor(slotStartM / 60).toString().padStart(2, '0')
        const mm = (slotStartM % 60).toString().padStart(2, '0')
        const timeStr = `${hh}:${mm}`

        // Check Minimum Booking Notice for Today
        if (isToday && slotStartM < minNoticeCutoff) {
          slots.push({ time: timeStr, available: false, reason: 'Requires advance booking notice', staffId })
          continue
        }

        // Check Breaks Overlap
        let overlapsBreak = false
        for (const b of breaks) {
          const [bSH, bSM] = b.start.split(':').map(Number)
          const [bEH, bEM] = b.end.split(':').map(Number)
          const bStart = bSH * 60 + bSM
          const bEnd = bEH * 60 + bEM
          if (Math.max(slotStartM, bStart) < Math.min(slotEndM, bEnd)) {
            overlapsBreak = true
            break
          }
        }
        if (overlapsBreak) {
          slots.push({ time: timeStr, available: false, reason: 'Staff on break', staffId })
          continue
        }

        // Check Appointments Overlap (across full service duration)
        let overlapsAppt = false
        for (const a of staffAppointments) {
          const [aSH, aSM] = a.startTime.split(':').map(Number)
          const aStart = aSH * 60 + aSM
          const aEnd = aStart + a.durationMinutes
          if (Math.max(slotStartM, aStart) < Math.min(slotEndM, aEnd)) {
            overlapsAppt = true
            break
          }
        }
        if (overlapsAppt) {
          slots.push({ time: timeStr, available: false, reason: 'Slot already reserved', staffId })
          continue
        }

        slots.push({ time: timeStr, available: true, staffId })
      }
    }

    return slots
  }
}

export const availabilityService = new AvailabilityService()