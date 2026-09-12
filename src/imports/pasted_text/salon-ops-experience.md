# BOOKYOURBARBER — SALON OPERATIONS EXPERIENCE

Continue the existing BookYourBarber design.

Do NOT redesign the visual language from scratch.

Use the established BookYourBarber design system:

* DM Sans typography
* Near-black primary actions
* Emerald for success
* Amber for warnings
* Red for destructive/error states
* Warm light-gray application background
* White surfaces
* Clean, premium, modern appearance
* Mobile-first responsive design
* Minimal visual clutter
* Clear hierarchy
* Large touch targets
* Professional but approachable

The goal of this phase is to design the salon/barbershop operational experience after a customer creates a booking.

The most important question the interface must answer is:

"What is happening in my business today?"

---

# 1. USERS

Design for:

## Salon Owner

Full access to salon operations.

## Salon Manager

Operational access according to permissions.

Staff do NOT have login accounts in the first version.

Staff are records used for appointments, schedules and performance.

---

# 2. SALON APPLICATION NAVIGATION

Desktop navigation:

Dashboard
Calendar
Appointments
Customers
Services
Staff
Packages
Loyalty
Retention
Payments
Expenses
Reports
Marketing
Notifications
Settings
Subscription

Mobile navigation:

Home
Calendar
Bookings
Customers
More

The More menu contains secondary functionality.

Do not put the entire desktop navigation into mobile bottom navigation.

---

# 3. DASHBOARD

Create the main salon dashboard.

The dashboard should be action-oriented, not an analytics wall.

Top section:

"Good morning, Sanele"

Show today's key metrics:

Today's appointments
Today's amount charged
Today's amount paid
Today's outstanding amount

Example:

12 Appointments
R1,850 Charged
R1,450 Paid
R400 Outstanding

Then:

## Upcoming appointments

09:00 — Thabo — Haircut
10:00 — Lerato — Haircut
11:30 — Sanele — Beard

Each appointment should be tappable/clickable.

Then:

## Attention required

Examples:

5 customers at risk
2 outstanding payments
1 notification failed
1 appointment conflict

Each alert should lead directly to the relevant screen.

Then:

## Staff performance

Example:

Thabo
R600

Sanele
R450

Lerato
R800

Keep this section visually compact.

---

# 4. DASHBOARD QUICK ACTIONS

Provide prominent quick actions:

New appointment
View calendar
Add customer
Add service

The most important CTA should be:

"New appointment"

Do not add unnecessary actions.

---

# 5. DASHBOARD EMPTY STATE

For a new salon with no bookings:

"No appointments today"

"Your schedule is clear."

Primary CTA:

"Create appointment"

Secondary:

"Share booking link"

---

# 6. CALENDAR — MAIN EXPERIENCE

Create the salon calendar.

Support:

Day
Week

Support two views:

Shared salon schedule
Staff-column schedule

Desktop staff-column example:

```
                THABO     SANELE     LERATO
```

09:00                Booking    —         Booking
10:00                Booking   Booking     —
11:00                  —        Booking   Booking
12:00                BREAK      Booking     —
13:00                Booking      —       Booking

Use appointment cards rather than simply coloured blocks.

---

# 7. CALENDAR HEADER

Show:

Today
Previous
Next
Date
Day / Week selector

Filters:

All staff
Individual staff member

Optional filter:

Appointment status

Do not overload the header.

---

# 8. APPOINTMENT CARD

Each appointment should show:

Time
Customer
Service
Staff
Payment status

Example:

14:00

Lerato M.
Haircut
Sanele

PAID

Use clear status badges.

---

# 9. APPOINTMENT STATUS

Support:

BOOKED
CONFIRMED
COMPLETED
CANCELLED
NO-SHOW

The UI should visually distinguish these without relying only on colour.

Use text/icon/status indicators.

---

# 10. PAYMENT STATUS

Support:

UNPAID
PARTIALLY PAID
PAID
REFUND PROCESSING
REFUNDED

Use clear badges.

---

# 11. CREATE MANUAL APPOINTMENT

Create a manual booking flow for salon owner/manager.

Flow:

New appointment
↓
Customer
↓
Service
↓
Staff
↓
Date
↓
Time
↓
Review
↓
Create

Booking source should be:

MANUAL

The salon may select:

Specific staff

OR

Any available

If Any Available is selected, use the salon's configured assignment rule.

---

# 12. CREATE CUSTOMER DURING BOOKING

Do not force the user to leave the booking flow.

If customer does not exist:

"Create customer"

Fields:

Name
Phone
Email

Then continue creating the appointment.

---

