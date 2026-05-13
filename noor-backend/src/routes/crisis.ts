import { Router, Request, Response } from 'express';
import { anthropic, CLAUDE_MODEL } from '../services/anthropic';

const router = Router();

const QURAN_SYSTEM = `You are a compassionate Islamic spiritual guide with deep knowledge of the Quran and Hadith.
When someone is in emotional distress, you respond with:
1. A relevant Quranic verse (with surah name, number:ayah)
2. Brief tafsir (Ibn Kathir or classical scholar)
3. A relevant Hadith for comfort
4. A dhikr phrase for grounding

CRITICAL: Only cite verified Quranic verses. If you cannot verify a verse, use 2:286 as default.
Do NOT hallucinate verse numbers or text.

Always respond in valid JSON matching this exact shape:
{
  "verse": { "key": "2:286", "arabic": "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", "translation": "...", "surah": "Al-Baqarah" },
  "tafsir": "Brief scholarly commentary...",
  "hadith": { "text": "...", "source": "Sahih Bukhari" },
  "dhikr": { "phrase": "SubhanAllah", "arabic": "سبحان الله", "meaning": "Glory be to Allah", "count": 33 }
}`;

const FALLBACK_BY_MOOD: Record<string, object> = {
  overwhelmed: {
    verse: { key: '2:286', arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.', surah: 'Al-Baqarah' },
    tafsir: 'Ibn Kathir explains: This verse is a source of immense mercy from Allah. He, in His infinite wisdom and justice, only tests each person with what they are truly capable of enduring. The key is trusting in Allah\'s perfect knowledge of your limits.',
    hadith: { text: 'The greatest reward comes with the greatest trial. When Allah loves a people He tests them.', source: 'Tirmidhi 2396' },
    dhikr: { phrase: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Glory be to Allah', count: 33 },
  },
  anxious: {
    verse: { key: '13:28', arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest.', surah: 'Ar-Ra\'d' },
    tafsir: 'Al-Tabari explains: The heart\'s tranquility (tuma\'ninah) is only achieved through dhikr — constant, sincere remembrance of Allah. Anxiety is the absence of this connection to the Divine.',
    hadith: { text: 'Recite: Allaahumma inni abduka... (O Allah, I am Your servant). There is no worry for which this du\'aa does not bring relief.', source: 'Ahmad 3704' },
    dhikr: { phrase: 'La ilaha illallah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', meaning: 'There is no god but Allah', count: 100 },
  },
  sad: {
    verse: { key: '94:5', arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship will be ease.', surah: 'Ash-Sharh' },
    tafsir: 'Ibn Kathir notes: The Arabic uses "ma\'a" (with, simultaneously) not "ba\'da" (after) — ease accompanies hardship right now, not merely after it ends. This is Allah\'s eternal promise.',
    hadith: { text: 'How wonderful is the affair of the believer, for his affairs are all good. If something good happens to him, he gives thanks, and that is good for him. If something bad happens to him, he bears it with patience, and that is good for him.', source: 'Muslim 2999' },
    dhikr: { phrase: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'All praise is due to Allah', count: 33 },
  },
  lonely: {
    verse: { key: '2:186', arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ', translation: 'And when My servants ask you about Me — indeed I am near.', surah: 'Al-Baqarah' },
    tafsir: 'Al-Qurtubi explains: Allah\'s nearness here is spiritual proximity — He hears every du\'aa, knows every thought, and is closer to you than your own jugular vein (50:16). You are never truly alone.',
    hadith: { text: 'Allah says: I am as My servant thinks I am. I am with him when he makes mention of Me. If he makes mention of Me to himself, I make mention of him to Myself.', source: 'Bukhari 7405' },
    dhikr: { phrase: 'Ya Qarib', arabic: 'يَا قَرِيبُ', meaning: 'O The Near One', count: 33 },
  },
  grateful: {
    verse: { key: '14:7', arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', translation: 'If you are grateful, I will surely increase you in favor.', surah: 'Ibrahim' },
    tafsir: 'Ibn Kathir explains: This is a direct covenant from Allah — gratitude (shukr) is the key that unlocks more blessings. The more genuinely thankful you are, the more Allah increases you in every dimension.',
    hadith: { text: 'He who does not thank people does not thank Allah.', source: 'Abu Dawud 4811' },
    dhikr: { phrase: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'All praise is due to Allah', count: 33 },
  },
};

router.post('/', async (req: Request, res: Response) => {
  const { mood, text, userId } = req.body as { mood: string; text?: string; userId?: string };

  if (!mood) {
    res.status(400).json({ error: 'mood is required' });
    return;
  }

  try {
    const userMsg = text
      ? `I am feeling ${mood}. ${text}`
      : `I am feeling ${mood} right now and need spiritual comfort from the Quran.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: QURAN_SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[crisis] Claude error, using fallback:', (err as Error).message);
    const fallback = FALLBACK_BY_MOOD[mood] ?? FALLBACK_BY_MOOD.overwhelmed;
    res.json({ success: true, data: fallback, source: 'fallback' });
  }
});

export default router;
