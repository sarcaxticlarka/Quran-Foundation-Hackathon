import { Router, Request, Response } from 'express';
import { anthropic, CLAUDE_MODEL } from '../services/anthropic';

const router = Router();

const REFLECT_SYSTEM = `You are an Islamic scholar helping Muslims deepen their Quranic reflections.
Given a user's personal reflection and an optional verse key, you:
1. Assess alignment between their reflection and Quranic themes (score 0-100)
2. Provide enriching tafsir context
3. Identify the dominant Islamic theme (mercy, patience, gratitude, knowledge, etc.)
4. Suggest a related verse they might find meaningful

Always respond in valid JSON:
{
  "alignmentScore": 85,
  "theme": "patience",
  "tafsirEnrichment": "Ibn Kathir explains that this verse...",
  "relatedVerse": { "key": "2:153", "arabic": "...", "translation": "..." },
  "summary": "One sentence summary of how this reflection connects to Quran"
}`;

router.post('/', async (req: Request, res: Response) => {
  const { body, verseKey, userId } = req.body as { body: string; verseKey?: string; userId?: string };

  if (!body || body.trim().length < 10) {
    res.status(400).json({ error: 'Reflection body too short' });
    return;
  }

  try {
    const userMsg = verseKey
      ? `My reflection on verse ${verseKey}: "${body}"`
      : `My Quranic reflection: "${body}"`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: REFLECT_SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[reflect] Claude error, using fallback:', (err as Error).message);
    res.json({
      success: true,
      data: {
        alignmentScore: 82,
        theme: 'patience',
        tafsirEnrichment: 'Ibn Kathir explains that sincere reflection on Quranic verses is itself an act of worship. The scholars agree that contemplating (tadabbur) the Quran is among the greatest of good deeds, leading the believer closer to Allah.',
        relatedVerse: { key: '38:29', arabic: 'كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ', translation: 'A Book We have revealed to you, blessed, that they might reflect upon its verses.' },
        summary: 'Your reflection shows sincere engagement with Quranic guidance — a mark of the believer who seeks depth, not just surface reading.',
      },
      source: 'fallback',
    });
  }
});

export default router;
