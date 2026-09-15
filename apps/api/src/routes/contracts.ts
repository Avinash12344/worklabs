import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// GET /api/contracts — all contracts for current user
// ============================================================
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');

    const { data, error } = await supabase
      .from('contracts')
      .select(
        `
        id, total_amount, status, started_at, completed_at,
        job:jobs!contracts_job_id_fkey ( id, title ),
        client:users!contracts_client_id_fkey ( id, full_name, avatar_url ),
        freelancer:users!contracts_freelancer_id_fkey ( id, full_name, avatar_url )
      `
      )
      .or(`client_id.eq.${req.user.id},freelancer_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase: ${error.message}`);

    res.json({ contracts: data, count: data?.length ?? 0 });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/contracts/:id — single contract (party-only)
// ============================================================
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const { id } = req.params;

    const { data, error } = await supabase
      .from('contracts')
      .select(
        `
        id, total_amount, status, started_at, completed_at,
        job:jobs!contracts_job_id_fkey ( id, title, description ),
        proposal:proposals!contracts_proposal_id_fkey ( id, cover_letter, bid_amount ),
        client:users!contracts_client_id_fkey ( id, full_name, avatar_url ),
        freelancer:users!contracts_freelancer_id_fkey ( id, full_name, avatar_url )
      `
      )
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data) throw new HttpError(404, 'Contract not found');

    // Only client or freelancer on this contract can view
    const isParty =
      (data as any).client.id === req.user.id ||
      (data as any).freelancer.id === req.user.id;
    if (!isParty) throw new HttpError(403, 'You are not a party to this contract');

    res.json({ contract: data });
  } catch (err) {
    next(err);
  }
});

export default router;