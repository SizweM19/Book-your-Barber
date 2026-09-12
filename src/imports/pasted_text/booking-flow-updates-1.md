# BOOKYOURBARBER — CUSTOMER BOOKING FLOW

## FIXES, CORRECTIONS & REQUIRED UX UPDATES

Update the existing BookYourBarber customer booking flow.

Do NOT redesign the product from scratch.

Preserve the current visual language, component system, mobile-first structure, typography and overall quality where they are already working well.

The goal is to correct product inconsistencies, remove invented features, and add the missing states required for a production-ready booking experience.

---

# 1. REMOVE UNAPPROVED 3% BOOKING FEE

The current design includes a "3% booking fee".

REMOVE THIS ENTIRELY.

The product specification does NOT currently define a 3% booking fee.

For now:

ONLINE PAYMENT:

Service price
= Customer total

PAY AT SHOP:

Service price
= Amount due at shop

Do not display:

"3% booking fee"

"Booking fee"

or any additional platform fee during normal booking.

IMPORTANT:

The platform's cancellation fee is separate.

Cancellation policy:

More than 24 hours before appointment:
10% cancellation fee

Less than 24 hours before appointment:
18% cancellation fee

These cancellation fees apply only when a customer cancels a paid booking.

---

# 2. REMOVE STRIPE-SPECIFIC UI

The current design contains a Stripe security badge.

REMOVE Stripe branding.

BookYourBarber has NOT selected Stripe as the final payment provider.

The architecture must remain payment-provider neutral.

Replace Stripe-specific language with neutral language such as:

"Secure payment"

"Securely processed payment"

Do not show logos or branding for Stripe, PayFast, Yoco or another provider unless explicitly configured later.

The final product will use a payment abstraction that can support providers such as PayFast, Yoco and future providers.

---

# 3. KEEP THE TWO PAYMENT OPTIONS

The existing two-card payment selector is correct and should remain:

PAY ONLINE

PAY AT SHOP

## Pay Online

Show:

Service
Staff
Date
Time
Total

Primary CTA:

"Pay now"

Online booking requires FULL PAYMENT.

The booking is only confirmed after payment has been successfully verified.

## Pay at Shop

Show:

Amount due at shop

No money is collected online.

Show an informative message:

"No payment is required now. You'll pay at the salon/barbershop."

Primary CTA:

"Confirm booking"

The booking is confirmed immediately when the salon allows pay-at-shop bookings.

Do not describe pay-at-shop as a failed or incomplete booking.

It is a valid booking method.

---

# 4. ADD PAYMENT METHOD STATE

Create a clear payment method step before final payment.

Customer chooses:

○ Pay online

○ Pay at shop

For Pay Online:
Continue to secure payment.

For Pay at Shop:
Continue directly to booking confirmation.

The selected method must appear on the booking summary and confirmation.

---

# 5. ADD TEMPORARY SLOT HOLD STATE

When a customer chooses an online-payment appointment slot, temporarily reserve the slot while payment is being completed.

Add a visible countdown.

Example:

"Your appointment is reserved for 09:42"

Show a countdown timer.

When the timer expires:

"Your appointment hold has expired."

"This time is no longer reserved."

Actions:

"Choose another time"

"Choose another date"

Do not allow the customer to continue paying for an expired slot.

---

# 6. ADD SLOT-UNAVAILABLE RECOVERY

The system must handle a slot becoming unavailable after the customer selected it.

Example:

Customer selected:
14:00

Before payment completes, another booking takes the slot.

Display:

"This appointment time is no longer available."

"Please choose another time."

Actions:

"Choose another time"

"Choose another date"

Do not silently move the customer to another time.

---

# 7. ADD FULLY BOOKED DAY STATE

Create a complete empty state for a date with no available appointments.

Example:

"No appointments available"

"There are no available times on this date."

Actions:

"Choose another date"

"Choose another staff member"

Make this visually calm and informative rather than looking like an error.

---

# 8. ADD STAFF-UNAVAILABLE STATE

If the customer has selected a specific staff member and that person has no available times for the selected date:

Show:

"[Staff name] isn't available on this date."

Actions:

"Choose another staff member"

"Choose another date"

Do not show an empty time-slot grid.

---

# 9. ADD SERVICE-UNAVAILABLE STATE

If a service becomes unavailable after the customer began booking:

Show:

"This service is currently unavailable."

Action:

"Choose another service"

Return the customer safely to service selection.

---

# 10. ADD SALON BOOKING UNAVAILABLE STATE

Create a separate state for when online booking is disabled or temporarily unavailable.

Show:

"Online booking is currently unavailable."

Optional supporting copy:

"Please try again later or contact the salon directly."

Actions:

"Try again"

"Contact salon"

This is different from a normal closed day.

---

# 11. FIX CALENDAR LOGIC

DO NOT hard-code Sundays as unavailable.

