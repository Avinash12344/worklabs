import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';

// Augment Express's Request type so `req.user` is typed
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Not authenticated'));
    }

    supabase
      .from('users')
      .select('role, banned_at')
      .eq('id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return next(new Error(`Supabase: ${error.message}`));
        if (!data) return next(new HttpError(404, 'User not found'));

        if (data.banned_at) {
          return next(new HttpError(403, 'Your account has been suspended'));
        }

        if (!allowedRoles.includes(data.role)) {
          return next(
            new HttpError(403, `This action requires one of: ${allowedRoles.join(', ')}`)
          );
        }

        next();
      })
      .catch(next);
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new HttpError(401, 'Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Invalid Authorization header format');
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new HttpError(401, 'Invalid or expired token');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? '',
    };

    next();
  } catch (err) {
    next(err);
  }
}