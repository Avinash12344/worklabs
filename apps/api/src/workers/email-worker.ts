import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis.js';
import { resend, EMAIL_FROM } from '../lib/resend.js';
import { renderTemplate } from '../emails/index.js';
import type { EmailJobData } from '../lib/queues.js';
import { logger } from '../lib/logger.js';

async function processEmail(job: Job<EmailJobData>) {
  const { to, subject, template, data } = job.data;

  logger.info(`[worker] sending ${template} → ${to}`);

  const rendered = await renderTemplate(template, data);

  const { data: result, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: subject || rendered.subject,
    html: rendered.html,
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }

  logger.info(`[worker] sent ${template} to ${to} (id: ${result?.id})`);
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>('email', processEmail, {
    connection: redis,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info(`[worker] job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[worker] job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('[worker] error:', err);
  });

  logger.info('[worker] email worker started');
  return worker;
}