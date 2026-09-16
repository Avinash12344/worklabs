# Known Issues

## 1. Signup orphan risk
If `supabase.auth.signUp` succeeds but inserting into `public.users` fails,
the auth user is orphaned. Fix: use the Supabase admin API to delete the
auth user on failure, or make login self-heal missing profiles.

## 2. Manual updated_at
`updated_at` is set manually in PATCH routes. If someone forgets,
it goes stale. Fix: use a Postgres trigger to auto-update.

## 3. No refresh token rotation
The API returns a refresh_token but doesn't handle rotation yet.
We'll add this when the frontend needs it.

## 4. JWT stored in localStorage
Currently the frontend stores the JWT in localStorage, which is vulnerable
to XSS. Before production, migrate to httpOnly cookies with CSRF protection
(SameSite=Lax, CSRF token, or a SameSite=Strict cookie for the refresh token).

## 5. RLS disabled on all tables (development)
Row Level Security is currently disabled on all public tables. The backend
uses service_role which bypasses RLS, so RLS isn't providing protection right
now. Before production:
- Enable RLS on all tables
- Write policies for authenticated users
- Test that anon-key access cannot read/write forbidden data

## 6. Idempotency key missing on fund endpoint
If a client clicks "Fund" twice and both PaymentIntents succeed, we charge
them twice. Fix: check for a `pending` escrow_hold payment before creating a
new intent, or use a Stripe idempotency key.

## 7. Webhook idempotency not enforced
If Stripe sends the same event twice (network retries), our UPDATE is safe
(naturally idempotent), but future handlers that increment counters or send
emails will need a `webhook_events` table with a unique constraint.

## 8. No Connect onboarding yet
Freelancers cannot receive payments until they complete Stripe Connect
Express onboarding. Session Day 5 Part 3 covers this.

## 9. No retry for failed transfers
If a transfer fails (e.g., freelancer not onboarded), we mark the payment
`failed` but don't automatically retry. Add: a cron job or admin endpoint
that scans for `failed` payments with `type='release'` and retries them.

## 10. No webhook for transfer.created
We update `payments.stripe_transfer_id` synchronously after calling Stripe.
If we crash between the Stripe call and the DB update, we lose track.
Fix: handle `transfer.created` webhook to update the record authoritatively.

## 11. No SCA / 3DS handling for transfers
Transfers to some accounts may require SCA. Not handled yet.

## 14. Stripe Connect is not available for Indian platforms
Stripe Connect (and its Express onboarding) is not available for platforms
registered in India. Our test platform is registered in the US, so we create
US-based test connected accounts. For a production application targeting India,
we must migrate to a payment provider that supports Indian marketplaces, such
as Razorpay or Cashfree.

## 15. Cache invalidation is pattern-based
We use `cacheDelPattern('jobs:list:*')` with Redis KEYS. In production with
many keys this blocks Redis (O(N)). Fix: use SCAN with cursor iteration, or
track keys in a Redis set for targeted deletion.