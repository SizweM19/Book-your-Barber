# BookYourBarber — Financial Operations

## Context

The booking engine, ops dashboard, and settings system are complete. This phase adds the **Financials** section covering payments, refunds, revenue, expenses, and reports. The spec (`bookyourbarber-financials.md`) defines 31 screen types. Existing appointment payment data (`PaymentRecord`, `CancellationRecord`, `PaymentStatus` in `src/ops/types.ts` and `OPS_APPOINTMENTS` in `src/ops/data.ts`) is reused — no existing screens are changed.

---

## What already exists (reuse)

| Existing | Reuse how |
|---------|-----------|
| `PaymentStatus`, `PaymentMethod`, `PaymentRecord`, `CancellationRecord`, `RefundStatus` — `src/ops/types.ts` | Extend with `RefundRecord` and `ExpenseRecord` interfaces |
| `OPS_APPOINTMENTS[].payments[]` and `.cancellation?` — `src/ops/data.ts` | Source of truth for payment history and refund data |
| `OPS_STAFF[].todayRevenue`, `.monthRevenue` | Revenue-by-staff breakdowns |
| `fmtR()`, `Card`, `SearchBar`, `SectionTitle`, `EmptyState`, `PrimaryBtn`, `BackBtn`, `OpsDetailRow` — `src/ops/shared.tsx` | Used throughout all new screens |
| `PayBadge` — `src/ops/shared.tsx` | Payment status badges in payment list |

---

## Architecture

### New file
- **`src/ops/Financials.tsx`** — all financial screens in one module

### Modified files
- **`src/ops/types.ts`** — add `RefundRecord`, `ExpenseRecord` interfaces and new `OpsView` values
- **`src/ops/data.ts`** — add `OPS_REFUNDS`, `OPS_EXPENSES` mock arrays
- **`src/ops/layout.tsx`** — add "Financials" nav item to sidebar + NAV_OWNS
- **`src/SalonOps.tsx`** — add new router cases + `expenseId` state variable

---

## New types to add to `src/ops/types.ts`

```typescript
export interface RefundRecord {
  id: string
  refundRef: string           // e.g. "REF-20260908-001"
  apptRef: string
  customer: string
  customerId: string
  originalAmount: number
  cancelledBy: CancellationBy
  feePercent: number
  feeAmount: number
  refundAmount: number
  status: "requested" | "processing" | "completed" | "failed"
  requestedAt: string
  completedAt?: string
}

export interface ExpenseRecord {
  id: string
  category: "Rent" | "Electricity" | "Products" | "Salaries" | "Marketing" | "Transport" | "Other"
  description: string
  amount: number
  date: string
}
```

---

## New OpsView values (append to `src/ops/types.ts`)

```typescript
| "financials"
| "paymentList"
| "paymentDetail"
| "outstandingPayments"
| "refundList"
| "refundDetail"
| "revenueDetail"
| "expenseList"
| "addExpense"
| "editExpense"
| "financialReports"
```

---

## New mock data to add to `src/ops/data.ts`

**`OPS_REFUNDS`** — 3–4 records covering all statuses:
- One `completed` refund (customer cancelled >24h, 10% fee applied)
- One `processing` refund (salon cancelled, full refund)
- One `failed` refund (contact support required)
- One `requested` refund (just submitted)

**`OPS_EXPENSES`** — 5–6 records across different categories (Rent, Products, Electricity, Marketing) with realistic ZAR amounts, dated in September 2026.

---

## Sidebar changes (`src/ops/layout.tsx`)

Add a fourth group **"Finance"** with one item:
```
{ key:"financials", label:"Financials", emoji:"💰", group:"finance" }
```

NAV_OWNS for `financials`:
```
["financials","paymentList","paymentDetail","outstandingPayments",
 "refundList","refundDetail","revenueDetail","expenseList",
 "addExpense","editExpense","financialReports"]
```

---

## Screens to build in `src/ops/Financials.tsx`

### 1. `FinancialsHubScreen` (`"financials"`)
- **Revenue summary cards** (4-wide on desktop, 2×2 on mobile): Charged / Paid / Outstanding / Refunded
- **Operating result card**: Revenue (paid) − Expenses = Operating result
- **Period filter**: Today / This week / This month / Last month / Custom
- **Quick nav rows**: Payments → Outstanding → Refunds → Expenses → Reports
- **Recent payments**: last 5 payment records from all appointments (time + customer + amount + method badge)
- **Outstanding payments count** with "View all" link → `outstandingPayments`

### 2. `PaymentListScreen` (`"paymentList"`)
- Full payment history — **flattened from `OPS_APPOINTMENTS[].payments[]`**
- Each row: date · booking ref (mono) · customer · amount · method · status badge
- **Period filter tabs**: Today / This week / This month / Custom
- **Status filter**: All / Successful / Failed
- **Search**: booking ref, customer name, phone
- Tap row → `paymentDetail`
- Empty state: "No payments yet. Payments appear when customers pay for appointments."

### 3. `PaymentDetailScreen` (`"paymentDetail"`)
- Shows one `PaymentRecord` in context of its parent appointment
- Fields: Payment ref (generated) · Booking ref · Customer · Amount · Method · Date/time · Status
- **Financial activity timeline** (spec §36): Booking created → Payment received → Booking confirmed (→ Cancellation → Refund requested if applicable)
- Link to appointment detail

### 4. `OutstandingPaymentsScreen` (`"outstandingPayments"`)
- Filtered list: appointments where `paid < charged` and status not cancelled
- Each row: customer · booking ref · service · amount due · payment status badge
- "Record payment" action per row → navigates to `recordPayment` (sets `apptRef` first)
- Summary: total outstanding amount at top
- Empty state: "No outstanding payments. All appointments are settled."

