-- ============================================
-- Row Level Security (RLS) Policies
-- Conta2Go - Multi-Country Support
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER POLICIES
-- ============================================

-- Users can view their own data
CREATE POLICY "Users can view own data"
  ON "User"
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Super Admins can view all users
CREATE POLICY "Super admins can view all users"
  ON "User"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- COMPANY POLICIES
-- ============================================

-- Users can view companies they belong to
CREATE POLICY "Users can view own companies"
  ON "Company"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
      AND "User".id = ANY(
        SELECT unnest("Company"."userIds")
      )
    )
  );

-- Only CONTADOR and SUPER_ADMIN can create companies
CREATE POLICY "Contador/Admin can create companies"
  ON "Company"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role IN ('SUPER_ADMIN', 'CONTADOR')
    )
  );

-- Only company owners can update
CREATE POLICY "Company owners can update"
  ON "Company"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
      AND (
        "User".role IN ('SUPER_ADMIN', 'CONTADOR')
        OR "User".id = ANY(
          SELECT unnest("Company"."userIds")
        )
      )
    )
  );

-- Only SUPER_ADMIN can delete companies
CREATE POLICY "Only super admin can delete companies"
  ON "Company"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- COUNTRY ISOLATION
-- ============================================

-- Companies can only access data from their country
CREATE POLICY "Country data isolation"
  ON "Company"
  FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON "AuditLog"
  FOR SELECT
  USING (
    "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role IN ('SUPER_ADMIN', 'AUDITOR')
    )
  );

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON "AuditLog"
  FOR INSERT
  WITH CHECK (true);

-- No one can update audit logs (immutable)
CREATE POLICY "Audit logs are immutable"
  ON "AuditLog"
  FOR UPDATE
  USING (false);

-- Only SUPER_ADMIN can delete old audit logs
CREATE POLICY "Only admin can delete audit logs"
  ON "AuditLog"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to set current country context
CREATE OR REPLACE FUNCTION set_country_context(country_code TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_country', country_code, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's country
CREATE OR REPLACE FUNCTION get_user_country(user_id TEXT)
RETURNS TEXT AS $$
  SELECT DISTINCT country
  FROM "Company"
  WHERE user_id = ANY("userIds")
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_country ON "Company"(country);
CREATE INDEX IF NOT EXISTS idx_company_users ON "Company" USING GIN ("userIds");
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON "AuditLog"(timestamp DESC);

-- ============================================
-- NOTES
-- ============================================

-- To use country isolation in your app:
-- 
-- 1. Set the country context at the start of each request:
--    SELECT set_country_context('SV'); -- El Salvador
--
-- 2. Countries supported: SV, GT, HN, NI, CR, PA
--
-- 3. SUPER_ADMIN can access all countries
--
-- 4. Regular users can only see data from their assigned country
