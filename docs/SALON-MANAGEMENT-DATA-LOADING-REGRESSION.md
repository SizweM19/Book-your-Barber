# BookYourBarber — Critical Salon Management Data Loading Regression Audit

**Audit Date:** 2026-09-17  
**Severity:** CRITICAL  
**Status:** DIAGNOSIS COMPLETE — AWAITING REVIEW BEFORE IMPLEMENTATION  

---

## 1. Symptoms

When navigating to any Salon Management route (`/app/*`):
* **Dashboard (`/app`)**: Remains perpetually stuck on `"Loading dashboard..."` (or `"Dashboard loading..."`).
* **Staff (`/app/staff`)**: Renders immediately but displays the empty state: `"No staff members yet"`.
* **Services (`/app/services`)**: Renders immediately but displays the empty state: `"No services found"`.
* **Customers (`/app/customers`)**: Renders immediately but displays the empty state: `"No customers found"`.
* **Appointments (`/app/appointments`)**: Renders immediately with empty tab counts and empty tables/cards.
* **Financials (`/app/financials`)**: Remains perpetually stuck in a loading state or renders zeros across all metrics.
* **Calendar (`/app/calendar`)**: Renders empty calendar columns with no appointments visible.

---

## 2. Reproduction

1. Start the application in development mode (`npm run dev`).
2. Navigate to `http://localhost:3000/auth/login`.
3. Click the development account button **"Salon Owner"** (fills `owner@fadeandedge.co.za` and `password123`).
4. Click **"Sign in to salon"**.
5. The application redirects to `http://localhost:3000/app`.
6. **Result:** Dashboard displays `"Loading dashboard..."` indefinitely.
7. Click navigation links: Staff, Services, Customers, Appointments &rarr; all display empty states with zero data.

---

## 3. First Failing Operation

The primary failure occurs in [`src/application/auth/AuthService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/auth/AuthService.ts) inside `login()`:
```ts
// src/application/auth/AuthService.ts: lines 21-64
if (process.env.NODE_ENV !== 'production') {
  const devAccounts = { ... }
  const devAcc = devAccounts[credentials.email?.toLowerCase()]
  if (devAcc) {
    ...
    return { user: devUser, error: null } // Short-circuits here!
  }
}
```
Because of this short-circuit:
1. `this.supabase.auth.signInWithPassword(...)` is **never invoked**.
2. No Supabase session is established in `@supabase/ssr` cookies.
3. On page navigation to `/app`, `AuthProvider.loadUser()` calls `authService.getCurrentUser()`.
4. `authService.getCurrentUser()` delegates to `this.supabase.auth.getUser()`, which returns `{ data: { user: null } }`.
5. `loadUser()` sets `user: null` and `tenantContext: null`.
6. `TenantProvider` sets `tenantId: null`.

---

## 4. Root Cause Analysis

### A. The Broken Dev Login Interceptor
In [`src/application/auth/AuthService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/auth/AuthService.ts), an unconditioned development interceptor was placed at the very top of `login()`. When signing in with `owner@fadeandedge.co.za`:
- It created an ephemeral in-memory mock user (`id: dev-owner`).
- It set an ad-hoc cookie `byb_dev_session=owner`.
- It skipped `signInWithPassword()`.

### B. Asymmetry with `getCurrentUser()`
Previously, `getCurrentUser()` had a matching fallback that read the `byb_dev_session` cookie. In a recent cleanup to enforce real Supabase data, that fallback in `getCurrentUser()` was removed. However, the interceptor at the top of `login()` was **not removed**.
Consequently:
- `login()` produced a mock session without Supabase auth.
- `getCurrentUser()` strictly demanded a real Supabase auth session.
- Result: As soon as `/app` loaded or refreshed, `getCurrentUser()` returned `null`.

### C. Downstream Null Propagation & "Loading Forever" Patterns
In every Salon Management screen:
- `const { tenantId } = useTenantContext()` receives `null`.
- In `src/ops/Dashboard.tsx:24`:
  ```tsx
  const loadData = () => {
    if (!tenantId) return // Exits early!
    ...
  }
  ```
  Because `loading` is initialized to `true` (`useState(true)`), and `setLoading(false)` is never called when `tenantId` is null, the component is trapped in `loading === true` forever.
- In `src/ops/Staff.tsx:25`, `src/ops/Services.tsx:34`, `src/ops/Customers.tsx:61`, `src/ops/Appointments.tsx:46`:
  ```tsx
  if (!tenantId) {
    setLoading(false)
    return // Exits with empty array!
  }
  ```
  These components set `loading: false` with empty array state (`[]`), displaying empty placeholders.

### D. Supabase RLS Rejection on Unauthenticated Queries
Even if a component had bypassed the `tenantId` check, Supabase Row-Level Security (RLS) policies strictly enforce tenant membership (`is_tenant_member(tenant_id)`). Because no Supabase session existed, requests were treated as anonymous:
- Anonymous queries return **0 appointments** and **0 customers**.
- Authenticated queries under the real user return **20 appointments** and **42 customers**.

---

## 5. Affected Components, Services, and Repositories

### Components
* `SalonAppLayout` ([`src/app/app/layout.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/app/app/layout.tsx))
* `DashboardScreen` ([`src/ops/Dashboard.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Dashboard.tsx))
* `StaffListScreen` ([`src/ops/Staff.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Staff.tsx))
* `ServiceListScreen` ([`src/ops/Services.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Services.tsx))
* `CustomerListScreen` ([`src/ops/Customers.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Customers.tsx))
* `AppointmentListScreen` ([`src/ops/Appointments.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Appointments.tsx))
* `FinancialsHubScreen` ([`src/ops/Financials.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Financials.tsx))
* `CalendarScreen` ([`src/ops/Calendar.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Calendar.tsx))

