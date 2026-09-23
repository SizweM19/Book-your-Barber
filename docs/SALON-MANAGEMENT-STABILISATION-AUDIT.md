# Salon Management & Customer Experience Stabilisation Audit
**Document:** `docs/SALON-MANAGEMENT-STABILISATION-AUDIT.md`  
**Status:** In Progress / Baseline Established  
**Date:** September 16, 2026  
**Lead Engineer:** Antigravity Pair Programming Engine

---

## 3. Implementation & Resolution Summary

| Issue | Resolution Status | Components / Files Modified | Notes |
| :--- | :--- | :--- | :--- |
| **1. Dashboard Navigation** | **Resolved** | `src/ops/Dashboard.tsx`, `src/app/app/page.tsx`, `src/ops/shared.tsx`, `tests/unit/dashboard-navigation.test.ts` | Explicit routing for `createAppt` -> `/app/appointments?action=create`, `appointmentList` -> `/app/appointments`, `calendar` -> `/app/calendar`. Appointments stat card clickable. Fake shortcuts removed. |
| **2. Cancellation Policy** | **Resolved** | `src/ops/Settings.tsx` | Aligned with exact platform rules: >24h = 10% fee / 90% refund; <=24h = 18% fee / 82% refund; salon cancellation = 0% fee / 100% refund; 3–5 business days refund expectation; platform-controlled notice. |
| **3. Financial Architecture** | **Resolved** | `src/application/services/FinancialService.ts`, `src/ops/Financials.tsx`, `src/ops/Appointments.tsx`, `tests/unit/financial-service.test.ts` | Created authoritative `FinancialService` with uniform period filtering (`Today`, `Week`, `Month`, `Last month`, `All`), integer cents math via `money.ts`, operating result = collected - expenses, outstanding = max(0, charged - paid). Wired `RecordPaymentScreen` to `paymentService.recordSalonPayment`. |
| **4. Payment State Machine** | **Resolved** | `src/App.tsx` | Real payment capture wired through `paymentService.recordPayment` (`source: 'ONLINE'`, `method: 'card'`, `idempotencyKey`). State handling with retry on failure. Demo simulate failure button removed. |
| **5. Emojis & Shadows** | **Resolved** | `src/App.tsx`, `src/app/page.tsx`, `src/app/auth/*` | 100% of emojis removed across all production UI files. Replaced with clean SVG icons. Gradients and drop shadows replaced with flat styling. Phone frame mockup replaced with fluid responsive container. |
| **6. Staff-Service Integrity** | **Resolved** | `src/App.tsx` | Strict staff-service filtering: `allStaff.filter(st => st.active && staffIds.includes(st.id))`. Active staff status verified. |

---

## 4. Verification & Validation Results

### Automated Test Suite:
- **Command:** `npm test -- --run`
- **Result:** **15/15 test files passed (100%)**
- **Test Count:** **163 / 163 tests passing** (including new `tests/unit/financial-service.test.ts` and `tests/unit/dashboard-navigation.test.ts`)
- **Regressions:** 0

### TypeScript Static Type Check:
- **Command:** `npx tsc --noEmit`
- **Result:** **Exit 0**, 0 type errors.

### Next.js Production Build:
- **Command:** `npm run build`
- **Result:** **Exit 0**, 19 routes compiled and statically optimized successfully.

### Production UI Emoji & Visual Audit:
- **Scan:** Automated regex AST scan for Unicode emojis across `src/**/*.tsx` and `src/**/*.ts`.
- **Result:** **0 emojis remaining** in production UI. Zero drop shadows in customer booking flow. Zero linear gradient cards.

---

## 5. Architectural Invariant Checklist

- [x] **No Emojis:** Verified zero emojis across customer booking and salon operations.
- [x] **Flat Visual Design:** Drop shadows and linear gradients removed; strict flat palette.
- [x] **RLS Preserved:** Supabase RLS remains untouched and enforced across all tables.
- [x] **Zero Service Role Key Exposure:** Browser code only uses public anonymous client.
- [x] **Multi-Tenant Isolation:** Tenant ID consistently enforced across all services and queries.
- [x] **Clean Layering:** UI -> Application Services (`FinancialService`, `PaymentService`, `AppointmentService`, `BookingService`) -> Repositories.
- [x] **Money Integrity:** Cents-based math via `@/domains/payments/money` preventing floating-point drift.
## 1. Baseline Inspection Summary

