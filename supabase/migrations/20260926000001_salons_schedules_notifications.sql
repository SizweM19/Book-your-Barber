-- ============================================================================
-- BOOKYOURBARBER: Salons view, Schedules & Notifications tables
-- Migration: 20260926000001_salons_schedules_notifications.sql
-- ============================================================================

-- 1. SALONS view (maps tenants to the 'salons' name used in repositories)
--    Many repository queries expect a 'salons' table — this creates a view
--    aliasing tenants so existing queries work without changing the schema.
CREATE OR REPLACE VIEW salons AS
  SELECT
    id,
    name,
    business_type,
    phone,
    email,
    address,
    logo_url,
    timezone,
    status,
    created_at,
    updated_at
  FROM tenants;

-- 2. SCHEDULES (unified schedule view combining staff_schedules)
--    Repositories query 'schedules' table — create as alias view.
CREATE OR REPLACE VIEW schedules AS
  SELECT
    ss.id,
    ss.tenant_id,
    ss.staff_id,
    ss.day_of_week,
    ss.start_time,
    ss.end_time,
    ss.is_working
  FROM staff_schedules ss;

-- 3. NOTIFICATIONS (alias for message_logs, used by NotificationRepository)
CREATE OR REPLACE VIEW notifications AS
  SELECT
    ml.id,
    ml.tenant_id,
    ml.appointment_id,
    ml.customer_id,
    ml.channel,
    ml.status,
    ml.sent_at,
    ml.fail_reason,
    ml.created_at
  FROM message_logs ml;

-- Grant read access on the views to the authenticated and anon roles
GRANT SELECT ON salons TO authenticated, anon;
GRANT SELECT ON schedules TO authenticated, anon;
GRANT SELECT ON notifications TO authenticated, anon;