### Services
* `AuthService` ([`src/application/auth/AuthService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/auth/AuthService.ts))
* `AuthContext` ([`src/application/auth/AuthContext.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/auth/AuthContext.tsx))
* `TenantProvider` ([`src/application/tenant/context.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/tenant/context.tsx))

### Repositories
* None of the repositories are broken. All 11 `SupabaseRepositories` (`SupabaseAppointmentRepository`, `SupabaseStaffRepository`, etc.) were independently tested and verified to operate correctly when provided with an authenticated client.

---

## 6. Supabase & RLS Findings

We executed direct database inspections using the project's real credentials (`.env.local`).

### Ground Truth in Supabase
| Table | Row Count | Status |
|---|---|---|
| `tenants` | 1 | `11111111-1111-1111-1111-111111111111` (Fade & Edge Barbershop) |
| `salon_profiles` | 1 | `slug: fade-and-edge` |
| `staff` | 4 | Themba Ndlovu, Devon Williams, Aisha Jacobs, Ntombi Dlamini |
| `services` | 8 | Classic Haircut, Line-up, Beard Trim, Combo, etc. |
| `customers` | 42 | Full customer directory present |
| `appointments` | 20 | 20 real seeded and created appointments |
| `profiles` | 1 | Sanele Khumalo (Owner) |
| `tenant_memberships` | 1 | User `850c1d1c-...` &rarr; Tenant `11111111-...` (`OWNER`) |

### RLS Verification Test
* **Authenticated Query (as `owner@fadeandedge.co.za`):**
  - Appointments: **20 visible** (0 errors)
  - Staff: **4 visible** (0 errors)
  - Services: **8 visible** (0 errors)
  - Customers: **42 visible** (0 errors)
* **Anonymous Query (without auth session):**
  - Appointments: **0 visible** (blocked by RLS)
  - Customers: **0 visible** (blocked by RLS)

**Conclusion:** Supabase is healthy, data is intact, and RLS is functioning precisely as configured.

---

## 7. Authentication Findings

* The Supabase Auth user `owner@fadeandedge.co.za` exists with password `password123` and UUID `850c1d1c-b8ce-4853-b259-240ea77a1ce9`.
* When authenticating directly via Supabase Auth, login succeeds, JWT session cookies are stored, and tenant context resolves to `11111111-1111-1111-1111-111111111111`.
* `manager@fadeandedge.co.za` and `admin@bookyourbarber.co.za` do not yet exist in Supabase Auth (only the Owner was created in `seed-user.mjs`).

---

## 8. Investigation of Recent Changes

### A. Recent `Promise.all` Optimization in `AppointmentListScreen`
The user requested verification of whether the recent parallel batch query optimization caused hanging or promise rejection.
* **Test Result:** We executed the batch query via `scratch-test-appt-batch.mjs` against live Supabase.
* The initial batch (`appointments`, `services`, `staff`) resolved in **527ms**.
* The unique customer batch (18 customers) resolved in **2140ms**.
* Total time: **2.66s**. All 20 appointments and customer details mapped perfectly without errors.
* **Finding:** The `Promise.all` optimization is **NOT** the cause of the data-loading failure.

### B. Next.js Middleware
* `src/middleware.ts` was inspected. It only imports `@supabase/ssr`, `NextResponse`, and `env`. It does not import heavy application code or domain models.
* **Finding:** Middleware is **NOT** the cause of the data-loading failure.

---

## 9. Performance Findings

1. **Compilation**: Next.js production build completes in 38.2s with zero errors across all 20 routes.
2. **Runtime**: React hydration succeeds without errors.
3. **Supabase Query Latency**:
   - Single table lookup: ~80–150ms.
   - Batch parallel queries: ~500–600ms.
4. **Loading State Issue**: Not caused by slow network requests, but by `tenantId` being `null`, leaving `loading: true` un-cleared in `DashboardScreen` and `FinancialsHubScreen`.

---

## 10. Proposed Minimal Fix

1. **Restore Full Supabase Authentication in `AuthService.login()`**:
   - In `src/application/auth/AuthService.ts`, remove the dev-mode bypass in `login()` when live Supabase is enabled (`isSupabaseConfigured() === true`).
   - Always call `this.supabase.auth.signInWithPassword({ email, password })` so a genuine Supabase session and JWT cookies are established.
2. **Seed Missing Roles in Supabase Auth**:
   - Run a one-time seeding script to create `manager@fadeandedge.co.za` (with `MANAGER` role in `tenant_memberships`) and `admin@bookyourbarber.co.za` (with entry in `platform_admins`) in Supabase Auth with password `password123`.
   - This ensures all 3 login buttons on `/auth/login` authenticate with real Supabase.
3. **Mount-Time Auth Guard in `SalonAppLayout`**:
   - In `src/app/app/layout.tsx`, destructure `isLoading` from `useAuth()`.
   - While `isLoading` is true, render a clean spinner.
   - Child screens will only mount once `tenantId` is non-null, preventing early-exit race conditions.
4. **Deterministic Loading Cleanup in Screens**:
   - In `src/ops/Dashboard.tsx` and `src/ops/Financials.tsx`, add a `finally` block or ensure `setLoading(false)` is called even if `tenantId` is missing, preventing indefinite spinner states.

---

## 11. Risk Assessment

* **Risk Level:** VERY LOW.
* **Impact:** Does not change any business rules, payment state machines, cancellation fees, or UI layouts. It aligns the authentication flow with the real Supabase backend that was already seeded and configured.
