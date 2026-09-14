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