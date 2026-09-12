# BookYourBarber — Booking Engine Phase 1 Technical Audit

**Date**: 10 September 2026  
**Auditor**: Antigravity Technical Architecture Team  
**Scope**: Booking Engine Foundation (Services, Staff, Staff-Services, Schedules, Breaks, Exceptions, Dynamic Availability, and Booking Orchestration)  
**Status**: Completed Pre-Implementation Assessment  

---

## 1. Executive Summary

The production foundation (TypeScript strict compilation, Next.js routing, Vitest configuration, and repository abstractions) is in place and verified.
However, dynamic booking and availability calculation are not yet wired:
- The customer booking flow (`src/App.tsx`) still relies on static mock arrays (`SERVICES`, `STAFF`, and a hardcoded 20-slot `SLOTS` array).
- Salon manual booking (`src/ops/Appointments.tsx`) relies on hardcoded `SIMPLE_DATES` and `SIMPLE_SLOTS` arrays with local state transitions.
- The `AvailabilityService` contains a rudimentary skeleton with partial rules, lacking multi-period working hours, staff-service eligibility checks, dynamic staff assignment strategies (`FIRST_AVAILABLE`, `LEAST_BUSY`, `ROUND_ROBIN`), and integration with repository data.
- The repository layer does not yet expose dedicated methods or interfaces for `staff_services`, `staff_schedules`, `schedule_breaks`, or `schedule_exceptions`, despite these tables already being defined in PostgreSQL migrations (`supabase/migrations/20260909000001_initial_schema.sql`).

This audit outlines the current architecture, discrepancies, hardcoded artifacts, and the roadmap for Booking Engine Phase 1.

---

## 2. Component-by-Component Analysis

### 2.1 Domain & Canonical Layer (`src/domains`)
- **Canonical Entities (`src/domains/canonical/types.ts`)**:
  - Contains `CanonicalStaffMember`, `CanonicalStaffWorkingHours`, `CanonicalStaffTimeOff`, `CanonicalSalonService`, `CanonicalCustomer`, and `CanonicalAppointment`.
  - **Gap**: `CanonicalStaffWorkingHours` currently represents a single daily interval (`day_of_week`, `start_time`, `end_time`, `is_active`). To support split shifts (e.g. 08:00–12:00 and 14:00–18:00), the model must allow multiple working periods per day or a period-based structure without losing backward compatibility.
  - **Gap**: Staff-service join table (`staff_services`) is present in SQL migration #1 but has no canonical TypeScript interface in `types.ts`.
  - **Gap**: Breaks (`schedule_breaks`) and Schedule Exceptions (`schedule_exceptions`) are in SQL migration #1 but lack formal canonical domain types.

### 2.2 Application Services (`src/application/services`)
- **`AvailabilityService`**:
  - Currently takes an in-memory `AvailabilityQueryContext` and generates 30-minute intervals between `windowStart` and `windowEnd`.
  - **Deficiencies**:
    1. Assumes a single operating window per day (no split shifts).
    2. Only checks exact string equality for appointment conflicts (`bookedTimes.has(timeStr)`), failing to handle service durations that span multiple intervals (e.g., a 75-minute combo starting at 10:00 occupying 10:00, 10:30, and overlapping 11:00).
    3. Does not fetch or validate staff-service eligibility (whether barber X is licensed/assigned to service Y).
    4. Does not implement `getAvailableStaffAndSlots` for the `ANY_AVAILABLE` customer option.
    5. Does not implement salon staff assignment strategies (`FIRST_AVAILABLE`, `LEAST_BUSY`, `ROUND_ROBIN`).
    6. Minimum booking notice (e.g. 30 mins, 2 hours) is not dynamically checked against current time for same-day bookings.
- **`BookingService`**:
  - Resolves customer by phone and generates booking reference `BYB-YYYYMMDD-XXXXX`.
  - **Deficiencies**:
    1. Does not re-validate slot availability prior to appointment insertion, opening a race condition for concurrent bookings.
    2. Does not check staff-service assignment or active status.
    3. Does not support `ANY_AVAILABLE` staff selection resolution into a concrete staff ID prior to insertion.
    4. Does not return clear conflict error message (`"That appointment time is no longer available."`).
- **`AppointmentService`**:
  - Correctly implements business rules for cancellation fees and completion balance checks (`totalCharged === totalPaid`).
  - **Deficiencies**:
    1. `rescheduleAppointment` creates a new appointment instead of updating the existing appointment, and does not check slot availability with `AvailabilityService`.
    2. Missing validation for staff working hours when rescheduling.

