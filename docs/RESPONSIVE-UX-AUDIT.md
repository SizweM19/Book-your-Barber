# BookYourBarber — Responsive UX & Viewport Audit

**Date:** September 2026  
**Status:** Complete Audit & Remediation Blueprint  
**Scope:** Customer Booking Flow (`src/App.tsx`), Salon Management Experience (`src/app/app/*` and `src/ops/*`), Shared Shells & Layouts.  
**Tested Cellphone Widths:** 320px, 360px, 375px, 390px, 412px, 430px (and desktop viewports 768px, 1024px, 1280px).

---

## 1. Executive Summary

BookYourBarber operates as a unified platform serving two tightly coupled user groups: **Customers** booking appointments on cellphones, and **Salon Owners/Staff** managing daily operations on both mobile phones and desktop workstations.

Prior to this audit, both interfaces suffered from serious responsive design failures:
1. **Salon Management was virtually unusable on cellphones**:
   - The desktop layout mounted a fixed `210px` permanent sidebar that was simply hidden via `md:hidden`, but left the content container plagued by multi-column desktop tables (7 to 8 columns) using `whitespace-nowrap` that forced 800px+ horizontal scroll blowouts.
   - The mobile bottom navigation only exposed 5 fixed routes without a secondary "More" container, omitting critical operations like Staff, Services, Settings, and Support.
   - The Dashboard top bar packed three action buttons alongside a long date string in a single non-wrapping flex row, causing vertical collision and off-screen clipping on viewports under 420px.
2. **Customer Booking failed on compact cellphones (320px – 375px)**:
   - Staff selection used a rigid 2-column grid (`grid-cols-2 gap-3`) which broke down at 320px–360px, leaving only ~135px per card and causing avatar clipping, line-wrapping of names, and text truncation.
   - The Date picker day-matrix packed 7 columns with static horizontal margins (`mx-0.5`) inside a container with static padding, leading to tap target squishing below 36px on 320px screens.
   - Payment credit card preview container used fixed dimensions and monospace text spacing that overflowed 320px viewports.
   - The entire customer container was wrapped in `border-x border-gray-200` which created unwanted inner gutter borders on edge-to-edge cellphone screens.

This document inventories every observed responsive failure, diagnoses root causes down to exact file and line references, specifies exact CSS/component remediation, and establishes a strict testing matrix across mobile device profiles.

---

## 2. Tested Device Viewport Matrix

| Width | Typical Target Devices | Viewport Class | Primary Risk Area |
|---|---|---|---|
| **320px** | iPhone SE (1st gen), Unihertz, small Androids, split-screen mobile | Ultra-compact | Grid wrap collapse, tap targets < 40px, text clipping |
| **360px** | Galaxy A-series, older Galaxy S, base Android device baseline | Compact Android | Date picker day cells, dual-button rows, card gutters |
| **375px** | iPhone SE (2nd/3rd gen), iPhone Mini (12/13), iPhone 6/7/8/X/11 Pro | Standard compact iOS | Table overflow, sticky CTA padding, modal dialogs |
| **390px** | iPhone 12 / 13 / 14 / 15 / 16 (Standard & Pro) | Mainstream iOS | Metric tile wrapping, secondary button collision |
| **412px** | Google Pixel 6 / 7 / 8, Samsung Galaxy S21 / S22 / S23 / S24 | Mainstream Android | Horizontal spacing, safe-area inset management |
| **430px** | iPhone 14 / 15 / 16 Plus & Pro Max | Large iOS Phablet | Container max-width reflow, thumb-reach ergonomics |
| **768px** | iPad Mini, Android tablets (portrait) | Tablet Breakpoint | Desktop header vs bottom bar transition |
| **1024px** | iPad Pro, small laptops, tablet landscape | Compact Desktop | Top navigation menu bar density |
| **1280px+**| Standard desktop monitors, MacBooks | Full Desktop | Max-width content clamping and reading rhythm |

---

## 3. Customer Booking Responsive Audit & Defect Inventory

