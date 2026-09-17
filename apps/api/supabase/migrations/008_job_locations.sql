-- ============================================================
-- Migration: 008_job_locations
-- Description: Add location columns to jobs
-- Created: <today's date>
-- ============================================================

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_location
  ON jobs(latitude, longitude)
  WHERE deleted_at IS NULL
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL;