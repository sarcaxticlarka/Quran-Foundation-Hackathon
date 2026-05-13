import { Router } from 'express';
import axios from 'axios';

const router = Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';

router.post('/chat/completions', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 30000,
      },
    );
    res.json(response.data);
  } catch (err: any) {
    const status = err.response?.status ?? 500;
    res.status(status).json(err.response?.data ?? { error: 'AI request failed' });
  }
});

export default router;