### Defect CB-01: Outer Container Border on Edge-to-Edge Mobile Screens
- **Location:** `src/App.tsx` (Lines 2722–2724)
- **Current Code:**
  ```tsx
  <div className="min-h-screen bg-gray-50 flex flex-col items-center">
    <div className="w-full max-w-lg min-h-screen bg-white flex flex-col border-x border-gray-200">
  ```
- **Symptom:** On mobile screens (width <= 512px), `border-x border-gray-200` draws two visible 1px gray borders directly on the left and right screen edges, wasting horizontal pixels and looking unpolished.
- **Affected Widths:** 320px, 360px, 375px, 390px, 412px, 430px.
- **Root Cause:** Border is unconditional rather than scoped to viewports above the mobile breakpoint (`sm:border-x`).
- **Remediation:**
  ```tsx
  <div className="min-h-screen bg-gray-50 flex flex-col items-center">
    <div className="w-full max-w-lg min-h-screen bg-white flex flex-col sm:border-x sm:border-gray-200 sm:shadow-none">
  ```

---

### Defect CB-02: Salon Landing Header & Quick-Stats Pill Wrapping
- **Location:** `src/App.tsx` (Lines 332–366)
- **Current Code:**
  ```tsx
  <div className="flex gap-2 px-4 py-3.5 overflow-x-auto flex-shrink-0">
  ```
- **Symptom:** Badges (Hours, Location, Payment) scroll horizontally without visual affordance; text inside pills wraps awkwardly if screen is 320px and user scrolls.
- **Affected Widths:** 320px, 360px.
- **Root Cause:** Pills use static horizontal padding (`px-3 py-1.5`) and fixed gaps without scroll snap or right margin cushion.
- **Remediation:** Add `-mx-4 px-4 scrollbar-none` with `scroll-pl-4` and right padding spacer (`after:w-4 after:flex-shrink-0`) to ensure clean touch swiping.

---

### Defect CB-03: Staff Selection Grid Squeeze & Name Truncation
- **Location:** `src/App.tsx` (Lines 491–516)
- **Current Code:**
  ```tsx
  <div className="grid grid-cols-2 gap-3">
    {list.map(member => (
      <button className="flex flex-col p-4 rounded-2xl border-2 text-left ...">
        <img ... className="w-14 h-14 rounded-full object-cover mb-3" />
        <p className="font-semibold text-[13px] leading-snug">{member.name}</p>
        <p className="text-[11px] mt-0.5">{member.role}</p>
        <p className="text-[11px] mt-2">Next: {member.nextAvailable}</p>
      </button>
    ))}
  </div>
  ```
- **Symptom:** At 320px: Available width = 320px - 32px (container padding) - 12px (gap) = 276px / 2 = 138px. A 138px card with `p-4` (32px horizontal padding) leaves only **106px** of text width. Names like "Devon Williams" or "Ntombi Dlamini" wrap onto two or three jagged lines; avatars dominate the card.
- **Affected Widths:** 320px, 360px.
- **Root Cause:** Rigid `grid-cols-2` without compact card padding or auto-responsive reflow for ultra-narrow widths.
- **Remediation:**
  - On 320px–360px, switch to a flexible single-column or compact grid layout:
    ```tsx
    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
    ```
  - Reduce padding to `p-3` on narrow viewports: `p-3 xs:p-4`.
  - Ensure avatar size scales gracefully: `w-12 h-12 xs:w-14 xs:h-14`.
  - Add `truncate` to the name element with `title={member.name}`.

---

### Defect CB-04: Date Picker Calendar Matrix Squishing on 320px Viewports
- **Location:** `src/App.tsx` (Lines 577–600)
- **Current Code:**
  ```tsx
  <div className="grid grid-cols-7">
    {Array.from({length: getDaysInMonth(vy, vm)}, (_, i) => i + 1).map(day => (
      <button className="aspect-square flex items-center justify-center text-[14px] font-medium rounded-full mx-0.5 my-0.5 ...">
        {day}
      </button>
    ))}
  </div>
  ```
