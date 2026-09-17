import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';
import { createReviewSchema } from '@worklabs/shared';
import { createNotification } from '../lib/notifications.js';

const router = Router();

// ============================================================
// POST /api/reviews — submit a review for a completed contract
// ============================================================
router.post(
  '/reviews',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');

      const parsed = createReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }
      const { contract_id, rating, comment } = parsed.data;

      // 1. Fetch contract and verify party + status
      const { data: contract, error: cErr } = await supabase
        .from('contracts')
        .select('id, status, client_id, freelancer_id')
        .eq('id', contract_id)
        .maybeSingle();

      if (cErr) throw new Error(`Supabase: ${cErr.message}`);
      if (!contract) throw new HttpError(404, 'Contract not found');

      const isClient = contract.client_id === req.user.id;
      const isFreelancer = contract.freelancer_id === req.user.id;

      if (!isClient && !isFreelancer) {
        throw new HttpError(403, 'You are not a party to this contract');
      }
      if (contract.status !== 'completed') {
        throw new HttpError(400, 'You can only review completed contracts');
      }

      const revieweeId = isClient ? contract.freelancer_id : contract.client_id;

      // 2. Insert the review
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          contract_id,
          reviewer_id: req.user.id,
          reviewee_id: revieweeId,
          rating,
          comment: comment ?? null,
        })
        .select(
          `
          id, rating, comment, created_at,
          reviewer:users!reviews_reviewer_id_fkey ( id, full_name, avatar_url )
        `
        )
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new HttpError(409, 'You have already reviewed this contract');
        }
        throw new Error(`Supabase: ${error.message}`);
      }
// Fetch reviewer's name for the notification
const { data: reviewer } = await supabase
  .from('users')
  .select('full_name')
  .eq('id', req.user.id)
  .single();

await createNotification({
  userId: revieweeId,
  type: 'review_received',
  payload: {
    contract_id,
    reviewer_id: req.user.id,
    reviewer_name: reviewer?.full_name ?? 'Someone',
    rating,
  },
});
      res.status(201).json({ review: data });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /api/users/:userId/reviews — public reviews for a user
// ============================================================
router.get(
  '/users/:userId/reviews',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          id, rating, comment, created_at,
          reviewer:users!reviews_reviewer_id_fkey ( id, full_name, avatar_url ),
          contract:contracts!reviews_contract_id_fkey (
            id,
            job:jobs!contracts_job_id_fkey ( id, title )
          )
        `
        )
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw new Error(`Supabase: ${error.message}`);

      const reviews = data ?? [];
      const total = reviews.length;
      const average =
        total === 0
          ? null
          : Math.round(
              (reviews.reduce((s, r) => s + r.rating, 0) / total) * 10
            ) / 10;

      res.json({ reviews, total, average });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /api/contracts/:contractId/reviews — reviews on a contract
// ============================================================
router.get(
  '/contracts/:contractId/reviews',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { contractId } = req.params;

      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          id, rating, comment, created_at, reviewer_id, reviewee_id,
          reviewer:users!reviews_reviewer_id_fkey ( id, full_name, avatar_url )
        `
        )
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.json({ reviews: data ?? [] });
    } catch (err) {
      next(err);
    }
  }
);

export default router;