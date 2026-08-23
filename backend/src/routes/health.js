import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'MediPredict API', timestamp: new Date().toISOString() });
});