- **Symptom:** At 320px width: Outer padding is `px-4` (32px). Remaining width is 288px. 288px / 7 columns = 41.1px per column. With `mx-0.5` (4px margin per column), the actual day button width shrinks to ~37px, which is below the recommended 44px touch target guideline, and causes adjacent buttons to be accidentally tapped.
- **Affected Widths:** 320px, 360px.
- **Root Cause:** Static container padding (`px-4`) plus non-zero horizontal margins on 7 tight grid cells.
- **Remediation:**
  - Reduce outer container horizontal padding to `px-2 xs:px-4` in the calendar view.
  - Remove `mx-0.5` and use `gap-0.5 xs:gap-1` on the grid parent.
  - Set touch target padding to minimum `min-h-[40px] xs:min-h-[44px]`.

---

### Defect CB-05: Time Slot Buttons Grid Density
- **Location:** `src/App.tsx` (Lines 623–642)
- **Current Code:**
  ```tsx
  <div className="grid grid-cols-3 gap-2">
    {slots.map(s => (
      <button className="py-[13px] rounded-xl text-[13px] font-semibold border-2 ...">
        {s.time}
      </button>
    ))}
  </div>
  ```
- **Symptom:** At 320px width: 3 columns with `gap-2` gives ~88px per slot. While readable, the vertical padding `py-[13px]` creates overly tall touch targets on short cellphone screens (e.g., iPhone SE height is 568px/667px), pushing the CTA bar below the fold.
- **Affected Widths:** 320px, 360px, 375px (short viewport heights).
- **Remediation:** Use `py-2.5 xs:py-3 text-[13px]` to balance touch targets with vertical density.

---

### Defect CB-06: Phone Input & Country Code Layout Blowout
- **Location:** `src/App.tsx` (Lines 714–720)
- **Current Code:**
  ```tsx
  <div className="flex gap-2">
    <div className="flex items-center px-3.5 py-[13px] rounded-xl border-2 border-gray-200 bg-gray-50 text-[13px] text-gray-600 whitespace-nowrap font-medium flex-shrink-0">
      🇿🇦 +27
    </div>
    <input type="tel" ... className={`flex-1 ${inputCls}`} />
  </div>
  ```
- **Symptom:** The country badge contains an emoji (`🇿🇦`) which violates the strict design rule ("zero emojis"), and takes up ~90px. On 320px, this leaves only ~198px for the phone input, causing numbers to feel squeezed.
- **Affected Widths:** 320px, 360px.
- **Root Cause:** Hardcoded emoji and wide pill width.
- **Remediation:**
  - Replace emoji with clean text prefix `ZA +27` or an engineered SVG South African flag icon.
  - Adjust padding to `px-2.5 py-3 text-[12px]`.

---

### Defect CB-07: Payment Card Preview & Monospace Spacing Overflow
- **Location:** `src/App.tsx` (Lines 1115–1150)
- **Current Code:**
  ```tsx
  <div className="relative h-44 rounded-2xl p-5 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white shadow-xl flex flex-col justify-between">
    <p className="font-mono text-[18px] tracking-widest text-center mt-3">
      {cardNum || "•••• •••• •••• ••••"}
    </p>
  ```
- **Symptom:** The card uses a gradient (`bg-gradient-to-br`), drop shadow (`shadow-xl`), and fixed letter tracking (`tracking-widest`) at `text-[18px]`. On 320px screens with `px-4` padding, a 19-character string with `tracking-widest` exceeds the card container's inner width (248px), causing overflow or wrapping.
- **Affected Widths:** 320px.
- **Root Cause:** Gradient and shadow violate design system; font size and tracking too wide for ultra-compact screens.
- **Remediation:**
  - Switch to flat black background `bg-gray-900 border border-gray-800` (zero gradient, zero drop shadow).
  - Use `text-[15px] xs:text-[17px] tracking-wider font-mono` to ensure it never wraps.

---

### Defect CB-08: Fixed Bottom CTA Bar Safe-Area Inset Handling
- **Location:** `src/App.tsx` (Lines 252–270)
- **Current Code:**
  ```tsx
  function CtaBar({ label, onClick, disabled = false, danger = false }) {
    return (
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
        <button ... className="w-full py-[15px] rounded-2xl ...">
  ```
