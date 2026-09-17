-- ============================================================
-- Migration: 011_search_vector
-- Description: Generated tsvector for efficient job search
-- Created: <today's date>
-- ============================================================

-- Generated column that auto-computes from title + description
-- Weighted: title has higher priority (A) than description (B)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

-- Drop the old index (superseded)
DROP INDEX IF EXISTS idx_jobs_search;

-- New index on the generated column
CREATE INDEX idx_jobs_search_vector
  ON jobs USING GIN (search_vector)
  WHERE deleted_at IS NULL;