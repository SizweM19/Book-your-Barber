-- ============================================================================
-- BOOKYOURBARBER TABLE GRANTS & INITIAL SEED DATA
-- Migration: 20260911000002_grants_and_seed.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table & Schema Permissions for PostgREST API Roles
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Initial Development Seed: Fade & Edge Barbershop (Cape Town, SA)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
  v_staff_t1 UUID := '22222222-1111-1111-1111-111111111111';
  v_staff_t2 UUID := '22222222-2222-1111-1111-111111111111';
  v_staff_t3 UUID := '22222222-3333-1111-1111-111111111111';
  v_staff_t4 UUID := '22222222-4444-1111-1111-111111111111';
  v_srv_s1 UUID := '33333333-1111-1111-1111-111111111111';
  v_srv_s2 UUID := '33333333-2222-1111-1111-111111111111';
  v_srv_s3 UUID := '33333333-3333-1111-1111-111111111111';
  v_srv_s4 UUID := '33333333-4444-1111-1111-111111111111';
  v_srv_s5 UUID := '33333333-5555-1111-1111-111111111111';
  v_srv_s6 UUID := '33333333-6666-1111-1111-111111111111';
  v_srv_s7 UUID := '33333333-7777-1111-1111-111111111111';
  v_cust_c1 UUID := '44444444-1111-1111-1111-111111111111';
  v_cust_c2 UUID := '44444444-2222-1111-1111-111111111111';
  v_cust_c3 UUID := '44444444-3333-1111-1111-111111111111';
