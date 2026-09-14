import { aiAdminRouter } from './routes/aiAdmin.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat.js';
import { healthRouter } from './routes/health.js';
import { assessmentRouter } from './routes/assessment.js';
import { authRouter } from './routes/auth.js';
import { doctorsRouter } from './routes/doctors.js';
import { assessmentsRouter } from './routes/assessments.js';
import { consultationsRouter } from './routes/consultations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175'
    ],
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/health-assessment', assessmentRouter);
app.use('/api/auth', authRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/admin/ai', aiAdminRouter);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[MediPredict]', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🏥  MediPredict API running on http://localhost:${PORT}\n`);
});