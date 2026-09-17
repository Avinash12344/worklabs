import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDelPattern } from '../lib/cache.js';

const router = Router();

// Every route in this file requires an admin
router.use(requireAuth, requireRole('admin'));

// ============================================================
// GET /api/admin/stats — platform metrics
// ============================================================
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'admin:stats';
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) {
      console.log(`[cache] HIT ${cacheKey}`);
      return res.json(cached);
    }

    const { data, error } = await supabase
      .from('platform_stats')
      .select('*')
      .single();

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data) throw new HttpError(500, 'Failed to load stats');

    // Convert paise to display strings
    const payload = {
      users: {
        total: data.total_users,
        clients: data.total_clients,
        freelancers: data.total_freelancers,
        admins: data.total_admins,
        banned: data.banned_users,
      },
      jobs: {
        total: data.total_jobs,
        open: data.open_jobs,
        in_progress: data.in_progress_jobs,
      },
      contracts: {
        total: data.total_contracts,
        active: data.active_contracts,
        completed: data.completed_contracts,
        disputed: data.disputed_contracts,
      },
      money: {
        gross_volume_paise: data.gross_volume_paise,
        released_paise: data.released_paise,
      },
      activity: {
        proposals: data.total_proposals,
        reviews: data.total_reviews,
      },
    };

    await cacheSet(cacheKey, payload, 60);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/admin/users — list users with filters
// ============================================================
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const role = (req.query.role as string) || null;
    const banned = req.query.banned === 'true';

    let query = supabase
      .from('users')
      .select('id, email, role, full_name, avatar_url, created_at, banned_at, banned_reason')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
    if (role) query = query.eq('role', role);
    if (banned) query = query.not('banned_at', 'is', null);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase: ${error.message}`);

    res.json({ users: data ?? [] });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/admin/users/:id/ban — ban a user
// ============================================================
router.post('/users/:id/ban', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const { id } = req.params;
    const reason = (req.body?.reason as string) || null;

    if (id === req.user.id) {
      throw new HttpError(400, 'You cannot ban yourself');
    }

    const { error } = await supabase
      .from('users')
      .update({
        banned_at: new Date().toISOString(),
        banned_reason: reason,
      })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) throw new Error(`Supabase: ${error.message}`);

    await cacheDelPattern('admin:*');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/admin/users/:id/unban
// ============================================================
router.post('/users/:id/unban', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .update({ banned_at: null, banned_reason: null })
      .eq('id', id);

    if (error) throw new Error(`Supabase: ${error.message}`);

    await cacheDelPattern('admin:*');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/admin/contracts — list all contracts with filters
// ============================================================
router.get('/contracts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || null;

    let query = supabase
      .from('contracts')
      .select(`
        id, total_amount, status, started_at, completed_at,
        job:jobs!contracts_job_id_fkey ( id, title ),
        client:users!contracts_client_id_fkey ( id, full_name, email ),
        freelancer:users!contracts_freelancer_id_fkey ( id, full_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase: ${error.message}`);

    res.json({ contracts: data ?? [] });
  } catch (err) {
    next(err);
  }
});

export default router;