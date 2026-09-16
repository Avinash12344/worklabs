import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createProposalSchema } from '@worklabs/shared';
import { emailQueue } from '../lib/queues.js';

const router = Router();

// ============================================================
// POST /api/proposals — freelancer submits a proposal
// ============================================================
router.post(
  '/',
  requireAuth,
  requireRole('freelancer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');

      const parsed = createProposalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { job_id, cover_letter, bid_amount } = parsed.data;

      // 1. Verify the job exists and is open
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('id', job_id)
        .is('deleted_at', null)
        .maybeSingle();

      if (jobError) throw new Error(`Supabase: ${jobError.message}`);
      if (!job) throw new HttpError(404, 'Job not found');
      if (job.status !== 'open') {
        throw new HttpError(400, 'This job is no longer accepting proposals');
      }

      // 2. Insert proposal
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          job_id,
          freelancer_id: req.user.id,
          cover_letter,
          bid_amount,
        })
        .select()
        .single();


      if (error) {
        // Unique constraint: freelancer already applied
        if (error.code === '23505') {
          throw new HttpError(409, 'You have already applied to this job');
        }
        throw new Error(`Supabase: ${error.message}`);
      }

      res.status(201).json({ proposal: data });
    } catch (err) {
      next(err);
    }

    / After res.status(201).json({ proposal: data }), or before:
// Fetch client info
const { data: job } = await supabase
  .from('jobs')
  .select('title, client:users!jobs_client_id_fkey ( email, full_name )')
  .eq('id', job_id)
  .single();

const { data: freelancer } = await supabase
  .from('users')
  .select('full_name')
  .eq('id', req.user.id)
  .single();

if (job && freelancer) {
  const client = job.client as { email: string; full_name: string } | null;
  if (client) {
    await emailQueue.add('proposal_received', {
      to: client.email,
      subject: `New proposal on "${job.title}"`,
      template: 'proposal_received',
      data: {
        clientName: client.full_name,
        jobTitle: job.title,
        freelancerName: freelancer.full_name,
        bidAmount: bid_amount,
        jobId: job_id,
      },
    });
  }
}
  }
);

// ============================================================
// GET /api/proposals/me — freelancer's own proposals
// ============================================================
router.get(
  '/me',
  requireAuth,
  requireRole('freelancer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');

      const { data, error } = await supabase
        .from('proposals')
        .select(
          `
          id, cover_letter, bid_amount, status, created_at,
          job:jobs!proposals_job_id_fkey (
            id, title, status, budget_min, budget_max,
            client:users!jobs_client_id_fkey ( id, full_name, avatar_url )
          )
        `
        )
        .eq('freelancer_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.json({ proposals: data, count: data?.length ?? 0 });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /api/proposals/:id — single proposal (both parties can see)
// ============================================================
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { data, error } = await supabase
        .from('proposals')
        .select(
          `
          id, cover_letter, bid_amount, status, created_at,
          job:jobs!proposals_job_id_fkey (
            id, title, client_id,
            client:users!jobs_client_id_fkey ( id, full_name, avatar_url )
          ),
          freelancer:users!proposals_freelancer_id_fkey (
            id, full_name, avatar_url
          )
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(`Supabase: ${error.message}`);
      if (!data) throw new HttpError(404, 'Proposal not found');

      // Only the job's client or the freelancer who submitted can view it
      const isClient = (data as any).job?.client_id === req.user.id;
      const isFreelancer = (data as any).freelancer?.id === req.user.id;
      if (!isClient && !isFreelancer) {
        throw new HttpError(403, 'You cannot view this proposal');
      }

      res.json({ proposal: data });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/proposals/:id/accept — client accepts a proposal
// ============================================================
router.post(
  '/:id/accept',
  requireAuth,
  requireRole('client'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { data: contractId, error } = await supabase.rpc('accept_proposal', {
        p_proposal_id: id,
        p_user_id: req.user.id,
      });

      if (error) {
        // Postgres RAISE EXCEPTION messages come through here
        throw new HttpError(400, error.message);
      }

      res.json({
        success: true,
        contract_id: contractId,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;