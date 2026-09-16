import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
} from '@worklabs/shared';
import { emailQueue } from '../lib/queues.js';

const router = Router();

// ============================================================
// Helper: verify client owns the contract
// ============================================================
async function assertContractOwner(contractId: string, userId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('id, client_id, freelancer_id, total_amount, status')
    .eq('id', contractId)
    .maybeSingle();

  if (error) throw new Error(`Supabase: ${error.message}`);
  if (!data) throw new HttpError(404, 'Contract not found');
  if (data.client_id !== userId) {
    throw new HttpError(403, 'Only the contract client can do this');
  }
  return data;
}

// ============================================================
// POST /api/contracts/:contractId/milestones — client creates
// ============================================================
router.post(
  '/contracts/:contractId/milestones',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { contractId } = req.params;

      const contract = await assertContractOwner(contractId, req.user.id);
      if (contract.status !== 'active') {
        throw new HttpError(400, 'Contract is not active');
      }

      const parsed = createMilestoneSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      // Check total amount doesn't exceed contract total
      const { data: existing, error: sumError } = await supabase
        .from('milestones')
        .select('amount');

      if (sumError) throw new Error(`Supabase: ${sumError.message}`);

      // Get milestones specifically for this contract
      const { data: currentMilestones, error: currentError } = await supabase
        .from('milestones')
        .select('amount')
        .eq('contract_id', contractId);

      if (currentError) throw new Error(`Supabase: ${currentError.message}`);

      const existingSum = (currentMilestones ?? []).reduce(
        (sum, m) => sum + m.amount,
        0
      );
      const newTotal = existingSum + parsed.data.amount;

      if (newTotal > contract.total_amount) {
        throw new HttpError(
          400,
          `Total milestone amounts (₹${newTotal / 100}) would exceed contract amount (₹${contract.total_amount / 100})`
        );
      }

      // Get next order_index
      const { data: maxRow, error: maxError } = await supabase
        .from('milestones')
        .select('order_index')
        .eq('contract_id', contractId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxError) throw new Error(`Supabase: ${maxError.message}`);
      const nextIndex = maxRow ? maxRow.order_index + 1 : 0;

      const { data, error } = await supabase
        .from('milestones')
        .insert({
          contract_id: contractId,
          ...parsed.data,
          order_index: nextIndex,
        })
        .select()
        .single();

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.status(201).json({ milestone: data });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// PATCH /api/milestones/:id — client updates (only while pending)
// ============================================================
router.patch(
  '/milestones/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { data: ms, error: fetchError } = await supabase
        .from('milestones')
        .select('id, status, contract_id, amount')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw new Error(`Supabase: ${fetchError.message}`);
      if (!ms) throw new HttpError(404, 'Milestone not found');
      if (ms.status !== 'pending') {
        throw new HttpError(400, 'Only pending milestones can be edited');
      }

      await assertContractOwner(ms.contract_id, req.user.id);

      const parsed = updateMilestoneSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { data, error } = await supabase
        .from('milestones')
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.json({ milestone: data });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/milestones/:id/start — freelancer marks in_progress
// ============================================================
router.post(
  '/milestones/:id/start',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { data: ms, error: fetchError } = await supabase
        .from('milestones')
        .select('id, status, contract_id')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw new Error(`Supabase: ${fetchError.message}`);
      if (!ms) throw new HttpError(404, 'Milestone not found');

      const { data: contract, error: cError } = await supabase
        .from('contracts')
        .select('freelancer_id')
        .eq('id', ms.contract_id)
        .single();

      if (cError) throw new Error(`Supabase: ${cError.message}`);
      if (contract.freelancer_id !== req.user.id) {
        throw new HttpError(403, 'Only the contract freelancer can start');
      }
      if (ms.status !== 'pending') {
        throw new HttpError(400, 'Can only start pending milestones');
      }

      const { data, error } = await supabase
        .from('milestones')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Supabase: ${error.message}`);
      res.json({ milestone: data });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/milestones/:id/submit — freelancer submits for review
// ============================================================
router.post(
  '/milestones/:id/submit',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { error } = await supabase.rpc('submit_milestone', {
        p_milestone_id: id,
        p_user_id: req.user.id,
      });

      if (error) throw new HttpError(400, error.message);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/milestones/:id/approve — client approves
// ============================================================
router.post(
  '/milestones/:id/approve',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { error } = await supabase.rpc('approve_milestone', {
        p_milestone_id: id,
        p_user_id: req.user.id,
      });

      if (error) throw new HttpError(400, error.message);

      await attemptTransferForMilestone(id);

      

// After approve_milestone rpc:
const { data: ms } = await supabase
  .from('milestones')
  .select(`
    title, amount,
    contract:contracts!milestones_contract_id_fkey (
      id,
      freelancer:users!contracts_freelancer_id_fkey ( email, full_name )
    )
  `)
  .eq('id', id)
  .single();

if (ms) {
  const contract = ms.contract as any;
  const freelancer = contract?.freelancer;
  if (freelancer) {
    await emailQueue.add('milestone_approved', {
      to: freelancer.email,
      subject: `Milestone approved: ${ms.title}`,
      template: 'milestone_approved',
      data: {
        freelancerName: freelancer.full_name,
        milestoneTitle: ms.title,
        amount: ms.amount,
        contractId: contract.id,
      },
    });
  }
}
      res.json({ success: true });
    } catch (err) {
      next(err);
    }

   
  }
);

// ============================================================
// POST /api/milestones/:id/reject — client rejects
// ============================================================
router.post(
  '/milestones/:id/reject',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { error } = await supabase.rpc('reject_milestone', {
        p_milestone_id: id,
        p_user_id: req.user.id,
      });

      if (error) throw new HttpError(400, error.message);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

async function attemptTransferForMilestone(milestoneId: string) {
  // Fetch the pending release payment + freelancer account
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id, amount, status, stripe_transfer_id,
      milestone:milestones!payments_milestone_id_fkey (
        id, contract_id,
        contract:contracts!milestones_contract_id_fkey (
          id, freelancer_id,
          freelancer:users!contracts_freelancer_id_fkey (
            id,
            profile:profiles!profiles_user_id_fkey ( stripe_account_id )
          )
        )
      )
    `
    )
    .eq('milestone_id', milestoneId)
    .eq('type', 'release')
    .maybeSingle();

  if (error || !data) {
    console.error('[transfer] payment not found for milestone', milestoneId, error);
    return;
  }

  if (data.status !== 'pending' || data.stripe_transfer_id) {
    // Already done or in progress
    return;
  }

  const accountId = (data.milestone as any)?.contract?.freelancer?.profile?.stripe_account_id;
  if (!accountId) {
    await supabase
      .from('payments')
      .update({ failure_reason: 'Freelancer Stripe account not connected' })
      .eq('id', data.id);
    return;
  }

  // Create the Stripe Transfer
  try {
    const transfer = await stripe.transfers.create({
      amount: data.amount,
      currency: 'inr',
      destination: accountId,
      metadata: {
        payment_id: data.id,
        milestone_id: milestoneId,
      },
    });

    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        stripe_transfer_id: transfer.id,
      })
      .eq('id', data.id);

    console.log(`[transfer] ${data.id} → ${transfer.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transfer failed';
    console.error('[transfer] failed:', message);

    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: message,
      })
      .eq('id', data.id);
  }
}

export default router;