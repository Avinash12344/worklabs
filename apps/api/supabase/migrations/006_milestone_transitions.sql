-- ============================================================
-- Migration: 006_milestone_transitions
-- Description: State machine functions for milestones
-- Created: <today's date>
-- ============================================================

-- ============================================================
-- submit_milestone: freelancer marks as done, awaiting review
-- ============================================================
CREATE OR REPLACE FUNCTION submit_milestone(
  p_milestone_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_freelancer_id UUID;
  v_status TEXT;
BEGIN
  SELECT c.freelancer_id, m.status
  INTO v_freelancer_id, v_status
  FROM milestones m
  JOIN contracts c ON c.id = m.contract_id
  WHERE m.id = p_milestone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  IF v_freelancer_id != p_user_id THEN
    RAISE EXCEPTION 'Only the contract freelancer can submit milestones';
  END IF;

  IF v_status NOT IN ('in_progress', 'rejected') THEN
    RAISE EXCEPTION 'Cannot submit milestone from status: %', v_status;
  END IF;

  UPDATE milestones
  SET status = 'submitted', updated_at = now()
  WHERE id = p_milestone_id;
END;
$$;

-- ============================================================
-- approve_milestone: client approves, triggers payment record,
-- auto-completes contract if this was the last milestone
-- ============================================================
CREATE OR REPLACE FUNCTION approve_milestone(
  p_milestone_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id UUID;
  v_freelancer_id UUID;
  v_status TEXT;
  v_amount INTEGER;
  v_contract_id UUID;
  v_remaining_count INTEGER;
BEGIN
  SELECT c.client_id, c.freelancer_id, m.status, m.amount, c.id
  INTO v_client_id, v_freelancer_id, v_status, v_amount, v_contract_id
  FROM milestones m
  JOIN contracts c ON c.id = m.contract_id
  WHERE m.id = p_milestone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  IF v_client_id != p_user_id THEN
    RAISE EXCEPTION 'Only the contract client can approve milestones';
  END IF;

  IF v_status != 'submitted' THEN
    RAISE EXCEPTION 'Milestone must be submitted before approval';
  END IF;

  -- Approve the milestone
  UPDATE milestones
  SET status = 'approved', updated_at = now()
  WHERE id = p_milestone_id;

  -- Record the payment (payment will be fulfilled via Stripe later)
  INSERT INTO payments (
    contract_id, milestone_id, amount, type, status, metadata
  ) VALUES (
    v_contract_id,
    p_milestone_id,
    v_amount,
    'release',
    'pending',
    jsonb_build_object('note', 'Pending Stripe Connect transfer')
  );

  -- Check if all milestones are approved → complete contract
  SELECT COUNT(*) INTO v_remaining_count
  FROM milestones
  WHERE contract_id = v_contract_id
    AND status != 'approved';

  IF v_remaining_count = 0 THEN
    UPDATE contracts
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = v_contract_id;
  END IF;
END;
$$;

-- ============================================================
-- reject_milestone: client sends back for changes
-- ============================================================
CREATE OR REPLACE FUNCTION reject_milestone(
  p_milestone_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id UUID;
  v_status TEXT;
BEGIN
  SELECT c.client_id, m.status
  INTO v_client_id, v_status
  FROM milestones m
  JOIN contracts c ON c.id = m.contract_id
  WHERE m.id = p_milestone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  IF v_client_id != p_user_id THEN
    RAISE EXCEPTION 'Only the contract client can reject milestones';
  END IF;

  IF v_status != 'submitted' THEN
    RAISE EXCEPTION 'Only submitted milestones can be rejected';
  END IF;

  UPDATE milestones
  SET status = 'rejected', updated_at = now()
  WHERE id = p_milestone_id;
END;
$$;