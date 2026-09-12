# BookYourBarber — Architecture Specification

## 1. Architectural Overview

BookYourBarber is built as a **Modular Monolith** using Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS v4, and Supabase PostgreSQL with Row Level Security (RLS).

```
UI (Next.js Server & Client Components)
       ↓
Application Services (Booking, Availability, Appointment, Customer, Payment, Refund, Audit)
       ↓
Domain Rules & Validation (Booking reference, Cancellation fees, Completion invariants, Validators)
       ↓
Repository Abstraction Layer (RepositoryContainer: Mock vs. Supabase)
       ↓
Supabase Database (PostgreSQL with Row Level Security)
```

---

## 2. Layered Responsibilities

### 2.1 UI Layer (`src/app/` & `src/ops/`)
- **Customer Booking Flow** (`/book/[salonSlug]`): Frictionless, mobile-optimized multi-step wizard handling salon selection, barber choice, calendar slots, client details, payment method, and real-time reservation confirmation.
- **Salon Operations Portal** (`/app/*`): Desktop sidebar and mobile bottom navigation for barbershop managers and owners, covering Dashboard, Calendar, Appointments, Customers, Staff, Services, Financials, and Salon Settings.
- **Platform Administration** (`/admin`): Super-admin portal guarded at server middleware for platform-level telemetry and controlled support sessions.
- **Authentication Flows** (`/auth/*`): Email/password login, registration, password reset, and `/auth/callback` PKCE exchange.

### 2.2 Application Service Layer (`src/application/services/`)
Coordinates business workflows across multiple entities, keeping React components purely presentational:
- `BookingService`: Customer resolution/creation and appointment booking creation.
- `AvailabilityService`: Dynamic slot calculation accounting for staff working hours, breaks, schedule exceptions, service duration, and active bookings.
- `AppointmentService`: Appointment status transitions (completion, cancellation fee calculation, rescheduling validation).
- `CustomerService`: Tenant-scoped client search, CRM history, and segment categorization.
- `PaymentService`: Transaction recording, balance reconciliation, and payment gateway adapter invocation.
- `RefundService`: Refund lifecycle orchestration (`requested` → `processing` → `completed` / `failed`).
- `NotificationService`: Channel-agnostic notification logging and template tracking (WhatsApp, SMS, Email).
- `SubscriptionService`: Salon platform tier entitlement checks (Starter, Growth, Enterprise).
- `AuditService`: Immutable event auditing for operational actions.
- `SupportService`: Controlled, time-bounded admin impersonation sessions.

### 2.3 Domain Layer (`src/domains/`)
- `src/domains/canonical/`: Source-of-truth TypeScript models corresponding to the database schema.
- `src/domains/appointments/rules.ts`: Pure business invariants (zero-balance completion requirement, cancellation fee tiers, minimum reschedule lead time).
- `src/domains/booking/reference.ts`: Collision-free, human-readable booking reference generator (`BYB-YYYYMMDD-XXXXX`).
- `src/domains/validation/validators.ts`: South African phone (+27), email, UUID, date, monetary amount, and XSS sanitizers.
- `src/domains/errors/ApplicationError.ts`: Typed error hierarchy with `toUserFacingMessage()` sanitization.

### 2.4 Repository Layer (`src/infrastructure/repositories/`)
- `RepositoryContainer`: Dependency injection container providing decoupled access to data entities.
- `MockRepositories`: Deterministic, in-memory fixtures for offline development, local unit tests, and rapid prototyping.
- `SupabaseRepositories`: Production data access layer using `@supabase/ssr` querying PostgreSQL tables under active user sessions with RLS enforcement.

### 2.5 Infrastructure & Supabase Client Architecture (`src/infrastructure/supabase/`)
Strict separation of Supabase client contexts:
- **Browser Client** (`client.ts`): Uses public anonymous key via `createBrowserClient()`. Safe for client components.
- **Server Client** (`server.ts`): Uses Next.js cookies via `createServerClient()`, automatically synchronizing auth cookies across server components, route handlers, and server actions.
- **Admin Client** (`admin.ts`): Elevated client using `SUPABASE_SERVICE_ROLE_KEY`. Protected by a runtime assertion throwing an immediate error if instantiated in a browser context.
- **Middleware** (`middleware.ts`): Session token refresh and cookie synchronization on every request.

---

## 3. Multi-Tenant Architecture & Context

### 3.1 Tenant Model
Every salon account is a distinct `tenants` record. Every business table contains a `tenant_id` foreign key.

### 3.2 Tenant Context Resolution
Tenant context is resolved server-side:
1. `src/middleware.ts` intercepts requests to `/app/*`.
2. Supabase auth session verifies the authenticated user ID.
3. `src/application/tenant/server.ts` queries `tenant_memberships` for that user ID.
4. If valid membership exists, context is granted. If invalid or missing, access is denied. Client-provided tenant IDs are never trusted blindly.

