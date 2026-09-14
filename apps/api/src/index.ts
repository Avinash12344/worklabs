import cors from "cors";
import express, {Request, Response, NextFunction} from "express";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
    cors({
        origin: ['http://localhost:3000'],
        credentials: true
    })
)

app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });

  next();
});

app.get("/api/health", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        service: "worklabs-api-v2",
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/version", (req: Request, res: Response) => {
    res.json({
        version: "0.1.0",
        name: "@worklabs/api",
        node: process.version
    });
});

app.get('/api/crash', (req: Request, res: Response) => {
  throw new Error('Intentional crash for testing');
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[error]', err.message);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

app.listen(PORT, () => {
    console.log(`[api] running at https://localhost:${PORT}`);
})