# BookYourBarber — Role-Based Access Control (RBAC) Specification

## 1. Role Definitions

BookYourBarber operates on three explicit administrative and operational roles:

| Role | Scope | Description |
| :--- | :--- | :--- |
| `PLATFORM_ADMIN` | Global Platform Scope | System administrators governing platform-wide metrics, tenant accounts, and controlled support sessions. |
| `OWNER` | Salon Tenant Scope | Salon proprietor with full administrative authority over salon settings, billing, subscriptions, staff, services, and financials. |
| `MANAGER` | Salon Tenant Scope | Salon operational supervisor managing daily rosters, appointments, clients, payments, and operational expenses. |

> [!NOTE]
> **Staff and Barbers**: Staff members are records only in this foundation release and do not possess authenticated login accounts.
> **Customers**: Customers are guest users and book appointments without mandatory customer accounts.

---

## 2. Permissions Matrix

| Capability / Resource | Platform Admin | Salon Owner | Salon Manager | Guest Customer |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Services & Book Appointment** | — | ✅ | ✅ | ✅ |
| **Lookup Own Booking by Reference** | — | ✅ | ✅ | ✅ |
| **Access Salon Operational Hub (`/app`)** | — | ✅ | ✅ | ❌ |
| **Manage Today Calendar & Appointments** | — | ✅ | ✅ | ❌ |
| **Create & Reschedule Bookings** | — | ✅ | ✅ | ❌ |
| **Record In-Person Payment & Complete Appt**| — | ✅ | ✅ | ❌ |
| **Add / Edit Salon Services** | — | ✅ | ✅ | ❌ |
| **Manage Staff Working Hours & Breaks** | — | ✅ | ✅ | ❌ |
| **Review Financials & Daily Cash Register**| — | ✅ | ✅ | ❌ |
| **Record Operating Expenses** | — | ✅ | ✅ | ❌ |
| **Alter Salon Profile & Billing Policy** | — | ✅ | ❌ | ❌ |
| **Manage Subscription Plans & Upgrades** | — | ✅ | ❌ | ❌ |
| **Access Platform Admin Hub (`/admin`)** | ✅ | ❌ | ❌ | ❌ |
| **Initiate Audited Support Session** | ✅ | ❌ | ❌ | ❌ |

---

## 3. Multi-Layered Enforcement

Authorization is enforced at four distinct boundaries:

### 3.1 Database Layer (Row Level Security)
Defined in `supabase/migrations/20260909000002_rls_policies.sql`:
- All tenant tables strictly require `is_tenant_member(tenant_id)`.
- Updates to `tenants` table require `get_tenant_role(tenant_id) = 'OWNER'`.
- Platform telemetry queries require `is_platform_admin()`.

### 3.2 Server Middleware (`src/middleware.ts`)
- Requests to `/app/*` verify an active Supabase user session. Unauthenticated users are redirected to `/auth/login?returnUrl=...`.
- Requests to `/admin/*` query the `platform_admins` table server-side. Non-admins are redirected to `/app`.

### 3.3 Application Authorization Layer (`src/application/authorization/roles.ts`)
Central authorization helpers prevent string comparison scattering across UI components:
- `hasTenantRole(user, tenantId, allowedRoles)`
- `isTenantOwner(user, tenantId)`
- `isTenantManagerOrOwner(user, tenantId)`
- `isPlatformAdmin(user)`
- `assertAuthorized(condition, message)`

### 3.4 Client-Side UI Layer
The desktop sidebar and mobile navigation conditionally hide or disable sensitive views depending on `currentRole`.

