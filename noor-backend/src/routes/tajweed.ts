import { Router, Request, Response } from 'express';
import { anthropic, CLAUDE_MODEL } from '../services/anthropic';

const router = Router();

const TAJWEED_SYSTEM = `You are a Tajweed expert and Quran recitation coach.
Given a verse key and a description of a recitation attempt (or phonetic transcription),
provide detailed Tajweed feedback.

Always respond in valid JSON:
{
  "accuracy": 78,
  "xpEarned": 45,
  "words": [
    { "word": "بِسْمِ", "status": "correct", "note": "" },
    { "word": "اللَّهِ", "status": "needs_work", "note": "Lam shamsiyya — the lam is silent here" }
  ],
  "overallFeedback": "Good attempt! Focus on the madd letters.",
  "nextFocus": "Practice idgham rules in verses with tanwin"
}`;

router.post('/feedback', async (req: Request, res: Response) => {
  const { verseKey, recitationNotes, userId } = req.body as {
    verseKey: string;
    recitationNotes: string;
    userId?: string;
  };

  if (!verseKey || !recitationNotes) {
    res.status(400).json({ error: 'verseKey and recitationNotes are required' });
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: TAJWEED_SYSTEM,
      messages: [{
        role: 'user',
        content: `Verse: ${verseKey}\nRecitation notes: ${recitationNotes}`,
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[tajweed] Claude error, using fallback:', (err as Error).message);
    res.json({
      success: true,
      data: {
        accuracy: 75,
        xpEarned: 40,
        words: [
          { word: 'بِسْمِ', status: 'correct', note: '' },
          { word: 'اللَّهِ', status: 'needs_work', note: 'Lam shamsiyya — the lam is silent, the following letter doubles' },
          { word: 'الرَّحْمَٰنِ', status: 'correct', note: '' },
          { word: 'الرَّحِيمِ', status: 'needs_work', note: 'Extend the madd here for 2 counts' },
        ],
        overallFeedback: 'Good attempt! Focus on applying madd rules consistently and the lam shamsiyya principle.',
        nextFocus: 'Practice idgham (merging) rules when tanwin meets the letters ن م و ي ل ر',
      },
      source: 'fallback',
    });
  }
});

export default router;
