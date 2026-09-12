# BOOKYOURBARBER — SERVICES, STAFF, AVAILABILITY & SALON SETTINGS

Continue the existing BookYourBarber product design.

Do NOT redesign the current dashboard, calendar or appointment experience.

The current Salon Operations interface is already implemented and refactored into focused modules.

This phase must design the configuration system that powers the booking engine.

The goal is to allow a salon owner/manager to configure:

Services
Staff
Working hours
Breaks
Schedule exceptions
Booking rules
Booking availability
Payment settings
Cancellation settings
Booking link
QR code

The configuration must be simple enough for a small salon or barbershop owner to understand without technical knowledge.

---

# 1. INFORMATION ARCHITECTURE

Inside Settings, organize the product into:

Business
Booking
Services
Staff
Availability
Payments
Notifications
Marketing
Cancellation Policy
Data
Subscription

Do not create unnecessary settings pages.

---

# 2. SERVICES MANAGEMENT

Create a Services page.

Example:

Haircuts

* Haircut — 30 min — R150
* Fade — 45 min — R200

Beard

* Beard Trim — 20 min — R80

Shaving

* Full Shave — 30 min — R120

Combos

* Hair + Beard — 50 min — R220

Every service should display:

Name
Category
Duration
Price
Status

Status:

Active
Inactive

Actions:

Add service
Edit
Deactivate
Reactivate

---

# 3. ADD SERVICE

Create a simple form.

Fields:

Service name
Category
Duration
Price

Example:

Name:
Haircut

Category:
Haircuts

Duration:
30 minutes

Price:
R150

CTA:

Save service

Secondary:

Cancel

---

# 4. EDIT SERVICE

Allow owner/manager to change:

Name
Category
Duration
Price
Active status

Show a warning when changing important values that can affect future bookings.

Do not change historical appointment prices automatically.

Historical appointments must preserve the price that applied at the time of booking.

---

# 5. SERVICE DEACTIVATION

When a service is deactivated:

Existing appointments remain unchanged.

New customers cannot book the service.

Existing future appointments using the service remain visible.

Show confirmation:

"Deactivate Haircut?"

"This service will no longer be available for new bookings."

Actions:

Deactivate
Cancel

---

# 6. SERVICE EMPTY STATE

"No services yet."

"Add your first service so customers can start booking."

CTA:

"Add service"

---

# 7. STAFF MANAGEMENT

Create Staff page.

Example:

Thabo
Barber
Active

Sanele
Barber
Active

Show:

Name
Phone
Role/type
Status

Actions:

Add staff
Edit
Deactivate

Do NOT create staff login management.

Staff are records only in this version.

---

# 8. ADD STAFF

Fields:

Name
Phone
Role/type

Example:

Name:
Thabo

Phone:
+27 XX XXX XXXX

Role:
Barber

CTA:

Add staff

---

# 9. STAFF DETAIL

Create tabs:

Overview
Schedule
Breaks
Exceptions
Services
Performance

---

# 10. STAFF OVERVIEW

Show:

Name
Phone
Role
Active status

Summary:

Appointments completed
Revenue generated
Customers served
Cancelled appointments
No-shows

Do NOT create unexplained performance scores.

---

# 11. STAFF SERVICES

Allow the salon to indicate which services a staff member can perform.

Example:

Thabo

✓ Haircut
✓ Beard
✓ Shave
□ Colour

This must affect availability.

If Thabo cannot perform Hair Colour, Thabo must not be automatically assigned to a Hair Colour booking.

---

# 12. WORKING HOURS

Create a weekly schedule editor.

Example:

Monday
08:00 — 17:00

Tuesday
08:00 — 17:00

Wednesday
OFF

Thursday
08:00 — 17:00

Friday
08:00 — 17:00

Saturday
08:00 — 14:00

Sunday
OFF

Use a clear enabled/disabled control for each day.

DO NOT hard-code Sunday as closed.

The booking engine must use the configured schedule.

---

# 13. MULTIPLE WORK PERIODS

Support future flexibility for days with split schedules.

Example:

Monday

08:00–12:00
14:00–18:00

The interface can initially keep this feature visually simple.

---

# 14. BREAKS

Create a dedicated Breaks configuration.

Example:

Lunch
12:00–13:00

Allow adding multiple breaks.

