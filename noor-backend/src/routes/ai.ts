import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/chat/completions', async (req, res) => {
  try {
    const groqApiKey = process.env.GROQ_API_KEY?.trim();
    if (!groqApiKey) {
      return res.status(503).json({ error: 'GROQ_API_KEY is not configured on the backend.' });
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        timeout: 30000,
      },
    );
    res.json(response.data);
  } catch (err: any) {
    const status = err.response?.status ?? 500;
    const detail = err.response?.data ?? { error: 'AI request failed' };
    if (status === 401) {
      return res.status(401).json({ error: 'Groq rejected the backend API key.', detail });
    }
    res.status(status).json(detail);
  }
});

export default router;