# 13. CUSTOMER SEARCH DURING MANUAL BOOKING

When selecting customer:

Provide:

Search by name
Search by phone
Search by email

Show existing customers immediately.

Provide:

"+ New customer"

---

# 14. AVAILABILITY

The calendar and booking flow must respect:

Staff working hours
Breaks
Schedule exceptions
Existing appointments
Service duration

Never allow the user to select an unavailable slot.

---

# 15. CREATE BOOKING — CONFLICT

If the selected time becomes unavailable:

"This appointment time is no longer available."

Actions:

"Choose another time"

"Choose another staff member"

Do not silently move the booking.

---

# 16. APPOINTMENT DETAILS

Create the main appointment detail screen.

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
Amount charged
Amount paid
Outstanding amount
Payment status
Appointment status

Example:

BYB-20260908-00482

Lerato M.

Haircut

Sanele

12 September 2026
14:00

Charged:
R150

Paid:
R150

Outstanding:
R0

PAID
CONFIRMED

---

# 17. APPOINTMENT ACTIONS

Actions:

Reschedule
Cancel
Record payment
Complete appointment

Actions should be permission-aware.

---

# 18. RECORD PAYMENT

Create a payment recording modal/page.

Show:

Amount charged
Already paid
Outstanding

Example:

Amount charged:
R300

Paid:
R200

Outstanding:
R100

CTA:

"Record payment"

Methods:

Cash
Card
Yoco
PayShap
Other

Allow partial payment.

---

# 19. FULL PAYMENT

After recording payment:

Amount charged:
R300

Paid:
R300

Outstanding:
R0

Payment status:

PAID

The appointment may now be completed.

---

# 20. BLOCK APPOINTMENT COMPLETION

If outstanding balance > R0:

Display:

"Payment required before completing this appointment."

Show:

Outstanding:
R50

CTA:

"Record payment"

Do not allow completion until outstanding balance is R0.

---

# 21. COMPLETE APPOINTMENT

When payment is fully settled:

Show confirmation:

"Complete appointment?"

Customer:
Lerato M.

Service:
Haircut

Payment:
Paid

Then:

"Complete appointment"

After completion:

Appointment status:
COMPLETED

---

# 22. COMPLETED APPOINTMENT

After completion, update:

Customer history
Visit count
Last visit
Revenue
Retention metrics
Loyalty points
Package usage where applicable

Do not visually overwhelm the user with technical details.

---

# 23. RESCHEDULE APPOINTMENT

Owner/manager selects:

Reschedule

Then:

Choose date
Choose available time
Review
Confirm

The availability engine must run again.

---

# 24. RESCHEDULE SUCCESS

Show:

"Appointment updated."

Show:

New date
New time
Service
Staff
Customer
Booking reference

Show notification status if applicable.

---

# 25. RESCHEDULE FAILURE

If no longer available:

"This time is no longer available."

Actions:

"Choose another time"
"Choose another date"

The existing appointment remains unchanged until the new appointment is successfully confirmed.

---

# 26. SALON CANCELLATION

Design the owner cancellation flow.

Show:

Cancel appointment?

Booking reference

Customer
Service
Date
Time

The owner must confirm.

Clearly communicate the consequence.

Do not apply the customer cancellation fee to a salon-initiated cancellation.

If the booking was prepaid online, initiate the appropriate refund workflow.

---

# 27. CUSTOMER ARRIVAL / APPOINTMENT IN PROGRESS

Do not create unnecessary complexity.

Provide an optional status:

IN PROGRESS

This may be a simple action from the appointment detail screen.

---

# 28. NO-SHOW

Allow the owner/manager to mark an appointment:

NO-SHOW

Show confirmation before applying.

Example:

"Mark this customer as a no-show?"

The appointment must not count as a completed appointment.

Do not count a no-show as completed revenue.

---

# 29. APPOINTMENTS LIST

Create a dedicated appointments screen.

Show:

Today
Upcoming
Past
Cancelled
No-show

Each row/card:

Booking reference
Customer
Service
Staff
Date/time
Payment status
Appointment status

Provide search and filters.

---

# 30. CUSTOMER LINK

Clicking a customer from an appointment should open the customer profile.

Do not duplicate customer information management in appointment screens.

---

# 31. CUSTOMER PROFILE

Create:

Customer name
Phone
Email
Gender
Address
Notes

Then tabs:

History
Payments
Packages
Loyalty
Communications

History should show:

Date
Service
Staff
Amount
Status

---

# 32. STAFF MANAGEMENT

Create staff list.

Example:

Thabo
Barber
Active

Sanele
Barber
Active

Actions:

Add staff
Edit
Deactivate