Example:

Lunch
Tea break

Breaks must block appointment availability.

---

# 15. SCHEDULE EXCEPTIONS

Create a dedicated Exceptions page.

Allow:

Full day OFF

or:

Custom working hours

Examples:

25 September
OFF

27 September
12:00–16:00

Exceptions override recurring schedules.

---

# 16. EXCEPTION CREATION

Fields:

Date
Exception type

Options:

Closed
Custom hours

If custom hours:

Start time
End time

CTA:

Save exception

---

# 17. AVAILABILITY PREVIEW

This is extremely important.

Create a visual preview showing what customers can actually book.

Example:

Staff:
Thabo

Service:
Haircut

Date:
12 September

Available:

09:00
09:30
10:00
11:00
13:00
13:30

Unavailable:

10:30
11:30
12:00
12:30

Show an explanation when a slot is unavailable where useful:

Break
Outside working hours
Already booked
Exception

The salon owner should be able to understand why a time is unavailable.

---

# 18. AVAILABILITY ENGINE VISUAL MODEL

Make the settings experience reflect this logic:

STAFF
+
SERVICE
+
WORKING HOURS
+
BREAKS
+
EXCEPTIONS
+
EXISTING APPOINTMENTS
+
BOOKING RULES
↓
AVAILABLE TIME SLOTS

Do not expose technical terminology such as "availability engine" to normal salon users.

Use plain language such as:

"Available appointment times"

---

# 19. BOOKING RULES

Create a Booking Settings page.

Settings should include:

Online booking:
ON / OFF

Maximum booking advance:
Configurable

Minimum booking notice:
Configurable

Customer can choose staff:
ON

Allow "Any Available":
ON

Staff assignment strategy:
Salon configurable

Payment requirement:
Full payment for online booking

Pay at shop:
Enabled/disabled according to product configuration

---

# 20. ASSIGNMENT STRATEGY

Create a salon setting:

"When a customer selects Any Available, how should we assign the appointment?"

Options can include:

First available
Least busy
Round robin

The interface should explain each option briefly.

Do not expose algorithmic technical terminology.

---

# 21. BOOKING PREVIEW

Allow the owner to preview their public booking experience.

CTA:

"Preview booking page"

This should open the same public booking experience already designed for customers.

---

# 22. BOOKING LINK

Create a section:

"Your booking link"

Example:

bookyourbarber.co.za/book/sanele-cuts

Actions:

Copy link
Open booking page
Share

---

# 23. QR CODE

Create:

"Your booking QR code"

Show a QR preview.

Actions:

Download QR code
Print QR code

The QR code should lead directly to the salon booking page.

Do not make customers log in.

---

# 24. BOOKING PAGE PREVIEW

Show the owner how customers see:

Salon name
Logo
Services
Staff
Available times
Booking process

CTA:

"Open customer view"

---

# 25. PAYMENT SETTINGS

Create a payment configuration page.

Keep the interface provider-neutral.

Do not hard-code Stripe.

Do not hard-code PayFast.

Do not hard-code Yoco into the visual structure.

Use:

"Payment provider"

"Connect payment provider"

The underlying application will use a provider abstraction.

---

# 26. ONLINE PAYMENT SETTING

Explain:

"Customers who choose Pay Online must pay the full booking amount before their appointment is confirmed."

Show:

Full payment required

This is not optional for online payment in the current product model.

---

# 27. PAY-AT-SHOP SETTING

Allow the salon to control whether Pay at Shop is available.

If enabled:

Customers can choose Pay at Shop during booking.

If disabled:

Only Pay Online is shown.

The system should clearly explain:

"Customers won't be charged online when they choose Pay at Shop."

---

# 28. CANCELLATION POLICY SETTINGS

Create a clear policy display.

Platform-controlled policy:

More than 24 hours:
10% cancellation fee

Less than 24 hours:
18% cancellation fee

Refund processing:
Typically 3–5 business days depending on payment provider.

Do not make the salon edit these percentages in the initial UI.

The platform controls this policy.

---

# 29. CUSTOMER CANCELLATION VS SALON CANCELLATION

Make the distinction clear.

Customer cancellation:

Applicable cancellation fee
Refund after fee

Salon cancellation:

No customer cancellation fee
Eligible full refund

Do not combine these into one confusing setting.

