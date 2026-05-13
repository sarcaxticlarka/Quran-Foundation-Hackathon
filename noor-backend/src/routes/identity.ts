import { Router, Request, Response } from 'express';
import { anthropic, CLAUDE_MODEL } from '../services/anthropic';

const router = Router();

const IDENTITY_SYSTEM = `You are an Islamic scholar who analyzes a Muslim's Quranic engagement patterns.
Given a list of bookmarked verse keys and reflection themes, determine their dominant Quranic identity.

Always respond in valid JSON:
{
  "primary": { "id": "mercy", "label": "Seeker of Mercy", "arabic": "طالب الرحمة", "pct": 38 },
  "all": [
    { "id": "mercy", "label": "Seeker of Mercy", "arabic": "طالب الرحمة", "pct": 38 },
    { "id": "knowledge", "label": "Student of Knowledge", "arabic": "طالب العلم", "pct": 27 },
    { "id": "patience", "label": "Companion of Patience", "arabic": "صاحب الصبر", "pct": 22 },
    { "id": "gratitude", "label": "Heart of Gratitude", "arabic": "قلب الشكر", "pct": 13 }
  ],
  "insight": "One sentence about this person's spiritual journey based on their engagement."
}`;

router.post('/calculate', async (req: Request, res: Response) => {
  const { verseKeys, themes, userId } = req.body as {
    verseKeys: string[];
    themes?: string[];
    userId?: string;
  };

  if (!verseKeys || verseKeys.length === 0) {
    res.status(400).json({ error: 'verseKeys array is required' });
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: IDENTITY_SYSTEM,
      messages: [{
        role: 'user',
        content: `Verse keys engaged with: ${verseKeys.join(', ')}\n${themes ? `Themes: ${themes.join(', ')}` : ''}`,
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[identity] Claude error, using fallback:', (err as Error).message);
    res.json({
      success: true,
      data: {
        primary: { id: 'mercy', label: 'Seeker of Mercy', arabic: 'طالب الرحمة', pct: 38 },
        all: [
          { id: 'mercy',     label: 'Seeker of Mercy',        arabic: 'طالب الرحمة',   pct: 38 },
          { id: 'knowledge', label: 'Student of Knowledge',   arabic: 'طالب العلم',    pct: 27 },
          { id: 'patience',  label: 'Companion of Patience',  arabic: 'صاحب الصبر',   pct: 22 },
          { id: 'gratitude', label: 'Heart of Gratitude',     arabic: 'قلب الشكر',    pct: 13 },
        ],
        insight: 'Your Quranic journey is marked by a deep pursuit of divine mercy — you are drawn to verses of forgiveness, compassion, and the infinite rahma of Allah.',
      },
      source: 'fallback',
    });
  }
});

export default router;