### 5. `RefundListScreen` (`"refundList"`)
- All `OPS_REFUNDS` records
- Each row: refund ref · booking ref · customer · amount · cancelled-by · status badge
- **Status filter**: All / Requested / Processing / Completed / Failed
- **Search**: booking ref, refund ref, customer
- Tap → `refundDetail`
- Empty state: "No refunds yet."

### 6. `RefundDetailScreen` (`"refundDetail"`)
- Full refund record display
- **Cancelled by** prominently distinguishes "Customer" vs "Salon"
- Calculation breakdown: Original amount → Cancellation fee (%) → Refund amount
- **Status timeline**: Requested → Processing → Completed (with timestamps)
- If `status === "failed"`: red banner — "Refund could not be completed." + "Contact BookYourBarber support" CTA
- If `status === "processing"`: amber banner — "Expected: 3–5 business days. Not guaranteed."
- Activity timeline showing booking and refund events

### 7. `RevenueDetailScreen` (`"revenueDetail"`)
- **Period selector**: Today / Yesterday / This week / This month / Last month / Custom
- **Summary tiles**: Charged / Paid / Outstanding / Refunded / Expenses / Operating result
- **Revenue by staff**: table — name · completed appointments · revenue (from `OPS_STAFF.monthRevenue` + filtered `OPS_APPOINTMENTS`) — explicit note "Revenue associated with completed appointments. Commissions not calculated."
- **Revenue by booking source**: three rows (Online / QR / Manual) with amounts and percentages derived from appointment source field
- **Revenue by payment method**: rows for each method (Cash / Card / Yoco / PayShap / Other) with total paid amounts

### 8. `ExpenseListScreen` (`"expenseList"`)
- All `OPS_EXPENSES` records, grouped or listed chronologically
- Each row: category badge · description · date · amount · Edit / Delete buttons
- **Expense summary card**: Total expenses + breakdown by category
- "Add expense" button → `addExpense`
- Delete → inline confirmation card (spec §25): "Delete this expense? [Category · Amount · Date] — Delete / Cancel"
- Empty state: "No expenses yet. Track your salon costs to see your operating result."

### 9. `AddExpenseScreen` (`"addExpense"`)
- Form: Category (select) / Amount (R input) / Date (date input, default today) / Description (text)
- CTA: "Save expense" / "Cancel"
- Success toast: "Expense saved."

### 10. `EditExpenseScreen` (`"editExpense"`)
- Same form pre-populated with selected expense
- CTA: "Save changes" / "Cancel"
- Success toast: "Expense updated."

### 11. `FinancialReportsScreen` (`"financialReports"`)
- Report cards for: Revenue / Payments / Outstanding / Refunds / Expenses / Booking source / Payment methods / Staff performance
- Each card: description + date range selector + **Export** button
- Export flow: click "Export CSV" or "Export PDF" → inline "Preparing export…" state (spinner) → "Download report" link (simulated)
- Error state per export: "Unable to generate report. Try again."

---

## Operating result formula (displayed in hub and revenue screen)

```
Operating result = Total paid (completed appointments) − Total expenses
```

Clearly labeled: "Based on BookYourBarber recorded activity. Not formal accounting."

---

## Cancellation fee clarity (spec §43)

In refund detail: show note — "Cancellation fees are platform revenue and not counted as salon service income."

---

## Router changes (`src/SalonOps.tsx`)

Add `expenseId` state variable (string). New cases:

```typescript
case "financials":         return <FinancialsHubScreen onNav={navTo} onAppt={goAppt} />
case "paymentList":        return <PaymentListScreen onBack={back} onNav={navTo} />
case "paymentDetail":      return <PaymentDetailScreen onBack={back} onAppt={goAppt} />
case "outstandingPayments":return <OutstandingPaymentsScreen onBack={back} onAppt={goAppt} onRecord={ref => { setApptRef(ref); navTo("recordPayment") }} />
case "refundList":         return <RefundListScreen onBack={back} onRefund={id => { setRefundId(id); navTo("refundDetail") }} />
case "refundDetail":       return <RefundDetailScreen refundId={refundId} onBack={back} onAppt={goAppt} />
case "revenueDetail":      return <RevenueDetailScreen onBack={back} />
case "expenseList":        return <ExpenseListScreen onBack={back} onAdd={() => navTo("addExpense")} onEdit={id => { setExpenseId(id); navTo("editExpense") }} />
case "addExpense":         return <AddExpenseScreen onBack={back} onDone={() => setView("expenseList")} />
case "editExpense":        return <EditExpenseScreen expenseId={expenseId} onBack={back} onDone={() => setView("expenseList")} />
case "financialReports":   return <FinancialReportsScreen onBack={back} />
```

Also add `refundId` state variable (string).

---

## Key product rules

- Appointment status and payment status are always independent — never inferred from each other
- No Stripe branding anywhere
- No commission calculations — revenue by staff is appointment revenue association only
- Cancellation fees noted as platform revenue, not salon revenue
- Historical appointment amounts never change when service price changes
- Operating result clearly labeled as non-accounting estimate
- Pay-at-shop confirmed bookings show "Amount due at shop" — `paymentStatus: "unpaid"` is valid

---

## Verification

1. Financials hub shows today's revenue summary and outstanding count
2. Payment list: flattened payment records visible, search by booking ref works
3. Outstanding payments: appointments with paid < charged visible, "Record payment" links correctly
4. Refund detail: cancelled-by clearly distinguished, calculation breakdown visible, failed state shows support CTA
5. Revenue detail: by-staff, by-source, by-method all render from existing data
6. Expenses: add → appears in list; delete → confirmation → removed
7. Reports: export flow shows "Preparing…" → "Download" states
8. Operating result = paid − expenses (clearly labeled)
