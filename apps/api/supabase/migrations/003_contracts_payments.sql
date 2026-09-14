-- ============================================================
-- Migration: 003_contracts_payments
-- Description: Contracts, milestones, and payments
-- Created: <today's date>
-- ============================================================

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  client_id UUID NOT NULL REFERENCES users(id),
  freelancer_id UUID NOT NULL REFERENCES users(id),
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'disputed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A proposal can produce only one contract
  UNIQUE (proposal_id)
);

-- ============================================================
-- MILESTONES
-- ============================================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  due_date TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PAYMENTS (event log — never mutated, only appended)
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  milestone_id UUID REFERENCES milestones(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL
    CHECK (type IN ('escrow_hold', 'release', 'refund', 'platform_fee')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed')),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Contracts: "find contract for this job"
CREATE INDEX idx_contracts_job ON contracts(job_id);

-- Contracts: "my contracts" for a user (as client OR freelancer)
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_freelancer ON contracts(freelancer_id);

-- Contracts: by status (dashboards filter by status)
CREATE INDEX idx_contracts_status ON contracts(status);

-- Milestones: "show milestones for a contract in order"
CREATE INDEX idx_milestones_contract_order ON milestones(contract_id, order_index);

-- Milestones: by status (dashboards)
CREATE INDEX idx_milestones_status ON milestones(status);

-- Payments: "show payments for a contract, newest first"
CREATE INDEX idx_payments_contract_created ON payments(contract_id, created_at DESC);

-- Payments: "find payment by Stripe ID" (webhooks use this)
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);