import { logger } from "../lib/logger.js";
import { redis } from './redis.js';

const DEFAULT_TTL_SECONDS = 60;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error(`[cache] get failed for ${key}:`, err);
    return null; // Cache failure should never break the request
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.error(`[cache] set failed for ${key}:`, err);
    // Swallow — cache failures are non-fatal
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    logger.error(`[cache] del failed:`, err);
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.error(`[cache] delPattern failed for ${pattern}:`, err);
  }
}