import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';
import { stripe } from '../lib/stripe.js';

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
      .select(`
  id, total_amount, status, started_at, completed_at,
  job:jobs!contracts_job_id_fkey ( id, title, description ),
  proposal:proposals!contracts_proposal_id_fkey ( id, cover_letter, bid_amount ),
  client:users!contracts_client_id_fkey ( id, full_name, avatar_url ),
  freelancer:users!contracts_freelancer_id_fkey ( id, full_name, avatar_url ),
  milestones:milestones!milestones_contract_id_fkey (
    id, title, description, amount, status, order_index, due_date, created_at, updated_at
  )
`)
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

// ============================================================
// POST /api/contracts/:id/fund — client initiates payment
// ============================================================
router.post(
  '/:id/fund',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');
      const { id } = req.params;

      // 1. Fetch contract + verify ownership
      const { data: contract, error: fetchError } = await supabase
        .from('contracts')
        .select(
          `
          id, client_id, freelancer_id, total_amount, status,
          job:jobs!contracts_job_id_fkey ( title ),
          client:users!contracts_client_id_fkey ( email, full_name )
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw new Error(`Supabase: ${fetchError.message}`);
      if (!contract) throw new HttpError(404, 'Contract not found');
      if (contract.client_id !== req.user.id) {
        throw new HttpError(403, 'Only the contract client can fund it');
      }
      if (contract.status !== 'active') {
        throw new HttpError(400, 'Contract is not active');
      }

      // 2. Check if already funded
      const { data: existingPayment, error: existingError } = await supabase
        .from('payments')
        .select('id')
        .eq('contract_id', id)
        .eq('type', 'escrow_hold')
        .eq('status', 'succeeded')
        .maybeSingle();

      if (existingError) throw new Error(`Supabase: ${existingError.message}`);
      if (existingPayment) {
        throw new HttpError(400, 'Contract is already funded');
      }

      // 3. Get or create Stripe Customer for the client
      const clientRecord = contract.client as { email: string; full_name: string } | null;
      if (!clientRecord) throw new HttpError(500, 'Client data missing');

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('user_id', req.user.id)
        .maybeSingle();

      let customerId = profile?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: clientRecord.email,
          name: clientRecord.full_name,
          metadata: { user_id: req.user.id },
        });
        customerId = customer.id;

        await supabase.from('profiles').upsert(
          { user_id: req.user.id, stripe_customer_id: customerId },
          { onConflict: 'user_id' }
        );
      }

      // 4. Create the PaymentIntent (money will go to OUR Stripe balance)
      const jobRecord = contract.job as { title: string } | null;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: contract.total_amount,     // already in paise
        currency: 'inr',
        customer: customerId,
        description: `Escrow for contract: ${jobRecord?.title ?? id}`,
        metadata: {
          contract_id: id,
          client_id: req.user.id,
          freelancer_id: contract.freelancer_id,
          type: 'escrow_hold',
        },
        automatic_payment_methods: { enabled: true },
      });

      // 5. Record the pending payment in our DB
      await supabase.from('payments').insert({
        contract_id: id,
        amount: contract.total_amount,
        type: 'escrow_hold',
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        metadata: {
          client_id: req.user.id,
          freelancer_id: contract.freelancer_id,
        },
      });

      res.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;