- **Symptom:** On modern iPhones with home indicator bar (iPhone X through 16 Pro Max), `pb-5` (20px) is insufficient if safe-area-inset is ~34px, causing the button to directly overlap or abut the system swipe bar.
- **Affected Widths:** 375px, 390px, 412px, 430px (all modern gesture-navigation phones).
- **Root Cause:** Lack of CSS `env(safe-area-inset-bottom)`.
- **Remediation:** Add `pb-[max(1.25rem,env(safe-area-inset-bottom))]` or `.safe-area-bottom` class.

---

## 4. Salon Management Responsive Audit & Defect Inventory

### Defect SM-01: Permanent Sidebar Architecture Incompatible with Cellphones
- **Location:** `src/app/app/layout.tsx` (Lines 137–260) and `src/ops/layout.tsx` (Lines 125–230)
- **Current Code:**
  ```tsx
  <aside className="hidden md:flex flex-col w-[210px] min-h-screen bg-white border-r border-gray-200 flex-shrink-0">
  ```
- **Symptom:**
  - Desktop uses a traditional left sidebar that consumes 210px of horizontal real estate.
  - On mobile (<768px), the sidebar is hidden (`hidden md:flex`), but there is no unified top header; the mobile screen is left with only a bottom bar.
  - When the user transitions from desktop to tablet (768px–1023px), the 210px sidebar compresses operational tables into unreadable widths.
- **Mandate:** Eliminate the desktop sidebar entirely. Implement a clean, top-level navigation system for desktop, paired with a bottom tab bar + "More" drawer for mobile.

---

### Defect SM-02: Mobile Bottom Navigation Missing "More" & Incomplete Routes
- **Location:** `src/app/app/layout.tsx` (Lines 267–339)
- **Current Code:**
  ```tsx
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-1.5 safe-area-bottom">
    Today | Calendar | Bookings | Clients | Finance
  </nav>
  ```
- **Symptom:**
  - The mobile bottom bar has 5 arbitrary items: `Today`, `Calendar`, `Bookings`, `Clients`, `Finance`.
  - `Staff`, `Services`, `Settings`, and `Support` are **completely unreachable** on mobile phones without manually entering URLs into the browser!
  - Tab names do not follow the product specification: specification mandates **Home**, **Calendar**, **Appointments**, **Customers**, **More**.
- **Root Cause:** Incomplete mobile navigation model lacking a secondary drawer/sheet.
- **Remediation:**
  - Replace the 5 tabs with:
    1. `Home` (`/app`)
    2. `Calendar` (`/app/calendar`)
    3. `Appointments` (`/app/appointments`)
    4. `Customers` (`/app/customers`)
    5. `More` (opens full-height bottom sheet/drawer containing Staff, Services, Financials, Settings, Support, Account profile, Sign out).

---

### Defect SM-03: Dashboard Header Multi-Button Row Collision
- **Location:** `src/ops/Dashboard.tsx` (Lines 97–116)
- **Current Code:**
  ```tsx
  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">Overview</h1>
      <p className="text-[12px] text-gray-500 mt-0.5">{dateFormatted} · {tenant?.name || 'Salon'}</p>
    </div>
    <div className="flex items-center gap-2">
      <PrimaryBtn label="New appointment" onClick={() => onNav("createAppt")} ... />
      <SecondaryBtn label="Appointments" onClick={() => onNav("appointmentList")} />
      <SecondaryBtn label="Calendar" onClick={() => onNav("calendarDay")} />
    </div>
  </div>
  ```
- **Symptom:**
  - Title block requires ~180px.
  - Three action buttons require ~335px width.
  - On viewports < 520px (including 320px, 360px, 375px, 390px, 412px, 430px), these elements collide. Buttons either wrap onto the next line awkwardly, overflow horizontally, or push the date subtitle off screen.
  - "Appointments" and "Calendar" buttons are completely redundant because they exist permanently in the bottom navigation bar.
