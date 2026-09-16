import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error('Missing REDIS_URL environment variable');
}

// BullMQ requires maxRetriesPerRequest: null on the connection
// Otherwise it throws when the connection temporarily drops
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    // This option is often needed to prevent SSL errors with Upstash.
    // It tells ioredis to accept the certificate chain provided by Upstash.
    rejectUnauthorized: false,
  },
});