| Inspection Item | Value / Result |
| :--- | :--- |
| **Git Branch** | `feature/payment-refund-engine` |
| **Git Status** | Working directory contains modifications in domain, repositories, and UI files |
| **Next.js Version** | `15.5.25` (App Router) |
| **React Version** | `19.0.0` |
| **TypeScript Version** | `5.7.0` |
| **TypeScript Check** | Passed (`npx tsc --noEmit` exited 0) |
| **Test Suite Baseline** | 11 passed, 2 failed (143 passed, 7 failed out of 150 tests) |
| **Production Build** | Passed (`next build` compiled 19 routes in 21.5s) |
| **Supabase Configuration** | Client instantiated via `@supabase/ssr` / `@supabase/supabase-js`, RLS enabled on all tables |

---

## 2. Issues, Root Causes, and Architectural Layer Audit

### Issue 1: Dashboard Appointments & Calendar Buttons Navigation Path Broken
- **Affected Route:** `/app` (Salon Dashboard)
- **Affected Component/Service:** `src/ops/Dashboard.tsx` (`DashboardScreen`), `src/app/app/page.tsx` (`SalonDashboardPage`)
- **Suspected Root Cause:**
  1. `handleNav` in `src/app/app/page.tsx` only matched `view.startsWith('appointment')` and `calendarDay`. In `Dashboard.tsx`, the header had "New appointment" (`createAppt`) and "Calendar" (`calendarDay`), but no dedicated "Appointments" button (`appointmentList`).
  2. Clicking "New appointment" (`createAppt`) did not match `view.startsWith('appointment')`, falling back to `router.push('/app')`.
  3. The `StatTile` for appointments was non-interactive.
  4. Quick action buttons displayed fake shortcuts (`Shortcut: N`, `Shortcut: /`) without any keyboard listener.
- **Architectural Layer Involved:** UI Routing & Page Handler Layer
- **Risk:** High (salon owners cannot navigate to their schedule and appointment manager from the dashboard home screen).
- **Proposed Fix:**
  - Route `createAppt` to `/app/appointments?action=create` and `appointmentList` to `/app/appointments`.
  - Add explicit "Appointments" button (`onNav("appointmentList")`) in the header alongside "Calendar".
  - Make `StatTile` for appointments clickable to navigate to `/app/appointments`.
  - Remove fake keyboard shortcut labels.

### Issue 2: Cancellation Policy Hallucinations & Conflicts
- **Affected Route:** `/app/settings` -> Cancellation Policy
- **Affected Component/Service:** `src/ops/Settings.tsx` (`CancellationPolicyScreen`)
- **Suspected Root Cause:** The screen displayed hallucinated policy text: 0% fee for >24h notice, 50% fee for <24h notice with an incorrect R200 - R100 = R100 breakdown, and no refund processing expectation timeframe.
- **Architectural Layer Involved:** Presentation Layer / Policy Alignment
- **Risk:** High (misinforms salon staff and clients about financial liabilities and refund entitlements).
- **Proposed Fix:**
  - Update `CancellationPolicyScreen` to display authoritative BookYourBarber platform rules:
    - Customer cancellation > 24 hours: 10% fee, 90% refund.
    - Customer cancellation <= 24 hours: 18% fee, 82% refund.
    - Salon cancellation: 0% fee, 100% full refund.
    - Refund expectation: approximately 3–5 business days (stated as an expectation, not a guaranteed settlement time).
    - Platform-controlled: Clear notice that cancellation policy is platform-governed and cannot be overridden by individual salon settings.

