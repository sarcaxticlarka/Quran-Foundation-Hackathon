import axios from 'axios';
import { BACKEND_URL, BACKEND_API_KEY } from '../utils/constants';

const MODEL = 'llama-3.3-70b-versatile';

const groqClient = axios.create({
  baseURL: `${BACKEND_URL}/api/ai`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': BACKEND_API_KEY,
  },
});

// User personalization context — set once on login, used in every prompt
let _userContext: {
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  madhab: string;
  name: string;
  currentPrayer?: string;
} = { readingLevel: 'intermediate', madhab: '', name: '' };

function personalizationSuffix(): string {
  const level = _userContext.readingLevel;
  const madhab = _userContext.madhab;

  const levelNote =
    level === 'beginner'
      ? 'The user is a beginner — use simple English, avoid Arabic jargon, explain Islamic terms when used.'
      : level === 'advanced'
      ? 'The user is an advanced student — you may reference classical scholars, use Arabic terms freely, and go deeper into nuance.'
      : 'The user has intermediate knowledge — balance accessibility with depth.';

  const madhabNote = madhab
    ? `The user follows the ${madhab} madhab — where relevant, preference rulings and opinions from that school of thought.`
    : '';

  const prayerNote = _userContext.currentPrayer
    ? `The user is currently in the time period of ${_userContext.currentPrayer} — where fitting, connect content to this time of day.`
    : '';

  return [levelNote, madhabNote, prayerNote].filter(Boolean).join(' ');
}

async function chat(systemPrompt: string, userMessage: string, maxTokens = 400): Promise<string> {
  const { data } = await groqClient.post('/chat/completions', {
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });
  return data.choices[0].message.content.trim();
}

