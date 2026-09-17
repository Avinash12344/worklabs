import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAuth } from '../lib/supabase-auth.js';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';
import { emailQueue } from '../lib/queues.js';
import { rateLimit } from '../middleware/rate-limit.js';

const router = Router();

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().trim().min(2).max(100),
  role: z.enum(['client', 'freelancer']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const loginLimiter = rateLimit({
  name: 'login',
  capacity: 5,
  refillRate: 1 / 180, // 1 token every 3 minutes
});

const signupLimiter = rateLimit({
  name: 'signup',
  capacity: 3,
  refillRate: 1 / 3600, // 1 per hour
});

// ============================================================
// POST /api/auth/signup
// ============================================================
router.post('/signup', signupLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const { email, password, full_name, role } = parsed.data;

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
    });

    if (authError) throw new HttpError(400, authError.message);
    if (!authData.user) throw new HttpError(500, 'User creation failed');

    // 2. Create our public.users row with the same id
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      role,
      full_name,
    });


    if (profileError) {
      // Rollback: delete the auth user so we don't have orphans
      // (Supabase admin API needed — we'll improve this later)
      throw new HttpError(500, `Failed to create profile: ${profileError.message}`);
    }


    // Queue welcome email (fire-and-forget)
await emailQueue.add('welcome', {
  to: email,
  subject: 'Welcome to WorkLabs',
  template: 'welcome',
  data: { fullName: full_name, role },
});

    res.status(201).json({
      user: {
        id: authData.user.id,
        email,
        role,
        full_name,
      },
      session: authData.session,
    });
  } catch (err) {
    next(err);
  }

  
});

// ============================================================
// GET /api/users/:id/public — public profile (no auth required)
// ============================================================
router.get(
  '/users/:id/public',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, avatar_url, created_at')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw new Error(`Supabase: ${error.message}`);
      if (!data) throw new HttpError(404, 'User not found');

      res.json({ user: data });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /api/auth/login
// ============================================================
router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const { email, password } = parsed.data;

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new HttpError(401, 'Invalid email or password');
    if (!data.session) throw new HttpError(500, 'No session returned');

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/auth/me — who am I?
// ============================================================
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, avatar_url, created_at')
      .eq('id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data) throw new HttpError(404, 'User profile not found');

    res.json({ user: data });
  } catch (err) {
    next(err);
  }
});

export default router;