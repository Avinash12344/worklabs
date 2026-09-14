import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import {
  createJobSchema,
  updateJobSchema,
} from "@worklabs/shared";
import {requireAuth} from "../middleware/auth.js"

const router = Router();

// ============================================================
// GET /api/jobs — list jobs
// ============================================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'open';

    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        id, title, description, budget_min, budget_max, status, deadline, created_at,
        client:users!jobs_client_id_fkey ( id, full_name, avatar_url )
      `
      )
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(`Supabase: ${error.message}`);

    res.json({ jobs: data, count: data?.length ?? 0 });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/jobs/:id — single job
// ============================================================
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        id, title, description, budget_min, budget_max, status, deadline, created_at, updated_at,
        client:users!jobs_client_id_fkey ( id, full_name, avatar_url )
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data) throw new HttpError(404, 'Job not found');

    res.json({ job: data });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/jobs — create job
// ============================================================
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');

    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...parsed.data,
        client_id: req.user.id,   // ← TRUSTED source
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase: ${error.message}`);

    res.status(201).json({ job: data });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /api/jobs/:id — update job
// ============================================================
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const { id } = req.params;

    // First, verify the job belongs to this user
    const { data: existing, error: fetchError } = await supabase
      .from('jobs')
      .select('client_id')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) throw new Error(`Supabase: ${fetchError.message}`);
    if (!existing) throw new HttpError(404, 'Job not found');
    if (existing.client_id !== req.user.id) {
      throw new HttpError(403, 'You can only update your own jobs');
    }

    const parsed = updateJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    if (Object.keys(parsed.data).length === 0) {
      throw new HttpError(400, 'No valid fields to update');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(`Supabase: ${error.message}`);

    res.json({ job: data });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// DELETE /api/jobs/:id — soft delete
// ============================================================
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('jobs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data) throw new HttpError(404, 'Job not found');

    res.json({ success: true, id: data.id });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/jobs/:id/proposals — client views proposals on their job
// ============================================================
router.get(
  '/:id/proposals',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      // Verify ownership
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('client_id')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (jobError) throw new Error(`Supabase: ${jobError.message}`);
      if (!job) throw new HttpError(404, 'Job not found');
      if (job.client_id !== req.user.id) {
        throw new HttpError(403, 'You can only view proposals on your own jobs');
      }

      const { data, error } = await supabase
        .from('proposals')
        .select(
          `
          id, cover_letter, bid_amount, status, created_at,
          freelancer:users!proposals_freelancer_id_fkey (
            id, full_name, avatar_url
          )
        `
        )
        .eq('job_id', id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.json({ proposals: data, count: data?.length ?? 0 });
    } catch (err) {
      next(err);
    }
  }
);

export default router;