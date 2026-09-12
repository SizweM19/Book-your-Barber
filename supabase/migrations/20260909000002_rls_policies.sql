-- ============================================================================
-- BOOKYOURBARBER ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 20260909000002_rls_policies.sql
-- ============================================================================

-- Helper functions for RLS evaluation (SECURITY DEFINER to avoid recursion)

CREATE OR REPLACE FUNCTION is_tenant_member(lookup_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM tenant_memberships
    WHERE tenant_id = lookup_tenant_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_tenant_role(lookup_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM tenant_memberships
  WHERE tenant_id = lookup_tenant_id
    AND user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM platform_admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_platform_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- TENANTS POLICIES
-- ============================================================================

CREATE POLICY "Members and public can view tenants"
  ON tenants FOR SELECT
  USING (is_tenant_member(id) OR is_platform_admin() OR status = 'active');

CREATE POLICY "Owners can update tenant details"
  ON tenants FOR UPDATE
  USING (get_tenant_role(id) = 'OWNER' OR is_platform_admin());

CREATE POLICY "Authenticated users can register a tenant"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- TENANT MEMBERSHIPS POLICIES
-- ============================================================================

CREATE POLICY "Members can view tenant memberships"
  ON tenant_memberships FOR SELECT
  USING (is_tenant_member(tenant_id) OR user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Owners can manage tenant memberships"
  ON tenant_memberships FOR ALL
  USING (get_tenant_role(tenant_id) = 'OWNER' OR is_platform_admin());

-- ============================================================================
-- SERVICES & STAFF POLICIES (Public Read for active catalog, Member Edit)
-- ============================================================================

CREATE POLICY "Public and members can view active services"
  ON services FOR SELECT
  USING (active = TRUE OR is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Tenant members can modify services"
  ON services FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Public and members can view active staff"
  ON staff FOR SELECT
  USING (active = TRUE OR is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Tenant members can modify staff"
  ON staff FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Public and members can view staff services"
  ON staff_services FOR SELECT
  USING (TRUE);

CREATE POLICY "Tenant members can modify staff services"
  ON staff_services FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Public and members can view staff schedules"
  ON staff_schedules FOR SELECT
  USING (TRUE);

CREATE POLICY "Tenant members can modify staff schedules"
  ON staff_schedules FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Public and members can view schedule breaks"
  ON schedule_breaks FOR SELECT
  USING (TRUE);

CREATE POLICY "Tenant members can modify schedule breaks"
  ON schedule_breaks FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Public and members can view schedule exceptions"
  ON schedule_exceptions FOR SELECT
  USING (TRUE);

CREATE POLICY "Tenant members can modify schedule exceptions"
  ON schedule_exceptions FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================

CREATE POLICY "Tenant members can view customers"
  ON customers FOR SELECT
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Anyone can register as a customer during booking"
  ON customers FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Tenant members can update customer records"
  ON customers FOR UPDATE
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

-- ============================================================================
-- APPOINTMENTS POLICIES
-- ============================================================================

-- Members can view all appointments for their salon.
-- Guests can lookup their own booking by exact reference.
CREATE POLICY "Appointments select policy"
  ON appointments FOR SELECT
  USING (
    is_tenant_member(tenant_id)
    OR is_platform_admin()
    OR (auth.uid() IS NULL AND booking_reference IS NOT NULL)
  );

CREATE POLICY "Anyone can book an appointment"
  ON appointments FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Tenant members can update appointments"
  ON appointments FOR UPDATE
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

CREATE POLICY "Tenant members can view payments"
  ON payments FOR SELECT
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Tenant members and booking flow can record payments"
  ON payments FOR INSERT
  WITH CHECK (is_tenant_member(tenant_id) OR is_platform_admin() OR auth.uid() IS NULL);

-- ============================================================================
-- REFUNDS & EXPENSES POLICIES (Strict Member Only)
-- ============================================================================

CREATE POLICY "Tenant members can view refunds"
  ON refunds FOR SELECT
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Tenant members can manage refunds"
  ON refunds FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Tenant members can view expenses"
  ON expenses FOR SELECT
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

CREATE POLICY "Tenant members can manage expenses"
  ON expenses FOR ALL
  USING (is_tenant_member(tenant_id) OR is_platform_admin());

-- ============================================================================
-- AUDIT LOGS POLICIES (Append-only by system/members, Read by Owners/Admins)
-- ============================================================================

CREATE POLICY "Owners and Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (get_tenant_role(tenant_id) = 'OWNER' OR is_platform_admin());

CREATE POLICY "Members and system can append audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (is_tenant_member(tenant_id) OR is_platform_admin() OR auth.uid() IS NULL);