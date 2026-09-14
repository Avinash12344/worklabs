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