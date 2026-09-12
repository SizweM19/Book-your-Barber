# BookYourBarber — Foundation Technical Audit

**Date**: 9 September 2026  
**Auditor**: Antigravity Technical Architecture Team  
**Repository**: `Book-your-Barber-main`  
**Current Branch**: `Stabilization-and-Feature`  
**Status**: Pre-implementation Technical Assessment  

---

## 1. Current Stack

| Layer | Technology | Version | Notes / Observations |
| :--- | :--- | :--- | :--- |
| **Runtime / Library** | React | `^19.0.0` | Uses latest React 19 features, strict mode enabled. |
| **DOM Renderer** | React DOM | `^19.0.0` | Mounted via `ReactDOM.createRoot` in `src/main.tsx`. |
| **Language** | TypeScript | `^5.7.0` | Configured with `strict: true`, `"moduleResolution": "bundler"`. |
| **Build Tool** | Vite | `^8.0.5` | Bundler with `@vitejs/plugin-react` (`^6.0.0`). |
| **Styling** | Tailwind CSS | `^4.0.0` | Configured with `@tailwindcss/vite` plugin and imported via `@import 'tailwindcss';` in `src/index.css`. |
| **Formatting / Linting** | oxfmt | `^0.2.0` | Ultra-fast Rust-based code formatter. |
| **Toolchain Management** | Mise (`.mise.toml`) | Node `22`, pnpm `10` | Standardized modern environment specifications. |
| **Scaffolding / Origin** | Figma Make App | N/A | Contains Figma Make development plugins and custom preview server integration in `vite.config.ts`. |

---

## 2. Current Architecture

```
BookYourBarber (Current Single-Page Monolith)
│
├── App.tsx (Root Mode Switcher + Customer Booking Wizard)
│   ├── Floating Switcher: [ ⚙️ Salon view / 📱 Customer view ]
│   └── CustomerApp (Step State Machine, 32 distinct visual states)
│
└── SalonOps.tsx (Salon Operations & Admin Hub)
    ├── Layout: Sidebar (desktop) & MobileNav (mobile)
    └── Ops Sub-screens (Routed via OpsView state string):
        ├── Dashboard.tsx (KPIs, quick actions, today's schedule)
        ├── Calendar.tsx (Day & Week staff grid)
        ├── Appointments.tsx (List, Detail, Walk-in, Payment, Reschedule, Cancellation)
        ├── Customers.tsx (CRM, customer profile, visit history)
        ├── Staff.tsx (Barbers, performance, utilization, revenue)
        ├── Services.tsx & Settings.tsx (Catalog, business rules, policies)
        └── Financials.tsx (Daily register, revenue, expenses, refunds)
```

### Architectural Characteristics:
- **Presentation-Centric Monolith**: Business logic, presentation markup, state transitions, validation, and demo mock data are co-located inside view components.
- **Client-Only Execution**: The system executes entirely in the user's browser memory without persistent backend services, API communication, or persistent storage.
- **Dual-Surface Interface**: Both the end-user customer booking experience and the internal salon management dashboard live within the same frontend bundle, switched via an in-memory boolean/state toggle.
- **Specification Alignment**: The repository includes detailed architectural and domain specifications in `src/imports/pasted_text/` (including `salon-ops-spec.md`, `bookyourbarber-financials.md`, `booking-flow-updates.md`), which prescribe clean architectural layering (React UI → Application Services → Domain Rules → Repository → Supabase). However, this layered separation has not yet been implemented in the active codebase.

---

## 3. Current Routing

- **Routing Mechanism**: Pure React local state (`useState`). There is **no URL-based client routing** (no React Router, TanStack Router, or HTML5 History API integration).
- **Root Routing**:
  - `mode: "customer" | "ops"` in `App.tsx` toggles between the customer booking wizard and the salon operational dashboard.
