-- ============================================================
-- Migration: 007_stripe_fields
-- Description: Stripe integration columns for customers and accounts
-- Created: <today's date>
-- ============================================================

-- Stripe Customer ID (for the client who funds)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Stripe Connect Account ID (for the freelancer who receives)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Payments: track the actual charge and any failure reason
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Index for webhook lookups by PaymentIntent
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi
  ON payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;