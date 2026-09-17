import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';
import { sendMessageSchema } from '@worklabs/shared';
import { createNotification } from '../lib/notifications.js';

const router = Router();

/**
 * Verify the current user is a party (client or freelancer) on a contract.
 * Throws 403 if not.
 */
async function assertContractParty(contractId: string, userId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('client_id, freelancer_id')
    .eq('id', contractId)
    .maybeSingle();

  if (error) throw new Error(`Supabase: ${error.message}`);
  if (!data) throw new HttpError(404, 'Contract not found');

  if (data.client_id !== userId && data.freelancer_id !== userId) {
    throw new HttpError(403, 'You are not a party to this contract');
  }
  return data;
}

// ============================================================
// GET /api/contracts/:contractId/messages — chat history
// ============================================================
router.get(
  '/contracts/:contractId/messages',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { contractId } = req.params;

      await assertContractParty(contractId, req.user.id);

      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          id, content, created_at, read_at, sender_id,
          sender:users!messages_sender_id_fkey ( id, full_name, avatar_url )
        `
        )
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw new Error(`Supabase: ${error.message}`);
// Determine recipient (the other party)
      res.json({ messages: data ?? [] });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/contracts/:contractId/messages — send message
// ============================================================
router.post(
  '/contracts/:contractId/messages',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { contractId } = req.params;

     const contract = await assertContractParty(contractId, req.user.id);

      const parsed = sendMessageSchema.safeParse(req.body);   // ← parsed defined here
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }


      const { data, error } = await supabase
        .from('messages')
        .insert({
          contract_id: contractId,
          sender_id: req.user.id,
          content: parsed.data.content,
        })
        .select(
          `
          id, content, created_at, read_at, sender_id,
          sender:users!messages_sender_id_fkey ( id, full_name, avatar_url )
        `
        )
        .single();

      if (error) throw new Error(`Supabase: ${error.message}`);
 const recipientId =
        contract.client_id === req.user.id
          ? contract.freelancer_id
          : contract.client_id;

      const { data: sender } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', req.user.id)
        .single();

      await createNotification({
        userId: recipientId,
        type: 'message_received',
        payload: {
          contract_id: contractId,
          sender_id: req.user.id,
          sender_name: sender?.full_name ?? 'Someone',
          preview: parsed.data.content.slice(0, 100),
        },
      });

      res.status(201).json({ message: data });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/contracts/:contractId/messages/read — mark all read
// ============================================================
router.post(
  '/contracts/:contractId/messages/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { contractId } = req.params;

      await assertContractParty(contractId, req.user.id);

      // Mark messages from the *other party* as read
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('contract_id', contractId)
        .neq('sender_id', req.user.id)
        .is('read_at', null);

      if (error) throw new Error(`Supabase: ${error.message}`);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;