The availability shown to customers must be generated from the salon's actual schedule.

Availability is based on:

Salon working hours
Staff working hours
Breaks
Schedule exceptions
Existing appointments
Service duration
Booking rules

A Sunday can be bookable when the salon/staff actually works Sunday.

---

# 12. ADD MINIMUM BOOKING NOTICE SUPPORT

The booking interface should support a configurable minimum booking notice.

Example:

"Bookings must be made at least 30 minutes in advance."

The UI should never expose unavailable last-minute slots without explanation.

Design the interface so the rule can be changed later.

Do not hard-code a specific number into the visual system.

---

# 13. ADD MAXIMUM ADVANCE BOOKING SUPPORT

The salon may eventually configure how far ahead customers can book.

Example:

30 days
60 days
90 days

Design the calendar so unavailable future dates can be presented cleanly without appearing broken.

Do not hard-code a specific number.

---

# 14. CUSTOMER INFORMATION

Required fields remain:

Full name
Phone
Email

Keep the current clean mobile-first form.

Phone should use the South African +27 format.

Keep live validation.

Do not add unnecessary fields to the booking funnel.

---

# 15. COMMUNICATION CHANNEL

The customer selects how they want to receive booking reminders.

Show:

○ WhatsApp
○ SMS
○ Email

Do NOT require customers to create an account.

Do NOT require a permanent communication preference.

The customer can choose the channel for the booking.

---

# 16. SEPARATE TRANSACTIONAL AND MARKETING COMMUNICATION

Do not combine marketing consent with the normal booking confirmation.

Transactional communication includes:

Booking confirmation
Appointment reminder
Reschedule notification
Cancellation notification
Payment confirmation
Refund notification

Marketing communication includes:

Promotions
Birthday messages
Win-back campaigns
Loyalty promotions

Marketing consent must be separate and optional.

Do not make marketing consent a hidden requirement for completing a booking.

---

# 17. ADD PAYMENT SUCCESS / BOOKING PROCESSING STATE

Create a state for:

PAYMENT SUCCESSFUL
BUT
BOOKING CONFIRMATION STILL PROCESSING

Example:

"Payment received"

"We're completing your booking."

"Please don't close this page."

Show a loading state while the booking is reconciled.

Do NOT show "Payment failed" because the payment succeeded.

---

# 18. ADD PAYMENT DUPLICATION PROTECTION STATE

If the customer taps Pay Now multiple times:

Show:

"Payment already processing."

"Please don't refresh or close this page."

Disable duplicate payment actions while the transaction is processing.

---

# 19. ADD BROWSER-CLOSED / PAYMENT-RECOVERY EXPERIENCE

The booking system must support recovery when:

Customer pays successfully
↓
Browser closes or crashes
↓
Customer returns later

The customer should be able to use:

Booking reference
+
Phone or email

to retrieve the booking.

---

# 20. ADD BOOKING LOOKUP

Create a dedicated customer screen:

"Find my booking"

Fields:

Booking reference
Phone or email

CTA:

"Find booking"

The customer does NOT need an account.

---

# 21. BOOKING DETAILS SCREEN

After lookup show:

Booking reference
Salon
Service
Staff
Date
Time
Location
Payment status
Booking status

Actions:

"Reschedule"

"Cancel"

"Add to calendar"

"Contact salon"

The booking reference should be highly visible.

---

# 22. ADD RESCHEDULE SUCCESS STATE

After a successful reschedule:

"Booking updated"

Show:

New date
New time
Staff
Service
Booking reference

Confirm that the customer will receive an updated notification.

---

# 23. ADD RESCHEDULE FAILURE STATE

If the selected slot becomes unavailable:

"That time is no longer available."

Actions:

"Choose another time"

"Choose another date"

Do not lose the existing booking.

The original appointment remains valid until the new time is successfully confirmed.

---

# 24. CANCELLATION REVIEW SCREEN

Before final cancellation, show a complete calculation.

For more than 24 hours before appointment:

Cancellation fee:
10%

For less than 24 hours:

Cancellation fee:
18%

Show:

Original booking amount
Cancellation fee
Refund amount
Estimated refund processing time

Example:

Booking amount: R300
Cancellation fee: R30
Refund: R270

Estimated refund processing:
3–5 business days

Primary CTA:

"Confirm cancellation"

Secondary CTA:

"Keep booking"

---

# 25. CANCELLATION CONFIRMATION

After cancellation:

"Booking cancelled"

Show:

Booking reference
Cancellation fee
Refund amount
Refund status

Example:

"Refund processing"

"Please allow 3–5 business days for the refund to reflect."

Do not present the 10%/18% cancellation charge as a generic booking fee.

It only exists because the customer cancelled.

---

# 26. ADD SALON-CANCELLED FLOW

Create a separate flow for when the salon cancels a paid appointment.

