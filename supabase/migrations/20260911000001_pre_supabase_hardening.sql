-- ============================================================================
-- BOOKYOURBARBER PRE-SUPABASE INTEGRATION HARDENING MIGRATION
-- Migration: 20260911000001_pre_supabase_hardening.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SALON PROFILES & BOOKING SETTINGS (Fix B1)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  salon_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  address_street TEXT,
  address_city TEXT,
  address_postal_code TEXT,
  phone TEXT,
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Booking settings per salon
  online_booking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
  min_notice_minutes INTEGER NOT NULL DEFAULT 30,
  max_advance_days INTEGER NOT NULL DEFAULT 60,
  assignment_strategy TEXT NOT NULL DEFAULT 'FIRST_AVAILABLE' 
    CHECK (assignment_strategy IN ('FIRST_AVAILABLE', 'ROUND_ROBIN', 'PREFERRED_STAFF')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique case-insensitive slug index for public booking resolution
CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_profiles_slug ON salon_profiles (LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_salon_profiles_tenant ON salon_profiles (tenant_id);

CREATE TRIGGER set_salon_profiles_updated_at
  BEFORE UPDATE ON salon_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE salon_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public and members can view active salon profiles"
  ON salon_profiles FOR SELECT
  USING (active = TRUE OR is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Tenant owners can update salon profiles"
  ON salon_profiles FOR UPDATE
  USING (get_tenant_role(tenant_id) = 'OWNER' OR is_platform_admin());

CREATE POLICY "Tenant members can insert salon profiles"
  ON salon_profiles FOR INSERT
  WITH CHECK (is_tenant_member(tenant_id) OR is_platform_admin());

-- ----------------------------------------------------------------------------
-- 2. DATABASE DOUBLE-BOOKING CONCURRENCY PROTECTION (Fix H2)
-- ----------------------------------------------------------------------------
-- Enable btree_gist extension for combining scalar equality and range overlap
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop obsolete partial unique index that did not account for appointment duration
DROP INDEX IF EXISTS idx_appointments_staff_slot_unique;

-- Add generated tsrange column representing the exact appointment time interval [start, end)
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS appointment_range tsrange 
  GENERATED ALWAYS AS (
    tsrange(
      (appointment_date + start_time),
      (appointment_date + start_time + (duration_minutes * INTERVAL '1 minute')),
      '[)'
    )
  ) STORED;

-- Exclusion constraint preventing overlapping active appointments for the same staff member
-- Cancelled appointments (and unassigned staff if any) are excluded from the conflict check.
ALTER TABLE appointments 
  DROP CONSTRAINT IF EXISTS exclude_overlapping_staff_appointments;

ALTER TABLE appointments 
  ADD CONSTRAINT exclude_overlapping_staff_appointments 
  EXCLUDE USING gist (
    tenant_id WITH =,
    staff_id WITH =,
    appointment_range WITH &&
  )
  WHERE (status NOT IN ('cancelled') AND staff_id IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 3. CUSTOMER CREATION TENANT INTEGRITY (Fix H3)
-- ----------------------------------------------------------------------------
-- Replace open WITH CHECK (TRUE) with active tenant existence validation
DROP POLICY IF EXISTS "Anyone can register as a customer during booking" ON customers;

CREATE POLICY "Customers can be created for active salons"
  ON customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = tenant_id 
        AND status = 'active'
    )
  );

-- Replace open WITH CHECK (TRUE) on appointments with active tenant existence validation
DROP POLICY IF EXISTS "Anyone can book an appointment" ON appointments;

CREATE POLICY "Appointments can be created for active salons"
  ON appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = tenant_id 
        AND status = 'active'
    )
  );

-- ----------------------------------------------------------------------------
-- 4. HARDEN APPOINTMENTS SELECT POLICY (Fix H1)
-- ----------------------------------------------------------------------------
-- Replace overly broad anon SELECT policy
DROP POLICY IF EXISTS "Appointments select policy" ON appointments;

-- Members/admins have full visibility into their salon's appointments.
CREATE POLICY "Tenant members can view salon appointments"
  ON appointments FOR SELECT
  USING (
    is_tenant_member(tenant_id)
    OR is_platform_admin()
  );

-- Secure RPC function for guest booking lookup with verification
-- This prevents table-wide enumeration of appointments by anonymous clients.
CREATE OR REPLACE FUNCTION lookup_guest_appointment(
  p_booking_reference TEXT,
  p_verification_phone TEXT DEFAULT NULL,
  p_verification_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  booking_reference TEXT,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  service_id UUID,
  staff_id UUID,
  appointment_date DATE,
  start_time TIME,
  duration_minutes INTEGER,
  status TEXT,
  payment_status TEXT,
  total_charged NUMERIC,
  total_paid NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.tenant_id,
    a.booking_reference,
    a.customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    a.service_id,
    a.staff_id,
    a.appointment_date,
    a.start_time,
    a.duration_minutes,
    a.status,
    a.payment_status,
    a.total_charged,
    a.total_paid
  FROM appointments a
  JOIN customers c ON c.id = a.customer_id
  WHERE a.booking_reference = p_booking_reference
    AND (
      (p_verification_phone IS NOT NULL AND RIGHT(REPLACE(REPLACE(c.phone, ' ', ''), '-', ''), 9) = RIGHT(REPLACE(REPLACE(p_verification_phone, ' ', ''), '-', ''), 9))
      OR (p_verification_email IS NOT NULL AND LOWER(c.email) = LOWER(p_verification_email))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION lookup_guest_appointment FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_guest_appointment TO anon, authenticated;