### 2.3 Repositories & Data Abstraction (`src/application/repositories`, `src/infrastructure/repositories`)
- **Repository Interfaces (`interfaces.ts`)**:
  - Defines `CustomerRepository`, `ServiceRepository`, `StaffRepository`, `AppointmentRepository`, `PaymentRepository`, `RefundRepository`, `ExpenseRepository`.
  - **Missing**:
    - `StaffServiceRepository` (or `StaffRepository.getAssignedServices`, `assignService`, `getStaffForService`).
    - `ScheduleRepository` for working hours (supporting multiple periods), breaks, and date exceptions.
    - `SalonSettingsRepository` for tenant booking rules (max advance days, min notice, assignment strategy, slot interval).
- **`MockRepositories.ts`**:
  - In-memory mock data implements basic CRUD for customers, services, staff, appointments, payments, refunds, expenses.
  - **Missing**: Rich fixtures for staff schedules, breaks, date exceptions, and staff-service joins to test realistic scenarios (e.g., barber on leave, barber with lunch break, barber not performing beard trims).
- **`SupabaseRepositories.ts`**:
  - Implements browser Supabase client calls matching `interfaces.ts`.
  - Cleanly isolated, waiting for production credentials.

### 2.4 Customer Booking Experience (`src/App.tsx`)
- **Hardcoded Data**:
  - `SERVICES`: 6 static services (Classic Haircut, Line-up, Kids Cut, Beard Trim, Hot Towel Shave, Combo).
  - `STAFF`: 4 static barbers with hardcoded `nextAvailable` strings.
  - `SLOTS`: 20 hardcoded slots (`08:00` to `17:30`) with static `available: true/false`.
- **UI Logic Inconsistencies**:
  - `TimeStep` splits `SLOTS` into morning and afternoon without considering dynamic start/end operating times.
  - `CustomerApp.renderStep()` transitions to `confirmed` simply by generating a mock reference and updating React state without invoking `BookingService` or `AvailabilityService`.
  - Public route `/book/[salonSlug]` delegates to `CustomerApp` but does not pass `salonSlug` to load salon data dynamically.

### 2.5 Salon Operations Experience (`src/ops/`)
- **`Appointments.tsx`**:
  - `AppointmentListScreen` filters `OPS_APPOINTMENTS` from static `data.ts`.
  - `CreateApptScreen` uses static `SIMPLE_DATES` and `SIMPLE_SLOTS` with demo state transitions.
  - `RescheduleScreen` has a demo button `"Demo: simulate conflict"` that toggles local state rather than evaluating real schedule conflicts.
- **`Settings.tsx`**:
  - `AvailabilityScreen` contains a local `computeAvailability` helper with hardcoded `BREAK_SLOTS = new Set(["12:00", "12:30"])` and hardcoded working hours `[480, 1020]`.
  - `BookingSettingsScreen` holds timing and assignment strategy in local React component state.
- **`Staff.tsx`**:
  - `StaffProfileScreen` defines local `DEFAULT_HOURS`, `breaks`, and `exceptions` arrays in state.

---

## 3. Discrepancies Against Documented Business Rules

| Documented Rule (Phase 1 Spec & BOOKING-RULES.md) | Current Implementation Status | Severity |
| :--- | :--- | :--- |
| **Staff-Service Eligibility**: Barber must be assigned to service | No check performed in `App.tsx` or `Appointments.tsx` | High |
| **Split Shifts**: Multiple working periods per day | Model assumes single continuous interval (`start_time` - `end_time`) | High |
| **Dynamic Break Exclusion**: Remove break periods from slots | Only present in skeleton `AvailabilityService` with static parameters | High |
| **Date Exceptions**: `CLOSED` or `CUSTOM_HOURS` override weekly schedule | Skeleton exists in `AvailabilityService`, not wired to data repository | High |
| **Service Duration Span**: E.g. 75 min service must block 3 consecutive 30m slots | `AvailabilityService` checks `bookedTimes.has(timeStr)` for slot start only | Critical |
| **Any Available Assignment**: `FIRST_AVAILABLE`, `LEAST_BUSY`, `ROUND_ROBIN` | Completely unimplemented; UI treats `null` staff as passive placeholder | Critical |
| **Concurrency Protection**: Server-side re-validation before commit | `BookingService` creates appointment blindly without re-checking availability | Critical |
| **Minimum Booking Notice**: Reject slots within notice window (e.g. 30 min) | Not enforced for same-day bookings | High |
| **Maximum Advance Limit**: Reject dates beyond salon configured limit | Partially drafted in `AvailabilityService`, not connected to salon settings | Medium |
| **Repository as Single Source of Truth**: UI must read from repositories | UI reads from static `data.ts` and `App.tsx` constants | Critical |

