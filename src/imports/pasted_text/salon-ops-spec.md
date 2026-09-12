# BOOKYOURBARBER — SALON OPERATIONS

## FIX, CORRECT, COMPLETE & REFACTOR THE CURRENT IMPLEMENTATION

The current Salon Operations interface has already been implemented.

Do NOT rebuild the product from scratch.

Preserve the existing visual design, components, responsive behavior and working functionality wherever possible.

The objective is to:

1. Correct business-rule inconsistencies
2. Add missing operational states
3. Improve mobile UX
4. Connect the salon experience to the customer-booking experience
5. Ensure payment, booking, refund and notification states are logically separated
6. Refactor the code into maintainable modules

---

# PART 1 — CRITICAL BUSINESS RULE FIXES

## 1. Separate appointment status from payment status

These are two independent state systems.

Appointment status:

BOOKED
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW

Payment status:

UNPAID
PARTIALLY_PAID
PAID
REFUND_PROCESSING
REFUNDED
PAYMENT_FAILED

Never infer appointment status from payment status.

Example:

A customer chooses "Pay at Shop":

Appointment:
CONFIRMED

Payment:
UNPAID

Amount charged:
R150

Amount paid:
R0

Outstanding:
R150

This must be treated as a valid confirmed appointment.

---

# 2. Pay-at-Shop bookings

Ensure every salon screen correctly supports pay-at-shop bookings.

Example:

Customer books:

Haircut
R150
Pay at Shop

Calendar:

CONFIRMED
AMOUNT DUE
R150

Dashboard:

Charged:
R150

Paid:
R0

Outstanding:
R150

Appointment detail:

Payment method:
Pay at Shop

Payment status:
UNPAID

The owner can:

Record payment

After payment:

Paid:
R150

Outstanding:
R0

Payment status:
PAID

Only then should the owner be able to mark the appointment COMPLETED.

---

# 3. Payment recording

Record payment must support:

Cash
Card
Yoco
PayShap
Other

Support partial payment.

Example:

Charged:
R300

Paid:
R100

Outstanding:
R200

After second payment:

Paid:
R300

Outstanding:
R0

Payment status:
PAID

Do not replace payment history with a single "paid" boolean.

Show payment history where useful.

---

# 4. Appointment completion rule

An appointment cannot be marked COMPLETED when:

Outstanding balance > R0

Show:

"Payment required before completing this appointment."

Show the outstanding amount.

CTA:

"Record payment"

When:

Outstanding = R0

allow:

"Complete appointment"

---

# 5. Customer cancellation vs salon cancellation

These must be different workflows.

## Customer cancellation

More than 24 hours:

10% cancellation fee

Less than 24 hours:

18% cancellation fee

Refund:

Booking amount minus applicable cancellation fee

Refund expectation:

3–5 business days

## Salon cancellation

Customer cancellation fee:
R0

Refund:
Full eligible amount

The UI must never accidentally apply the customer cancellation fee to a salon-initiated cancellation.

---

# 6. Cancellation details

When an appointment is cancelled, appointment detail must show:

Cancelled by:
Customer / Salon

Cancellation time

Original amount

Cancellation fee

Refund amount

Refund status

Example:

Booking:
BYB-20260908-00482

Cancelled by:
Customer

Original:
R300

Cancellation fee:
R30

Refund:
R270

Refund status:
Processing

---

# 7. Booking reference

Every appointment must prominently display:

booking_reference

Example:

BYB-20260908-00482

Use this reference consistently across:

Appointment detail
Appointment list
Calendar detail
Payment detail
Refund detail
Customer support
Notifications

Search must support booking references.

Do not use the booking reference as the internal database primary key.

---

# 8. Booking source

Store and display:

ONLINE
QR
MANUAL

Show booking source on:

Appointment detail
Appointment list
Reports where applicable

Do not mix booking source with communication channel or payment method.

---

# PART 2 — NOTIFICATION UX

## 9. Add notification history to appointment detail

Every appointment should show relevant notification status.

Example:

Confirmation
✓ Sent via WhatsApp

Reminder
✓ Sent via WhatsApp

Last sent:
08:00

If failed:

Reminder
⚠ Failed

Reason:
Delivery failed

Do not make notification failure change appointment status.

---

# 10. Show customer's selected reminder channel

Appointment detail must display:

