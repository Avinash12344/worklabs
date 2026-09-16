import { Router, Request, Response, NextFunction } from 'express';
import { stripe } from '../lib/stripe.js';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ============================================================
// POST /api/connect/onboard — create account + return onboarding link
// ============================================================
router.post(
  '/onboard',
  requireAuth,
  requireRole('freelancer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');

      // 1. Fetch current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id, stripe_account_id, stripe_onboarding_complete')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (fetchError) throw new Error(`Supabase: ${fetchError.message}`);

      let accountId = profile?.stripe_account_id;

      // 2. If no account yet, create one
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: req.user.email,
          capabilities: {
            transfers: { requested: true },
          },
          metadata: { user_id: req.user.id },
        });
        accountId = account.id;

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: req.user.id,
              stripe_account_id: accountId,
              stripe_onboarding_complete: false,
            },
            { onConflict: 'user_id' }
          );

        if (upsertError) throw new Error(`Supabase: ${upsertError.message}`);
      }

      // 3. Create an onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${APP_URL}/dashboard?stripe=refresh`,
        return_url: `${APP_URL}/dashboard?stripe=done`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /api/connect/status — is the freelancer ready to receive money?
// ============================================================
router.get(
  '/status',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, 'Not authenticated');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (error) throw new Error(`Supabase: ${error.message}`);

      if (!profile?.stripe_account_id) {
        return res.json({
          connected: false,
          onboarding_complete: false,
        });
      }

      // Live check with Stripe (account might have changed since last webhook)
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);

      const isReady = Boolean(
        account.charges_enabled && account.payouts_enabled
      );

      // Sync our DB if it differs
      if (isReady !== profile.stripe_onboarding_complete) {
        await supabase
          .from('profiles')
          .update({ stripe_onboarding_complete: isReady })
          .eq('user_id', req.user.id);
      }

      res.json({
        connected: true,
        onboarding_complete: isReady,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;