export const groqAI = {
  configure(ctx: { readingLevel?: 'beginner' | 'intermediate' | 'advanced'; madhab?: string; name?: string; currentPrayer?: string }) {
    _userContext = {
      readingLevel: ctx.readingLevel ?? 'intermediate',
      madhab: ctx.madhab ?? '',
      name: ctx.name ?? '',
      currentPrayer: ctx.currentPrayer,
    };
  },

  async getTafsirSummary(verseKey: string, arabicText: string, translation: string): Promise<string> {
    const system = `You are a knowledgeable Islamic scholar specializing in Quranic exegesis (tafsir).
Provide brief, accessible tafsir insights for Muslims. Draw from classical scholars like Ibn Kathir, Al-Tabari, and Al-Qurtubi.
Keep responses under 120 words. Be reverent, accurate, and spiritually enriching.
${personalizationSuffix()}`;

    const user = `Verse ${verseKey}: "${arabicText}"
Translation: "${translation}"

Provide a brief tafsir insight for this verse.`;

    return chat(system, user, 200);
  },

  async checkReflectionAlignment(
    verseKey: string,
    verseText: string,
    reflectionText: string,
  ): Promise<{ aligned: boolean; feedback: string }> {
    const system = `You are an Islamic scholar reviewing Quranic reflections for theological accuracy.
Assess whether the user's reflection aligns with classical Quranic tafsir.
Respond in JSON: { "aligned": boolean, "feedback": "brief explanation under 100 words" }
Be encouraging while noting if any correction is needed.`;

    const user = `Verse ${verseKey}: "${verseText}"
User reflection: "${reflectionText}"

Is this reflection theologically aligned?`;

    try {
      const raw = await chat(system, user, 250);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { aligned: true, feedback: raw };
    } catch (err) {
      console.warn('Groq AI checkReflectionAlignment failed:', err);
      return { aligned: true, feedback: "Reflection saved. (AI alignment check temporarily unavailable)" };
    }
  },

  async getDailyVerseContext(arabicText: string, translation: string): Promise<string> {
    const system = `You are a Muslim spiritual guide. Given a Quranic verse, provide a single sentence of spiritual wisdom for the day.
Keep it under 40 words. Be warm, practical, and grounded in Islamic tradition.`;

    const user = `Today's verse: "${translation}"`;

    return chat(system, user, 80);
  },

  async getTajweedGuide(
    verseKey: string,
    arabicText: string,
    translation: string,
  ): Promise<{
    rules: { word: string; transliteration: string; rule: string; tip: string }[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    overallTip: string;
  }> {
    const system = `You are a Tajweed teacher. Given a Quranic verse, identify the key tajweed rules a student should focus on BEFORE practicing recitation.
Return ONLY valid JSON:
{
  "rules": [
    { "word": "Arabic word", "transliteration": "romanized", "rule": "rule name e.g. Madd Tabii", "tip": "1-sentence explanation of how to apply this rule" }
  ],
  "difficulty": "Easy" | "Medium" | "Hard",
  "overallTip": "One actionable tip for reciting this verse correctly, under 60 words"
}
Include only words that have an active tajweed rule. Max 6 entries.
${personalizationSuffix()}`;

    const user = `Verse ${verseKey}: "${arabicText}"\nTranslation: "${translation}"`;
    try {
      const raw = await chat(system, user, 500);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getTajweedGuide failed:', err);
    }
    return { rules: [], difficulty: 'Medium', overallTip: 'Recite slowly and clearly, paying attention to each letter.' };
  },

  async getHalaqaQuestion(surahGoal: string): Promise<string> {
    const system = `You are an Islamic study circle facilitator. Generate a single meaningful discussion question for a Halaqa (Islamic study circle) studying ${surahGoal}.
The question should be thought-provoking, grounded in the Quran, and applicable to daily life. Under 50 words. Return only the question, no preamble.`;
    const user = `Generate today's discussion question for a halaqa studying: ${surahGoal}`;
    return chat(system, user, 100);
  },

  async getTajweedAnalysis(
    verseKey: string,
    arabicText: string,
    translation: string,
  ): Promise<{
    words: { arabic: string; transliteration: string; rule: string; status: 'correct' | 'warning' | 'error' }[];
    mainTip: string;
    score: number;
  }> {
    const system = `You are a Tajweed expert. Analyze a Quranic verse and return structured feedback for a student practicing recitation.
Return ONLY valid JSON in this exact format:
{
  "words": [
    { "arabic": "word", "transliteration": "transliteration", "rule": "tajweed rule name or 'No special rule'", "status": "correct" | "warning" | "error" }
  ],
  "mainTip": "One specific tajweed tip for the most important rule in this verse (under 80 words)",
  "score": 78
}
- Mark words with active tajweed rules (madd, ghunna, idgham, ikhfa, qalqala, etc.) as "warning" to highlight them for practice
- Mark technically easy words as "correct"
- Keep "error" for rare/very difficult cases
- The score should reflect verse difficulty (easier = higher baseline, 65–95 range)`;

    const user = `Verse ${verseKey}: "${arabicText}"
Translation: "${translation}"`;

    try {
      const raw = await chat(system, user, 600);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.warn('Groq AI getTajweedAnalysis failed:', err);
    }
    return {
      words: arabicText.split(' ').slice(0, 6).map((w) => ({
        arabic: w, transliteration: '', rule: '', status: 'correct' as const,
      })),
      mainTip: 'Practice each word slowly, paying attention to vowel lengths.',
      score: 80,
    };
  },

  async getDailyIslamicInsight(dateStr: string, dominantTheme?: string): Promise<{
    title: string;
    category: 'history' | 'sunnah' | 'dua' | 'wisdom';
    body: string;
    arabicText: string | null;
    source: string | null;
    verseKey: string | null;
  }> {
    const system = `You are an Islamic scholar and historian. For a given Gregorian date, provide ONE meaningful piece of Islamic content personalized to that day.

Choose from:
1. A significant event in Islamic history on or near this date (battles, births of scholars, migrations, revelations, Hijri calendar events)
2. A recommended sunnah practice relevant to this season or day of the week
3. A fitting dua or remembrance for this time of year
4. An uplifting piece of Islamic wisdom or hadith appropriate for today

Respond ONLY with valid JSON (no markdown):
{
  "title": "Short title under 8 words",
  "category": "history" | "sunnah" | "dua" | "wisdom",
  "body": "2-3 sentences — accurate, engaging, and spiritually valuable",
  "arabicText": "Arabic text if this is a dua or hadith — else null",
  "source": "Citation e.g. Bukhari 3234 or Ibn Kathir — else null",
  "verseKey": "e.g. 8:17 if a specific verse is directly relevant — else null"
}`;

    const day = new Date(dateStr);
    const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const themeHint = dominantTheme
      ? ` Where naturally fitting, lean toward content related to the theme of ${dominantTheme}.`
      : '';

    try {
      const raw = await chat(system, `Today is ${dayName}, ${monthDay}. What is significant in Islam for this day?${themeHint}`, 400);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getDailyIslamicInsight failed:', err);
    }
    return {
      title: 'Daily Reflection',
      category: 'wisdom',
      body: 'Every day is a gift from Allah. Begin it with gratitude, end it with istighfar.',
      arabicText: null,
      source: null,
      verseKey: null,
    };
  },

  async getNudgeInsight(
    mood: string,
    verseKey: string,
    arabicText: string,
    translation: string,
  ): Promise<string> {
    const system = `You are an Islamic spiritual counselor. Connect a Quranic verse to a specific time of day context.
Be concise (under 80 words), grounded in classical tafsir, and practically helpful.
${personalizationSuffix()}`;

    const user = `Time context: "${mood}"
Verse ${verseKey}: "${translation}"

How does this verse speak to this moment of the day?`;

    return chat(system, user, 150);
  },

  async getQuranicIdentity(verseEntries: { verseKey: string; translation: string; repetitions?: number }[]): Promise<{
    dominantTheme: string;
    arabicName: string;
    badgeLabel: string;
    colorKey: 'teal' | 'gold' | 'coral';
    themes: { name: string; arabic: string; pct: number; colorKey: 'teal' | 'gold' | 'coral' }[];
    narrative: string;
    hadith: string;
  }> {
    const system = `You are an Islamic scholar and spiritual analyst. A Muslim has shared the Quranic verses they engage with most — through saving, reflection, and review. Analyze their pattern to reveal their Quranic identity.

Your job:
1. Identify the dominant Quranic themes from their verses (e.g. Mercy/Rahmah, Knowledge/Ilm, Patience/Sabr, Gratitude/Shukr, Trust/Tawakkul, Hope/Amal, Worship/Ibadah, Justice/Adl, Remembrance/Dhikr, Guidance/Hidayah)
2. Calculate percentage breakdown across the top 3-4 themes (must sum to 100)
3. Derive a meaningful Quranic identity badge for the dominant theme
4. Write a 2-sentence personalized narrative that feels like spiritual insight, not generic text
5. Give one authentic hadith that connects to their dominant theme

Respond ONLY with valid JSON:
{
  "dominantTheme": "Mercy",
  "arabicName": "طالب الرحمة",
  "badgeLabel": "Seeker of Mercy",
  "colorKey": "teal",
  "themes": [
    { "name": "Mercy", "arabic": "الرحمة", "pct": 42, "colorKey": "teal" },
    { "name": "Knowledge", "arabic": "العلم", "pct": 31, "colorKey": "gold" },
    { "name": "Patience", "arabic": "الصبر", "pct": 27, "colorKey": "coral" }
  ],
  "narrative": "Your heart is drawn to verses of divine mercy — you return to them when you need reassurance that Allah's compassion is wider than any hardship. This pattern reveals a soul that heals through the Names of Allah.",
  "hadith": "The Prophet ﷺ said: 'Allah has one hundred parts of mercy, of which He sent down one between the jinn, humans, animals and insects.' — Muslim 2752"
}

colorKey rules: mercy/hope/worship/remembrance → "teal", knowledge/wisdom/guidance → "gold", patience/justice/trust → "coral"
Percentages must sum to exactly 100. Maximum 4 themes.`;

    const verseList = verseEntries
      .map((v) => `${v.verseKey}: "${v.translation.slice(0, 120)}"${v.repetitions && v.repetitions > 1 ? ` (reviewed ${v.repetitions}x)` : ''}`)
      .join('\n');

    try {
      const raw = await chat(system, `Verses this user engages with:\n${verseList}`, 700);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getQuranicIdentity failed:', err);
    }

    return {
      dominantTheme: 'Mercy',
      arabicName: 'طالب الرحمة',
      badgeLabel: 'Seeker of Mercy',
      colorKey: 'teal',
      themes: [
        { name: 'Mercy', arabic: 'الرحمة', pct: 40, colorKey: 'teal' },
        { name: 'Knowledge', arabic: 'العلم', pct: 35, colorKey: 'gold' },
        { name: 'Patience', arabic: 'الصبر', pct: 25, colorKey: 'coral' },
      ],
      narrative: 'Your Quranic journey reflects a heart open to divine guidance and mercy. Keep engaging with the words of Allah — each verse you revisit deepens your connection.',
      hadith: 'The Prophet ﷺ said: "The best of you are those who learn the Quran and teach it." — Bukhari 5027',
    };
  },

  async getWeeklyInsight(
    surahGoal: string,
    focusVerse: string,
    memberCount: number,
  ): Promise<{
    tafsirNote: string;
    discussionPrompt: string;
    hadith: string;
    actionItem: string;
  }> {
    const system = `You are an Islamic scholar generating a weekly group insight for a Halaqa (study circle) of ${memberCount} people studying "${surahGoal}".
Return ONLY valid JSON:
{ "tafsirNote": "2-3 sentence scholarly note on the verse from classical tafsir (under 80 words)", "discussionPrompt": "One thought-provoking discussion question for the circle (under 40 words)", "hadith": "A relevant hadith with narrator attribution (under 60 words)", "actionItem": "One concrete spiritual action for the week (under 30 words)" }`;
    const user = `Focus verse: "${focusVerse}". Generate the weekly group insight.`;
    try {
      const raw = await chat(system, user, 600);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getWeeklyInsight failed:', err);
    }
    return {
      tafsirNote: 'Reflect deeply on this verse and its wisdom.',
      discussionPrompt: 'How does this verse apply to your life today?',
      hadith: 'The best of you are those who learn the Quran and teach it. (Bukhari)',
      actionItem: 'Read this verse every morning this week before Fajr.',
    };
  },

  async getStreakPersonality(streakDays: number, dominantTheme: string): Promise<{ title: string; insight: string }> {
    const system = `You are an Islamic spiritual guide writing a short, personal message for a Muslim who has been consistent with their Quran reading.
Return ONLY valid JSON: { "title": "a 3-5 word title (e.g. 'The Steadfast Heart')", "insight": "1-2 warm sentences connecting their streak to an Islamic virtue or concept — under 50 words" }
Be specific to the streak length and theme. Avoid generic praise.`;

    try {
      const raw = await chat(system, `The user has a ${streakDays}-day streak. Their dominant Quranic theme is "${dominantTheme}". Write a personalized consistency insight.`, 150);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getStreakPersonality failed:', err);
    }
    return {
      title: 'The Consistent One',
      insight: `${streakDays} days of remembrance — your heart is training itself to turn to Allah naturally.`,
    };
  },

  async getPersonalizedReflectionPrompt(
    savedVerseKeys: string[],
    savedTranslations: string[],
  ): Promise<{ prompt: string; suggestedVerseKey: string | null }> {
    const system = `You are an Islamic spiritual journaling coach. Based on the Quranic verses a user has saved, generate ONE personalized reflection prompt that:
- Connects deeply to a theme found across their verses
- Is open-ended and introspective (not yes/no)
- Invites the user to relate the Quran to their personal life
- Is under 40 words
- Feels warm and personal, not generic

Also suggest the single verse key (e.g. "2:286") from their list that best matches the prompt.
Return ONLY valid JSON: { "prompt": "...", "suggestedVerseKey": "2:286" or null }
${personalizationSuffix()}`;

    const verseList = savedVerseKeys
      .slice(0, 10)
      .map((k, i) => `${k}: "${savedTranslations[i]?.slice(0, 80) ?? ''}"`)
      .join('\n');

    try {
      const raw = await chat(system, `My saved verses:\n${verseList}`, 200);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getPersonalizedReflectionPrompt failed:', err);
    }
    return { prompt: 'What does this verse mean for how you live your day?', suggestedVerseKey: savedVerseKeys[0] ?? null };
  },

  async getRootWordDetail(root: string): Promise<{
    arabic: string;
    transliteration: string;
    rootMeaning: string;
    grammaticalForm: string;
    occurrences: number;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
    relatedVerses: Array<{ key: string; arabic: string; translation: string; surah: string }>;
    relatedRoots: string[];
  }> {
    const system = `You are an Arabic linguist and Quranic scholar specializing in root morphology.
Given an Arabic root, return detailed linguistic and Quranic information.
${personalizationSuffix()}
Return ONLY valid JSON in this exact format:
{
  "arabic": "most common derived word form (e.g. رَحِيم)",
  "transliteration": "romanized form (e.g. Raheem)",
  "rootMeaning": "Core semantic meaning of the root in Quranic context, 2 sentences",
  "grammaticalForm": "Explanation of the grammatical pattern and morphological form, 1-2 sentences",
  "occurrences": 114,
  "rarity": "Common" | "Uncommon" | "Rare" | "Legendary",
  "relatedVerses": [
    { "key": "1:3", "arabic": "exact Arabic text of the key word or phrase", "translation": "English translation of the verse or relevant portion", "surah": "Surah Name 1:3" }
  ],
  "relatedRoots": ["word (meaning)", "word (meaning)"]
}
Rules:
- relatedVerses: include 3 real, authentic Quranic verses where this root appears prominently
- relatedRoots: include 3 real Arabic derivatives from the same root with meanings
- occurrences: approximate count of root appearances across the Quran
- rarity: Common (>50 occurrences), Uncommon (20-50), Rare (5-20), Legendary (<5)
- Be 100% accurate — only use real Quranic verse references`;

    try {
      const raw = await chat(system, `Root: ${root}\nProvide full linguistic detail.`, 600);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getRootWordDetail failed:', err);
    }
    return {
      arabic: root,
      transliteration: root,
      rootMeaning: 'This root carries deep meaning in the Quran.',
      grammaticalForm: 'A core Arabic root with multiple derived forms.',
      occurrences: 0,
      rarity: 'Uncommon',
      relatedVerses: [],
      relatedRoots: [],
    };
  },

  async getNotificationMessage(
    type: 'streak' | 'review' | 'halaqa' | 'general',
    context: { streakDays?: number; dueCards?: number; halaqaName?: string; timeSlot?: string },
  ): Promise<{ title: string; body: string }> {
    const system = `You are writing a short, warm Islamic app push notification.
Be concise, spiritually motivating, and use simple language.
Return ONLY valid JSON: { "title": "under 8 words", "body": "under 20 words" }
Use gentle Islamic phrases naturally (not forced). Avoid generic phrases like "Don't forget".`;

    const contextStr = type === 'streak'
      ? `User has a ${context.streakDays ?? 0}-day streak that will break if they don't read today.`
      : type === 'review'
      ? `User has ${context.dueCards ?? 0} Quran verse flashcards due for review.`
      : type === 'halaqa'
      ? `User's halaqa circle "${context.halaqaName ?? 'study circle'}" is waiting for their participation today.`
      : `General spiritual reminder for ${context.timeSlot ?? 'the day'}.`;

    try {
      const raw = await chat(system, contextStr, 100);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch (err) {
      console.warn('Groq AI getNotificationMessage failed:', err);
    }
    return {
      title: type === 'streak' ? 'Keep your streak alive' : 'Your Quran awaits',
      body: type === 'streak' ? 'A few minutes of reading preserves your streak.' : 'Take a moment to connect with Allah.',
    };
  },
};

export default groqAI;