Reminder channel:
WhatsApp

or:

SMS
Email

Do not let the salon change the customer's booking-time selection unless we explicitly support that later.

---

# 11. Notification failures

Dashboard alert:

"1 notification failed"

must link directly to the underlying appointment/notification.

Provide a useful action:

"View notification"

or:

"Retry"

Do not display a dead-end alert.

---

# PART 3 — DASHBOARD

## 12. Dashboard priorities

The dashboard must answer:

"What is happening in my salon today?"

Prioritize:

Today's appointments
Today's amount charged
Today's amount paid
Today's outstanding balance

Then:

Upcoming appointments

Then:

Attention required

Then:

Staff performance

Do not turn the dashboard into an analytics-heavy screen.

---

# 13. Dashboard attention cards must be actionable

Examples:

2 outstanding payments
[View payments]

5 customers at risk
[View customers]

1 notification failed
[View notification]

1 booking conflict
[Resolve conflict]

Every alert must lead somewhere.

---

# 14. Empty dashboard

For a new salon:

"No appointments today"

"Your schedule is clear."

Actions:

"Create appointment"

"Share booking link"

---

# PART 4 — CALENDAR

## 15. Calendar views

Support:

Day
Week

Support:

Shared salon view
Staff-column view

Desktop:

Use staff columns.

Mobile:

Use a clean chronological day agenda.

Do NOT squeeze multiple staff columns into a small phone width.

---

# 16. Current time indicator

On the current day, show a visible current-time indicator.

Example:

14:27
CURRENT TIME

Update it appropriately.

---

# 17. Appointment duration

Appointment cards must visually represent their real duration.

Example:

10:00–11:30

should occupy the appropriate vertical space.

Do not make a 90-minute appointment look like three unrelated appointments.

---

# 18. Calendar availability

Calendar actions must respect:

Staff working hours
Breaks
Schedule exceptions
Existing appointments
Service duration

Do not allow invalid booking times.

---

# 19. Drag-and-drop

Do not implement drag-to-reschedule unless the underlying availability rules are enforced.

If drag-to-reschedule already exists:

Every drop must be validated against:

Working hours
Breaks
Exceptions
Conflicts
Service duration

Invalid drops must be rejected.

---

# 20. Manual booking

The current six-step manual booking flow works functionally, but simplify the visual interaction where possible.

Keep the logical steps:

Customer
Service
Staff
Date
Time
Review

But do NOT force unnecessary page transitions if a modal, drawer, dropdown or inline selection is more efficient.

The internal user is already authenticated and operating the salon.

---

# 21. Duplicate customer detection

When creating a new customer during manual booking:

Check existing customers using phone/email.

If a likely duplicate exists:

"Customer already exists."

Show:

Existing customer information

Actions:

"Use existing customer"

"Create new customer anyway"

Do not create accidental duplicates silently.

---

# 22. Create appointment from customer profile

On the customer profile add:

"New appointment"

This should open the manual booking flow with the customer already selected.

---

# PART 5 — APPOINTMENT DETAILS

## 23. Appointment detail must become the central operational record

Show:

Booking reference
Customer
Phone
Email
Service
Staff
Date
Time
Booking source
Payment method
Amount charged
Amount paid
Outstanding balance
Payment status
Appointment status
Reminder channel
Notification history

Keep this information organised rather than presenting it as a giant wall of text.

---

# 24. Appointment action hierarchy

Primary operational actions:

Record payment
Complete appointment

Secondary:

Reschedule
Cancel

Destructive actions should be visually separated.

---

# 25. No-show

Allow:

"Mark as no-show"

Show a confirmation.

Example:

"Mark this appointment as a no-show?"

The appointment must become:

NO_SHOW

Do not treat a no-show as:

COMPLETED

Do not automatically treat a no-show as successful service revenue.

Do not invent refund behavior for no-shows unless explicitly configured.

For now, preserve the payment/refund state separately and mark the business rule as requiring final definition.

---

# 26. Salon cancellation

When the salon cancels a paid appointment:

Show:

"Cancel appointment?"

Then:

"Customer will receive an eligible full refund."

If applicable, show refund processing status afterward.

Do not show the customer cancellation fee.

---

# PART 6 — RESCHEDULING

## 27. Reschedule flow

Flow:

Appointment
↓
Reschedule
↓
Choose date
↓
Choose available time
↓
Review
↓
Confirm