The customer should NOT be charged the customer cancellation fee.

Show:

"The salon cancelled your appointment."

Display:

Booking reference
Appointment details
Full refund amount
Refund status
Estimated processing time

Example:

"Your full refund has been initiated."

Do not reuse the customer cancellation UX.

---

# 27. REFUND STATES

Create these states:

REFUND REQUESTED
REFUND PROCESSING
REFUND COMPLETED
REFUND FAILED

Refund processing:

"Your refund is being processed."

Refund completed:

"Refund completed."

Refund failed:

"We couldn't complete your refund."

"Please contact BookYourBarber support."

Always show the booking reference.

---

# 28. NOTIFICATION DELIVERY FAILURE

A booking can remain confirmed even when a notification fails.

For example:

Booking confirmed
WhatsApp delivery failed

Show:

"Your booking is confirmed."

"We couldn't send the confirmation through WhatsApp."

Show the booking reference prominently.

Do NOT change the booking status to failed.

---

# 29. ADD ADDRESS / LOCATION TO CONFIRMATION

The final confirmation should include:

Salon name
Address
Service
Staff
Date
Time
Payment status
Booking reference

Add:

"Get directions"

This is important because convenience is one of the core product promises.

---

# 30. ADD CALENDAR SUCCESS / FAILURE STATES

After "Add to calendar":

Success:

"Added to your calendar."

Failure:

"We couldn't add the appointment automatically."

Provide a fallback option such as:

"Download calendar file"

when technically supported.

---

# 31. BOOKING REFERENCE DESIGN

Continue using the human-readable format:

BYB-YYYYMMDD-XXXXX

Example:

BYB-20260908-00482

Display it in a visually prominent way.

Include:

Copy button

"Booking reference"

Use it consistently throughout:

Confirmation
Booking lookup
Cancellation
Refund
Support
Notifications

---

# 32. REMOVE FAKE / UNDEFINED PRODUCT FEATURES

The visual design should NOT imply the following features exist unless they are actually part of the current product specification:

Customer reviews/ratings
Customer rating system
Marketplace
Staff review scores
Push notifications requiring a mobile app

If rating values or staff photos are currently used, treat them clearly as demo placeholders or remove them.

Do not invent business functionality simply to make the screen look complete.

---

# 33. STAFF PHOTOS

Staff photos are optional for the current concept.

If used, display them as salon-provided profile photos.

Do not imply that BookYourBarber has a public staff-rating marketplace.

Do not display unexplained review scores.

---

# 34. LOADING STATES

Keep and improve the existing loading state.

Use loading states for:

Salon loading
Services loading
Staff loading
Calendar loading
Time slots loading
Payment processing
Booking confirmation processing
Booking lookup

Do not display empty content while data is still loading.

---

# 35. NETWORK ERROR

Keep the existing network error state.

Improve the copy:

"We couldn't connect to BookYourBarber."

Actions:

"Try again"

"Contact support"

The customer should not lose their booking data simply because a network request failed.

---

# 36. SESSION EXPIRATION

Add:

"Your session has expired."

Action:

"Start booking again"

Do not display a blank screen.

---

# 37. RATE-LIMIT / ABUSE STATE

Add a defensive state for excessive booking attempts.

Example:

"Too many attempts."

"Please wait a moment and try again."

This should be calm and non-accusatory.

---

# 38. DESIGN PRINCIPLES

Maintain the existing visual language:

DM Sans
Near-black primary actions
Emerald for success
Amber for warnings
Red for errors
Warm-gray background
White surfaces
Clear hierarchy
Mobile-first layout
Premium but approachable

Do not introduce excessive gradients, glassmorphism, unnecessary animation or enterprise-style complexity.

---

# 39. PRIMARY MOBILE EXPERIENCE

The customer experience should remain extremely simple:

DISCOVER
↓
SERVICE
↓
STAFF
↓
DATE
↓
TIME
↓
DETAILS
↓
REMINDER
↓
PAYMENT METHOD
↓
PAYMENT / CONFIRM
↓
CONFIRMATION

Minimize unnecessary screens while still providing the required states.

---

# 40. FINAL UX QUALITY STANDARD

The design should handle both:

HAPPY PATH

and

REAL-WORLD FAILURE PATHS.

Happy path:

QR
→ Salon
→ Service
→ Staff
→ Date
→ Time
→ Details
→ Reminder
→ Payment
→ Confirmation
→ Booking reference

Failure paths:

Payment failed
Slot unavailable
Hold expired
Network failure
Payment succeeded but booking is processing
Duplicate payment attempt
Salon unavailable
Service unavailable
Staff unavailable
Reschedule conflict
Customer cancellation
Salon cancellation
Refund processing
Refund failure
Notification failure

Do not remove the existing strong visual design.

Make the current booking experience more accurate, more complete and closer to production-ready behavior.
