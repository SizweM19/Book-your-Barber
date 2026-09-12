# BookYourBarber � Pre-Supabase Integration Audit

**Date:** 2026-09-11  
**Scope:** Read-only architectural and security audit to determine readiness for transitioning from MockRepositories to live Supabase persistence.  
**Constraint:** No application code was modified during this audit.

---

## Audit Summary

> [!CAUTION]
> **NOT YET READY TO CONNECT SUPABASE**  
> Three blocking issues must be resolved before the Supabase switch can be made safely.

---

## Section 1 � Repository Interface Parity

All 11 repositories (salons, customers, services, staff, appointments, payments, refunds, expenses, staffServices, schedules, settings) have complete parity across Interface / Mock / Supabase layers. All method signatures match exactly.

---

## Section 2 � Domain Entity to Database Column Mapping

Most mappings are correct and consistent. Two findings:

### Field Name Mismatch: is_active vs is_working
CanonicalStaffWorkingHours uses `is_active`, but `staff_schedules` table column is `is_working`. SupabaseScheduleRepository compensates in mapSchedule(). **Risk: LOW** � isolated mapping, no functional bug.

### BLOCKER � salon_profiles Table Missing from Migrations
SupabaseSalonRepository and SupabaseSalonSettingsRepository both query `salon_profiles` table. This table does NOT exist in either migration file. Connecting Supabase breaks /book/[salonSlug] entirely.

---

## Section 3 � Tenant Isolation Architecture

All list() and filter calls pass tenantId. Customer booking flow correctly resolves salonSlug ? tenantId via SalonRepository.findBySlug(). DEFAULT_TENANT_ID removed from booking path.