- **Remediation:**
  - On mobile (<640px), collapse action buttons to a single primary action: `+ New` or `+ Appointment`.
  - Hide the redundant "Appointments" and "Calendar" secondary buttons on mobile (`hidden sm:inline-flex`).
  - Allow title block to use full width if needed: `flex flex-col sm:flex-row sm:items-center justify-between gap-3`.

---

### Defect SM-04: Appointments Table Horizontal Blowout (8 Columns)
- **Location:** `src/ops/Appointments.tsx` (Lines 172–203)
- **Current Code:**
  ```tsx
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          {["Reference","Customer","Service","Staff","Date / Time","Source","Payment","Status"].map(h => (
            <th className="... whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>...</tbody>
    </table>
  </div>
  ```
- **Symptom:**
  - 8 columns with `whitespace-nowrap` require a minimum of ~820px to render.
  - On a 360px or 375px cellphone screen, more than 55% of the table is hidden off-screen to the right.
  - Horizontal scrolling within a nested card causes gesture conflicts with browser back/forward swiping, and prevents salon staff from quickly seeing the status, customer name, and time of today's appointments.
- **Root Cause:** Desktop-only table markup rendered on mobile devices.
- **Remediation:**
  - Implement a dual-mode layout:
    - **Desktop (`hidden md:block`)**: Full 8-column table with complete sorting and actions.
    - **Mobile (`md:hidden`)**: Structured card list where each appointment is an interactive, touch-friendly card displaying:
      - Row 1: Time (`09:00`) + Booking Reference (`#BF-8921`) + Appointment Status badge.
      - Row 2: Customer Name (bold) + Phone number (with one-touch `tel:` link).
      - Row 3: Service Name + Staff Member + Payment Status badge + Total Amount.
      - Tap opens full appointment detail view.

---

### Defect SM-05: Customers Table Horizontal Blowout (7 Columns)
- **Location:** `src/ops/Customers.tsx` (Lines 251–285)
- **Current Code:**
  ```tsx
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          {["Customer","Phone","Segment","Visits","Total spend","Last visit","Outstanding"].map(h => (
            <th className="... whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
    </table>
  </div>
  ```
- **Symptom:**
  - 7 columns require ~760px minimum width.
  - On mobile, staff cannot see visits, total spend, or outstanding balances without extensive horizontal panning.
- **Remediation:**
  - Mobile card view:
    - Customer name + avatar + Segment badge (`VIP`, `Regular`, `New`).
    - Contact phone with quick call button.
    - Stats strip: Visits (`12`), Total Spend (`R1,850`), Last Visit (`14 Sep 2026`).
    - Prominent red alert badge if `outstandingBalance > 0`.

---

### Defect SM-06: Financials & Payments Table Horizontal Blowout (7 Columns)
- **Location:** `src/ops/Financials.tsx` (Lines 365–395)
- **Current Code:**
  ```tsx
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          {["Date/Time","Booking ref","Customer","Service","Amount","Method","Status"].map(h => (
            <th className="... whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
    </table>
  </div>
  ```
- **Symptom:** Similar to Appointments and Customers; financial records stretch horizontally, obscuring payment status and method on cellphones.
- **Remediation:**
  - Mobile card view:
    - Amount (`R250.00`) in bold + Status badge (`Successful`).
    - Customer Name + Service Name.
    - Date & Time + Payment Method (`Card` / `Cash`) + Booking Reference.

---

### Defect SM-07: Calendar Time Grid Usability on Touch Devices
- **Location:** `src/ops/Calendar.tsx` (Lines 280–360)
- **Current Code:** Renders multi-staff horizontal column grid with 15-minute intervals.
- **Symptom:**
  - With 4 staff members, horizontal grid width is > 600px.
  - Staff members' schedules are squeezed into ~70px columns on mobile, causing appointment blocks to truncate into illegible 2-character snippets.
- **Remediation:**
  - On mobile viewports (<768px), provide a staff segmented toggle (`All Staff` vs individual staff selector chips) or default to a chronological **Agenda / Stream View** grouped by hour.
  - Ensure appointment blocks have minimum height of 48px to allow easy finger tapping without opening the wrong booking.

