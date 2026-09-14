-- ============================================================
-- Migration: 002_jobs_proposals
-- Description: Jobs, job skills, and proposals
-- Created: <today's date>
-- ============================================================

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_min INTEGER NOT NULL CHECK (budget_min >= 0),
  budget_max INTEGER NOT NULL CHECK (budget_max >= 0),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  deadline TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Business rule: max must be >= min
  CHECK (budget_max >= budget_min)
);

-- ============================================================
-- JOB_SKILLS (junction)
-- ============================================================
CREATE TABLE job_skills (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, skill_id)
);

-- ============================================================
-- PROPOSALS
-- ============================================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  bid_amount INTEGER NOT NULL CHECK (bid_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Business rule: a freelancer can apply to a job only once
  UNIQUE (job_id, freelancer_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Jobs: most queries filter by status and order by created_at
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Jobs: "show me all jobs by this client"
CREATE INDEX idx_jobs_client ON jobs(client_id)
  WHERE deleted_at IS NULL;

-- Jobs: full-text search on title and description
-- (we'll use this later for search)
CREATE INDEX idx_jobs_search ON jobs
  USING GIN (to_tsvector('english', title || ' ' || description))
  WHERE deleted_at IS NULL;

-- Job skills: "find jobs needing React"
CREATE INDEX idx_job_skills_skill ON job_skills(skill_id);

-- Proposals: "show all proposals for this job"
CREATE INDEX idx_proposals_job ON proposals(job_id);

-- Proposals: "show all proposals by this freelancer"
CREATE INDEX idx_proposals_freelancer ON proposals(freelancer_id);