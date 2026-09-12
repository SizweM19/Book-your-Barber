# BookYourBarber — Payment & Refund Rules Specification

## 1. Explicit Payment State Machine

In accordance with Phase 25, BookYourBarber strictly prohibits single-boolean flags such as `paid = true`. The domain enforces an explicit multi-state lifecycle:

```
[unpaid] ──(partial payment)──> [partial] ──(settle balance)──> [paid]
   │                               │                              │
(gateway fail)              (cancel appt)                  (cancel appt)
   │                               │                              │
   v                               v                              v
[paymentFailed]           [refundProcessing]             [refundProcessing]
                                   │                              │
                            (gateway settle)               (gateway settle)
                                   │                              │
                                   v                              v
                              [refunded]                     [refunded]
```

- **`unpaid`**: Initial state for "Pay at Shop" bookings or pending online checkouts.
- **`partial`**: Partial payment has been received (`0 < totalPaid < totalCharged`), common for deposits or split cash/card payments.
- **`paid`**: Full amount settled (`totalPaid >= totalCharged`).
- **`refundProcessing`**: Cancellation submitted; refund calculation completed and waiting on payment provider settlement.
- **`refunded`**: Net refund amount successfully returned to customer card or bank.
- **`paymentFailed`**: Card declined, insufficient funds, or gateway timeout.

---

## 2. Cancellation Fee Schedule

Cancellation penalties depend on who cancels the appointment and the remaining lead time:

| Cancellation Trigger | Lead Time | Cancellation Penalty Fee | Refund Percentage |
| :--- | :--- | :---: | :---: |
| **Salon-Initiated** | Any time | **0%** | **100%** (Full refund) |
| **Customer-Initiated** | **> 24 hours** before start | **10%** | **90%** of amount paid |
| **Customer-Initiated** | **<= 24 hours** before start | **18%** | **82%** of amount paid |
| **Unpaid Booking** | Any time | **0%** | **0%** (No funds to refund) |

### Implementation Reference
Defined in `src/domains/appointments/rules.ts` via `calculateCancellationFee()`:
```ts
export function calculateCancellationFee(
  amountPaid: number,
  appointmentDateTime: string | Date,
  cancelledBy: 'customer' | 'salon',
  referenceTime: Date = new Date()
): CancellationCalculation
```

---

## 3. Refund Records & Invariants

Every refund creates an immutable audit record in the `refunds` table:
- **`refund_reference`**: Human-readable tracking reference (e.g. `REF-20260910-001`).
- **`original_amount`**: The gross amount paid by the customer.
- **`fee_percent`**: The applied penalty percentage (0%, 10%, or 18%).
- **`fee_amount`**: Retained salon fee in ZAR.
- **`refund_amount`**: Net amount payable to customer (`original_amount - fee_amount`).
- **`cancelled_by`**: Explicit origin (`customer` or `salon`).
- **`status`**: Lifecycle tracker (`requested` → `processing` → `completed` / `failed`).

---

## 4. Payment Gateway Adapter Architecture

Payment provider code is decoupled from core domain services through the `PaymentGatewayAdapter` interface in `src/domains/payments/types.ts`:

- `createPaymentIntent(request)`: Initiates online checkout on South African rails (PayFast, Yoco, PayShap, Ozow).
- `verifyPayment(transactionId)`: Webhook/polling confirmation of gateway settlement.
- `processRefund(request)`: Triggers reverse transaction through the gateway.

In development and offline environments, `MockPaymentAdapter` (`src/domains/payments/adapters.ts`) provides simulated gateway behavior with deterministic transaction IDs without exposing secrets or charging actual bank cards.

