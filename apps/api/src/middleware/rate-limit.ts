import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis.js';

type RateLimitOptions = {
  /** Unique identifier for this limiter (e.g., 'login', 'jobs-list') */
  name: string;
  /** Max tokens in the bucket */
  capacity: number;
  /** Tokens added per second */
  refillRate: number;
  /** How to identify the caller: IP or user ID */
  keyBy?: 'ip' | 'user';
};

export function rateLimit(options: RateLimitOptions) {
  const { name, capacity, refillRate, keyBy = 'ip' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Identify the caller
      const identifier =
        keyBy === 'user' && req.user
          ? `user:${req.user.id}`
          : `ip:${req.ip ?? 'unknown'}`;

      const key = `ratelimit:${name}:${identifier}`;
      const now = Date.now();

      // 2. Fetch current bucket state from Redis
      // We store: { tokens: number, lastRefill: timestamp }
      const bucketRaw = await redis.get(key);
      let tokens = capacity;
      let lastRefill = now;

      if (bucketRaw) {
        const parsed = JSON.parse(bucketRaw) as {
          tokens: number;
          lastRefill: number;
        };
        tokens = parsed.tokens;
        lastRefill = parsed.lastRefill;
      }

      // 3. Refill tokens based on elapsed time
      const elapsedSeconds = (now - lastRefill) / 1000;
      tokens = Math.min(capacity, tokens + elapsedSeconds * refillRate);

      // 4. Check if we have a token
      if (tokens < 1) {
        const retryAfter = Math.ceil((1 - tokens) / refillRate);
        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', capacity.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', (now + retryAfter * 1000).toString());

        return res.status(429).json({
          error: 'Too many requests',
          retryAfterSeconds: retryAfter,
        });
      }

      // 5. Consume a token and save back to Redis
      tokens -= 1;
      const ttl = Math.ceil((capacity / refillRate) * 2); // Keep it 2x the full refill time
      await redis.set(
        key,
        JSON.stringify({ tokens, lastRefill: now }),
        'EX',
        ttl
      );

      // 6. Add informational headers and continue
      res.setHeader('X-RateLimit-Limit', capacity.toString());
      res.setHeader('X-RateLimit-Remaining', Math.floor(tokens).toString());

      next();
    } catch (err) {
      // IMPORTANT: never fail the request due to rate limiter bugs.
      // If Redis is down, let traffic through. Better slow than down.
      console.error('[rate-limit] error:', err);
      next();
    }
  };
}