- **Customer Booking Flow Routing**:
  - `step: Step` in `App.tsx` manages a string union of **32 distinct steps**:
    - *Booking Funnel*: `salon` → `service` → `staff` → `date` → `time` → `info` → `reminder` → `summary` → `paymentMethod` → `payment` → `paymentSuccessProcessing` → `confirmed`.
    - *Edge Cases & Error States*: `paymentDuplicate`, `paymentFailed`, `notificationFailure`, `unavailable`, `slotHoldExpired`, `fullyBooked`, `staffUnavailable`, `serviceUnavailable`, `salonUnavailable`, `sessionExpired`, `rateLimited`, `loading`, `error`.
    - *Post-Booking Operations*: `bookingLookup`, `bookingDetails`, `rescheduleSuccess`, `rescheduleFailure`, `cancellationReview`, `cancellationConfirmed`, `salonCancelled`, `refundProcessing`, `refundCompleted`, `refundFailed`.
  - Navigation state uses an in-memory array stack (`history: Step[]`) for back navigation and a floating `DemoNav` quick-jump menu.
- **SalonOps Routing**:
  - `view: OpsView` in `SalonOps.tsx` manages a string union of **34 distinct views** (`dashboard`, `calendarDay`, `calendarWeek`, `appointmentList`, `appointmentDetail`, `customerList`, `customerProfile`, `staffList`, `settings`, `financials`, etc.).
  - Employs an in-memory view stack (`history: OpsView[]`) with a `back()` fallback to `dashboard`.
- **Limitation**: Reloading the browser immediately wipes the application state and resets the user to the initial `salon` or `dashboard` screen. Deep linking and sharing links to specific appointments, booking references, or views is currently impossible.

---

## 4. Current Authentication

- **Implementation**: **None**.
- **Access Control**: There are zero authentication barriers, user sessions, tokens, or route guards.
- **Security Posture**: Anyone accessing the URL can switch directly into full salon administrative controls (`SalonOps`), view customer contact information, modify booking statuses, review financials, register expenses, and alter salon settings.
- **Role Separation**: No roles exist (e.g. `Customer`, `Barber`, `SalonManager`, `SuperAdmin`).

---

## 5. Current Data Sources

- **Primary Source**: Static in-memory TypeScript fixtures and arrays.
- **Mutations**: Local component state clones and transient in-memory modifications.
- **Persistence**: **None**. Any action (recording a payment, creating an appointment, adding an expense, updating customer details) disappears upon page reload.
- **Backend / Database Connections**:
  - **Supabase**: Mentioned in the design specifications (`src/imports/pasted_text/salon-ops-spec.md`), but **no Supabase client library or connection code is installed or configured** in `package.json` or `src/`.
  - **Firebase**: Completely absent. No packages, imports, or remnants.
  - **Environment Variables**: No active `.env` or `.env.local` files exist. `vite.config.ts` references optional fallback environment variables (`PORT`, `FIGMA_DEV_SERVER_HOST`, `FIGMA_PUBLIC_URL`).

---

## 6. Existing Mock / Demo Data

The codebase contains rich, domain-accurate mock datasets tailored to a premium South African barbershop context:

### Salon Profile
- **Brand**: *Fade & Edge Barbershop*
- **Location**: 15 Loader Street, De Waterkant, Cape Town, 8001
- **Currency**: South African Rand (ZAR / `R`)
- **Booking Window**: 60-day maximum advance booking, 10-minute online slot reservation hold.

### Mock Datasets in `src/App.tsx`
- `SERVICES`: 6 services (`Classic Haircut` R150, `Line-up and Edge` R80, `Kids Cut` R100, `Beard Trim and Shape` R120, `Hot Towel Shave` R200, `Hair and Beard Combo` R250).
- `STAFF`: 4 barbers (`Themba Ndlovu`, `Devon Williams`, `Aisha Jacobs`, `Ntombi Dlamini`).
- `SLOTS`: 20 half-hour time slots (08:00 to 17:30) with simulated availability flags.
- `REMINDER_OPTIONS`: WhatsApp (highlighted as "Most popular"), SMS, Email, None.
- `MOCK_LOOKUP`: Sample reference `BYB-20260908-00482`.

### Mock Datasets in `src/ops/data.ts`
- `OPS_STAFF`: Staff records with real-time operational metrics (`todayRevenue`, `monthRevenue`, `monthAppointments`, `completionRate`, `noShowCount`, `active` status).
- `OPS_CUSTOMERS`: 5 customer CRM records with phone numbers, emails, visitation counts, lifetime spend, outstanding balances, and loyalty segments (`regular`, `returning`, `vip`, `new`, `atRisk`).
- `OPS_APPOINTMENTS`: 7 realistic appointment records covering all status permutations (`completed`, `confirmed`, `inProgress`, `booked`, `noShow`) with nested payments, notification histories, and refund traces.
- `OPS_REFUNDS`: 4 refund lifecycle records (`completed`, `processing`, `failed`, `requested`) with cancellation penalties and fee calculations.
- `OPS_EXPENSES`: 6 operating expense records (`Rent` R8,500, `Products` R1,200, `Electricity` R750, `Marketing` R500, `Transport` R600).

