import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// GET /api/notifications — list current user's notifications
// ============================================================
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, payload, read_at, created_at')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw new Error(`Supabase: ${error.message}`);

      const unreadCount = (data ?? []).filter((n) => !n.read_at).length;

      res.json({
        notifications: data ?? [],
        unread_count: unreadCount,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/notifications/:id/read — mark one read
// ============================================================
router.post(
  '/:id/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', req.user.id)
        .is('read_at', null);

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/notifications/read-all — mark all read
// ============================================================
router.post(
  '/read-all',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', req.user.id)
        .is('read_at', null);

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;