---

### Defect SM-08: Metric Tiles 4-Column Layout on Mobile
- **Location:** `src/ops/Dashboard.tsx` (Lines 119–124)
- **Current Code:**
  ```tsx
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
  ```
- **Symptom:**
  - On 320px screens: Each tile has width (320 - 32 - 10) / 2 = 139px.
  - Currency amounts like `R12,450.00` can wrap or push against borders.
- **Remediation:**
  - Set stat values to auto-scale font size: `text-[18px] xs:text-[22px] font-bold`.
  - Maintain `grid-cols-2` on mobile, ensuring compact padding (`p-3`).

---

### Defect SM-09: Modal Dialogs & Action Sheets Viewport Clipping
- **Location:** `src/ops/Customers.tsx` (Lines 150–232), `src/ops/Appointments.tsx`
- **Current Code:** Fixed modal containers with `p-6` and centered positioning `fixed inset-0 flex items-center justify-center p-4`.
- **Symptom:**
  - On 320px and short phones, modals with 4+ input fields exceed the screen height.
  - Because `overflow-y-auto` is not applied to the modal inner wrapper, the "Save" and "Cancel" buttons get pushed below the bottom edge of the screen and cannot be tapped.
- **Remediation:**
  - Transform desktop centered modals into **Mobile Bottom Sheets** on screens < 640px:
    - `fixed inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl overflow-y-auto p-4 bg-white border-t border-gray-200`.
    - Sticky action bar at the sheet bottom.

---

### Defect SM-10: Total Absence of a Dedicated Support Experience
- **Location:** Whole codebase (`src/app/app/`, `src/ops/`)
- **Current Code:** Zero support routes, zero FAQ links, zero help modals.
- **Symptom:** Salon owners and staff encounter errors or have questions about cancellation policies, card settlement, staff rosters, or slot holds, with no in-app recourse other than leaving the app.
- **Remediation:**
  - Implement `/app/support` route with:
    1. Searchable Knowledge Base based on actual implemented functionality.
    2. Categorized FAQs (Bookings, Payments & Refunds, Staff & Availability, Salon Settings).
    3. Direct Human Support route (Email/Phone contact form with real salon contact details).
    4. Linkable from top header (desktop) and "More" drawer (mobile).

---

## 5. Viewport Breakpoint & Spacing System Standards

To eliminate all responsive defects, both Customer Booking and Salon Management must conform to the following spacing and typography standards:

```
/* Fluid Breakpoint Tokens */
Default:  320px - 639px  (Mobile-first single column, card lists, bottom tab bar)
sm:       640px - 767px  (Large mobile / compact tablet phablet)
md:       768px - 1023px (Tablet / small laptop, transition to top header)
lg:       1024px - 1279px (Standard desktop, full multi-column tables)
xl:       1280px+         (Widescreen workstation, content max-width clamp)
```

### Touch Target Sizing Matrix
- **Buttons & Primary CTAs:** Height >= 44px (ideal 48px). Full width on mobile.
- **Table / List Row Tap Targets:** Height >= 52px with visual active state.
- **Form Inputs:** Height >= 44px, text size >= 16px to prevent iOS auto-zoom on input focus.
- **Date Picker Day Cells:** Height & Width >= 40px on 320px, 44px on 375px+.
- **Icon Buttons:** Minimum hit target 40x40px with `p-2`.

---

## 6. Verification & Automated Testing Plan

Every fix in this audit will be verified through:
1. **Automated Unit & Component Tests:** Vitest test suite testing component rendering across mocked window widths.
2. **TypeScript Compilation:** `npm run type-check` (or `tsc --noEmit`) exiting with code 0.
3. **Next.js Production Build:** `npm run build` validating all App Router pages compile without hydration or layout errors.
4. **Viewport Smoke Inspection:** Validating DOM layout, overflow styles, and tap target dimensions across 320px, 360px, 375px, 390px, 412px, 430px, 768px, 1024px, and 1280px.