---

## 7. Existing Domain Models & Types

Domain types are primarily articulated in `src/ops/types.ts` and `src/App.tsx`:

### Critical Domain Invariants
- **Strict Separation of Appointment Status and Payment Status**:
  - `AppointmentStatus`: `"booked" | "confirmed" | "inProgress" | "completed" | "cancelled" | "noShow"`
  - `PaymentStatus`: `"unpaid" | "partial" | "paid" | "refundProcessing" | "refunded" | "paymentFailed"`
  - Business Rule: An appointment can be `confirmed` while `unpaid` (e.g. "Pay at Shop"), or `cancelled` while `refundProcessing`.

### Aggregate Models (`src/ops/types.ts`)
- `OpsAppointment`: Booking metadata, assigned barber, scheduled slot, financial tallies (`charged`, `paid`), nested `payments: PaymentRecord[]`, `notifications: NotificationEvent[]`, and optional `cancellation: CancellationRecord`.
- `OpsCustomer`: Profile data, contact details, loyalty segmentation (`new`, `returning`, `regular`, `vip`, `atRisk`, `inactive`), visit metrics, and outstanding balance.
- `OpsStaff`: Barber profiles, roles, photos, active status, performance KPIs.
- `OpsService`: Service catalogue, durations, pricing, active flag.
- `RefundRecord`: Refund references, original charge, penalty fee percent/amount, net refund amount, approval lifecycle.
- `ExpenseRecord`: Operational overhead expenses categorized by Rent, Electricity, Products, Salaries, Marketing, Transport.
- `NotificationEvent`: Audit log of customer communication across WhatsApp, SMS, and Email.

### Type Discrepancies to Reconcile
- `Service` in `src/App.tsx` has `{ id, name, description, duration, price, category }`.
- `OpsService` in `src/ops/types.ts` has `{ id, name, category, duration, price, active }` (lacks `description`).
- `StaffMember` in `src/App.tsx` has `{ nextAvailable }`, whereas `OpsStaff` has KPI statistics.
- These types must be harmonized into single canonical domain entities.

---

## 8. Current Technical Debt

1. **Massive Component Monoliths**:
   - `src/App.tsx` is **1,884 lines long**. It includes the entire customer booking flow, SVG icons, simulated credit card formatting, slot countdown timers, and mock screen switch statements.
   - `src/ops/Settings.tsx` is **54 KB**.
   - `src/ops/Financials.tsx` is **50 KB**.
   - `src/ops/Appointments.tsx` is **49 KB**.
2. **Data Model Duplication**:
   - Services and Staff are defined twice with conflicting properties in `App.tsx` and `src/ops/data.ts`.
3. **No Centralized State Management**:
   - State is passed through deeply nested prop callbacks (`patch`, `onContinue`, `goBack`, `setApptRef`), leading to fragility and lack of cohesion across the customer and ops surfaces.
4. **Fragile Navigation**:
   - Relying on local string state makes browser back/forward buttons break expectations, prevents deep linking, and destroys state on refresh.
5. **Simulated Asynchronous Actions**:
   - Payment processing, slot reservations, and cancellation workflows use simulated `setTimeout` delays without real network handling, cancellation tokens, or error boundaries.
6. **Proprietary Scaffolding Bindings**:
   - `vite.config.ts` has 357 lines containing Figma Make dev server plugins (`site.json`, `figmaErrorOverlayReplay`, `figmaReactRefreshBoundaryFallback`) that are irrelevant for standard deployment environments and will cause build failures in standard hosting pipelines.

---

## 9. What Should Be Preserved

1. **UI Design & Aesthetic Quality**:
   - The sleek, contemporary barbershop visual language, including the mobile phone frame wrapper for customer booking, polished typography, pill badges, sticky summary action bars, and subtle neutral backgrounds.
2. **Comprehensive Domain Logic & Edge States**:
   - The meticulous breakdown of operational and customer states (such as slot reservation expiry countdowns, duplicate payment warnings, no-show management, penalty-based cancellation reviews, and daily cash register reconciliation).