### Issue 3: Financials Data Flow & Calculation Inconsistencies
- **Affected Route:** `/app/financials`
- **Affected Component/Service:** `src/ops/Financials.tsx`, `RecordPaymentScreen` in `src/ops/Appointments.tsx`
- **Suspected Root Cause:**
  1. No Application Service for Financials (`FinancialService`). Calculations were performed ad-hoc inside React components.
  2. `PaymentListScreen` did not query `repositories.payments`; it synthesized records by taking the first 30 appointments and guessing payment methods from `bookingSource === 'manual' ? 'cash' : 'card'`.
  3. In `FinancialsHubScreen`, `operatingResult` subtracted all-time expenses from today's paid appointments (`todayPaid - totalExpenses`).
  4. `PeriodTabs` ("Today", "Week", "Month", "Last month") was a purely cosmetic state that did not filter repository queries.
  5. `RecordPaymentScreen` bypassed `PaymentService.recordSalonPayment` and swallowed database errors in `catch {}`.
- **Architectural Layer Involved:** Application Service & Domain Aggregation Layer
- **Risk:** Critical (inaccurate financial metrics, corrupted revenue reporting, missing payment records).
- **Proposed Fix:**
  - Create `FinancialService` in `src/application/services/FinancialService.ts` backed by `repositories.appointments`, `repositories.payments`, `repositories.refunds`, and `repositories.expenses`.
  - Implement uniform period filtering applied consistently across revenue, payments, refunds, and expenses.
  - Separate service amount, amount charged, amount paid, outstanding (`Charged - Paid`), refunds, platform cancellation fees (excluded from salon revenue), expenses, and operating result (`Salon Revenue - Salon Expenses`).
  - Enforce `formatZAR` currency formatting everywhere (`R180.00`).
  - Wire `RecordPaymentScreen` to `paymentService.recordSalonPayment`.
  - Strictly enforce that appointments with `Outstanding > R0` cannot be marked completed.

### Issue 4: Customer Third-Party Payment Flow Lacks Proper State Machine
- **Affected Route:** `/book/[salonSlug]`
- **Affected Component/Service:** `src/App.tsx` (`PaymentStep`, `handlePaymentSuccess`)
- **Suspected Root Cause:**
  1. `PaymentStep` used a dummy `setTimeout(2800ms)` simulation without initiating real payment processing or recording payments in `repositories.payments`.
  2. Contained a "Demo: Simulate payment failure" button and "Jump to state" floating demo widget.
  3. Lacked an explicit state model (`submitting`, `processing`, `success`, `failed`, `retry`).
- **Architectural Layer Involved:** Customer Booking & Payment Integration Layer
- **Risk:** High (payment processing can freeze or show false success without authoritative backend verification).
- **Proposed Fix:**
  - Implement proper state machine: `idle` -> `submitting` -> `processing` -> `success` / `failed` -> `retry`.
  - Prominent visual loading animation during processing.
  - Confirm payment with backend, record payment in `payments` repository with method: 'card', source: 'ONLINE', idempotencyKey, and set appointment to 'paid'.
  - On failure, show clear failure state with retry option without creating orphaned or paid records.
  - Remove all demo buttons and overlays.

### Issue 5: Emojis and Visual Decoration in Production UI
- **Affected Route:** `/book/[salonSlug]`, `/app`, `/`, `/auth/*`
- **Affected Component/Service:** `src/App.tsx`, `src/app/page.tsx`, `src/app/auth/`
- **Suspected Root Cause:** Over 30 emojis embedded across customer booking, auth screens, landing page, and demo navigation.
- **Architectural Layer Involved:** Presentation Layer
- **Risk:** Medium (violates strict engineering UI standard, looks unprofessional).
- **Proposed Fix:**
  - Remove all emojis from customer flow and production UI.
  - Replace with clean SVG icons only where meaningful; use clean text elsewhere.
  - Remove shadows, gradients, and device mockup frame.

### Issue 6: Disconnection Between Salon Management & Customer Booking
- **Affected Route:** `/book/[salonSlug]`
- **Affected Component/Service:** `src/App.tsx` (`CustomerApp`)
- **Suspected Root Cause:** Staff-service assignment fallback defaulted to all staff when a service had assignments (`filtered.length > 0 ? filtered : allStaff`), and mock services were used if empty.
- **Architectural Layer Involved:** Multi-tenant Repository & Domain Binding
- **Risk:** High (customers can book staff members not assigned to a service, or book deactivated services).
- **Proposed Fix:**
  - Enforce live repository querying for services, staff assignments, and availability slots scoped to the salon tenant.

---
