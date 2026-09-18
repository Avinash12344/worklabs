import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe.js';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

const router = Router();

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ============================================================
// POST /api/webhooks/stripe
// ============================================================
router.post(
  '/stripe',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!WEBHOOK_SECRET) {
        throw new Error('Missing STRIPE_WEBHOOK_SECRET');
      }

      const signature = req.headers['stripe-signature'];
      if (!signature || typeof signature !== 'string') {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      // req.body is a Buffer here because we mounted express.raw() for this route
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          WEBHOOK_SECRET
        );
      } catch (err) {
        logger.error('[webhook] signature verification failed:', err);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      logger.info(`[webhook] received: ${event.type} (${event.id})`);

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentSucceeded(pi);
          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentFailed(pi);
          break;
        }
        case 'account.updated': {
  const account = event.data.object as Stripe.Account;
  await handleAccountUpdated(account);
  break;
}
        default:
          // Ignore other events
          break;
      }

      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// Event handlers
// ============================================================
async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      stripe_charge_id: typeof pi.latest_charge === 'string' ? pi.latest_charge : null,
    })
    .eq('stripe_payment_intent_id', pi.id);

  if (error) {
    logger.error('[webhook] failed to update payment:', error);
    throw new Error(`Supabase: ${error.message}`);
  }

  logger.info(`[webhook] payment succeeded: ${pi.id}`);
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const reason =
    pi.last_payment_error?.message ??
    pi.last_payment_error?.code ??
    'Unknown failure';

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      failure_reason: reason,
    })
    .eq('stripe_payment_intent_id', pi.id);

  if (error) {
    logger.error('[webhook] failed to update failed payment:', error);
    throw new Error(`Supabase: ${error.message}`);
  }

  logger.info(`[webhook] payment failed: ${pi.id} — ${reason}`);
}

async function handleAccountUpdated(account: Stripe.Account) {
  const isReady = Boolean(
    account.charges_enabled && account.payouts_enabled
  );

  const { error } = await supabase
    .from('profiles')
    .update({ stripe_onboarding_complete: isReady })
    .eq('stripe_account_id', account.id);

  if (error) {
    logger.error('[webhook] failed to update profile:', error);
    throw new Error(`Supabase: ${error.message}`);
  }

  logger.info(`[webhook] account ${account.id} ready: ${isReady}`);
}

export default router;