-- ============================================================================
-- BOOKYOURBARBER: Salons view, Schedules & Notifications tables
-- Migration: 20260926000001_salons_schedules_notifications.sql
-- ============================================================================

-- 1. SALONS view (maps tenants to the salons name used in repositories)
CREATE OR REPLACE VIEW public.salons
  WITH (security_invoker = on)
AS
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
  FROM public.tenants;

-- 2. SCHEDULES view (alias for staff_schedules)
CREATE OR REPLACE VIEW public.schedules
  WITH (security_invoker = on)
AS
  SELECT
    ss.id,
    ss.tenant_id,
    ss.staff_id,
    ss.day_of_week,
    ss.start_time,
    ss.end_time,
    ss.is_working
  FROM public.staff_schedules ss;

-- 3. NOTIFICATIONS view (alias for message_logs)
CREATE OR REPLACE VIEW public.notifications
  WITH (security_invoker = on)
AS
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
  FROM public.message_logs ml;

GRANT SELECT ON public.salons TO authenticated, anon;
GRANT SELECT ON public.schedules TO authenticated, anon;
GRANT SELECT ON public.notifications TO authenticated, anon;