BEGIN

  -- 2.1 Tenant
  INSERT INTO tenants (id, name, business_type, phone, email, address, timezone, status)
  VALUES (
    v_tenant_id,
    'Fade & Edge Barbershop',
    'Barbershop',
    '082 345 6789',
    'salon@fadeandedge.co.za',
    '15 Loader Street, De Waterkant, Cape Town, 8001',
    'Africa/Johannesburg',
    'active'
  ) ON CONFLICT (id) DO NOTHING;

  -- 2.2 Salon Profile & Settings
  INSERT INTO salon_profiles (
    tenant_id,
    slug,
    salon_name,
    tagline,
    description,
    address_street,
    address_city,
    address_postal_code,
    phone,
    email,
    currency,
    active,
    online_booking_enabled,
    slot_interval_minutes,
    min_notice_minutes,
    max_advance_days,
    assignment_strategy
  ) VALUES (
    v_tenant_id,
    'fade-and-edge',
    'Fade & Edge Barbershop',
    'Expert cuts, hot towel shaves, and beard sculpting',
    'Cape Town''s most trusted barbershop since 2014. Expert cuts, hot towel shaves, and beard sculpting. Walk-ins welcome, appointments preferred.',
    '15 Loader Street',
    'De Waterkant, Cape Town',
    '8001',
    '021 555 0192',
    'info@fadeandedge.co.za',
    'ZAR',
    TRUE,
    TRUE,
    30,
    30,
    60,
    'FIRST_AVAILABLE'
  ) ON CONFLICT (tenant_id) DO NOTHING;

  -- 2.3 Staff
  INSERT INTO staff (id, tenant_id, name, role, photo_url, active) VALUES
    (v_staff_t1, v_tenant_id, 'Themba Ndlovu', 'Master Barber', 'photo-1507003211169-0a1dd7228f2d', TRUE),
    (v_staff_t2, v_tenant_id, 'Devon Williams', 'Senior Stylist', 'photo-1472099645785-5658abf4ff4e', TRUE),
    (v_staff_t3, v_tenant_id, 'Aisha Jacobs', 'Style Specialist', 'photo-1494790108377-be9c29b29330', TRUE),
    (v_staff_t4, v_tenant_id, 'Ntombi Dlamini', 'Senior Barber', 'photo-1438761681033-6461ffad8d80', FALSE)
  ON CONFLICT (id) DO NOTHING;

  -- 2.4 Services
  INSERT INTO services (id, tenant_id, name, category, description, duration, price, active) VALUES
    (v_srv_s1, v_tenant_id, 'Classic Haircut', 'Haircuts', 'Precision cut, style and finish', 45, 150.00, TRUE),
    (v_srv_s2, v_tenant_id, 'Line-up and Edge', 'Haircuts', 'Sharp lines and clean fades only', 20, 80.00, TRUE),
    (v_srv_s3, v_tenant_id, 'Kids Cut (Under 12)', 'Haircuts', 'Gentle cut for the little ones', 30, 100.00, TRUE),
    (v_srv_s4, v_tenant_id, 'Beard Trim and Shape', 'Beard', 'Sculpted edges and hot towel finish', 30, 120.00, TRUE),
    (v_srv_s5, v_tenant_id, 'Hot Towel Shave', 'Shaving', 'Traditional straight-razor shave', 60, 200.00, TRUE),
    (v_srv_s6, v_tenant_id, 'Hair and Beard Combo', 'Combos', 'Full cut plus beard sculpt', 75, 250.00, TRUE),
    (v_srv_s7, v_tenant_id, 'Scalp Treatment', 'Treatments', 'Invigorating scalp wash & massage', 45, 180.00, FALSE)
  ON CONFLICT (id) DO NOTHING;

  -- 2.5 Staff-Service Capabilities
  INSERT INTO staff_services (tenant_id, staff_id, service_id) VALUES
    (v_tenant_id, v_staff_t1, v_srv_s1),
    (v_tenant_id, v_staff_t1, v_srv_s2),
    (v_tenant_id, v_staff_t1, v_srv_s4),
    (v_tenant_id, v_staff_t1, v_srv_s5),
    (v_tenant_id, v_staff_t1, v_srv_s6),
    (v_tenant_id, v_staff_t2, v_srv_s1),
    (v_tenant_id, v_staff_t2, v_srv_s2),
    (v_tenant_id, v_staff_t2, v_srv_s3),
    (v_tenant_id, v_staff_t2, v_srv_s4),
    (v_tenant_id, v_staff_t3, v_srv_s1),
    (v_tenant_id, v_staff_t3, v_srv_s2),
    (v_tenant_id, v_staff_t3, v_srv_s4),
    (v_tenant_id, v_staff_t3, v_srv_s7),
    (v_tenant_id, v_staff_t4, v_srv_s1),
    (v_tenant_id, v_staff_t4, v_srv_s2)
  ON CONFLICT (staff_id, service_id) DO NOTHING;

  -- 2.6 Staff Schedules (Mon=1 through Sat=6)
  INSERT INTO staff_schedules (tenant_id, staff_id, day_of_week, start_time, end_time, is_working) VALUES
    -- Themba (Mon-Sat 08:00 - 18:00)
    (v_tenant_id, v_staff_t1, 1, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t1, 2, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t1, 3, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t1, 4, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t1, 5, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t1, 6, '08:00', '18:00', TRUE),
    -- Devon (Mon-Fri 08:00 - 18:00)
    (v_tenant_id, v_staff_t2, 1, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t2, 2, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t2, 3, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t2, 4, '08:00', '18:00', TRUE),
    (v_tenant_id, v_staff_t2, 5, '08:00', '18:00', TRUE),
    -- Aisha (Tue-Sat 09:00 - 17:00)
    (v_tenant_id, v_staff_t3, 2, '09:00', '17:00', TRUE),
    (v_tenant_id, v_staff_t3, 3, '09:00', '17:00', TRUE),
    (v_tenant_id, v_staff_t3, 4, '09:00', '17:00', TRUE),
    (v_tenant_id, v_staff_t3, 5, '09:00', '17:00', TRUE),
    (v_tenant_id, v_staff_t3, 6, '09:00', '17:00', TRUE)
  ON CONFLICT (staff_id, day_of_week) DO NOTHING;

  -- 2.7 Customers
  INSERT INTO customers (id, tenant_id, name, phone, email, notes, segment) VALUES
    (v_cust_c1, v_tenant_id, 'Thabo Mokoena', '082 345 6789', 'thabo@gmail.com', 'Prefers Themba. Short sides.', 'regular'),
    (v_cust_c2, v_tenant_id, 'Lerato Dlamini', '071 234 5678', 'lerato@gmail.com', '', 'returning'),
    (v_cust_c3, v_tenant_id, 'Sanele Khumalo', '083 456 7890', 'sanele@gmail.com', 'Regular. Beard + cut combo.', 'vip')
  ON CONFLICT (id) DO NOTHING;

  -- 2.8 Sample Expenses
  INSERT INTO expenses (tenant_id, category, description, amount, expense_date) VALUES
    (v_tenant_id, 'Rent', 'Monthly salon rent — September', 8500.00, '2026-09-01'),
    (v_tenant_id, 'Products', 'Hair products restock — Wahl, Andis', 1200.00, '2026-09-03'),
    (v_tenant_id, 'Electricity', 'Municipal electricity bill', 750.00, '2026-09-05'),
    (v_tenant_id, 'Marketing', 'Instagram promotion — September', 500.00, '2026-09-06'),
    (v_tenant_id, 'Transport', 'Staff transport allowance', 600.00, '2026-09-08')
  ON CONFLICT DO NOTHING;

END $$;

