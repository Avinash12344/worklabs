import 'dotenv/config';
import { initSentry, Sentry } from './lib/sentry.js';
initSentry();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { HttpError } from './lib/http-error.js';
import jobsRouter from './routes/jobs.js';
import authRouter from "./routes/auth.js";
import proposalsRouter from './routes/proposals.js';
import contractsRouter from "./routes/contracts.js";
import milestonesRouter from './routes/milestones.js';
import webhooksRouter from './routes/webhooks.js';
import connectRouter from './routes/connect.js';
import { startEmailWorker } from './workers/email-worker.js';
import { rateLimit } from './middleware/rate-limit.js';
import messagesRouter from './routes/message.js';
import notificationsRouter from './routes/notifications.js';
import reviewsRouter from './routes/reviews.js';
import adminRouter from './routes/admin.js';
import { logger } from './lib/logger.js';
import { randomUUID } from 'crypto';


const app = express();
const PORT = Number(process.env.PORT) || 4000;

// ============================================================
// Middleware (order matters!)
// ============================================================
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));

// 2. RAW BODY for the Stripe webhook ONLY.
//    MUST come before express.json(), because the webhook signature
//    is computed over the raw bytes — parsed JSON breaks verification.
app.use(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' })
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).id = req.headers['x-request-id'] ?? randomUUID();
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});
app.set('trust proxy', 1);
app.use(
  '/api',
  rateLimit({ name: 'global', capacity: 300, refillRate: 5, keyBy: 'ip' })
);

// ============================================================
// Routes
// ============================================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'worklabs-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/version', (req: Request, res: Response) => {
  res.json({ version: '0.1.0', name: '@worklabs/api', node: process.version });
});

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api', milestonesRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/connect', connectRouter);
app.use('/api', messagesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api', reviewsRouter);
app.use('/api/admin', adminRouter);

// ============================================================
// Error handler (must be last)
// ============================================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Only capture unexpected errors — skip HttpError (intentional)
  if (!(err instanceof HttpError)) {
    Sentry.captureException(err, {
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      tags: { req_id: (req as any).id },
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  logger.error({ err, req_id: (req as any).id }, 'unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/dev/crash', () => {
    throw new Error('Test Sentry error');
  });
}

app.listen(PORT, () => {
  logger.info(`[api] running at http://localhost:${PORT}`);
});

// Start background workers (in production, this would be a separate process)
startEmailWorker();