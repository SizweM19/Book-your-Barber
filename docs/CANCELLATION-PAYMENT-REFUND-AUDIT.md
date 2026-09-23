# BookYourBarber — Cancellation, Payment/Refund & Salon Management Audit

## Executive Summary

This audit document investigates the root causes of reliability and performance issues across **Customer Booking** and **Salon Management (`/app/*`)**. The audit adheres strictly to the approved business rules, existing architecture, Supabase RLS security, and flat UI design system without introducing mock fallbacks or modifying Platform Admin.

---

## 1. Audit Item A: Salon Cancellation Failure & Error Handling

### Observed Problem
1. When a salon manager cancels an appointment via Salon Management (`CancelApptScreen`), the screen sometimes fails or throws an error, yet the UI still marks the cancellation as "confirmed".
2. The appointment state in the database may fail to update, leaving the appointment active while the UI falsely states it was cancelled.
3. The cancellation detail screen fails to display the resulting cancellation record or refund state.
4. If an appointment is already cancelled, attempting to cancel it again causes unhandled errors or duplicate refund attempts.

### Reproduction Path
1. Navigate to `/app/appointments`.
2. Select any confirmed or paid appointment &rarr; open `AppointmentDetailScreen`.
3. Click "Cancel appointment" &rarr; opens `CancelApptScreen`.
4. Click "Confirm cancellation".
5. In `CancelApptScreen`, the click handler wraps `appointmentService.cancelAppointment(appt.id, 'salon')` in:
   ```tsx
   try {
     if (appt?.id) await appointmentService.cancelAppointment(appt.id, 'salon')
     setConfirmed(true)
   } catch {
     setConfirmed(true)
   }
   ```
6. If `cancelAppointment` returns an error object `{ error: '...' }` or if an unhandled RLS/database error occurs during refund creation, `setConfirmed(true)` executes anyway, masking the failure.
7. Upon returning to `AppointmentDetailScreen`, `appt.cancellation` is `undefined` because `AppointmentDetailScreen` never queries `repositories.refunds.listByAppointment(appt.id)`.

