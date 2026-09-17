-- ============================================================
-- Migration: 012_admin_features
-- Description: Admin-related schema (bans, platform stats)
-- Created: <today's date>
-- ============================================================

-- Ban columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Partial index for finding active admins quickly (rare query, cheap)
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(role)
  WHERE role = 'admin' AND deleted_at IS NULL;

-- Platform stats view — pre-aggregated metrics
-- Refreshed by Postgres automatically on read (views are always live)
CREATE OR REPLACE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'client' AND deleted_at IS NULL) AS total_clients,
  (SELECT COUNT(*) FROM users WHERE role = 'freelancer' AND deleted_at IS NULL) AS total_freelancers,
  (SELECT COUNT(*) FROM users WHERE role = 'admin' AND deleted_at IS NULL) AS total_admins,
  (SELECT COUNT(*) FROM users WHERE banned_at IS NOT NULL AND deleted_at IS NULL) AS banned_users,
  (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL) AS total_jobs,
  (SELECT COUNT(*) FROM jobs WHERE status = 'open' AND deleted_at IS NULL) AS open_jobs,
  (SELECT COUNT(*) FROM jobs WHERE status = 'in_progress' AND deleted_at IS NULL) AS in_progress_jobs,
  (SELECT COUNT(*) FROM contracts) AS total_contracts,
  (SELECT COUNT(*) FROM contracts WHERE status = 'active') AS active_contracts,
  (SELECT COUNT(*) FROM contracts WHERE status = 'completed') AS completed_contracts,
  (SELECT COUNT(*) FROM contracts WHERE status = 'disputed') AS disputed_contracts,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE type = 'escrow_hold' AND status = 'succeeded') AS gross_volume_paise,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE type = 'release' AND status = 'succeeded') AS released_paise,
  (SELECT COUNT(*) FROM proposals) AS total_proposals,
  (SELECT COUNT(*) FROM reviews) AS total_reviews;