Re-run availability validation.

---

# 28. Reschedule conflict

If another appointment takes the selected slot:

"That time is no longer available."

Actions:

"Choose another time"

"Choose another date"

The original appointment must remain unchanged until the new slot is successfully confirmed.

---

# PART 7 — CUSTOMERS

## 29. Customer list

Support:

Search
Name
Phone
Email

Filters:

All
New
Returning
Regular
VIP
At Risk
Inactive

---

# 30. Customer profile

Show:

Name
Phone
Email
Gender
Address
Notes

Summary metrics:

Visits
Spend
Last visit
Outstanding balance

Tabs:

History
Payments
Packages
Loyalty
Communications

---

# 31. Customer history

Completed appointments should automatically create historical entries.

Do not require manual history entry.

History should include:

Date
Service
Staff
Amount
Status

---

# 32. Customer payment history

Show payment activity separately from appointment history.

Example:

12 Sep
Payment
R150
Yoco
Successful

---

# PART 8 — STAFF

## 33. Staff profile organization

Do not put every setting into one giant screen.

Use tabs:

Overview
Schedule
Breaks
Exceptions
Services
Performance

---

# 34. Staff performance

Use objective metrics only:

Completed appointments
Revenue generated
Cancelled appointments
No-shows
Customers served

Do NOT invent a generic "performance score" unless an actual calculation has been defined.

---

# PART 9 — SERVICES

## 35. Service management

Show:

Name
Category
Duration
Price
Active/inactive

Actions:

Add
Edit
Deactivate

Service duration must be used by availability calculations.

---

# PART 10 — MOBILE UX

## 36. Mobile dashboard

Do not simply shrink desktop.

Prioritize:

Today's appointments
Revenue summary
Outstanding payments
Quick actions
Attention alerts

---

# 37. Mobile calendar

Use:

Date header
Timeline
Appointment cards

Avoid unreadable multi-column calendars.

---

# 38. Mobile booking creation

For selection-heavy operations, prefer:

Bottom sheets
Drawers
Inline selectors

when appropriate.

Do not unnecessarily navigate through six separate full-screen pages.

---

# PART 11 — PERMISSIONS

## 39. Owner permissions

Salon Owner has full salon-management access.

## 40. Manager permissions

Salon Manager gets only the permissions allowed by the application's permission model.

When access is denied:

"You don't have permission to perform this action."

Do not rely purely on hiding buttons.

Backend authorization must also enforce permissions.

---

# PART 12 — ERROR / EMPTY / LOADING

## 41. Loading

Provide skeleton/loading states for:

Dashboard
Calendar
Appointments
Customers
Staff
Services
Payments

---

# 42. Empty

Provide meaningful empty states for:

No appointments
No customers
No staff
No services
No payments
No expenses

Each should provide a relevant action where possible.

---

# 43. Errors

Examples:

"Unable to load appointments."

"Unable to save this appointment."

"Unable to record payment."

"Unable to reschedule this appointment."

Every error must include a recovery action.

Example:

[Try again]

Never use:

"Something went wrong."

as the only message.

---

# PART 13 — OFFLINE / SYNC PREPARATION

The salon product will eventually support limited offline operation.

For now, ensure the UI can represent:

Online
Offline
Syncing
Synced
Sync failed
Conflict detected

Offline-supported operations:

View today's appointments
View customers
Create appointments

If an offline-created appointment conflicts after synchronization:

Show:

"Appointment conflict detected."

Display both records.

Allow the owner to resolve the conflict.

---

# PART 14 — STALE DATA

If an appointment has been changed elsewhere:

"This appointment has changed."

Action:

"Refresh"

Do not silently overwrite newer server data.

---

# PART 15 — SEARCH

Search must support:

Customer name
Phone
Email
Booking reference

Example:

BYB-20260908-00482

should immediately locate the corresponding booking.

---

# PART 16 — REMOVE PROTOTYPE-ONLY BEHAVIOR

The current:

"⚙️ Salon view / 📱 Customer view"

toggle inside App.tsx is useful for prototyping.

Keep it temporarily for the design/demo environment if needed.

However, mark it as PROTOTYPE ONLY.

The production application must use proper routes such as:

/login
/app
/app/calendar
/app/appointments
/app/customers
/book/[salonSlug]
/admin