### Affected Layers & Files
- **Route**: `/app/appointments`
- **Components**: `CancelApptScreen`, `AppointmentDetailScreen` in [`src/ops/Appointments.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Appointments.tsx)
- **Services**: [`src/application/services/AppointmentService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/services/AppointmentService.ts), [`src/application/services/RefundService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/services/RefundService.ts)
- **Repositories**: [`SupabaseAppointmentRepository`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/infrastructure/repositories/SupabaseRepositories.ts), [`SupabaseRefundRepository`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/infrastructure/repositories/SupabaseRepositories.ts)
- **Database Tables**: `appointments`, `refunds`

### Root Cause Analysis
1. **Error Masking in UI**: `CancelApptScreen` ignores the return value of `appointmentService.cancelAppointment(...)`. Because `cancelAppointment` returns `{ error: string }` on validation failures rather than throwing, `res.error` was never checked, and `catch` also set `confirmed = true`.
2. **Missing Pre-Condition & Idempotency Checks**: `AppointmentService.cancelAppointment` did not verify whether the appointment was already cancelled (`appt.status === 'cancelled'`), completed, or in an invalid state.
3. **Uncoordinated Refund Creation**: `AppointmentService.cancelAppointment` called `this.repos.refunds.create` directly with an unconstrained random reference rather than delegating to `RefundService.requestRefund` which enforces tenant isolation, over-refund checks, and active duplicate refund rejection.
4. **Missing Appointment Payment Status Transition**: `AppointmentService` had a dummy `try { await this.repos.appointments.recordPayment(id, 0, 'refundProcessing') } catch {}` block which silently failed because `recordPayment` is meant for recording new payment increments, not updating payment status.
5. **Missing Cancellation Data on Appointment Detail**: `AppointmentDetailScreen` populated `appt` with `notifications: []` and `payments: []`, and never loaded `refunds`. As a result, `{appt.cancellation && (...)}` never evaluated to true.

### Proposed Fix
1. In `AppointmentService.cancelAppointment`:
   - Validate appointment exists and is not already cancelled (`if (appt.status === 'cancelled') return { error: 'Appointment is already cancelled.' }`).
   - Validate appointment is not already completed or no-show.
   - Update status via `this.repos.appointments.updateStatus(id, 'cancelled')`.
   - If `feeCalc.isEligibleForRefund`, delegate to `refundService.requestRefund` using an idempotency key (`cancel_${appt.id}`) to prevent duplicate refund requests.
   - Update appointment `paymentStatus` to `'refundProcessing'` (or `'unpaid'` if uncollected).
2. In `CancelApptScreen`:
   - Inspect `result.error`.
   - Display a clear inline error message if cancellation fails.
   - Only set `confirmed = true` on genuine success.
3. In `AppointmentDetailScreen`:
   - Load `refunds` via `repositories.refunds.listByAppointment(dbAppt.id)` and `payments` via `repositories.payments.listByAppointment(dbAppt.id)`.
   - Populate `appt.cancellation` from the active refund record and cancellation timestamp.

### Verification Method
- Automated unit test in `tests/unit/appointment-rules.test.ts` verifying `cancelAppointment` rejects already-cancelled appointments and propagates errors.
- Automated integration test verifying refund record creation upon salon cancellation.
- Manual test cancelling an appointment in Salon Management and checking status updates on Appointment Detail, Calendar, and Financials.

---

## 2. Audit Item B: Customer Card Payment Flow & State Machine

### Observed Problem
1. Customer enters card details &rarr; presses "Pay" &rarr; card step runs a disconnected 2.8s `setTimeout`, then calls `onSuccess()`.
2. The UI sets `processing = false` before `bookingService.createBooking` and `paymentService.recordPayment` complete, causing the screen to flash back to the payment form if the network/database takes longer than 2.8s.
3. The customer can double-click "Pay", causing duplicate bookings or duplicate payment attempts.
4. There is no deterministic development/test adapter to simulate declines, processing timeouts, or successes without hardcoding.
5. Declined provider responses are either not represented or bounce the customer without clear feedback.

### Reproduction Path
1. Navigate to `/book/fade-and-edge`.
2. Complete Service, Staff, Date, Time, Info, and select Card payment.
3. Click "Pay".
4. While the server/network processes the booking, the spinner stops after 2.8s, briefly showing the interactive form again before navigating to confirmation or failure.

### Affected Layers & Files
- **Route**: `/book/[salonSlug]`
- **Component**: `PaymentStep`, `CustomerApp` in [`src/App.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/App.tsx)
- **Domain State Machine**: [`src/domains/payments/state-machine.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/domains/payments/state-machine.ts)
- **Adapter**: [`MockPaymentGatewayAdapter`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/domains/payments/adapters.ts)
- **Services**: [`BookingService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/services/BookingService.ts), [`PaymentService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/services/PaymentService.ts)

### Root Cause Analysis
1. **Decoupled UI Processing State**: `PaymentStep` held a local boolean `processing` controlled by `setTimeout` rather than being bound to the `Promise` returned by `handlePaymentSuccess`.
2. **Missing Card Number Test Adapter**: `MockPaymentGatewayAdapter` returned `{ success: true }` unconditionally, without inspecting the card details. There was no way to test a declined card or a gateway failure.
3. **No Double-Submission Guard**: The submit button was not locked by an overarching submission lock during the entire booking + payment RPC pipeline.

### Proposed Fix
1. Refactor `PaymentStep` to accept an asynchronous `onSubmit(cardData)` prop.
2. The `processing` state in `PaymentStep` stays active throughout the entire async booking creation and payment recording lifecycle.
3. Lock the "Pay" button and all inputs with `disabled={processing}` to prevent accidental duplicate submission.
4. Enhance `MockPaymentGatewayAdapter` with deterministic test card scenarios:
   - **Success**: Default test cards (e.g., ending in `4242` or `0001`).
   - **Declined**: Cards ending in `0002` or CVV `000` &rarr; returns `{ success: false, errorMessage: 'Card declined by issuing bank.' }`.
   - **Timeout/Processing**: Cards ending in `0003` &rarr; simulated network timeout.
5. Ensure `CustomerApp` transitions through explicit states:
   `PAYMENT_IDLE` &rarr; `PAYMENT_SUBMITTING` &rarr; `PAYMENT_PROCESSING` &rarr; `PAYMENT_CONFIRMED` or `PAYMENT_FAILED`.
6. On failure, route to `paymentFailed` step with error explanation and retry button that preserves existing booking draft information.

### Verification Method
- Automated unit tests testing deterministic cards in `tests/unit/payment-engine.test.ts`.
- Verify card `...0002` reliably triggers declined error screen with retry.
- Verify card `...4242` reliably confirms booking and creates single payment record with unique idempotency key.

---

## 3. Audit Item C: Refund Action in Salon Management

### Observed Problem
1. On `AppointmentDetailScreen`, there is no refund button or action visible for appointments that require a refund.
2. The UI does not distinguish between refund states: `REQUESTED`, `PROCESSING`, `COMPLETED`, `FAILED`.
3. If an appointment is cancelled and paid, the salon manager has no mechanism to trigger or retry refund processing.

### Reproduction Path
1. Cancel a paid appointment.
2. Open `/app/appointments` and click the cancelled appointment.
3. Notice that the actions panel is empty because `isActive` is false for cancelled appointments.
4. No refund status or refund processing button is displayed.

### Affected Layers & Files
- **Route**: `/app/appointments`
- **Component**: `AppointmentDetailScreen` in [`src/ops/Appointments.tsx`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/ops/Appointments.tsx)
- **Services**: [`RefundService.ts`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/application/services/RefundService.ts)
- **Repositories**: [`SupabaseRefundRepository`](file:///c:/Users/Sizwe%20Wandile%20Mkhize/Downloads/Book-your-Barber-main/src/infrastructure/repositories/SupabaseRepositories.ts)

### Root Cause Analysis
1. In `AppointmentDetailScreen`:
   ```tsx
   const isActive = !["completed","cancelled","noShow"].includes(appt.status)
   ```
   All actions were wrapped inside `{isActive && (<Card>...</Card>)}`. Once an appointment is cancelled, all controls are hidden.
2. There was no dedicated card or section for Refund Management on `AppointmentDetailScreen`.
3. The screen did not load the refund entity from `repositories.refunds.listByAppointment(id)`.

### Proposed Fix
1. In `AppointmentDetailScreen`, fetch the refund record for the appointment on mount.
2. Add a dedicated **Refund Management** card in the action column when an appointment has an associated refund or is cancelled with `paid > 0`:
   - **`REQUESTED`**: Show status badge "Refund Requested", refund amount, and a primary button "Process refund" calling `refundService.processRefund(refund.id)`.
   - **`PROCESSING`**: Show status badge "Refund Processing (3–5 business days)", with disabled action to prevent duplicate calls.
   - **`COMPLETED`**: Show status badge "Refund Completed" with completion date and transaction reference. No secondary refund action.
   - **`FAILED`**: Show status badge "Refund Failed", failure reason, and a "Retry refund" button calling `refundService.retryFailedRefund(refund.id)`.
3. If cancelled with `paid > 0` but no refund record exists, expose "Request refund" button that invokes `refundService.requestRefund(...)`.

### Verification Method
- Automated test in `tests/unit/financial-service.test.ts` verifying refund state transitions and duplicate prevention.
- Manual test in Salon Management clicking "Process refund" on a requested refund and verifying it transitions to `completed` and updates Financials.

---

## 4. Audit Item D: Cancellation Rules & Invariant Consistency

### Approved Business Rules
- **Customer Cancellation**:
  - `> 24 hours` before appointment start: **10% cancellation fee**, **90% refund**.
  - `≤ 24 hours` before appointment start: **18% cancellation fee**, **82% refund**.
- **Salon Cancellation**:
  - **0% cancellation fee**, **100% full refund**.
- **Refund Expectation**:
  - Approximately **3–5 business days** (operational expectation, not guaranteed settlement).
- **Platform Revenue**:
  - Cancellation fees belong to the BookYourBarber platform, NOT salon revenue.
- **24-Hour Boundary Definition**:
  - In `src/domains/appointments/rules.ts`:
    `hoursRemaining > 24 ? 10 : 18`
    An exact 24h notice (`hoursRemaining === 24.0`) is evaluated as `<= 24h` (18% fee). This rule is consistent with consumer advance-booking policies and is maintained across all services.

### Verification of Consistency
- `src/domains/appointments/rules.ts` acts as the single source of truth for `calculateCancellationFee`.
- Both `AppointmentService.cancelAppointment` and `RefundService.calculateRefundEntitlement` consume `calculateCancellationFee`.
- Both `CancelApptScreen` and customer cancellation review screen consume this exact logic.

---

## 5. Audit Item E: Financial Consistency & Integrity

### Invariants Verified
1. **Source of Truth**: `appointments`, `payments`, `refunds`, `expenses`.
2. **Formula Integrity**:
   - $\text{Operating Result} = \text{Total Collected} - \text{Total Expenses}$
   - $\text{Total Outstanding} = \max(0, \text{Total Charged} - \text{Total Paid})$
   - Refunds are recorded as negative adjustments or separate refund totals; never treated as new sales.
   - Platform cancellation fees are excluded from salon revenue.
3. **Currency Invariant**: All values must format using canonical `formatZAR` (`R180.00`). No raw `$`, `R$`, or unformatted integers.
4. **Decoupled Math**: UI screens consume aggregated metrics from `FinancialService.ts` rather than executing ad-hoc array reducers.