---

## 4. Hardcoded Availability & Mock Inventory

1. **`src/App.tsx`**:
   - `SLOTS` (lines 74–85): 20 static entries with fixed boolean availability.
   - `SERVICES` (lines 58–65): 6 static services.
   - `STAFF` (lines 67–72): 4 static staff with hardcoded `nextAvailable: "09:00"`.
2. **`src/ops/Appointments.tsx`**:
   - `SIMPLE_DATES` (lines 561, 676): Array of 6 date strings.
   - `SIMPLE_SLOTS` (lines 562, 677): Array of 10 times (`09:00` - `14:30`).
3. **`src/ops/Settings.tsx`**:
   - `BREAK_SLOTS` (line 516): Hardcoded `["12:00", "12:30"]`.
   - `computeAvailability` (lines 519–541): Hardcoded working hours (8:00 to 17:30).
4. **`src/ops/Staff.tsx`**:
   - `DEFAULT_HOURS` (lines 77–85): Hardcoded weekly schedule dictionary.
   - `breaks` & `exceptions` (lines 100–107): Hardcoded fixture arrays.

---

## 5. Architectural Remediation Plan

To fulfill Booking Engine Phase 1 without connecting Supabase or breaking existing UI screens, the following steps will be executed:

1. **Domain Data Models**:
   - Define canonical types for `CanonicalStaffService`, `CanonicalStaffSchedulePeriod` (supporting multi-period/split shifts), `CanonicalScheduleBreak`, `CanonicalScheduleException`, and `SalonBookingSettings`.
2. **Repository Layer Extension**:
   - Add `ScheduleRepository`, `StaffServiceRepository`, and `SalonSettingsRepository` to `interfaces.ts`.
   - Implement these repositories in `MockRepositories.ts` with comprehensive development fixtures (3 barbers with varied schedules, breaks, exceptions, and service capabilities).
   - Implement stub signatures in `SupabaseRepositories.ts` ready for live PostgreSQL queries.
   - Update `container.ts` to include the new repositories in `RepositoryContainer`.
3. **Availability Engine (`AvailabilityService`)**:
   - Implement full availability calculation:
     - Tenant and service validation.
     - Staff-service eligibility filtering.
     - Recurring weekly schedule resolution (multi-period / split shift support).
     - Schedule exception overrides (`CLOSED` or custom hours).
     - Break exclusion.
     - Appointment overlap detection covering full service duration.
     - Minimum booking notice (filtering past or immediate slots on today's date).
     - Maximum advance booking window enforcement.
     - Centralized slot interval (default 30 mins).
   - Implement `getAvailableStaffAndSlots` supporting `FIRST_AVAILABLE`, `LEAST_BUSY`, and `ROUND_ROBIN` assignment strategies.
4. **Booking Orchestration & Concurrency (`BookingService`)**:
   - Re-evaluate availability atomically before creating appointment records.
   - If slot is occupied concurrently, reject with `"That appointment time is no longer available."`.
   - Tenant-scoped customer resolution (`findOrCreateCustomer`).
   - Booking reference generation (`BYB-YYYYMMDD-XXXXX`).
5. **Reschedule & Cancellation Validation (`AppointmentService`)**:
   - Validate availability for the target reschedule slot and update the appointment record in-place.
   - Retain cancellation fee calculation and zero outstanding balance completion invariant.
6. **Automated Unit & Integration Testing**:
   - Create `tests/unit/availability-engine.test.ts` testing all 14 scenarios from Spec #34 and #35.
   - Create `tests/unit/booking-service.test.ts` testing all scenarios from Spec #36.
   - Verify zero regressions across existing 44 tests.
7. **UI Integration**:
   - Wire `/book/[salonSlug]` to load services, eligible staff, and dynamic slots via `AvailabilityService` and `BookingService`.
   - Wire salon manual booking in `src/ops/Appointments.tsx` to use the same services and repositories.
   - Connect salon calendar and appointment list to `AppointmentRepository`.

---
*End of Audit Document — Ready for Implementation Phase.*

