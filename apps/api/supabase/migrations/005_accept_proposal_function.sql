-- ============================================================
-- Migration: 005_accept_proposal_function
-- Description: Atomic function to accept a proposal
-- Created: <today's date>
-- ============================================================

CREATE OR REPLACE FUNCTION accept_proposal(
  p_proposal_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id UUID;
  v_client_id UUID;
  v_freelancer_id UUID;
  v_bid_amount INTEGER;
  v_contract_id UUID;
BEGIN
  -- 1. Fetch the proposal + its job + verify client owns it
  SELECT
    p.job_id,
    p.freelancer_id,
    p.bid_amount,
    j.client_id
  INTO v_job_id, v_freelancer_id, v_bid_amount, v_client_id
  FROM proposals p
  JOIN jobs j ON j.id = p.job_id
  WHERE p.id = p_proposal_id
    AND p.status = 'pending'
    AND j.deleted_at IS NULL;

  -- If nothing found, raise exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found or not pending';
  END IF;

  -- 2. Verify the caller is the client on this job
  IF v_client_id != p_user_id THEN
    RAISE EXCEPTION 'Only the job client can accept proposals';
  END IF;

  -- 3. Mark accepted proposal
  UPDATE proposals
  SET status = 'accepted', updated_at = now()
  WHERE id = p_proposal_id;

  -- 4. Reject all other pending proposals on the job
  UPDATE proposals
  SET status = 'rejected', updated_at = now()
  WHERE job_id = v_job_id
    AND id != p_proposal_id
    AND status = 'pending';

  -- 5. Create the contract
  INSERT INTO contracts (
    job_id, proposal_id, client_id, freelancer_id, total_amount, status
  )
  VALUES (
    v_job_id, p_proposal_id, v_client_id, v_freelancer_id, v_bid_amount, 'active'
  )
  RETURNING id INTO v_contract_id;

  -- 6. Update job status
  UPDATE jobs
  SET status = 'in_progress', updated_at = now()
  WHERE id = v_job_id;

  RETURN v_contract_id;
END;
$$;