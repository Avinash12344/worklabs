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