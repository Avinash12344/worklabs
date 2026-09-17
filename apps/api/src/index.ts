import 'dotenv/config';
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

app.use(express.json({ limit: '1mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
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

// ============================================================
// Error handler (must be last)
// ============================================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`[api] running at http://localhost:${PORT}`);
});

// Start background workers (in production, this would be a separate process)
startEmailWorker();