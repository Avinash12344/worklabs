-- ============================================================
-- Migration: 004_messages_reviews_notifications
-- Description: Messages, reviews, notifications, subscriptions
-- Created: <today's date>
-- ============================================================

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per contract per reviewer
  UNIQUE (contract_id, reviewer_id),

  -- A user cannot review themselves
  CHECK (reviewer_id <> reviewee_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL
    CHECK (plan IN ('free', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active subscription per user
  UNIQUE (user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Messages: fetch messages for a contract, newest first
CREATE INDEX idx_messages_contract_created ON messages(contract_id, created_at DESC);

-- Messages: unread count for a user
CREATE INDEX idx_messages_sender_unread ON messages(sender_id)
  WHERE read_at IS NULL;

-- Reviews: "show all reviews for this user"
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id, created_at DESC);

-- Notifications: unread notifications for a user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Subscriptions: find by Stripe IDs (webhooks)
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_customer ON subscriptions(stripe_customer_id);