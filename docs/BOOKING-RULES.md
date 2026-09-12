# BookYourBarber — Booking Domain Business Rules

## 1. Booking Reference Model

Every appointment is assigned a human-readable booking reference code:

- **Format**: `BYB-YYYYMMDD-XXXXX` (e.g. `BYB-20260910-00001`).
- **Prefix**: `BYB` (BookYourBarber).
- **Date Segment**: `YYYYMMDD` (Date of generation).
- **Sequence Segment**: 5-digit number padded with leading zeroes.
- **Separation of Concerns**: Stored in `appointments.booking_reference`, strictly separate from the internal appointment UUID primary key.
- **Uniqueness**: Enforced by unique database index `idx_appointments_reference`.
- **Use Cases**: Customer self-service lookup, WhatsApp confirmation messages, in-salon payment allocation, and refund tracking.

---

## 2. Reservation & Scheduling Invariants

### 2.1 Advance Booking Window
- Customers can book appointments up to **60 days** in advance.
- Requests beyond 60 days are rejected by `AvailabilityService`.

### 2.2 Online Slot Reservation Hold
- When a customer selects a slot and proceeds to online checkout, a **10-minute hold** window is initiated (`SLOT_HOLD_SECONDS = 600`).
- If checkout is not finalized within 10 minutes, the hold expires, preventing indefinitely locked barber chairs.

### 2.3 Reschedule Policy
- Appointments can be rescheduled by the customer or salon provided the request is made at least **2 hours** prior to the appointment (`canRescheduleAppointment`).
- Rescheduling within 2 hours of the scheduled start time is prohibited.

### 2.4 Appointment Completion Invariant
- **Rule**: An appointment cannot be marked as `completed` while an outstanding balance remains.
- **Enforcement**: `canCompleteAppointment({ totalCharged, totalPaid })` verifies that `outstandingBalance === 0`. If balance > 0, an error is returned instructing the barber/receptionist to record payment first.

### 2.5 Dynamic Availability Calculation
A time slot is available if and only if:
1. The salon is open on that day of the week.
2. The assigned staff member is scheduled to work on that day.
3. The slot start and duration do not intersect a scheduled staff break.
4. The date is not marked with an active staff time-off exception.
5. No existing appointment (excluding `cancelled`) occupies the requested barber chair.

### 2.6 Concurrency & Double-Booking Protection (Fix H2)
To prevent simultaneous race conditions from creating duplicate or overlapping bookings for the same barber:
- **Application Layer**: `BookingService.createBooking` and `MockAppointmentRepository.create` perform full interval overlap re-validation (`newStart < existingEnd && existingStart < newEnd`) immediately prior to insertion.
- **Database Layer**: Enforced via PostgreSQL GiST exclusion constraint (`exclude_overlapping_staff_appointments`) with the `btree_gist` extension in `supabase/migrations/20260911000001_pre_supabase_hardening.sql`:
  - Utilizes a stored generated column `appointment_range tsrange GENERATED ALWAYS AS (tsrange((appointment_date + start_time), (appointment_date + start_time + (duration_minutes * INTERVAL '1 minute')), '[)')) STORED`.
  - Constraint: `EXCLUDE USING gist (tenant_id WITH =, staff_id WITH =, appointment_range WITH &&) WHERE (status NOT IN ('cancelled') AND staff_id IS NOT NULL)`.
- **Duration Overlap**: Handles varying appointment durations (e.g. 09:00-10:00 vs 09:30-10:00) so any overlapping interval is blocked at the database engine level.
- **Cancelled Slots**: Cancelled appointments are explicitly excluded from the constraint condition, permitting customer or salon re-booking into newly liberated time slots.


