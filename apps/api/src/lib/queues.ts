import { Queue } from 'bullmq';
import { redis } from './redis.js';

export type EmailJobData = {
  to: string;
  subject: string;
  template: string;      // 'welcome' | 'milestone_approved' | etc.
  data: Record<string, unknown>;
};

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 },
  },
});