import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import {
  createJobSchema,
  updateJobSchema,
} from "@worklabs/shared";
import {requireAuth} from "../middleware/auth.js";
import { cacheGet, cacheSet, cacheDelPattern } from '../lib/cache.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { haversineKm } from '../lib/geo.js';

const router = Router();

const createJobLimiter = rateLimit({
  name: 'create-job',
  capacity: 30,
  refillRate: 1 / 120, // 1 per 2 minutes
  keyBy: 'user',       // per user, not per IP
});

// ============================================================
// GET /api/jobs — list jobs
// ============================================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'open';
    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    const radiusKm = req.query.radius_km ? Number(req.query.radius_km) : null;

    const cacheKey = `jobs:list:status=${status}:limit=20:lat=${lat ?? ''}:lng=${lng ?? ''}:r=${radiusKm ?? ''}`;

    const cached = await cacheGet<{ jobs: unknown[]; count: number }>(cacheKey);
    if (cached) {
      console.log(`[cache] HIT ${cacheKey}`);
      return res.json(cached);
    }
    console.log(`[cache] MISS ${cacheKey}`);

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id, title, description, budget_min, budget_max, status, deadline, created_at,
        location, latitude, longitude,
        client:users!jobs_client_id_fkey ( id, full_name, avatar_url )
      `)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100); // fetch more, filter down

    if (error) throw new Error(`Supabase: ${error.message}`);

    let jobs = data ?? [];

    // Apply distance filter if requested
    if (lat !== null && lng !== null && radiusKm !== null) {
      jobs = jobs.filter((job) => {
        if (job.latitude == null || job.longitude == null) return false;
        const distance = haversineKm(lat, lng, job.latitude, job.longitude);
        (job as any).distance_km = Math.round(distance * 10) / 10;
        return distance <= radiusKm;
      });
    }

    // Sort by distance if filtering
    if (lat !== null && lng !== null && radiusKm !== null) {
      jobs.sort((a, b) => (a as any).distance_km - (b as any).distance_km);
    }

    const limited = jobs.slice(0, 20);
    const payload = { jobs: limited, count: limited.length };

    await cacheSet(cacheKey, payload, 60);

    res.json(payload);
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
    const cacheKey = `jobs:detail:${id}`;

    const cached = await cacheGet<{ job: unknown }>(cacheKey);
    if (cached) {
      console.log(`[cache] HIT ${cacheKey}`);
      return res.json(cached);
    }
    console.log(`[cache] MISS ${cacheKey}`);

    const { data, error } = await supabase
      .from('jobs')
      .select(`
  id, title, description, budget_min, budget_max, status, deadline, created_at,
  location, latitude, longitude,
  client:users!jobs_client_id_fkey ( id, full_name, avatar_url )
`)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data) throw new HttpError(404, 'Job not found');


    const payload = { job: data };
    await cacheSet(cacheKey, payload, 120); // 2 min TTL for detail

    res.json({ job: data });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/jobs — create job
// ============================================================
router.post('/', requireAuth, createJobLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

    await cacheDelPattern('jobs:list:*');
    
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

    await cacheDel(`jobs:detail:${id}`);
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