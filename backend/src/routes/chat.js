import { Router } from 'express';
import { buildAIResponse } from '../services/aiService.js';

export const chatRouter = Router();

/**
 * POST /api/chat
 * Body: { messages: [{role, content}], context?: string }
 */
chatRouter.post('/', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const reply = await buildAIResponse(messages, context);
    return res.json({ reply });
  } catch (err) {
    console.error('[chat route]', err);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
});
