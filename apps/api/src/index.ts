import express, {Request, Response} from "express";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.get("/api/health", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        service: "worklabs-api-v2",
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`[api] running at https://localhost:${PORT}`);
})