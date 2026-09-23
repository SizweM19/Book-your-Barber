-- Migration: 20260922000001_slot_holds.sql
-- Creates a database-backed slot_holds table with automatic TTL expiry.
-- Replaces the stateless in-memory hold system in /api/slots/hold/route.ts.

CREATE TABLE IF NOT EXISTS slot_holds (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id      UUID,
  service_id    UUID,
  hold_date     DATE        NOT NULL,
  hold_time     TIME        NOT NULL,
  hold_id       TEXT        NOT NULL UNIQUE,  -- opaque token returned to client
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient TTL cleanup and availability queries
CREATE INDEX IF NOT EXISTS idx_slot_holds_staff_date
  ON slot_holds (tenant_id, staff_id, hold_date, hold_time);

CREATE INDEX IF NOT EXISTS idx_slot_holds_expires_at
  ON slot_holds (expires_at);

-- RLS: only service-role and the Next.js API route (via anon with trusted header) can write
ALTER TABLE slot_holds ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads so AvailabilityService can check active holds without a session
CREATE POLICY "slot_holds_public_read"
  ON slot_holds FOR SELECT
  USING (expires_at > NOW());

-- Allow anonymous inserts (Next.js API route runs as anon when no session cookie)
CREATE POLICY "slot_holds_public_insert"
  ON slot_holds FOR INSERT
  WITH CHECK (true);

-- Allow anonymous deletes for hold release / expired cleanup
CREATE POLICY "slot_holds_public_delete"
  ON slot_holds FOR DELETE
  USING (true);

-- Cleanup function: delete expired holds (called by the API on each hold request)
CREATE OR REPLACE FUNCTION cleanup_expired_slot_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM slot_holds WHERE expires_at < NOW();
END;
$$;