---

# 30. AVAILABILITY TESTER

Create an admin-style tool within salon settings:

"Check availability"

Inputs:

Service
Staff
Date

Output:

Available times

This lets a salon owner verify their setup without pretending to be a customer.

---

# 31. CONFIGURATION WARNINGS

The system should proactively detect configuration problems.

Examples:

"No active services."

"Staff has no working hours."

"Staff has no services assigned."

"Salon is closed every day."

"Online booking is enabled but no payment provider is connected."

Show the correct action.

Example:

"No active services."

[Add service]

---

# 32. CONFIGURATION COMPLETENESS

Create a small onboarding/configuration checklist.

Example:

Salon profile ✓
Services ✓
Staff ✓
Working hours ✓
Payment setup ✓
Booking settings ✓

If incomplete:

"Your booking page isn't ready yet."

Show what must be completed.

---

# 33. UNSAVED CHANGES

For all configuration forms:

If user changes data and navigates away:

"Unsaved changes"

Actions:

Save changes
Discard
Stay

---

# 34. LOADING STATES

Create loading states for:

Services
Staff
Schedules
Breaks
Exceptions
Availability
Payment settings
Booking settings

---

# 35. ERROR STATES

Examples:

Unable to save service.

Unable to update staff schedule.

Unable to calculate availability.

Unable to save booking settings.

Unable to connect payment provider.

Each error must include a recovery action.

Example:

"Unable to save staff schedule."

[Try again]

---

# 36. RESPONSIVE DESIGN

Design every screen for:

Mobile
Tablet
Desktop

Desktop:

Efficient forms and tables.

Mobile:

Use stacked cards, drawers and bottom sheets where appropriate.

Do not simply compress the desktop layout.

---

# 37. MOBILE STAFF SCHEDULE

On mobile, use:

Day selector
Working hours card
Break cards
Exception cards

Do not display a huge desktop spreadsheet.

---

# 38. MOBILE SERVICES

Use service cards:

Haircut
30 min
R150
Active

Actions:

Edit
Deactivate

---

# 39. MOBILE AVAILABILITY PREVIEW

Use a simple vertical time list:

09:00 Available
09:30 Available
10:00 Booked
10:30 Break
11:00 Available

Do not force a dense calendar grid onto mobile.

---

# 40. SUCCESS STATES

Examples:

"Service saved."

"Staff member added."

"Working hours updated."

"Break added."

"Schedule exception saved."

"Booking settings updated."

"Payment provider connected."

---

# 41. PERMISSION STATES

Salon Owner:

Full settings access.

Salon Manager:

Only settings they have permission to manage.

If blocked:

"You don't have permission to change this setting."

---

# 42. IMPORTANT PRODUCT RULES

Do not introduce:

Staff login accounts
Customer accounts
Walk-ins
Multi-location
Inventory
Payroll
Commissions
Marketplace
Customer ratings
Hard-coded Sunday closure
Stripe branding
3% booking fee

The existing product decisions remain authoritative.

---

# 43. DESIGN GOAL

This section of the application should make the salon owner feel:

"I can configure this once, and BookYourBarber will take care of the booking logic."

The owner should be able to understand:

Who works here?
What services do we offer?
When does each person work?
When are their breaks?
When are they unavailable?
What can customers book?
How far ahead can they book?
How much must they pay?
Where is my booking link?

All without seeing technical implementation details.

---

# 44. FINAL OUTPUT

Create high-fidelity responsive designs for:

1. Services list
2. Add service
3. Edit service
4. Service deactivation
5. Staff list
6. Add staff
7. Staff profile
8. Staff schedule
9. Staff breaks
10. Schedule exceptions
11. Staff services
12. Availability preview
13. Booking settings
14. Assignment strategy
15. Booking link
16. QR code
17. Booking page preview
18. Payment settings
19. Cancellation policy display
20. Availability tester
21. Configuration checklist
22. Loading states
23. Error states
24. Empty states
25. Permission states
26. Mobile layouts
27. Desktop layouts

The final design must connect seamlessly to the existing:

Dashboard
Calendar
Appointments
Customers

experience.

The configuration system powers the public customer booking flow.

Services + Staff + Schedules + Breaks + Exceptions + Booking Rules must ultimately determine the available appointment slots shown to customers.