Do not add staff login management.

---

# 33. STAFF PROFILE

Show:

Name
Phone
Role/type
Active status

Tabs:

Services
Working hours
Breaks
Schedule exceptions
Performance

---

# 34. STAFF WORKING HOURS

Create weekly schedule configuration.

Example:

Monday
08:00–17:00

Tuesday
08:00–17:00

Wednesday
OFF

Thursday
08:00–17:00

Friday
08:00–17:00

Saturday
08:00–14:00

Sunday
OFF

Do not hard-code Sunday or any other day as closed.

---

# 35. STAFF BREAKS

Example:

Lunch
12:00–13:00

Allow multiple breaks where needed.

---

# 36. STAFF SCHEDULE EXCEPTIONS

Allow:

Day off
Custom working hours

Example:

25 September
OFF

or:

27 September
12:00–16:00

---

# 37. SERVICES

Service management:

Haircut
30 minutes
R150

Beard
20 minutes
R80

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

---

# 38. CUSTOMER HISTORY

The customer profile should automatically reflect completed appointments.

Example:

12 Sep
Haircut
R150
Completed

15 Aug
Beard
R80
Completed

Do not require the owner to manually enter history.

---

# 39. DASHBOARD ALERTS

Support alerts for:

Outstanding payments
At-risk customers
Failed notifications
Booking conflicts
Subscription problems

Each alert should lead to an action.

---

# 40. SEARCH

Global or contextual search should support:

Customer name
Phone
Email
Booking reference

Booking references such as:

BYB-20260908-00482

must be searchable.

---

# 41. MOBILE DASHBOARD

Create a genuine mobile layout.

Do not simply shrink the desktop dashboard.

Prioritize:

Today's appointments
Upcoming appointments
Outstanding payments
Quick actions

Cards should stack vertically.

---

# 42. MOBILE CALENDAR

Provide a usable mobile calendar.

Prioritize:

Date
Time
Staff
Appointment

The user should be able to tap an appointment and reach its details quickly.

---

# 43. RESPONSIVE BEHAVIOUR

Design:

Mobile
Tablet
Desktop

Desktop:
Use multi-column calendar where appropriate.

Mobile:
Use a compact timeline/day agenda.

Do not force an unreadable staff-column calendar onto a 390px screen.

---

# 44. LOADING STATES

Create loading states for:

Dashboard
Calendar
Appointments
Customers
Staff
Services
Payments

Use skeleton layouts rather than blank screens.

---

# 45. EMPTY STATES

Create meaningful empty states:

No appointments
No customers
No staff
No services
No payments
No expenses

Each should have an appropriate CTA.

---

# 46. ERROR STATES

Create:

Calendar loading error
Appointment creation error
Payment recording error
Reschedule error
Customer loading error
Network error

Use direct copy and recovery actions.

Avoid generic:

"Something went wrong."

Instead:

"Unable to save this appointment."

[Try again]

---

# 47. PERMISSION STATES

Salon Owner:

Full salon management.

Salon Manager:

Operational access according to configured permissions.

Do not expose platform administration functionality in the salon application.

---

# 48. PLATFORM/SALON SEPARATION

The salon application should never visually look like the BookYourBarber Platform Admin application.

Salon interface:

Business-focused
Simple
Operational

Platform interface:

Administrative
System-focused
Monitoring-oriented

---

# 49. CORE DASHBOARD UX RULE

The owner should understand the business in under 10 seconds.

At the top of the dashboard:

Appointments
Charged
Paid
Outstanding

Then:

Upcoming

Then:

Attention

Then:

Staff performance

Everything else is secondary.

---

# 50. FINAL DESIGN OUTPUT

Produce a high-fidelity responsive BookYourBarber salon operations interface covering:

1. Dashboard
2. Calendar day
3. Calendar week
4. Appointment list
5. Appointment details
6. Create appointment
7. Record payment
8. Complete appointment
9. Reschedule
10. Cancel appointment
11. Customers
12. Customer profile
13. Staff
14. Staff profile
15. Working hours
16. Breaks
17. Schedule exceptions
18. Services
19. Empty states
20. Loading states
21. Error states
22. Permission states
23. Mobile layouts
24. Desktop layouts

The interface should clearly connect with the already-designed customer booking experience.

A customer's successful online booking should immediately appear as an appointment in the salon calendar and appointment list.

The entire experience should communicate:

BOOK
→ ORGANISE
→ MANAGE
→ GET PAID
→ COMPLETE

Do not add inventory, payroll, full accounting, staff login accounts, walk-ins, multi-location management, customer accounts, commissions, marketplace features or other functionality that is outside the current MVP.