**Gap:** src/application/tenant/server.ts referenced in ARCHITECTURE.md does not exist. The /app/* ops screens still use DEFAULT_TENANT_ID for data calls. When Supabase is connected, authenticated users will see the wrong salon's data.

Cross-tenant tests in rls-isolation.test.ts verify Mock isolation only � no live Supabase RLS tests exist.

---

## Section 4 � Row Level Security Design Analysis

### Helper Functions
Three SECURITY DEFINER helpers: is_tenant_member(), get_tenant_role(), is_platform_admin(). All correct.

### Open Policy Risks

1. **Tenants SELECT** � `status = 'active'` clause makes every salon's contact details publicly readable by anonymous users. Risk: MEDIUM.

2. **staff_services, staff_schedules, schedule_breaks, schedule_exceptions SELECT** � All use `USING (TRUE)`, making all schedule data readable by anyone. Risk: LOW (intentional for booking widget, but undocumented).

3. **Customers INSERT** � `WITH CHECK (TRUE)` allows inserting customer records into any tenant's CRM without verification. Risk: MEDIUM.

4. **Appointments SELECT** � `(auth.uid() IS NULL AND booking_reference IS NOT NULL)` is too broad: any anon user can read ALL appointments, not just the one matching their reference. Risk: HIGH.

5. **Payments INSERT** � `OR auth.uid() IS NULL` allows unauthenticated writes to the payments ledger. Risk: MEDIUM.

---

## Section 5 � Public Booking Flow Security

Flow is architecturally correct end-to-end. One gap: SupabaseSalonRepository.findBySlug() does not filter `active = TRUE` (MockSalonRepository does). Inactive salons would still resolve in Supabase mode. Risk: LOW.

Booking reference collision has no retry logic in BookingService � would surface as an unhandled DB error. Risk: LOW at current scale.

---

## Section 6 � Authentication Architecture

Production auth path (login, register, PKCE callback, session refresh, logout) is complete and correct.

Dev auth is gated by `NODE_ENV !== 'production'` � safe for production.

### BLOCKER � Dead Code in client.ts
src/infrastructure/supabase/client.ts has duplicate return statements:

```
if (typeof window === 'undefined') {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey)  // ? executed (no fallback)
  return createBrowserClient(url, key)                               // ? DEAD CODE
}
```

The placeholder fallback URL/key variables (`url`, `key`) are never actually used in the server-side path. If NEXT_PUBLIC_SUPABASE_URL is empty, the server-side client is created with an empty string. Risk: MEDIUM.

---

## Section 7 � Database Schema Constraints

All business status enums are enforced by CHECK constraints. booking_reference and refund_reference have UNIQUE constraints. No DB-level constraint prevents double-booking.

### BLOCKER � salon_profiles Table Missing (duplicate of Section 2 for emphasis)
Neither migration file creates a salon_profiles table. SupabaseSalonRepository and SupabaseSalonSettingsRepository query it. This will fail immediately on Supabase connection.

---

## Section 8 � Concurrency & Slot Collision Protection

BookingService performs a re-validation read before insert (read-then-write), but there is no database-level unique constraint on (staff_id, appointment_date, start_time). Under concurrent load, double-booking is possible.

**Recommended fix:** Add a partial unique index: `CREATE UNIQUE INDEX ... ON appointments(staff_id, appointment_date, start_time) WHERE status NOT IN ('cancelled');`

Risk: MEDIUM.

---

## Section 9 � Environment Security

- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY validated by validateEnv() with URL structure check.
- SUPABASE_SERVICE_ROLE_KEY is server-only, validated at use-time in admin.ts.
- Admin client throws on browser instantiation.
- No credentials committed to repo.

---

## Section 10 � Test Coverage Assessment

9 test suites, 77 tests, all passing. Coverage is strong for unit/domain/mock layers. Key gaps:

- No integration tests against live Supabase RLS policies.
- No test for the anon appointment SELECT exploit.
- No double-booking concurrency test.
- No test verifying salon_profiles queries (table is missing).

---

## Section 11 � Final Classification

### Blocking Issues (Must Fix Before Supabase Connection)

| # | Issue | Location |
| :--- | :--- | :--- |
| B1 | salon_profiles table missing from migrations | supabase/migrations/ + SupabaseRepositories.ts |
| B2 | Dead code in client.ts � SSR path bypasses placeholder fallback | src/infrastructure/supabase/client.ts |
| B3 | Ops portal has no tenant resolver � hardcodes DEFAULT_TENANT_ID | src/App.tsx ops screens |

### High-Priority Pre-Production Issues

| # | Issue |
| :--- | :--- |
| H1 | Appointments SELECT RLS allows anon access to all appointments |
| H2 | No DB unique constraint preventing double-booking |
| H3 | Customers INSERT RLS allows junk records in any tenant CRM |

### Medium-Priority Issues

| # | Issue |
| :--- | :--- |
| M1 | Tenants SELECT exposes all salon contact details publicly |
| M2 | Payments INSERT allows unauthenticated writes |
| M3 | SupabaseSalonRepository.findBySlug() missing active = TRUE filter |
| M4 | is_active / is_working field name mismatch in schedule domain |
| M5 | No booking reference collision retry logic |

---

## Verdict

**NOT YET READY TO CONNECT SUPABASE**

Three blockers prevent safe Supabase activation:

**B1** � salon_profiles table missing. Both SupabaseSalonRepository and SupabaseSalonSettingsRepository query a non-existent table. The entire booking flow fails immediately.

**B2** � Dead code in client.ts bypasses the placeholder fallback on the SSR path. Server components will receive an empty URL.

**B3** � The ops portal (/app/*) still uses a hardcoded DEFAULT_TENANT_ID for all data calls. Authenticated owners/managers will see the wrong salon data.

Once blockers B1�B3 are resolved, the architecture is fundamentally sound. Immediately after Supabase activation, address H1 (appointments RLS), H2 (double-booking constraint), and H3 (customers INSERT policy).


---

## Pre-Supabase Blocking Fixes — Completed (Hardening Phase)

**Audit Resolution Status: READY TO CONNECT SUPABASE**
*(Note: Codebase, migrations, security policies, and tenant isolation abstractions are fully prepared for Supabase connection. Live database integration testing against a provisioned Supabase instance will take place in the subsequent development milestone.)*

### Summary of Completed Hardening Fixes

#### 1. Blockers Resolved
- **B1: salon_profiles Database Model & Migration Parity**
  - Created migration `supabase/migrations/20260911000001_pre_supabase_hardening.sql` establishing table `salon_profiles` with unique lower-case slug index, tenant foreign key, updated_at trigger, and strict RLS policies.
  - Added seed data in `supabase/seed.sql` for Fade & Edge Barbershop (tenant `11111111-1111-1111-1111-111111111111`).
  - Added `active = true` filter to `SupabaseSalonRepository.findBySlug()`.
  - Documented `salon_profiles` in `docs/DATABASE.md`.
- **B2: Supabase Client Configuration & Clean Fallback**
  - Refactored `src/infrastructure/supabase/client.ts` with helper functions `isSupabaseConfigured()` and `getClientSupabaseConfig()`.
  - Harmonized `server.ts` and `middleware.ts` to use safe offline fallbacks with placeholder credentials without throwing unhandled exceptions.
  - Confirmed zero exposure of `SUPABASE_SERVICE_ROLE_KEY` in client-side bundles.
- **B3: Tenant Context Resolution & Elimination of Hardcoded Tenant ID**
  - Created tenant module in `src/application/tenant/`:
    - `types.ts`: Defined `TenantContextState`, `ResolvedTenant`.
    - `context.tsx`: Provided `TenantProvider` and `useTenantContext()` hook.
    - `server.ts`: Implemented request-scoped `resolveServerTenantContext()`.
  - Wrapped salon operational layout (`src/app/app/layout.tsx`) in `<TenantProvider>`.
  - Replaced all hardcoded `DEFAULT_TENANT_ID` occurrences across ops screens (`Calendar.tsx`, `Appointments.tsx`, `Services.tsx`) with dynamic context values (`useTenantContext()`).

#### 2. High-Priority Security & Concurrency Issues Resolved
- **H1: Secure Public Guest Appointment Lookup**
  - Replaced broad public SELECT on `appointments` with a dedicated, secure stored procedure `lookup_guest_appointment(p_reference, p_verification_contact)` (SECURITY DEFINER) in `20260911000001_pre_supabase_hardening.sql`.
  - Implemented `lookupGuestBooking()` in `AppointmentService.ts` requiring reference + matching phone or email.
  - Restricts return data strictly to non-sensitive guest fields (`GuestBookingDetails`), preventing exposure of internal customer profiles or CRM notes.
- **H2: Database Double-Booking Concurrency Protection**
  - Added partial unique index `idx_appointments_staff_slot_unique` on `appointments(tenant_id, staff_id, appointment_date, start_time)` WHERE `status NOT IN ('cancelled') AND staff_id IS NOT NULL` in migration.
  - Added slot overlap and duplicate reference collision validation in `MockAppointmentRepository.create()`.
  - Documented concurrency rules in Section 2.6 of `docs/BOOKING-RULES.md`.
- **H3: Secure Customer Creation & Tenant Scoping**
  - Replaced open `WITH CHECK (TRUE)` on `customers` table with active tenant verification constraint:
    `EXISTS (SELECT 1 FROM tenants WHERE id = customers.tenant_id AND status = 'active')`.
  - Hardened `CustomerService.findOrCreate()` with strict tenant ID verification, preventing cross-tenant customer injection.

#### 3. Verification & Quality Gates
- **Unit & Integration Tests**: 10 test suites, 94 tests passing (100% pass rate in Vitest).
- **TypeScript Strictness**: `npx tsc --noEmit --incremental false` passed with 0 errors.
- **Next.js Production Build**: `npm run build` compiled and generated all 18 routes and middleware cleanly with 0 errors.

---

## Final Pre-Supabase Cleanup & Concurrency Hardening (Completed)

Following the initial hardening phase, a final focused cleanup pass was executed to eliminate remaining unsafe development fallbacks, replace point-in-time slot uniqueness with interval-based exclusion constraints, and complete the token audit across the codebase.

### 1. Hardening Actions Completed

#### A. PostgreSQL Exclusion Constraint for Overlapping Appointments (Fix H2 Extension)
- **Problem**: A partial unique index on `(tenant_id, staff_id, appointment_date, start_time)` allowed overlapping appointments with different start times and non-zero duration (e.g. 09:00–10:00 vs 09:30–10:00).
- **Resolution**:
  - Dropped `idx_appointments_staff_slot_unique`.
  - Enabled `CREATE EXTENSION IF NOT EXISTS btree_gist;`.
  - Added stored generated column:
    ```sql
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_range tsrange
      GENERATED ALWAYS AS (
        tsrange(
          (appointment_date + start_time),
          (appointment_date + start_time + (duration_minutes * INTERVAL '1 minute')),
          '[)'
        )
      ) STORED;
    ```
  - Added GiST exclusion constraint:
    ```sql
    ALTER TABLE appointments ADD CONSTRAINT exclude_overlapping_staff_appointments
      EXCLUDE USING gist (
        tenant_id WITH =,
        staff_id WITH =,
        appointment_range WITH &&
      )
      WHERE (status NOT IN ('cancelled') AND staff_id IS NOT NULL);
    ```
  - Updated `MockAppointmentRepository.create` to validate full interval intersection (`newStart < existingEnd && existingStart < newEnd`).
  - Added active salon existence validation to appointments INSERT policy: `EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND status = 'active')`.
  - Documented in `docs/DATABASE.md` and `docs/BOOKING-RULES.md`.

#### B. Total Removal of `SIMPLE_SLOTS` and `SLOTS` Fallbacks
- Removed hardcoded `SLOTS` mock array and fallback from `src/App.tsx`.
- Removed all `SIMPLE_SLOTS` fallback behavior in `src/ops/Appointments.tsx` (`RescheduleScreen`, `CreateApptScreen`).
- When no slots are available, UI now displays "No available times" / empty state rather than fabricating slots.
- `AvailabilityService` is now the sole authority on slot availability.

#### C. Removal of `MOCK_LOOKUP` from Production Booking Lookup
- Removed `MOCK_LOOKUP` constant from `src/App.tsx`.
- If lookup fails or no verified booking record is present, `BookingDetailsStep` displays a clean "No booking found" empty state rather than populating demo customer data.

#### D. Elimination of `OPS_APPOINTMENTS` from Initial State & Fallbacks
- `dbAppts` in `Appointments.tsx` and `allAppts` in `Calendar.tsx` now initialize to empty arrays `[]` with proper loading states.
- Modals (`AppointmentDetailScreen`, `CancelApptScreen`, `NoShowScreen`, `RescheduleScreen`) no longer default to `OPS_APPOINTMENTS[1]` or `OPS_APPOINTMENTS[4]` on uninitialized props or failed lookups.
- `OPS_APPOINTMENTS` is preserved only in `src/ops/data.ts` as a test/mock fixture.

#### E. Dynamic Date Calculation Replacing Hardcoded `TODAY`
- Replaced hardcoded `TODAY` comparisons ("2026-09-08") in `src/ops/Appointments.tsx` and `src/ops/Calendar.tsx` with dynamic ISO date string evaluation (`new Date().toISOString().split("T")[0]`).

---

### 2. Codebase Token Audit Summary

| Token | Production UI / App Files | Migrations / DB Layer | Mock Store / Test Fixtures | Audit Verdict |
| :--- | :--- | :--- | :--- | :--- |
| `DEFAULT_TENANT_ID` | **0 occurrences** | **0 occurrences** | In-memory mock store seed (`MockRepositories.ts`) | ✅ Clean — No production leakage |
| `SIMPLE_SLOTS` | **0 occurrences** | **0 occurrences** | **0 occurrences** | ✅ Clean — Completely eliminated |
| `MOCK_LOOKUP` | **0 occurrences** | **0 occurrences** | **0 occurrences** | ✅ Clean — Completely eliminated |
| `OPS_APPOINTMENTS` | **0 initial state occurrences** | **0 occurrences** | Fixture in `src/ops/data.ts` | ✅ Clean — No state masking |
| `TODAY` | **0 filter comparisons** | **0 occurrences** | Fixture in `src/ops/data.ts` | ✅ Clean — Dynamic dates used |
| `WITH CHECK (TRUE)` | **0 occurrences** | **0 occurrences** | **0 occurrences** | ✅ Clean — Replaced with active tenant checks |

---

### 3. Readiness Status Distinction

| Component | Status | Verification Detail |
| :--- | :--- | :--- |
| **Codebase Architecture & Fallbacks** | ✅ READY TO CONNECT SUPABASE | All hardcoded fallbacks removed; repository container and tenant context fully isolated. |
| **Migrations & DDL Definitions** | ✅ READY TO CONNECT SUPABASE | Migration `20260911000001_pre_supabase_hardening.sql` fully specifies schemas, GiST exclusion constraints, and RLS policies. |
| **Client Configuration & Safe Offline Fallback** | ✅ READY TO CONNECT SUPABASE | `client.ts`, `server.ts`, and `middleware.ts` gracefully handle absent Supabase credentials without throwing. |
| **TypeScript & Build Pipeline** | ✅ READY TO CONNECT SUPABASE | 0 type errors; Next.js production build cleanly compiles all 18 routes and middleware. |
| **Unit & Mock Repository Test Suite** | ✅ READY TO CONNECT SUPABASE | 11 test suites, 105 tests passing (100% green in Vitest). |
| **Live Database GiST Exclusion Enforcement** | ⏳ NOT YET VERIFIED AGAINST SUPABASE | Requires running migration against a live PostgreSQL instance with `btree_gist` enabled to verify engine-level conflict abortion under concurrent transaction load. |
| **Live Database RLS Security Policies** | ⏳ NOT YET VERIFIED AGAINST SUPABASE | Requires running automated RLS security tests against live Supabase instance with anonymous and authenticated JWTs. |
| **Live Guest Lookup RPC Function Execution** | ⏳ NOT YET VERIFIED AGAINST SUPABASE | Requires executing `lookup_guest_appointment()` on live PostgreSQL instance to verify query planner execution and column data mapping. |

---

### 4. Verification Suite Results
- **TypeScript**: `npx tsc --noEmit --incremental false` — **0 errors**
- **Test Suite**: `npm test` — **11 test files, 105 tests passed (100%)**
- **Production Build**: `npm run build` — **All 18 routes and middleware generated successfully**
