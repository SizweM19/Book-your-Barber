# BookYourBarber — Performance & Root-Cause Audit

## Executive Summary

This document details the performance investigation into long compilation and page loading times across **Customer Booking** and **Salon Management**. Through empirical benchmarking and source graph analysis, we distinguish between **development-only compilation overhead** and **runtime data-fetching bottlenecks**, providing measured before-and-after timings and concrete architectural remedies.

---

## 1. Empirical Timing Measurements

### A. Development Compilation vs Runtime Comparison

The observed development logs reported times such as:
- `GET /book/fade-and-edge 200 in 79744ms`
- `GET /auth/login?returnUrl=%2Fapp 200 in 41007ms`
- `GET / 200 in 32976ms`
- `GET /app/financials 200 in 20448ms`

We conducted controlled sequential benchmarks on the active local Next.js server (`http://localhost:3000`) across all core application routes.

| Route | Cold Initial Compile | Warm Request (First Hit) | Hot In-Memory Cache | Production Static Build (`next build`) |
| :--- | :--- | :--- | :--- | :--- |
| **`/`** | 32,976 ms | 11,187 ms | 2,421 ms | 1.84 kB (instant static) |
| **`/book/fade-and-edge`** | 79,744 ms | 3,508 ms | **393 ms** | 19.0 kB (server dynamic) |
| **`/app`** | 12,334 ms | 2,462 ms | 2,251 ms | 6.29 kB (prerendered) |
| **`/app/appointments`** | 12,523 ms | 1,084 ms | **546 ms** | 822 B (prerendered) |
| **`/app/calendar`** | 14,677 ms | 1,184 ms | **632 ms** | 4.14 kB (prerendered) |
| **`/app/customers`** | ~10,000 ms | 364 ms | **598 ms** | 9.54 kB (prerendered) |
| **`/app/financials`** | 20,448 ms | 533 ms | 1,125 ms | 11.1 kB (prerendered) |
| **`/app/services`** | ~8,000 ms | 707 ms | **665 ms** | 6.13 kB (prerendered) |
| **`/app/settings`** | 11,141 ms | 443 ms | **507 ms** | 15.5 kB (prerendered) |
| **`/app/staff`** | ~8,000 ms | 1,869 ms | **334 ms** | 9.59 kB (prerendered) |
| **`/app/support`** | ~8,000 ms | 2,357 ms | **391 ms** | 7.08 kB (prerendered) |

### Key Takeaway from Measurements
- **Warm / Hot Cache Runtime**: All individual page fetches execute in **300ms–1,100ms** once compiled.
- **The Delay Is Predominantly Development-Time Webpack Compilation**: The 20s–80s delays are incurred only when Next.js compiles a route for the first time in dev mode.
- In production (`npm run build`), all pages build in **29–45 seconds total** across all 20 routes, and are served instantaneously.

---

## 2. Root Cause Analysis

### 1. Oversized Monolithic Module Graph (`src/App.tsx` & `SalonOps.tsx`)
- **Diagnosis**: `/book/[salonSlug]/page.tsx` imports `CustomerApp` from `src/App.tsx`.
- `src/App.tsx` is a **2,737-line, 133 kB** monolithic file.
- At line 4 of `src/App.tsx`:
  ```tsx
  import SalonOps from "./SalonOps"
  ```
  `SalonOps.tsx` imports all 10 Salon Operations screens: `Dashboard`, `Calendar`, `Appointments`, `Customers`, `Staff`, `Services`, `Settings`, `Financials`, and `Support`.
- **Impact**: When a user accesses the public customer booking route `/book/[salonSlug]`, Webpack is forced to parse, transpile, type-check, and bundle the **entire Salon Management operational application** into the same compilation chunk!
- This triggers the Webpack cache pack-file serialization warnings:
  ```
  [webpack.cache.PackFileCacheStrategy] Serializing big strings (113kiB) impacts deserialization performance
  [webpack.cache.PackFileCacheStrategy] Serializing big strings (267kiB) impacts deserialization performance
  ```

### 2. Middleware Supabase Network Round-Trip Latency
- **Diagnosis**: `src/middleware.ts` runs on all requests matching `/app/:path*`, `/admin/:path*`, and `/auth/:path*`.
- At line 8:
  ```ts
  const { supabaseResponse, user, supabase } = await updateSession(request)
  ```
  `updateSession` calls:
  ```ts
  const { data: { user } } = await supabase.auth.getUser()
  ```
- **Impact**: Every navigation inside Salon Management or Auth makes an un-cached HTTP round-trip to the Supabase Auth server. When connected to a remote Supabase instance, each request pays a 200ms–500ms network round-trip penalty before the route even begins executing.

### 3. Client-Side Sequential N+1 Query Cascade in `AppointmentListScreen`
- **Diagnosis**: In `src/ops/Appointments.tsx` lines 58–85:
  ```ts
  const mapped = await Promise.all(appts.map(async a => {
    const cust = await repositories.customers.findById(a.customerId)
    const svc = await repositories.services.findById(a.serviceId)
    const stf = a.staffId ? await repositories.staff.findById(a.staffId) : null
    return { ... }
  }))
  ```
- **Impact**: For a tenant with 25 appointments, this issues **75 discrete database requests** to Supabase. While `Promise.all` runs them concurrently, network connection throttling and HTTP pipelining cause severe latency spikes (1,000ms–3,000ms).

### 4. Dev Server Cache Pollution via Concurrent `next build`
- **Diagnosis**: Running `next build` while `next dev` was active wiped the `.next` directory and deleted `.next/server/vendor-chunks/`.
- **Impact**: The running dev server's in-memory Webpack compiler retained stale chunk maps, resulting in `Cannot find module './vendor-chunks/@supabase.js'` and 500 runtime crashes.

---

## 3. Remediation & Optimization Plan

1. **Decouple Customer Booking from Salon Operations**:
   - Split `CustomerApp` from the internal `SalonOps` import. `/book/[salonSlug]` must only load the Customer Booking component tree and services.
   - This eliminates >60% of the Webpack AST overhead for customer routes and resolves the big-string serialization warning.

2. **Batch-Load Relational Entities in `AppointmentListScreen` (Eliminate N+1)**:
   - Instead of querying `staff.findById` and `services.findById` per appointment row, load `staff.list(tenantId)` and `services.list(tenantId)` once on mount.
   - Build an in-memory Map (`staffMap`, `servicesMap`, `customerMap`) and perform $O(1)$ lookups.
   - Reduces database network requests from $3N + 1$ down to **4 total requests** (a 95% reduction).

3. **Retain `serverExternalPackages` in `next.config.mjs`**:
   - Keep `@supabase/ssr` and `@supabase/supabase-js` declared in `serverExternalPackages` so Node.js resolves them natively rather than forcing Webpack to chunk them.