3. **South African Context & Localization**:
   - ZAR (`R`) currency formatting (`fmtR`), South African phone formatting (`082 ...`), local date conventions, and WhatsApp-centric communication options.
4. **Tailwind CSS v4 Foundations**:
   - Clean and responsive Tailwind CSS utility classes and layout primitives.
5. **Rich Mock Data Fixtures**:
   - The existing mock data should be repurposed as standard database seed fixtures during the backend transition.

---

## 10. What Needs to Be Changed for the Production Foundation

1. **Backend Integration (Supabase)**:
   - PostgreSQL schema design mapping to the domain entities (`salons`, `services`, `staff`, `customers`, `appointments`, `payments`, `refunds`, `expenses`).
   - Row Level Security (RLS) policies enforcing multi-tenant isolation and role-specific data boundaries.
   - Real-time subscriptions for real-time calendar and appointment synchronization.
2. **Authentication & Role-Based Access Control (RBAC)**:
   - Customer authentication (passwordless magic link, OTP, or optional guest checkout).
   - Staff/Admin authentication with role guards (`salon_owner`, `barber`, `receptionist`).
   - Route protection preventing unauthorized entry into `SalonOps`.
3. **Formal URL-Based Client Routing**:
   - Introduce standard client-side routing (React Router v6/v7) with dedicated route hierarchies:
     - `/` - Customer booking landing & wizard (`/book`, `/book/services`, `/book/datetime`, `/book/checkout`, `/book/confirmed/:ref`)
     - `/lookup` - Customer self-service booking management
     - `/ops` - Salon operations layout (`/ops/dashboard`, `/ops/calendar`, `/ops/appointments`, `/ops/customers`, `/ops/financials`, `/ops/settings`)
     - `/auth` - Login, password reset, invitation acceptance
4. **Layered Architecture & Repositories**:
   - Enforce clean separation: UI Components → Custom Hooks / Application Services → Domain Logic & Rules → Repositories / Supabase Clients.
   - Decouple business logic (e.g. cancellation penalty calculations, slot collision detection) from React presentation components.
5. **Component Decomposition**:
   - Break giant files (`App.tsx`, `Appointments.tsx`, `Financials.tsx`, `Settings.tsx`) into focused, single-responsibility components and custom hooks.
6. **Payment Gateway Integration**:
   - Implement real South African payment processing via Yoco, Paystack, or Payfast, including webhook handlers and PayShap integration.
7. **Clean Tooling & Build Pipeline**:
   - Normalize `vite.config.ts` into a production-ready configuration decoupled from Figma-specific dev plugins.

---

## 11. Recommended Migration Sequence

```
Phase 1: Project Hardening & Clean Configuration
  ├── Normalize vite.config.ts (standardize for clean production builds)
  ├── Set up environment variable infrastructure (.env.example, .env)
  └── Install foundational libraries (react-router, @supabase/supabase-js, lucide-react)

Phase 2: Data Schema & Supabase Setup
  ├── Create relational PostgreSQL schema matching existing domain entities
  ├── Define RLS (Row Level Security) policies
  └── Seed database using existing mock fixtures (services, staff, customers, appointments)

Phase 3: Domain Layer & Repository Services
  ├── Consolidate types into unified domain definitions
  ├── Build API Client & Repository layer (Services, Staff, Appointments, Customers, Financials)
  └── Implement React Query (TanStack Query) for server state caching and optimistic updates

Phase 4: Client Routing & Layout Architecture
  ├── Implement React Router with route-level code splitting
  ├── Create Customer Layout (mobile-first container) and SalonOps Layout (desktop sidebar + mobile nav)
  └── Implement Route Guards and Auth Context

Phase 5: Customer Booking Flow Migration
  ├── Modularize App.tsx into discrete step components
  ├── Wire booking steps to live Supabase repositories (real-time slot availability, live service list)
  └── Connect payment gateway checkout and confirmation triggers

Phase 6: SalonOps Dashboard Migration
  ├── Connect Appointments, Calendar, Customers, Staff, and Financials to live backend
  ├── Enable real-time appointment updates via Supabase Realtime
  └── Connect settings and expense tracking to database persistence

Phase 7: Production Hardening & Verification
  ├── End-to-end flow testing
  ├── Mobile responsiveness & accessibility verification
  └── Deployment configuration (Vercel / Cloudflare / Netlify)
```

