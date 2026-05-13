import { Router, Request, Response } from 'express';
import { anthropic, CLAUDE_MODEL } from '../services/anthropic';

const router = Router();

const NUDGE_SYSTEM = `You are a mindful Islamic reminder generator.
Given a time of day and optional user context, generate a short, uplifting Quranic nudge.

Always respond in valid JSON:
{
  "title": "Morning Reminder",
  "body": "Begin your day with gratitude — Allah loves those who are thankful.",
  "verse": { "key": "14:7", "translation": "If you are grateful, I will surely increase you..." },
  "timeOfDay": "morning"
}`;

router.post('/generate', async (req: Request, res: Response) => {
  const { timeOfDay, userMood, userId } = req.body as {
    timeOfDay: string;
    userMood?: string;
    userId?: string;
  };

  if (!timeOfDay) {
    res.status(400).json({ error: 'timeOfDay is required' });
    return;
  }

  try {
    const context = userMood ? ` The user is feeling ${userMood}.` : '';
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: NUDGE_SYSTEM,
      messages: [{
        role: 'user',
        content: `Generate a ${timeOfDay} Islamic nudge notification.${context}`,
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[nudge] Claude error, using fallback:', (err as Error).message);
    const FALLBACK_NUDGES: Record<string, object> = {
      fajr:      { title: 'Morning Blessing', body: 'Begin your day with bismillah. Every action done in Allah\'s name becomes an act of worship.', verse: { key: '2:152', translation: 'Remember Me, and I will remember you.' }, timeOfDay: 'fajr' },
      midday:    { title: 'Midday Reminder', body: 'Pause your work and reconnect. The Quran awaits — even five minutes of reflection transforms the heart.', verse: { key: '2:153', translation: 'O believers, seek help through patience and prayer.' }, timeOfDay: 'midday' },
      afternoon: { title: 'Afternoon Pause', body: 'Your soul needs nourishment. One verse of the Quran read with understanding is better than a thousand words of the world.', verse: { key: '39:23', translation: 'Allah has sent down the best statement: a consistent Book.' }, timeOfDay: 'afternoon' },
      maghrib:   { title: 'Gratitude at Dusk', body: 'Close this day with gratitude. Count three blessings — your heart will soften, your faith will strengthen.', verse: { key: '14:7', translation: 'If you are grateful, I will surely increase you in favor.' }, timeOfDay: 'maghrib' },
      isha:      { title: 'Night Contemplation', body: 'The night is for the sincere — those who remember Allah when others sleep. Let the Quran be your companion.', verse: { key: '73:4', translation: 'And recite the Quran with measured recitation.' }, timeOfDay: 'isha' },
    };
    const fallback = FALLBACK_NUDGES[timeOfDay] ?? FALLBACK_NUDGES.isha;
    res.json({ success: true, data: fallback, source: 'fallback' });
  }
});

export default router;