Do not make the production navigation depend on a React state toggle.

---

# PART 17 — REFACTOR THE CODE

The current SalonOps.tsx is approximately 1,750 lines.

DO NOT carry this structure into production.

Break it into maintainable modules.

Suggested structure:

src/
├── app/
│   ├── dashboard/
│   ├── calendar/
│   ├── appointments/
│   ├── customers/
│   ├── staff/
│   └── services/
│
├── features/
│   ├── dashboard/
│   ├── calendar/
│   ├── appointments/
│   ├── customers/
│   ├── staff/
│   └── services/
│
├── components/
│   ├── calendar/
│   ├── appointments/
│   ├── customers/
│   ├── payments/
│   └── shared/
│
├── application/
│   ├── booking/
│   ├── appointments/
│   ├── customers/
│   └── payments/
│
├── domains/
│   ├── booking/
│   ├── customers/
│   ├── staff/
│   ├── services/
│   └── payments/
│
└── infrastructure/
└── supabase/

Do not put business rules directly inside React presentation components.

---

# PART 18 — BUSINESS LOGIC SEPARATION

The architecture should follow:

React UI
↓
Application service
↓
Domain/business rules
↓
Repository
↓
Supabase

Examples:

BookingService
AppointmentService
PaymentService
CustomerService
AvailabilityService
NotificationService

The UI must not independently implement:

Payment rules
Cancellation rules
Availability rules
Conflict detection
Refund calculations
Tenant authorization

Those belong in the appropriate application/domain layer.

---

# PART 19 — TYPES AND STATES

Use explicit TypeScript types.

Examples:

AppointmentStatus

PaymentStatus

BookingSource

PaymentMethod

RefundStatus

NotificationStatus

Do not use arbitrary strings throughout the codebase.

Avoid boolean-heavy models such as:

paid = true
cancelled = false

Use explicit domain states.

---

# PART 20 — ACCEPTANCE TESTS

After applying these changes, test the following complete scenarios.

## Test 1 — Online booking

Customer:

Service
Staff
Date
Time
Pay online

Result:

Payment successful
Booking confirmed
Reference generated
Calendar updated
Notification sent

---

## Test 2 — Pay at shop

Customer:

Service
Staff
Date
Time
Pay at shop

Result:

Booking confirmed
Payment status UNPAID
Outstanding amount displayed
Calendar updated

---

## Test 3 — Partial payment

R300 appointment

Pay R100

Result:

Paid R100
Outstanding R200
Cannot complete

Pay remaining R200

Result:

Paid R300
Outstanding R0
Can complete

---

## Test 4 — Customer cancellation >24h

R300 booking

Result:

10% fee
R30 fee
R270 refund
Refund processing state

---

## Test 5 — Customer cancellation <24h

R300 booking

Result:

18% fee
R54 fee
R246 refund
Refund processing state

---

## Test 6 — Salon cancellation

R300 prepaid booking

Result:

No customer cancellation fee
Eligible full refund
Refund processing state

---

## Test 7 — Reschedule conflict

Attempt to reschedule to a slot that becomes unavailable.

Result:

Original booking preserved
New slot rejected
User can choose another slot

---

## Test 8 — Duplicate customer

Create a customer with an existing phone/email.

Result:

Duplicate warning
Use existing customer / create anyway

---

## Test 9 — Notification failure

Booking succeeds.

Notification fails.

Result:

Booking remains confirmed
Notification status = FAILED
Dashboard alert appears

---

## Test 10 — Appointment completion

Outstanding > R0:

Completion blocked.

Outstanding = R0:

Completion allowed.

---

# FINAL REQUIREMENT

Do not invent features.

Do not reintroduce:

3% booking fee
Stripe branding
Walk-ins
Staff login accounts
Customer accounts
Staff ratings
Hard-coded Sunday closures
Commission system
Inventory
Payroll
Marketplace
Multi-location management

The current Salon Operations design is the foundation.

Improve it without destroying the work already completed.

The final result must feel like one coherent BookYourBarber product:

CUSTOMER BOOKS
↓
SALON RECEIVES
↓
CALENDAR UPDATES
↓
PAYMENT TRACKED
↓
APPOINTMENT MANAGED
↓
SERVICE COMPLETED
↓
REVENUE RECORDED
↓
CUSTOMER HISTORY UPDATED
